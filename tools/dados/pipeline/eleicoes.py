"""Identificação das eleições ordinárias (D61). Independente da classificação temporal (D63)."""

ORDINARIAS = {2024: "619"}  # eleição municipal ordinária de 2024; outros anos: a registrar com evidência


def filtro_ordinaria(ano):
    """Filtro de linhas da eleição ordinária do ano, por `CD_ELEICAO`, nunca por data, município ou vagas."""
    if ano not in ORDINARIAS:
        raise KeyError(f"código da eleição ordinária de {ano} não registrado")
    codigo = ORDINARIAS[ano]

    def filtro(linha):
        return linha["CD_ELEICAO"] == codigo

    filtro.__name__ = f"ordinaria_{ano}"
    return filtro
