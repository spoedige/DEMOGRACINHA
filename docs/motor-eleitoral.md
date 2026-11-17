# Motor eleitoral

Todas as fórmulas aqui são estruturais. Pesos, expoentes, limites e desvios são (calibrar) e não têm valor definido. Regras legais marcadas (a confirmar) são hipóteses documentais até a validação jurídica da etapa 1B.

## 0. Princípios causais

1. **Caminho único.** Cada fenômeno chega à votação por um único caminho. Nenhuma causa atualiza um estado e também entra na fórmula de voto.
2. **A urna lê estados, não causas.** Causas (conjuntura, cartas, entregas, exposição) atualizam estados ao longo das janelas. Na urna entram só estados acumulados, a mobilização do dia e o ruído.
3. **Potencial fora da urna (D1).** O potencial não entra em votação, candidatura, elegibilidade, alianças, recursos de campanha, transferência de votos ou probabilidade de vitória, nem direta nem indiretamente.
4. **Estoques separados.** Voto, Máquina e Dinheiro não se convertem automaticamente um no outro.
5. **Resultado limitado.** Votos são repartição de um total fixo de válidos (seção 4), nunca produto aberto de fatores. Isso impede resultados negativos, acima do eleitorado ou explosivos.

## 1. Mapa de causalidade

### 1.1 Camadas
| Camada | Conteúdo | Atualização |
|---|---|---|
| A. Causas externas | conjuntura (aprovação de governos, polarização, clima econômico, tensão institucional) | toda janela, RNG de mundo |
| B. Causas do jogador e dos agentes | cartas, entregas de mandato, compromissos, filiação, alianças, gasto | ao resolver cartas e eventos |
| C. Fluxos de exposição | TV, redes sociais, mídia espontânea, debates | janelas de pré-campanha e campanha |
| D. Estados acumulados do candidato | notoriedade, popularidade, rejeição (por escopo); base territorial; grupo político; credibilidade | toda janela, com decaimento |
| E. Estados acumulados do partido | identificação partidária por UF; caixa e fundos | toda janela (identificação); por ciclo (fundos) |
| F. Fatores do dia da eleição | máquina efetiva, mobilização paga, coligação registrada, ruído | só na urna |
| G. Resultado | votos, eleitos, 2º turno | na urna |

### 1.2 Caminho de cada fenômeno até a votação
| Fenômeno | Caminho único | Não pode entrar em |
|---|---|---|
| Clima econômico | aprovação dos governos (A), depois identificação partidária dos partidos do governo e da oposição (E), depois voto | fórmula de voto, popularidade individual |
| Aprovação do governo nacional | identificação partidária nacional distribuída por UF (E), depois voto | fórmula de voto direta |
| Aprovação do governo estadual ou municipal | identificação partidária na UF ou no município (E), depois voto | fórmula de voto direta |
| Desempenho do candidato presidencial do partido | identificação partidária na UF durante o ano eleitoral (E), depois voto | multiplicador próprio (a antiga `caronaNacional`) |
| Associação pessoal a um governo (vice, secretário, ministro, apoio declarado) | popularidade e rejeição do candidato, por evento explícito (D), depois voto | identificação partidária (evita somar com o caminho acima) |
| Entregas do mandato (realizações) | popularidade e rejeição do candidato (D), depois voto | fórmula de voto direta |
| Polarização | pesos da conversão de exposição em rejeição e do alcance das redes (C para D); limiar de eventos | nível de voto |
| Tensão institucional | gatilhos de eventos; bônus de exposição de partido pequeno (C) | nível de voto |
| TV | notoriedade, popularidade, rejeição (C para D) | fórmula de voto |
| Redes sociais | notoriedade, popularidade, rejeição (C para D) e dispersão do ruído do candidato (F) | fórmula de voto, identificação partidária |
| Base territorial própria | máquina efetiva (F), depois voto | identificação partidária, popularidade |
| Apoio de prefeito ou liderança aliada | transferência probabilística, depois máquina efetiva (F), depois voto | identificação partidária, base territorial própria |
| Gasto de campanha | parte de exposição vai aos fluxos C; parte de mobilização vai ao fator F | as duas partes nunca usam o mesmo real |
| Coligação (majoritária) | identificação partidária agregada da chapa (F) e máquina dos aliados via transferência | termo de coligação separado |
| Potencial | velocidade de aprendizado e oportunidades de desenvolvimento | qualquer ponto deste mapa |

