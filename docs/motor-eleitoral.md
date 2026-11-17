# Motor eleitoral

Todas as fórmulas aqui são estruturais. Pesos, expoentes, limites e desvios são (calibrar) e não têm valor definido. Regras legais marcadas (a confirmar) são hipóteses documentais até a validação jurídica da etapa 1B.

## 0. Princípios causais

1. **Caminho único.** Cada fenômeno chega à votação por um único caminho. Nenhuma causa atualiza um estado e também entra na fórmula de voto.
2. **A urna lê estados, não causas.** Causas (conjuntura, cartas, entregas, exposição) atualizam estados ao longo das janelas. Na urna entram só estados acumulados, a mobilização do dia e o ruído.
3. **Potencial sem efeito eleitoral direto (D1 revista por D34).** O potencial não possui efeito direto sobre resultados eleitorais, candidaturas, elegibilidade, alianças ou recursos de campanha. Pode influenciar o desenvolvimento das aptidões, que, uma vez adquiridas, afetam normalmente as ações e seus resultados.
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
| Apoio de liderança individual aliada (prefeito, vereador, liderança local) | transferência probabilística, depois máquina efetiva (F), depois voto | identificação partidária, base territorial própria |
| Gasto de campanha | alocação de exposição vai aos fluxos C; alocação de mobilização vai ao fator F | o mesmo real em duas alocações |
| Coligação formal (majoritária): eleitor do partido aliado | identificação da chapa (F) | máquina, transferência |
| Coligação formal: estrutura partidária do aliado | estrutura compartilhada na máquina (F) | identificação, transferência |
| Coligação formal: recurso do aliado destinado à chapa | mobilização aliada na máquina (F) | identificação, estrutura |
| Apoio declarado sem coligação | só transferência, se o apoiador tem força pessoal; senão, evento sem efeito de voto | identificação da chapa |
| Potencial | velocidade e capacidade de desenvolvimento das aptidões; as capacidades adquiridas agem na resolução das cartas (B) | qualquer termo direto deste mapa |

### 1.3 Três fenômenos nacionais distintos
1. **Aprovação do governo nacional:** avaliação do governo em exercício. Variável de conjuntura (A).
2. **Identificação partidária:** disposição do eleitor de votar na legenda. Estado do partido por UF (E). Recebe a aprovação do governo nacional (para partidos do governo e da oposição) e o desempenho do candidato presidencial.
3. **Desempenho eleitoral do candidato presidencial:** intenção de voto do candidato do partido em cada UF no ano eleitoral. Atua somente sobre a identificação partidária.

**Hipótese H1 (fora do MVP, decisão D24; hipótese futura sem implementação):** efeito de palanque, em que o candidato presidencial mobiliza diretamente a militância local de um candidato a governador ou deputado, além do que a identificação explica. Justificativa causal: comícios conjuntos e material casado podem elevar comparecimento e mobilização, não preferência partidária. Caminho candidato, se aprovado: somente máquina efetiva (F), nunca identificação. Teste de não duplicidade: com a identificação partidária congelada, o efeito do candidato presidencial sobre o voto deve ser exatamente a contribuição de H1; com H1 desligado, deve restar exatamente a contribuição que passa pela identificação.

## 2. Variáveis

Escalas são definições de projeto, não calibração. Faixas de valores dentro delas ficam (calibrar).

