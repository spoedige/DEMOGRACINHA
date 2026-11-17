"""Parcelas de votos por linha do detalhe da apuração, com as categorias do TSE separadas (D59, D62)."""

CAMPOS = {
    "validos": "QT_TOTAL_VOTOS_VALIDOS",
    "brancos": "QT_VOTOS_BRANCOS",
    "nulos": "QT_TOTAL_VOTOS_NULOS",  # inclui nulos técnicos
    "anulados": "QT_TOTAL_VOTOS_ANULADOS",
    "anuladosSubJudice": "QT_TOTAL_VOTOS_ANUL_SUBJUD",
    "anuladosApuracaoSeparada": "QT_VOTOS_ANULADOS_APU_SEP",
}


class IdentidadeViolada(Exception):
    pass


def votos_por_eleitor(linha):
    """Senado: um voto por vaga da UF (2 nas renovações de dois terços: 2018, 2026, 2034). Regra a confirmar (L19)."""
    if linha["DS_CARGO"] == "Senador" and (int(linha["ANO_ELEICAO"]) - 2010) % 8 == 0:
        return 2
    return 1


def parcelas(linha):
    """Devolve as seis parcelas separadas e confere a identidade da D59. Ausência de campo é erro, nunca zero."""
    out = {}
    for nome, campo in CAMPOS.items():
        valor = linha.get(campo)
        if valor is None or valor == "":
            raise KeyError(f"campo ausente: {campo}")
        out[nome] = int(valor)
    total = int(linha["QT_COMPARECIMENTO"]) * votos_por_eleitor(linha)
    if sum(out.values()) != total:
        raise IdentidadeViolada(f"soma das parcelas {sum(out.values())} != comparecimento x votos por eleitor {total}")
    return out
