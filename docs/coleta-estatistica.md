# Coleta estatística (IBGE e TSE)

Frente separada da validação legal (`validacao-legal.md`). Dados estatísticos não resolvem nenhuma pendência L1 a L35.

Branch: `validacao-fontes-legais`. Início: 17/11/2026.

## 1. Arquivos coletados

Lista completa, com URL, órgão, conjunto, data de acesso, versão (`Last-Modified` e SHA-256), formato e tamanho: `data/raw/MANIFESTO.md`.

| Fonte | Conteúdo | Uso previsto |
|---|---|---|
| IBGE, API de Localidades | 5.571 municípios com código de 7 dígitos | identificador estável de município (D13) |
| TSE, tabela oficial TSE x IBGE | correspondência entre os códigos das duas bases | cruzamento sem depender de grafia |
| TSE, detalhe da apuração por município e zona (2022, 2024, 2026) | aptos, comparecimento, abstenção, válidos, brancos, nulos, anulados | eleitorado por município; parâmetros fixos de comparecimento (D42) |
| TSE, vagas (2022, 2024) | vagas por cargo e unidade | vagas de vereador por município |
| TSE, candidatos (2022, 2024) | candidaturas registradas | número de candidatos por lista (5.3, L21) |
| TSE, votação em partido por município e zona (2022, 2024) | votos por partido | identificação partidária inicial (1B) |

Os brutos ficam em `data/raw/`, sem alteração. Arquivos acima de 10 MB ficam fora do git e são identificados pelo hash.

Não coletados nesta rodada, por tamanho, até haver necessidade: perfil do eleitorado 2026 (cerca de 390 MB), votação nominal por município e zona (2022 cerca de 555 MB; 2024 cerca de 46 MB).

## 2. Validação

Script: `tools/dados/validar_estatisticos.py`. Só lê os brutos e imprime o relatório; não gera dados para o jogo.

| Verificação | Resultado |
|---|---|
| Códigos IBGE únicos e com 7 dígitos | ok, 5.571 |
| 27 UFs; DF com um único município | ok |
| Tabela oficial TSE x IBGE cobre todos os códigos da API do IBGE | ok, 5.571 de 5.571, sem UF divergente |
| Todo código TSE presente nos resultados de 2022, 2024 e 2026 tem correspondência oficial | ok |
| `aptos = comparecimento + abstenções` por zona | ok, exceto uma zona em 2022 (a investigar) |
| `comparecimento = válidos + brancos + nulos + anulados` por município | ok em 2022, 2024 e 2026 |
| `comparecimento = válidos + brancos + nulos`, sem anulados | falha em 1.240 municípios (vereador 2024), 264 (prefeito 2024), 1.633 (governador 2022) e 1.398 (governador 2026) |
| Municípios com resultado por ano | 2022: 5.570; 2024: 5.569; 2026: 5.571 |

Explicação das contagens por ano, com códigos verificados na tabela oficial:
- 2024 não tem Brasília (DF, sem eleição municipal) nem Fernando de Noronha (distrito estadual, código IBGE 2605459), que votam nas eleições gerais.
- 2022 não tem Boa Esperança do Norte (MT, código IBGE 5101837), cuja primeira eleição foi em 2024.
- Vagas de 2024 têm 5.572 unidades de vereador: 5.569 da eleição ordinária mais 3 eleições suplementares. O tratamento deve filtrar a eleição ordinária.
- Treze municípios têm grafia diferente no TSE e no IBGE (por exemplo, "Boa Saúde" no TSE e "Januário Cicco" no IBGE, mesmo código). O cruzamento usa sempre a tabela oficial, nunca o nome.

## 3. Divergências com os documentos, para decisão do autor

1. **Número de municípios.** Os documentos dizem 5.570. As fontes oficiais coletadas têm 5.571 (inclui Boa Esperança do Norte). Têm eleição municipal 5.569. Afeta `regras-e-mundo.md` 4, `motor-eleitoral.md` 9, `roadmap.md` 2 e os testes 70 e 86.
2. **Votos anulados.** `motor-eleitoral.md` 4.2.1 define `comparecimento = validos + brancos + nulos`. Os dados oficiais têm uma quarta parcela: votos anulados (inclusive anulados sub judice e em apuração separada). Sem ela, a conta não fecha em parte dos municípios.
3. **Resultados de 2026 já publicados.** O jogo começa em 01/01/2026 e simula a eleição de 2026. Os resultados reais de 2026 estão disponíveis (arquivo coletado). Pela regra de `roadmap.md` 4, só podem entrar em `calibration-targets.json`, nunca no mundo inicial. O snapshot de eleitorado de 2026 previsto na D52 pode vir dos aptos de 2026; falta decidir se o uso do eleitorado de 2026 no mundo inicial é aceitável, já que é dado posterior à data de início.

## 4. Pendências da coleta
- Investigar a zona de 2022 em que `aptos ≠ comparecimento + abstenções`.
- Definir quais arquivos grandes serão necessários e quando baixá-los.
- O FEFC e o tempo de TV não foram procurados no catálogo de dados abertos; são frente legal (L4, L8).
