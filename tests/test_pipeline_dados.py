"""Testes do pipeline de dados (D49, D50, D59, D61, D62, D63).

Rodar da raiz:  python3 -m unittest discover -s tests -v
Testes que dependem de brutos fora do git (data/raw/tse/grandes/) são pulados quando o arquivo não existe.
"""
import copy
import hashlib
import json
import tempfile
import unittest
from collections import Counter
from datetime import date
from pathlib import Path

from tools.dados.auditar_partido_2024 import confrontar
from tools.dados.pipeline import admissibilidade as adm
from tools.dados.pipeline import fontes as fx
from tools.dados.pipeline import votos
from tools.dados.pipeline.arredondamento import maiores_restos
from tools.dados.pipeline import completude, conjuntos
from tools.dados.pipeline.eleicoes import FILTROS, filtro_ordinaria
from tools.dados.validar_estatisticos import IDENTIDADES

REG = fx.carregar_registro()
ORD24 = filtro_ordinaria(2024)


def lista(it):
    return list(it)


def precisa(fonte_id):
    return unittest.skipUnless(fx.presente(REG[fonte_id]), f"bruto ausente: {REG[fonte_id]['arquivo']}")


class TestRegras(unittest.TestCase):
    def test_historico_regenerado_e_validado_entra_no_mundo_inicial(self):
        f = REG["tse_detalhe_apuracao_2024"]
        self.assertTrue(adm.admissivel(f["temporalidade"], f["proveniencia"], "mundo_inicial"))

    def test_sem_referencia_temporal_nao_entra(self):
        t = adm.temporalidade_por_data(None)
        for destino in adm.DESTINOS:
            self.assertFalse(adm.admissivel(t, "versao_posterior_validada", destino))

    def test_nenhuma_publicacao_comprovada_sem_data(self):
        for f in REG.values():
            if f["proveniencia"] == "publicacao_historica_comprovada":
                self.assertLessEqual(date.fromisoformat(f["data_publicacao"]), adm.CORTE, f["id"])

    def test_data_de_coleta_nao_altera_temporalidade(self):
        f = copy.deepcopy(REG["tse_detalhe_apuracao_2024"])
        linha = {"DT_ELEICAO": "06/10/2024", "CD_MUNICIPIO": "1", "CD_ELEICAO": "619"}
        antes = fx.classificar_parcela(f, linha)
        f["data_acesso"] = "2030-01-01T00:00:00Z"
        self.assertEqual(fx.classificar_parcela(f, linha), antes)

    def test_arredondamento_reprodutivel(self):
        pesos = {"c": 1, "a": 1, "b": 1}
        self.assertEqual(maiores_restos(10, pesos), {"a": 4, "b": 3, "c": 3})
        self.assertEqual(maiores_restos(10, pesos), maiores_restos(10, dict(reversed(list(pesos.items())))))
        r = maiores_restos(1_000_003, {"x": 0.1, "y": 0.2, "z": 0.7})
        self.assertEqual(sum(r.values()), 1_000_003)
        self.assertEqual(r, maiores_restos(1_000_003, {"z": 0.7, "y": 0.2, "x": 0.1}))


class TestIntegridade(unittest.TestCase):
    def test_brutos_no_git_conferem_com_o_registro(self):
        for f in REG.values():
            if "grandes/" not in f["arquivo"]:
                self.assertTrue(fx.verificar_integridade(f), f["id"])

    def test_arquivo_ausente_nao_e_validado(self):
        falsa = dict(REG["tse_detalhe_apuracao_2024"], id="falsa", arquivo="data/raw/nao_existe.zip")
        with self.assertRaises(fx.FonteAusente):
            fx.verificar_integridade(falsa)
        with self.assertRaises(fx.FonteAusente):
            lista(fx.Selecao(falsa, "calibracao"))

    def test_hash_divergente_bloqueia_leitura(self):
        with tempfile.TemporaryDirectory() as d:
            arq = Path(d) / "x.zip"
            arq.write_bytes(b"conteudo alterado")
            falsa = dict(REG["tse_detalhe_apuracao_2024"], arquivo="x.zip")
            with self.assertRaises(adm.FonteInadmissivel):
                fx.Selecao(falsa, "calibracao", raiz=d)
            falsa["sha256"] = hashlib.sha256(b"conteudo alterado").hexdigest()
            self.assertTrue(fx.verificar_integridade(falsa, d))


