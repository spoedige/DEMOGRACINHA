"""Registro de fontes (data/fontes.json), leitura dos brutos, seleção por linha e conjuntos intermediários.

Regras que o código impõe (D61, D63):
- o hash do bruto é conferido antes de qualquer leitura; arquivo ausente é erro, nunca "validado";
- cada linha é classificada individualmente; só linhas admissíveis no destino entram no conjunto;
- linhas com integridade pendente ou proveniência não comprovada são segregadas e contadas;
- colunas marcadas como pendentes no registro não podem ser usadas;
- o mundo inicial só recebe conjuntos cuja fonte, hash e seleção são reconferidos contra o registro.
"""
import csv
import hashlib
import io
import json
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path

from . import admissibilidade as adm

RAIZ = Path(__file__).resolve().parents[3]
REGISTRO = RAIZ / "data" / "fontes.json"
_SEGREGAR = ("integridade_pendente", "proveniencia_nao_comprovada")


class FonteAusente(adm.FonteInadmissivel):
    """Arquivo bruto não encontrado: não pode ser tratado como validado."""


def carregar_registro(caminho=REGISTRO):
    dados = json.loads(Path(caminho).read_text(encoding="utf-8"))
    ids = [f["id"] for f in dados["fontes"]]
    if len(ids) != len(set(ids)):
        raise ValueError("identificadores de fonte duplicados no registro")
    for f in dados["fontes"]:
        adm.validar_classificacao(f["temporalidade"], f["proveniencia"])
        for regra in f.get("parcelas", []):
            if "proveniencia" in regra:
                adm.validar_classificacao(f["temporalidade"], regra["proveniencia"])
    return {f["id"]: f for f in dados["fontes"]}


def sha256_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def presente(fonte, raiz=RAIZ):
    return (Path(raiz) / fonte["arquivo"]).exists()


def verificar_integridade(fonte, raiz=RAIZ):
    """Confere o hash do bruto com o registro. Ausência e divergência são erros."""
    caminho = Path(raiz) / fonte["arquivo"]
    if not caminho.exists():
        raise FonteAusente(f"{fonte['id']}: arquivo bruto ausente ({fonte['arquivo']})")
    if sha256_arquivo(caminho) != fonte["sha256"]:
        raise adm.FonteInadmissivel(f"{fonte['id']}: hash do bruto diverge do registro")
    return True


def linhas_csv(fonte, raiz=RAIZ, membro_contem="BRASIL"):
    """Itera as linhas do CSV nacional dentro do zip bruto, sem extrair. Não confere hash (ver `Selecao`)."""
    with zipfile.ZipFile(Path(raiz) / fonte["arquivo"]) as z:
        nome = next(n for n in z.namelist() if membro_contem in n.upper() and n.lower().endswith(".csv"))
        with z.open(nome) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding=fonte.get("codificacao", "latin-1"), newline=""),
                                      delimiter=fonte.get("separador", ";"))


def _data_br(texto):
    d, m, a = texto.split("/")
    return date(int(a), int(m), int(d))


def _normalizar(campo, valor):
    return valor.zfill(5) if campo == "CD_MUNICIPIO" and valor else valor


def classificar_parcela(fonte, linha):
    """Classificação da linha: a da fonte, ajustada pelas regras `parcelas` do registro, em ordem.

    - {"campo_data": "DT_ELEICAO"}: temporalidade pela data do fenômeno na própria linha.
    - {"excluir": {campo: valor}, "proveniencia": ...}: linhas que casam recebem outra proveniência.
      `CD_MUNICIPIO` é comparado com 5 dígitos.
    A data de coleta nunca entra.
    """
    temporalidade, proveniencia = fonte["temporalidade"], fonte["proveniencia"]
    for regra in fonte.get("parcelas", []):
        if "campo_data" in regra:
            valor = linha.get(regra["campo_data"], "")
            temporalidade = adm.temporalidade_por_data(_data_br(valor) if valor else None)
        if "excluir" in regra and all(_normalizar(c, linha.get(c, "")) == _normalizar(c, v) for c, v in regra["excluir"].items()):
            proveniencia = regra["proveniencia"]
    return temporalidade, proveniencia


def colunas_permitidas(fonte, colunas):
    pend = [c for c in colunas if c in fonte.get("colunas_pendentes", {})]
    if pend:
        raise adm.FonteInadmissivel(f"{fonte['id']}: colunas com integridade pendente: {pend}")


