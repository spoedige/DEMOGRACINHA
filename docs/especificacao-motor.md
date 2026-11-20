# Especificação funcional do motor eleitoral (MVP)

Organiza módulos, contratos, entradas, saídas, dependências e testes. **Não define fórmulas:** cada regra remete a `motor-eleitoral.md` (fonte única), `regras-e-mundo.md` (regras legais) ou `GDD.md` (calendário). Decisões: D35, D42, D59, D62, D65, D66, D67 (`decisoes.md`).

## 1. Contrato comum (D67)

```
modulo(estado, dados, rngState) => { resultado, rngStateNext }
```
- Função pura, sem DOM, sem `Math.random`, executável no navegador e em Node (`tools/sim.js`).
- `rngState`: estado explícito e serializável de um único domínio (mundo, eleição, eventos, cartas). Um módulo só lê e avança o fluxo do seu domínio; módulos sem sorteio devolvem `rngStateNext` igual ao recebido.
- Ordem de consumo fixa: por unidade e id (`motor-eleitoral.md` 4.1). Chaves derivadas para subfluxos (ex.: candidatos sintéticos por unidade, lista e eleição; desempate por disputa).
- `dados`: consolidados imutáveis (partidos, municípios, regras), referenciados por id estável; nunca vão ao save.
- Votos e cadeiras são inteiros; toda repartição usa maior resto (4.3) e conserva o total.
- Empate residual não interrompe: resolvido pelo módulo 14 ou devolvido como resultado estruturado.
- Parâmetros de calibração marcados "(calibrar)"; parâmetros de simplificação legal marcados com a decisão correspondente.

## 2. Fluxo de uma eleição

```
1 Preparação → 2 Cadastro → 3 Elegibilidade e listas → 4 Sintéticos
→ 5 Opinião, 6 Máquina, 7 Campanha (por janela, GDD 3)
→ 8 Comparecimento e válidos
→ 9 Apuração proporcional → 10 Distribuição de cadeiras
→ 11 Apuração majoritária → 12 Segundo turno (se exigido) | 13 Senado
→ 14 Desempate técnico (sob demanda de 10, 11, 12, 13)
→ 15 Substituição, vacância e posse → 16 Fechamento do ciclo
```
O 2º turno não passa pela distribuição de cadeiras. Proporcional e majoritário são apurados por módulos distintos.

## 3. Módulos

### 1. Preparação da eleição
- Responsabilidade: montar as disputas do ano.
- Entradas: ano, calendário (GDD 3), unidades (D58), cargos, vagas por unidade (dado).
- Processamento: disputas por cargo e unidade; votos por eleitor no Senado (2 em 2026, 1 em 2030; `regras-e-mundo.md` 1, `motor-eleitoral.md` 4.2.1).
- Saídas: lista de disputas `{id, cargo, unidade, vagas, votosPorEleitor, turnos}`.
- Dependências: dados de vagas (pendentes no mundo inicial, D64; em teste, cenário artificial).
- Parâmetros: nenhum.
- Simplificações: vagas recebidas como dado, sem recalcular por população.
- Testes: Senado 2 vagas em 2026 e 1 em 2030; sem eleição municipal em Brasília e Fernando de Noronha; 2º turno previsto só onde a regra permite.
- Implementação (etapa 7a, D73): `Eleicao.executar` orquestra uma disputa de cada vez (módulos 2 a 13 e posse).
- Implementação (D74): `Eleicao.montarAno` monta as disputas ordinárias do ano (6.10).

### 2. Cadastro de partidos, federações e candidaturas
- Responsabilidade: definir listas e chapas.
- Entradas: partidos, federações, candidaturas individualizadas, coligações majoritárias.
- Processamento: lista proporcional = partido ou federação (5.1; Res. 23.677, art. 10); chapas majoritárias e coligação (6, 6.1).
- Saídas: listas por disputa (federação como lista única, identificação somada dos membros); chapas com `identChapa` (D71).
- Dependências: 1.
- Parâmetros: nenhum.
- Simplificações: efeitos de federação além da lista única fora do MVP (L3).
- Testes: federação como lista única; sem coligação proporcional; partido federado não aparece como lista própria.

### 3. Elegibilidade e composição das listas
- Responsabilidade: decidir quem pode concorrer, antes da eleição.
- Entradas: candidatos por lista com `dataNascimento`, `dataFiliacao`, `mandatoAtual` (cargo, unidade, mandatos consecutivos) e `renuncia` (data), recebidos prontos; calendário do ano (registro, posse, prazo de filiação, prazo de desincompatibilização; datas de 2028 a confirmar); `limiteLista` (L21) (D72).
- Processamento: idade na data de referência por cargo; filiação e janela; tamanho máximo da lista.
- Saídas: candidaturas aptas; inelegíveis com motivo (`idadeMinima`, `filiacaoForaDoPrazo`, `reeleicaoEsgotada`, `semDesincompatibilizacao`); `vagasRestantesSinteticos` para o módulo 4. Aptos acima do limite: erro, sem critério de corte documentado.
- Dependências: 2.
- Parâmetros: limite por lista (L21, simplificação 4.3 abaixo).
- Simplificações: L21 estimado.
- Testes: idade na data correta (vereador no registro; demais na posse); lista não excede o limite.

### 4. Geração de candidatos sintéticos
- Responsabilidade: completar listas sem candidatos individualizados.
- Entradas: vagas de lista restantes (3), `quadros`, `capilaridade`.
- Processamento: `motor-eleitoral.md` 5.3, subfluxo de eleição com chave (unidade, lista, eleição).
- Saídas: candidatos sintéticos com atributos; não vão ao save. Número por lista e sorteadores de `q_g` e `r_g` recebidos como entrada (D71).
- Dependências: 3.
- Parâmetros: distribuições de `q_g` e `r_g` (calibrar), número por lista.
- Simplificações: atributos agregados, nome fictício só se eleito.
- Testes: mesma semente, mesmos sintéticos; recriação idêntica após carregar o save.

### 5. Opinião pública e identificação partidária
- Responsabilidade: estado de opinião de cada concorrente.
- Entradas: notoriedade, popularidade, rejeição, `identPartidaria`, conjuntura.
- Processamento: `motor-eleitoral.md` 2, 4.6; identificação só no tamanho do segmento fiel (5.2) e em `identChapa` (6).
- Saídas: termos de opinião para a pontuação. Recusa `identPartidaria` como entrada (D71).
- Dependências: 2, 4.
- Parâmetros: `α`, `k` por cargo (calibrar).
- Simplificações: conjuntura simplificada (P9).
- Testes: `popularidade + rejeicao ≤ notoriedade`; identificação nunca entra em pontuação de candidato proporcional.

### 6. Máquina eleitoral e influência territorial
- Responsabilidade: mobilização disponível no dia.
- Entradas: base territorial, lideranças, coligados, `alocMobilizacao`.
- Processamento: `motor-eleitoral.md` 4.5 e 6.1 (quatro canais, cada ator uma vez).
- Saídas: `maquinaEfetiva` por município; agregação estadual ou nacional por média ponderada pelo eleitorado (D71).
- Dependências: 2, 7.
- Parâmetros: `estruturaAliada`, `σt` (calibrar).
- Simplificações: base territorial agregada (P3).
- Testes: sem duplicação de canal; partido não gera transferência.

### 7. Campanha, exposição e mobilização
- Responsabilidade: aplicar alocações do fundo e fluxos de exposição por janela.
- Entradas: `fundoDisponivel`, cartas de campanha, `tempoTV`, `alcanceRedes`.
- Processamento: `motor-eleitoral.md` 4.4, 7.1 a 7.4.
- Saídas: estoques de opinião atualizados; `alocMobilizacao` reservado. Conversão da exposição em opinião por função injetada (calibrar, D71).
- Dependências: 5.
- Parâmetros: `escalaGasto`, conversões de TV e redes (calibrar); FEFC e TV (simplificações 4.1 e 4.2 abaixo).
- Simplificações: L3 a L5 e L8.
- Testes: cada real com uma só alocação; zero recurso, zero efeito; retorno decrescente.

### 8. Comparecimento e votos válidos
- Responsabilidade: contingentes por unidade.
- Entradas: eleitorado, taxas fixas D42 e D62.
- Processamento: identidade D59 (`motor-eleitoral.md` 4.2.1).
- Saídas: comparecimento, abstenção, brancos, nulos, anulados, válidos por unidade, cargo e turno.
- Dependências: 1.
- Parâmetros: taxas fixas por unidade (dados).
- Simplificações: taxas independentes da conjuntura no MVP (teste 82 do roadmap).
- Testes: identidade exata; válidos inteiros e não negativos.