class TestSelecaoPorLinha(unittest.TestCase):
    def test_linhas_posteriores_ao_corte_bloqueadas_no_mundo_inicial(self):
        sel = fx.Selecao(REG["tse_detalhe_apuracao_2024"], "mundo_inicial")
        aceitas = lista(sel)
        self.assertTrue(all(fx._data_br(r["DT_ELEICAO"]) <= adm.CORTE for r in aceitas))
        self.assertGreater(sum(v for k, v in sel.recusadas.items() if k.startswith("posterior_ao_corte")), 0)
        self.assertEqual(sel.aceitas, len(aceitas))

    def test_mesmas_linhas_aceitas_na_calibracao(self):
        sel = fx.Selecao(REG["tse_detalhe_apuracao_2024"], "calibracao")
        lista(sel)
        self.assertEqual(sel.recusadas, Counter())

    def test_linhas_com_integridade_pendente_segregadas(self):
        f = REG["tse_votacao_partido_2024"]
        chaves = {(r["excluir"]["CD_ELEICAO"], r["excluir"]["NR_TURNO"], r["excluir"]["CD_MUNICIPIO"],
                   r["excluir"]["NR_ZONA"], r["excluir"]["DS_CARGO"]) for r in f["parcelas"] if "excluir" in r}
        for destino in adm.DESTINOS:
            sel = fx.Selecao(f, destino)
            for r in sel:
                k = (r["CD_ELEICAO"], r["NR_TURNO"], r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"], r["DS_CARGO"])
                self.assertNotIn(k, chaves)
            self.assertGreater(sel.segregadas["integridade_pendente"], 0)

    def test_coluna_pendente_bloqueada(self):
        f = REG["tse_perfil_eleitorado_2024"]
        with self.assertRaises(adm.FonteInadmissivel):
            fx.colunas_permitidas(f, ["QT_ELEITORES", "DS_GENERO"])
        fx.colunas_permitidas(f, ["CD_MUNICIPIO", "QT_ELEITORES"])

    def test_contagem_registrada_no_intermediario(self):
        c = conjuntos.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", "municipios_distintos", "ordinaria_2024")
        cont = c["meta"]["contagem"]
        self.assertGreater(cont["aceitas"], 0)
        self.assertGreater(cont["fora_do_filtro"], 0)
        self.assertEqual(len(c["dados"]), 5569)
        for campo in ("temporalidade", "proveniencia", "sha256", "arquivo"):
            self.assertEqual(c["meta"][campo], REG["tse_detalhe_apuracao_2024"][campo])
        self.assertEqual(conjuntos.entrada_mundo_inicial(c), c["dados"])

    def test_suplementar_de_2026_no_arquivo_de_2022_recusada_sem_filtro(self):
        sel = fx.Selecao(REG["tse_detalhe_apuracao_2022"], "mundo_inicial")
        for r in sel:
            self.assertNotEqual(r["CD_ELEICAO"], "6278")
        self.assertGreater(sum(v for k, v in sel.recusadas.items() if k.startswith("posterior_ao_corte")), 0)


class TestD61(unittest.TestCase):
    """Eleição ordinária (D61) e temporalidade (D63) são controles independentes."""

    def test_filtro_d61_usa_so_cd_eleicao(self):
        self.assertTrue(ORD24({"CD_ELEICAO": "619", "DT_ELEICAO": "01/01/2030"}))
        self.assertTrue(ORD24({"CD_ELEICAO": "620", "DT_ELEICAO": "27/10/2024"}))
        self.assertFalse(ORD24({"CD_ELEICAO": "6266", "DT_ELEICAO": "06/10/2024"}))
        self.assertEqual(set(FILTROS), {"ordinaria_2022", "ordinaria_2024"})

    def test_suplementar_anterior_ao_corte_passa_na_d63_mas_nao_na_d61(self):
        f = REG["tse_detalhe_apuracao_2024"]
        supl_antes, supl_depois = 0, 0
        for r in fx.linhas_csv(f):
            if ORD24(r):
                continue
            t, _ = fx.classificar_parcela(f, r)
            if t == "historico_compativel":
                supl_antes += 1
            else:
                supl_depois += 1
            self.assertFalse(ORD24(r))
        self.assertGreater(supl_antes, 0)
        self.assertGreater(supl_depois, 0)

    def test_suplementares_nao_contaminam_a_ordinaria(self):
        sel = fx.Selecao(REG["tse_detalhe_apuracao_2024"], "mundo_inicial", ORD24)
        cods = {r["CD_ELEICAO"] for r in sel}
        self.assertEqual(cods, {"619", "620"})
        self.assertGreater(sel.fora_do_filtro, 0)


class TestConteudo(unittest.TestCase):
    def test_identidades_d59_em_todas_as_linhas(self):
        for fid in ("tse_detalhe_apuracao_2022", "tse_detalhe_apuracao_2024", "tse_detalhe_apuracao_2026"):
            falhas = Counter()
            for r in fx.Selecao(REG[fid], "calibracao"):
                for nome, regra in IDENTIDADES.items():
                    falhas[nome] += not regra(r)
            self.assertEqual(+falhas, Counter(), fid)

    def test_tres_categorias_de_anulados_separadas(self):
        com_duas = 0
        for r in fx.Selecao(REG["tse_detalhe_apuracao_2024"], "calibracao"):
            p = votos.parcelas(r)
            self.assertEqual(set(p), set(votos.CAMPOS))
            com_duas += p["anulados"] > 0 and p["anuladosSubJudice"] > 0
        self.assertGreater(com_duas, 0)
        sintetica = {"DS_CARGO": "Prefeito", "ANO_ELEICAO": "2024", "QT_COMPARECIMENTO": "10",
                     "QT_TOTAL_VOTOS_VALIDOS": "6", "QT_VOTOS_BRANCOS": "1", "QT_TOTAL_VOTOS_NULOS": "1",
                     "QT_TOTAL_VOTOS_ANULADOS": "1", "QT_TOTAL_VOTOS_ANUL_SUBJUD": "1", "QT_VOTOS_ANULADOS_APU_SEP": ""}
        with self.assertRaises(KeyError):
            votos.parcelas(sintetica)
        sintetica["QT_VOTOS_ANULADOS_APU_SEP"] = "1"
        with self.assertRaises(votos.IdentidadeViolada):
            votos.parcelas(sintetica)


class TestExcecoes2024(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.iguais, cls.div = confrontar(REG)
        f = REG["tse_votacao_partido_2024"]
        cls.regras = [r["excluir"] for r in f["parcelas"] if "excluir" in r]

    def test_correspondencias_e_divergencias(self):
        self.assertEqual(len(self.iguais), 12455)
        self.assertEqual(len(self.div), 38)

    def test_regras_de_exclusao_igual_as_divergencias(self):
        regras = [tuple(sorted(r.items())) for r in self.regras]
        self.assertEqual(len(regras), len(set(regras)), "regra duplicada")
        esperadas = {tuple(sorted(x["chave"].items())) for x in self.div}
        self.assertEqual(set(regras), esperadas, "regra obsoleta ou exceção nova não registrada")


class TestSeparacaoDeFluxos(unittest.TestCase):
    def test_calibracao_nao_alimenta_o_mundo_inicial(self):
        with self.assertRaises(adm.FonteInadmissivel):
            conjuntos.entrada_mundo_inicial(conjuntos.intermediario("tse_detalhe_apuracao_2026", "calibracao", "municipios_distintos"))
        cal = conjuntos.intermediario("tse_detalhe_apuracao_2024", "calibracao", "municipios_distintos")
        with self.assertRaises(adm.FonteInadmissivel):
            conjuntos.entrada_mundo_inicial(cal)

    def test_2026_sem_linhas_no_mundo_inicial(self):
        c = conjuntos.intermediario("tse_detalhe_apuracao_2026", "mundo_inicial", "municipios_distintos")
        self.assertEqual(c["meta"]["contagem"]["aceitas"], 0)
        with self.assertRaises(adm.FonteInadmissivel):
            conjuntos.entrada_mundo_inicial(c)


class TestIntegridadeDoConjunto(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.reg = Path(cls.tmp.name) / "fontes.json"
        cls.reg.write_bytes(fx.REGISTRO.read_bytes())
        cls.base = conjuntos.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", "parcelas_d42_d62",
                                           "ordinaria_2024", registro=cls.reg)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def entrar(self, c):
        return conjuntos.entrada_mundo_inicial(c, registro=self.reg)

    def recusa(self, c, msg=""):
        with self.assertRaises(adm.FonteInadmissivel, msg=msg):
            self.entrar(c)

    def test_1_conjunto_valido_aceito(self):
        self.assertEqual(self.entrar(copy.deepcopy(self.base)), self.base["dados"])

    def test_2_um_valor_alterado_recusado(self):
        c = copy.deepcopy(self.base)
        k = next(iter(c["dados"]["unidades"]))
        c["dados"]["unidades"][k]["brancos"] += 1
        self.recusa(c)

    def test_3_conteudo_substituido_com_metadado_preservado_recusado(self):
        c = copy.deepcopy(self.base)
        c["dados"] = {"chave": "unidade|cargo|turno", "unidades": {}}
        self.recusa(c)
        c["meta"]["dados_sha256"] = conjuntos._sha(conjuntos.canonico(c["dados"]))
        self.recusa(c, "metadado recalculado à mão sem integridade")
        m = dict(c["meta"]); m.pop("integridade")
        c["meta"]["integridade"] = conjuntos._sha(conjuntos.canonico(m))
        self.recusa(c, "metadado e integridade recalculados: a reexecução da transformação recusa")

    def test_4_hash_do_registro_alterado_recusado(self):
        c = copy.deepcopy(self.base)
        c["meta"]["registro_sha256"] = "0" * 64
        self.recusa(c)

    def test_5_filtro_alterado_recusado(self):
        for filtro in (None, "ordinaria_2022", "inexistente"):
            c = copy.deepcopy(self.base)
            c["meta"]["filtro"] = filtro
            self.recusa(c, str(filtro))

    def test_6_fonte_alterada_recusada(self):
        for fonte in ("tse_detalhe_apuracao_2022", "tse_detalhe_apuracao_2026", "inexistente"):
            c = copy.deepcopy(self.base)
            c["meta"]["fonte"] = fonte
            self.recusa(c, fonte)

    def test_7_classificacao_alterada_recusada(self):
        c = copy.deepcopy(self.base)
        c["meta"]["proveniencia"] = "publicacao_historica_comprovada"
        self.recusa(c, "classificação no metadado")
        c = copy.deepcopy(self.base)
        c["meta"]["destino"] = "calibracao"
        self.recusa(c, "destino")
        original = self.reg.read_bytes()
        try:
            d = json.loads(original)
            f = next(x for x in d["fontes"] if x["id"] == "tse_detalhe_apuracao_2024")
            f["parcelas"] = []
            self.reg.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
            self.recusa(copy.deepcopy(self.base), "parcela alterada no registro depois da geração")
        finally:
            self.reg.write_bytes(original)
        self.entrar(copy.deepcopy(self.base))

    def test_8_reproducao_determinista(self):
        outro = conjuntos.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", "parcelas_d42_d62",
                                        "ordinaria_2024", registro=self.reg)
        self.assertEqual(outro, self.base)
        self.assertEqual(outro["meta"]["integridade"], self.base["meta"]["integridade"])

    def test_metadado_alterado_com_integridade_recalculada_recusado(self):
        for campo, valor in (("proveniencia", "publicacao_historica_comprovada"), ("temporalidade", "posterior_ao_corte"),
                             ("arquivo", "data/raw/outro.zip"), ("colunas_origem", ["QT_APTOS"]),
                             ("contagem", {"aceitas": 1, "fora_do_filtro": 0, "recusadas": {}, "segregadas": {}})):
            c = copy.deepcopy(self.base)
            c["meta"][campo] = valor
            m = dict(c["meta"]); m.pop("integridade")
            c["meta"]["integridade"] = conjuntos._sha(conjuntos.canonico(m))
            self.recusa(c, campo)

    def test_transformacao_e_versao_registradas(self):
        for campo, valor in (("transformacao", "inexistente"), ("transformacao_versao", 99)):
            c = copy.deepcopy(self.base)
            c["meta"][campo] = valor
            self.recusa(c, campo)


class TestInterfaceDeTeste(unittest.TestCase):
    def test_producao_nao_aceita_linhas_de_fora(self):
        for nome in ("linhas", "_linhas"):
            with self.assertRaises(TypeError, msg=nome):
                fx.Selecao(REG["tse_detalhe_apuracao_2024"], "calibracao", **{nome: []})

    def test_sintetica_exige_id_proprio(self):
        with self.assertRaises(ValueError):
            fx.Selecao.sintetica(REG["tse_detalhe_apuracao_2024"], "calibracao", [])
        falsa = dict(REG["tse_detalhe_apuracao_2024"], id="sintetica_x")
        sel = fx.Selecao.sintetica(falsa, "mundo_inicial",
                                   [{"DT_ELEICAO": "01/01/2026", "CD_ELEICAO": "1", "CD_MUNICIPIO": "1"},
                                    {"DT_ELEICAO": "01/01/2025", "CD_ELEICAO": "1", "CD_MUNICIPIO": "1"}])
        self.assertEqual(len(list(sel)), 1)
        self.assertTrue(sel.sintetica_)


class TestParcelasD42D62(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c24 = conjuntos.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", "parcelas_d42_d62", "ordinaria_2024")
        cls.c22 = conjuntos.intermediario("tse_detalhe_apuracao_2022", "mundo_inicial", "parcelas_d42_d62", "ordinaria_2022")

    def test_identidades_por_unidade(self):
        for c in (self.c24, self.c22):
            for k, u in c["dados"]["unidades"].items():
                self.assertEqual(u["status"], "completa", k)
                votos_ = u["validos"] + u["brancos"] + u["nulos"] + u["anulados"] + u["anuladosSubJudice"] + u["anuladosApuracaoSeparada"]
                self.assertEqual(votos_, u["comparecimento"] * u["votosPorEleitor"], k)
                self.assertEqual(u["aptos"], u["comparecimento"] + u["abstencoes"] + u["eleitoresSecoesNaoInstaladas"], k)
                self.assertTrue(all(isinstance(u[x], int) for x in ("aptos", "denominadorVotos", "brancos")))

    def test_aptos_nao_somados_entre_cargos(self):
        u = self.c24["dados"]["unidades"]
        for k in u:
            mun, cargo, turno = k.split("|")
            if cargo == "Prefeito" and turno == "1":
                self.assertEqual(u[k]["aptos"], u[f"{mun}|Vereador|1"]["aptos"], mun)

    def test_senado_2022_um_voto_por_eleitor(self):
        u = [v for k, v in self.c22["dados"]["unidades"].items() if "|Senador|" in k]
        self.assertTrue(u and all(x["votosPorEleitor"] == 1 for x in u))

    def test_completude_e_quatro_situacoes(self):
        mun24 = {k.split("|")[0] for k in self.c24["dados"]["unidades"]}
        r24 = completude.avaliar(self.c24["dados"], "municipal")
        self.assertEqual(r24["situacoes"], {"completa": 11189, "sem_eleicao_propria": 4})
        self.assertEqual((r24["esperadas"], r24["inesperadas"], r24["lacunas"]), (11193, [], {}))
        r22 = completude.avaliar(self.c22["dados"], "geral", mun24)
        self.assertEqual(r22["situacoes"], {"ausencia_referencia_historica": 6, "completa": 36132})
        self.assertEqual((r22["esperadas"], r22["inesperadas"], r22["lacunas"]), (36138, [], {}))
        dados = copy.deepcopy(self.c24["dados"])
        alvo = "01007|Prefeito|1"
        dados["unidades"][alvo]["status"] = "bloqueada_segregada"
        del dados["unidades"]["01015|Vereador|1"]
        r = completude.avaliar(dados, "municipal")
        self.assertIn(alvo, r["bloqueadas"])
        self.assertIn("01015|Vereador|1", r["lacunas"])
        self.assertEqual(r["estimativas"], {})
        self.assertEqual(r["situacoes"]["ausencia_dados_fonte"], 1)

    def test_segundo_turno_e_exterior_cobertos(self):
        u24 = self.c24["dados"]["unidades"]
        u22 = self.c22["dados"]["unidades"]
        self.assertEqual(sum(1 for k in u24 if k.endswith("|Prefeito|2")), 51)
        self.assertIn("31054|Prefeito|2", u24, "Aracaju: 2º turno sem marcador na candidatura de 1º turno")
        self.assertTrue({"EXTERIOR|Presidente|1", "EXTERIOR|Presidente|2"} <= set(u22))
        mun24 = {k.split("|")[0] for k in u24}
        for tipo, base, alvo, extra in (("municipal", u24, "31054|Prefeito|2", None),
                                        ("geral", u22, "EXTERIOR|Presidente|2", mun24),
                                        ("geral", u22, "35157|Governador|2", mun24)):
            if alvo not in base:
                alvo = next(k for k in base if k.endswith("|Governador|2"))
            dados = {"unidades": {k: v for k, v in base.items() if k != alvo}}
            r = completude.avaliar(dados, tipo, extra)
            self.assertIn(alvo, r["lacunas"], alvo)
            self.assertEqual(r["situacoes"]["ausencia_dados_fonte"], 1, alvo)
        dados = {"unidades": dict(u24, **{"99999|Prefeito|2": dict(next(iter(u24.values())))})}
        self.assertEqual(completude.avaliar(dados, "municipal")["inesperadas"], ["99999|Prefeito|2"])

    def test_fallback_produz_taxas_da_uf(self):
        mun24 = {k.split("|")[0] for k in self.c24["dados"]["unidades"]}
        r22 = completude.avaliar(self.c22["dados"], "geral", mun24)
        k = "73709|Governador|1"
        e = r22["estimativas"][k]
        self.assertTrue(e["estimativa"])
        mt = [u for kk, u in self.c22["dados"]["unidades"].items() if kk.endswith("|Governador|1") and u["uf"] == "MT"]
        self.assertGreater(len(mt), 100)
        aptos = sum(u["aptos"] for u in mt)
        den = sum(u["denominadorVotos"] for u in mt)
        self.assertEqual(e["taxas"]["comparecimento"], {"numerador": sum(u["comparecimento"] for u in mt), "denominador": aptos})
        self.assertEqual(e["taxas"]["brancos"], {"numerador": sum(u["brancos"] for u in mt), "denominador": den})
        for nome, t in e["taxas"].items():
            self.assertTrue(0 <= completude.valor(t) <= 1, nome)
        soma_aptos = sum(completude.valor(e["taxas"][c]) for c in ("comparecimento", "abstencoes", "eleitoresSecoesNaoInstaladas"))
        self.assertEqual(soma_aptos, 1)

    def test_fallback_bloqueado_com_agregado_da_uf_incompleto(self):
        mun24 = {k.split("|")[0] for k in self.c24["dados"]["unidades"]}
        dados = copy.deepcopy(self.c22["dados"])
        k_mt = next(k for k, u in dados["unidades"].items() if k.endswith("|Governador|1") and u["uf"] == "MT")
        dados["unidades"][k_mt]["status"] = "bloqueada_segregada"
        r = completude.avaliar(dados, "geral", mun24)
        self.assertNotIn("73709|Governador|1", r["estimativas"])
        self.assertIn("73709|Governador|1", r["lacunas"])
        self.assertIn("73709|Senador|1", r["estimativas"], "outros cargos da UF seguem com estimativa")

    def test_unidade_com_linha_segregada_bloqueada(self):
        falsa = dict(REG["tse_detalhe_apuracao_2024"], id="sintetica_seg", parcelas=[
            {"excluir": {"NR_ZONA": "2"}, "proveniencia": "integridade_pendente"}])
        base = {"SG_UF": "AC", "CD_MUNICIPIO": "01007", "DS_CARGO": "Prefeito", "NR_TURNO": "1", "CD_ELEICAO": "619",
                "ANO_ELEICAO": "2024", "DT_ELEICAO": "06/10/2024", "QT_APTOS": "10", "QT_COMPARECIMENTO": "8",
                "QT_ABSTENCOES": "2", "QT_ELEITORES_SECOES_NAO_INSTALADAS": "0", "QT_TOTAL_VOTOS_VALIDOS": "7",
                "QT_VOTOS_BRANCOS": "1", "QT_TOTAL_VOTOS_NULOS": "0", "QT_TOTAL_VOTOS_ANULADOS": "0",
                "QT_TOTAL_VOTOS_ANUL_SUBJUD": "0", "QT_VOTOS_ANULADOS_APU_SEP": "0"}
        z1, z2 = dict(base, NR_ZONA="1"), dict(base, NR_ZONA="2")
        from tools.dados.pipeline.transformacoes import TRANSFORMACOES, unidade_cargo_turno
        sel = fx.Selecao.sintetica(falsa, "mundo_inicial", [z1, z2], chave=unidade_cargo_turno)
        out = TRANSFORMACOES["parcelas_d42_d62"]["fn"](sel)
        u = out["unidades"]["01007|Prefeito|1"]
        self.assertEqual(u["status"], "bloqueada_segregada")
        self.assertEqual(u["aptos"], 10, "soma só da zona aceita, mas a unidade fica bloqueada")


@precisa("tse_perfil_eleitorado_2024")
class TestPerfilEleitorado(unittest.TestCase):
    def test_total_e_dimensoes_por_municipio(self):
        f = REG["tse_perfil_eleitorado_2024"]
        tot, dims = Counter(), {d: Counter() for d in ("DS_GENERO", "DS_FAIXA_ETARIA", "DS_GRAU_ESCOLARIDADE")}
        sel = fx.Selecao(f, "mundo_inicial")
        for r in sel:
            q = int(r["QT_ELEITORES"])
            tot[r["CD_MUNICIPIO"]] += q
            for d in dims:
                dims[d][(r["CD_MUNICIPIO"], r[d])] += q
        self.assertEqual(len(tot), 5569)
        self.assertEqual(sum(tot.values()), 155912680)
        for d, c in dims.items():
            por_mun = Counter()
            for (m, _), v in c.items():
                por_mun[m] += v
            self.assertEqual(por_mun, tot, d)
        aptos = Counter()
        for r in fx.Selecao(REG["tse_detalhe_apuracao_2024"], "mundo_inicial", ORD24):
            if r["NR_TURNO"] == "1" and r["DS_CARGO"] == "Vereador":
                aptos[r["CD_MUNICIPIO"]] += int(r["QT_APTOS"])
        self.assertEqual(aptos, tot)


if __name__ == "__main__":
    unittest.main()


@precisa("tse_votacao_candidato_2022")
class TestVotacaoCandidato2022(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from tools.dados.auditar_votacao_candidato import auditar
        cls.r = auditar(2022, REG)

    def test_nominais_iguais_ao_detalhe(self):
        n = self.r["nominais_x_detalhe"]
        self.assertEqual((n["chaves"], n["iguais"], n["divergentes"]), (39966, 39966, []))

    def test_vagas_iguais_aos_eleitos(self):
        v = self.r["vagas_x_eleitos"]
        self.assertEqual(v["majoritario"]["vagas = eleitos (votação por candidato)"], v["majoritario"]["unidades"])
        self.assertEqual(v["proporcional"]["vagas = eleitos (votação por candidato)"], v["proporcional"]["unidades"])
        self.assertEqual(self.r["divergencias_vagas"], [])
        self.assertEqual(self.r["majoritarios_mais_votado"], {"eleito é o mais votado": 55})

    def test_segundo_turno_confirmado_por_fonte_independente(self):
        s = self.r["segundo_turno"]
        self.assertEqual((s["votacao_candidato"], s["so_votacao"], s["so_candidaturas"]), (13, [], []))


@precisa("tse_votacao_candidato_2024")
class TestVotacaoCandidato2024(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from tools.dados.auditar_votacao_candidato import auditar
        cls.r = auditar(2024, REG)

    def test_nominais_e_divergencias_conhecidas(self):
        n = self.r["nominais_x_detalhe"]
        self.assertEqual((n["chaves"], n["iguais"], len(n["divergentes"])), (12449, 12410, 39))
        parciais = sorted(tuple(x["chave"]) for x in n["divergentes"] if x["votacao_candidato"] != 0)
        self.assertEqual(sum(1 for x in n["divergentes"] if x["votacao_candidato"] == 0), 36)
        self.assertEqual(parciais, [("619", "1", "63134", "303", "VEREADOR"), ("619", "1", "63134", "388", "VEREADOR"),
                                    ("619", "1", "64696", "48", "VEREADOR")])

    def test_segundo_turno_confirmado_por_fonte_independente(self):
        s = self.r["segundo_turno"]
        self.assertEqual((s["votacao_candidato"], s["so_votacao"], s["so_candidaturas"]), (51, [], []))

    def test_divergencias_de_vagas_conhecidas(self):
        c = Counter(x["chave"][2] for x in self.r["divergencias_vagas"])
        self.assertEqual(c, Counter({"PREFEITO": 41, "VEREADOR": 24}))
        self.assertEqual(self.r["empates"], [["619", "46191", "PREFEITO"]])
        self.assertNotIn("eleito não é o mais votado", self.r["majoritarios_mais_votado"])

    def test_regras_de_vagas_igual_as_divergencias(self):
        regras = [r["excluir"] for r in REG["tse_vagas_2024"]["parcelas"] if "excluir" in r]
        chaves = {(r["CD_ELEICAO"], r["SG_UE"], r["DS_CARGO"].upper()) for r in regras}
        esperadas = {tuple(x["chave"]) for x in self.r["divergencias_vagas"]}
        self.assertEqual({(e, u, "PREFEITO" if c == "VICE-PREFEITO" else c) for e, u, c in chaves}, esperadas)
        self.assertEqual(len(regras), len({tuple(sorted(r.items())) for r in regras}))

    def test_vagas_segregadas_nao_entram(self):
        regras = {(r["excluir"]["SG_UE"], r["excluir"]["DS_CARGO"]) for r in REG["tse_vagas_2024"]["parcelas"] if "excluir" in r}
        sel = fx.Selecao(REG["tse_vagas_2024"], "mundo_inicial", ORD24)
        for r in sel:
            self.assertNotIn((r["SG_UE"], r["DS_CARGO"]), regras)
        self.assertEqual(sel.segregadas["integridade_pendente"], len(regras))


class TestVagas2022(unittest.TestCase):
    def test_vices_e_suplentes_segregados(self):
        sel = fx.Selecao(REG["tse_vagas_2022"], "mundo_inicial", filtro_ordinaria(2022))
        cargos = Counter(r["DS_CARGO"] for r in sel)
        self.assertNotIn("Vice-governador", cargos)
        self.assertNotIn("1. Suplente", cargos)
        self.assertEqual(cargos["Governador"], 27)
        self.assertEqual(sel.segregadas["integridade_pendente"], 27 * 3 + 1)
