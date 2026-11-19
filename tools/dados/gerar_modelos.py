"""Etapa 1B: bases eleitorais reais por UF para os modelos de disputa (D60 revisada: 2024 municipal, 2022 geral).

Uso, da raiz: python3 -m tools.dados.gerar_modelos
Saída: public/data/eleicoes/<UF>.json e public/data/eleicoes/BR.json. Só contagens oficiais; parâmetros do modelo
(identificação partidária, sintéticos, máquina) são montados no jogo e ficam (calibrar).
Vagas vêm de consulta_vagas (integridade pendente no registro): marcadas (a confirmar).
Contagens: [aptos, comparecimento, abstencoes, eleitoresSecoesNaoInstaladas, validos, brancos, nulos, anulados,
anuladosSubJudice, anuladosApuracaoSeparada, denominadorVotos].
"""
import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

from tools.dados.pipeline import completude, conjuntos
from tools.dados.pipeline import fontes as fx
from tools.dados.pipeline.eleicoes import ORDINARIAS
from tools.dados.gerar_mundo import id_interno

# legendas de 2022 extintas até 2024 por fusão ou incorporação: votos vão à sucessora (a confirmar contra o registro do TSE)
SUCESSORA = {"PSC": "PODE", "PROS": "SOLIDARIEDADE", "PTB": "PRD", "PATRIOTA": "PRD", "PMN": "MOBILIZA"}


def pid(sigla):
    i = id_interno(sigla)
    return SUCESSORA.get(i, i)

RAIZ = Path(fx.RAIZ)
SAIDA = RAIZ / "public" / "data" / "eleicoes"
CAMPOS = ("aptos", "comparecimento", "abstencoes", "eleitoresSecoesNaoInstaladas", "validos", "brancos", "nulos",
          "anulados", "anuladosSubJudice", "anuladosApuracaoSeparada", "denominadorVotos")
CARGO = {"VEREADOR": "VEREADOR", "PREFEITO": "PREFEITO", "DEPUTADO FEDERAL": "DEPUTADO_FEDERAL", "DEPUTADO ESTADUAL": "DEPUTADO_ESTADUAL",
         "DEPUTADO DISTRITAL": "DEPUTADO_DISTRITAL", "SENADOR": "SENADOR", "GOVERNADOR": "GOVERNADOR", "PRESIDENTE": "PRESIDENTE"}


def _unidades(fonte, ano):
    c = conjuntos.intermediario(fonte, "mundo_inicial", "parcelas_d42_d62", f"ordinaria_{ano}")
    conjuntos.entrada_mundo_inicial(c)
    return c["dados"]["unidades"]


def _cont(u):
    return [u[k] for k in CAMPOS]


def _votos_partido(fonte_id, ano):
    """(tse, cargo) -> {sigla: votos válidos (nominais + legenda)} no 1º turno da ordinária."""
    reg = fx.carregar_registro()[fonte_id]
    v = defaultdict(lambda: defaultdict(int))
    ordin = ORDINARIAS[ano]
    for r in fx.Selecao(reg, "mundo_inicial", lambda x: x["CD_ELEICAO"] in ordin and x["NR_TURNO"] == "1", raiz=RAIZ):
        cargo = CARGO.get(r["DS_CARGO"].upper())
        if cargo:
            v[(r["CD_MUNICIPIO"].zfill(5), cargo)][pid(r["SG_PARTIDO"])] += int(r["QT_VOTOS_NOMINAIS_VALIDOS"]) + int(r["QT_TOTAL_VOTOS_LEG_VALIDOS"])
    return v


def _vagas(arquivo, ano):
    """(unidade eleitoral, cargo) -> vagas, da ordinária. Fonte com integridade pendente: (a confirmar)."""
    out = {}
    with zipfile.ZipFile(RAIZ / arquivo) as z:
        nome = next(n for n in z.namelist() if "BRASIL" in n.upper())
        for r in csv.DictReader(io.TextIOWrapper(z.open(nome), encoding="latin-1", newline=""), delimiter=";"):
            cargo = CARGO.get(r["DS_CARGO"].upper())
            if cargo and r["CD_ELEICAO"] in ORDINARIAS[ano]:
                out[(r["SG_UE"], cargo)] = int(r["QT_VAGA"])
    return out


