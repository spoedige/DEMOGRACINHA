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
| `aptos = comparecimento + abstenções + eleitores de seções não instaladas` por zona | ok em todas as linhas dos três anos (ver 2.1) |
| Identidade da D59: `comparecimento × votos por eleitor = válidos + brancos + nulos (com técnicos) + anulados + anulados sub judice + anulados em apuração separada`, por linha | ok em todas as linhas de 2022, 2024 e 2026 (detalhe em 2.1) |

Nota: a soma só de válidos, brancos e nulos não é identidade do TSE; ela deixa de fora as três parcelas anuladas, que aparecem em parte dos municípios. Por isso não é tratada como verificação.
| Municípios com resultado por ano | 2022: 5.570; 2024: 5.569; 2026: 5.571 |

Explicação das contagens por ano, com códigos verificados na tabela oficial:
- 2024 não tem Brasília (DF, sem eleição municipal) nem Fernando de Noronha (distrito estadual, código IBGE 2605459), que votam nas eleições gerais.
- 2022 não tem Boa Esperança do Norte (MT, código IBGE 5101837), cuja primeira eleição foi em 2024.
- Vagas de 2024: a eleição ordinária (`CD_ELEICAO = 619`) tem 5.569 unidades de prefeito, vice e vereador. O arquivo traz também dezenas de eleições suplementares, quase todas para prefeito e vice e 3 para vereador, algumas realizadas em 2025 e 2026. Correção: o relatório anterior falava em 3 suplementares porque contava só vereador. Tratamento pela D61.
- Treze municípios têm grafia diferente no TSE e no IBGE (por exemplo, "Boa Saúde" no TSE e "Januário Cicco" no IBGE, mesmo código). O cruzamento usa sempre a tabela oficial, nunca o nome.

### 2.1 Verificação pelo dicionário oficial

Fonte: `leiame.pdf` incluído no zip oficial do detalhe da apuração de 2024 (`data/raw/tse/detalhe_votacao_munzona_2024.zip`). As relações abaixo foram conferidas em todas as linhas dos arquivos de 2022 (39.982), 2024 (12.493) e 2026 (37.521).

| Relação | Base no dicionário | Verificação nos dados |
|---|---|---|
| `QT_VOTOS_CONCORRENTES = válidos + anulados + anulados sub judice` | "votos nominais e em legenda válidos, anulados sub judice e anulados totalizados" | ok em todas as linhas |
| `QT_TOTAL_VOTOS_NULOS = QT_VOTOS_NULOS + QT_VOTOS_NULOS_TECNICOS` | nulos técnicos descritos como categoria própria | ok em todas as linhas |
| `QT_VOTOS = concorrentes + brancos + total de nulos + anulados em apuração separada` | `QT_VOTOS_ANULADOS_APU_SEP`: "ainda não são votos válidos e nem nulos" | ok em todas as linhas; `APU_SEP` vale 0 em todos os arquivos coletados |
| `QT_VOTOS = QT_COMPARECIMENTO × votos por eleitor` | comparecimento e votos totalizados | ok em todas as linhas, com 2 votos por eleitor para senador em 2026 (6.106 linhas em que os votos são exatamente o dobro do comparecimento). Correção: o relatório anterior dizia que comparecimento e votos eram iguais em todas as linhas, o que não vale para o Senado de 2026 |
| `QT_APTOS = comparecimento + abstenções + eleitores de seções não instaladas` | `QT_ELEITORES_SECOES_NAO_INSTALADAS` é contagem própria | ok; as 89 linhas de 2022 e 80 de 2026 em que aptos não fecham só com comparecimento e abstenções têm diferença exatamente igual a essa contagem, quase todas no exterior (UF "ZZ") |

Conclusão sobre os anulados: o dicionário os descreve como parcelas distintas (anulados pela situação jurídica, anulados sub judice com recurso pendente, anulados em apuração separada), e os dados confirmam que se somam sem dupla contagem. Anulados e anulados sub judice aparecem juntos na mesma linha em parte das zonas (706 em 2022, 140 em 2024, 1.563 em 2026), o que é compatível com parcelas aditivas, porque a soma fecha. A "zona divergente de 2022" registrada antes era uma linha do filtro inicial (governador, 1º turno); no arquivo completo são 89 linhas, todas explicadas por seções não instaladas.

