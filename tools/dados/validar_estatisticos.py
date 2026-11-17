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
        if i(r["QT_COMPARECIMENTO"]) + i(r["QT_ABSTENCOES"]) != i(r["QT_APTOS"]):
            falhas["aptos != comparecimento + abstencoes (zona)"] += 1
    print(f"Detalhe {ano}, cargo {cargo_ref}, 1º turno: municípios {len(mun)}")
    tot = Counter()
    for k, c in mun.items():
        tot.update(c)
        resto = c["QT_COMPARECIMENTO"] - c["QT_TOTAL_VOTOS_VALIDOS"] - c["QT_VOTOS_BRANCOS"] - c["QT_TOTAL_VOTOS_NULOS"]
        if resto != 0:
            falhas["comparecimento != validos + brancos + nulos (município; diferença são votos anulados)"] += 1
        if resto != c["QT_TOTAL_VOTOS_ANULADOS"] + c["QT_TOTAL_VOTOS_ANUL_SUBJUD"] + c["QT_VOTOS_ANULADOS_APU_SEP"]:
            falhas["comparecimento != validos + brancos + nulos + anulados (município)"] += 1
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


def cruzar(ibge_mun, tse_nomes, rotulo):
    idx = defaultdict(list)
    for cod, (uf, nome) in ibge_mun.items():
        idx[(uf, norm(nome))].append(cod)
    casados, sem_par, ambiguos = {}, [], []
    for k, (uf, nome) in tse_nomes.items():
        cand = idx.get((uf, norm(nome)), [])
        if len(cand) == 1:
            casados[k] = cand[0]
        elif not cand:
            sem_par.append((k, uf, nome))
        else:
            ambiguos.append((k, uf, nome, cand))
    ibge_sem_tse = set(ibge_mun) - set(casados.values())
    print(f"Cruzamento TSE x IBGE por UF e nome ({rotulo}): casados {len(casados)}, TSE sem par {len(sem_par)}, ambíguos {len(ambiguos)}, IBGE sem par {len(ibge_sem_tse)}")
    for x in sem_par[:30]:
        print("   TSE sem par:", x)
    for c in sorted(ibge_sem_tse)[:30]:
        print("   IBGE sem par:", c, ibge_mun[c])
    return casados


def main():
    p_ibge, p_tse = sys.argv[1], sys.argv[2]
    ib = ibge(p_ibge)
    m24, n24 = detalhe(p_tse, 2024, "Vereador")
    detalhe(p_tse, 2024, "Prefeito")
    m22, n22 = detalhe(p_tse, 2022, "Governador")
    m26, n26 = detalhe(p_tse, 2026, "Governador")
    vagas(p_tse, 2022)
    vagas(p_tse, 2024)
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