### 1.3 Três fenômenos nacionais distintos
1. **Aprovação do governo nacional:** avaliação do governo em exercício. Variável de conjuntura (A).
2. **Identificação partidária:** disposição do eleitor de votar na legenda. Estado do partido por UF (E). Recebe a aprovação do governo nacional (para partidos do governo e da oposição) e o desempenho do candidato presidencial.
3. **Desempenho eleitoral do candidato presidencial:** intenção de voto do candidato do partido em cada UF no ano eleitoral. Atua somente sobre a identificação partidária.

**Hipótese H1 (não implementar):** efeito de palanque, em que o candidato presidencial mobiliza diretamente a militância local de um candidato a governador ou deputado, além do que a identificação explica. Justificativa causal: comícios conjuntos e material casado podem elevar comparecimento e mobilização, não preferência partidária. Caminho candidato, se aprovado: somente máquina efetiva (F), nunca identificação. Teste de não duplicidade: com a identificação partidária congelada, o efeito do candidato presidencial sobre o voto deve ser exatamente a contribuição de H1; com H1 desligado, deve restar exatamente a contribuição que passa pela identificação.

## 2. Variáveis

Escalas são definições de projeto, não calibração. Faixas de valores dentro delas ficam (calibrar).

| Variável | Definição operacional | Escala | Escopo | Natureza |
|---|---|---|---|---|
| `notoriedade[e]` | fração do eleitorado do escopo que reconhece o candidato | 0 a 1 | local, estadual, nacional | estado |
| `popularidade[e]` | fração do eleitorado do escopo com opinião favorável | 0 a `notoriedade[e]` | idem | estado |
| `rejeicao[e]` | fração com opinião desfavorável a ponto de não votar | 0 a `notoriedade[e] - popularidade[e]` | idem | estado |
| `identPartidaria[p,u]` | fração do eleitorado da unidade disposta a votar na legenda ou federação p | 0 a 1, soma entre partidos até 1 | UF; município individualizado | estado |
| `baseTerritorial[m]` | força da organização própria do candidato no município | 0 a 1 | até 10 municípios mais agregado regional | estoque |
| `grupo.influencia` | peso agregado do grupo político | 0 a 1 | personagem | estoque |
| `credibilidade` | confiança dos atores no cumprimento de acordos | 0 a 1, exibida em faixa | personagem | estado |
| `forcaPrefeito[m]` | capacidade de mobilização do prefeito aliado | 0 a 1 | município | estado do agente |
| `aderencia[m]` | compatibilidade entre prefeito e candidato (partido, ideologia, histórico) | 0 a 1 | município | derivado |
| `transferencia[m]` | contribuição efetiva do prefeito à máquina | 0 a `forcaPrefeito[m]` | município | fator do dia |
| `maquinaEfetiva[m]` | mobilização disponível no dia | 0 a 1 | município ou agregado | fator do dia |
| `aprovacaoGov[g]` | avaliação do governo g | 0 a 1 | nacional, UF, município individualizado | estado de conjuntura |
| `polarizacao`, `climaEconomico`, `tensaoInstitucional` | variáveis de conjuntura | 0 a 1 | nacional, com desvio por UF quando previsto (`eventos-e-risco.md` 2.1) | estado de conjuntura |
| `fefcPartido[p]` | parcela legal do FEFC destinada ao partido | R$ | nacional | fluxo por ciclo |
| `fundoDisponivel` | recurso que o partido efetivamente repassou ao candidato, mais doações recebidas | R$ | candidatura | estoque de campanha |
| `gastoExposicao`, `gastoMobilizacao` | partes do gasto aplicadas a cada fim | R$, soma até `fundoDisponivel` | candidatura | fluxo de campanha |
| `tempoTV[p]` | segundos de propaganda por partido ou chapa | segundos | por eleição | fator temporário |
| `alcanceRedes` | exposição digital obtida no período | 0 a 1 | candidato | fluxo |
| `ruido` | desvio determinístico | distribuição centrada em 1, dispersão (calibrar) | por candidato e eleição | fator do dia |
| `Capital de Entrega` | recurso político de quem exerce função | unidades abstratas inteiras | personagem | estoque |

Restrição estrutural: `popularidade + rejeicao` nunca passa de `notoriedade`. Assim popularidade e rejeição são contadas uma vez, e notoriedade não precisa de multiplicador próprio: ela é o teto das duas.

## 3. Estoques e fatores temporários

| Estoque | Composição | Acumula entre eleições | Na urna |
|---|---|---|---|
| Voto | notoriedade, popularidade, rejeição | sim, com decaimento | lido como opinião |
| Máquina | base territorial própria, grupo, alianças locais | sim, com custo de manutenção | convertido em `maquinaEfetiva` |
| Dinheiro | `fundoDisponivel` | não (por candidatura) | já gasto em exposição (antes) e mobilização (no dia) |

