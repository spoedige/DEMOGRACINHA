"""Testes do pipeline de dados (D49, D50, D59, D60, D61, D62, D63).

Rodar da raiz do repositório:  python3 -m unittest discover -s tests -v
Testes que dependem de brutos fora do git (data/raw/tse/grandes/) são pulados quando o arquivo não existe.
"""
import copy
import unittest
from collections import Counter
from datetime import date
from pathlib import Path

from tools.dados.pipeline import admissibilidade as adm
from tools.dados.pipeline import fontes as fx
from tools.dados.pipeline import votos
from tools.dados.pipeline.arredondamento import maiores_restos
from tools.dados.validar_estatisticos import IDENTIDADES

REG = fx.carregar_registro()


def presente(fonte):
    return (fx.RAIZ / fonte["arquivo"]).exists()


class TestAdmissibilidade(unittest.TestCase):
    def test_01_historico_regenerado_e_validado_entra_no_mundo_inicial(self):
        f = REG["tse_detalhe_apuracao_2024"]
        self.assertEqual(f["proveniencia"], "versao_posterior_validada")
        self.assertTrue(adm.admissivel(f["temporalidade"], f["proveniencia"], "mundo_inicial"))

    def test_02_resultados_de_2026_recusados_no_mundo_inicial(self):
        f = REG["tse_detalhe_apuracao_2026"]
        self.assertFalse(adm.admissivel(f["temporalidade"], f["proveniencia"], "mundo_inicial"))
        self.assertTrue(adm.admissivel(f["temporalidade"], f["proveniencia"], "calibracao"))

    def test_03_sem_referencia_temporal_nao_entra_automaticamente(self):
        t = adm.temporalidade_por_data(None)
        self.assertEqual(t, "temporalidade_nao_comprovada")
        for destino in adm.DESTINOS:
            self.assertFalse(adm.admissivel(t, "versao_posterior_validada", destino))

    def test_04_nenhuma_fonte_marcada_como_publicacao_comprovada_sem_data_de_publicacao(self):
        for f in REG.values():
            if f["proveniencia"] == "publicacao_historica_comprovada":
                self.assertIn("data_publicacao", f, f["id"])
                self.assertLessEqual(date.fromisoformat(f["data_publicacao"]), adm.CORTE, f["id"])

    def test_05_data_de_coleta_nao_altera_temporalidade(self):
        f = copy.deepcopy(REG["tse_detalhe_apuracao_2024"])
        linha = {"DT_ELEICAO": "06/10/2024"}
        antes = fx.classificar_parcela(f, linha)
        f["data_acesso"] = "2030-01-01T00:00:00Z"
        self.assertEqual(fx.classificar_parcela(f, linha), antes)
        self.assertEqual(adm.temporalidade_por_data(date(2024, 10, 6)), "historico_compativel")
        self.assertEqual(adm.temporalidade_por_data(date(2025, 12, 31)), "historico_compativel")
        self.assertEqual(adm.temporalidade_por_data(date(2026, 1, 1)), "posterior_ao_corte")

    def test_integridade_pendente_nao_entra_em_destino_algum(self):
        for destino in adm.DESTINOS:
            self.assertFalse(adm.admissivel("historico_compativel", "integridade_pendente", destino))
            self.assertFalse(adm.admissivel("historico_compativel", "proveniencia_nao_comprovada", destino))


class TestConteudo(unittest.TestCase):
    def test_06_identidades_d59_em_todas_as_linhas_de_2024(self):
        f = REG["tse_detalhe_apuracao_2024"]
        falhas = Counter()
        n = 0
        for r in fx.linhas_csv(f):
            n += 1
            for nome, regra in IDENTIDADES.items():
                if not regra(r):
                    falhas[nome] += 1
        self.assertGreater(n, 0)
        self.assertEqual(dict(falhas), {})

    def test_07_suplementares_nao_contaminam_a_ordinaria(self):
        f = REG["tse_detalhe_apuracao_2024"]
        ordinaria, suplementar_pos_corte = set(), 0
        for r in fx.linhas_csv(f):
            if r["CD_ELEICAO"] == "619":
                if r["NR_TURNO"] == "1" and r["DS_CARGO"] == "Vereador":
                    ordinaria.add(r["CD_MUNICIPIO"])
                self.assertEqual(fx.classificar_parcela(f, r)[0], "historico_compativel")
            elif fx.classificar_parcela(f, r)[0] == "posterior_ao_corte":
                suplementar_pos_corte += 1
        self.assertEqual(len(ordinaria), 5569)
        self.assertGreater(suplementar_pos_corte, 0)

    def test_08_tres_categorias_de_anulados_permanecem_separadas(self):
        f = REG["tse_detalhe_apuracao_2024"]
        com_duas = 0
        for r in fx.linhas_csv(f):
            p = votos.parcelas(r)
            self.assertEqual(set(p), set(votos.CAMPOS))
            self.assertEqual(p["anulados"], int(r["QT_TOTAL_VOTOS_ANULADOS"]))
            self.assertEqual(p["anuladosSubJudice"], int(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]))
            self.assertEqual(p["anuladosApuracaoSeparada"], int(r["QT_VOTOS_ANULADOS_APU_SEP"]))
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

    def test_09_arredondamento_deterministico(self):
        pesos = {"c": 1, "a": 1, "b": 1}
        r1 = maiores_restos(10, pesos)
        r2 = maiores_restos(10, dict(reversed(list(pesos.items()))))
        self.assertEqual(r1, r2)
        self.assertEqual(sum(r1.values()), 10)
        self.assertEqual(r1, {"a": 4, "b": 3, "c": 3})
        self.assertEqual(maiores_restos(7, {"x": 0.1, "y": 0.2, "z": 0.7}), maiores_restos(7, {"z": 0.7, "y": 0.2, "x": 0.1}))

    def test_10_brutos_nao_modificados(self):
        verificados = 0
        for f in REG.values():
            if fx.verificar_integridade(f):
                verificados += 1
        self.assertGreater(verificados, 0)


class TestSeparacaoDeFluxos(unittest.TestCase):
    def test_11_proveniencia_preservada_no_intermediario(self):
        f = REG["tse_detalhe_apuracao_2022"]
        c = fx.intermediario(f, "mundo_inicial", {"x": 1}, ["QT_APTOS"])
        for campo in ("temporalidade", "proveniencia", "sha256", "arquivo"):
            self.assertEqual(c["meta"][campo], f[campo])
        self.assertEqual(fx.entrada_mundo_inicial(c), {"x": 1})

    def test_12_calibracao_nao_alimenta_o_mundo_inicial(self):
        f26 = REG["tse_detalhe_apuracao_2026"]
        with self.assertRaises(adm.FonteInadmissivel):
            fx.intermediario(f26, "mundo_inicial", {}, [])
        cal = fx.intermediario(f26, "calibracao", {"x": 1}, [])
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(cal)
        f24 = REG["tse_detalhe_apuracao_2024"]
        cal24 = fx.intermediario(f24, "calibracao", {"x": 1}, [])
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(cal24)
        adulterado = copy.deepcopy(cal)
        adulterado["meta"]["destino"] = "mundo_inicial"
        with self.assertRaises(adm.FonteInadmissivel):
            fx.entrada_mundo_inicial(adulterado)


if __name__ == "__main__":
    unittest.main()
