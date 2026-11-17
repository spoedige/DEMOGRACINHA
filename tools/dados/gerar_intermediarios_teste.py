"""Gera conjuntos intermediários DE TESTE das parcelas D42 e D62 (não são parâmetros do mundo inicial).

Saída em data/intermediario/teste/ (fora do git). Uso (da raiz):
    python3 -I tools/dados/gerar_intermediarios_teste.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ))
from tools.dados.pipeline import completude, conjuntos  # noqa: E402

SAIDA = RAIZ / "data" / "intermediario" / "teste"


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    resumo = {}
    c24 = conjuntos.intermediario("tse_detalhe_apuracao_2024", "mundo_inicial", "parcelas_d42_d62", "ordinaria_2024")
    c22 = conjuntos.intermediario("tse_detalhe_apuracao_2022", "mundo_inicial", "parcelas_d42_d62", "ordinaria_2022")
    mun24 = {k.split("|")[0] for k in c24["dados"]["unidades"]}
    for nome, c, tipo in (("d42_d62_municipal_2024", c24, "municipal"), ("d42_d62_geral_2022", c22, "geral")):
        conjuntos.entrada_mundo_inicial(c)
        rel = completude.avaliar(c["dados"], tipo, mun24 if tipo == "geral" else None)
        texto = conjuntos.canonico({"conjunto": c, "completude": rel})
        (SAIDA / f"{nome}.json").write_text(texto, encoding="utf-8")
        status = Counter(u["status"] for u in c["dados"]["unidades"].values())
        resumo[nome] = {"unidades": len(c["dados"]["unidades"]), "status": dict(status), "contagem": c["meta"]["contagem"],
                        "integridade": c["meta"]["integridade"], "dados_sha256": c["meta"]["dados_sha256"],
                        "esperadas": rel["esperadas"], "completude": rel["situacoes"], "estimativas": sorted(rel["estimativas"]),
                        "lacunas": rel["lacunas"], "inesperadas": rel["inesperadas"],
                        "bytes": len(texto.encode("utf-8"))}
    print(json.dumps(resumo, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
