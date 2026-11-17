# Pipeline de dados estatísticos

Fonte única das regras de admissibilidade: D60 e D63 (`decisoes.md`). Registro de fontes legível por máquina: `data/fontes.json`. Código: `tools/dados/pipeline/`. Testes: `tests/test_pipeline_dados.py` (`python3 -m unittest discover -s tests -v`).

## 1. Etapas

| # | Etapa | Onde | Estado |
|---|---|---|---|
| 1 | Fonte oficial | TSE (catálogo CKAN e CDN), IBGE (API de localidades) | identificadas |
| 2 | Arquivo bruto | `data/raw/`, nunca alterado; grandes fora do git (`.gitignore`) | coletados |
| 3 | Validação estrutural | `tools/dados/proveniencia.py`, `fontes.verificar_integridade` (hash) | implementada |
| 4 | Validação estatística | `tools/dados/validar_estatisticos.py` (D59 por linha), `votos.parcelas` | implementada |
| 5 | Normalização de códigos | tabela oficial TSE x IBGE; código TSE com 5 dígitos (`zfill(5)`) | regra definida; aplicação na etapa 6 |
| 6 | Transformação e agregação | por conjunto (seção 3) | especificada, não implementada |
| 7 | Parâmetros temporais e de proveniência | `admissibilidade.py`, `fontes.classificar_parcela` | implementada |
| 8 | Conjuntos intermediários | `fontes.intermediario` (metadados de proveniência e destino) | implementada, sem conjuntos gerados |
| 9 | Calibração do motor | consome intermediários de destino `calibracao` | não iniciada |
| 10 | Mundo inicial | só por `fontes.entrada_mundo_inicial` | não iniciada |

## 2. Separação entre calibração e mundo inicial

Verificável por código, não só por convenção (revisão de 17/11/2026):
- `carregar_registro` rejeita estados fora da lista, identificadores duplicados e proveniência inválida nas regras de parcela.
- `fontes.Selecao(fonte, destino, filtro, colunas, chave)` confere o hash do bruto antes de ler (ausente: `FonteAusente`; divergente: `FonteInadmissivel`), recusa colunas pendentes e classifica cada linha. Entrega só linhas admissíveis no destino; segrega `integridade_pendente` e `proveniencia_nao_comprovada`; recusa as inadmissíveis (por exemplo `posterior_ao_corte` no mundo inicial, `temporalidade_nao_comprovada`). Conta cada caso com o motivo e, se `chave` for informada, registra as unidades com linha segregada ou recusada. Não aceita linhas de fora: a única exceção é `Selecao.sintetica`, só para testes, que exige id iniciado por `sintetica_` e ausente do registro.
- Filtros e transformações têm nome e versão registrados (`eleicoes.FILTROS`, `transformacoes.TRANSFORMACOES`). A eleição ordinária (D61) é filtro separado da classificação temporal (D63).
- `conjuntos.intermediario(fonte, destino, transformacao, filtro)` grava no metadado: fonte, arquivo, hash do bruto, hash da entrada da fonte no registro, hash do registro, classificação, destino, transformação e versão, colunas, filtro, contagem da seleção, `dados_sha256` (serialização canônica dos dados) e `integridade` (hash do metadado inteiro).
- `conjuntos.entrada_mundo_inicial(conjunto)` reconfere a integridade do metadado, o hash dos dados, o hash do registro atual, a entrada da fonte, o hash do bruto, o destino, a transformação e a versão, as colunas e o filtro, e **reexecuta a transformação** sobre a seleção validada: o conteúdo só entra se for exatamente o que a seleção produz. Alterar um valor, trocar o conteúdo, mudar filtro, fonte, classificação, destino ou o registro depois da geração faz a entrada recusar.
- Classificação por coluna: `colunas_pendentes` no registro impede o uso dessas colunas.

Regra:
| Destino | Temporalidade aceita | Proveniência aceita |
|---|---|---|
| `mundo_inicial` | `historico_compativel` | `publicacao_historica_comprovada`, `versao_posterior_validada` |
| `calibracao` | `historico_compativel`, `posterior_ao_corte` | `publicacao_historica_comprovada`, `versao_posterior_validada` |

`temporalidade_nao_comprovada`, `proveniencia_nao_comprovada` e `integridade_pendente` não entram em nenhum destino.

## 3. Especificação por conjunto

Regras comuns: leitura direta do zip, sem extrair; CSV latin-1, separador `;`; usar só o arquivo nacional (`BRASIL`) ou só os estaduais, nunca os dois (os estaduais repetem o nacional); arredondamento por maiores restos com desempate pela chave (`arredondamento.maiores_restos`, D49 e D50); ausência de campo é erro, nunca zero (D62); código TSE normalizado para 5 dígitos.