### 9. Apuração proporcional
- Responsabilidade: votos por candidato e legenda.
- Entradas: válidos (8), concorrentes e pontuações (4 a 7).
- Processamento: segmentos e repartição, `motor-eleitoral.md` 5.2, 4.2, 4.3 (D35, competição única).
- Saídas: votos nominais, de legenda e `votosLista_L`.
- Dependências: 8.
- Parâmetros: `w`, `v`, `m`, `ε`, `D`, `λ`, `δ` (calibrar).
- Simplificações: dispersão `D` para candidaturas não modeladas.
- Testes: soma de legendas e nominais igual aos válidos; frações reais iguais às da competição única, com dois níveis só no arredondamento (D50); erro do total da lista menor que `2 + s_L`.

### 10. Distribuição proporcional de cadeiras
- Responsabilidade: eleitos e suplentes das disputas proporcionais.
- Entradas: vagas (1); por lista, votos de legenda e candidatos com votação nominal e idade inteira (9; até o módulo 9 existir, montados nos testes). Idade inteira: a conversão de data de nascimento, se houver, é do módulo 9.
- Processamento: `motor-eleitoral.md` 5.4 inteira (quociente eleitoral, quociente partidário, 10%, sobras em duas fases, médias com sobras não preenchidas, cenário sem quociente, empates, suplentes).
- Saídas: cadeiras ocupadas por lista, eleitos na ordem de eleição, suplentes por lista, vagas não preenchidas, registro de desempates; auditoria (QE, QP, denominadores, fase e média de cada sobra).
- Regras de implementação (D68): ordem única por lista (votos, idade, desempate técnico) para QP, sobras e suplência; denominador da média `QP_L + sobras obtidas`, contando vaga do QP não preenchida; lista sem candidato elegível na fase sai da disputa da vaga; empate de médias por média, votação da lista, votação nominal e idade do candidato que disputa a vaga, depois desempate técnico; suplentes só de lista que obteve vaga (Res. 23.677, art. 14), todos os não eleitos, sem mínimo; lista sem vaga não gera suplência.
- Desempate técnico nesta etapa: só a interface. `opcoes.resolverDesempateTecnico(empatadosIds, contexto, rngState) => { vencedorId, rngStateNext }`, chamado só quando os critérios se esgotam; sem resolvedor, empate residual é erro de configuração. O cálculo real (5.5) entra com o módulo 14.
- Dependências: 9; 14 sob demanda.
- Parâmetros: `minimoNominalFase2` (D65; padrão 0, alternativo 0,10 × QE).
- Simplificações: L2-a (D65).
- Testes (cenários artificiais montados à mão): arredondamento do QE em 0,5 e acima; lista abaixo de 80%; candidato abaixo de 20%; vaga de sobra não preenchida contando na média seguinte; nenhuma lista no QE (Fase I com zero cadeiras); empate de médias e de candidatos; parâmetro alternativo gerando vaga não preenchida; soma de cadeiras igual às vagas no padrão.

### 11. Apuração majoritária
- Responsabilidade: votos por chapa, vencedor no 1º turno ou decisão de 2º turno com os dois finalistas (D69).
- Entradas: válidos (8), eleitorado da unidade, cargo e vagas, chapas e pontuações, `D` (não modelados). Senado só com 1 vaga; com 2 vagas, módulo 13 (D70).
- Processamento: `motor-eleitoral.md` 6 (pontuação, repartição, maioria e exigência de 2º turno).
- Saídas: votos por chapa; vencedor ou finalistas.
- Dependências: 8; 14 sob demanda.
- Parâmetros: `m1` a `m3`, `adesao` (calibrar).
- Simplificações: empates por D66.
- Testes: soma exata; prefeito com até 200 mil eleitores sem 2º turno; maioria absoluta encerra no 1º turno.

### 12. Segundo turno
- Responsabilidade: disputa entre os dois finalistas.
- Entradas: resultado do 1º turno (votos por candidato, não modelados, inválidos, abstenção, seções não instaladas), finalistas, eleitorado, pesos de cada origem para A, B, brancoNulo e abstencao (prontos até os módulos 5 a 7), proporções históricas dos inválidos do 2º turno, seções não instaladas do 2º turno (opcional).
- Processamento: matriz origem e destino, `motor-eleitoral.md` 6.3.
- Só executa o 2º turno já decidido pelo módulo 11 (finalistas). `CARGOS[cargo].segundoTurno` (6.2) indica só que o cargo admite 2º turno em tese; o piso de mais de 200 mil eleitores para prefeito (CF/88, art. 29, II; L20) e a maioria absoluta são verificados no módulo 11 (D69).
- Saídas: votos do 2º turno, vencedor.
- Dependências: 11; 14 sob demanda.
- Parâmetros: fatores da matriz (calibrar).
- Simplificações: TV igual entre finalistas.
- Testes: eleitorado constante; nenhuma origem transfere integralmente; `validos2 = votos_A + votos_B`.

### 13. Senado
- Responsabilidade: disputa de 1 ou 2 vagas.
- Entradas: vagas (1 ou 2), eleitorado, chapas e pontuações; 1 vaga: `validos` (delegado ao módulo 11); 2 vagas: `validos1` e `taxaInvalidos2` (D70).
- Processamento: `motor-eleitoral.md` 6.2 (matriz de segundo voto sem diagonal).
- Saídas: votos por candidato, eleitos.
- Dependências: 11 (pontuação); 14 sob demanda.
- Parâmetros: branco e nulo no segundo voto (calibrar).
- Simplificações: sem afinidade entre pares no MVP.
- Testes: soma das segundas escolhas; ninguém vota duas vezes no mesmo candidato; 2030 com um voto.

### 14. Desempate técnico
- Responsabilidade: decidir empates sem critério confirmado ou com critérios esgotados.
- Entradas: empatados, Comunicação efetiva e gasto efetivo de todos os candidatos reais da disputa (para as medianas de referência dos sintéticos), válidos da disputa, fase das sobras (para o representante da lista), `rngState` de eleição.
- Processamento: `motor-eleitoral.md` 5.5 (D66).
- Implementação (etapa 7a, D73): `Desempate.resolver` aplica a votação técnica quando o contexto traz `atributos` e `validos`; sem eles, forma mínima (sorteio). O cálculo das medianas de referência dos sintéticos e a coleta de Comunicação e gasto ficam com quem monta o contexto, ainda não implementado.
- Saídas: vencedor, registro interno; ou resultado estruturado sem vencedor quando não há concorrente elegível.
- Dependências: chamado por 10 a 13.
- Parâmetros: `pCarisma`, `pFinanceiro` (0,5 e 0,5, calibrar). Referência dos sintéticos derivada da disputa (mediana), sem parâmetro próprio.
- Simplificações: mecânica de gameplay, não regra legal.
- Testes: não altera votos oficiais; reprodutível com a mesma semente; critérios legais aplicados antes; sorteio só quando a votação técnica empata; não consome posições de outros domínios; sintético recebe as medianas da disputa; só sintéticos empatados vão ao sorteio; saldo em reserva não conta como poder financeiro; representante da lista cumpre o requisito da fase.

### 15. Substituição, vacância e posse
- Responsabilidade: depois da apuração, transformar eleitos em ocupantes.
- Entradas: eleitos, suplentes ordenados (módulo 10 ou chapa do Senado), evento de vacância recebido pronto (`convocacao` ou `definitiva`, com data), fim do mandato, datas de posse (GDD 3). Vacância de prefeito, governador e presidente passa ao vice (D84): `viceId` obrigatório; dupla vacância e linha sucessória seguinte ficam sem regra (erro, a confirmar).
- Processamento: suplência (`motor-eleitoral.md` 5.4, item 9); vacância sem suplente (item 10); suplência mínima do MVP (D55).
- Saídas: ocupantes por cargo; eleições suplementares agendadas, quando aplicável.
- Dependências: 10 a 13.
- Parâmetros: nenhum.
- Simplificações: suplência mínima (D55).
- Testes: 15 meses para deputados; vereador pela lei orgânica (no MVP, sem dado municipal: art. 113, nove meses, marcado como simplificação); posse na data do calendário.

