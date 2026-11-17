"""Evidência de proveniência dos brutos: conteúdo interno dos zips.

Para cada zip, lista os arquivos internos com data registrada no zip, tamanho,
SHA-256 do conteúdo descompactado e os valores distintos de DT_GERACAO (CSV do TSE).
Só lê os brutos. Saída em JSON no stdout. Uso:

    python3 -I tools/dados/proveniencia.py data/raw/tse/*.zip data/raw/tse/grandes/*.zip
"""
import csv
import hashlib
import io
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path


def membro(z, info):
    h = hashlib.sha256()
    geracao = Counter()
    with z.open(info) as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    if info.filename.lower().endswith(".csv"):
        with z.open(info) as f:
            leitor = csv.reader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")
            cab = next(leitor, [])
            if "DT_GERACAO" in cab:
                k = cab.index("DT_GERACAO")
                for linha in leitor:
                    if len(linha) > k:
                        geracao[linha[k]] += 1
    return {
        "arquivo": info.filename,
        "data_no_zip": "%04d-%02d-%02d %02d:%02d:%02d" % info.date_time,
        "bytes": info.file_size,
        "sha256": h.hexdigest(),
        "dt_geracao": dict(geracao),
    }


def main():
    saida = {}
    for caminho in sys.argv[1:]:
        p = Path(caminho)
        with zipfile.ZipFile(p) as z:
            itens = [membro(z, i) for i in z.infolist() if not i.is_dir()]
        datas = sorted({i["data_no_zip"][:10] for i in itens})
        geracoes = sorted({d for i in itens for d in i["dt_geracao"]})
        saida[p.name] = {"membros": itens, "datas_no_zip": datas, "dt_geracao_distintas": geracoes}
    json.dump(saida, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
