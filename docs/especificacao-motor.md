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

### 2. Cadastro de partidos, federações e candidaturas
- Responsabilidade: definir listas e chapas.
- Entradas: partidos, federações, candidaturas individualizadas, coligações majoritárias.
- Processamento: lista proporcional = partido ou federação (5.1; Res. 23.677, art. 10); chapas majoritárias e coligação (6, 6.1).
- Saídas: listas por disputa; chapas.
- Dependências: 1.
- Parâmetros: nenhum.
- Simplificações: efeitos de federação além da lista única fora do MVP (L3).
- Testes: federação como lista única; sem coligação proporcional; partido federado não aparece como lista própria.

### 3. Elegibilidade e composição das listas
- Responsabilidade: decidir quem pode concorrer, antes da eleição.
- Entradas: personagens e agentes (idade, filiação, desincompatibilização), regras de `regras-e-mundo.md` 1.
- Processamento: idade na data de referência por cargo; filiação e janela; tamanho máximo da lista.
- Saídas: candidaturas aptas; vagas de lista restantes para sintéticos.
- Dependências: 2.
- Parâmetros: limite por lista (L21, simplificação 4.3 abaixo).
- Simplificações: L21 estimado.
- Testes: idade na data correta (vereador no registro; demais na posse); lista não excede o limite.

### 4. Geração de candidatos sintéticos
- Responsabilidade: completar listas sem candidatos individualizados.
- Entradas: vagas de lista restantes (3), `quadros`, `capilaridade`.
- Processamento: `motor-eleitoral.md` 5.3, subfluxo de eleição com chave (unidade, lista, eleição).
- Saídas: candidatos sintéticos com atributos; não vão ao save.
- Dependências: 3.
- Parâmetros: distribuições de `q_g` e `r_g` (calibrar), número por lista.
- Simplificações: atributos agregados, nome fictício só se eleito.
- Testes: mesma semente, mesmos sintéticos; recriação idêntica após carregar o save.

### 5. Opinião pública e identificação partidária
- Responsabilidade: estado de opinião de cada concorrente.
- Entradas: notoriedade, popularidade, rejeição, `identPartidaria`, conjuntura.
- Processamento: `motor-eleitoral.md` 2, 4.6; identificação só no tamanho do segmento fiel (5.2) e em `identChapa` (6).
- Saídas: termos de opinião para a pontuação.
- Dependências: 2, 4.
- Parâmetros: `α`, `k` por cargo (calibrar).
- Simplificações: conjuntura simplificada (P9).
- Testes: `popularidade + rejeicao ≤ notoriedade`; identificação nunca entra em pontuação de candidato proporcional.

### 6. Máquina eleitoral e influência territorial
- Responsabilidade: mobilização disponível no dia.
- Entradas: base territorial, lideranças, coligados, `alocMobilizacao`.
- Processamento: `motor-eleitoral.md` 4.5 e 6.1 (quatro canais, cada ator uma vez).
- Saídas: `maquinaEfetiva` por município.
- Dependências: 2, 7.
- Parâmetros: `estruturaAliada`, `σt` (calibrar).
- Simplificações: base territorial agregada (P3).
- Testes: sem duplicação de canal; partido não gera transferência.

### 7. Campanha, exposição e mobilização
- Responsabilidade: aplicar alocações do fundo e fluxos de exposição por janela.
- Entradas: `fundoDisponivel`, cartas de campanha, `tempoTV`, `alcanceRedes`.
- Processamento: `motor-eleitoral.md` 4.4, 7.1 a 7.4.
- Saídas: estoques de opinião atualizados; `alocMobilizacao` reservado.
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
- Testes: soma de legendas e nominais igual aos válidos; sem distribuição em dois níveis.

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
- Responsabilidade: votos por chapa e vencedor no 1º turno.
- Entradas: válidos (8), chapas e pontuações.
- Processamento: `motor-eleitoral.md` 6 (pontuação, repartição, maioria e exigência de 2º turno).
- Saídas: votos por chapa; vencedor ou finalistas.
- Dependências: 8; 14 sob demanda.
- Parâmetros: `m1` a `m3`, `adesao` (calibrar).
- Simplificações: empates por D66.
- Testes: soma exata; prefeito com até 200 mil eleitores sem 2º turno; maioria absoluta encerra no 1º turno.

### 12. Segundo turno
- Responsabilidade: disputa entre os dois finalistas.
- Entradas: resultado do 1º turno, eleitorado, eventos entre turnos.
- Processamento: matriz origem e destino, `motor-eleitoral.md` 6.3.
- Exigência do 2º turno: `CARGOS[cargo].segundoTurno` (6.2) indica só que o cargo admite 2º turno em tese. Para prefeito, o piso de mais de 200 mil eleitores (CF/88, art. 29, II; L20) é regra territorial verificada neste módulo, com o eleitorado da unidade; `Dados.disputa` não a verifica.
- Saídas: votos do 2º turno, vencedor.
- Dependências: 11; 14 sob demanda.
- Parâmetros: fatores da matriz (calibrar).
- Simplificações: TV igual entre finalistas.
- Testes: eleitorado constante; nenhuma origem transfere integralmente; `validos2 = votos_A + votos_B`.

### 13. Senado
- Responsabilidade: disputa de 1 ou 2 vagas.
- Entradas: válidos, candidatos, votos por eleitor (1).
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
- Saídas: vencedor, registro interno; ou resultado estruturado sem vencedor quando não há concorrente elegível.
- Dependências: chamado por 10 a 13.
- Parâmetros: `pCarisma`, `pFinanceiro` (0,5 e 0,5, calibrar). Referência dos sintéticos derivada da disputa (mediana), sem parâmetro próprio.
- Simplificações: mecânica de gameplay, não regra legal.
- Testes: não altera votos oficiais; reprodutível com a mesma semente; critérios legais aplicados antes; sorteio só quando a votação técnica empata; não consome posições de outros domínios; sintético recebe as medianas da disputa; só sintéticos empatados vão ao sorteio; saldo em reserva não conta como poder financeiro; representante da lista cumpre o requisito da fase.

### 15. Substituição, vacância e posse
- Responsabilidade: depois da apuração, transformar eleitos em ocupantes.
- Entradas: eleitos, suplentes, eventos (morte, renúncia, cassação), datas de posse (GDD 3).
- Processamento: suplência (`motor-eleitoral.md` 5.4, item 9); vacância sem suplente (item 10); suplência mínima do MVP (D55).
- Saídas: ocupantes por cargo; eleições suplementares agendadas, quando aplicável.
- Dependências: 10 a 13.
- Parâmetros: nenhum.
- Simplificações: suplência mínima (D55).
- Testes: 15 meses para deputados; vereador pela lei orgânica (no MVP, sem dado municipal: art. 113, nove meses, marcado como simplificação); posse na data do calendário.

### 16. Fechamento do ciclo e atualização da carreira
- Responsabilidade: consequências da eleição.
- Entradas: ocupantes (15), estado político.
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
| 5 | testes dos módulos 2 a 7 passam, sem dupla contagem |
| 6 | testes dos módulos 3, 15 e 16 passam |
| 7 | simulação headless reproduz resultados com a mesma semente; metas de calibração medidas |

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
