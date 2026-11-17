# Manifesto dos arquivos brutos

Arquivos originais, sem alteração. Tratamentos ficam em etapas separadas (`tools/dados/`). A versão é o cabeçalho `Last-Modified` do servidor mais o hash SHA-256: o TSE regera arquivos com frequência, então o mesmo URL pode trazer conteúdo diferente em outra data.

Arquivos em `data/raw/tse/grandes/` (acima de 10 MB) não são versionados no git (`.gitignore`); ficam registrados aqui pelo hash e precisam ser baixados de novo em outro ambiente. Se o hash novo divergir, a versão mudou e a validação deve ser refeita.

| Arquivo | Órgão | Conjunto | URL | Acesso (UTC) | Last-Modified | Formato | Bytes | SHA-256 | No git |
|---|---|---|---|---|---|---|---|---|---|
| `ibge/municipios.json` | IBGE | API de Localidades: municípios | https://servicodados.ibge.gov.br/api/v1/localidades/municipios | 2026-11-17T13:07:25Z | não informado | JSON | 2470036 | `86ecdccdf97d72e7e5e46f0854cfcea8bacc28154cc1bc4ed0e6110e3a6c9c02` | sim |
| `tse/municipio_tse_ibge.zip` | TSE | Códigos oficiais de UF e municípios segundo o TSE e o IBGE | https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip | 2026-11-17T13:07:25Z | não informado | ZIP com CSV (latin-1, ;) | 139054 | `dba4a4a3bfcc34f4fbca827c539c614105b742434542ca2a535d8c0f34101428` | sim |
| `tse/detalhe_votacao_munzona_2022.zip` | TSE | Resultados 2022: detalhe da apuração por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2022.zip | 2026-11-17T13:08:17Z | Tue, 17 Nov 2026 06:53:09 GMT | ZIP com CSV (latin-1, ;) | 4439154 | `f6d1716e87e4af0686f563fa7ca5caa0903481b5df924454f686fb6b99ed4460` | sim |
| `tse/detalhe_votacao_munzona_2024.zip` | TSE | Resultados 2024: detalhe da apuração por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2024.zip | 2026-11-17T13:08:17Z | Mon, 16 Nov 2026 12:39:43 GMT | ZIP com CSV (latin-1, ;) | 1510260 | `c76b586a72af31427c8d202df150156adf4943d24ad34954a20d333f03d6b04f` | sim |
| `tse/detalhe_votacao_munzona_2026.zip` | TSE | Resultados 2026: detalhe da apuração por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2026.zip | 2026-11-17T13:08:18Z | Mon, 16 Nov 2026 22:49:32 GMT | ZIP com CSV (latin-1, ;) | 4184675 | `83b307b262ec81f7a6466407928677ffe645293a86b03d74cf65d6268ce1d103` | sim |
| `tse/consulta_vagas_2022.zip` | TSE | Candidatos 2022: vagas | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2022.zip | 2026-11-17T13:08:19Z | Tue, 17 Nov 2026 06:18:52 GMT | ZIP com CSV (latin-1, ;) | 183998 | `b1b7f831e7e77285bd6cab9839a4008d4fdf937e904c38ec7413e36c28b9543e` | sim |
| `tse/consulta_vagas_2024.zip` | TSE | Candidatos 2024: vagas | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2024.zip | 2026-11-17T13:08:20Z | Tue, 17 Nov 2026 12:26:15 GMT | ZIP com CSV (latin-1, ;) | 579704 | `7b5397baacf0a37f28f4f55042db159240f367e0725e003f0106182d230e33a1` | sim |
| `tse/consulta_cand_2022.zip` | TSE | Candidatos 2022 | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip | 2026-11-17T13:08:21Z | Tue, 17 Nov 2026 06:20:45 GMT | ZIP com CSV (latin-1, ;) | 4442258 | `1eda57728f0980dd1474b2cbd465d95ab4bb2ce7d9aa1e1b4ca9b2fce798f875` | sim |
| `tse/votacao_partido_munzona_2024.zip` | TSE | Resultados 2024: votação em partido por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2024.zip | 2026-11-17T13:08:28Z | Tue, 17 Nov 2026 12:26:09 GMT | ZIP com CSV (latin-1, ;) | 6135093 | `17b3618951de5f51e605914503744dd16eb0494993c20ef25aa1d0aa0f76a89a` | sim |
| `tse/grandes/votacao_partido_munzona_2022.zip` | TSE | Resultados 2022: votação em partido por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2022.zip | 2026-11-17T13:08:55Z | Tue, 17 Nov 2026 06:24:29 GMT | ZIP com CSV (latin-1, ;) | 26276253 | `c49c0706d73c646803af26d7415fc4d63403f6487bf0897302585850d97fa6af` | não |
| `tse/grandes/consulta_cand_2024.zip` | TSE | Candidatos 2024 | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip | 2026-11-17T13:08:57Z | Tue, 17 Nov 2026 12:26:25 GMT | ZIP com CSV (latin-1, ;) | 64653991 | `14e33e2bd85bd01427dc6b8db4f039874235a13746ea3493c021b6e845df1381` | não |
| `tse/grandes/perfil_eleitorado_2024.zip` | TSE | Eleitorado 2024: perfil do eleitorado | https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip | 2026-11-17T17:55:22Z | Fri, 12 Sep 2025 16:47:08 GMT | ZIP com CSV (latin-1, ;) | 333597149 | `fd6703bdaa89aba023b3a21fc1dccede94aa315b985d91011ad5c2e971819de6` | não |
| `tse/grandes/votacao_candidato_munzona_2022.zip` | TSE | Resultados 2022: votação nominal por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2022.zip | 2026-11-17T19:56:27Z | Tue, 17 Nov 2026 07:12:10 GMT | ZIP com CSV (latin-1, ;) | 582274907 | `67e02fc4f47e26a3777412e46c41aa09c012645fbae9762cafade0ddd203530e` | não |
| `tse/grandes/votacao_candidato_munzona_2024.zip` | TSE | Resultados 2024: votação nominal por município e zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2024.zip | 2026-11-17T19:56:20Z | Tue, 17 Nov 2026 12:26:25 GMT | ZIP com CSV (latin-1, ;) | 48245557 | `e2dec50d027a7c1136e81f8e0f68f7ddf2bed66380a72a311c93300625bdbf74` | não |