| Variável | Definição operacional | Escala | Escopo | Natureza |
|---|---|---|---|---|
| `notoriedade[e]` | fração do eleitorado do escopo que reconhece o candidato | 0 a 1 | local, estadual, nacional | estado |
| `popularidade[e]` | fração do eleitorado do escopo com opinião favorável | 0 a `notoriedade[e]` | idem | estado |
| `rejeicao[e]` | fração com opinião desfavorável a ponto de não votar | 0 a `notoriedade[e] - popularidade[e]` | idem | estado |
| `semOpiniao[e]` | fração que conhece o candidato sem avaliação formada: `notoriedade - popularidade - rejeicao` | 0 a `notoriedade[e]` | idem | derivado, nunca reclassificado |
| `desconhecimento[e]` | `1 - notoriedade[e]` | 0 a 1 | idem | derivado |
| `identPartidaria[p,u]` | fração dos votantes válidos da unidade identificados com a lista p (partido isolado ou federação); categorias mutuamente exclusivas | 0 a 1; com `semIdentificacao[u]`, soma exatamente 1 por construção (5.2) | UF; município | estado |
| `baseTerritorial[m]` | força da organização própria do candidato no município | 0 a 1 | detalhada nos municípios do conjunto da base (até 10, qualquer UF; `regras-e-mundo.md` 4); fora dele vale 0 na máquina municipal, e o agregado regional é usado só em disputa estadual ou nacional (4.5) | estoque |
| `grupo.influencia` | peso agregado do grupo político | 0 a 1 | personagem | estoque |
| `credibilidade` | confiança dos atores no cumprimento de acordos | 0 a 1, exibida em faixa | personagem | estado |
| `forca[l]` | capacidade pessoal de mobilização da liderança aliada l (prefeito, vereador, liderança local) | 0 a 1 | município | estado do agente ou do agregado municipal |
| `aderencia[l,c]` | compatibilidade entre liderança e candidato (partido, ideologia, histórico) | 0 a 1 | município | derivado |
| `transferencia[m]` | contribuição efetiva das lideranças aliadas à máquina | 0 a 1 | município | fator do dia |
| `maquinaEfetiva[m]` | mobilização disponível no dia | 0 a 1 | município ou agregado | fator do dia |
| `aprovacaoGov[g]` | avaliação do governo g | 0 a 1 | nacional, UF, municípios do conjunto de agentes | estado de conjuntura |
| `polarizacao`, `climaEconomico`, `tensaoInstitucional` | variáveis de conjuntura | 0 a 1 | nacional, com desvio por UF quando previsto (`eventos-e-risco.md` 2.1) | estado de conjuntura |
| `fefcPartido[p]` | parcela legal do FEFC destinada ao partido | R$ | nacional | fluxo por ciclo |
| `fundoDisponivel` | recurso que o partido efetivamente repassou ao candidato, mais doações recebidas | R$ | candidatura | estoque de campanha |
| `alocExposicao[j]` | recurso alocado a exposição na janela j | R$ | candidatura | fluxo, consumido na janela |
| `alocMobilizacao[m]` | recurso reservado à mobilização do dia no município m (agregado regional conta como uma unidade) | R$ | candidatura | estoque reservado, consumido na urna |
| `reserva` | recurso não alocado | R$ | candidatura | estoque |
| `estruturaAliada[m]` | capilaridade organizacional dos partidos coligados no município | 0 a 1 | município | fator do dia |
| `mobAliada[m]` | recurso de mobilização que aliados destinaram à chapa | R$ | município | fator do dia |
| `legenda[L]` | votos dados só à legenda da lista L | votos | unidade | resultado |
| `tempoTV[p]` | segundos de propaganda por partido ou chapa | segundos | por eleição | fator temporário |
| `alcanceRedes` | exposição digital obtida no período | 0 a 1 | candidato | fluxo |
| `ruido` | multiplicador determinístico `exp(σZ - σ²/2)`, Z normal padrão do RNG de eleição; média 1 para qualquer σ | maior que 0 | por concorrente e eleição | fator do dia |
| `eleitorado[u]`, `comparecimento[u]`, `brancos[u]`, `nulos[u]` | contagens da unidade; taxas de base vêm dos dados da 1B | votos | unidade eleitoral | dado e resultado |
| `Capital de Entrega` | representação abstrata da capacidade institucional de produzir entregas, articular recursos orçamentários e negociar espaços; não é dinheiro público disponível ao personagem | unidades abstratas inteiras | personagem | estoque |

Restrição estrutural: `popularidade + rejeicao` nunca passa de `notoriedade`. Assim popularidade e rejeição são contadas uma vez, e notoriedade não precisa de multiplicador próprio: ela é o teto das duas.

## 3. Estoques e fatores temporários

