"""Registro de fontes (data/fontes.json), leitura dos brutos e saídas intermediárias.

Os brutos nunca são extraídos nem alterados: os CSV são lidos direto dos zips.
Toda saída intermediária carrega a classificação de proveniência da fonte e o destino.
"""
import csv
import hashlib
import io
import json
import zipfile
from datetime import date
from pathlib import Path

from . import admissibilidade as adm

RAIZ = Path(__file__).resolve().parents[3]
REGISTRO = RAIZ / "data" / "fontes.json"


def carregar_registro(caminho=REGISTRO):
    dados = json.loads(Path(caminho).read_text(encoding="utf-8"))
    for f in dados["fontes"]:
        adm.validar_classificacao(f["temporalidade"], f["proveniencia"])
    return {f["id"]: f for f in dados["fontes"]}


def sha256_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def verificar_integridade(fonte, raiz=RAIZ):
    """Confere o hash do bruto com o registro. Retorna False se o arquivo não estiver presente."""
    caminho = raiz / fonte["arquivo"]
    if not caminho.exists():
        return False
    if sha256_arquivo(caminho) != fonte["sha256"]:
        raise adm.FonteInadmissivel(f"{fonte['id']}: hash do bruto diverge do registro")
    return True


def linhas_csv(fonte, raiz=RAIZ, membro_contem="BRASIL"):
    """Itera as linhas do CSV nacional dentro do zip bruto, sem extrair."""
    with zipfile.ZipFile(raiz / fonte["arquivo"]) as z:
        nome = next(n for n in z.namelist() if membro_contem in n.upper() and n.lower().endswith(".csv"))
        with z.open(nome) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding=fonte.get("codificacao", "latin-1"), newline=""),
                                      delimiter=fonte.get("separador", ";"))


def _data_br(texto):
    d, m, a = texto.split("/")
    return date(int(a), int(m), int(d))


def classificar_parcela(fonte, linha):
    """Classificação da linha: a da fonte, ou a das regras por parcela do registro.

    Regras por parcela (`parcelas` no registro), avaliadas em ordem:
    - {"campo_data": "DT_ELEICAO"}: temporalidade pela data do fenômeno na linha.
    - {"excluir": {"campo": valor, ...}, "proveniencia": "..."}: linhas que casam recebem outra proveniência.
    """
    temporalidade, proveniencia = fonte["temporalidade"], fonte["proveniencia"]
    for regra in fonte.get("parcelas", []):
        if "campo_data" in regra:
            valor = linha.get(regra["campo_data"], "")
            temporalidade = adm.temporalidade_por_data(_data_br(valor) if valor else None)
        if "excluir" in regra and all(linha.get(c) == v for c, v in regra["excluir"].items()):
            proveniencia = regra["proveniencia"]
    return temporalidade, proveniencia


def intermediario(fonte, destino, dados, colunas_origem):
    """Empacota um conjunto intermediário com metadados de proveniência. Recusa destino inadmissível."""
    adm.exigir(fonte["temporalidade"], fonte["proveniencia"], destino, fonte["id"])
    return {
        "meta": {
            "fonte": fonte["id"],
            "arquivo": fonte["arquivo"],
            "sha256": fonte["sha256"],
            "temporalidade": fonte["temporalidade"],
            "proveniencia": fonte["proveniencia"],
            "destino": destino,
            "colunas_origem": list(colunas_origem),
        },
        "dados": dados,
    }


def entrada_mundo_inicial(conjunto):
    """Única porta de entrada de dados no gerador do mundo inicial."""
    m = conjunto["meta"]
    if m.get("destino") != "mundo_inicial":
        raise adm.FonteInadmissivel(f"{m.get('fonte')}: conjunto preparado para '{m.get('destino')}', não para o mundo inicial")
    adm.exigir(m["temporalidade"], m["proveniencia"], "mundo_inicial", m.get("fonte", ""))
    return conjunto["dados"]