Fatores temporários: `tempoTV`, `alcanceRedes`, debates, `gastoMobilizacao`, `transferencia`, coligação registrada, `ruido`.

Um candidato pode ter dinheiro sem máquina, máquina sem popularidade ou popularidade sem mobilização. Nenhuma regra converte um estoque em outro sem uma carta ou evento que pague o custo.

## 4. Forma de cálculo dos votos

### 4.1 Pontuação e repartição
Para cada candidato i na disputa, uma pontuação positiva:
```
S_i = exp( Σ_k  w_k × ln(x_ik + ε) ) × ruido_i
```
Votos de i = `S_i ÷ Σ_j S_j × votosValidos`, com uma alternativa de dispersão absorvendo votos de candidaturas não modeladas quando há muitos nanicos.

Propriedades:
- votos sempre entre 0 e o total de válidos;
- cada fator x tem escala limitada (seção 2), então nenhum termo cresce sem limite;
- retorno decrescente vem do logaritmo; pesos `w_k` (calibrar).

### 4.2 Gasto com retorno decrescente
```
efeitoGasto = 1 - exp( - gasto ÷ escalaGasto(cargo, eleitorado) )      (0 a 1)
```
Dinheiro isolado satura e não decide eleição. `escalaGasto` (calibrar).

### 4.3 Transferência do prefeito
```
transferencia[m] = clamp( forcaPrefeito[m] × aderencia[m] × T,  0,  forcaPrefeito[m] )
T ~ lognormal(0, sigma)   sorteado no fluxo de RNG de eleição
```
- Limites: nunca negativa; nunca maior que a força do prefeito.
- RNG: um sorteio por par (prefeito, candidato, eleição), em ordem fixa por código IBGE e id do candidato, para que ritmo ou ordem da interface não alterem o resultado.
- Sem dupla contagem: a força pessoal do prefeito só existe aqui. Não compõe a `baseTerritorial` do candidato nem a `identPartidaria`. O peso do partido do prefeito no município está na identificação por causa do resultado de 2024, não da força pessoal.

Máquina efetiva no município:
```
maquinaEfetiva[m] = 1 - (1 - baseTerritorial[m]) × (1 - transferencia[m]) × (1 - efeitoGasto(gastoMobilizacao[m]))
```
Combinação por complemento: cada fonte acrescenta e o total nunca passa de 1. `sigma` (calibrar).

## 5. Eleições proporcionais

Cargos: vereador, deputado estadual ou distrital, deputado federal.

### 5.1 Dois níveis
1. **Votos da lista** (partido ou federação) na unidade: repartição 4.1 entre listas, com fatores `identPartidaria`, opinião agregada dos candidatos da lista e máquina agregada da lista.
2. **Votos nominais** dentro da lista: repartição 4.1 entre candidatos da mesma lista.

Fatores do candidato no nível 2:
| Fator | Representa |
|---|---|
| `opiniao = popularidade - k × rejeicao`, truncado em ε, no escopo da disputa | popularidade e reconhecimento no território |
| `maquinaEfetiva`, média ponderada pelo eleitorado dos municípios | organização territorial e recursos de mobilização |
| `ruido` | incerteza determinística |

A identificação partidária entra só no nível 1 e não é contada duas vezes. O gasto de exposição já agiu antes, em notoriedade e popularidade; o gasto de mobilização entra pela máquina efetiva.

### 5.2 Apuração (hipótese documental, a confirmar)
1. Quociente eleitoral: válidos ÷ vagas.
2. Quociente partidário por partido ou federação.
3. Eleitos pelo quociente exigem votação individual mínima de 10% do QE.
4. Sobras: partido com 80% do QE e candidato com 20% do QE.
5. Distribuição final das sobras conforme Código Eleitoral vigente.

Fonte: Código Eleitoral, arts. 108 e 109 (a confirmar o texto vigente). Percentuais não definitivos até a 1B.

Coligação não existe em proporcional. Federação funciona como uma lista, conforme as regras aplicáveis (a confirmar).

## 6. Eleições majoritárias

Cargos: prefeito, governador, senador, presidente.