| Identificador | Fonte e bruto | Referência | Chave | Granularidade | Colunas | Transformação e agregação | Unidade | Ausências | Validação | Destino | Classificação |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ibge_municipios` | IBGE, `ibge/municipios.json` | cadastro vigente | código IBGE | município | `id`, `nome`, UF | nenhuma; cadastro de 5.571 (D58) | código | erro | 7 dígitos, únicos; igual à tabela TSE x IBGE | mundo inicial | `historico_compativel` / `versao_posterior_validada` |
| `tse_ibge_correspondencia` | TSE, `tse/municipio_tse_ibge.zip` | tabela vigente | TSE e IBGE | município | `CD_MUNICIPIO_TSE`, `CD_MUNICIPIO_IBGE` | dicionário TSE para IBGE | código | código sem par é erro | cobre os 5.571 e todos os códigos de 2022 e 2024 | mundo inicial | idem |
| `tse_perfil_eleitorado_2024` | TSE, `tse/grandes/perfil_eleitorado_2024.zip` | cadastro da eleição de 2024 | código TSE, depois IBGE | município (soma das zonas) e perfil | `CD_MUNICIPIO`, `QT_ELEITORES`, perfis | soma por município e perfil | eleitores | erro | total por município igual aos aptos da ordinária de 2024 | mundo inicial (eleitorado, D52) | `historico_compativel` / `versao_posterior_validada` |
| `tse_detalhe_apuracao_2022` | TSE, `tse/detalhe_votacao_munzona_2022.zip` | eleição geral 2022 | código TSE e UF; exterior como unidade própria (D58) | município, zona, cargo, turno | seis parcelas da D59, aptos, comparecimento, abstenções, seções não instaladas | soma das zonas por unidade estatística e cargo; taxas da D62 sobre `comparecimento × votosPorEleitor` | votos, eleitores, taxa | erro | D59 por linha | mundo inicial (taxas fixas D42 e D62) e calibração | idem |
| `tse_detalhe_apuracao_2024` | TSE, `tse/detalhe_votacao_munzona_2024.zip` | eleição municipal 2024 | código TSE | município, zona, cargo, turno | idem | idem, só eleição ordinária, códigos 619 e 620 (D61; `eleicoes.ORDINARIAS`); suplementares classificadas também por `DT_ELEICAO` | idem | erro | D59 por linha; 5.569 municípios na ordinária | idem | idem; parcelas pela data da eleição |
| `tse_detalhe_apuracao_2026` | TSE, `tse/detalhe_votacao_munzona_2026.zip` | eleição geral 2026 | idem | idem | idem | idem | idem | erro | D59 por linha | só calibração | `posterior_ao_corte` / `versao_posterior_validada` |
| `tse_votacao_partido_2022` | TSE, `tse/grandes/votacao_partido_munzona_2022.zip` | eleição geral 2022 | código TSE (sem zeros no bruto) e partido ou federação | município, zona, cargo, partido | `QT_VOTOS_NOMINAIS_VALIDOS`, `QT_TOTAL_VOTOS_LEG_VALIDOS` | soma por unidade, cargo e lista; base da identificação partidária inicial (método a definir, `motor-eleitoral.md` 11) | votos | erro | soma igual aos válidos do detalhe em todas as chaves | mundo inicial e calibração | `historico_compativel` / `versao_posterior_validada` |
| `tse_votacao_partido_2024` | TSE, `tse/votacao_partido_munzona_2024.zip` | eleição municipal 2024 | idem | idem | idem | idem, só eleição ordinária (619 e 620) | votos | erro | soma igual aos válidos em 12.455 de 12.493 chaves; 38 excluídas como parcela pendente | idem | idem; 38 parcelas `integridade_pendente` |
| `tse_vagas_2022`, `tse_vagas_2024` | TSE, `tse/consulta_vagas_*.zip` | 2022; 2024 com suplementares até 2026 | código TSE ou UF | unidade e cargo | `QT_VAGA`, `CD_ELEICAO`, `DT_ELEICAO` | só ordinária (D61) | vagas | erro | a definir (confronto com eleitos e legislação) | mundo inicial | `historico_compativel` / `integridade_pendente` |
| `tse_candidatos_2022`, `tse_candidatos_2024` | TSE, `tse/consulta_cand_*.zip` | 2022, 2024 | candidatura | candidato | a definir | número de candidaturas por lista (5.3, L21) | candidaturas | erro | a definir | mundo inicial e calibração | `historico_compativel` / `integridade_pendente` |

## 4. Componentes implementados

| Módulo | Função |
|---|---|
| `tools/dados/pipeline/admissibilidade.py` | eixos da D63, regra por destino, `exigir` |
| `tools/dados/pipeline/fontes.py` | registro, hash, leitura do zip sem extrair, classificação por parcela, intermediário com metadados, porta única do mundo inicial |
| `tools/dados/pipeline/arredondamento.py` | maiores restos determinístico com frações exatas |
| `tools/dados/pipeline/votos.py` | seis parcelas da D59 separadas, `votosPorEleitor`, erro em ausência |
| `tools/dados/pipeline/eleicoes.py` | filtro da eleição ordinária por `CD_ELEICAO` (D61) |
| `tools/dados/auditar_partido_2024.py` | confronto votação por partido x detalhe da apuração, 2024 |
| `data/fontes.json` | registro das 12 fontes com hash, referência, data do fenômeno, eixos, evidência e parcelas |; classificação por coluna (`colunas_pendentes`) |

Sem dependências externas: só a biblioteca padrão do Python.

## 5. Divergências de 2024: votação por partido x detalhe da apuração

Script: `tools/dados/auditar_partido_2024.py` (código do município normalizado para 5 dígitos). Resultado: 12.455 chaves iguais e 38 divergentes, todas da eleição ordinária (`CD_ELEICAO = 619`), 1º turno, em 37 zonas de 7 UFs (GO 11, MA 10, SE 7, PA 6, SP 2, PI 1, MT 1).

Padrões demonstrados nos dados (a causa no TSE não está demonstrada):
- Tipo A (11 chaves, todas de prefeito): o arquivo por partido não tem nenhuma linha para a zona; o detalhe tem válidos.
- Tipo B (24 chaves, vereador): o arquivo por partido tem as linhas, com votos nominais iguais a zero e legenda igual à do detalhe; a diferença é exatamente o total de nominais do detalhe.
- Tipo C (3 chaves): nominais e legenda diferentes do detalhe (Carapicuíba, SP, duas zonas, diferenças de 2,19% e 3,73%; Gameleira de Goiás, GO, nominais zerados e legenda 58 contra 92).

| Município TSE | UF | Município | Zona | Cargo | Turno | Partido: nominais | Partido: legenda total | Detalhe: nominais | Detalhe: legenda | Detalhe: válidos | Diferença | Diferença % | Tipo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 04154 | PA | ANANINDEUA | 107 | Vereador | 1 | 0 | 2282 | 88127 | 2282 | 90409 | -88127 | -97.48% | B |
| 04154 | PA | ANANINDEUA | 43 | Vereador | 1 | 0 | 2535 | 90823 | 2535 | 93358 | -90823 | -97.28% | B |
| 04154 | PA | ANANINDEUA | 72 | Vereador | 1 | 0 | 2473 | 88903 | 2473 | 91376 | -88903 | -97.29% | B |
| 04448 | PA | BREU BRANCO | 103 | Vereador | 1 | 0 | 793 | 23762 | 793 | 24555 | -23762 | -96.77% | B |
| 04626 | PA | PLACAS | 68 | Vereador | 1 | 0 | 361 | 12311 | 361 | 12672 | -12311 | -97.15% | B |
| 05894 | PA | RURÓPOLIS | 68 | Vereador | 1 | 0 | 490 | 16376 | 490 | 16866 | -16376 | -97.09% | B |
| 07137 | MA | ANAJATUBA | 109 | Prefeito | 1 | 0 | 0 | 16880 | 0 | 16880 | -16880 | -100.0% | A |
| 07420 | MA | CENTRAL DO MARANHÃO | 30 | Vereador | 1 | 0 | 188 | 6003 | 188 | 6191 | -6003 | -96.96% | B |
| 07951 | MA | GUIMARÃES | 30 | Prefeito | 1 | 0 | 0 | 5315 | 0 | 5315 | -5315 | -100.0% | A |
| 08001 | MA | NOVA OLINDA DO MARANHÃO | 80 | Vereador | 1 | 0 | 342 | 10885 | 342 | 11227 | -10885 | -96.95% | B |
| 08052 | MA | SÃO LUÍS GONZAGA DO MARANHÃO | 35 | Vereador | 1 | 0 | 562 | 13523 | 562 | 14085 | -13523 | -96.01% | B |
| 08079 | MA | ITAPECURU MIRIM | 16 | Vereador | 1 | 0 | 1284 | 35806 | 1284 | 37090 | -35806 | -96.54% | B |
| 08222 | MA | SANTANA DO MARANHÃO | 51 | Prefeito | 1 | 0 | 0 | 5177 | 0 | 5177 | -5177 | -100.0% | A |
| 08567 | MA | TRIZIDELA DO VALE | 9 | Vereador | 1 | 0 | 353 | 13414 | 353 | 13767 | -13414 | -97.44% | B |
| 09059 | MA | SÃO BENEDITO DO RIO PRETO | 73 | Vereador | 1 | 0 | 336 | 10847 | 336 | 11183 | -10847 | -97.0% | B |
| 09539 | MA | VITORINO FREIRE | 49 | Vereador | 1 | 0 | 664 | 17588 | 664 | 18252 | -17588 | -96.36% | B |
| 12670 | PI | CARAÚBAS DO PIAUÍ | 33 | Vereador | 1 | 0 | 173 | 4105 | 173 | 4278 | -4105 | -95.96% | B |
| 31054 | SE | ARACAJU | 1 | Prefeito | 1 | 0 | 0 | 102794 | 0 | 102794 | -102794 | -100.0% | A |
| 31054 | SE | ARACAJU | 2 | Prefeito | 1 | 0 | 0 | 102524 | 0 | 102524 | -102524 | -100.0% | A |
| 31054 | SE | ARACAJU | 27 | Prefeito | 1 | 0 | 0 | 98201 | 0 | 98201 | -98201 | -100.0% | A |
| 31119 | SE | BARRA DOS COQUEIROS | 2 | Prefeito | 1 | 0 | 0 | 23188 | 0 | 23188 | -23188 | -100.0% | A |
| 31313 | SE | CEDRO DE SÃO JOÃO | 3 | Prefeito | 1 | 0 | 0 | 3258 | 0 | 3258 | -3258 | -100.0% | A |
| 31917 | SE | NOSSA SENHORA DAS DORES | 16 | Vereador | 1 | 0 | 507 | 16502 | 507 | 17009 | -16502 | -97.02% | B |
| 31950 | SE | NOSSA SENHORA DO SOCORRO | 34 | Prefeito | 1 | 0 | 0 | 68412 | 0 | 68412 | -68412 | -100.0% | A |
| 63134 | SP | CARAPICUÍBA | 303 | Vereador | 1 | 74252 | 5153 | 75964 | 5219 | 81183 | -1778 | -2.19% | C |
| 63134 | SP | CARAPICUÍBA | 388 | Vereador | 1 | 89563 | 5492 | 93189 | 5548 | 98737 | -3682 | -3.73% | C |
| 90468 | MT | BRASNORTE | 56 | Vereador | 1 | 0 | 296 | 8080 | 296 | 8376 | -8080 | -96.47% | B |
| 92770 | GO | BURITI ALEGRE | 5 | Vereador | 1 | 0 | 209 | 6287 | 209 | 6496 | -6287 | -96.78% | B |
| 93050 | GO | CAVALCANTE | 99 | Vereador | 1 | 0 | 225 | 6063 | 225 | 6288 | -6063 | -96.42% | B |
| 93300 | GO | VALPARAÍSO DE GOIÁS | 33 | Vereador | 1 | 0 | 2087 | 63753 | 2087 | 65840 | -63753 | -96.83% | B |
| 93343 | GO | ÁGUAS LINDAS DE GOIÁS | 28 | Vereador | 1 | 0 | 2420 | 87510 | 2420 | 89930 | -87510 | -97.31% | B |
| 93564 | GO | GAMELEIRA DE GOIÁS | 31 | Vereador | 1 | 0 | 58 | 3126 | 92 | 3218 | -3160 | -98.2% | C |
| 93998 | GO | IPORÁ | 53 | Prefeito | 1 | 0 | 0 | 16383 | 0 | 16383 | -16383 | -100.0% | A |
| 93998 | GO | IPORÁ | 53 | Vereador | 1 | 0 | 654 | 19387 | 654 | 20041 | -19387 | -96.74% | B |
| 94331 | GO | JATAÍ | 18 | Vereador | 1 | 0 | 1934 | 46844 | 1934 | 48778 | -46844 | -96.04% | B |
| 95915 | GO | SÃO DOMINGOS | 47 | Vereador | 1 | 0 | 285 | 5490 | 285 | 5775 | -5490 | -95.06% | B |
| 96610 | GO | AMERICANO DO BRASIL | 34 | Prefeito | 1 | 0 | 0 | 4888 | 0 | 4888 | -4888 | -100.0% | A |
| 96776 | GO | SANTO ANTÔNIO DO DESCOBERTO | 24 | Vereador | 1 | 0 | 990 | 33757 | 990 | 34747 | -33757 | -97.15% | B |

Impacto:
- As 38 chaves estão registradas como parcelas `integridade_pendente` em `data/fontes.json` e são segregadas pela `Selecao`; o teste `TestExcecoes2024` confere que as regras são exatamente estas 38, sem duplicidade, e falha se a quantidade ou a identidade mudar.
- Agregação por município: a exclusão é por zona. Um município com zona segregada fica com votação por partido incompleta naquele cargo e turno. Qualquer agregação municipal da votação por partido precisa tratar esses municípios como unidade incompleta (não somar só as zonas restantes). Regra a implementar na transformação; até lá, esses municípios não podem gerar parâmetro de identificação partidária.
- O detalhe da apuração dessas zonas é íntegro (D59) e continua utilizável.

## 6. Perfil do eleitorado 2024: controles por dimensão

| Controle | Resultado |
|---|---|
| Total por município (`QT_ELEITORES`) igual aos aptos de vereador, 1º turno, ordinária 2024 | 5.569 de 5.569 (155.912.680) |
| Gênero fecha com o total | 5.569 de 5.569; categorias: feminino, masculino, não informado (28.769) |
| Faixa etária fecha com o total | 5.569 de 5.569; 23 categorias, inclusive "Inválida" (1.488) e faixas de 16 e 17 anos |
| Escolaridade fecha com o total | 5.569 de 5.569; 9 categorias, inclusive não informado (25.808) |
| Valores negativos | nenhum |

Leitura: o fechamento das dimensões decorre da construção do arquivo (cada linha cruza todas as dimensões), então não é confronto independente. Classificação por coluna no registro: total validado; colunas demográficas em `colunas_pendentes`, bloqueadas pela `Selecao` e pela entrada do mundo inicial. Para promovê-las, falta um confronto com outra fonte (por exemplo, o perfil por seção ou o comparecimento por perfil).

## 7. Especificação D42 e D62 (parâmetros fixos de comparecimento e votos não válidos)

Unidade de agregação comum: unidade estatística eleitoral (D58) × cargo × turno, só eleição ordinária (D61), soma das zonas. Referência: última eleição ordinária anterior ao corte do mesmo tipo (municipal: 2024; geral: 2022). Fonte: detalhe da apuração. Os conjuntos intermediários guardam numerador e denominador inteiros (não a taxa arredondada), para que a taxa seja exata.

### 7.1 D42: comparecimento e votos brancos e nulos
| Parcela | Numerador | Denominador | Observação |
|---|---|---|---|
| Comparecimento | `QT_COMPARECIMENTO` | `QT_APTOS` | |
| Abstenção | `QT_ABSTENCOES` | `QT_APTOS` | |
| Eleitores de seções não instaladas | `QT_ELEITORES_SECOES_NAO_INSTALADAS` | `QT_APTOS` | parcela própria; não somada à abstenção |
| Brancos | `QT_VOTOS_BRANCOS` | `QT_COMPARECIMENTO × votosPorEleitor` | |
| Nulos (com técnicos) | `QT_TOTAL_VOTOS_NULOS` | `QT_COMPARECIMENTO × votosPorEleitor` | |

Identidades: `aptos = comparecimento + abstenção + seções não instaladas`; D59 para os votos.

### 7.2 D62: votos anulados
| Parcela | Numerador | Denominador |
|---|---|---|
| Anulados | `QT_TOTAL_VOTOS_ANULADOS` | `QT_COMPARECIMENTO × votosPorEleitor` |
| Anulados sub judice | `QT_TOTAL_VOTOS_ANUL_SUBJUD` | idem |
| Anulados em apuração separada | `QT_VOTOS_ANULADOS_APU_SEP` | idem |

Fallback da D62: unidade sem referência usa a taxa da UF no mesmo tipo de eleição, marcada como estimativa; sem isso, lacuna registrada. Nunca zero.

### 7.3 Arredondamento ao aplicar no mundo simulado
1. Aptos da unidade repartidos em comparecimento, abstenção e seções não instaladas por maiores restos, com os pesos históricos.
2. `comparecimento × votosPorEleitor` repartido em brancos, nulos, três anulados e válidos por maiores restos; o peso dos válidos é o complemento das cinco taxas não válidas.
3. Desempate pela chave (D49, D50). A identidade D59 vale por construção.

### 7.4 Regras metodológicas vigentes (complemento da D42, `decisoes.md`)

1. Seções não instaladas: parcela própria, não somada à abstenção.
2. Brancos e nulos (com técnicos): denominador `comparecimento × votosPorEleitor`, o mesmo das três parcelas anuladas da D62.
3. Granularidade: unidade eleitoral × cargo × turno; aptos e comparecimento nunca somados entre cargos.
4. Fallback: só quando não há referência histórica para a unidade; taxas da UF no mesmo tipo de eleição, cargo e turno, guardadas como numerador e denominador inteiros e marcadas como estimativa; só quando o agregado da UF para aquele cargo e turno não tem unidade bloqueada nem lacuna.
5. Unidade incompleta: fonte com registro incompleto, divergente ou segregado da unidade bloqueia a unidade para a parcela; sem agregar só as zonas restantes e sem fallback.

Histórico: estes pontos foram apresentados como proposta em 17/11/2026 e aprovados no mesmo dia. A versão anterior desta seção descrevia lacunas da D42 que o complemento resolveu.

### 7.5 Completude (`completude.py`)

Unidades esperadas por eleição, cargo e turno, construídas sem usar o conjunto avaliado: municípios pela tabela oficial TSE x IBGE; 2º turno pelas candidaturas com linha de 2º turno (controle independente, lido só para conferência, com hash verificado); exterior como unidade própria para presidente nos dois turnos. Situações: `completa`, `sem_eleicao_propria`, `ausencia_referencia_historica` (o município não tem nenhuma unidade na eleição de referência e existe na municipal de 2024), `ausencia_dados_fonte`, `bloqueada_*` e `inesperada`.

Achado: em Aracaju (SE), as candidaturas a prefeito de 1º turno estão sem situação final (`#NULO`), embora haja 2º turno; por isso o controle usa a presença de linhas de 2º turno, e não o marcador "2º TURNO".

