"""Distribuição inteira por maiores restos (D49, D50, motor-eleitoral.md 4.3).

Determinística: o mesmo total e os mesmos pesos sempre dão o mesmo resultado.
Desempate entre restos iguais pela ordem crescente da chave.
"""
from fractions import Fraction


def maiores_restos(total, pesos):
    """Reparte o inteiro `total` entre as chaves de `pesos`, em proporção aos pesos.

    Pesos devem ser não negativos, com soma positiva. Usa frações exatas para que
    o resultado não dependa de arredondamento de ponto flutuante.
    """
    if total < 0 or int(total) != total:
        raise ValueError("total deve ser inteiro não negativo")
    if not pesos:
        raise ValueError("pesos vazios")
    if any(p < 0 for p in pesos.values()):
        raise ValueError("peso negativo")
    soma = sum(Fraction(p) for p in pesos.values())
    if soma == 0:
        raise ValueError("soma dos pesos é zero")
    exatos = {k: Fraction(p) * total / soma for k, p in pesos.items()}
    base = {k: int(v) for k, v in exatos.items()}
    sobra = total - sum(base.values())
    ordem = sorted(exatos, key=lambda k: (-(exatos[k] - base[k]), k))
    for k in ordem[:sobra]:
        base[k] += 1
    return base