| Estoque | Composição | Acumula entre eleições | Na urna |
|---|---|---|---|
| Voto | notoriedade, popularidade, rejeição | sim, com decaimento | lido como opinião |
| Máquina | base territorial própria e alianças locais (o grupo político não compõe a máquina; atua em influência) | sim, com custo de manutenção | convertido em `maquinaEfetiva` |
| Dinheiro | `fundoDisponivel` | não (por candidatura) | já gasto em exposição (antes) e mobilização (no dia) |

Fatores temporários: `tempoTV`, `alcanceRedes`, debates, `alocMobilizacao`, `transferencia`, coligação registrada, `ruido`.

Um candidato pode ter dinheiro sem máquina, máquina sem popularidade ou popularidade sem mobilização. Nenhuma regra converte um estoque em outro sem uma carta ou evento que pague o custo.

## 4. Forma de cálculo dos votos

### 4.1 Pontuação
Para cada concorrente c (lista, candidato ou chapa) numa disputa:
```
S_c = Π_k (x_ck + ε)^(w_k)  ×  ruido_c
com  Σ_k w_k = 1           (normalização por cargo e nível)
```
- `x_ck` são fatores em escala 0 a 1 (seção 2). `ε` evita zero absoluto (calibrar, pequeno).
- Com `Σ w_k = 1`, a parte determinística `Π (x+ε)^w` é uma média geométrica ponderada dos fatores, entre ε e 1+ε, e não amplifica diferenças. `S_c` completo é positivo e não tem teto, por causa do ruído.
- `ruido_c = exp(σ_c Z_c - σ_c²/2)`, Z_c normal padrão do fluxo de RNG de eleição, em ordem fixa por unidade e id. Média 1 para qualquer σ_c: aumentar a dispersão não aumenta a votação esperada.

### 4.2 Repartição
```
participacao_c = S_c^τ ÷ ( Σ_j S_j^τ + D^τ )
votos_c        = participacao_c × votosValidos
```
- `D`: pontuação da alternativa de dispersão (candidaturas não modeladas). Pode ser zero quando todos os concorrentes estão modelados.
- `τ` (concentração): estrutural igual a 1, ou seja, votos proporcionais à pontuação. Só muda com calibração contra resultados históricos, nunca por ajuste livre. Com τ = 1 não há concentração artificial: concorrentes com pontuação igual recebem votos iguais e a razão de votos é a razão de pontuações.
- `votosValidos`: ver 4.2.1.

#### 4.2.1 Eleitorado, comparecimento e válidos
```
eleitorado = comparecimento + abstencao
comparecimento = validos + brancos + nulos
```
Grandezas distintas. No MVP, comparecimento, abstenção, brancos e nulos são parâmetros fixos por unidade, vindos dos dados de base da 1B (a confirmar fonte). **Não respondem dinamicamente à conjuntura, às campanhas nem a eventos nesta fase.** A repartição 4.2 opera só sobre `validos`. Modelo dinâmico de comparecimento e votos inválidos: Fase 2. No 2º turno (6.3), a matriz de destinos usa fatores fixos pelo mesmo motivo.

### 4.3 Arredondamento e soma exata
Votos são inteiros. Usa-se o método do maior resto: piso de cada `votos_c`, e as unidades restantes vão aos maiores restos, com desempate por id. A soma distribuída é sempre igual a `votosValidos`.

### 4.4 Gasto: alocações distintas
```
fundoDisponivel = Σ_j alocExposicao[j] + Σ_m alocMobilizacao[m] + reserva
```
- A distribuição entre municípios é escolha do jogador por carta de campanha; sem escolha, o padrão é proporcional ao eleitorado dos municípios de base.
- Cada real tem uma só alocação. Cartas de campanha movem recurso de `reserva` para uma alocação; não há carta que produza exposição e mobilização com o mesmo valor.
- Exposição é consumida na própria janela e vira fluxo de notoriedade e opinião (seção 7).
- Mobilização é reservada até J5 e consumida na urna:
```
efeitoMob(R) = 1 - exp( - R ÷ escalaGasto(cargo, eleitorado) )     (0 a 1, retorno decrescente)
```
- Reserva não gasta volta ao partido após a eleição (regra de sobra a confirmar).

