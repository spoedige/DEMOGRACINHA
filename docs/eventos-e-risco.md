# Eventos e risco

## 1. Eventos atrasados

Toda carta pode agendar um evento futuro com janela de vencimento, probabilidade e condição. O motor guarda uma fila ordenada por data. Ao abrir uma janela, os eventos vencidos são resolvidos antes das cartas.

Estrutura mínima:
```
{ id, origem, venceEm, prob, condicao, efeitos, cadeia? }
```

## 2. Agentes fictícios

- Nomes gerados por combinação de listas de prenomes e sobrenomes comuns, filtrados contra nomes de políticos reais conhecidos.
- Atributos: partido, cargo, ambição, lealdade, ideologia, relação com o jogador.
- Existem individualmente só no conjunto de agentes (`regras-e-mundo.md` 4). No resto, o mundo é estatístico, mas cada um dos 5.569 municípios com eleição municipal tem eleição própria (D58) (`motor-eleitoral.md` 9).
- Rede de agentes alimenta convites, rivalidades, janela partidária e escândalos.

## 2.1 Conjuntura autônoma (MVP simplificado, P9)

Poucas variáveis de mundo, atualizadas a cada janela (incluindo as automáticas), pelo fluxo de RNG de mundo, sem depender do jogador:

| Variável | Nacional | Estadual (27 UFs) | Local |
|---|---|---|---|
| Aprovação do governo | governo federal | governo de cada UF | prefeitura, só nos municípios do conjunto de agentes |
| Polarização | sim | desvio da UF em relação à nacional | não |
| Clima econômico percebido | sim | desvio da UF | não |
| Tensão institucional | sim | não | não |

- Estados e locais são desvios em torno do nacional, não simulações completas.
- Alcance por eleição: presidente lê o nacional; governador e senador, o estadual; deputado, o estadual (o nacional chega via identificação partidária, `motor-eleitoral.md` 1.2); prefeito e vereador, o local nos municípios do conjunto de agentes, senão o estadual (inclusive em municípios da base fora desse conjunto).
- Evolução: tendência mais ruído, com reversão lenta à média (calibrar).
- Caminhos causais: ver `motor-eleitoral.md` seção 0. A conjuntura nunca entra direto na fórmula de voto.
- O jogador influencia pouco e só no escopo do próprio cargo.

### Gatilhos de evento
Limiar não dispara evento sozinho. Regra:
```
habilitado = variável cruzou o limiar do evento
chance     = probBase × intensidade do cruzamento
bloqueio   = evento (ou família) não repete antes de N janelas (calibrar)
```
Assim a conjuntura torna o evento possível e provável, nunca certo.

## 3. Crises e escândalos

Livres da regra de acoplamento: até 3 variáveis, até 4 opções, sempre com uma saída de contenção. Tipos iniciais: crise de gestão, denúncia de imprensa, racha partidário, crise fiscal, desastre natural, crise de aliado, perda de base parlamentar, retaliação por compromisso rompido.

## 4. Pontos de Inflexão

- Raros e condicionais, oferecidos a quem está posicionado. Há dois tipos de gatilho: limiares da conjuntura (seção 2.1) e marcos do calendário (`GDD.md` 3), como o debate em J5. Nenhum é sorteio puro.
- Cadeia de 2 a 3 decisões arriscadas, sempre com saída segura que mantém o platô.
- Acerto concede **Momento**: forte efeito temporário em notoriedade e oportunidades, decaindo em 1 a 2 ciclos. Nunca é desbloqueio permanente.

Cadeias do MVP (3 a 5):
| Cadeia | Gatilho | Para quem |
|---|---|---|
| Relatoria de CPI | crise nacional com comissão aberta | deputado ou senador com Articulação razoável |
| Debate viral | debate em J5 | candidato majoritário |
| Onda digital | polarização alta | partido pequeno ou origem Influenciador/Coach |
| Ministério em crise | ruptura no Executivo federal | deputado ou senador da base |
| Vice que sucede | queda do titular | vice em exercício |

Outras candidatas (Fase 2 ou expansão): ruptura de coalizão, vacância.

## 5. Corrupção