### 16. Fechamento do ciclo e atualização da carreira
- Responsabilidade: consequências da eleição.
- Entradas: ocupantes (15), estado político; os cinco passos de `motor-eleitoral.md` 8 como funções injetadas; na governabilidade, blocos, cadeiras, maioria exigida, Capital de Entrega e custo de manutenção, com `estabilidade`, `negociacao` e `faixa` injetadas (calibrar, D72).
- Processamento: ordem obrigatória de `motor-eleitoral.md` 8; governabilidade 10; carreira em `carreira-e-poder.md`.
- Saídas: bancadas, governos, bases parlamentares, recursos do próximo ciclo, oportunidades.
- Dependências: 15.
- Parâmetros: funções de governabilidade (calibrar).
- Simplificações: recálculo de FEFC e TV pelas simplificações 4.1 e 4.2.
- Testes: etapas 2 a 4 terminam antes da 5; governabilidade difere com mesma fração de cadeiras e coesão diferente.

## 4. Simplificações de regras legais no MVP

### 4.1 FEFC e Fundo Partidário (L3 a L5)
- Regra real conhecida: Res. TSE 23.605/2019, art. 5º (2%, 35%, 48%, 15%; contagem em dobro de votos de candidatos negros de 2022 a 2030; exceções de migração), `motor-eleitoral.md` 7.2.
- Representação no MVP: valores por partido como parâmetro do ciclo inicial; ciclos seguintes pela estrutura dos quatro critérios sobre resultados simulados, sem a contagem em dobro.
- Diferença: sem contagem em dobro e sem exceções de migração; distribuição interna simplificada.
- Consequência: recursos por partido aproximados; não afeta a apuração.
- Evolução: aplicar a transformação legal quando houver dado de candidatos validado.

### 4.2 Tempo de TV (L8)
- Regra real conhecida: 90% proporcional aos deputados federais eleitos na última eleição e 10% igual, com cláusula (a confirmar), `motor-eleitoral.md` 7.3.
- Representação no MVP: parâmetro por partido no ciclo inicial; ciclos seguintes pela mesma estrutura sobre os eleitos simulados.
- Diferença: base inicial sem os eleitos de 2022 validados (D64).
- Consequência: exposição inicial aproximada; efeito fraco e decrescente (7.3).
- Evolução: substituir o parâmetro inicial pelos eleitos validados.

### 4.3 Limite de candidatos por lista (L21)
- Regra real conhecida: limite legal por lista e cargo (a confirmar).
- Representação no MVP: estimativa por cargo e tamanho do partido (`motor-eleitoral.md` 5.3), marcada.
- Diferença: número de sintéticos aproximado.
- Consequência: altera a fatia da lista no segmento livre (teste 64 do roadmap); não altera a regra de cadeiras.
- Evolução: limite legal validado como dado.

### 4.4 Outras
- L2-a: D65. Empates residuais: D66. Vacância de vereador sem dado de lei orgânica: art. 113 (módulo 15).

## 5. Critérios de conclusão por etapa (`roadmap.md` 1.1)

| Etapa | Concluída quando |
|---|---|
| 1 | mesma semente gera a mesma sequência por domínio; maior resto conserva totais em testes de propriedade |
| 2 | todos os cenários do módulo 10 passam, com os dois valores de `minimoNominalFase2` |
| 3 | módulos 8, 9 e 11 conservam votos e cumprem D59 em todas as unidades de teste |
| 4 | testes dos módulos 12 e 13 passam |
| 5 | testes dos módulos 2, 4, 5, 6 e 7 passam, sem dupla contagem (o módulo 3 é da etapa 6) |
| 6 | testes dos módulos 3, 15 e 16 passam |
| 7a | `tools/sim.js` reproduz resultados com a mesma semente (hash); lote com telemetria de casos-limite; módulos 1 e 14 |
| 7b | metas de calibração medidas contra `calibration-targets.json`; backtest de 2024 (depende de dados pendentes, D64) |

## 6. Implementação da etapa 1 (fundação)

Código: `public/index.html`, bloco `<script id="motor">`, seções `/* == RNG == */`, `/* == DADOS == */` e `/* == MOTOR ELEITORAL == */`. Expõe `Motor.RNG`, `Motor.Dados` e `Motor.MaiorResto`. Sem acesso ao DOM. Testes: `node --test tests/motor/*.test.js`, da raiz; carregam o bloco em contexto isolado com `Math.random` bloqueado.

### 6.1 RNG
- Algoritmo: sfc32 (128 bits de estado com contador interno; sem estado proibido; só operações de 32 bits exatas em JavaScript). Escolhido pela simplicidade, pelo estado maior que o do mulberry32 (32 bits) e por permitir conferência com implementação de referência independente nos testes. Nenhuma comparação de qualidade estatística foi feita neste projeto.
- Normalização da semente: texto em NFC, sem espaços nas pontas, em maiúsculas; vazio é erro.
- Semeadura: hash de 128 bits de `JSON.stringify([semente, domínio, ...chaves])`, seguido do descarte de 15 saídas. O JSON evita colisão entre chaves concatenadas.
- Estado: `{ versao: 1, algoritmo: "sfc32", dominio, chave, s: [4 palavras de 32 bits] }`, congelado e serializável.
- Fluxos independentes: cada fluxo nasce de `criar(semente, dominio, ...chaves)`, derivado só da semente, do domínio (mundo, eleição, eventos, cartas) e das chaves (ex.: unidade, lista, eleição). Consumir um fluxo nunca muda outro.
- Funções puras: `u32(estado)`, `inteiro(estado, n)` (uniforme em [0, n), sem viés, por rejeição), `decimal(estado)` (53 bits, [0, 1)); todas devolvem `{ valor, rngStateNext }` e não alteram o estado recebido.
- Estado inválido (versão, algoritmo, domínio, chave, palavras fora de 32 bits): erro explícito, nunca correção silenciosa. Estado válido recebido de fora (ex.: restaurado de JSON) é copiado numa nova estrutura congelada; alterar o objeto de origem não afeta o estado validado.
- Não implementado ainda: normal padrão para o `ruido` (4.1), quando o módulo que o usa for construído.

### 6.2 Estruturas
`Dados.unidade`, `partido`, `federacao`, `disputa`, `candidatura` (estáticos, congelados em profundidade); `estadoEleicao` (único estado mutável: fase e `rngState` do domínio eleição, substituído por novo objeto); `resultadoApuracao` (soma dos votos igual aos válidos); `resultadoCadeiras` (cadeiras por lista somam as vagas; eleitos mais não preenchidas somam as vagas; registro de desempates). Identificadores: texto de 1 a 128 caracteres, `[A-Za-z0-9][A-Za-z0-9_.:|-]*`, nunca gerados. Cargos: oito disputas próprias; vices integram a chapa do titular. Cada cargo tem `sistema` e `segundoTurno`; só prefeito, governador e presidente admitem 2º turno (o Senado tem apuração própria, módulo 13). Senado: `votosPorEleitor` obrigatório e coerente com o ano (2 vagas e 2 votos quando `ano - 2010` é múltiplo de 8, senão 1 e 1; `motor-eleitoral.md` 4.2.1). Detecção de identificadores repetidos com `Set`, que não colide com propriedades herdadas como `constructor`; o cargo é validado como propriedade própria de `CARGOS` (`hasOwnProperty`). `Dados.disputa` representa só eleição ordinária: cada cargo tem calendário próprio (`eleicao`: geral a cada 4 anos desde 2026; municipal a cada 4 anos desde 2028), e ano fora dele é recusado, inclusive Senado em 2028 e 2032. Eleição suplementar, em qualquer ano, fica para estrutura própria do módulo 15 (limitação registrada).

### 6.3 Maior resto (4.3)
`MaiorResto.distribuir(total, [{ id, peso }])` devolve `{ id: inteiro }`. Cada peso (número finito não negativo) é convertido sem perda em inteiro escalado por potência de 2; quotas e restos são inteiros BigInt sobre o mesmo denominador, sem arredondamento. Empate de restos: id em ordem de código UTF-16, independente da ordem de entrada. Total zero: zeros. Soma dos pesos zero com total positivo: erro (o chamador aplica a regra própria, ex.: 5.5). Pesos negativos, não finitos ou não numéricos, ids repetidos ou inválidos: erro. Soma sempre igual ao total.

Pendência para o módulo 9: a regra "F por último" do segmento livre (5.2) exige ordem de desempate explícita; a função atual desempata só por id.

