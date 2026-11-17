"""Validação dos dados estatísticos brutos (IBGE e TSE).

Só lê arquivos brutos e imprime um relatório. Não altera os brutos e não gera
dados derivados para o jogo. Uso:

    python3 -I tools/dados/validar_estatisticos.py <pasta_ibge> <pasta_tse_extraida>

<pasta_tse_extraida> contém uma subpasta por zip do TSE já descompactado.
"""
import csv
import json
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.dados.pipeline.votos import votos_por_eleitor  # noqa: E402


def norm(nome):
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    return " ".join(s.upper().replace("-", " ").replace("'", " ").split())


def ler_csv(caminho):
    with open(caminho, encoding="latin-1", newline="") as f:
        yield from csv.DictReader(f, delimiter=";")


def i(v):
    return int(v) if v not in ("", "#NULO", "#NE") else 0


def ibge(pasta):
    dados = json.loads((Path(pasta) / "municipios.json").read_text(encoding="utf-8"))
    out = {}
    for m in dados:
        uf = m["microrregiao"]["mesorregiao"]["UF"]["sigla"] if m.get("microrregiao") else m["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]
        out[m["id"]] = (uf, m["nome"])
    print("IBGE municípios:", len(out))
    codigos = list(out)
    print("  códigos únicos:", len(set(codigos)) == len(codigos))
    print("  todos com 7 dígitos:", all(len(str(c)) == 7 for c in codigos))
    por_uf = Counter(uf for uf, _ in out.values())
    print("  UFs:", len(por_uf), " DF:", por_uf["DF"])
    return out


def detalhe(pasta, ano, cargo_ref):
    arq = next(Path(pasta).glob(f"detalhe_votacao_munzona_{ano}/*BRASIL*.csv"), None)
    if arq is None:
        arq = list(Path(pasta).glob(f"detalhe_votacao_munzona_{ano}/*.csv"))
    linhas = list(ler_csv(arq)) if isinstance(arq, Path) else [r for a in arq if "BR" not in a.stem[-2:] for r in ler_csv(a)]
    mun = defaultdict(lambda: Counter())
    nomes = {}
    falhas = Counter()
    for r in linhas:
        if r["NR_TURNO"] != "1" or r["DS_CARGO"] != cargo_ref:
            continue
        k = r["CD_MUNICIPIO"]
        nomes[k] = (r["SG_UF"], r["NM_MUNICIPIO"])
        for c in ("QT_APTOS", "QT_COMPARECIMENTO", "QT_ABSTENCOES", "QT_TOTAL_VOTOS_VALIDOS", "QT_VOTOS_BRANCOS", "QT_TOTAL_VOTOS_NULOS", "QT_TOTAL_VOTOS_ANULADOS", "QT_TOTAL_VOTOS_ANUL_SUBJUD", "QT_VOTOS_ANULADOS_APU_SEP"):
            mun[k][c] += i(r[c])
        if i(r["QT_COMPARECIMENTO"]) + i(r["QT_ABSTENCOES"]) + i(r["QT_ELEITORES_SECOES_NAO_INSTALADAS"]) != i(r["QT_APTOS"]):
            falhas["aptos != comparecimento + abstencoes + eleitores de secoes nao instaladas (zona)"] += 1
    print(f"Detalhe {ano}, cargo {cargo_ref}, 1º turno: municípios {len(mun)}")
    tot = Counter()
    for k, c in mun.items():
        tot.update(c)
        resto = c["QT_COMPARECIMENTO"] - c["QT_TOTAL_VOTOS_VALIDOS"] - c["QT_VOTOS_BRANCOS"] - c["QT_TOTAL_VOTOS_NULOS"]
        if resto != c["QT_TOTAL_VOTOS_ANULADOS"] + c["QT_TOTAL_VOTOS_ANUL_SUBJUD"] + c["QT_VOTOS_ANULADOS_APU_SEP"]:
            falhas["comparecimento != validos + brancos + nulos + anulados + anulados sub judice + apuracao separada (município, D59)"] += 1
    print("  totais:", {k: tot[k] for k in ("QT_APTOS", "QT_COMPARECIMENTO", "QT_ABSTENCOES", "QT_TOTAL_VOTOS_VALIDOS", "QT_VOTOS_BRANCOS", "QT_TOTAL_VOTOS_NULOS")})
    print("  falhas de identidade:", dict(falhas) or "nenhuma")
    return mun, nomes


def vagas(pasta, ano):
    arq = next(Path(pasta).glob(f"consulta_vagas_{ano}/*BRASIL*.csv"))
    v = Counter()
    for r in ler_csv(arq):
        v[r["DS_CARGO"]] += 1
    print(f"Vagas {ano}: unidades por cargo", dict(v))
    return v


def tabela_oficial(pasta):
    arq = next(Path(pasta).glob("municipio_tse_ibge/*.csv"))
    return {r["CD_MUNICIPIO_TSE"]: int(r["CD_MUNICIPIO_IBGE"]) for r in ler_csv(arq)}


def cruzar_oficial(tab, ibge_mun, tse_nomes, rotulo):
    sem = [k for k in tse_nomes if k not in tab]
    fora_ibge = [k for k in tse_nomes if k in tab and tab[k] not in ibge_mun]
    uf_diverge = [k for k in tse_nomes if k in tab and tab[k] in ibge_mun and ibge_mun[tab[k]][0] != tse_nomes[k][0]]
    nome_diverge = [(k, tse_nomes[k][1], ibge_mun[tab[k]][1]) for k in tse_nomes if k in tab and tab[k] in ibge_mun and norm(ibge_mun[tab[k]][1]) != norm(tse_nomes[k][1])]
    print(f"Tabela oficial TSE x IBGE ({rotulo}): códigos TSE sem correspondência {len(sem)}, correspondência fora da API IBGE {len(fora_ibge)}, UF divergente {len(uf_diverge)}, grafia divergente {len(nome_diverge)}")
    for x in nome_diverge:
        print("   grafia:", x)


IDENTIDADES = {
    # Base: leiame.pdf do detalhe da apuração (TSE). Ver docs/coleta-estatistica.md 2.1.
    "concorrentes = validos + anulados + anulados sub judice":
        lambda r: i(r["QT_VOTOS_CONCORRENTES"]) == i(r["QT_TOTAL_VOTOS_VALIDOS"]) + i(r["QT_TOTAL_VOTOS_ANULADOS"]) + i(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]),
    "total de nulos = nulos + nulos tecnicos":
        lambda r: i(r["QT_TOTAL_VOTOS_NULOS"]) == i(r["QT_VOTOS_NULOS"]) + i(r["QT_VOTOS_NULOS_TECNICOS"]),
    "votos = concorrentes + brancos + total de nulos + anulados em apuracao separada":
        lambda r: i(r["QT_VOTOS"]) == i(r["QT_VOTOS_CONCORRENTES"]) + i(r["QT_VOTOS_BRANCOS"]) + i(r["QT_TOTAL_VOTOS_NULOS"]) + i(r["QT_VOTOS_ANULADOS_APU_SEP"]),
    "votos = comparecimento x votos por eleitor":
        lambda r: i(r["QT_VOTOS"]) == i(r["QT_COMPARECIMENTO"]) * votos_por_eleitor(r),
    "comparecimento x votos por eleitor = validos + brancos + nulos + anulados + anulados sub judice + anulados apuracao separada (D59)":
        lambda r: i(r["QT_COMPARECIMENTO"]) * votos_por_eleitor(r) == i(r["QT_TOTAL_VOTOS_VALIDOS"]) + i(r["QT_VOTOS_BRANCOS"]) + i(r["QT_TOTAL_VOTOS_NULOS"]) + i(r["QT_TOTAL_VOTOS_ANULADOS"]) + i(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]) + i(r["QT_VOTOS_ANULADOS_APU_SEP"]),
    "aptos = comparecimento + abstencoes + eleitores de secoes nao instaladas":
        lambda r: i(r["QT_APTOS"]) == i(r["QT_COMPARECIMENTO"]) + i(r["QT_ABSTENCOES"]) + i(r["QT_ELEITORES_SECOES_NAO_INSTALADAS"]),
}


