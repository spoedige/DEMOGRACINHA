"""Completude territorial das parcelas D42 e D62 e tratamento das ausências (complemento da D42, item 5).

Unidades esperadas por eleição, cargo e turno, construídas sem depender do próprio conjunto avaliado:
- municípios: tabela oficial TSE x IBGE;
- 2º turno: candidaturas com linha de 2º turno no arquivo de candidaturas (controle independente; o arquivo
  é `integridade_pendente`, por isso é lido só aqui, para conferência, com hash verificado, e nunca alimenta dados);
- exterior: unidade estatística própria nas eleições gerais, só para presidente (D58).

Situações, nunca tratadas igual:
- `completa`;
- `sem_eleicao_propria`: Brasília e Fernando de Noronha nas municipais (D58);
- `ausencia_referencia_historica`: município inexistente na eleição de referência (sem nenhuma unidade na geral de
  2022 e presente na municipal de 2024); recebe taxa da UF, marcada como estimativa, só se o agregado da UF estiver
  completo. A ausência de um cargo ou turno num município que votou é `ausencia_dados_fonte`;
- `ausencia_dados_fonte`: unidade esperada que a fonte não traz; lacuna, sem fallback;
- `bloqueada_*`: a fonte traz a unidade com linhas segregadas, recusadas ou identidade falha; sem fallback;
- `inesperada`: unidade presente no conjunto e não prevista; registrada para investigação.
"""
from collections import defaultdict
from fractions import Fraction

from . import fontes as fx
from .eleicoes import ORDINARIAS

SEM_ELEICAO_MUNICIPAL_IBGE = {"5300108", "2605459"}  # Brasília (DF), Fernando de Noronha (PE)
CARGOS_1T = {
    "municipal": ("Prefeito", "Vereador"),
    "geral": ("Presidente", "Governador", "Senador", "Deputado Federal", "Deputado Estadual"),
}
CANDIDATURAS = {"municipal": "tse_candidatos_2024", "geral": "tse_candidatos_2022"}
_EM_APTOS = ("comparecimento", "abstencoes", "eleitoresSecoesNaoInstaladas")
_EM_VOTOS = ("brancos", "nulos", "anulados", "anuladosSubJudice", "anuladosApuracaoSeparada")


def correspondencia(raiz=fx.RAIZ):
    """Código TSE -> (UF, código IBGE), pela tabela oficial (seleção com hash conferido)."""
    reg = fx.carregar_registro()
    sel = fx.Selecao(reg["tse_ibge_correspondencia"], "mundo_inicial", raiz=raiz, membro_contem="MUNICIPIO_TSE_IBGE")
    return {r["CD_MUNICIPIO_TSE"].zfill(5): (r["SG_UF"], r["CD_MUNICIPIO_IBGE"]) for r in sel}


ANO = {"municipal": 2024, "geral": 2022}


def segundo_turno_de(linhas, ano):
    """(cargo, unidade eleitoral) com candidatura no 2º turno da eleição ordinária do ano (D61)."""
    ordin = ORDINARIAS[ano]
    return {(r["DS_CARGO"].title(), r["SG_UE"]) for r in linhas
            if r["CD_ELEICAO"] in ordin and r["NR_TURNO"] == "2"
            and r["DS_CARGO"].upper() in ("PREFEITO", "GOVERNADOR", "PRESIDENTE")}


def disputas_segundo_turno(tipo, raiz=fx.RAIZ):
    """Disputas de 2º turno da ordinária, pelo arquivo de candidaturas (hash conferido; só para controle)."""
    fonte = fx.carregar_registro()[CANDIDATURAS[tipo]]
    fx.verificar_integridade(fonte, raiz)
    return segundo_turno_de(fx.linhas_csv(fonte, raiz), ANO[tipo])


def _cargo(cargo, uf):
    return "Deputado Distrital" if cargo == "Deputado Estadual" and uf == "DF" else cargo


