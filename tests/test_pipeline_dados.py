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
from tools.dados.pipeline.eleicoes import filtro_ordinaria
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
        def municipios(it):
            return sorted({r["CD_MUNICIPIO"] for r in it})
        c = fx.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", municipios, ORD24, ["CD_MUNICIPIO"],
                             nome_filtro="ordinaria_2024")
        cont = c["meta"]["contagem"]
        self.assertGreater(cont["aceitas"], 0)
        self.assertGreater(cont["fora_do_filtro"], 0)
        self.assertEqual(len(c["dados"]), 5569)
        for campo in ("temporalidade", "proveniencia", "sha256", "arquivo"):
            self.assertEqual(c["meta"][campo], REG["tse_detalhe_apuracao_2024"][campo])
        self.assertEqual(fx.entrada_mundo_inicial(c), c["dados"])


class TestD61(unittest.TestCase):
    """Eleição ordinária (D61) e temporalidade (D63) são controles independentes."""

    def test_filtro_d61_usa_so_cd_eleicao(self):
        self.assertTrue(ORD24({"CD_ELEICAO": "619", "DT_ELEICAO": "01/01/2030"}))
        self.assertFalse(ORD24({"CD_ELEICAO": "6266", "DT_ELEICAO": "06/10/2024"}))

    def test_suplementar_anterior_ao_corte_passa_na_d63_mas_nao_na_d61(self):
        f = REG["tse_detalhe_apuracao_2024"]
        supl_antes, supl_depois = 0, 0
        for r in fx.linhas_csv(f):
            if r["CD_ELEICAO"] == "619":
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
        self.assertEqual(cods, {"619"})
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
            fx.entrada_mundo_inicial(fx.intermediario("tse_detalhe_apuracao_2026", "calibracao", lista))
        cal = fx.intermediario("tse_detalhe_apuracao_2024", "calibracao", lambda it: sum(1 for _ in it))
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(cal)

    def test_2026_sem_linhas_no_mundo_inicial(self):
        c = fx.intermediario("tse_detalhe_apuracao_2026", "mundo_inicial", lista)
        self.assertEqual(c["meta"]["contagem"]["aceitas"], 0)
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(c)

    def test_metadados_adulterados_recusados(self):
        base = fx.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", lambda it: 1, ORD24)
        casos = [("destino", "calibracao"), ("sha256", "0" * 64), ("fonte", "inexistente"), ("contagem", None)]
        for campo, valor in casos:
            c = copy.deepcopy(base)
            c["meta"][campo] = valor
            with self.assertRaises(adm.FonteInadmissivel, msg=campo):
                fx.entrada_mundo_inicial(c)
        if fx.presente(REG["tse_perfil_eleitorado_2024"]):
            c = copy.deepcopy(base)
            c["meta"].update(fonte="tse_perfil_eleitorado_2024", sha256=REG["tse_perfil_eleitorado_2024"]["sha256"],
                             colunas_origem=["CD_MUNICIPIO", "DS_GENERO"])
            with self.assertRaises(adm.FonteInadmissivel, msg="coluna pendente"):
                fx.entrada_mundo_inicial(c)
        c = copy.deepcopy(base)
        c["meta"]["fonte"] = "tse_detalhe_apuracao_2026"
        c["meta"]["sha256"] = REG["tse_detalhe_apuracao_2026"]["sha256"]
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(c)


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