### 4.5 Máquina efetiva
Quatro componentes distintos, cada um com uma única origem:
| Componente | Origem | Variável |
|---|---|---|
| Base própria | organização do candidato | `baseTerritorial[m]` |
| Estrutura compartilhada | capilaridade dos partidos coligados | `estruturaAliada[m]` |
| Mobilização | recurso próprio e recurso destinado por aliados | `efeitoMob(alocMobilizacao[m] + mobAliada[m])` |
| Transferência | força pessoal de lideranças individuais aliadas | `transferencia[m]` |

```
t[l]           = clamp( forca[l] × aderencia[l,c] × T[l],  0,  forca[l] ),   T[l] = exp(σt Z[l] - σt²/2)
transferencia[m] = 1 - Π_{l aliada em m} (1 - t[l])

maquinaEfetiva[m] = 1 - (1 - baseTerritorial[m]) × (1 - estruturaAliada[m])
                      × (1 - efeitoMob(alocMobilizacao[m] + mobAliada[m])) × (1 - transferencia[m])
```
- Combinação por complemento: cada componente acrescenta, o total fica entre 0 e 1.
- `estruturaAliada` existe só com coligação registrada (majoritária) ou federação (proporcional). Partido da própria lista não conta como aliado.
- `T[l]`: um sorteio por par (liderança, candidato, eleição), ordem fixa por código IBGE e id. Média 1 antes do corte; o corte superior em `forca[l]` reduz levemente a média, efeito a medir na calibração. A força pessoal da liderança não compõe identificação, base própria nem estrutura.
- Fora do conjunto de agentes, as lideranças são um agregado municipal (prefeito eleito e bancada municipal aliada), sem agentes.
- Escopo da máquina por tipo de eleição:
  - Eleição municipal: a máquina é calculada no próprio município. Nos municípios do conjunto da base, `baseTerritorial[m]` é o valor detalhado. Fora dele, `baseTerritorial[m] = 0` (D56), e a máquina municipal se compõe só de estrutura aliada, mobilização e transferência. O agregado regional nunca é usado em eleição municipal.
  - Disputa estadual ou nacional: média de `maquinaEfetiva[m]` ponderada pelo eleitorado. Municípios do conjunto da base entram com seu valor detalhado; os demais entram pelo agregado regional do candidato, que exclui os municípios com base detalhada, para não contá-los duas vezes.
  - Candidatos sintéticos não usam base territorial: sua máquina é `capilaridade[L] × r_g` (5.3).
- O agregado da UF é sempre soma ou média ponderada das unidades, nunca simulação paralela (9.2).

### 4.6 Opinião e eleitores sem avaliação formada
Partição do eleitorado do escopo para cada candidato:
```
desconhecimento + popularidade + rejeicao + semOpiniao = 1
```
- `semOpiniao` não é convertido em popularidade nem em rejeição. É eleitorado que conhece o candidato e decide por outros fatores.
- Na pontuação:
```
opiniao_c = clamp( popularidade_c + α × semOpiniao_c - k × rejeicao_c,  0,  1 )
```
  `α` (calibrar, entre 0 e 1) é a disposição de quem conhece sem opinião a votar no candidato quando outros fatores ajudam. É um peso do segmento, não reclassificação: `popularidade` e `rejeicao` continuam inalterados.
  `k`: parâmetro fixo por cargo (calibrar). Não depende da polarização (D51). A polarização não entra na pontuação eleitoral: age só antes da urna, pelos caminhos de 1.2 (conversão de exposição em rejeição, alcance das redes, gatilhos de eventos, vantagem de partidos pequenos), o que evita contar o mesmo efeito no estado e na urna.
- `desconhecimento` não entra em `opiniao`; esse eleitorado só chega ao candidato pela máquina e, no proporcional, pela legenda.

## 5. Eleições proporcionais (D35: competição única)

Cargos: vereador, deputado estadual ou distrital, deputado federal.