Ressalva de evidência: a lista de 2º turno vem do arquivo de candidaturas, que continua `integridade_pendente`. Confirmação independente (8.4): a votação por candidato aponta exatamente as mesmas disputas de 2º turno (51 em 2024; 13 em 2022, presidente e 12 governadores), e o teste falha se as duas fontes divergirem. Para 2022 a votação por candidato está validada; para 2024 continua pendente. A completude de 2º turno de 2024 fica, portanto, como controle provisório.

Implementação: `transformacoes.parcelas_d42_d62` (v1) e `completude.avaliar`. Conjuntos de teste na seção 9.

## 8. Controles de vagas e candidaturas

### 8.1 Vagas (`tse_vagas_2022`, `tse_vagas_2024`)
| Controle | Resultado executado | Situação |
|---|---|---|
| Uma linha por eleição, unidade e cargo | não verificado | especificado |
| Ordinária separada por `CD_ELEICAO` (D61); suplementares fora dos parâmetros | 2024: 5.569 unidades por cargo na ordinária, dezenas de suplementares | executado |
| Prefeito e vice com 1 vaga; governador, presidente e vices com 1 | a confirmar com o teste completo | especificado |
| Vagas iguais ao número de eleitos (candidaturas com situação final "ELEITO", "ELEITO POR QP" ou "ELEITO POR MÉDIA") | 2024: 16.581 de 16.818 unidades; diferenças em prefeito (106), vice-prefeito (106) e vereador (25). 2022: 111 de 193; diferenças em governador (13), vice-governador (13), presidente (1), vice-presidente (1) e suplentes de senador (54) | executado com divergências; resultado histórico, anterior a 8.4, e não constitui validação independente (as duas fontes estão pendentes) |
| Vagas de vereador conforme a regra legal por faixa de população | pendente da regra legal (Constituição, art. 29, IV; item L a criar, ver 10, achado 2) | especificado |

