"""Etapa 1B: UFs, municípios com eleitorado, partidos e federações e FEFC por partido.

Uso, da raiz: python3 -m tools.dados.gerar_mundo
Gera public/data/municipios.json, data/consolidado/partidos.json e data/consolidado/fefc.json.
Fontes em data/fontes.json; nada é estimado. Lacunas ficam marcadas "(a confirmar)".
"""
import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

from tools.dados.pipeline import completude
from tools.dados.pipeline import fontes as fx

RAIZ = fx.RAIZ
CORES = ["#4A5568", "#2C5282", "#285E61", "#744210", "#553C9A", "#2F855A", "#9B2C2C", "#2B6CB0"]  # neutras, só identificação visual


def id_interno(sigla):
    """Sigla fixa interna (CLAUDE.md): maiúsculas ASCII sem espaço. Ids nunca são reutilizados nem renomeados."""
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFKD", sigla) if c.isalnum()).upper()


def _csv(caminho, membro):
    with zipfile.ZipFile(Path(RAIZ) / caminho) as z:
        with z.open(membro) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")


def municipios():
    ibge = json.loads((Path(RAIZ) / "data/raw/ibge/municipios.json").read_text(encoding="utf-8"))
    corr = completude.correspondencia(RAIZ)                    # tse -> (uf, ibge)
    tse_de = {ibge_: tse for tse, (_, ibge_) in corr.items()}
    aptos = completude.aptos_prefeito_2024(RAIZ)               # tse -> aptos, 1º turno de prefeito 2024
    # sem eleição municipal (Brasília e Fernando de Noronha): aptos do 1º turno de presidente 2022
    det = fx.carregar_registro()["tse_detalhe_apuracao_2022"]
    aptos22 = defaultdict(int)
    for r in fx.Selecao(det, "mundo_inicial", lambda x: x["NR_TURNO"] == "1" and x["DS_CARGO"].upper() == "PRESIDENTE", raiz=RAIZ):
        aptos22[r["CD_MUNICIPIO"].zfill(5)] += int(r["QT_APTOS"])
    out, ufs = [], {}
    for m in ibge:
        uf = m["microrregiao"]["mesorregiao"]["UF"] if m.get("microrregiao") else m["regiao-imediata"]["regiao-intermediaria"]["UF"]
        ufs[uf["sigla"]] = {"sigla": uf["sigla"], "nome": uf["nome"], "regiao": uf["regiao"]["nome"]}
        tse = tse_de.get(str(m["id"]))
        if tse in aptos:
            el, ano = aptos[tse], 2024
        elif tse in aptos22:
            el, ano = aptos22[tse], 2022
        else:
            el, ano = None, None
        out.append({"id": str(m["id"]), "nome": m["nome"], "uf": uf["sigla"], "tse": tse, "eleitorado": el, "eleitoradoAno": ano})
    out.sort(key=lambda x: (x["uf"], x["nome"]))
    return sorted(ufs.values(), key=lambda u: u["sigla"]), out


def partidos(caminho, rotulo, ano):
    """Partidos e federações com votos na eleição do arquivo de votação por partido."""
    p, fed = {}, {}
    with zipfile.ZipFile(Path(RAIZ) / caminho) as z:
        for n in z.namelist():
            if not n.endswith(".csv"):
                continue
            for r in csv.DictReader(io.TextIOWrapper(z.open(n), encoding="latin-1", newline=""), delimiter=";"):
                if not r["DT_ELEICAO"].endswith(ano):   # suplementares posteriores ao corte ficam fora (D60 revisada)
                    continue
                p[r["SG_PARTIDO"]] = {"id": id_interno(r["SG_PARTIDO"]), "sigla": r["SG_PARTIDO"], "numero": int(r["NR_PARTIDO"]), "nome": r["NM_PARTIDO"]}
                if r.get("NR_FEDERACAO", "-1") not in ("-1", "", "#NULO#"):
                    membros = sorted(id_interno(x.strip()) for x in r["DS_COMPOSICAO_FEDERACAO"].split("/"))
                    fed[r["SG_FEDERACAO"]] = {"id": "FED_" + "_".join(membros), "sigla": r["SG_FEDERACAO"], "nome": r["NM_FEDERACAO"], "partidos": membros}
    ps = sorted(p.values(), key=lambda x: x["numero"])
    for i, x in enumerate(ps):
        x["cor"] = CORES[i % len(CORES)]
    return {"_fonte": rotulo, "_nota": "Registro de 2024 dentro do corte da D60; mudanças de 2025 (a confirmar contra o registro oficial do TSE).",
            "partidos": ps, "federacoes": sorted(fed.values(), key=lambda x: x["id"])}


def fefc():
    out = {}
    for ano in (2022, 2024):
        v = {}
        for r in _csv(f"data/raw/tse/fefc_fp_{ano}.zip", f"fefc_genero_{ano}.csv"):
            v[id_interno(r["SG_PARTIDO"])] = int(round(float(r["VR_PARTIDO_FEFC"].replace(".", "").replace(",", ".")) * 100))  # centavos
        out[str(ano)] = {"unidade": "centavos", "porPartido": dict(sorted(v.items())), "total": sum(v.values())}
    return out


def main():
    ufs, ms = municipios()
    Path(RAIZ, "public/data/municipios.json").write_text(json.dumps({"_fonte": "IBGE (cadastro de municípios) e TSE (aptos 2024; 2022 onde não há eleição municipal). Ver data/fontes.json.",
        "ufs": ufs, "municipios": ms}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    p24 = partidos("data/raw/tse/votacao_partido_munzona_2024.zip", "votação por partido 2024 (TSE), eleições realizadas em 2024", "2024")
    Path(RAIZ, "data/consolidado/partidos.json").write_text(json.dumps(p24, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    Path(RAIZ, "data/consolidado/fefc.json").write_text(json.dumps(fefc(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("UFs", len(ufs), "municípios", len(ms), "partidos", len(p24["partidos"]), "federações", len(p24["federacoes"]))

if __name__ == "__main__":
    main()
