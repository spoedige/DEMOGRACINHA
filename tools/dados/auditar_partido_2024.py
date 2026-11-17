"""Confronto votação por partido x detalhe da apuração, 2024, por eleição, turno, município, zona e cargo.

Só lê os brutos. Uso (da raiz):  python3 -I tools/dados/auditar_partido_2024.py [--json]
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.dados.pipeline import fontes as fx  # noqa: E402

CHAVE = ("CD_ELEICAO", "NR_TURNO", "CD_MUNICIPIO", "NR_ZONA", "DS_CARGO")


def i(v):
    return int(v) if v.lstrip("-").isdigit() else 0


def chave(r):
    return (r["CD_ELEICAO"], r["NR_TURNO"], r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"], r["DS_CARGO"])


def confrontar(reg=None):
    reg = reg or fx.carregar_registro()
    fp, fd = reg["tse_votacao_partido_2024"], reg["tse_detalhe_apuracao_2024"]
    part = defaultdict(Counter)
    for r in fx.linhas_csv(fp):
        c = part[chave(r)]
        c["nominais"] += i(r["QT_VOTOS_NOMINAIS_VALIDOS"])
        c["legenda"] += i(r["QT_VOTOS_LEGENDA_VALIDOS"])
        c["nominais_convertidos_legenda"] += i(r["QT_VOTOS_NOM_CONVR_LEG_VALIDOS"])
        c["total_legenda"] += i(r["QT_TOTAL_VOTOS_LEG_VALIDOS"])
        c["linhas"] += 1
    det, info = {}, {}
    for r in fx.linhas_csv(fd):
        k = chave(r)
        det[k] = {
            "validos": i(r["QT_TOTAL_VOTOS_VALIDOS"]),
            "nominais_validos": i(r["QT_VOTOS_NOMINAIS_VALIDOS"]),
            "legenda_validos": i(r["QT_TOTAL_VOTOS_LEG_VALIDOS"]),
            "anulados": i(r["QT_TOTAL_VOTOS_ANULADOS"]),
            "anulados_subjud": i(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]),
        }
        info[k] = (r["SG_UF"], r["NM_MUNICIPIO"], r["DT_ELEICAO"])
    iguais, divergentes = [], []
    for k in sorted(set(part) | set(det)):
        p, d = part.get(k, Counter()), det.get(k)
        soma = p["nominais"] + p["total_legenda"]
        if d is not None and soma == d["validos"]:
            iguais.append(k)
            continue
        validos = d["validos"] if d else None
        divergentes.append({
            "chave": dict(zip(CHAVE, k)),
            "uf": info.get(k, ("", "", ""))[0], "municipio": info.get(k, ("", "", ""))[1], "data_eleicao": info.get(k, ("", "", ""))[2],
            "partido_nominais": p["nominais"], "partido_legenda": p["legenda"], "partido_total_legenda": p["total_legenda"],
            "partido_soma": soma, "partido_linhas": p["linhas"],
            "detalhe_validos": validos,
            "detalhe_nominais": d["nominais_validos"] if d else None,
            "detalhe_legenda": d["legenda_validos"] if d else None,
            "detalhe_anulados": d["anulados"] if d else None,
            "detalhe_anulados_subjud": d["anulados_subjud"] if d else None,
            "diferenca": (soma - validos) if validos is not None else None,
            "diferenca_pct": round(100 * (soma - validos) / validos, 2) if validos else None,
        })
    return iguais, divergentes


def main():
    iguais, div = confrontar()
    if "--json" in sys.argv:
        json.dump({"iguais": len(iguais), "divergentes": div}, sys.stdout, ensure_ascii=False, indent=1)
        return
    print("chaves iguais:", len(iguais), "divergentes:", len(div))
    for x in div:
        print(x)


if __name__ == "__main__":
    main()