def identidades_completas(pasta, ano):
    """Verifica cada identidade em todas as linhas do arquivo BRASIL, todos os cargos e turnos."""
    arq = next(Path(pasta).glob(f"detalhe_votacao_munzona_{ano}/*BRASIL*.csv"))
    linhas = 0
    falhas = Counter()
    cont = Counter()
    exemplos = {}
    for r in ler_csv(arq):
        linhas += 1
        for nome, f in IDENTIDADES.items():
            if not f(r):
                falhas[nome] += 1
                exemplos.setdefault(nome, (r["SG_UF"], r["CD_MUNICIPIO"], r["NR_ZONA"], r["DS_CARGO"], r["NR_TURNO"]))
        cont["linhas com anulados"] += i(r["QT_TOTAL_VOTOS_ANULADOS"]) > 0
        cont["linhas com anulados sub judice"] += i(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]) > 0
        cont["linhas com as duas categorias"] += i(r["QT_TOTAL_VOTOS_ANULADOS"]) > 0 and i(r["QT_TOTAL_VOTOS_ANUL_SUBJUD"]) > 0
        cont["linhas com apuracao separada > 0"] += i(r["QT_VOTOS_ANULADOS_APU_SEP"]) > 0
        cont["linhas com secoes nao instaladas"] += i(r["QT_ELEITORES_SECOES_NAO_INSTALADAS"]) > 0
        cont["linhas no exterior (UF ZZ)"] += r["SG_UF"] == "ZZ"
    print(f"Identidades completas {ano}: {linhas} linhas")
    for nome in IDENTIDADES:
        print(f"  {'ok' if not falhas[nome] else 'FALHA'}: {nome}" + (f" ({falhas[nome]} linhas; ex. {exemplos[nome]})" if falhas[nome] else ""))
    print("  contagens:", dict(cont))
    return not falhas