Fatores na repartição 4.1:
| Fator | Representa | Observação |
|---|---|---|
| `opiniao = popularidade[e] - k × rejeicao[e]`, truncado em ε | opinião pública e rejeição | peso maior que no proporcional; contadas uma vez |
| `identChapa = Σ identPartidaria(partidos da coligação) × fatorDeAdesao` | apoio partidário e identificação | substitui `coligacao` e a carona |
| `maquinaEfetiva` agregada | organização e transferência | apoio político sem transferência não entra |
| `ruido` (dispersão maior se `alcanceRedes` alto) | incerteza | redes aumentam variância, não média |

Removidos da fórmula anterior: `notoriedade` (teto de pop e rej), `tempoTV` e `redes` (agem antes, como fluxos), `gasto` (exposição já agiu; mobilização está na máquina), `coligacao` (está em `identChapa` e na máquina), `potencialMod` (D1).

`k` depende da polarização (calibrar).

Quatro conceitos distintos:
- **Apoio político:** declaração de um ator. Gera evento e possível transferência; sozinho não gera voto.
- **Coligação:** registro formal da chapa. Gera `identChapa` e tempo de TV.
- **Máquina:** organização própria e dos aliados, convertida no dia.
- **Transferência efetiva:** parte probabilística da máquina vinda de aliados.

### 6.1 Senado 2026
Cada eleitor dispõe de dois votos e as duas maiores votações vencem. Estrutura proposta: duas repartições sobre o mesmo eleitorado, a segunda excluindo, por aproximação agregada, o candidato escolhido no primeiro voto (método exato a definir). Em 2030, uma vaga e um voto.

### 6.2 Segundo turno
- Avançam os dois primeiros.
- Eventos de apoio, debate e transferência dos derrotados: os votos de cada derrotado se repartem entre os finalistas, abstenção e nulo, segundo afinidade, rejeição e apoio declarado. Nunca integral.
- Tempo de TV igual.
- Mesma forma 4.1, com os estados atualizados entre turnos.

## 7. Dinheiro e exposição

### 7.1 Cadeia do dinheiro
| Etapa | Variável | Quem decide |
|---|---|---|
| 1. Total do FEFC | valor legal do ciclo | lei e TSE |
| 2. Parcela do partido | `fefcPartido[p]` | regra legal (7.2) |
| 3. Distribuição interna | critérios do partido | direção partidária (agentes), com cotas legais (a confirmar) |
| 4. Disponível ao candidato | `fundoDisponivel` | repasse do partido, fundo partidário repassado e doações |
| 5. Gasto efetivo | `gastoExposicao`, `gastoMobilizacao` | escolhas do jogador nas cartas |

O jogador não recebe automaticamente parcela proporcional ao desempenho do partido. A distribuição interna depende da prioridade da direção para o cargo, da relação com a Cúpula, da chance estimada, de compromissos e das cotas legais.

Separação estrita: repasse institucional (Capital de Entrega), FEFC, Fundo Partidário, doações e Caixa Pessoal são contas distintas. Movimentar entre elas só por carta explícita; movimentações ilegais são cartas de corrupção.

### 7.2 FEFC 2026 (a confirmar no TSE)
Total de referência: R$ 4.961.519.777.

| Critério | Peso |
|---|---|
| Igual entre os 30 partidos | 2% |
| Votos para deputado federal | 35% |
| Bancada da Câmara | 48% |
| Bancada do Senado | 15% |

Bancadas contadas no primeiro dia útil de junho. Cálculo por partido; tratamento de federações (a confirmar).

Valores por partido em R$ milhões, de fonte secundária. **Não são parâmetros do motor**; servem só para conferir o cálculo pela regra: PL 881,7; PT 615,4; União 526,2; PSD 421; PP 417,1; MDB 400; Republicanos 348,6; Podemos 246; PDT 169,3; PSB 152,3; PSDB 147,9; PSOL 131,5; Solidariedade 88,5; Avante 72,5; PRD 71,8; PCdoB 60,5; Cidadania 60,2; PV 45,2; Novo 37; Rede 35,8; demais na cota mínima.

Ciclos seguintes: mesma regra aplicada aos resultados simulados, respeitando a legislação de cada ciclo (a confirmar).

Fundo Partidário: regra própria de distribuição entre partidos, ligada à cláusula de desempenho (a confirmar).

### 7.3 Televisão (a confirmar)
- 90% proporcional aos deputados federais eleitos na última eleição (2022 para 2026), não à bancada atual.
- 10% igual entre partidos que atendem à cláusula aplicável.
- 2º turno: tempo igual.
- Novo e Missão sem TV em 2026 (hipótese).
- Eleições municipais (a confirmar).
- Efeito: fluxo que altera notoriedade, popularidade e rejeição durante J5. Fraco e decrescente por ano.

