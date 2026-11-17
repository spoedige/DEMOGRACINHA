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

## 7. Plano de recuperação de evidências históricas (aguarda aprovação)

Objetivo: obter registro externo datado de que a versão de cada arquivo estava disponível publicamente até 31/12/2025. Resultado esperado: matriz de evidências, não reclassificação por suposição.

### 7.1 Serviço e host
Um único serviço: Internet Archive (Wayback Machine), host `web.archive.org`. Não usar outros serviços de arquivamento nesta etapa.

### 7.2 Método
O índice CDX do Wayback registra, para cada captura, data e hora, código HTTP, tipo e o resumo SHA-1 do conteúdo capturado (em base32). Comparar esse resumo com o SHA-1 do arquivo que temos responde, sem baixar a cópia, se a captura anterior ao corte tem conteúdo idêntico ao nosso.

Requisições, em ordem, uma por conjunto, sempre filtradas até 31/12/2025 (`to=20251231`):
1. CDX do URL direto do arquivo, por exemplo `https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip&to=20251231&output=json`.
2. CDX da página do conjunto no catálogo (`dadosabertos.tse.jus.br/dataset/<nome>`), só como evidência secundária de que o recurso estava anunciado.

Leitura dos resultados:
| Achado | Efeito |
|---|---|
| Captura do arquivo até o corte com SHA-1 igual ao nosso | evidência forte de equivalência; candidato a `admissivel`, com a captura registrada no manifesto |
| Captura do arquivo até o corte com SHA-1 diferente | versão nossa diferente da publicada até o corte; registrar; a cópia arquivada pode ser avaliada como fonte em etapa própria |
| Só captura da página do catálogo | indício de anúncio, não de conteúdo; continua não comprovada |
| Nenhuma captura | lacuna registrada |

Ordem de prioridade: perfil do eleitorado 2024; detalhe da apuração 2024; detalhe da apuração 2022; votação por partido 2022 e 2024; candidaturas e vagas 2022 e 2024; tabela TSE x IBGE.

Fora desta etapa: baixar cópias arquivadas (só com nova aprovação e se o CDX indicar captura útil); qualquer outro host.

### 7.3 SHA-1 dos brutos (para comparação com o CDX)
| Arquivo | SHA-1 (hex) | SHA-1 (base32, formato do CDX) |
|---|---|---|
| `tse/consulta_cand_2022.zip` | `7745be84e4a56726cf654a05713c8ad001d5e395` | `O5C35BHEUVTSNT3FJICXCPEK2AA5LY4V` |
| `tse/consulta_vagas_2022.zip` | `b316498e91918c82be3c94d89ab2ba0f53b57045` | `WMLETDURSGGIFPR4STMJVMV2B5J3K4CF` |
| `tse/consulta_vagas_2024.zip` | `cfe977ef6493e96d31490696c33d86a0d2328d41` | `Z7UXP33ESPUW2MKJA2LMGPMGUDJDFDKB` |
| `tse/detalhe_votacao_munzona_2022.zip` | `fe429da20d173d05b6342469d266e0d3db939bfc` | `7ZBJ3IQNC46QLNRUERU5EZXA2PNZHG74` |
| `tse/detalhe_votacao_munzona_2024.zip` | `4dbe25fcc453aef41fc13183b002fc40b3dfc907` | `JW7CL7GEKOXPIH6BGGB3AAX4ICZ57SIH` |
| `tse/detalhe_votacao_munzona_2026.zip` | `6a6db7af1e39f4da12079f5143583208691ea938` | `NJW3PLY6HH2NUEQHT5IUGWBSBBUR5KJY` |
| `tse/grandes/consulta_cand_2024.zip` | `4e5aa5e8e35019522e5b0761abdbf5eb58f8e601` | `JZNKL2HDKAMVELS3A5Q2XW7V5NMPRZQB` |
| `tse/grandes/perfil_eleitorado_2024.zip` | `d4e1d23a2cc8cddbc583dd7e79035b2a0762a1e0` | `2TQ5EORMZDG5XRMD3V7HSA23FIDWFIPA` |
| `tse/grandes/votacao_partido_munzona_2022.zip` | `1852a3d1803e41ca2b3b5e894e23058c05f28348` | `DBJKHUMAHZA4UKZ3L2EU4IYFRQC7FA2I` |
| `tse/municipio_tse_ibge.zip` | `d0210197bfca8c7d30817924dc862177d38f9790` | `2AQQDF57ZKGH2MEBPESNZBRBO7JY7F4Q` |
| `tse/votacao_partido_munzona_2024.zip` | `4ee445f3886e95af7abb3f428274dd0a24cba5c1` | `J3SEL44IN2K266V3H5BIE5G5BISMXJOB` |