def vagas_por_eleicao(pasta, ano):
    arq = next(Path(pasta).glob(f"consulta_vagas_{ano}/*BRASIL*.csv"))
    c = Counter()
    for r in ler_csv(arq):
        c[(r["CD_ELEICAO"], r["DS_ELEICAO"], r["DS_CARGO"])] += 1
    print(f"Vagas {ano} por eleição (CD_ELEICAO, D61):")
    for k, v in sorted(c.items()):
        print("  ", k, v)


def main():
    p_ibge, p_tse = sys.argv[1], sys.argv[2]
    ib = ibge(p_ibge)
    m24, n24 = detalhe(p_tse, 2024, "Vereador")
    detalhe(p_tse, 2024, "Prefeito")
    m22, n22 = detalhe(p_tse, 2022, "Governador")
    m26, n26 = detalhe(p_tse, 2026, "Governador")
    vagas(p_tse, 2022)
    vagas(p_tse, 2024)
    ok = all([identidades_completas(p_tse, a) for a in (2022, 2024, 2026)])
    print("Identidades completas nos três anos:", "ok" if ok else "FALHA")
    vagas_por_eleicao(p_tse, 2024)
    tab = tabela_oficial(p_tse)
    print("Tabela oficial: linhas", len(tab), " IBGE cobertos", len(set(tab.values()) & set(ib)), "de", len(ib))
    for rot, n in (("2022", n22), ("2024", n24), ("2026", n26)):
        cruzar_oficial(tab, ib, n, rot)
    s22, s24, s26 = set(m22), set(m24), set(m26)
    print("Municípios em 2022, 2024, 2026:", len(s22), len(s24), len(s26))
    print("  em 2026 e não em 2024:", sorted(s26 - s24)[:20])
    print("  em 2024 e não em 2026:", sorted(s24 - s26)[:20])
    print("  em 2026 e não em 2022:", sorted(s26 - s22)[:20])


if __name__ == "__main__":
    main()
