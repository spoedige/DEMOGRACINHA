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
- Existem individualmente só no município do jogador, nas capitais e em cidades com mais de 200 mil eleitores. No resto, o mundo é estatístico.
- Rede de agentes alimenta convites, rivalidades, janela partidária e escândalos.

## 3. Crises e escândalos

Livres da regra de acoplamento: até 3 variáveis, até 4 opções, sempre com uma saída de contenção. Tipos iniciais: crise de gestão, denúncia de imprensa, racha partidário, crise fiscal, desastre natural, crise de aliado.

## 4. Pontos de Inflexão

- Raros e condicionais, oferecidos a quem está posicionado.
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

Separação clara: negociação legítima (apoio por cargo, emenda por voto) usa Capital de Entrega dentro da regra. Prática ilícita converte recurso político em ganho pessoal ou frauda a eleição.

| Nível | Exemplo | Ganho | Risco |
|---|---|---|---|
| 1. Favor | emenda dirigida a aliado em troca de apoio pessoal | pequeno | baixo, Arquivo Vermelho +1 |
| 2. Desvio | converter Capital de Entrega em Caixa Pessoal | médio | médio, agenda investigação |
| 3. Esquema | estrutura recorrente com operadores | alto | alto, cadeia de escândalo |

- Descoberta atrasada: cada ato agenda eventos de exposição com probabilidade crescente no tempo.
- Escada de consequências: rumor, reportagem, investigação, denúncia, condenação, inelegibilidade.
- Corromper pode ajudar e pode aposentar.

### Candidatura laranja
- Carta opcional de corrupção: mais votos ao partido, risco de cassação de toda a chapa.
- Evento de crise: debate de 2026 sobre manter eleitas que não participaram da fraude (referência real só na documentação; tratamento legal a confirmar).

## 6. Situação jurídica

Status: Regular, Investigado, Condenado, InelegibilidadeReconhecida. Risco jurídico é probabilidade separada. Risco alto sozinho nunca gera inelegibilidade; só a escada processual. Condenado não concorre.

## 7. Saúde

Gradual, afetada por idade, desgaste de campanha e crises. Saúde baixa reduz energia e janelas disponíveis e pode gerar evento de afastamento. Fim de carreira por saúde é evento com escolha, nunca game over automático.