Leitura das divergências (hipóteses não verificadas): vices e suplentes não recebem situação final no arquivo de candidaturas (`#NULO`); eleitos em 2º turno não aparecem como eleitos no arquivo de candidaturas; as 25 de vereador não têm explicação. Os números desta tabela são históricos; o confronto posterior está em 8.4 e também não valida as vagas (validação circular, ver regra em 8.4).

### 8.2 Candidaturas (`tse_candidatos_2022`, `tse_candidatos_2024`)
| Controle | Campos | Situação |
|---|---|---|
| Identificação única | `SQ_CANDIDATO` por turno e eleição | executado: sem duplicidade |
| Cargo, eleição e unidade | `CD_ELEICAO`, `SG_UE`, `CD_CARGO`, `DS_CARGO` | especificado |
| Partido ou federação | `SG_PARTIDO`, `NR_FEDERACAO` contra a lista de partidos e federações do jogo | especificado |
| Situação da candidatura e resultado | `DS_SITUACAO_CANDIDATURA`, `DS_SIT_TOT_TURNO` | especificado; `#NULO` em 1.662 (2022) e 16.290 (2024) |
| Contagem por lista para o motor (5.3) | candidaturas aptas por lista, unidade e cargo, contra o limite legal (L21) | especificado; depende de L21 |

