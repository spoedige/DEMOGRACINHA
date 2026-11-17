"""Cobertura de fontes por zona contra o detalhe da apuração (referência validada) e conferência do arquivo nacional.

- `cobertura_por_zona`: para cada (eleição, turno, município, zona, cargo) da eleição ordinária, compara a soma de
  votos nominais válidos da fonte com o detalhe da apuração; distingue `sem_linhas` (a fonte não tem nenhuma linha da
  zona) de `parcial` (tem linhas, com soma diferente). Propaga para a unidade município × cargo × turno, no formato
  de `transformacoes.unidade_cargo_turno`.
- `conferir_nacional`: compara o arquivo nacional (BRASIL) de um zip com os demais arquivos do mesmo zip, linha a
  linha, por multiconjunto (contagem e hash agregado de cada linha sem os campos de geração), mais a soma de votos.
"""
import csv
import hashlib
import io
import zipfile
from collections import Counter
from pathlib import Path

from . import fontes as fx
from .eleicoes import ORDINARIAS

_GERACAO = ("DT_GERACAO", "HH_GERACAO")


def _chave_zona(r):
    return (r["CD_ELEICAO"], r["NR_TURNO"], r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"], r["DS_CARGO"].upper())


def _unidade(r_or_k, cargo_original=None):
    el, turno, mun, zona, cargo = r_or_k
    return f"{mun}|{cargo_original or cargo.title()}|{turno}"


def cobertura_por_zona(fonte_id, ano, campo="QT_VOTOS_NOMINAIS_VALIDOS", raiz=fx.RAIZ):
    reg = fx.carregar_registro()
    ordin = ORDINARIAS[ano]
    fonte = reg[fonte_id]
    fx.verificar_integridade(fonte, raiz)
    soma, presentes, cargo_original = Counter(), set(), {}
    for r in fx.linhas_csv(fonte, raiz):
        if r["CD_ELEICAO"] in ordin:
            k = _chave_zona(r)
            soma[k] += int(r[campo])
            presentes.add(k)
            cargo_original[k[4]] = r["DS_CARGO"]
    ref = Counter()
    det = reg[f"tse_detalhe_apuracao_{ano}"]
    for r in fx.Selecao(det, "calibracao", lambda x: x["CD_ELEICAO"] in ordin, raiz=raiz):
        k = _chave_zona(r)
        ref[k] += int(r[campo])
        cargo_original.setdefault(k[4], r["DS_CARGO"])
    zonas = {}
    for k in sorted(set(ref) | set(soma)):
        if soma[k] == ref[k] and (k in presentes or ref[k] == 0):
            continue
        zonas[k] = {"situacao": "sem_linhas" if k not in presentes else "parcial", "fonte": soma[k], "detalhe": ref[k]}
    unidades = {}
    for k, z in zonas.items():
        u = _unidade(k, cargo_original.get(k[4]))
        unidades.setdefault(u, {"zonas_sem_linhas": [], "zonas_parciais": []})
        unidades[u]["zonas_sem_linhas" if z["situacao"] == "sem_linhas" else "zonas_parciais"].append(k[3])
    return {"zonas": zonas, "unidades": unidades, "chaves_referencia": len(ref)}


def _linha_sem_geracao(campos, indices):
    return "\x1f".join(v for j, v in enumerate(campos) if j not in indices)


def conferir_nacional(fonte_id, campo_votos="QT_VOTOS_NOMINAIS_VALIDOS", raiz=fx.RAIZ):
    fonte = fx.carregar_registro()[fonte_id]
    fx.verificar_integridade(fonte, raiz)
    acc = {"nacional": [0, 0, 0], "estaduais": [0, 0, 0]}   # linhas, hash agregado, votos
    membros = {"nacional": [], "estaduais": []}
    with zipfile.ZipFile(Path(raiz) / fonte["arquivo"]) as z:
        for nome in sorted(n for n in z.namelist() if n.lower().endswith(".csv")):
            grupo = "nacional" if "BRASIL" in nome.upper() else "estaduais"
            membros[grupo].append(nome)
            with z.open(nome) as f:
                leitor = csv.reader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")
                cab = next(leitor)
                ign = {cab.index(c) for c in _GERACAO if c in cab}
                iv = cab.index(campo_votos)
                a = acc[grupo]
                for campos in leitor:
                    a[0] += 1
                    h = hashlib.blake2b(_linha_sem_geracao(campos, ign).encode("utf-8"), digest_size=8).digest()
                    a[1] = (a[1] + int.from_bytes(h, "big")) % (1 << 64)
                    a[2] += int(campos[iv])
    return {"membros": membros, "nacional": acc["nacional"], "estaduais": acc["estaduais"],
            "iguais": acc["nacional"] == acc["estaduais"] and bool(membros["nacional"])}
