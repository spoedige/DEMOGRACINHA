# Validação das fontes legais

Branch: `validacao-fontes-legais`, a partir de `main` em `81d80f5`.
Objetivo: verificar as pendências L1 a L35 (`roadmap.md` 7.1) com fonte oficial e evidência documental. Nenhuma pendência é marcada como resolvida sem isso.

## Registro de acesso, 17/11/2026

Teste com `curl -sI`:

| Host | Resultado |
|---|---|
| www.ibge.gov.br | 403 |
| servicodados.ibge.gov.br | 403 |
| www.tse.jus.br | 403 |
| dadosabertos.tse.jus.br | 403 |
| cdn.tse.jus.br | 403 |
| www.planalto.gov.br | 403 |

Diagnóstico: a recusa vem do gateway de rede do ambiente de execução (403 no CONNECT, corpo em texto simples do proxy), não dos sites oficiais. Coleta interrompida conforme a regra do projeto. Nenhum dado foi coletado nem inferido.

## O que falta

| Fonte | Pendências que dependem dela |
|---|---|
| Legislação federal (Constituição, Código Eleitoral, Lei 9.504/1997, Lei 9.096/1995, LC 64/1990), no Planalto | L1, L2, L6, L7, L8, L9, L10, L12, L13, L14, L15, L16, L17, L19, L20, L21, L22, L23, L24, L25, L28, L29, L30, L31, L32, L33, L34, L35 |
| TSE: resoluções de 2026 (calendário, registro, propaganda, arrecadação, prestação de contas, FEFC, federações), Resolução 22.610/2007 | L1, L2, L3, L4, L5, L7, L8, L9, L17, L18, L19, L21, L28, L29, L32, L34, L35 |
| TSE: dados abertos (eleitorado, resultados 2022 e 2024, candidaturas, comparecimento) | dados da 1B; L21; parâmetros fixos de comparecimento (D42) |
| IBGE: lista de municípios e códigos | `municipios.json`; conjunto de agentes (D52) |
| STF: ADI 4650, ADI 5081, decisões sobre sobras | L2, L14, L34, L35 |
| Constituições estaduais, leis orgânicas, regimentos | L11, L16, L23, L25, L26, L27 |

## Próximo passo

Depende do autor: envio dos arquivos oficiais ou liberação desses hosts na rede do ambiente.