def _eleitos_df_2022():
    reg = fx.carregar_registro()["tse_votacao_candidato_2022"]
    vistos, n = set(), defaultdict(lambda: defaultdict(int))
    for r in fx.Selecao(reg, "mundo_inicial", lambda x: x["CD_ELEICAO"] in ORDINARIAS[2022] and x["NR_TURNO"] == "1"
                        and x["DS_CARGO"].upper() == "DEPUTADO FEDERAL", raiz=RAIZ):
        if r["DS_SIT_TOT_TURNO"].upper().startswith("ELEITO") and r["SQ_CANDIDATO"] not in vistos:
            vistos.add(r["SQ_CANDIDATO"]); n[r["SG_UF"]][pid(r["SG_PARTIDO"])] += 1
    return n


def main():
    corr = completude.correspondencia(RAIZ)                       # tse -> (uf, ibge)
    nomes = {m["id"]: m["nome"] for m in json.loads((RAIZ / "public/data/municipios.json").read_text(encoding="utf-8"))["municipios"]}
    u24, u22 = _unidades("tse_detalhe_apuracao_2024", 2024), _unidades("tse_detalhe_apuracao_2022", 2022)
    v24, v22 = _votos_partido("tse_votacao_partido_2024", 2024), _votos_partido("tse_votacao_partido_2022", 2022)
    vg24, vg22 = _vagas("data/raw/tse/consulta_vagas_2024.zip", 2024), _vagas("data/raw/tse/consulta_vagas_2022.zip", 2022)
    por_uf = defaultdict(lambda: {"m": {}, "g": {"t": {}, "votos": defaultdict(lambda: defaultdict(int)), "vagas": {}}})
    br = {"t": {}, "votos": defaultdict(int)}
    for chave, u in u24.items():
        tse, cargo, turno = chave.split("|")
        if turno != "1" or u.get("status") != "completa":
            continue
        uf, ibge = corr[tse]
        m = por_uf[uf]["m"].setdefault(ibge, {"n": nomes.get(ibge), "t": {}, "votos": {}, "vagas": {}})
        c = CARGO[cargo.upper()]
        m["t"][c] = _cont(u)
        m["votos"][c] = dict(sorted(v24.get((tse, c), {}).items()))
        if (tse, c) in vg24:
            m["vagas"][c] = vg24[(tse, c)]
    for chave, u in u22.items():
        tse, cargo, turno = chave.split("|")
        if turno != "1" or tse == "EXTERIOR" or u.get("status") != "completa":
            continue
        uf, _ = corr[tse]
        c = CARGO[cargo.upper()]
        alvo = br if c == "PRESIDENTE" else por_uf[uf]["g"]
        t = alvo["t"].setdefault(c, [0] * len(CAMPOS))
        for i, x in enumerate(_cont(u)):
            t[i] += x
        for s, x in v22.get((tse, c), {}).items():
            if c == "PRESIDENTE":
                alvo["votos"][s] += x
            else:
                alvo["votos"][c][s] += x
    for uf, d in por_uf.items():
        for c in ("DEPUTADO_FEDERAL", "DEPUTADO_ESTADUAL", "DEPUTADO_DISTRITAL", "SENADOR", "GOVERNADOR"):
            if (uf, c) in vg22:
                d["g"]["vagas"][c] = vg22[(uf, c)]
        d["g"]["votos"] = {c: dict(sorted(v.items())) for c, v in d["g"]["votos"].items()}
    SAIDA.mkdir(parents=True, exist_ok=True)
    meta = {"campos": list(CAMPOS), "fontes": "TSE: detalhe da apuração e votação por partido (2024 municipal, 2022 geral), "
            "vagas (a confirmar: integridade pendente no registro) e votação por candidato 2022 (eleitos). Ver data/fontes.json."}
    for uf, d in sorted(por_uf.items()):
        (SAIDA / f"{uf}.json").write_text(json.dumps({"_meta": meta, "uf": uf, "municipios": dict(sorted(d["m"].items())), "geral": d["g"]},
                                                     ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    el = _eleitos_df_2022()
    clausula = {uf: {"votos": d["g"]["votos"].get("DEPUTADO_FEDERAL", {}), "eleitos": dict(sorted(el.get(uf, {}).items()))} for uf, d in sorted(por_uf.items())}
    (SAIDA / "BR.json").write_text(json.dumps({"_meta": meta, "presidente": {"t": br["t"].get("PRESIDENTE"), "votos": dict(sorted(br["votos"].items()))},
                                               "deputadoFederal2022": clausula}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("UFs", len(por_uf), "municípios", sum(len(d["m"]) for d in por_uf.values()),
          "deputados 2022", sum(sum(x["eleitos"].values()) for x in clausula.values()))


if __name__ == "__main__":
    main()
