"""Registro de fontes (data/fontes.json), leitura dos brutos e seleção por linha.

Conjuntos intermediários e porta de entrada do mundo inicial: `conjuntos.py`.

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
    """Itera só as linhas admissíveis no destino, contando aceitas, recusadas e segregadas com motivo.

    Sempre lê o bruto oficial depois de conferir o hash. Linhas fornecidas de fora só pela interface de
    testes `Selecao.sintetica`, que recusa identificadores de fontes do registro.
    `chave(linha)`, se informada, identifica a unidade de cada linha; as unidades com linha segregada ou
    recusada ficam em `unidades_segregadas` e `unidades_recusadas`.
    """

    def __init__(self, fonte, destino, filtro=None, colunas=(), raiz=RAIZ, chave=None, membro_contem="BRASIL"):
        verificar_integridade(fonte, raiz)
        self._preparar(fonte, destino, filtro, colunas, chave, linhas_csv(fonte, raiz, membro_contem))

    def _preparar(self, fonte, destino, filtro, colunas, chave, linhas):
        if destino not in adm.DESTINOS:
            raise ValueError(f"destino desconhecido: {destino}")
        colunas_permitidas(fonte, colunas)
        self.fonte, self.destino, self.filtro, self.chave, self._linhas = fonte, destino, filtro, chave, linhas
        self.sintetica_ = False
        self.aceitas = 0
        self.fora_do_filtro = 0
        self.recusadas = Counter()
        self.segregadas = Counter()
        self.unidades_segregadas = set()
        self.unidades_recusadas = set()
        self.consumida = False

    @classmethod
    def sintetica(cls, fonte, destino, linhas, filtro=None, colunas=(), chave=None):
        """Só para testes. A fonte precisa ter id iniciado por "sintetica_" e não existir no registro."""
        if not str(fonte.get("id", "")).startswith("sintetica_"):
            raise ValueError("fonte sintética precisa de id iniciado por 'sintetica_'")
        if fonte["id"] in carregar_registro():
            raise ValueError("id de fonte sintética coincide com fonte do registro")
        sel = cls.__new__(cls)
        sel._preparar(fonte, destino, filtro, colunas, chave, iter(linhas))
        sel.sintetica_ = True
        return sel

    def __iter__(self):
        for linha in self._linhas:
            if self.filtro is not None and not self.filtro(linha):
                self.fora_do_filtro += 1
                continue
            t, p = classificar_parcela(self.fonte, linha)
            if p in _SEGREGAR:
                self.segregadas[p] += 1
                if self.chave:
                    self.unidades_segregadas.add(self.chave(linha))
                continue
            if not adm.admissivel(t, p, self.destino):
                self.recusadas[f"{t}/{p}"] += 1
                if self.chave:
                    self.unidades_recusadas.add(self.chave(linha))
                continue
            self.aceitas += 1
            yield linha
        self.consumida = True

    def contagem(self):
        return {"aceitas": self.aceitas, "fora_do_filtro": self.fora_do_filtro,
                "recusadas": dict(sorted(self.recusadas.items())), "segregadas": dict(sorted(self.segregadas.items()))}