### 5.1 Concorrentes
Na unidade eleitoral (UF para deputados, município para vereador), todos disputam os mesmos válidos:
| Concorrente | Quem | Pontuação |
|---|---|---|
| Candidato individualizado i | jogador e agentes | `S_i = opiniao_i^v1 × maquinaEfetiva_i^v2 × ruido_i` |
| Candidato sintético g | demais candidatos da lista, gerados antes da apuração | `S_g = opiniao_g^v1 × maquinaEfetiva_g^v2 × ruido_g` |
| Voto de legenda ℓ_L | uma opção por lista L | `S_ℓL = λ_L × ruido_ℓL` |

`v1 + v2 = 1`. `λ_L`: atratividade relativa do voto de legenda frente aos candidatos da própria lista (calibrar por cargo; pode depender de dados de 2022 e 2024 na 1B).

### 5.2 Segmentos do eleitorado
A identificação partidária define o tamanho de segmentos, não entra na pontuação:
```
I_L = validos × identPartidaria[L] × (1 - δ)           segmento fiel à lista L
F   = validos - Σ_L I_L                                segmento livre
```
- `δ` (calibrar): fração dos identificados que escolhe fora da própria lista.
- Construção como distribuição: em cada unidade, a identificação é uma distribuição sobre categorias mutuamente exclusivas, uma por lista e uma residual `semIdentificacao`, com `Σ_L identPartidaria[L] + semIdentificacao = 1`. Os dados iniciais da 1B são montados nesse formato.
- Atualização conservativa: conjuntura e eventos só movem massa entre categorias (de uma lista para outra ou de e para `semIdentificacao`); nenhuma atualização cria ou destrói massa. A soma permanece 1 por construção.
- Normalização como proteção: se, por erro numérico, a soma se afastar de 1 além da tolerância, as categorias são reescaladas e o desvio é registrado como inconsistência. Não é mecanismo ordinário e não corrige dados sobrepostos; dado de entrada com sobreposição é rejeitado na 1B.
- Sem sobreposição: cada votante identificado pertence a uma única lista. A identificação de uma federação é a soma das identificações dos seus partidos, que são conjuntos disjuntos; um partido federado não tem identificação própria fora da federação na mesma unidade.
- Consequências: `Σ_L I_L = validos × Σ_L identPartidaria[L] × (1 - δ) ≤ validos` e `F = validos - Σ_L I_L ≥ 0`, com `0 ≤ δ ≤ 1`.
- A base é a mesma em todo o cálculo: `identPartidaria` é fração dos válidos, e os segmentos são calculados sobre os válidos.
- Federação: uma lista; sua identificação é a dos partidos membros somada (a confirmar tratamento legal).

Conversão em inteiros (D49, com distribuição hierárquica no segmento livre por D50):
1. Calcular os valores reais `I_L` de todas as listas e `F`.
2. Aplicar maior resto (4.3) ao conjunto `{I_1, ..., I_n, F}` com total `validos`, desempate por id da lista e F por último. Resultado: inteiros com `Σ I_L + F = validos` exatamente.
3. Segmento fiel: repartir cada `I_L` inteiro entre `ℓ_L` e os candidatos de L, por maior resto (inalterado, D35).
4. Segmento livre, em dois níveis:
   - 4a. Pontuação agregada de cada lista: `S_L = Σ_{i em L} S_i`.
   - 4b. Repartir `F` inteiro entre as listas, em proporção a `S_L`, por maior resto: `F_L`.
   - 4c. Repartir cada `F_L` inteiro entre os candidatos de L, em proporção a `S_i`, por maior resto.

Equivalência antes do arredondamento: na competição única, o candidato i recebe `F × S_i ÷ Σ_j S_j`. Na distribuição hierárquica, recebe `(F × S_L ÷ Σ_L' S_L') × (S_i ÷ S_L) = F × S_i ÷ Σ_j S_j`, porque `Σ_L' S_L' = Σ_j S_j`. As frações reais são idênticas; só a ordem do arredondamento muda. Não há pontuação nova de lista nem bônus partidário: `S_L` é apenas a soma das pontuações já definidas.

Conservação: cada etapa reparte um inteiro com soma exata, então `Σ_L (legenda_L + Σ_{i em L} votos_i) = validos`.