### 6.4 Distribuição proporcional de cadeiras (etapa 2)
`Motor.Cadeiras.distribuir(estado, dados, rngState)`, contrato D67.
- `estado.opcoes`: `minimoNominalFase2` (0 padrão ou 0.1; D65) e `resolverDesempateTecnico` (opcional).
- `dados`: `{ disputaId, vagas, listas: [{ id, votosLegenda, candidatos: [{ id, votos, idade }] }] }`. Votos válidos = soma de legendas e nominais.
- `Motor.Cadeiras.quocienteEleitoral(validos, vagas)`: art. 106, em inteiros.
- Patamares (10%, 20%, 80%) e médias comparados em inteiros BigInt, sem divisão em ponto flutuante.
- Saída: `{ resultado: { cadeiras: Dados.resultadoCadeiras, auditoria }, rngStateNext }`; sem desempate técnico, `rngStateNext` é o estado recebido.
- `Dados.resultadoCadeiras` passou a ter `cadeiras` = cadeiras ocupadas (soma igual ao número de eleitos; ocupadas mais não preenchidas igual às vagas) e `suplentes` por lista.
- Erro explícito, sem regra inventada: eleitos pelo quociente partidário acima das vagas (possível só com QE muito pequeno arredondado para baixo; caso sem regra nas fontes lidas); votos válidos zero.

### 6.5 Apuração (etapa 3)
- `RNG.normal(rngState)`: método polar de Marsaglia, sem cache; cada chamada devolve `{ valor, rngStateNext }`.
- `MaiorResto.distribuir(total, itens, { ordemDesempate })`: ids listados desempatam restos iguais pela posição; os demais depois, em ordem UTF-16. Sem a opção, comportamento da etapa 1.
- `Pontuacao.base(fatores, pesos, epsilon)` e `Pontuacao.calcularLote(concorrentes, rngState)` (4.1; seção 6 com ε, D69): soma dos pesos 1 (tolerância 1e-9), fatores em [0, 1], ε positivo, σ não negativo; um Z por concorrente, em ordem de id, inclusive com σ = 0; só fluxo de eleição.
- Módulo 8, `Comparecimento.calcular(estado, dados, rngState)`: `{ disputaId, eleitorado, votosPorEleitor, taxasEleitorado, taxasVotos, origem }`; taxas exatas (`{ numerador, denominador }`, denominador comum por nível, como o pipeline produz) ou numéricas (soma 1 com tolerância); dois níveis de maior resto; identidades conferidas. Sem sorteio.
- Módulo 9, `Proporcional.apurar(estado, dados, rngState)`: `{ disputaId, validos, delta, semIdentificacao, tau, listas: [{ id, identPartidaria, lambda, candidatos: [{ id, S }] }] }`; `lambda` é a pontuação efetiva da legenda, `λ_L × ruido` (D71, `Pontuacao.legendas`). Segmento fiel: legenda com pontuação `λ_L` concorrendo com os `S_i` da lista (forma 4.2, como na 5.2); lista sem candidatos fica só com a legenda. Segmento livre em dois níveis (D50), só listas com pontuação positiva. `τ` diferente de 1 é recusado. Sem sorteio.
- Módulo 11, `Majoritaria.apurar(estado, dados, rngState)`: `{ disputaId, cargo, vagas, eleitorado, validos, D, tau, chapas: [{ id, S }] }`; saída com `regra`, `segundoTurno`, `eleitos`, `finalistas`, `votosNaoModelados`, `desempates`. Válidos acima de `eleitorado × vagas` (Senado) ou de `eleitorado` (demais) são recusados. Empates na posição decisiva: resolvedor injetado (`estado.opcoes.resolverDesempateTecnico`, mesmo contrato do módulo 10).
- Reprodutibilidade: `Math.log`, `Math.exp` e `Math.pow` não têm resultado bit a bit fixado pela especificação do JavaScript. Mesma semente dá o mesmo resultado no mesmo motor JavaScript; entre navegadores diferentes, pontuações podem diferir no último bit e, raramente, mudar um arredondamento. Limitação registrada; sem correção nesta etapa.

### 6.6 Segundo turno e Senado (etapa 4)
- Módulo 13, `Senado.apurar(estado, dados, rngState)`: `{ disputaId, vagas, eleitorado, chapas: [{ id, S }], validos | validos1, taxaInvalidos2, D, tau }`. 1 vaga: delega a `Majoritaria.apurar` (resultado idêntico). 2 vagas: primeiro voto por maior resto; `validos1` dividido em `validos2` e `invalidos2`; linhas por `v1_c`; cada linha entre os demais candidatos por `S_d`; eleitos e empate na segunda vaga pela mesma rotina do módulo 11 (`Majoritaria.classificar`). Saída com `primeiroVoto`, `segundoVoto` (matriz sem diagonal), `votos`, `validos1`, `validos2`, `invalidos2`, `eleitos`, `desempates`. `D` diferente de 0, `taxaInvalidos2` fora de [0, 1), menos de duas chapas ou linha sem destino com pontuação: erro.
- Módulo 11 recusa `SENADOR` com 2 vagas e passa a exigir `validos <= eleitorado`.
- Módulo 12, `SegundoTurno.apurar(estado, dados, rngState)`: `{ disputaId, eleitorado, primeiroTurno, finalistas: [A, B], pesos: { origem: { A, B, brancoNulo, abstencao } }, proporcoesInvalidos2, eleitoresSecoesNaoInstaladas2 }`. Origens: id de cada candidato do 1º turno, `naoModelados:D`, `brancoNuloAnulado`, `abstencao`. Confere que o 1º turno fecha com o eleitorado; pesos positivos nos quatro destinos de toda origem com contingente; origem desconhecida ou sem pesos é erro. Saída com `votos`, `validos`, `comparecimento`, `abstencao`, `eleitoresSecoesNaoInstaladas`, as cinco parcelas não válidas, `eleito`, `transferencias` por origem e `desempates`. Empate entre os finalistas: resolvedor injetado, tipo `segundoTurno`.
- Mapas internos novos com `Object.create(null)` ou `Map`.

### 6.7 Concorrentes, opinião, máquina e campanha (etapa 5)
- `Pontuacao.legendas(listas, rngState)`: `λ_L × exp(σ Z - σ²/2)`, Z em ordem de id; valor vai ao `lambda` do módulo 9.
- Módulo 2, `Cadastro.montarListasProporcionais` e `Cadastro.montarChapasMajoritarias`: listas derivadas (federação ou partido isolado); `listasDeclaradas` opcional só para conferência; `coligacoes` em proporcional é erro; cada ator (partido isolado ou federação) em no máximo uma chapa; partido federado entra pela federação; adesão obrigatória e só para atores da chapa.
- Módulo 4, `Sinteticos.gerar(estado, dados)`: `{ semente, unidadeId, listaId, eleicaoId, quantidadeSinteticos, quadros, capilaridade }` com `estado.opcoes.sortearQ` e `sortearR` (recebem o estado do subfluxo, devolvem `{ valor >= 0, rngStateNext }` no mesmo fluxo). Subfluxo `RNG.criar(semente, "eleicao", "sinteticos", unidade, lista, eleição)`; ids `sint:<lista>:<índice>`; `opiniao_g = min(1, quadros × q_g)`, `maquinaEfetiva_g = min(1, capilaridade × r_g)`. `Sinteticos.designacao`: rótulo "Candidatura sintética n (lista)", sem nome de pessoa (regra 3); nome fictício pendente de decisão.
- Módulo 5, `Opiniao.calcular`: partição das quatro parcelas somando 1 (tolerância 1e-9), `α` em [0, 1], `k >= 0`.
- Módulo 6, `Maquina.calcularMunicipal`: canais sem ator repetido; `estruturaAliada > 0` só com `aliancaFormal`; titular fora dos aliados; só `tipo: "pessoa"` gera transferência; `baseTerritorial = 0` fora da base (D56). Transferência: um Z por par no subfluxo `RNG.criar(semente, "eleicao", "transferencia", município, liderança, candidato, eleição)`. `Maquina.agregarEstadualOuNacional`: base detalhada mais agregado regional disjunto, eleitorado somado sem exceder o total.
- Módulo 7, `Campanha.alocarRecursos`: valores monetários em inteiros (centavos); `reserva = fundo - Σ exposição - Σ mobilização`, negativa é erro; padrão proporcional ao eleitorado por maior resto com `totalMobilizacao`. `Campanha.efeitoMobilizacao(R, escalaGasto)`: `1 - exp(-R ÷ escalaGasto)`, zero exato com R = 0. `Campanha.aplicarExposicao`: `estado.opcoes.conversorExposicao` injetado; partição de saída conferida.
- Funções sem fórmula aprovada continuam injetadas ou recebidas como valor (calibrar): `escalaGasto`, `q_g` e `r_g`, `estruturaAliada`, conversão da exposição, decaimento.

