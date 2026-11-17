"""Admissibilidade das fontes por destino (D60 e D63).

Dois eixos independentes:

- temporalidade do fenômeno representado:
  historico_compativel | posterior_ao_corte | temporalidade_nao_comprovada
- proveniência da versão utilizada:
  publicacao_historica_comprovada | versao_posterior_validada |
  proveniencia_nao_comprovada | integridade_pendente

Destinos: "mundo_inicial" e "calibracao". O mundo inicial só aceita fenômeno
historicamente compatível com o corte e versão com publicação comprovada ou conteúdo
validado. A calibração aceita também fenômeno posterior ao corte, mas não aceita
proveniência não comprovada, integridade pendente nem temporalidade não comprovada.
"""
from datetime import date

CORTE = date(2025, 12, 31)

TEMPORALIDADE = ("historico_compativel", "posterior_ao_corte", "temporalidade_nao_comprovada")
PROVENIENCIA = ("publicacao_historica_comprovada", "versao_posterior_validada",
                "proveniencia_nao_comprovada", "integridade_pendente")
DESTINOS = ("mundo_inicial", "calibracao")

_PROVENIENCIA_UTILIZAVEL = ("publicacao_historica_comprovada", "versao_posterior_validada")


class FonteInadmissivel(Exception):
    """Fonte ou parcela recusada para o destino pedido."""


def temporalidade_por_data(data_fenomeno):
    """Classifica o eixo temporal só pela data do fenômeno. A data de coleta não entra."""
    if data_fenomeno is None:
        return "temporalidade_nao_comprovada"
    return "historico_compativel" if data_fenomeno <= CORTE else "posterior_ao_corte"


def validar_classificacao(temporalidade, proveniencia):
    if temporalidade not in TEMPORALIDADE:
        raise ValueError(f"temporalidade desconhecida: {temporalidade}")
    if proveniencia not in PROVENIENCIA:
        raise ValueError(f"proveniência desconhecida: {proveniencia}")


def admissivel(temporalidade, proveniencia, destino):
    validar_classificacao(temporalidade, proveniencia)
    if destino not in DESTINOS:
        raise ValueError(f"destino desconhecido: {destino}")
    if proveniencia not in _PROVENIENCIA_UTILIZAVEL:
        return False
    if destino == "mundo_inicial":
        return temporalidade == "historico_compativel"
    return temporalidade in ("historico_compativel", "posterior_ao_corte")


def exigir(temporalidade, proveniencia, destino, rotulo=""):
    """Interrompe o fluxo se a fonte ou parcela não for admissível no destino."""
    if not admissivel(temporalidade, proveniencia, destino):
        raise FonteInadmissivel(
            f"{rotulo or 'fonte'}: temporalidade={temporalidade}, proveniencia={proveniencia}, destino={destino}")
