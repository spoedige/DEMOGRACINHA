"""Identificação das eleições ordinárias (D61). Independente da classificação temporal (D63).

Códigos verificados nos detalhes da apuração (campos CD_ELEICAO, DS_ELEICAO, NM_TIPO_ELEICAO = "Eleição Ordinária"):
- 2022: 544 (federal, 1º turno), 545 (federal, 2º turno), 546 (estadual, 1º turno), 547 (estadual, 2º turno).
- 2024: 619 (municipal, 1º turno), 620 (municipal, 2º turno). Os arquivos de vagas só têm 619 (vagas não têm turno).
Qualquer outro código é eleição suplementar ou extraordinária.
"""

ORDINARIAS = {
    2022: frozenset({"544", "545", "546", "547"}),
    2024: frozenset({"619", "620"}),
}


def filtro_ordinaria(ano):
    """Filtro da eleição ordinária do ano, só por `CD_ELEICAO`, nunca por data, município ou vagas."""
    if ano not in ORDINARIAS:
        raise KeyError(f"códigos da eleição ordinária de {ano} não registrados")
    codigos = ORDINARIAS[ano]

    def filtro(linha):
        return linha["CD_ELEICAO"] in codigos

    filtro.__name__ = f"ordinaria_{ano}"
    return filtro


FILTROS = {f"ordinaria_{ano}": filtro_ordinaria(ano) for ano in ORDINARIAS}