### 6.8 Elegibilidade, posse e fechamento (etapa 6)
- `Datas`: datas `AAAA-MM-DD` validadas, sem fuso nem relógio; `idade` civil completa (aniversário conta no dia; nascido em 29/02 completa ano em 01/03 nos anos não bissextos); `somarMeses` com dia ajustado ao último dia do mês curto.
- Módulo 3, `Elegibilidade.avaliar`: idade mínima na data de referência do cargo (vereador no registro, demais na posse); filiação até o prazo; uma reeleição consecutiva no mesmo cargo executivo e unidade (dois mandatos consecutivos impedem o terceiro); chefe do Executivo que disputa outro cargo, ou o mesmo cargo em outra unidade, precisa de renúncia até o prazo de desincompatibilização. Janela partidária não é condição de elegibilidade e fica para a regra de perda de mandato (L35). Candidatura com `inelegibilidadeReconhecida: true` (escada jurídica da carreira, D77) é inapta com o motivo `inelegibilidadeReconhecida`; outro valor que não booleano é erro.
- Módulo 15, `Posse.empossar` e `Posse.vacancia`: convocação põe o primeiro suplente em exercício e preserva o mandato; vaga definitiva efetiva o primeiro suplente; sem suplente na vaga definitiva, eleição suplementar salvo se faltarem menos de 15 meses (deputados) ou do prazo da lei orgânica ou, sem ela, 9 meses (vereador). Afastamento sem suplente e Senado sem suplente: erro, sem regra documentada. Executivo: convocação põe o vice em exercício (`acao: "viceSubstitui"`, mandato preservado); vaga definitiva efetiva o vice (`acao: "viceSucede"`); sem vice, erro (D84).
- Módulo 16, `Fechamento.executar` e `Fechamento.governabilidade`: passos em ordem fixa (`apuracaoEPosse`, `atualizarMatrizes`, `recalcularRecursos`, `aplicarClausula`, `abrirProximoCiclo`), cada um recebe o estado do anterior e a lista dos já concluídos; `apoioEfetivo = Σ cadeiras aliadas × coesão`, `folgaDeCusto = Capital de Entrega ÷ custo`, `razaoApoio = apoioEfetivo ÷ maioriaExigida`; estabilidade e negociação injetadas em [0, 1]; faixa injetada entre crítica, frágil, funcional e sólida.

### 6.9 Orquestrador e simulação headless (etapa 7a)
- `Desempate.resolver(empatadosIds, contexto, rngState)`: contrato dos módulos 10 a 13. Forma mínima: `RNG.inteiro` entre os ids em ordem UTF-16. Com `contexto.atributos` (`{ id: { carisma, financeiro } }`) e `contexto.validos`: votação técnica de 5.5, pesos `contexto.pesos` (0,5 e 0,5 sem informação, calibrar); empate persistente vai ao sorteio.
- `Eleicao.executar(estado, dados, rngState)`: uma disputa. Proporcional: 2, 3, 4, 5, 6, pontuação e legendas, 8, 9, 10, posse. Majoritária: 2, 3 (candidato da chapa), 5, 6, pontuação com `identChapa`, 8, 11 e, se houver, 12, posse. Senado: 13 com 1 ou 2 vagas; com 2, o módulo 8 com um voto por eleitor dá `validos1`. Todo parâmetro vem de `dados.parametros`; ausência é erro. Idade dos sintéticos para o módulo 10: `parametros.idadeSinteticos` (calibrar). Resolvedor padrão: módulo 14.
- `tools/sim.js`: carrega o motor de `public/index.html` em contexto isolado. Formas das distribuições de `q_g` e `r_g` declaradas no cenário (`uniforme` com `min` e `max`; `exponencialTruncada` com `media` e `max`). `--cenario` executa uma vez e imprime resultado e SHA-256 do JSON canônico; `--rodadas N --semente-base S` executa N sementes `S-i` e conta segundos turnos, vagas não preenchidas, desempates por tipo e erros (insuficiência de modelagem, excesso de eleitos pelo quociente partidário, outros).
- Cenários de exemplo em `tools/cenarios/` (vereador, prefeito, Senado): artificiais, com partidos e unidades fictícios (P1 a P4, EX001); nenhum valor é dado histórico; todos os parâmetros (calibrar); calendário de 2028 e 2029 (a confirmar).

### 6.10 Montagem das disputas do ano (D74)
- `Eleicao.montarAno(estado, dados, rngState)`: sem RNG (devolve o `rngState` recebido) e sem constante própria. Entrada: `ano`, `calendario` (objeto não vazio, recebido pronto, a confirmar), `unidades` (D58), `vagas` por cargo proporcional e unidade, `eleitorado` por município e `excluidosMunicipais` (códigos IBGE de Brasília e Fernando de Noronha, dado a confirmar).
- Ano geral: `(ano - 2026)` múltiplo de 4, a partir de 2026; municipal: `(ano - 2028)` múltiplo de 4, a partir de 2028. Outro ano é erro.
- Circunscrições: país, presidente; UF, governador, senador, deputado federal e deputado estadual, ou distrital quando o id da UF é `DF`; município fora da lista de exclusão, prefeito e vereador. Exterior e unidades estatísticas não geram disputa.
- Vagas: proporcionais vêm do dado (ausência é erro); executivos têm 1; Senado tem 2 vagas e 2 votos quando `(ano - 2026)` é múltiplo de 8, senão 1 e 1. Vaga informada para cargo majoritário diferente disso é erro, assim como estadual no DF, distrital fora do DF e vagas de cargo sem eleição no ano. Chaves de unidades fora do conjunto informado são ignoradas, para aceitar subconjunto de municípios.
- `segundoTurnoPrevisto`: presidente e governador sim; senador e proporcionais não; prefeito só com eleitorado acima de `Majoritaria.LIMITE_PREFEITO` (200 mil, D69). Eleitorado ausente para município participante é erro.
- Erros de unidade: eleição geral sem exatamente um país ou sem UF; eleição municipal sem município após a exclusão; id repetido.
- Saída: `{ ano, tipo, calendario, disputas }`, cada disputa validada por `Dados.disputa`, com id `ano:CARGO:unidade`, congelada e ordenada por id.