Erro do total da lista. Com `s_L = S_L ÷ Σ_j S_j`:
```
votosLista_L(int) - votosLista_L(real) = (I_L,int - I_L,real) + (F_L,int - s_L × F_real)
F_L,int - s_L × F_real = (F_L,int - s_L × F_int) + s_L × (F_int - F_real)
|erro| < 1 + 1 + s_L = 2 + s_L < 3
```
O erro não cresce com o número de candidatos. Não se afirma limite de erro por candidato: ele depende dos dois segmentos e dos dois níveis de arredondamento e não foi demonstrado.

Repartição (forma 4.2, com τ = 1 e D = 0 em cada segmento):
```
no segmento I_L: concorrentes = {ℓ_L} ∪ candidatos de L (individualizados e sintéticos)
no segmento F:   concorrentes = todos os candidatos de todas as listas (sem opções de legenda)

votos_i      = votos_i(I_L(i)) + votos_i(F)
legenda_L    = votos_ℓL(I_L)
votosLista_L = legenda_L + Σ_{i em L} votos_i
```

Garantias:
- **Identificação sem dupla contagem:** aparece só no tamanho de `I_L`; nenhuma pontuação a contém.
- **Opinião e máquina em dois segmentos:** a pontuação do candidato é usada no segmento fiel e no livre, mas cada segmento é um conjunto diferente de votantes e cada votante vota uma vez. Não há soma do mesmo eleitor.
- **Legenda:** existe só no segmento fiel e só depende de `λ_L`; não usa opinião nem máquina, e candidatos não usam identificação.
- **Puxador:** um candidato de opinião e máquina altas capta grande parte de `F`; esses votos somam ao total da lista e ajudam a eleger outros. Não há termo extra.
- **Número de candidatos:** no segmento fiel, `I_L` é fixo; mais candidatos só dividem o mesmo segmento. No segmento livre, toda pontuação é positiva (ε e ruído), então cada candidato adicional aumenta `S_L` e a fatia da lista em F. É característica estrutural do modelo, não inflação do total de votos (a soma continua igual a `validos`); seu tamanho depende do número de candidaturas registradas (L21) e da pontuação baixa dos sintéticos (5.3), e é medido pelo teste 64.
- **Soma exata:** os segmentos particionam `validos`; cada etapa usa maior resto (4.3); a soma de legendas e nominais é igual a `validos`.

### 5.3 Candidatos sintéticos
- Gerados antes da distribuição de votos, para cada lista, no fluxo de RNG de eleição com chave (unidade, lista, eleição). Não são guardados no save: são recriados pela semente.
- Número por lista: candidaturas registradas na lista, de dado da 1B quando houver; senão, estimativa pelo limite legal de candidatos por lista (a confirmar) e pelo tamanho do partido.
- Atributos:
```
opiniao_g = quadros[L] × q_g        q_g sorteado em distribuição de cauda longa, média baixa (forma a calibrar)
maquinaEfetiva_g = capilaridade[L] × r_g
```
  `quadros` e `capilaridade`: atributos do partido na unidade, 0 a 1, definidos na 1B.
- Participam de toda a disputa e da apuração: barreira individual, sobras e ordem de eleitos valem para eles como para qualquer candidato. Eleitos sintéticos recebem nome fictício gerado no momento.
- Lista sem candidatos individualizados: todos os seus candidatos são sintéticos.

### 5.4 Apuração (hipótese documental, a confirmar)
1. Quociente eleitoral: válidos ÷ vagas.
2. Quociente partidário por lista sobre `votosLista_L` (legenda e nominais somados).
3. Eleitos pelo quociente exigem votação nominal mínima de 10% do QE.
4. Sobras: lista com 80% do QE e candidato com 20% do QE.
5. Distribuição final das sobras conforme Código Eleitoral vigente.

Fonte: Código Eleitoral, arts. 108 e 109 (a confirmar o texto vigente). Percentuais não definitivos até a 1B. Coligação não existe em proporcional.

## 6. Eleições majoritárias

Cargos: prefeito, governador, senador, presidente. Concorrentes: chapas.

