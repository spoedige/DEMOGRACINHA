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

Verificável por código, não só por convenção:
- Cada fonte tem `temporalidade` e `proveniencia` no registro; `carregar_registro` rejeita estados fora da lista.
- `intermediario(fonte, destino, ...)` recusa criar conjunto para destino inadmissível (`FonteInadmissivel`).
- `entrada_mundo_inicial(conjunto)` recusa conjunto preparado para calibração e reverifica a classificação, mesmo que o campo `destino` tenha sido alterado à mão.
- Linhas de uma fonte podem ter classificação própria (`parcelas`): por data do fenômeno na linha (`DT_ELEICAO`) ou por exclusão explícita.

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
| `tse_detalhe_apuracao_2024` | TSE, `tse/detalhe_votacao_munzona_2024.zip` | eleição municipal 2024 | código TSE | município, zona, cargo, turno | idem | idem, só `CD_ELEICAO = 619` (D61); suplementares por `DT_ELEICAO` | idem | erro | D59 por linha; 5.569 municípios na ordinária | idem | idem; parcelas pela data da eleição |
| `tse_detalhe_apuracao_2026` | TSE, `tse/detalhe_votacao_munzona_2026.zip` | eleição geral 2026 | idem | idem | idem | idem | idem | erro | D59 por linha | só calibração | `posterior_ao_corte` / `versao_posterior_validada` |
| `tse_votacao_partido_2022` | TSE, `tse/grandes/votacao_partido_munzona_2022.zip` | eleição geral 2022 | código TSE (sem zeros no bruto) e partido ou federação | município, zona, cargo, partido | `QT_VOTOS_NOMINAIS_VALIDOS`, `QT_TOTAL_VOTOS_LEG_VALIDOS` | soma por unidade, cargo e lista; base da identificação partidária inicial (método a definir, `motor-eleitoral.md` 11) | votos | erro | soma igual aos válidos do detalhe em todas as chaves | mundo inicial e calibração | `historico_compativel` / `versao_posterior_validada` |
| `tse_votacao_partido_2024` | TSE, `tse/votacao_partido_munzona_2024.zip` | eleição municipal 2024 | idem | idem | idem | idem, só `CD_ELEICAO = 619` | votos | erro | soma igual aos válidos em 12.455 de 12.493 chaves; 38 excluídas como parcela pendente | idem | idem; 38 parcelas `integridade_pendente` |
| `tse_vagas_2022`, `tse_vagas_2024` | TSE, `tse/consulta_vagas_*.zip` | 2022; 2024 com suplementares até 2026 | código TSE ou UF | unidade e cargo | `QT_VAGA`, `CD_ELEICAO`, `DT_ELEICAO` | só ordinária (D61) | vagas | erro | a definir (confronto com eleitos e legislação) | mundo inicial | `historico_compativel` / `integridade_pendente` |
| `tse_candidatos_2022`, `tse_candidatos_2024` | TSE, `tse/consulta_cand_*.zip` | 2022, 2024 | candidatura | candidato | a definir | número de candidaturas por lista (5.3, L21) | candidaturas | erro | a definir | mundo inicial e calibração | `historico_compativel` / `integridade_pendente` |

## 4. Componentes implementados

| Módulo | Função |
|---|---|
| `tools/dados/pipeline/admissibilidade.py` | eixos da D63, regra por destino, `exigir` |
| `tools/dados/pipeline/fontes.py` | registro, hash, leitura do zip sem extrair, classificação por parcela, intermediário com metadados, porta única do mundo inicial |
| `tools/dados/pipeline/arredondamento.py` | maiores restos determinístico com frações exatas |
| `tools/dados/pipeline/votos.py` | seis parcelas da D59 separadas, `votosPorEleitor`, erro em ausência |
| `data/fontes.json` | registro das 12 fontes com hash, referência, data do fenômeno, eixos, evidência e parcelas |

Sem dependências externas: só a biblioteca padrão do Python.