### 6.11 Estado da carreira, ciclo de janelas e save (D75)
- `Carreira.criar(estado, dados, rngState)`: monta o estado na J1 de 2026 a partir de `dados.inicio` (todos os valores, calibrar), com os quatro fluxos de RNG derivados da semente (`mundo`, `eleicao`, `eventos`, `cartas`, chave `carreira`).
- Escalas: indicadores, relações (inclui credibilidade), influência e relações do grupo, força da base e agregado regional, aptidões, capacidade e saúde em reais de 0 a 1; potencial inteiro de 0 a 100; Caixa Pessoal e Fundo de Campanha em centavos inteiros; Capital de Entrega em unidades abstratas inteiras; custo de manutenção da base e presença do grupo em inteiros não negativos; experiência real não negativa.
- `Carreira.validar(estado)`: formato, escalas e invariantes (`popularidade + rejeicao <= notoriedade` em cada escopo; até 5 compromissos ativos; até 10 municípios na base, sem regra para o 11º; compromisso só nas listas compatíveis com seu estado).
- Tempo: ano par a partir de 2026 é eleitoral (J1 a J6), ano ímpar é calmo (C1 a C4, trimestres). Início das janelas: J1 01/01, J2 05/04, J3 20/07, J4 16/08, J5 28/08, J6 05/10; C1 01/01, C2 01/04, C3 01/07, C4 01/10 (convenção do jogo, a confirmar). Manuais por ritmo: Intenso todas; Normal J1 a J6, C1 e C3; Express J1, J3, J5 e C1.
- `Carreira.avancar(estado, dados, entrada)`: uma janela, em ordem fixa (reordenada na D76): (1) posse do mandato cuja data de início chegou, fim do mandato vencido e fim dos estados temporários que chegaram à janela de `fim` (investigado vencido sem denúncia: arquivamento automático, de `investigado` para `regular`); (2) compromissos com prazo na janela, com desfecho em dados (`efeitosCumprir`, `efeitosRomper`) ou, sem eles, por `entrada.opcoes.aplicarDesfecho`; rompido com `retaliacao`, o evento entra na fila; (3) eventos: com `dados.eventos`, o módulo Eventos (6.13); sem catálogo, itens da fila por `entrada.opcoes.resolverEvento`, fluxo `eventos`; (3b) em J3 de ano eleitoral, com `dados.modelosDisputa`, oferta e registro da candidatura (6.14); (4) cartas (6.12) quando `dados.cartas` existe; sem catálogo, decisões automáticas por `entrada.opcoes.decidirAutomatico` (sem ela, nenhuma ação), fluxo `cartas`; decisões manuais só em janela manual; (5) em J5, os cenários de `dados.eleicoes[ano]` e as disputas das candidaturas do ano (montadas a partir dos modelos, 6.14) por `Eleicao.executar`, fluxo de eleição derivado por disputa; personagem em mais de uma disputa no ano é erro; eleito o personagem, o mandato entra como `eleito`, com `unidadeId`; (6) no fim do ano, `entrada.opcoes.manutencao`, fluxo `mundo`, ou registro `manutencaoNaoModelada`; (7) histórico e próxima janela. Devolve `{ resultado: { estado, ocorrencias }, rngStateNext }` com o RNG guardado no estado. O estado recebido não é alterado. `Carreira.previa` executa os passos 1 a 3b numa cópia e devolve `{ eventos, candidaturas, mao }` em três fases (D78): os eventos disparados que pedem escolha; depois, em J3 com ofertas e sem `entrada.decisoes.candidatura`, as ofertas com a ficha; depois a mão da janela. O que ainda não cabe na fase atual vem `null`. Na janela manual, `avancar` exige essas escolhas. Save na versão 2 (D77): `personagem.estadosTemporarios`, `personagem.denunciaRegistrada`, `personagem.condenacaoEnquadrada`, `eventosRecentes` e `statusJuridico` em lista fechada. Versão 3 (D78): `personagem.dataFiliacao` e `candidaturas`; `Save.ler(texto, migrar, ctx)` e `Save.importar(codigo, migrar, ctx)` repassam `ctx` às migrações.
- Compromissos (passo 2): custo em um recurso verificável (`capitalEntrega` ou relação `cupula`, `bancada`, `executivo`); outras moedas de 10.3 são recusadas até existirem. Janela manual: decisão `cumprir` ou `romper` obrigatória para cada vencido; cumprir sem saldo é erro. Janela automática (GDD 3): cumpre em ordem de `custoPoliticoDeRomper` decrescente, prazo mais antigo e id, pagando do saldo; sem saldo, rompido. Desfecho pelos efeitos em dados do compromisso (`efeitosCumprir`, `efeitosRomper`, D77) ou, sem eles, por `entrada.opcoes.aplicarDesfecho` (calibrar), obrigatória nesse caso.
- `Save`: `serializar` (JSON com chaves em ordem, após validar), `ler` (migração em cadeia por `MIGRAR[n]`; versão mais nova que o jogo recusada), `exportar` e `importar` (`DG1:` mais base64 do UTF-8, síncrono, sem compressão no MVP; espaços e quebras de linha coladas são ignorados).
- `tools/sim.js --cenario tools/cenarios/carreira.json --carreira [--anos N] [--semente S]`: avança a carreira com decisões vazias nas janelas manuais e imprime mandatos, ocorrências e SHA-256 do save canônico.

### 6.12 Cartas e ações por janela (D76)
- Catálogo em `dados.cartas`, com `dados.ambicoes` (lista fechada) e `dados.parametrosCartas.acoesPorMao` (1 a 3, calibrar). Carta: `id`, `titulo`, `texto`, `segura`, `ambicoes` (só nas seguras), `pool` (`tiposAno`, `janelas`, `cargos`, `"semCargo"` ou `"comMandato"` (cargo eletivo em exercício, D91); com `cargos` em lista e `nomeacao` no mesmo pool, basta um dos dois (D91), `origens`, `tagsExigidas`, `tagsVedadas`, `statusJuridico`, `peso`), `custo` (`{ recurso, quantidade }` ou `{ compromisso }`), `aptidao`, `sucesso` (`base`, `pesoCapacidade`), `efeitos`, `efeitosFalha`, `risco` (`probBase`, `pesoCapacidade`, `efeitos`), `atraso` (`eventoId`, `emJanelas`, `prob`, `condicao`), `corrupcao` (`nivel` 1 a 3). Todas as magnitudes no catálogo (calibrar).
- `Cartas.validarCatalogo`: custo em exatamente uma moeda (Caixa Pessoal, Fundo de Campanha, Capital de Entrega, saúde, Cúpula, Bancada, Executivo ou compromisso); alvos de `efeitos`, `efeitosFalha` e risco somam no máximo 2 estoques e 1 relação; um risco e um atraso; ao menos um ganho nos efeitos (rejeição que sobe conta como perda); carta segura sem custo, risco, atraso nem corrupção e só com efeito nulo, perda ou defesa leve (reduzir rejeição ou subir relação até 0,003, D91, calibrar); Fundo de Campanha só em carta restrita a J4 a J6 de ano eleitoral; repasse institucional só com Capital de Entrega; delta inteiro em bolso; ids únicos; ambições dentro da lista.
- `Cartas.montarMao(estado, dados, rngState)`, fluxo `cartas`: elegíveis por pool e por saldo do custo (compromisso exige menos de 5 ativos; efeito em `base.local.forca` exige base no município local); talento não exclui. Segura: maior número de ambições em comum com o personagem, desempate por id, sem sorteio; sem segura elegível, erro. Ações: até `acoesPorMao` sorteadas sem reposição por `pool.peso` (padrão 1) sobre a lista em ordem de id. Só a segura elegível: mão de 1 carta, sem completar.
- `Cartas.jogar(estado, dados, rngState, escolha)`: dois sorteios sempre, também na segura; sucesso com `clamp(base + pesoCapacidade × capacidade[aptidao], 0, 1)` e risco com `clamp(probBase - pesoCapacidade × capacidade[aptidao], 0, 1)` (calibrar); paga o custo (compromisso vira ativo com id `carta:anoJanela` e prazo a `prazoEmJanelas` janelas); aplica `efeitos` ou `efeitosFalha` e, com risco, os efeitos do risco; agenda o atraso em `filaEventos` como `{ id, janelaAlvo, dados: { eventoId, origemCartaId, prob, condicao, nivelCorrupcao } }`; corrupção registra entrada no Arquivo Vermelho; histórico com a mão, o resultado e o evento agendado.
- Efeitos: reais limitados a [0, 1] (experiência só a 0), bolsos a 0. Convenção de invariante: se `popularidade + rejeicao` passar da notoriedade, as duas são multiplicadas por `notoriedade / (popularidade + rejeicao)`; com notoriedade 0, vão a 0.
- Prazos em janelas (`Carreira.deslocar`) contam na sequência canônica: J1 a J6 nos anos pares, C1 a C4 nos ímpares.
- Na janela manual, `entrada.decisoes.carta` é obrigatória e precisa estar na mão; na automática, joga-se a segura. A mão é sorteada nas duas.
- `tools/sim.js --carreira --cartas tools/cenarios/cartas-exemplo.json`: janelas manuais jogam a segura da prévia. O catálogo de exemplo é artificial e não é o do jogo.

