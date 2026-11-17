"""Conjuntos intermediários com integridade verificável e porta de entrada do mundo inicial.

Integridade (detecção de adulteração acidental ou inconsistência, sem criptografia):
- `dados_sha256`: SHA-256 da serialização canônica dos dados (JSON com chaves ordenadas).
- `registro_sha256` e `fonte_registro_sha256`: estado do registro e da entrada da fonte na geração.
- `integridade`: SHA-256 da serialização canônica de todo o metadado.
A entrada do mundo inicial reconfere tudo e, além disso, reexecuta a transformação registrada sobre a
seleção validada e compara o resultado: o conteúdo precisa ser exatamente o que a seleção produz.
"""
import hashlib
import json

from . import admissibilidade as adm
from . import fontes as fx
from .eleicoes import FILTROS
from .transformacoes import TRANSFORMACOES

VERSAO_CONJUNTO = 1


def canonico(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def _executar(fonte, destino, transformacao, filtro, raiz):
    if transformacao not in TRANSFORMACOES:
        raise adm.FonteInadmissivel(f"transformação não registrada: {transformacao}")
    if filtro is not None and filtro not in FILTROS:
        raise adm.FonteInadmissivel(f"filtro não registrado: {filtro}")
    t = TRANSFORMACOES[transformacao]
    sel = fx.Selecao(fonte, destino, FILTROS[filtro] if filtro else None, t["colunas"], raiz, chave=t.get("chave"))
    dados = t["fn"](sel)
    if not sel.consumida:
        raise RuntimeError(f"{transformacao} não consumiu a seleção inteira")
    return dados, sel


def intermediario(fonte_id, destino, transformacao, filtro=None, raiz=fx.RAIZ, registro=fx.REGISTRO):
    reg = fx.carregar_registro(registro)
    fonte = reg[fonte_id]
    dados, sel = _executar(fonte, destino, transformacao, filtro, raiz)
    t = TRANSFORMACOES[transformacao]
    meta = {
        "versao_conjunto": VERSAO_CONJUNTO,
        "fonte": fonte["id"], "arquivo": fonte["arquivo"], "sha256": fonte["sha256"],
        "fonte_registro_sha256": _sha(canonico(fonte)), "registro_sha256": fx.sha256_arquivo(registro),
        "temporalidade": fonte["temporalidade"], "proveniencia": fonte["proveniencia"],
        "destino": destino, "transformacao": transformacao, "transformacao_versao": t["versao"],
        "colunas_origem": list(t["colunas"]), "filtro": filtro, "contagem": sel.contagem(),
        "dados_sha256": _sha(canonico(dados)),
    }
    meta["integridade"] = _sha(canonico(meta))
    return {"meta": meta, "dados": dados}


def verificar(conjunto, destino, raiz=fx.RAIZ, registro=fx.REGISTRO, reproduzir=True):
    """Reconfere metadados, conteúdo, registro, bruto e, se `reproduzir`, refaz a transformação."""
    m = dict(conjunto.get("meta") or {})
    integ = m.pop("integridade", None)
    if integ is None or _sha(canonico(m)) != integ:
        raise adm.FonteInadmissivel("metadado do conjunto alterado (integridade não confere)")
    if _sha(canonico(conjunto.get("dados"))) != m.get("dados_sha256"):
        raise adm.FonteInadmissivel("conteúdo do conjunto alterado (dados_sha256 não confere)")
    if fx.sha256_arquivo(registro) != m.get("registro_sha256"):
        raise adm.FonteInadmissivel("registro de fontes mudou depois da geração do conjunto")
    reg = fx.carregar_registro(registro)
    fonte = reg.get(m.get("fonte"))
    if fonte is None:
        raise adm.FonteInadmissivel(f"fonte desconhecida no registro: {m.get('fonte')}")
    if _sha(canonico(fonte)) != m.get("fonte_registro_sha256") or m.get("sha256") != fonte["sha256"]:
        raise adm.FonteInadmissivel(f"{fonte['id']}: identidade da fonte diverge do registro")
    fx.verificar_integridade(fonte, raiz)
    if m.get("destino") != destino:
        raise adm.FonteInadmissivel(f"{fonte['id']}: conjunto preparado para '{m.get('destino')}', não para '{destino}'")
    t = TRANSFORMACOES.get(m.get("transformacao"))
    if t is None or t["versao"] != m.get("transformacao_versao"):
        raise adm.FonteInadmissivel("transformação ausente ou de outra versão")
    fx.colunas_permitidas(fonte, m.get("colunas_origem", []))
    if reproduzir:
        dados, sel = _executar(fonte, destino, m["transformacao"], m.get("filtro"), raiz)
        if _sha(canonico(dados)) != m["dados_sha256"] or sel.contagem() != m["contagem"]:
            raise adm.FonteInadmissivel(f"{fonte['id']}: o conteúdo não é o que a seleção validada produz")
    return conjunto["dados"]


def entrada_mundo_inicial(conjunto, raiz=fx.RAIZ, registro=fx.REGISTRO):
    """Única porta de entrada de dados no gerador do mundo inicial."""
    m = conjunto.get("meta") or {}
    reg = fx.carregar_registro(registro)
    fonte = reg.get(m.get("fonte"))
    if fonte is not None and (fonte["proveniencia"] in fx._SEGREGAR or
                              fonte["temporalidade"] != "historico_compativel" and not fonte.get("parcelas")):
        raise adm.FonteInadmissivel(f"{fonte['id']}: fonte não admissível no mundo inicial pelo registro")
    return verificar(conjunto, "mundo_inicial", raiz, registro)