Classificação das quatro fontes: continua `integridade_pendente`.

### 8.3 Votação por candidato: coleta e especificação do confronto com vagas

Coletados em 17/11/2026, fora do git, registrados em `data/fontes.json` (`tse_votacao_candidato_2022` e `_2024`, `integridade_pendente`) e no manifesto: `votacao_candidato_munzona_2022.zip` (582.274.907 bytes) e `votacao_candidato_munzona_2024.zip` (48.245.557 bytes), versões de novembro de 2026.

Confronto especificado (executado em 17/11/2026, ver 8.4):
| Grupo | Regra de eleitos | Turnos |
|---|---|---|
| Prefeito e vice | chapa vencedora: maioria simples no 1º turno ou maioria absoluta dos válidos; 2º turno acima de 200 mil eleitores (L20) | 1º e 2º, separados por `CD_ELEICAO` (619 e 620) |
| Governador e vice; presidente e vice | maioria absoluta dos válidos no 1º turno, senão 2º turno | 1º e 2º (544 e 545; 546 e 547) |
| Senadores titulares | mais votados, tantos quantas as vagas da UF (1 em 2022) | só 1º |
| Suplentes de senador | da chapa do titular eleito; não têm votação própria | não se aplica |
| Vereador; deputados federal, estadual e distrital | quociente, barreira individual e sobras (L1, L2), confrontados com a situação final do candidato | só 1º |

Para cada grupo, confrontar vagas da eleição ordinária (D61) com eleitos derivados da votação e com a situação final do arquivo de candidaturas; registrar divergências por unidade. O confronto só levanta hipóteses de consistência: vagas, candidaturas e situação final continuam pendentes. Vereador, deputados e majoritários foram confrontados só pela contagem de eleitos declarada pelo TSE; quociente, barreira individual e sobras não foram calculados (L1, L2).

