"""Transformações registradas. Cada uma recebe a `Selecao` (só linhas admissíveis) e devolve dados JSON.

Registro: nome -> {"fn", "versao", "colunas", "chave"}. Mudar o comportamento exige nova versão.
"""
from .votos import votos_por_eleitor

TRANSFORMACOES = {}


def registrar(nome, versao, colunas, chave=None):
    def dec(fn):
        TRANSFORMACOES[nome] = {"fn": fn, "versao": versao, "colunas": tuple(colunas), "chave": chave}
        return fn
    return dec


def unidade_cargo_turno(r):
    """Unidade estatística eleitoral (D58): município pelo código TSE; exterior como unidade própria."""
    unidade = "EXTERIOR" if r["SG_UF"] == "ZZ" else r["CD_MUNICIPIO"].zfill(5)
    return f"{unidade}|{r['DS_CARGO']}|{r['NR_TURNO']}"


@registrar("municipios_distintos", 1, ("CD_MUNICIPIO",))
def municipios_distintos(sel):
    return sorted({r["CD_MUNICIPIO"].zfill(5) for r in sel})


_CONTAGENS = {
    "aptos": "QT_APTOS",
    "comparecimento": "QT_COMPARECIMENTO",
    "abstencoes": "QT_ABSTENCOES",
    "eleitoresSecoesNaoInstaladas": "QT_ELEITORES_SECOES_NAO_INSTALADAS",
    "validos": "QT_TOTAL_VOTOS_VALIDOS",
    "brancos": "QT_VOTOS_BRANCOS",
    "nulos": "QT_TOTAL_VOTOS_NULOS",
    "anulados": "QT_TOTAL_VOTOS_ANULADOS",
    "anuladosSubJudice": "QT_TOTAL_VOTOS_ANUL_SUBJUD",
    "anuladosApuracaoSeparada": "QT_VOTOS_ANULADOS_APU_SEP",
}
_VOTOS = ("validos", "brancos", "nulos", "anulados", "anuladosSubJudice", "anuladosApuracaoSeparada")


@registrar("parcelas_d42_d62", 1,
           ("SG_UF", "CD_MUNICIPIO", "DS_CARGO", "NR_TURNO", "CD_ELEICAO", "ANO_ELEICAO") + tuple(_CONTAGENS.values()),
           chave=unidade_cargo_turno)
def parcelas_d42_d62(sel):
    """Numeradores e denominadores inteiros das parcelas D42 e D62 por unidade × cargo × turno.

    Soma só zonas do mesmo cargo e turno (aptos e comparecimento nunca são somados entre cargos).
    Denominadores: aptos (comparecimento, abstenção, seções não instaladas) e
    `comparecimento × votosPorEleitor` (brancos, nulos com técnicos e as três parcelas anuladas).
    Status da unidade: `completa`; `bloqueada_inconsistencia` (identidade falha);
    `bloqueada_segregada` (a fonte tem linhas segregadas da unidade); `bloqueada_recusada` (a unidade tem
    linhas recusadas no destino). Unidade bloqueada não recebe taxa nem fallback.
    """
    acc = {}
    for r in sel:
        k = unidade_cargo_turno(r)
        a = acc.get(k)
        if a is None:
            a = acc[k] = {c: 0 for c in _CONTAGENS}
            a["uf"] = r["SG_UF"]
            a["votosPorEleitor"] = votos_por_eleitor(r)
            a["cdEleicao"] = set()
        for c, campo in _CONTAGENS.items():
            a[c] += int(r[campo])
        a["cdEleicao"].add(r["CD_ELEICAO"])
    unidades = {}
    for k in sorted(set(acc) | sel.unidades_segregadas | sel.unidades_recusadas):
        a = acc.get(k)
        if a is None:
            unidades[k] = {"status": "bloqueada_segregada" if k in sel.unidades_segregadas else "bloqueada_recusada"}
            continue
        u = {c: a[c] for c in _CONTAGENS}
        u.update(uf=a["uf"], votosPorEleitor=a["votosPorEleitor"], cdEleicao=sorted(a["cdEleicao"]))
        u["denominadorEleitorado"] = a["aptos"]
        u["denominadorVotos"] = a["comparecimento"] * a["votosPorEleitor"]
        if k in sel.unidades_segregadas:
            u["status"] = "bloqueada_segregada"
        elif k in sel.unidades_recusadas:
            u["status"] = "bloqueada_recusada"
        elif (sum(a[c] for c in _VOTOS) != u["denominadorVotos"]
              or a["aptos"] != a["comparecimento"] + a["abstencoes"] + a["eleitoresSecoesNaoInstaladas"]):
            u["status"] = "bloqueada_inconsistencia"
        else:
            u["status"] = "completa"
        unidades[k] = u
    return {"chave": "unidade|cargo|turno", "unidades": unidades}