### 7.4 Tabela TSE x IBGE (investigação separada)
Hipótese a testar depois: reconstruir a correspondência a partir de fontes admissíveis individualmente, sem depender da versão atual da tabela. Com o que temos, não é possível: os arquivos do TSE trazem só o código TSE, e a API do IBGE não tem data de versão. Fica pendente de fonte.

### 7.5 Execução, 17/11/2026: bloqueada

`web.archive.org` foi incluído pelo autor na rede do ambiente. O proxy passou a aceitar o túnel (antes respondia 403), mas a conexão cai na negociação TLS: o túnel até a saída da rede fecha cerca de 10 segundos depois de enviada a abertura TLS, e a conexão retorna reiniciada (`ws_closed_mid_exchange`, código 1006, 39 bytes recebidos). Cinco tentativas, mesmo resultado. Nenhuma consulta CDX foi respondida, nenhum resultado foi obtido e nenhuma classificação mudou. A causa não está identificada: pode ser recusa do próprio Internet Archive a conexões vindas da rede de saída deste ambiente ou falha da rede de saída.

Consultas preparadas (podem ser abertas num navegador comum; a resposta é JSON e não baixa nenhuma cópia arquivada):

| Conjunto | Consulta CDX do arquivo | Consulta CDX da página do catálogo |
|---|---|---|
| `perfil_eleitorado_2024.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fperfil_eleitorado%2Fperfil_eleitorado_2024.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Feleitorado-2024&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `detalhe_votacao_munzona_2024.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fdetalhe_votacao_munzona%2Fdetalhe_votacao_munzona_2024.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fresultados-2024&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `detalhe_votacao_munzona_2022.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fdetalhe_votacao_munzona%2Fdetalhe_votacao_munzona_2022.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fresultados-2022&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `votacao_partido_munzona_2022.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fvotacao_partido_munzona%2Fvotacao_partido_munzona_2022.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fresultados-2022&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `votacao_partido_munzona_2024.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fvotacao_partido_munzona%2Fvotacao_partido_munzona_2024.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fresultados-2024&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `consulta_cand_2022.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fconsulta_cand%2Fconsulta_cand_2022.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fcandidatos-2022&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `consulta_cand_2024.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fconsulta_cand%2Fconsulta_cand_2024.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fcandidatos-2024&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `consulta_vagas_2022.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fconsulta_vagas%2Fconsulta_vagas_2022.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fcandidatos-2022&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `consulta_vagas_2024.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fconsulta_vagas%2Fconsulta_vagas_2024.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fcandidatos-2024&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |
| `municipio_tse_ibge.zip` | https://web.archive.org/cdx/search/cdx?url=cdn.tse.jus.br%2Festatistica%2Fsead%2Fodsele%2Fmunicipio_tse_ibge%2Fmunicipio_tse_ibge.zip&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength | https://web.archive.org/cdx/search/cdx?url=dadosabertos.tse.jus.br%2Fdataset%2Fcodigos-oficiais-de-uf-e-municipios-segundo-o-tse-e-o-ibge&to=20251231&output=json&fl=timestamp%2Coriginal%2Cmimetype%2Cstatuscode%2Cdigest%2Clength |

## 8. Fontes no GitHub: auditoria de aproveitamento, 17/11/2026

Estratégia definida pelo autor: GitHub como caminho principal para localizar e obter dados; Internet Archive só para lacunas pontuais. Espelho no GitHub não prova admissibilidade pela D60. Nenhuma classificação mudou e nenhum dado de jogo foi gerado.

Repositórios lidos por clone raso, fora do repositório do projeto, sem executar código deles:
- `adrianogpena/minha-bancada`, commit `0cd975762338ff032869a04820ab4d86a76f1a00` (17/11/2026).
- `basedosdados/pipelines`, commit `c921822ace9bf4f6603fab234e1b5d838daec68f` (12/11/2026), só `models/br_tse_eleicoes`.

Comparação reproduzível: `tools/dados/comparar_minha_bancada.py` (só leitura), contra os brutos oficiais já coletados.

### 8.1 Minha Bancada: comparação com os brutos oficiais

| Conjunto derivado | Comparado com | Resultado | Lacunas e divergências |
|---|---|---|---|
| `dados/municipios_ibge.json` | tabela oficial TSE x IBGE | 5.571 pares, todos iguais | O changelog diz que foi refeito em 18/10/2026 por ligação UF + nome, com 14 grafias ajustadas à mão; coincide com a tabela oficial, mas não é fonte independente nem anterior ao corte |
| `dados/tse/eleitorado/2024/<UF>.json` | aptos de vereador, 1º turno, eleição ordinária 2024 | total igual nos 5.569 municípios (155.912.680) | as somas por gênero, faixa etária e escolaridade não fecham com o total em cerca de 1.000 municípios por recorte (gênero: 1.034; faixa etária: 875; escolaridade: 986); provável omissão de categorias como "não informado" (não verificado no código do projeto) |
| `dados/tse/disputa/2024/<UF>.json` | detalhe da apuração 2024 (eleição ordinária) | 11.138 linhas (cargo, turno, município); aptos, comparecimento, abstenções e brancos iguais em 11.102 | 36 linhas misturam eleição ordinária e suplementar (exemplo: Oiapoque, AP, prefeito: 47.174 aptos no derivado = 24.120 da ordinária + 23.054 da suplementar), contra a D61; 58 linhas com válidos diferentes porque os votos anulados foram somados aos válidos (exemplo: município 28037, AL, vereador: 11.760 = 9.864 válidos + 1.896 anulados), contra a D59 e a D62; não há as três parcelas anuladas (presentes no TSE em 1.502 linhas); 51 linhas sem correspondência na eleição ordinária |
| `dados/tse/partidos/2024/<UF>.json` | votação por partido 2024 (vereador, eleição ordinária) | 49.672 pares (município, sigla) comparados: posição 0 igual ao total de votos de legenda em 49.646, posição 1 igual aos nominais válidos em 49.619 | 1 par sem correspondência. Correção: o relatório anterior falava em 5.179 pares sem correspondência; a causa era minha comparação, que não normalizava o código do município (o arquivo oficial de votação por partido grava o código sem zeros à esquerda) |

Temporalidade: os dados de eleitorado e de votos por partido entraram no repositório em outubro de 2026 (changelog). Os commits não comprovam disponibilidade até 31/12/2025. Os dados vêm dos mesmos arquivos do TSE que já temos, regenerados depois do corte.

### 8.2 Base dos Dados (`basedosdados/pipelines`)

- O repositório traz código e metodologia; os dados tratados ficam no BigQuery da Base dos Dados, fora do GitHub. Consultá-los exige credencial do BigQuery (não configurada nesta sessão).
- Cobertura documentada (`code/DEPENDENCIES.md`): detalhe da votação por município e zona, perfil do eleitorado por município e zona, vagas, candidatos, resultados por partido e por candidato, de 1994 (ou ano inicial de cada tabela) a 2024.
- `detalhes_votacao_municipio` só tem válidos, brancos e nulos; não preserva as três parcelas anuladas da D59 e da D62.
- Utilidade: referência de tratamento (ETL) e de dicionário; não substitui os brutos para a D59, a D61 e a D62.

### 8.3 Matriz de aproveitamento

| Necessidade | Minha Bancada | Base dos Dados | Brutos oficiais coletados |
|---|---|---|---|
| Correspondência TSE x IBGE | igual à oficial | não avaliado | tabela oficial |
| Eleitorado por município 2024 | total igual; recortes incompletos | tabela disponível no BigQuery | perfil 2024 (versão de 12/09/2025) |
| Comparecimento e parcelas da D59 | incompleto e com mistura de eleições | incompleto (sem anulados) | completo |
| Vagas da eleição ordinária | mistura suplementares em parte | tabela de vagas | completo, com `CD_ELEICAO` |
| Votos por partido | quase igual, com lacunas sem explicação | tabela disponível no BigQuery | completo |
| Prova de disponibilidade até 31/12/2025 | não | não avaliado | não (ver seção 6) |

Conclusão: os dois repositórios confirmam a consistência dos brutos que já temos, mas não os substituem nem resolvem a D60. Para os parâmetros da D59, D61 e D62, o tratamento precisa partir dos brutos oficiais.

## 9. Revisão temporal (D63) e pipeline, 17/11/2026

- A D63 separa a temporalidade do fenômeno da proveniência da versão. Classificação vigente em `data/fontes.json`; arquitetura e especificação em `docs/pipeline-dados.md`.
- Nova validação entre fontes: na votação por partido, nominais mais total de legenda igualam os válidos do detalhe da apuração em todas as 39.982 chaves de 2022 e em 12.455 de 12.493 chaves de 2024. As 38 restantes ficam como parcela com integridade pendente.
- Achado de normalização: `CD_MUNICIPIO` na votação por partido não tem zeros à esquerda (8.034 linhas em 2024 e 45.241 em 2022); o pipeline normaliza para 5 dígitos.