```
S_c = opiniao_c^(m1) × identChapa_c^(m2) × maquinaEfetiva_c^(m3) × ruido_c       (m1 + m2 + m3 = 1, m1 maior que no proporcional)
identChapa_c = clamp( Σ_{p em chapa(c)} identPartidaria[p] × adesao[p,c],  0,  1 )
chapa(c) = partido ou federação do candidato + partidos formalmente coligados
votos_c = repartição 4.2 com D para candidaturas não modeladas
```
- `opiniao` (4.6) com `k` fixo por cargo.
- `adesao[p,c]`: fração do eleitorado identificado com o partido p que segue a chapa c (calibrar; para o próprio partido ou federação do candidato, maior que para aliados; menor para aliado distante ideologicamente). Candidatura isolada tem `identChapa` igual à do próprio partido.
- `ruido_c`: dispersão `σ_c` cresce com `alcanceRedes`. Com o ruído normalizado (4.1), a votação esperada não muda; só a variância.

### 6.1 Quatro canais de aliança, sem duplicação
| Canal | Entra em | Condição |
|---|---|---|
| Identificação da chapa | `identChapa` | partido em coligação registrada |
| Estrutura compartilhada | `estruturaAliada` na máquina | mesmo partido coligado |
| Mobilização dos aliados | `mobAliada` na máquina | alocação explícita do aliado, debitada do orçamento dele |
| Transferência | `transferencia` na máquina | liderança individual com força pessoal; probabilística |

Regras: cada ator contribui em cada canal no máximo uma vez; um partido não gera transferência (só pessoas); uma pessoa não gera identificação; apoio declarado sem coligação só pode gerar transferência; nenhum bônus genérico de "apoio".

### 6.2 Senado 2026
Dois votos por eleitor, para candidatos distintos, e duas vagas. Modelo por distribuição conjunta de pares, sobre os válidos de cada voto:
```
primeiro voto:  v1_c = repartição 4.2 de validos1 entre os candidatos
segundo voto, condicionado ao primeiro:
  v2[c→d] = v1_c × S_d ÷ Σ_{j ≠ c} S_j          para todo d ≠ c
votos_d  = v1_d + Σ_{c ≠ d} v2[c→d]
```
- Cada eleitor representado em `v1_c` dá o segundo voto a um candidato diferente de c: a matriz exclui a diagonal.
- `Σ_d Σ_c v2[c→d] = validos1 - invalidos2`: a soma das segundas escolhas corresponde exatamente aos eleitores que deram primeiro voto válido e segundo voto válido.
- Segundo voto branco ou nulo: `invalidos2` retirado de `validos1` antes da matriz, por taxa de base da 1B (a confirmar existência do dado separado por voto, L19). As linhas da matriz repartem `v1_c` reduzido na mesma proporção.
- `S_d` no segundo voto é a mesma pontuação do primeiro. Afinidade entre pares (mesma coligação, mesmo campo político) é hipótese de calibração futura, sem fórmula aprovada e sem implementação no MVP.
- As duas maiores votações vencem. 2030: uma vaga e um voto.
- Arredondamento: maior resto em `v1` e em cada linha da matriz.

### 6.3 Segundo turno
Opera sobre o eleitorado, não sobre válidos.
```
origem (1º turno)                  destino (2º turno)
votou no finalista A           →   A, B, branco/nulo, abstenção     (fidelidade alta a A)
votou no finalista B           →   idem, simétrico
votou em derrotado k           →   A, B, branco/nulo, abstenção     (afinidade, rejeição, apoio declarado de k)
branco ou nulo                 →   A, B, branco/nulo, abstenção
absteve                        →   A, B, branco/nulo, abstenção     (permanência alta na abstenção)
```
- Cada origem reparte seu contingente entre os quatro destinos pela forma 4.2, com fatores próprios (calibrar). Nunca transfere integralmente.
- `validos2 = votos_A + votos_B`; `comparecimento2 = validos2 + brancos2 + nulos2`; `eleitorado` constante.
- Estados atualizados entre turnos por eventos de apoio e debate. Tempo de TV igual.

## 7. Dinheiro e exposição