class Selecao:
    """Itera só as linhas admissíveis no destino, contando aceitas, recusadas e segregadas com motivo."""

    def __init__(self, fonte, destino, filtro=None, colunas=(), raiz=RAIZ, linhas=None):
        if destino not in adm.DESTINOS:
            raise ValueError(f"destino desconhecido: {destino}")
        colunas_permitidas(fonte, colunas)
        if linhas is None:
            verificar_integridade(fonte, raiz)
            linhas = linhas_csv(fonte, raiz)
        self.fonte, self.destino, self.filtro, self._linhas = fonte, destino, filtro, linhas
        self.aceitas = 0
        self.fora_do_filtro = 0
        self.recusadas = Counter()
        self.segregadas = Counter()
        self.consumida = False

    def __iter__(self):
        for linha in self._linhas:
            if self.filtro is not None and not self.filtro(linha):
                self.fora_do_filtro += 1
                continue
            t, p = classificar_parcela(self.fonte, linha)
            if p in _SEGREGAR:
                self.segregadas[p] += 1
                continue
            if not adm.admissivel(t, p, self.destino):
                self.recusadas[f"{t}/{p}"] += 1
                continue
            self.aceitas += 1
            yield linha
        self.consumida = True

    def contagem(self):
        return {"aceitas": self.aceitas, "fora_do_filtro": self.fora_do_filtro,
                "recusadas": dict(self.recusadas), "segregadas": dict(self.segregadas)}


def sha256_registro(caminho=REGISTRO):
    return sha256_arquivo(caminho)


def intermediario(fonte_id, destino, transformar, filtro=None, colunas=(), raiz=RAIZ, registro=None, nome_filtro=None):
    """Monta um conjunto intermediário a partir das linhas admissíveis.

    `transformar` recebe o iterador de linhas aceitas e devolve os dados. A seleção é consumida por
    inteiro; se `transformar` não consumir tudo, o restante é lido para que a contagem seja completa.
    """
    reg = registro or carregar_registro()
    fonte = reg[fonte_id]
    sel = Selecao(fonte, destino, filtro, colunas, raiz)
    it = iter(sel)
    dados = transformar(it)
    for _ in it:
        pass
    return {
        "meta": {
            "fonte": fonte["id"], "arquivo": fonte["arquivo"], "sha256": fonte["sha256"],
            "temporalidade": fonte["temporalidade"], "proveniencia": fonte["proveniencia"],
            "destino": destino, "colunas_origem": list(colunas), "filtro": nome_filtro,
            "contagem": sel.contagem(), "registro_sha256": sha256_registro() if registro is None else None,
        },
        "dados": dados,
    }


def entrada_mundo_inicial(conjunto, raiz=RAIZ):
    """Única porta de entrada de dados no gerador do mundo inicial.

    Reconfere contra o registro e o arquivo, sem confiar só nos metadados recebidos:
    fonte existente, hash do registro igual ao do conjunto, hash do bruto, classificação da fonte,
    colunas permitidas, destino e seleção por linha efetivamente feita.
    """
    m = conjunto.get("meta", {})
    reg = carregar_registro()
    fonte = reg.get(m.get("fonte"))
    if fonte is None:
        raise adm.FonteInadmissivel(f"fonte desconhecida no registro: {m.get('fonte')}")
    if m.get("sha256") != fonte["sha256"]:
        raise adm.FonteInadmissivel(f"{fonte['id']}: hash do conjunto diverge do registro")
    verificar_integridade(fonte, raiz)
    if m.get("destino") != "mundo_inicial":
        raise adm.FonteInadmissivel(f"{fonte['id']}: conjunto preparado para '{m.get('destino')}', não para o mundo inicial")
    if fonte["proveniencia"] in _SEGREGAR or fonte["temporalidade"] != "historico_compativel" and not fonte.get("parcelas"):
        raise adm.FonteInadmissivel(f"{fonte['id']}: fonte não admissível no mundo inicial pelo registro")
    colunas_permitidas(fonte, m.get("colunas_origem", []))
    contagem = m.get("contagem")
    if not contagem or "aceitas" not in contagem:
        raise adm.FonteInadmissivel(f"{fonte['id']}: conjunto sem registro de seleção por linha")
    return conjunto["dados"]