## 9. Conjuntos intermediários de teste (D42 e D62)

Gerados por `tools/dados/gerar_intermediarios_teste.py` em `data/intermediario/teste/` (fora do git). Não são parâmetros do mundo inicial.

| Conjunto | Fonte e filtro | Unidades | Status | Completude |
|---|---|---|---|---|
| `d42_d62_municipal_2024` | detalhe 2024, ordinária (619 e 620) | 11.189 (prefeito e vereador no 1º turno em 5.569 municípios; prefeito no 2º turno em 51) | todas `completa` | 11.193 esperadas: 11.189 completas e 4 `sem_eleicao_propria` (Brasília e Fernando de Noronha, 2 cargos); nenhuma lacuna nem inesperada |
| `d42_d62_geral_2022` | detalhe 2022, ordinária (544 a 547) | 36.132: 1º turno dos cinco cargos, 2º turno de presidente e de governador em 12 UFs, exterior nos dois turnos de presidente | todas `completa` | 36.138 esperadas: 36.132 completas e 6 `ausencia_referencia_historica` (Boa Esperança do Norte, MT, criado depois de 2022: cinco cargos no 1º turno e presidente no 2º), com taxas da UF como estimativa; nenhuma lacuna nem inesperada |

Numeradores e denominadores inteiros por unidade, sem taxa arredondada. Os dois conjuntos passaram pela entrada do mundo inicial, com reexecução da transformação. Hashes de integridade e dos dados reproduzidos em duas gerações independentes (municipal: `fa1dc590...` e `edb24a0a...`; geral: `05977d80...` e `f02bcc6c...`).

### 8.4 Resultado do confronto (17/11/2026)

Script: `tools/dados/auditar_votacao_candidato.py` (só leitura, hash conferido, só eleição ordinária pela D61). O arquivo nacional da votação por candidato reproduz exatamente a soma dos estaduais (linhas e votos) nos dois anos.

| Controle | 2022 | 2024 |
|---|---|---|
| Votos nominais válidos por eleição, turno, município, zona e cargo x detalhe da apuração | 39.966 de 39.966 chaves iguais | 12.410 de 12.449; 36 zonas sem nenhuma linha na votação por candidato e 3 com votos parciais (Carapicuíba, SP, zonas 303 e 388; município 64696, SP, zona 48) |
| Disputas de 2º turno: votação por candidato x candidaturas | 13 e 13, iguais | 51 e 51, iguais |
| Vagas = eleitos, majoritários (prefeito; governador, senador e presidente) | 55 de 55 | 5.528 de 5.569 |
| Vagas = eleitos, proporcionais (contagem declarada pelo TSE) | 54 de 54 | 5.545 de 5.569 |
| Eleito é o mais votado (majoritários) | 55 de 55 | 5.527, mais 1 empate no limite (Inhaúma, MG, 2.434 votos cada; desempate por critério legal, não modelado) |
| Vices e suplentes | sem votação própria; segregados nas vagas | vice-prefeito acompanha o prefeito |

Correção: as 82 divergências de 2022 e parte das de 2024 relatadas antes vinham da minha contagem, que não associava o 2º turno (545, 547, 620) ao código de vaga da ordinária e misturava vices e suplentes. As "25 divergências de vereador" eram 24 na eleição ordinária; a 25ª era a eleição suplementar de Braga (RS).

Divergências de 2024 entre vagas e eleitos (65 unidades). Vínculos demonstrados nos dados; a causa no TSE não está demonstrada:

| Unidade TSE | UF | Município | Cargo | Vagas | Eleitos (votação por candidato) | Eleitos (candidaturas) | Vínculo |
|---|---|---|---|---|---|---|---|
| 04154 | PA | ANANINDEUA | Vereador | 25 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 04448 | PA | BREU BRANCO | Vereador | 13 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 04626 | PA | PLACAS | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 04898 | PA | MELGAÇO | Vereador | 11 | 0 | 0 | sem vínculo demonstrado |
| 05614 | PA | TUCURUÍ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 03/08/2025 |
| 05894 | PA | RURÓPOLIS | Vereador | 13 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 07137 | MA | ANAJATUBA | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 07420 | MA | CENTRAL DO MARANHÃO | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 07951 | MA | GUIMARÃES | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 08001 | MA | NOVA OLINDA DO MARANHÃO | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 08052 | MA | SÃO LUÍS GONZAGA DO MARANHÃO | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 08079 | MA | ITAPECURU MIRIM | Vereador | 15 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 08222 | MA | SANTANA DO MARANHÃO | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 08567 | MA | TRIZIDELA DO VALE | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 09059 | MA | SÃO BENEDITO DO RIO PRETO | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 09539 | MA | VITORINO FREIRE | Vereador | 13 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 12670 | PI | CARAÚBAS DO PIAUÍ | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 15571 | CE | SENADOR SÁ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/07/2025 |
| 16063 | RN | SÃO MIGUEL DO GOSTOSO | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/12/2026 |
| 16675 | RN | EQUADOR | Prefeito | 1 | 0 | 0 | sem vínculo demonstrado |
| 19658 | PB | CABEDELO | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 12/04/2026 |
| 24236 | PE | GOIANA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 04/05/2025 |
| 31119 | SE | BARRA DOS COQUEIROS | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 31313 | SE | CEDRO DE SÃO JOÃO | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 31917 | SE | NOSSA SENHORA DAS DORES | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 31950 | SE | NOSSA SENHORA DO SOCORRO | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 38458 | BA | RUY BARBOSA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/04/2025 |
| 40495 | MG | AMPARO DO SERRA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 21/06/2026 |
| 41041 | MG | MARTINS SOARES | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 07/12/2025 |
| 41742 | MG | BONITO DE MINAS | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 21/06/2026 |
| 45616 | MG | GUAPÉ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/07/2025 |
| 48313 | MG | MERCÊS | Prefeito | 1 | 0 | 0 | sem vínculo demonstrado |
| 52612 | MG | SÃO JOSÉ DA VARGINHA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 03/08/2025 |
| 58394 | RJ | ITAGUAÍ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 25/10/2026 |
| 59196 | RJ | TRÊS RIOS | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 05/10/2025 |
| 61107 | SP | GUATAPARÁ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 03/08/2025 |
| 61620 | SP | TUIUTI | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 21/06/2026 |
| 62081 | SP | BREJO ALEGRE | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 17/05/2026 |
| 62359 | SP | BOCAINA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 08/06/2025 |
| 63975 | SP | ELDORADO | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/04/2025 |
| 64556 | SP | GUARÁ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 07/12/2025 |
| 66656 | SP | MACEDÔNIA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 25/10/2026 |
| 66850 | SP | MARTINÓPOLIS | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 25/10/2026 |
| 67237 | SP | MONGAGUÁ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 08/06/2025 |
| 67458 | SP | NARANDIBA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 25/10/2026 |
| 67512 | SP | NEVES PAULISTA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/04/2025 |
| 68098 | SP | PANORAMA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 08/06/2025 |
| 69515 | SP | REGINÓPOLIS | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 21/06/2026 |
| 69990 | SP | SALES OLIVEIRA | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 14/09/2025 |
| 71250 | SP | SARUTAIÁ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/12/2026 |
| 78972 | PR | SÃO TOMÉ | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 05/10/2025 |
| 85308 | RS | ARROIO DO SAL | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 25/10/2026 |
| 90298 | MS | BANDEIRANTES | Prefeito | 1 | 0 | 0 | eleição suplementar de prefeito em 06/07/2025 |
| 90468 | MT | BRASNORTE | Vereador | 11 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 92770 | GO | BURITI ALEGRE | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93050 | GO | CAVALCANTE | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93300 | GO | VALPARAÍSO DE GOIÁS | Vereador | 13 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93343 | GO | ÁGUAS LINDAS DE GOIÁS | Vereador | 21 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93564 | GO | GAMELEIRA DE GOIÁS | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93998 | GO | IPORÁ | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 93998 | GO | IPORÁ | Vereador | 13 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 94331 | GO | JATAÍ | Vereador | 10 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 95915 | GO | SÃO DOMINGOS | Vereador | 9 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 96610 | GO | AMERICANO DO BRASIL | Prefeito | 1 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |
| 96776 | GO | SANTO ANTÔNIO DO DESCOBERTO | Vereador | 15 | sem linhas | 0 | unidade entre as 38 exceções da votação por partido; sem linhas na votação por candidato |

Resumo dos vínculos: 23 das 24 de vereador são unidades das 38 exceções da votação por partido, sem linhas na votação por candidato; a 24ª (município 04898, PA) tem linhas, mas nenhum eleito. Em prefeito, 31 das 41 têm eleição suplementar de prefeito registrada; 10 não têm vínculo demonstrado.

Classificação após o confronto (`data/fontes.json`), revista na rodada de correções de 17/11/2026:
- `tse_votacao_candidato_2022`: `versao_posterior_validada` só para identificadores e votos nominais válidos (confrontados com o detalhe, validado). `CD_SIT_TOT_TURNO` e `DS_SIT_TOT_TURNO` foram para `colunas_pendentes`: a situação final só foi confrontada com vagas e candidaturas, ambas pendentes.
- `tse_vagas_2022` e `tse_vagas_2024`: voltaram a `integridade_pendente`. A concordância vagas x eleitos dependia de fontes pendentes (validação circular). As regras de parcela (vices, suplentes, 106 linhas de 2024) continuam registradas.
- `tse_votacao_candidato_2024`: continua `integridade_pendente`, agora com 34 unidades em `unidades_bloqueadas`, geradas por `pipeline/cobertura.py` contra o detalhe: 36 zonas sem nenhuma linha cuja referência no detalhe tem votos nominais válidos diferentes de zero, e 3 com linhas e soma parcial. Zona ausente com referência zero não é marcada: a cobertura confere votos, não a presença física de todas as linhas esperadas (63134 zonas 303 e 388; 64696 zona 48). A auditoria distingue as duas situações pelo campo `situacao`, não pela soma zero.
- Candidaturas 2022 e 2024: continuam `integridade_pendente`.

Bloqueio (`Selecao`): fonte com `unidades_bloqueadas` exige função `chave`; toda linha de unidade bloqueada é segregada (`unidade_bloqueada`) e a unidade entra em `unidades_segregadas` mesmo sem linhas. Nunca se agregam só as zonas restantes.

Arquivo nacional x estaduais (`cobertura.conferir_nacional`): conferência por impressão digital agregada, não comparação exata de multiconjuntos. Por grupo: contagem de linhas, soma módulo 2^64 dos hashes blake2b de 8 bytes de cada linha sem `DT_GERACAO` e `HH_GERACAO`, e soma de votos nominais válidos. Distribuições diferentes de linhas podem, em princípio, gerar a mesma soma; a probabilidade é desprezível, mas a garantia não é exata. Comparação exata (frequência de cada hash) não implementada: custo de memória a avaliar para os 9,4 milhões de linhas de 2022. Resultado: impressões iguais em 2024 (717.170 linhas, 241.436.100 votos) e 2022 (9.377.845 linhas, 710.840.707 votos). Coberto por teste.

Regra de validação (D64): concordância entre fontes pendentes não promove nenhuma delas; serve só como hipótese de consistência. Promoção exige confronto com referência de integridade já estabelecida e independente da fonte avaliada; sem essa referência, a fonte fica pendente.

2º turno na completude: `segundo_turno_de` aplica D61 (só `CD_ELEICAO` ordinário), com teste sintético.