### 7.1 Cadeia do dinheiro
| Etapa | Variável | Quem decide |
|---|---|---|
| 1. Total do FEFC | valor legal do ciclo | lei e TSE |
| 2. Parcela do partido | `fefcPartido[p]` | regra legal (7.2) |
| 3. Distribuição interna | critérios do partido | direção partidária (agentes), com cotas legais (a confirmar) |
| 4. Disponível ao candidato | `fundoDisponivel` | repasse do partido, fundo partidário repassado e doações |
| 5. Alocação e gasto | `alocExposicao[j]`, `alocMobilizacao`, `reserva` (4.4) | escolhas do jogador nas cartas |

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

Três conceitos separados:
| Conceito | Alcance |
|---|---|
| Dados municipais | os 5.570 municípios |
| Agentes individuais | só o conjunto de agentes (`regras-e-mundo.md` 4) e as disputas em que o jogador concorre |
| Simulação eleitoral | toda unidade eleitoral real: cada município (prefeito e câmara), cada UF (governador, senado, deputados), o país (presidente) |

### 9.1 Municípios fora do conjunto de agentes (2028, 2032)
Cada município tem eleição própria, simulada estatisticamente sem agentes guardados:
- **Prefeito:** um candidato sintético por partido ou chapa que concorra (presença definida por capilaridade do partido no município e resultado de 2024), pontuação 6 com `opiniao` sintética, `identChapa` municipal e a máquina municipal própria daquele município (4.5). 2º turno só acima de 200 mil eleitores (a confirmar).
- **Câmara:** competição única 5 com candidatos sintéticos por lista e apuração completa (quociente, barreira individual, sobras).
- `identPartidaria` municipal: valor da UF ajustado pelo desvio do município observado em 2024 (definição a fechar na 1B).
- Custo: o volume de candidatos sintéticos em 5.570 câmaras é alto. A proposta de amostragem com votos reescalados **não está validada nem escolhida**; a questão fica para a etapa 2. A validação deverá comparar amostragem e simulação integral nos mesmos municípios e sementes, verificando distribuição de cadeiras por lista, quocientes eleitoral e partidário, cumprimento da barreira individual e distribuição das sobras. Nenhum método ou parâmetro é definido agora.

### 9.2 Coerência
- Totais respeitam eleitorado, comparecimento e válidos de cada unidade.
- Resultados municipais atualizam prefeituras, bancadas municipais e lideranças. As lideranças aliadas eleitas entram na transferência (4.5) da eleição seguinte. A base territorial do personagem pode crescer com aliados eleitos (`carreira-e-poder.md` 10.2), mas por variável própria; a força pessoal das lideranças nunca é copiada para a base.
- Agregados por UF são somas das unidades, nunca simulação paralela; municípios com base detalhada não entram também no agregado regional (4.5).
- Bancadas, governos e fundos vêm sempre do resultado simulado.
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
1. Pesos `w`, `v`, `m` por cargo (soma 1 fixada; repartição interna a calibrar).
2. `ε`, `D` (dispersão) e `τ` (estrutural 1; muda só com calibração histórica).
3. `escalaGasto(cargo, eleitorado)` e padrão de distribuição da mobilização entre municípios.
4. `α` (peso de quem conhece sem opinião formada) e `k` por cargo.
5. `λ_L` (atratividade da legenda) e `δ` (identificados que escolhem fora da lista).
6. `adesao[p,c]`, inclusive para o partido do próprio candidato.
7. `quadros`, `capilaridade`, número de candidatos sintéticos e distribuições de `q_g` e `r_g`.
8. `estruturaAliada[m]` a partir da capilaridade dos coligados.
9. `σt` da transferência e `σ_c` do ruído, com dependência de `alcanceRedes`.
10. Conversão de TV, redes e exposição em notoriedade, popularidade e rejeição.
11. Atualização da identificação partidária pela aprovação do governo e pelo desempenho presidencial.
12. Decaimento de notoriedade, popularidade, rejeição, base e grupo.
13. Fatores de cada origem e destino da matriz do 2º turno.
14. Branco e nulo no segundo voto do Senado.
15. Funções `estabilidade`, `negociacao` e limites das faixas de governabilidade.
16. Critérios de distribuição interna de fundos pelos partidos.
17. Amostragem de candidatos sintéticos nas câmaras municipais fora do conjunto de agentes.