### 7.4 Redes sociais
Fluxo próprio, peso crescente por ano. Converte `alcanceRedes` em ganho de notoriedade e em mudança de popularidade e de rejeição (a conversão em rejeição cresce com a polarização), e aumenta a dispersão do `ruido` do candidato. Favorece perfis como Influenciador/Coach e partidos pequenos em ambiente polarizado.

Não é contada de novo: não entra na fórmula de voto, na identificação partidária nem como bônus separado. Mais alcance não garante mais votos; com rejeição alta, o alcance pode reduzir a opinião líquida.

### 7.5 Comparação dos canais (hipótese estrutural)
| Canal | Força | Tendência |
|---|---|---|
| FEFC | forte | estável |
| TV | fraca | decrescente |
| Rede social | média | crescente |

Pesos por ano (calibrar). Nenhum coeficiente definido.

## 8. Fechamento do ciclo eleitoral

Ordem obrigatória:
1. Apuração e posse agendada.
2. Atualização das matrizes: bancadas, governos, prefeituras, relações entre partidos, bases parlamentares iniciais (seção 10).
3. Recálculo de FEFC, Fundo Partidário, tempo de TV e cláusula de desempenho para o próximo ciclo.
4. Aplicação das consequências da cláusula conforme a legislação vigente (datas e efeitos a confirmar).
5. Abertura do próximo ciclo: oportunidades, convites, cargos de nomeação (D8) e distribuição de Capital de Entrega.

As etapas 2 a 4 terminam antes da 5, para que oportunidades e recursos usem o estado político já atualizado.

Eleitos governam e legislam via Capital de Entrega (`carreira-e-poder.md` seção 10).

## 9. Disputas sem o jogador

Arquitetura híbrida:
- Municípios individualizados (até 10, D12) e disputas em que o jogador concorre: candidatos fictícios individuais pela forma 4.1.
- Demais localidades: simulação agregada por UF, com votos por partido a partir de `identPartidaria` da UF.

Coerência:
- Totais respeitam eleitorado e válidos de cada unidade.
- Municípios individualizados são descontados do agregado da UF, para não somar duas vezes.
- Bancadas, governos e fundos do mundo vêm sempre do resultado simulado.
- Mesma semente e mesmas decisões produzem os mesmos resultados (RNG de eleição em ordem fixa por unidade e id).

## 10. Base parlamentar e governabilidade (D11)

Por casa legislativa e governo, sem parlamentares individuais:
```
bloco = { partido ou federação, cadeiras, alinhamento (aliado, independente, oposição), coesao (0 a 1) }

apoioEfetivo    = Σ cadeiras(bloco aliado) × coesao(bloco)
estabilidade    = f(tempo da coalizão sem ruptura, compromissos cumpridos com os blocos, dispersão ideológica)
folgaDeCusto    = Capital de Entrega disponível ÷ custo de manutenção da base
negociacao      = f(credibilidade, relação com Bancada, capacidade efetiva em Articulação)
governabilidade = faixa(apoioEfetivo ÷ maioriaExigida, ajustado por estabilidade, folgaDeCusto e negociacao)
                  faixas: crítica, frágil, funcional, sólida
```
- Sem barra na interface: só a faixa textual.
- `maioriaExigida` por tipo de proposta (quóruns a confirmar).
- Coesão cai com aprovação baixa do governo, compromissos rompidos e folga de custo negativa.
- Blocos podem mudar de alinhamento a cada janela.
- Exemplo estrutural: 60% de cadeiras com coesão 0,6 dão apoio efetivo de 36%; 52% com coesão 0,95 dão 49,4%.

## 11. Fórmulas apenas estruturais

Precisam de definição de função ou calibração antes da implementação:
1. Pesos `w_k` da forma 4.1 por cargo.
2. `ε` e a alternativa de dispersão.
3. `escalaGasto(cargo, eleitorado)`.
4. `sigma` da transferência.
5. `k(polarizacao)`.
6. `fatorDeAdesao` da identificação de partidos coligados.
7. Conversão de TV, redes e gasto de exposição em notoriedade, popularidade e rejeição.
8. Atualização da identificação partidária pela aprovação do governo e pelo desempenho presidencial.
9. Decaimento de notoriedade, popularidade, rejeição, base e grupo.
10. Método do segundo voto no Senado.
11. Transferência de votos no 2º turno.
12. Funções `estabilidade`, `negociacao` e limites das faixas de governabilidade.
13. Critérios de distribuição interna de fundos pelos partidos.
14. Dispersão do `ruido` e sua dependência de `alcanceRedes`.