Separação clara, pelo tipo de contrapartida:
| Contrapartida | Natureza | Exemplo |
|---|---|---|
| Apoio legislativo ou político público | legítima | emenda ou indicação em troca de voto em proposta ou adesão à base |
| Apoio eleitoral obtido com recurso institucional | ilícita | emenda condicionada a pedido de votos ou a uso da máquina pública na campanha (enquadramento legal a confirmar) |
| Vantagem pessoal | ilícita | emenda ou cargo em troca de pagamento ou benefício privado |

| Nível | Exemplo | Ganho | Risco |
|---|---|---|---|
| 1. Favor | emenda ou indicação em troca de benefício privado de pequeno valor ou de apoio eleitoral com uso de recurso institucional | pequeno | baixo, Arquivo Vermelho +1 |
| 2. Desvio | usar a capacidade institucional (emenda, contrato, indicação) para desviar recurso público em benefício pessoal; o Capital de Entrega não se converte em dinheiro, o desvio é do recurso orçamentário influenciado | médio | médio, agenda investigação |
| 3. Esquema | estrutura recorrente com operadores | alto | alto, cadeia de escândalo |

- Descoberta atrasada: cada ato agenda eventos de exposição com probabilidade crescente no tempo.
- Escada de consequências: rumor, reportagem, investigação, denúncia, condenação, inelegibilidade.
- Corromper pode ajudar e pode aposentar.

### Candidatura laranja
- Carta opcional de corrupção: mais votos ao partido, risco de cassação de toda a chapa.
- Evento de crise: debate de 2026 sobre manter eleitas que não participaram da fraude (referência real só na documentação; tratamento legal a confirmar).

## 6. Situação jurídica

Status: Regular, Investigado, Condenado, InelegibilidadeReconhecida. Risco jurídico é probabilidade separada. Risco alto sozinho nunca gera inelegibilidade; só a escada processual. Condenação e inelegibilidade não são equivalentes automáticos: `InelegibilidadeReconhecida` só ocorre quando a condenação se enquadra em hipótese legal de inelegibilidade (tipo de crime ou ato, órgão colegiado ou trânsito em julgado, prazos; a confirmar na 1B). Condenado sem esse enquadramento pode concorrer.

## 6.1 Estados temporários (P10, MVP simplificado)
| Estado | Origem | Duração | Efeitos |
|---|---|---|---|
| Investigado | evento da escada de consequências (seção 5) | até arquivamento, denúncia ou prazo máximo de janelas (calibrar) | risco jurídico sobe; Cúpula e credibilidade sob pressão; cartas de defesa no pool; pode concorrer |
| Afastamento cautelar | decisão judicial em evento | prazo do evento (calibrar dentro de faixa a confirmar) | perde exercício do cargo, mantém mandato; sem Capital de Entrega; no Executivo assume o vice; no Legislativo, o suplente entra só se a regra aplicável ao cargo determinar convocação (L23, L26) |
| Licença de saúde | saúde abaixo de limiar ou evento | 1 a 3 janelas (calibrar) | sem cartas de ação, só opção segura; notoriedade decai; se longa, no Executivo assume o vice; no Legislativo, o suplente entra só se a regra aplicável ao cargo determinar convocação (prazos distintos por cargo, L23, L27) |
| Licença para nomeação | legislador que aceita cargo de nomeação governamental | duração da nomeação | suplente entra só se a regra aplicável ao cargo determinar convocação (L23, L25); mandato preservado conforme essa regra; pode voltar. Não se aplica a chefe do Executivo |
Cada estado tem id estável, origem registrada no histórico e fim definido. Nenhum gera game over.

Suplência no MVP (D55): mínima. Quando ocorrer afastamento ou licença que, conforme a regra aplicável ao cargo, determine a convocação de suplente (L23, L25, L27), o sistema registra a entrada do suplente da lista (proporcional) ou da chapa (Senado) como agente sintético, sem atributos próprios além de partido e alinhamento; o mandato do titular é preservado conforme a regra do cargo. Afastamento ou licença que não determinem convocação não geram suplente. Ordem detalhada de suplência, suplentes individualizados do Senado e sucessão definitiva por suplente: Fase 2.

## 7. Saúde

Gradual, afetada por idade, desgaste de campanha e crises. Saúde baixa reduz energia e janelas disponíveis e pode gerar evento de afastamento. Fim de carreira por saúde é evento com escolha, nunca game over automático.