## Legislação: Senado Federal (metadados)

Fichas da API de dados abertos de legislação do Senado. Contêm identificação, publicações, dispositivos e normas posteriores que alteraram a norma. **Não contêm o texto integral**; o texto está no endereço indicado em `urlDocumento`, em host não aprovado (`normas.leg.br`).

| Arquivo | Órgão | Documento | URL | Acesso (UTC) | Versão (campo `Versao` do serviço) | Formato | Bytes | SHA-256 |
|---|---|---|---|---|---|---|---|---|
| `legislacao/senado/lista_lei_9504_1997.xml` | Senado Federal | lista da Lei 9.504/1997 | https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=LEI&numero=9504&ano=1997 | 2026-11-17T13:16:06Z | 17/11/2026 10:15:18 | XML | 943 | `ab3495ae58eed9b230caed13ea20ad7738a0f996dee4336b4ec6971294f70456` |
| `legislacao/senado/lista_constituicao_1988.xml` | Senado Federal | lista da Constituição de 1988 | https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=CON&ano=1988 | 2026-11-17T13:16:07Z | 17/11/2026 10:15:20 | XML | 864 | `c2c3f3976aab863b8daf8b50d04b2fed1186485cbe9eddeab92d0d37408ed6d1` |
| `legislacao/senado/detalhe_551380_lei_9504_1997.xml` | Senado Federal | ficha da Lei 9.504/1997 (id 551380) | https://legis.senado.leg.br/dadosabertos/legislacao/551380 | 2026-11-17T13:16:09Z | 17/11/2026 10:15:36 | XML | 177125 | `9e79ab413b30e5917d7a3604da7d2108eb709f05fd256e40647a28baf8cc69a5` |
| `legislacao/senado/detalhe_579494_constituicao_1988.xml` | Senado Federal | ficha da Constituição de 1988 (id 579494) | https://legis.senado.leg.br/dadosabertos/legislacao/579494 | 2026-11-17T13:16:11Z | 17/11/2026 10:15:44 | XML | 840578 | `579b012fbd5206b27551f831bb41d789533c13999567bfbd265112fe5c7a2b61` |

## Legislação: normas.leg.br e Câmara (testes sem texto integral)

