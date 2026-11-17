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

### 7.4 Pontos metodológicos (aprovados em 17/11/2026, ver `decisoes.md`, complemento da D42)

Os itens abaixo foram aprovados como recomendado, com a regra de unidade incompleta definida pelo autor (item 5 do complemento). Texto original da proposta:
1. **Seções não instaladas.** Recomendação: parâmetro próprio, como na tabela 7.1, porque o TSE as conta separadamente e somá-las à abstenção mudaria o significado da abstenção. A D42 não trata dessa parcela.
2. **Denominador de brancos e nulos.** Recomendação: `comparecimento × votosPorEleitor`, o mesmo da D62, para que as seis parcelas da D59 tenham base comum. A D42 não define denominador.
3. **Granularidade por cargo e turno.** Recomendação: por cargo e turno, porque brancos e nulos variam muito entre cargos na mesma unidade. A D42 diz só "por unidade".
4. **Fallback da D42.** A D62 define fallback pela UF; a D42 não define. Recomendação: o mesmo fallback, marcado como estimativa.
5. **Unidades com parcela incompleta.** Zonas com seções não instaladas no exterior (2022 e 2026) e municípios com zona segregada em outras fontes: regra de completude da unidade a definir.

Implementação: `transformacoes.parcelas_d42_d62` (v1) e `completude.avaliar`. Conjuntos de teste na seção 9.

## 8. Controles de vagas e candidaturas

### 8.1 Vagas (`tse_vagas_2022`, `tse_vagas_2024`)
| Controle | Resultado executado | Situação |
|---|---|---|
| Uma linha por eleição, unidade e cargo | não verificado | especificado |
| Ordinária separada por `CD_ELEICAO` (D61); suplementares fora dos parâmetros | 2024: 5.569 unidades por cargo na ordinária, dezenas de suplementares | executado |
| Prefeito e vice com 1 vaga; governador, presidente e vices com 1 | a confirmar com o teste completo | especificado |
| Vagas iguais ao número de eleitos (candidaturas com situação final "ELEITO", "ELEITO POR QP" ou "ELEITO POR MÉDIA") | 2024: 16.581 de 16.818 unidades; diferenças em prefeito (106), vice-prefeito (106) e vereador (25). 2022: 111 de 193; diferenças em governador (13), vice-governador (13), presidente (1), vice-presidente (1) e suplentes de senador (54) | executado com divergências |
| Vagas de vereador conforme a regra legal por faixa de população | pendente de L30 e da regra legal correspondente | especificado |

Leitura das divergências (hipóteses não verificadas): vices e suplentes não recebem situação final no arquivo de candidaturas (`#NULO`); eleitos em 2º turno não aparecem como eleitos no arquivo de candidaturas; as 25 de vereador não têm explicação. Confronto seguinte: resultados por candidato (`votacao_candidato_munzona`), ainda não coletado.

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

Confronto previsto (não executado nesta etapa):
| Grupo | Regra de eleitos | Turnos |
|---|---|---|
| Prefeito e vice | chapa vencedora: maioria simples no 1º turno ou maioria absoluta dos válidos; 2º turno acima de 200 mil eleitores (L20) | 1º e 2º, separados por `CD_ELEICAO` (619 e 620) |
| Governador e vice; presidente e vice | maioria absoluta dos válidos no 1º turno, senão 2º turno | 1º e 2º (544 e 545; 546 e 547) |
| Senadores titulares | mais votados, tantos quantas as vagas da UF (1 em 2022) | só 1º |
| Suplentes de senador | da chapa do titular eleito; não têm votação própria | não se aplica |
| Vereador; deputados federal, estadual e distrital | quociente, barreira individual e sobras (L1, L2), confrontados com a situação final do candidato | só 1º |

Para cada grupo, confrontar vagas da eleição ordinária (D61) com eleitos derivados da votação e com a situação final do arquivo de candidaturas; registrar divergências por unidade. As 25 divergências de vereador de 2024 ficam abertas até explicação documental. Vagas e candidaturas continuam `integridade_pendente`.

## 9. Conjuntos intermediários de teste (D42 e D62)

Gerados por `tools/dados/gerar_intermediarios_teste.py` em `data/intermediario/teste/` (fora do git). Não são parâmetros do mundo inicial.

| Conjunto | Fonte e filtro | Unidades | Status | Completude |
|---|---|---|---|---|
| `d42_d62_municipal_2024` | detalhe 2024, ordinária (619 e 620) | 11.189 (prefeito e vereador no 1º turno em 5.569 municípios; prefeito no 2º turno em 51) | todas `completa` | 11.138 completas; 4 `sem_eleicao_propria` (Brasília e Fernando de Noronha, 2 cargos) |
| `d42_d62_geral_2022` | detalhe 2022, ordinária (544 a 547) | 36.132, inclusive o exterior como unidade própria | todas `completa` | 27.850 completas; 5 `ausencia_referencia_historica` (Boa Esperança do Norte, MT, criado depois de 2022), com estimativa pela UF |

Numeradores e denominadores inteiros por unidade, sem taxa arredondada. Os dois conjuntos passaram pela entrada do mundo inicial, com reexecução da transformação. Hashes de integridade e dos dados: ver saída do gerador.