def unidades_esperadas(tipo, raiz=fx.RAIZ, corr=None, segundo=None):
    """Chave "unidade|cargo|turno" -> UF (ou None para unidade sem eleição própria)."""
    corr = corr if corr is not None else correspondencia(raiz)
    segundo = segundo if segundo is not None else disputas_segundo_turno(tipo, raiz)
    esp = {}
    for tse, (uf, ibge) in corr.items():
        if tipo == "municipal":
            sem = ibge in SEM_ELEICAO_MUNICIPAL_IBGE
            for cargo in CARGOS_1T["municipal"]:
                esp[f"{tse}|{cargo}|1"] = None if sem else uf
            if ("Prefeito", tse) in segundo:
                esp[f"{tse}|Prefeito|2"] = uf
        else:
            for cargo in CARGOS_1T["geral"]:
                esp[f"{tse}|{_cargo(cargo, uf)}|1"] = uf
            if ("Presidente", "BR") in segundo:
                esp[f"{tse}|Presidente|2"] = uf
            if ("Governador", uf) in segundo:
                esp[f"{tse}|Governador|2"] = uf
    if tipo == "geral":
        esp["EXTERIOR|Presidente|1"] = "ZZ"
        if ("Presidente", "BR") in segundo:
            esp["EXTERIOR|Presidente|2"] = "ZZ"
    return esp


def taxas(u):
    """Taxas exatas (numerador e denominador inteiros) de uma unidade ou agregado. Sem arredondamento."""
    out = {}
    for c in _EM_APTOS:
        out[c] = {"numerador": u[c], "denominador": u["aptos"]}
    for c in _EM_VOTOS:
        out[c] = {"numerador": u[c], "denominador": u["denominadorVotos"]}
    for v in out.values():
        if v["denominador"] <= 0:
            raise ValueError("denominador não positivo")
    return out


def avaliar(dados, tipo, municipios_municipais_2024=None, raiz=fx.RAIZ, esperadas=None):
    esperadas = esperadas if esperadas is not None else unidades_esperadas(tipo, raiz)
    unidades = dados["unidades"]
    rel = {"tipo": tipo, "situacoes": defaultdict(int), "estimativas": {}, "lacunas": {}, "bloqueadas": [], "inesperadas": []}
    agregados = defaultdict(lambda: defaultdict(int))
    incompletos = set()
    situacao = {}
    presentes = {k.split("|")[0] for k in unidades}
    for k, uf in esperadas.items():
        _, cargo, turno = k.split("|")
        u = unidades.get(k)
        if uf is None:
            situacao[k] = "sem_eleicao_propria"
            continue
        if u is None:
            mun = k.split("|")[0]
            hist = (tipo == "geral" and municipios_municipais_2024 is not None and mun in municipios_municipais_2024
                    and mun not in presentes and not mun.startswith("EXTERIOR"))
            situacao[k] = "ausencia_referencia_historica" if hist else "ausencia_dados_fonte"
            if not hist:
                incompletos.add((uf, cargo, turno))
            continue
        situacao[k] = u["status"]
        if u["status"] != "completa":
            incompletos.add((uf, cargo, turno))
            continue
        if uf != "ZZ":
            a = agregados[(uf, cargo, turno)]
            for c in _EM_APTOS + _EM_VOTOS + ("aptos", "denominadorVotos"):
                a[c] += u[c]
    for k, s in situacao.items():
        rel["situacoes"][s] += 1
        if s.startswith("bloqueada"):
            rel["bloqueadas"].append(k)
        elif s == "ausencia_dados_fonte":
            rel["lacunas"][k] = "unidade esperada ausente na fonte"
        elif s == "ausencia_referencia_historica":
            _, cargo, turno = k.split("|")
            uf = esperadas[k]
            if (uf, cargo, turno) in incompletos or (uf, cargo, turno) not in agregados:
                rel["lacunas"][k] = "agregado da UF incompleto ou ausente: sem estimativa"
            else:
                rel["estimativas"][k] = {"estimativa": True, "origem": f"taxas da UF {uf}, {cargo}, {turno}º turno",
                                         "taxas": taxas(agregados[(uf, cargo, turno)])}
    rel["inesperadas"] = sorted(set(unidades) - set(esperadas))
    rel["situacoes"] = dict(sorted(rel["situacoes"].items()))
    rel["bloqueadas"].sort()
    rel["esperadas"] = len(esperadas)
    return rel


def valor(taxa):
    """Fração exata de uma taxa, para conferência."""
    return Fraction(taxa["numerador"], taxa["denominador"])