### 6.13 Eventos e risco (D77)
- Catálogo em `dados.eventos`. Evento: `id`, `familia`, `titulo`, `texto`, `tipo` (`atrasado` ou `gatilho`), `condicao` (lista de testes `{ alvo, op, valor }` ligados por "e"; operadores `<`, `<=`, `>`, `>=`, `==`, `!=` e `contem`, este só em lista), `limiar` (`{ alvo, op, valor, escala }`, só em gatilho), `probBase` (só em gatilho), `bloqueioJanelas`, `reagendar` (`{ emJanelas, incrementoProb, probMax }`, só em atrasado), `enquadramentoInelegibilidade` e `opcoes`. Opção: `id`, `texto`, `contencao`, `efeitos`, `juridico`, `estadoTemporario` (`{ tipo, duracaoJanelas }`), `agendar` (`{ eventoId, emJanelas, prob }`). Magnitudes, probabilidades, prazos e escalas (calibrar).
- Alvos de condição: os alvos de efeito das cartas, mais `personagem.statusJuridico`, `personagem.denunciaRegistrada`, `personagem.condenacaoEnquadrada`, `personagem.tags`, `personagem.arquivoVermelho.length` e `cargos.exercicio`.
- Personagens recorrentes e arcos (D91): `dados.personagens` (de `data/catalogo/personagens.json`). Evento aceita `pessoa` (quem fala) e `arco` (`id`, `passo`); opção aceita `relacoes` (lista de `{ pessoa, delta }`, delta inteiro de -2 a 2, não nulo) e `agendar` em lista. Estado `relacoesPessoais[pessoa].confianca`, inteiro de -2 a 2, oculto na tela (save 7). Alvos de condição novos: `pessoa.<id>.confianca`, `carreira.derrotas` (eleições perdidas com votos do personagem) e `carreira.mandatosEletivos` (cargos eletivos em exercício). Evento de uma vez por carreira usa `bloqueioJanelas` alto.
- `Eventos.validarCatalogo`: ids únicos; de 1 a 4 opções, com exatamente uma de contenção quando há mais de uma; efeitos em no máximo 3 variáveis no evento; cadeias, atrasos de carta e retaliações só para eventos do catálogo; transição jurídica só com a condição do estado de partida (tabela abaixo); investigar sempre com estado temporário `investigado` (prazo máximo).
- Escada jurídica: `investigar` (regular para investigado), `arquivar` (investigado para regular), `denunciar` (investigado sem denúncia, registra a denúncia), `condenar` (investigado com denúncia para condenado; guarda `condenacaoEnquadrada` conforme a marca do evento), `reconhecerInelegibilidade` (condenado com enquadramento para inelegibilidadeReconhecida). Condenação sem enquadramento não gera inelegibilidade. Hipóteses legais do enquadramento (a confirmar, 1B).
- `Eventos.resolverJanela(estado, dados, ctx)`, fluxo `eventos`: primeiro os sorteios, sobre o estado de abertura do passo: um por item da fila com `janelaAlvo` na janela (ordem de id), que dispara se a condição do evento e a do item valem e o sorteio fica abaixo de `prob`; sem disparo e com `reagendar`, volta à fila com `prob = min(probMax, prob + incrementoProb)` a `emJanelas` janelas; depois um por gatilho do catálogo (ordem de id), que dispara se o limiar foi cruzado, a condição vale, a família não está bloqueada e o sorteio fica abaixo de `probBase × min(1, |x - valor| / escala)`. Depois as opções, na ordem dos disparos: uma opção, direta; crise na janela manual, `entrada.decisoes.eventos[id]`; na automática, a contenção. A opção aplica efeitos (limites e convenção de invariante das cartas), transição jurídica, estado temporário, cadeia, bloqueio da família (`eventosRecentes`) e histórico.
- Estados temporários: `investigado`, `afastamentoCautelar`, `licencaSaude`, `licencaNomeacao`, com `inicio` e `fim` em janelas; expiram na abertura da janela de `fim`. Licença de saúde deixa só a segura na mão; afastamento cautelar tira da mão as cartas com custo ou ganho em Capital de Entrega; licença para nomeação só registra. Suplência e vice: só registro (D55).
- Na eleição de J5, o personagem com `inelegibilidadeReconhecida` que consta como candidato no cenário entra com a marca e sai inapto no módulo 3.
- `Save.MIGRAR[1]`: acrescenta os campos da versão 2 vazios; `statusJuridico` diferente de `regular` não tem correspondência e é erro; compromissos antigos recebem `efeitosCumprir`, `efeitosRomper` vazios e `retaliacao` nula.
- `tools/sim.js --carreira --cartas C --eventos E`: nas manuais, contenção nos eventos e carta segura. Catálogo artificial em `tools/cenarios/eventos-exemplo.json`.

### 6.14 Candidatura em J3 e ficha de oportunidade (D78)
- Dados: `dados.modelosDisputa[ano]` (modelos no formato dos cenários de `tools/cenarios/`, sem o personagem, mais `maquinaPersonagem`), `dados.oportunidades` (`{ id, tipo: "proporcional" | "cabecaDeChapa", cargos, condicao, custo, risco }`), `dados.regrasCargo[cargo]` (`exposicao`, `capitalEntregaPorCiclo`, `notoriedadeProtagonista`, calibrar), `dados.ambicoesCargos` e `dados.governos[escopo][partido]`.
- `Candidatura.validarCatalogo`: tipo e cargo compatíveis (proporcional só com cargo proporcional); condição na linguagem dos eventos (6.13), com `escopo.notoriedade`, `escopo.popularidade` e `escopo.rejeicao` resolvidos para o escopo do cargo; custo só em Caixa Pessoal (Fundo de Campanha só a partir de J4); risco em texto obrigatório; ids únicos.
- Escopo do cargo: local para vereador e prefeito, nacional para presidente, estadual para os demais. Unidade do personagem: `municipioLocal` para vereador e prefeito, `ufInicial` para os estaduais, a unidade do modelo para presidente.
- `Candidatura.ofertas(estado, dados)`, sem RNG: uma oferta por par (modelo do ano, regra) quando o cargo está na regra, a unidade é a do personagem, o partido está no modelo, a condição vale, o custo cabe na Caixa Pessoal, o personagem passa no módulo 3 (data de nascimento, `dataFiliacao`, mandato atual e inelegibilidade reconhecida), a lista do partido ou da federação tem vaga abaixo de `limiteLista` (proporcional) ou o modelo tem chapa do partido ou da federação (cabeça de chapa), e não há candidatura no ano. Capital político não é calculado. Ordem por id `regra:disputa`.
- Mandato atual para o módulo 3: o mandato em exercício, com `consecutivos` contando os mandatos do mesmo cargo e unidade em que cada um começa depois do fim do anterior e no mesmo ano ou no ano seguinte.
- Ficha (10.5, só descritiva): eleitorado do modelo, `exposicao` e `capitalEntregaPorCiclo` da regra do cargo, posição do partido no governo do escopo (`semInformacao` sem dado), papel protagonista se a notoriedade do escopo alcança `notoriedadeProtagonista`, senão coadjuvante, custo, risco em texto e aderência (ambições do personagem cujo `ambicoesCargos` contém o cargo).
- Decisão em J3: `entrada.decisoes.candidatura` com o id da oferta ou `naoConcorrer`; obrigatória quando há oferta; na janela automática, `naoConcorrer`; fora de J3 de ano eleitoral, erro. Registro: paga o custo, grava a candidatura e o histórico.
- `Candidatura.montarDisputa(estado, dados, candidatura)`: copia o modelo e acrescenta o personagem com opinião do escopo (`desconhecimento = 1 - notoriedade`, `semOpiniao = max(0, notoriedade - popularidade - rejeicao)`, motor-eleitoral 2 e 4.6) e máquina (4.5): municipal com `baseTerritorial` da base no município (0 fora da base, D56); estadual ou nacional pela agregação do módulo 6, com os municípios da base que têm eleitorado no modelo e o agregado regional `1 - (1 - base.agregadoRegional) × (1 - maquinaSemBase)` (calibrar). Na cabeça de chapa, o personagem substitui o candidato da chapa.
- `Save.MIGRAR[2]`: `candidaturas` vazia; `dataFiliacao` do próprio save ou de `ctx.dataFiliacao`; sem ela, erro.
- `tools/sim.js --carreira --modelos tools/cenarios/candidatura-exemplo.json`: em J3, a oferta de maior aderência (desempate por id), política do simulador; com `--modelos`, os cenários prontos do arquivo de carreira não são carregados.

### 6.15 Ajustes do motor para a interface (D79)
- `Carreira.previa` devolve `{ compromissos, eventos, candidaturas, mao }`. Fase zero: `Carreira.compromissosDaJanela(estado)` lista, só em janela manual, os compromissos ativos que vencem na janela (`id`, `tipo`, `ator`, `objeto`, `custo`, `custoPoliticoDeRomper`, `podeCumprir` pelo saldo atual); enquanto faltar decisão `cumprir` ou `romper` para algum deles em `entrada.decisoes.compromissos`, as fases seguintes vêm `null`.
- `Carreira.mudarRitmo(estado, ritmo)`: cópia validada com o novo ritmo; o estado recebido não muda.
- `personagem.nome`: opcional; quando presente, texto não vazio. Sem mudança de versão do save.
- Histórico da eleição: `cargo`, `votos` e `posicao` do personagem no 1º turno (na proporcional, entre todos os candidatos da apuração; na majoritária, a chapa do personagem; empate de votos por id), `validos` do 1º turno e `segundoTurno` (`{ votos, validos }` ou `null`). Personagem fora da urna: `votos` e `posicao` nulos.
- `Distribuicoes.sorteador(def, nome)` e `Distribuicoes.opcoesDoCenario(cenario)`: os sorteadores de `q_g` e `r_g` saíram de `tools/sim.js` para o motor, com as mesmas formas e mensagens, para a interface e o simulador rodarem a mesma conta. Hashes dos cenários de exemplo inalterados.
- Interface (`<script id="ui">` em `public/index.html`, sistema visual do GDD 6): só lê `Carreira.previa`, chama `Carreira.avancar` e usa `Save`; catálogos de exemplo embutidos em `<script type="application/json" id="dados-exemplo">`, cópia exata de `tools/cenarios` conferida em `tests/ui`; partidos fictícios em `<script type="application/json" id="parties-data">`, sem logos. Testes: `node --test tests/ui/*.test.js` (Chromium a 360 px por `file://`; com `CAPTURAS_DIR`, grava capturas).