| Arquivo | Órgão | Documento pedido | URL | Acesso (UTC) | Last-Modified | Resultado | Bytes | SHA-256 |
|---|---|---|---|---|---|---|---|---|
| `legislacao/normas/lei_9504_1997.html` | Senado Federal (normas.leg.br) | Lei 9.504/1997 | https://normas.leg.br/?urn=urn:lex:br:federal:lei:1997-09-30;9504 | 2026-11-17T13:21:34Z | Tue, 10 Nov 2026 23:08:26 GMT | 200; casca da aplicação web, sem o texto da norma; idêntica para as duas URNs | 66002 | `62b0cfdac0b029f66efc6472052103baf9a0f148ade44f56d3e273f02418197d` |
| `legislacao/normas/constituicao_1988.html` | Senado Federal (normas.leg.br) | Constituição de 1988 | https://normas.leg.br/?urn=urn:lex:br:federal:constituicao:1988-10-05;1988 | 2026-11-17T13:21:36Z | Tue, 10 Nov 2026 23:08:26 GMT | 200; casca da aplicação web, sem o texto da norma; idêntica para as duas URNs | 66002 | `62b0cfdac0b029f66efc6472052103baf9a0f148ade44f56d3e273f02418197d` |
| `legislacao/camara/busca_lei_9504_1997.headers.txt` (só cabeçalhos) | Câmara dos Deputados | busca da Lei 9.504/1997 | https://www2.camara.leg.br/busca-portal?contextoBusca=BuscaLegislacao&q=lei+9504+1997 | 2026-11-17T13:21:56Z | não informado | 404, sem redirecionamento | não guardado | não aplicável |

## Admissibilidade temporal para o mundo inicial (D60, histórico)

> A classificação vigente é a da D63, em dois eixos, registrada em `data/fontes.json`. Os blocos abaixo preservam a avaliação feita pela D60 revisada.

Estados: `admissivel` (os dois critérios da D60 comprovados), `admissibilidade_temporal_nao_comprovada` (referência compatível, sem prova de que a versão usada estava disponível até 31/12/2025), `nao_admissivel` (versão publicada ou período representado posterior ao corte), `pendente` (investigação não concluída).

Evidências usadas: catálogo CKAN do TSE (`CATALOGO_TSE_RECURSOS.json`, sem histórico de atividades: a ação `package_activity_list` não existe nesta instância), cabeçalhos HTTP salvos (`*.headers.txt`) e conteúdo interno dos zips (`PROVENIENCIA_ZIPS.json`: data de cada arquivo no zip, SHA-256 descompactado e valores de `DT_GERACAO`). A data de criação do recurso no catálogo não comprova a data de cada versão: o TSE substitui o arquivo no mesmo URL.

### `tse/grandes/perfil_eleitorado_2024.zip`

| Campo | Valor |
|---|---|
| data_referencia | cadastro eleitoral da eleição de 2024 (AA_ELEICAO = 2024) |
| data_publicacao | não comprovada |
| data_versao | 12/09/2025 (`DT_GERACAO`); datas no zip: 2025-09-12 |
| data_acesso | 2026-11-17T17:55:22Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `eleitorado-2024` (Eleitorado - 2024), https://dadosabertos.tse.jus.br/dataset/eleitorado-2024 |
| recurso | Eleitorado - 2024, id `bdf4f7dc-9428-4172-ab1b-15eb55bbe640`; criado no catálogo 2024-07-18; metadados do recurso modificados 2024-07-18; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip (sem redirecionamento) |
| last_modified | Fri, 12 Sep 2025 16:47:08 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 27 arquivos internos |
| tamanho_bytes | 333597149 |
| sha256 | `fd6703bdaa89aba023b3a21fc1dccede94aa315b985d91011ad5c2e971819de6` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão de 12/09/2025 comprovada por três registros concordantes: `Last-Modified` 12/09/2025 16:47:08 GMT, data interna dos 27 CSVs no zip (12/09/2025) e `DT_GERACAO = 12/09/2025` em todas as linhas. Disponibilização pública até 31/12/2025: só indícios (o arquivo servido no URL público não foi modificado desde 12/09/2025, segundo o servidor). Não há registro do catálogo nem histórico de versões que comprove a data de publicação dessa versão. |
| observacoes | Conteúdo de 2024: contagem de eleitores por município igual aos aptos de vereador da eleição ordinária de 2024 (5.569 municípios, 155.912.680). Correção: o commit e9bb2b6 classificou como `admissivel`; pelo critério de que `Last-Modified` e datas de geração não comprovam publicação, a classificação correta é não comprovada. |

