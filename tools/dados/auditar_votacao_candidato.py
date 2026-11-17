"""Confronto da votação por candidato com o detalhe da apuração, as candidaturas e as vagas (pipeline-dados.md 8.3).

Só lê os brutos (hash conferido). Não calcula quociente, barreira nem sobras (L1, L2): nos cargos proporcionais
só compara a contagem de eleitos declarada pelo TSE com as vagas. Uso (da raiz):
    python3 -I tools/dados/auditar_votacao_candidato.py 2024 [--json]
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.dados.pipeline import fontes as fx  # noqa: E402
from tools.dados.pipeline.eleicoes import ORDINARIAS  # noqa: E402

ELEITO = ("ELEITO", "ELEITO POR QP", "ELEITO POR MÉDIA")
MAJORITARIOS = ("PREFEITO", "GOVERNADOR", "PRESIDENTE", "SENADOR")
PROPORCIONAIS = ("VEREADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL")
# código da ordinária usado nas vagas (vagas não têm turno): 2º turno -> 1º turno
VAGA_DA_ELEICAO = {"620": "619", "545": "544", "547": "546"}


def i(v):
    return int(v) if v.lstrip("-").isdigit() else 0


def linhas(fonte):
    fx.verificar_integridade(fonte)
    return fx.linhas_csv(fonte)


def auditar(ano, reg=None):
    reg = reg or fx.carregar_registro()
    ordin = ORDINARIAS[ano]
    rel = {"ano": ano}

    # 1. nominais por zona x detalhe da apuração
    nom = Counter()
    com_linhas = set()                       # chaves com ao menos uma linha na votação por candidato
    por_cand = defaultdict(Counter)          # (eleicao, ue, cargo, turno) -> sq -> votos
    sit = {}                                 # (eleicao, ue, cargo, turno, sq) -> situação final
    segundo_vc = set()
    for r in linhas(reg[f"tse_votacao_candidato_{ano}"]):
        if r["CD_ELEICAO"] not in ordin:
            continue
        cargo = r["DS_CARGO"].upper()
        kz = (r["CD_ELEICAO"], r["NR_TURNO"], r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"], cargo)
        nom[kz] += i(r["QT_VOTOS_NOMINAIS_VALIDOS"])
        com_linhas.add(kz)
        k = (r["CD_ELEICAO"], r["SG_UE"], cargo, r["NR_TURNO"])
        por_cand[k][r["SQ_CANDIDATO"]] += i(r["QT_VOTOS_NOMINAIS_VALIDOS"])
        sit[k + (r["SQ_CANDIDATO"],)] = r["DS_SIT_TOT_TURNO"]
        if r["NR_TURNO"] == "2":
            segundo_vc.add((cargo, r["SG_UE"]))
    det = Counter()
    for r in linhas(reg[f"tse_detalhe_apuracao_{ano}"]):
        if r["CD_ELEICAO"] in ordin:
            det[(r["CD_ELEICAO"], r["NR_TURNO"], r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"], r["DS_CARGO"].upper())] += i(r["QT_VOTOS_NOMINAIS_VALIDOS"])
    chaves = set(nom) | set(det)
    dif = sorted((k, nom[k], det[k]) for k in chaves if nom[k] != det[k])
    rel["nominais_x_detalhe"] = {"chaves": len(chaves), "iguais": len(chaves) - len(dif), "divergentes": [
        {"chave": list(k), "votacao_candidato": a, "detalhe": b,
         "situacao": "sem_linhas" if k not in com_linhas else "parcial"} for k, a, b in dif]}

    # 2. segundo turno: votação por candidato x candidaturas
    cand_seg, eleitos_cand = set(), Counter()
    for r in linhas(reg[f"tse_candidatos_{ano}"]):
        if r["CD_ELEICAO"] not in ordin:
            continue
        cargo = r["DS_CARGO"].upper()
        if r["NR_TURNO"] == "2" and cargo in MAJORITARIOS:
            cand_seg.add((cargo, r["SG_UE"]))
        if r["DS_SIT_TOT_TURNO"] in ELEITO:
            eleitos_cand[(VAGA_DA_ELEICAO.get(r["CD_ELEICAO"], r["CD_ELEICAO"]), r["SG_UE"], cargo)] += 1
    rel["segundo_turno"] = {"votacao_candidato": len(segundo_vc), "candidaturas": len(cand_seg),
                            "so_votacao": sorted(segundo_vc - cand_seg), "so_candidaturas": sorted(cand_seg - segundo_vc)}

    # 3. eleitos pela situação final na votação por candidato, por unidade e cargo (turno final)
    final = {}
    for (el, ue, cargo, turno) in por_cand:
        base = (VAGA_DA_ELEICAO.get(el, el), ue, cargo)
        if base not in final or turno > final[base][1]:
            final[base] = ((el, ue, cargo, turno), turno)
    eleitos_vc = Counter()
    mais_votado_ok = Counter()
    empates = []
    for base, (k, _) in final.items():
        sqs = por_cand[k]
        el_sq = [sq for sq in sqs if sit[k + (sq,)] in ELEITO]
        eleitos_vc[base] = len(el_sq)
        if base[2] in MAJORITARIOS and el_sq:
            n = len(el_sq)
            votos_ord = sorted(sqs.values(), reverse=True)
            limite = votos_ord[n - 1]
            empate = len(votos_ord) > n and votos_ord[n] == limite
            acima = {sq for sq in sqs if sqs[sq] > limite}
            empatados = {sq for sq in sqs if sqs[sq] == limite}
            if empate and acima <= set(el_sq) <= acima | empatados:
                mais_votado_ok["empate no limite (desempate por critério legal, não modelado)"] += 1
                empates.append(list(base))
            elif set(el_sq) == acima | (empatados if not empate else set()):
                mais_votado_ok["eleito é o mais votado"] += 1
            else:
                mais_votado_ok["eleito não é o mais votado"] += 1

    # 4. vagas
    vagas = Counter()
    for r in linhas(reg[f"tse_vagas_{ano}"]):
        if r["CD_ELEICAO"] in ordin:
            vagas[(r["CD_ELEICAO"], r["SG_UE"], r["DS_CARGO"].upper())] += i(r["QT_VAGA"])
    grupos = defaultdict(Counter)
    divergencias = []
    for base, v in sorted(vagas.items()):
        cargo = base[2]
        grupo = ("majoritario" if cargo in MAJORITARIOS else "proporcional" if cargo in PROPORCIONAIS
                 else "vice_ou_suplente")
        ev, ec = eleitos_vc.get(base), eleitos_cand.get(base, 0)
        if grupo == "vice_ou_suplente":
            grupos[grupo]["unidades"] += 1
            grupos[grupo]["com eleito nas candidaturas"] += ec > 0
            continue
        grupos[grupo]["unidades"] += 1
        ok_vc = ev == v
        grupos[grupo]["vagas = eleitos (votação por candidato)"] += ok_vc
        grupos[grupo]["vagas = eleitos (candidaturas)"] += ec == v
        if not ok_vc or ec != v:
            divergencias.append({"chave": list(base), "vagas": v, "eleitos_votacao_candidato": ev, "eleitos_candidaturas": ec})
    rel["vagas_x_eleitos"] = {g: dict(c) for g, c in grupos.items()}
    rel["majoritarios_mais_votado"] = dict(mais_votado_ok)
    rel["empates"] = sorted(empates)
    rel["divergencias_vagas"] = divergencias
    return rel


def main():
    ano = int(sys.argv[1])
    rel = auditar(ano)
    if "--json" in sys.argv:
        json.dump(rel, sys.stdout, ensure_ascii=False, indent=1)
        return
    r = dict(rel)
    r["nominais_x_detalhe"] = dict(rel["nominais_x_detalhe"], divergentes=len(rel["nominais_x_detalhe"]["divergentes"]))
    r["divergencias_vagas"] = len(rel["divergencias_vagas"])
    print(json.dumps(r, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