### 6.16 Nomeações e desincompatibilização (D80)
- Catálogo `dados.posicoes`: `{ id, titulo, orgao, tipo: "governamental" | "partidaria", escopo: "municipal" | "estadual" | "federal", condicao, exigeGovernoAliado, capitalEntregaPorJanela, experienciaPorJanela, notoriedadePorJanela, risco }`, valores (calibrar). `Nomeacoes.validarCatalogo` recusa posição partidária com Capital de Entrega ou exigência de governo.
- Escopo da posição para indicadores e governos: municipal é local, estadual é estadual, federal é nacional. Governo aliado: `dados.governos[escopo][partido] === "aliado"`.
- `Nomeacoes.ofertas(estado, dados)`: só em C1 e C3 de ano calmo, sem nomeação ativa; chefe do Executivo em exercício não recebe; legislador recebe só governamental (`comLicenca`). Ficha: Capacidade de entrega e exposição por janela, posição na coalizão e risco.
- Passo 1: na C1 do ano seguinte a uma eleição, a nomeação governamental do âmbito daquela eleição termina (`trocaDeGoverno`): municipal após eleição municipal; estadual e federal após eleição geral.
- Passo 3c (`decidirCargos`): em J1 de ano eleitoral, com nomeação governamental ativa ou chefia do Executivo, `entrada.decisoes.desincompatibilizacao` (`sair` ou `permanecer`, obrigatória na manual, `permanecer` na automática); `sair` encerra a nomeação ou registra a renúncia (`mandato.renuncia` com a data de início da janela). Depois, `entrada.decisoes.deixarNomeacao: true` em janela manual encerra a nomeação, sem oferta na mesma janela. Por fim, com ofertas, `entrada.decisoes.nomeacao` (id ou `recusar`; obrigatória na manual, `recusar` na automática).
- Aceite: registro em `cargos.nomeacoes`, presença do grupo no escopo mais 1, histórico; legislador fica com `mandato.licenciado = true` (cartas com `pool.cargos` não contam mandato licenciado) e reassume ao sair.
- Passo 5b (`exercer`): a cada janela em exercício, Capital de Entrega (não com licença de saúde ou afastamento cautelar), experiência e notoriedade do escopo.
- Cartas do cargo: `pool.nomeacao` igual a `governamental`, `partidaria` ou lista de posições. Eventos: alvo de condição `cargos.nomeacaoAtiva` e opção `encerrarNomeacao`.
- Módulo 3: candidatura com `nomeacaoGovernamental: true` é inapta com o motivo `semDesincompatibilizacao`.
- `tools/sim.js --nomeacoes tools/cenarios/nomeacoes-exemplo.json` (exige `--cartas`): aceita a primeira oferta e permanece em J1.

### 6.17 Candidatura livre com indicação incerta (D82)
- Substitui, em 6.14, `dados.oportunidades` e suas condições: `dados.regrasIndicacao[cargo] = { tipo, custo, risco, chance: null | { base, pesos: { cupula, notoriedadeEscopo, grupo, rejeicaoEscopo, institucional }, piso, teto } }` e `dados.faixasFicha = { chance: [l1, l2], competitividade: [l1, l2] }`, todos (calibrar). `tipo` segue o cargo; proporcional sem chance; custo só em Caixa Pessoal.
- `Candidatura.ofertas`: ids `lista:<disputa>` e `indicacao:<disputa>`; ficha com `chanceIndicacao` (`garantida`, `baixa`, `media`, `alta`) e `competitividade` (`baixa`, `media`, `alta`, `semReferencia`).
- `Candidatura.chanceIndicacao(estado, regra, cargo)` e `Candidatura.institucional(estado, cargo)`: fórmula da D82, item 2. `Candidatura.sortearIndicacao(estado, dados, oferta)`: `{ concedida }`, fluxo derivado próprio.
- Decisão em J3: `entrada.decisoes.candidatura` (oferta ou `naoConcorrer`); se o pedido de cabeça de chapa for negado, `entrada.decisoes.alternativa` (lista ou `naoConcorrer`) é obrigatória; alternativa sem negativa, ou alternativa majoritária, é erro. Prévia: com negativa, `candidaturas` traz só as listas e `indicacaoNegada = { ofertaId, disputaId, cargo }`.
- Ocorrências `indicacaoConcedida` e `indicacaoNegada`; histórico com `{ tipo: "indicacao", concedida: false }` na negativa.

### 6.18 Troca de partido e de domicílio (D83)
- Catálogo `dados.trocaPartido = { cupulaEntrada, perdaBancada, perdaCredibilidadeJanela, perdaCredibilidadeFora, fatorParaquedista, partidos, municipios: [{ id, uf }] }` (calibrar; listas até a 1B).
- `Mudancas.opcoes(estado, dados)`: em J1 do ano eleitoral, partidos e municípios de destino; em C1 do ano calmo, só partidos; fora delas, `null`. Traz `bloqueioPartido`, `bloqueioDomicilio` (texto ou `null`) e `dentroDaJanela`. A prévia expõe esse objeto em `mudancas`, na fase das cartas.
- `Mudancas.aplicar(estado, dados, manual, decisoes, ocorrencias)`, passo antes dos cargos: `entrada.decisoes.trocaPartido` (sigla) e `entrada.decisoes.domicilio` (município), opcionais; fora da janela, em janela automática, com bloqueio ou destino inválido, erro. Troca: fecha a filiação aberta, abre a nova (`tipo: "mudanca"`), `dataFiliacao` na data de início da janela, Cúpula, Bancada, credibilidade e tag. Domicílio: `municipioLocal`, escopo local com os indicadores estaduais; outra UF: `ufAtual`, tag `paraquedista` e estadual a partir dos nacionais com popularidade pelo fator; ajuste da invariante de indicadores.
- Validação: filiações com datas e tipo; uma só aberta, igual ao partido atual.

### 6.19 Vice e sucessão (D84)
- `Dados.CARGOS` ganha `VICE_PREFEITO`, `VICE_GOVERNADOR` e `VICE_PRESIDENTE` (`vice: true`, `titular`); `Dados.disputa` recusa cargo de vice. `Candidatura.escopoDe` usa o escopo do titular.
- `regrasIndicacao.VICE_*`: `tipo: "vice"`, chance como na cabeça de chapa (calibrar); `regrasCargo` do cargo de vice obrigatório quando houver oferta.
- `Candidatura.ofertas`: para cada modelo de prefeito, governador ou presidente na unidade do personagem, oferta `vice:<disputaId>` com `listaOuChapaId` (chapa própria, da federação ou com o partido na adesão, menor id), `titularId`, `titularPartidoId` e ficha com `papelEsperado: "vice"` e competitividade do titular. `sortearIndicacao` usa a chave extra `"vice"`. Ocorrências `viceConfirmado` e `viceRecusado`; `previa.indicacaoNegada.vice = true`.
- `montarDisputa` de candidatura `vice`: modelo intacto com marca `_vice { chapaId, titularId }`, retirada antes da eleição. Na J5, `personagemEleito` segue o titular; o histórico da eleição ganha `papel: "vice"` e `titularId`, com os votos do titular.
- Mandato: `papel` (`titular` ou `vice`, exigido coerente com o cargo), `sucedeu` (booleano), `chapaId`, `titularId`, `sucessao { ano, janela, eventoId }`.
- Eventos: alvo `cargos.vice` (vice em exercício não efetivado); `cargos.exercicio` passa a usar `Cartas.cargosAtuais`, que inclui o cargo do titular durante `substituicaoTitular`. Opções `substituirTitular { duracaoJanelas }` e `sucederTitular: true`, exclusivas entre si e com condição `cargos.vice == true`. Ocorrências `substituicao` e `sucessao`.
- `Nomeacoes.desincompatibilizar` no Executivo chama `Posse.vacancia` com o vice sintético `vice:<disputaId>` e grava `sucessor` no histórico da renúncia.
- Save versão 6; `MIGRAR[5]` grava `papel: "titular"` em todo mandato e recusa cargo de vice.