### `tse/detalhe_votacao_munzona_2022.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2022 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:17Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `resultados-2022` (Resultados - 2022), https://dadosabertos.tse.jus.br/dataset/resultados-2022 |
| recurso | Detalhe da apuração por município e zona, id `0e59001a-3c9f-4a0d-a8db-7befdba22330`; criado no catálogo 2022-10-07; metadados do recurso modificados 2022-11-05; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2022.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2022.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 06:53:09 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 30 arquivos internos |
| tamanho_bytes | 4439154 |
| sha256 | `f6d1716e87e4af0686f563fa7ca5caa0903481b5df924454f686fb6b99ed4460` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/detalhe_votacao_munzona_2024.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2024 |
| data_publicacao | não comprovada |
| data_versao | 16/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-16 |
| data_acesso | 2026-11-17T13:08:17Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `resultados-2024` (Resultados - 2024), https://dadosabertos.tse.jus.br/dataset/resultados-2024 |
| recurso | Detalhe da apuração por município e zona, id `51f991a5-6431-426c-b3d4-b61bcdcf12ab`; criado no catálogo 2024-10-09; metadados do recurso modificados 2024-10-09; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2024.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2024.zip (sem redirecionamento) |
| last_modified | Mon, 16 Nov 2026 12:39:43 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 28 arquivos internos |
| tamanho_bytes | 1510260 |
| sha256 | `c76b586a72af31427c8d202df150156adf4943d24ad34954a20d333f03d6b04f` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | O campo `QT_APTOS` da eleição ordinária coincide com o perfil do eleitorado de 2024, mas esse perfil também está não comprovado; a coincidência não estabelece admissibilidade. |

### `tse/detalhe_votacao_munzona_2026.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2026 |
| data_publicacao | não comprovada |
| data_versao | 16/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-16 |
| data_acesso | 2026-11-17T13:08:18Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `resultados-2026` (Resultados - 2026), https://dadosabertos.tse.jus.br/dataset/resultados-2026 |
| recurso | Detalhe da apuração por município e zona, id `db2f6a49-a150-42a5-9aca-9ddd16d297f0`; criado no catálogo 2026-10-07; metadados do recurso modificados 2026-10-07; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2026.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2026.zip (sem redirecionamento) |
| last_modified | Mon, 16 Nov 2026 22:49:32 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 30 arquivos internos |
| tamanho_bytes | 4184675 |
| sha256 | `83b307b262ec81f7a6466407928677ffe645293a86b03d74cf65d6268ce1d103` |
| admissibilidade_temporal | `nao_admissivel` |
| evidencia_temporal | Período representado (eleição de 2026) posterior ao corte. |
| observacoes | Uso permitido só em calibração e validação posterior. |

### `tse/grandes/votacao_partido_munzona_2022.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2022 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:55Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `resultados-2022` (Resultados - 2022), https://dadosabertos.tse.jus.br/dataset/resultados-2022 |
| recurso | Votação em partido por município e zona , id `ffb14f0e-85eb-4618-8031-7cb88f95e05e`; criado no catálogo 2022-10-07; metadados do recurso modificados 2022-11-05; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2022.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2022.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 06:24:29 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 30 arquivos internos |
| tamanho_bytes | 26276253 |
| sha256 | `c49c0706d73c646803af26d7415fc4d63403f6487bf0897302585850d97fa6af` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/votacao_partido_munzona_2024.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2024 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:28Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `resultados-2024` (Resultados - 2024), https://dadosabertos.tse.jus.br/dataset/resultados-2024 |
| recurso | Votação em partido por município e zona , id `701610ba-523e-4941-82ee-e25ab475fcbb`; criado no catálogo 2024-10-09; metadados do recurso modificados 2024-10-09; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2024.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2024.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 12:26:09 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 28 arquivos internos |
| tamanho_bytes | 6135093 |
| sha256 | `17b3618951de5f51e605914503744dd16eb0494993c20ef25aa1d0aa0f76a89a` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/consulta_vagas_2022.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2022 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:19Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `candidatos-2022` (Candidatos - 2022), https://dadosabertos.tse.jus.br/dataset/candidatos-2022 |
| recurso | Vagas, id `4cdfbdca-457d-45b8-9c25-e1163ad5215b`; criado no catálogo 2022-07-20; metadados do recurso modificados 2022-07-20; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2022.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2022.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 06:18:52 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 30 arquivos internos |
| tamanho_bytes | 183998 |
| sha256 | `b1b7f831e7e77285bd6cab9839a4008d4fdf937e904c38ec7413e36c28b9543e` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/consulta_vagas_2024.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2024 e suplementares até 2026 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:20Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `candidatos-2024` (Candidatos - 2024), https://dadosabertos.tse.jus.br/dataset/candidatos-2024 |
| recurso | Vagas, id `7258e69e-68ac-4efc-9163-d083302407c8`; criado no catálogo 2024-07-19; metadados do recurso modificados 2024-07-19; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2024.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_vagas/consulta_vagas_2024.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 12:26:15 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 28 arquivos internos |
| tamanho_bytes | 579704 |
| sha256 | `7b5397baacf0a37f28f4f55042db159240f367e0725e003f0106182d230e33a1` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | Contém também eleições suplementares realizadas em 2026 (período posterior ao corte), a separar por `CD_ELEICAO` (D61). |