Observação: os arquivos de 2022 e 2026 incluem votação no exterior (UF "ZZ", só para presidente). Não pertence a nenhum município e precisa de tratamento próprio nos totais nacionais.

## 3. Divergências decididas

| Divergência | Decisão |
|---|---|
| 5.570 nos documentos, 5.571 nas fontes, 5.569 com eleição municipal | D58: três conjuntos distintos (cadastro, eleição municipal, unidades estatísticas) |
| Identidade do comparecimento sem os votos anulados | D59: identidade com as seis parcelas do TSE e votos por eleitor |
| Resultados e eleitorado de 2026 | D60 (revisada): dupla temporalidade, referência e disponibilidade pública até 31/12/2025; 2026 só para calibração |
| Eleições suplementares nas vagas | D61: separação por `CD_ELEICAO` |

O script `tools/dados/validar_estatisticos.py` reproduz todas as verificações da seção 2.1, linha a linha, nos três anos.

## 4. Pendências da coleta
- Definir quais arquivos grandes serão necessários e quando baixá-los.
- Retrato do eleitorado até 31/12/2025 (D60): investigado em 17/11/2026, ver seção 5.
- O FEFC e o tempo de TV não foram procurados no catálogo de dados abertos; são frente legal (L4, L8).

## 5. Retrato do eleitorado para o corte de 31/12/2025 (D60)

Consulta ao catálogo de dados abertos do TSE (API CKAN), sem download dos arquivos grandes.

| Conjunto | Recurso criado no catálogo | `Last-Modified` do arquivo | Tamanho | Situação frente ao corte |
|---|---|---|---|---|
| `eleitorado-2024` (perfil do eleitorado 2024) | 18/07/2024 | 12/09/2025 | cerca de 318 MB | data de referência e versão do arquivo anteriores ao corte |
| `eleitorado-atual` | 25/08/2021 | 04/11/2026 | cerca de 81 MB | versão posterior ao corte; conteúdo é o cadastro vigente, sem data fixa; não atende |
| `eleitorado-2026` | 20/07/2026 | (coletado em julho de 2026) | cerca de 390 MB | posterior ao corte; só calibração |

- Não há conjunto de eleitorado de 2025 no catálogo. A busca por "eleitorado 2025" só retorna transferências de eleitorado e requerimentos de alistamento, que não são retrato do cadastro.
- Candidato mais próximo do corte: perfil do eleitorado de 2024, cuja versão atual do arquivo é de 12/09/2025. Não foi baixado.

Questão respondida pela D60 revisada (dupla temporalidade; ver seção 6). Texto original da questão: o corte da D60 se aplica à data de referência do dado ou à data de publicação da versão do arquivo? Os arquivos de detalhe da apuração de 2022 e 2024 já coletados se referem a eleições anteriores ao corte, mas as versões baixadas têm `Last-Modified` de novembro de 2026 (o TSE regera os arquivos). Pela leitura estrita, seriam versões posteriores ao corte, mesmo com conteúdo de 2022 e 2024.

### 5.1 Perfil do eleitorado de 2024: download e verificação, 17/11/2026

- Baixado (cerca de 318 MB, fora do git), registrado no manifesto com hash.
- Evidência da versão: `Last-Modified` de 12/09/2025 16:47 GMT; carimbo interno dos 27 CSVs de 12/09/2025; campo `DT_GERACAO` igual a 12/09/2025 em todas as 17.880.630 linhas do arquivo nacional e dos estaduais. `AA_ELEICAO` igual a 2024 em todas.
- Estrutura: 26 arquivos por UF e um arquivo nacional (`BRASIL`) que repete todas as linhas; somar todos os arquivos conta o eleitorado duas vezes. O tratamento deve usar só o nacional ou só os estaduais.
- Campos: município pelo código TSE, zona, gênero, estado civil, faixa etária, escolaridade, raça e cor, identidade de gênero, quilombola, intérprete de Libras e contagens de eleitores (total, biometria, deficiência, nome social).
- Cobertura: 5.569 municípios, todos com correspondência na tabela oficial TSE x IBGE. Ausentes Brasília e Fernando de Noronha, que não tiveram eleição municipal em 2024.
- Conteúdo de 2024 sem informação posterior: a contagem de eleitores por município é igual, nos 5.569 municípios, aos aptos de vereador da eleição ordinária de 2024 (total 155.912.680 nos dois).
- Estado: `admissibilidade_temporal_nao_comprovada` (corrigido na seção 6; a classificação `admissivel` do commit e9bb2b6 não se sustenta pelo critério da D60). Não incorporado ao mundo inicial.

