"""Completude territorial das parcelas D42 e D62 e tratamento das ausências (D42, item 4.5).

Situações distintas, nunca tratadas igual:
- `sem_eleicao_propria`: unidade sem eleição daquele tipo (Brasília e Fernando de Noronha nas municipais, D58).
- `ausencia_referencia_historica`: o município não existia na eleição de referência (inferido: ausente na
  eleição geral de 2022 e presente na municipal de 2024). Recebe a taxa da UF, marcada como estimativa.
- `ausencia_dados_fonte`: o município existia, mas a fonte não traz a unidade. Lacuna, sem fallback.
- `bloqueada_*`: a fonte traz a unidade, mas com linhas segregadas, recusadas ou identidade falha. Sem fallback.
"""
from collections import defaultdict

from . import fontes as fx

SEM_ELEICAO_MUNICIPAL_IBGE = {"5300108", "2605459"}  # Brasília (DF), Fernando de Noronha (PE)
CARGOS = {
    "municipal": ("Prefeito", "Vereador"),
    "geral": ("Presidente", "Governador", "Senador", "Deputado Federal", "Deputado Estadual"),
}
_PARCELAS = ("comparecimento", "abstencoes", "eleitoresSecoesNaoInstaladas", "aptos",
             "validos", "brancos", "nulos", "anulados", "anuladosSubJudice", "anuladosApuracaoSeparada")


def correspondencia(raiz=fx.RAIZ):
    """Código TSE -> (UF, código IBGE), pela tabela oficial (seleção com hash conferido)."""
    reg = fx.carregar_registro()
    sel = fx.Selecao(reg["tse_ibge_correspondencia"], "mundo_inicial", raiz=raiz, membro_contem="MUNICIPIO_TSE_IBGE")
    return {r["CD_MUNICIPIO_TSE"].zfill(5): (r["SG_UF"], r["CD_MUNICIPIO_IBGE"]) for r in sel}


def avaliar(dados, tipo, municipios_municipais_2024=None, raiz=fx.RAIZ):
    """Classifica cada (município, cargo, 1º turno) esperado e calcula o fallback pela UF quando cabível."""
    corr = correspondencia(raiz)
    unidades = dados["unidades"]
    relatorio = {"tipo": tipo, "situacoes": defaultdict(int), "estimativas": {}, "lacunas": [], "bloqueadas": []}
    soma_uf = defaultdict(lambda: defaultdict(int))
    for k, u in unidades.items():
        if u.get("status") == "completa" and not k.startswith("EXTERIOR"):
            _, cargo, turno = k.split("|")
            for c in _PARCELAS:
                soma_uf[(u["uf"], cargo, turno)][c] += u[c]
            soma_uf[(u["uf"], cargo, turno)]["denominadorVotos"] += u["denominadorVotos"]
    for tse, (uf, ibge) in sorted(corr.items()):
        for cargo in CARGOS[tipo]:
            cargo_uf = "Deputado Distrital" if (cargo == "Deputado Estadual" and uf == "DF") else cargo
            k = f"{tse}|{cargo_uf}|1"
            u = unidades.get(k)
            if tipo == "municipal" and ibge in SEM_ELEICAO_MUNICIPAL_IBGE:
                relatorio["situacoes"]["sem_eleicao_propria"] += 1
                continue
            if u is None:
                if tipo == "geral" and municipios_municipais_2024 is not None and tse in municipios_municipais_2024:
                    relatorio["situacoes"]["ausencia_referencia_historica"] += 1
                    ref = soma_uf.get((uf, cargo_uf, "1"))
                    if ref:
                        relatorio["estimativas"][k] = dict(ref, estimativa=True, origem=f"taxa da UF {uf}, {cargo_uf}, 1º turno")
                    else:
                        relatorio["lacunas"].append(k)
                else:
                    relatorio["situacoes"]["ausencia_dados_fonte"] += 1
                    relatorio["lacunas"].append(k)
            elif u["status"] != "completa":
                relatorio["situacoes"][u["status"]] += 1
                relatorio["bloqueadas"].append(k)
            else:
                relatorio["situacoes"]["completa"] += 1
    relatorio["situacoes"] = dict(sorted(relatorio["situacoes"].items()))
    return relatorio