### `tse/consulta_cand_2022.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2022 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:21Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `candidatos-2022` (Candidatos - 2022), https://dadosabertos.tse.jus.br/dataset/candidatos-2022 |
| recurso | Candidatos, id `435145fd-bc9d-446a-ac9d-273f585a0bb9`; criado no catálogo 2022-07-20; metadados do recurso modificados 2022-07-20; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 06:20:45 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 30 arquivos internos |
| tamanho_bytes | 4442258 |
| sha256 | `1eda57728f0980dd1474b2cbd465d95ab4bb2ce7d9aa1e1b4ca9b2fce798f875` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/grandes/consulta_cand_2024.zip`

| Campo | Valor |
|---|---|
| data_referencia | eleição de 2024 |
| data_publicacao | não comprovada |
| data_versao | 17/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-06, 2026-11-17 |
| data_acesso | 2026-11-17T13:08:57Z |
| orgao | TSE (TSE/AGEL) |
| dataset | `candidatos-2024` (Candidatos - 2024), https://dadosabertos.tse.jus.br/dataset/candidatos-2024 |
| recurso | Candidatos, id `af76c401-0972-4ddf-8ea8-00e310ae53b4`; criado no catálogo 2024-07-19; metadados do recurso modificados 2024-07-19; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip (sem redirecionamento) |
| last_modified | Tue, 17 Nov 2026 12:26:25 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 28 arquivos internos |
| tamanho_bytes | 64653991 |
| sha256 | `14e33e2bd85bd01427dc6b8db4f039874235a13746ea3493c021b6e845df1381` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### `tse/municipio_tse_ibge.zip`

| Campo | Valor |
|---|---|
| data_referencia | tabela de códigos vigente na geração |
| data_publicacao | não comprovada |
| data_versao | 16/11/2026 (`DT_GERACAO`); datas no zip: 2026-11-13, 2026-11-16 |
| data_acesso | 2026-11-17T13:10:33Z |
| orgao | TSE (TSE/SMG) |
| dataset | `codigos-oficiais-de-uf-e-municipios-segundo-o-tse-e-o-ibge` (Códigos oficiais de UF e municípios segundo o TSE e o IBGE), https://dadosabertos.tse.jus.br/dataset/codigos-oficiais-de-uf-e-municipios-segundo-o-tse-e-o-ibge |
| recurso | Códigos oficiais de UF e municípios segundo o TSE e o IBGE, id `c6c767d7-f341-4256-8dff-010683a9c796`; criado no catálogo 2025-06-24; metadados do recurso modificados 2025-06-24; `last_modified` do recurso: não informado |
| url | https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip |
| url_final | https://cdn.tse.jus.br/estatistica/sead/odsele/municipio_tse_ibge/municipio_tse_ibge.zip (sem redirecionamento) |
| last_modified | Mon, 16 Nov 2026 13:26:42 GMT |
| formato | ZIP com CSV (latin-1, separador ;), 2 arquivos internos |
| tamanho_bytes | 139054 |
| sha256 | `dba4a4a3bfcc34f4fbca827c539c614105b742434542ca2a535d8c0f34101428` |
| admissibilidade_temporal | `admissibilidade_temporal_nao_comprovada` |
| evidencia_temporal | Versão regenerada: `DT_GERACAO` e datas internas de novembro de 2026; nenhuma versão anterior ao corte disponível para comparação. |
| observacoes | sem observações |

### Fontes fora do catálogo do TSE

| Arquivo | Estado | Evidência |
|---|---|---|
| `ibge/municipios.json` | `admissibilidade_temporal_nao_comprovada` | API do IBGE sem data de versão (`Last-Modified` ausente); retrata o cadastro vigente na consulta |
| `legislacao/...` | fora do escopo do mundo inicial estatístico | ver `docs/validacao-legal.md` |