## 10. Auditoria de dependências das fontes de vagas, candidaturas e eleitos (17/11/2026)

Auditoria documental, sem coleta, sem código novo e sem parâmetro gerado. Inventário feito por busca de `QT_VAGA`, vagas, candidaturas, eleitos, situação final e cadeiras em GDD, docs, `data/fontes.json` e `tools/`. Grandezas tratadas separadamente: `QT_VAGA` (vagas), número de candidaturas, situação final e número de eleitos. Validar uma não valida a outra.

Classes: **bloqueante** (não avança sem validar a fonte), **contornável** (avança com estimativa marcada ou referência legal), **independente** (não depende dessas fontes).

| Elemento | Onde | Grandeza e fonte | Estado da fonte | Referência independente possível | Classe |
|---|---|---|---|---|---|
| Vagas de vereador por município (`municipios.json`) | roadmap 4; regras-e-mundo | `QT_VAGA`, `tse_vagas_2024` | pendente | Constituição, art. 29, IV, só dá faixa máxima por população; o número exato é fixado pela lei orgânica de cada município. Não valida o valor exato | bloqueante para valor oficial; contornável com estimativa pela faixa, marcada |
| Vagas de deputado federal por UF | motor 5.4 | `QT_VAGA`, `tse_vagas_2022` | pendente | lei complementar e resolução do TSE de fixação das bancadas (a confirmar), total 513 | contornável por referência legal |
| Vagas de deputado estadual e distrital | motor 5.4 | `QT_VAGA`, `tse_vagas_2022` | pendente | Constituição, art. 27 (função da bancada federal) e art. 32 (DF) | contornável por referência legal |
| Vagas majoritárias (prefeito, governador, presidente) | motor 6 | `QT_VAGA` | pendente | Constituição: uma vaga | independente |
| Senado: 2 vagas e 2 votos em 2026, 1 em 2030 | regras-e-mundo 1; motor 4.2.1 | regra jurídica | | Constituição, art. 46 | independente |
| Quociente eleitoral e partidário | motor 5.4 | vagas da disputa | depende das linhas acima | as mesmas | segue a classe da vaga da disputa |
| Candidatos sintéticos por lista | motor 5.3; L21 | número de candidaturas, `tse_candidatos_*` | pendente | limite legal por lista (L21) só dá teto | contornável: estimativa pelo limite legal, já prevista em 5.3 e marcada |
| Eleitos e composição das câmaras municipais em 2024 (`world-2026.json`) | roadmap 4 | situação final, votação por candidato 2024 e candidaturas | pendentes; 34 unidades bloqueadas | nenhuma validada hoje | bloqueante |
| Prefeitos eleitos em 2024 | roadmap 4 | situação final | pendente | majoritário: mais votado nos votos nominais, que conferem com o detalhe validado nas unidades não bloqueadas (com empate e suplementar à parte) | contornável, a decidir |
| Deputados federais eleitos em 2022 por partido (base da TV, L8) | motor 7.3 | situação final 2022 | pendente (colunas_pendentes) | composição oficial publicada pela Câmara (a confirmar) ou cálculo próprio pela apuração após L1 e L2 | bloqueante para TV |
| Bancadas da Câmara e do Senado no FEFC (48% e 15%) | motor 7.2 | bancada no 1º dia útil de junho, não eleitos | fonte não registrada | publicação oficial da Câmara, do Senado e do TSE (L4) | bloqueante para FEFC; não depende de vagas |
| Votos para deputado federal no FEFC (35%) | motor 7.2 | votação por partido 2022 | validada | | independente |
| Governabilidade (cadeiras, alinhamento, coesão) | motor 8; D11 | cadeiras iniciais por casa | depende das linhas de eleitos e bancadas | | estrutura independente; inicialização bloqueante |
| Unidades esperadas de 2º turno na completude | `pipeline/completude.py` | candidaturas com turno 2 | pendente | ver achado 1 | ver achado 1 |
| Identidade D59, anulados D62, comparecimento, abstenção, brancos, nulos | 7 e 9 | detalhe da apuração | validado | | independente |
| Correspondência TSE x IBGE | 4 | tabela oficial | validada | | independente |
| Identificação partidária 2022 e parcelas válidas de 2024 | 5 | votação por partido | validada, 38 exceções segregadas | | independente |

Achados:
1. **Completude usa fonte pendente para as unidades esperadas de 2º turno.** `unidades_esperadas` lê candidaturas (pendente) como controle. Pela D64, isso é só hipótese. Concorda com a votação por candidato (também pendente) em 51 disputas em 2024 e 13 em 2022. Referência independente parcial: L20 (2º turno só acima de 200 mil eleitores) dá o conjunto de municípios elegíveis a partir do eleitorado validado, mas não diz em quais houve 2º turno. Proposta, sem implementar: registrar no relatório de completude que o 2º turno esperado é hipótese, e cruzar com L20 como teste de sanidade. Decisão do autor.
2. **Erro documental em 8.1:** "pendente de L30" na regra de vagas de vereador; L30 trata de idades mínimas. Não existe item L para a regra do art. 29, IV. Proposta: novo item L (vagas de vereador por faixa de população), a criar com aprovação.
3. **A fonte das bancadas de junho (FEFC) não está registrada.** Não depende de vagas, mas é pendência própria (L4).
4. Vagas de 2022 dos cargos proporcionais e majoritários podem ser confrontadas com a legislação (arts. 27, 32, 45 e 46 da Constituição e a fixação das bancadas), referência independente pela D64. Seria caminho de promoção parcial de `tse_vagas_2022`; não executado nem proposto como promoção agora.

O que pode avançar sem vagas: parcelas D42 e D62, correspondência municipal, identificação partidária, regras jurídicas do Senado, estrutura do motor e da governabilidade. O que espera: vagas exatas de vereador, composição inicial das câmaras, base da TV e bancadas do FEFC.
