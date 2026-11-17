"""Compara dados derivados do repositório Minha Bancada com os brutos oficiais do TSE.

Só lê arquivos. Não gera dados para o jogo. Uso:

    python3 -I tools/dados/comparar_minha_bancada.py <dados_minha_bancada> <pasta_tse_extraida>

<dados_minha_bancada>: pasta `dados/` do clone do repositório adrianogpena/minha-bancada.
<pasta_tse_extraida>: subpastas por zip do TSE já descompactado (detalhe_votacao_munzona_2024,
votacao_partido_munzona_2024, consulta_vagas_2024, municipio_tse_ibge).
"""
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


def ler_csv(caminho):
    with open(caminho, encoding="latin-1", newline="") as f:
        yield from csv.DictReader(f, delimiter=";")


def i(v):
    return int(v) if v.lstrip("-").isdigit() else 0


def carregar_uf(pasta):
    out = {}
    for arq in sorted(Path(pasta).glob("*.json")):
        out[arq.stem] = json.loads(arq.read_text(encoding="utf-8"))
    return out


def tse_detalhe_2024(pasta):
    """Por (cargo, turno, município): parcelas da eleição ordinária (CD_ELEICAO 619)."""
    agg = defaultdict(Counter)
    arq = next(Path(pasta).glob("detalhe_votacao_munzona_2024/*BRASIL*.csv"))
    for r in ler_csv(arq):
        if r["CD_ELEICAO"] != "619":
            continue
        k = (r["DS_CARGO"].upper(), r["NR_TURNO"], r["CD_MUNICIPIO"])
        for c, campo in (("aptos", "QT_APTOS"), ("comparecimento", "QT_COMPARECIMENTO"), ("abstencoes", "QT_ABSTENCOES"),
                         ("brancos", "QT_VOTOS_BRANCOS"), ("nulos", "QT_TOTAL_VOTOS_NULOS"), ("validos", "QT_TOTAL_VOTOS_VALIDOS"),
                         ("anulados", "QT_TOTAL_VOTOS_ANULADOS"), ("anulados_subjud", "QT_TOTAL_VOTOS_ANUL_SUBJUD"),
                         ("anulados_apu_sep", "QT_VOTOS_ANULADOS_APU_SEP")):
            agg[k][c] += i(r[campo])
    return agg


def comparar_disputa(mb, det):
    print("== disputa 2024 x detalhe da apuração 2024 (eleição ordinária)")
    campos = ("aptos", "comparecimento", "abstencoes", "brancos", "nulos", "validos")
    cont = Counter()
    exemplos = []
    for uf, d in mb.items():
        for chave, v in d.items():
            if chave.startswith("_") or chave.count("|") != 1:
                cont["chaves fora do formato CARGO|município (ignoradas)"] += 1
                continue
            cargo, mun = chave.split("|")
            for turno, t in v.get("turnos", {}).items():
                ref = det.get((cargo, turno, mun))
                if ref is None:
                    cont["sem correspondência no TSE"] += 1
                    continue
                cont["linhas comparadas"] += 1
                for c in campos:
                    if t.get(c) == ref[c]:
                        cont[f"{c} igual"] += 1
                    else:
                        cont[f"{c} diferente"] += 1
                        if len(exemplos) < 5:
                            exemplos.append((uf, chave, turno, c, t.get(c), ref[c]))
                parcela = ref["anulados"] + ref["anulados_subjud"] + ref["anulados_apu_sep"]
                cont["linhas com anulados no TSE (ausentes no derivado)"] += parcela > 0
    print("  ", dict(cont))
    for e in exemplos:
        print("   diferença:", e)


def comparar_eleitorado(mb, det):
    print("== eleitorado 2024 x aptos de vereador, 1º turno, eleição ordinária")
    cont = Counter()
    soma_mb = soma_tse = 0
    for uf, d in mb.items():
        for mun, v in d.items():
            if mun.startswith("_"):
                continue
            ref = det.get(("VEREADOR", "1", mun))
            if ref is None:
                cont["sem correspondência"] += 1
                continue
            cont["municípios"] += 1
            soma_mb += v["total"]
            soma_tse += ref["aptos"]
            cont["total igual" if v["total"] == ref["aptos"] else "total diferente"] += 1
            cont["soma por gênero = total"] += sum(v["porGenero"]) == v["total"]
            cont["soma por faixa etária = total"] += sum(v["porFaixaEtaria"]) == v["total"]
            cont["soma por escolaridade = total"] += sum(v["porEscolaridade"]) == v["total"]
    print("  ", dict(cont), "soma derivado", soma_mb, "soma TSE", soma_tse)


def comparar_partidos(mb, pasta):
    print("== partidos 2024 x votação por partido 2024 (vereador, eleição ordinária)")
    arq = next(Path(pasta).glob("votacao_partido_munzona_2024/*BRASIL*.csv"))
    ref = defaultdict(Counter)
    for r in ler_csv(arq):
        if r["CD_ELEICAO"] != "619" or r["DS_CARGO"].upper() != "VEREADOR":
            continue
        k = (r["CD_MUNICIPIO"], r["NR_PARTIDO"])
        ref[k]["legenda"] += i(r["QT_VOTOS_LEGENDA_VALIDOS"])
        ref[k]["total_legenda"] += i(r["QT_TOTAL_VOTOS_LEG_VALIDOS"])
        ref[k]["nominais"] += i(r["QT_VOTOS_NOMINAIS_VALIDOS"])
        ref[k]["sigla"] = r["SG_PARTIDO"]
    por_sigla = {(m, c["sigla"]): c for (m, _), c in ref.items()}
    cont = Counter()
    for uf, d in mb.items():
        for chave, v in d.items():
            if not chave.startswith("VEREADOR|"):
                continue
            mun = chave.split("|")[1]
            for sigla, valores in v["partidos"].items():
                r = por_sigla.get((mun, sigla))
                if r is None:
                    cont["sigla sem correspondência"] += 1
                    continue
                a, b = valores[0], valores[1]
                cont["pares comparados"] += 1
                cont["[0] = legenda válida"] += a == r["legenda"]
                cont["[0] = total de legenda (com nominais convertidos)"] += a == r["total_legenda"]
                cont["[1] = nominais válidos"] += b == r["nominais"]
    print("  ", dict(cont))


def comparar_codigos(mb_path, pasta):
    print("== municipios_ibge.json x tabela oficial TSE x IBGE")
    mb = json.loads(Path(mb_path).read_text(encoding="utf-8"))
    arq = next(Path(pasta).glob("municipio_tse_ibge/*.csv"))
    of = {r["CD_MUNICIPIO_TSE"]: r["CD_MUNICIPIO_IBGE"] for r in ler_csv(arq)}
    iguais = sum(1 for k, v in mb.items() if of.get(k) == str(v))
    print("   derivado", len(mb), "oficial", len(of), "pares iguais", iguais,
          "só no derivado", sorted(set(mb) - set(of))[:5], "só no oficial", sorted(set(of) - set(mb))[:5],
          "divergentes", [(k, mb[k], of[k]) for k in mb if k in of and of[k] != str(mb[k])][:5])


def main():
    mb, tse = Path(sys.argv[1]), sys.argv[2]
    det = tse_detalhe_2024(tse)
    comparar_disputa(carregar_uf(mb / "tse/disputa/2024"), det)
    comparar_eleitorado(carregar_uf(mb / "tse/eleitorado/2024"), det)
    comparar_partidos(carregar_uf(mb / "tse/partidos/2024"), tse)
    comparar_codigos(mb / "municipios_ibge.json", tse)


if __name__ == "__main__":
    main()