## 6. Investigação temporal (D60), 17/11/2026

### 6.1 Critério
D60 revisada (`decisoes.md`): o dado entra no mundo inicial só se a data de referência e a disponibilidade pública, naquela versão ou em conteúdo comprovadamente equivalente, forem até 31/12/2025.

| Data | Significado | Onde aparece |
|---|---|---|
| Referência | período ou fenômeno representado | conteúdo (ano da eleição, `AA_ELEICAO`) |
| Publicação | quando aquela versão ficou disponível ao público | não há registro oficial por versão no catálogo do TSE |
| Versão | quando aquela versão foi gerada ou modificada | `DT_GERACAO`, data interna no zip, `Last-Modified` |
| Acesso | quando baixamos | `*.accessed.txt` |

### 6.2 Fatos comprovados
- O catálogo CKAN do TSE não expõe histórico de atividades (`package_activity_list` não existe nesta instância). As fichas de recurso não têm `last_modified`; a data de criação e a de modificação dos metadados são de quando o recurso foi cadastrado (2022, 2024 ou 2025), não de cada versão do arquivo. Fichas salvas em `data/raw/CATALOGO_TSE_RECURSOS.json`.
- O TSE substitui o arquivo no mesmo URL. Não há URL de versão anterior.
- Conteúdo interno dos zips (`data/raw/PROVENIENCIA_ZIPS.json`, gerado por `tools/dados/proveniencia.py`): os arquivos de apuração, vagas, candidaturas, votação por partido e a tabela TSE x IBGE têm `DT_GERACAO` e datas internas de novembro de 2026. O perfil do eleitorado de 2024 tem `DT_GERACAO` e datas internas de 12/09/2025.
- Hashes SHA-256 de todos os brutos conferidos contra o manifesto: todos iguais.

### 6.3 Indícios (não comprovam publicação)
- Perfil do eleitorado de 2024: o servidor informa `Last-Modified` de 12/09/2025, e os registros de geração do conteúdo têm a mesma data. Indica que o arquivo servido no URL público não mudou desde então, mas não é registro oficial de publicação.

### 6.4 Classificação
| Fonte | Estado | Motivo |
|---|---|---|
| Perfil do eleitorado 2024 | `admissibilidade_temporal_nao_comprovada` | versão de 12/09/2025 comprovada; publicação até o corte só com indícios |
| Apuração 2022 e 2024 (detalhe e votação por partido) | `admissibilidade_temporal_nao_comprovada` | versões regeneradas em novembro de 2026; sem versão histórica para comparar |
| Vagas e candidaturas 2022 e 2024 | `admissibilidade_temporal_nao_comprovada` | idem; vagas de 2024 incluem suplementares de 2026 |
| Tabela TSE x IBGE | `admissibilidade_temporal_nao_comprovada` | versão de 16/11/2026 |
| Lista de municípios do IBGE | `admissibilidade_temporal_nao_comprovada` | API sem data de versão |
| Apuração 2026 | `nao_admissivel` | período posterior ao corte; só calibração |

Nenhuma fonte coletada está `admissivel` hoje. Pela D60, nenhuma pode alimentar o mundo inicial.

### 6.5 Comparação histórica
Não realizada: não há versão anterior ao corte acessível pelos hosts aprovados. A comparação foi feita só entre fontes coletadas (perfil de 2024 e aptos de 2024, iguais município a município), o que mostra coerência interna, não equivalência com versão publicada até o corte.

### 6.6 Limitações e o que resolveria
- Comprovar publicação até o corte exigiria registro externo datado: cópia arquivada do arquivo ou da página do catálogo anterior a 31/12/2025 (por exemplo, em serviço de arquivamento da web), ou documento oficial do TSE que date a versão. Qualquer um desses exige host novo e aprovação.
- Sem isso, vale o cenário D do prompt de execução: lacuna registrada, sem substituição por versão posterior e sem estimativa.

### 6.7 Utilidade dos campos (só registro)
- Perfil do eleitorado de 2024: eleitorado por município, zona e perfil demográfico; suficiente para o retrato territorial (eleitorado por município e conjunto de agentes da D52), se vier a ser admissível.
- Detalhe da apuração: parcelas de comparecimento e votos da D59 e taxas da D62.
