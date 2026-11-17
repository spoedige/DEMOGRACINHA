# Registro de decisões

Decisões aprovadas pelo autor. Cada uma indica o que muda nos docs e o que depende de outra decisão. Até a revisão integrada da arquitetura, os docs de 1A continuam valendo onde não houver conflito.

## D1. Potencial fora da urna (P11), 17/11/2026

> Revista por D34: o potencial não tem efeito eleitoral direto, mas as aptidões que ajuda a desenvolver agem normalmente. O texto abaixo é histórico.

**Decisão:** o potencial não modifica o resultado eleitoral. Afeta aprendizado, evolução das aptidões e aproveitamento de oportunidades. A urna responde a fatores políticos, eleitorais, territoriais, partidários e conjunturais.

**Impacto nos docs:**
- `motor-eleitoral.md`: remover `potencialMod` das fórmulas proporcional e majoritária.
- `carreira-e-poder.md` seção 3: remover o efeito eleitoral do potencial e acrescentar o aproveitamento de oportunidades.
- `roadmap.md`: a meta de 1 a 3% de Presidência por faixa de potencial passa a ser medida, não imposta.

**Pendência:** definir como "aproveitamento de oportunidades" age sem virar modificador indireto de urna (por exemplo, afetando a frequência das oportunidades e não o seu resultado).

## D2. Escopo das propostas, 17/11/2026

| Proposta | Decisão |
|---|---|
| P2 facções partidárias | Fase 2 |
| P3 base territorial | MVP simplificado |
| P6 compromissos com atores | MVP simplificado |
| P9 conjuntura autônoma | MVP simplificado |
| P11 potencial fora da urna | MVP |
| P1, P4, P5, P7, P8, P10, P12, P13 | Sem classificação até análise integral |

**Dependências afetadas por P2 na Fase 2:**
- P7 (nomeações e direção partidária) perde o mecanismo de indicação por facção. Alternativa provisória: indicação via Cúpula.
- P8 (influência) perde o componente de comando partidário.

**Dependências das aprovadas:**
- P3 depende de `municipios.json` (1B) e do motor municipal.
- P6 depende de agentes individuais e precisa de um tipo de custo "compromisso" na regra de acoplamento das cartas (`GDD.md` seção 4).
- P9 depende de um fluxo de RNG de mundo separado do fluxo de cartas.

## D3. Sistemas institucionais e reputacionais, 17/11/2026

| Conceito | Natureza | Visível | Quem tem |
|---|---|---|---|
| Relação com Executivo | relacional | sim | todos |
| Governabilidade | institucional e contextual | sim | ocupantes de cargo executivo |
| Credibilidade | reputacional | sim | todos |
| Capital político | derivado de relações, influência, reputação e mobilização | não | todos |

**Impacto nos docs:**
- `carreira-e-poder.md` seções 1, 8 e 10: incluir governabilidade e credibilidade; capital político deixa de ser estado guardado e passa a ser calculado.
- `GDD.md` seção 5: governabilidade e credibilidade competem pelo limite de cerca de 6 números na tela de decisão. Proposta a avaliar: exibição por faixa.

**Pendências:**
- Se P4 não entrar no MVP, de onde vem a governabilidade (bancada aliada simulada exige base parlamentar mínima).
- Se P6 não fornecer o histórico de compromissos, o que alimenta a credibilidade.

## D4. Avaliação final em cinco dimensões, 17/11/2026

Alcance institucional, influência política, realizações, reputação e legado. O cargo mais alto é relevante e não decide sozinho. Pesos a calibrar sem privilegiar a Presidência.

**Fonte de cada dimensão no estado atual:**
| Dimensão | Já existe | Falta |
|---|---|---|
| Alcance institucional | cargos, mandatos | valor do cargo por contexto (P12, não classificada) |
| Influência política | relações, cargo | grupo político (P1) e comando partidário (P2, Fase 2) |
| Realizações | Capital de Entrega gasto | definição do que conta como entrega |
| Reputação | indicadores, credibilidade (D3), Arquivo Vermelho | nada essencial |
| Legado | títulos, tags | sucessores e grupo político (P1) |

**Pendência:** sem P1, as dimensões influência e legado ficam fracas no MVP.

**Impacto nos docs:** `carreira-e-poder.md` seção 12 e `titulos.md` seção 4.

## D5. Diretriz, 17/11/2026

Não iniciar o motor completo nem expandir o MVP antes da revisão integrada da arquitetura. Preservar a identidade própria: nenhum equivalente político de mecânica esportiva só para reproduzir a referência.

## D6. Grupo político (P1), 17/11/2026

**Decisão:** MVP simplificado. Representado por indicadores agregados (influência, relações, presença institucional). Atravessa partidos. Mantém influência fora do cargo. Membros individuais, disputa interna, facções e sucessão detalhada: Fase 2.

**Incorporado em:** `carreira-e-poder.md` 10.1 e 12; `GDD.md` pilar 7.

## D7. Base parlamentar e governabilidade (P4), 17/11/2026

**Decisão:** MVP simplificado. Por casa legislativa, blocos de partido ou federação com cadeiras, alinhamento e coesão; custo de manutenção; perda de apoio durante o mandato. Governabilidade não equivale ao percentual de cadeiras. Sem parlamentares individuais.

**Incorporado em:** `motor-eleitoral.md` 8.

## D1 complemento, 17/11/2026

O potencial pode aumentar a disponibilidade de oportunidades de desenvolvimento e formação. Não pode aumentar quantidade ou qualidade de oportunidades eleitorais, candidaturas competitivas, alianças ou recursos de campanha.

**Incorporado em:** `carreira-e-poder.md` 3 e 8; `motor-eleitoral.md` 3 e 4; `roadmap.md` teste 26.

## Revisão integrada, 17/11/2026

D1 a D7 incorporadas a `GDD.md`, `docs/motor-eleitoral.md`, `docs/carreira-e-poder.md`, `docs/eventos-e-risco.md`, `docs/regras-e-mundo.md`, `docs/roadmap.md` e `titulos.md`.

Pendências de arquitetura para a revisão do MVP:
1. P7 (nomeações) segue sem classificação; sem ela, presença institucional do grupo conta só mandatos.
2. P6 depende de contrapartes agregadas; agentes individuais continuam restritos aos municípios selecionados.
3. Estado salvo cresce com grupo, base, compromissos e bases parlamentares; revisar o formato do delta.
4. Ritmo Express resolve automaticamente janelas com compromissos vencendo; a opção segura precisa definir se cumpre ou rompe (proposta: cumpre se houver recurso).

## Revisão de arquitetura, 17/11/2026

| Id | Decisão | Incorporado em |
|---|---|---|
| D8 | P7 cargos de nomeação: MVP simplificado, lista fechada, oferta por relação, composição do governo e articulação | `carreira-e-poder.md` 10.4 e 11 |
| D9 | Conjuntura: 4 variáveis com alcance nacional, estadual (desvio) e local simplificado; limiar habilita, probabilidade decide, bloqueio de repetição | `eventos-e-risco.md` 2.1 |
| D10 | Compromissos: 4 tipos; repasse só institucional ou orçamentário; registro de ator, objeto, prazo, custo, contrapartida e consequências | `carreira-e-poder.md` 10.3 |
| D11 | Governabilidade: 4 faixas; considera cadeiras, coesão, estabilidade, custo e negociação; sem barra | `motor-eleitoral.md` 8 |
| D12 | Limites: 10 municípios individualizados, 5 compromissos ativos; vencidos no histórico | `carreira-e-poder.md` 10.2 e 10.3 |
| D13 | Save versionado com `saveVersion`, ids estáveis, só estado mutável, migração em cadeia | `CLAUDE.md` |
| D14 | Express: cumpre com recurso; falta de recurso prioriza maior custo político de romper, desempate determinístico; rompidos registrados | `GDD.md` seção 3 |
| D15 | Mapa de causalidade: cada causa chega à urna por um único caminho; `conjuntura` e `desempenho` saem da fórmula de voto | `motor-eleitoral.md` 0, 3 e 4 |

As pendências 1, 3 e 4 da revisão integrada foram resolvidas por D8, D13 e D14. A pendência 2 segue: contrapartes são agregadas e agentes individuais continuam restritos.

## Consolidação do motor eleitoral, 17/11/2026

| Id | Mudança | Onde |
|---|---|---|
| D16 | Mapa de causalidade por fenômeno; urna lê estados; três fenômenos nacionais separados; hipótese H1 (palanque) documentada e não implementada | `motor-eleitoral.md` 0 e 1 |
| D17 | Forma de repartição limitada (pontuação logarítmica e participação nos válidos) no lugar de produto aberto | 4.1 |
| D18 | Proporcional em dois níveis: lista (com identificação) e nominal (sem identificação) | 5.1 |
| D19 | Majoritária sem `notoriedade`, `tempoTV`, `redes`, `gasto` e `coligacao` como termos; `identChapa` e máquina no lugar | 6 |
| D20 | Gasto dividido em exposição (fluxo) e mobilização (dia); transferência de prefeito limitada e exclusiva da máquina | 4.2, 4.3 |
| D21 | Cadeia do dinheiro em cinco etapas; candidato não recebe parcela automática | 7.1 |
| D22 | Teste de dupla contagem por desligamento de caminho, sem proporção fixa | `roadmap.md` teste 32 |

Correção registrada: o teste de dupla contagem é o 32, não o 37. A versão da `main` ainda contém `potencialMod` e `caronaNacional`; a branch de revisão já os havia removido desde D1.

### Recomendação de classificação (aguarda aprovação)
| Proposta | Recomendação | Justificativa |
|---|---|---|
| P5 credibilidade | MVP, já absorvida por D3 | não cria variável nova; fechar como incorporada |
| P8 influência | MVP, absorvida pela dimensão influência do grau e por `grupo.influencia` | medida separada duplicaria o grupo |
| P10 estados temporários | MVP simplificado: investigação, afastamento cautelar, licença de saúde, licença para nomeação | já exigidos por status jurídico, saúde e D8; sem eles essas regras ficam sem forma |
| P12 valor do cargo por contexto | MVP simplificado na ficha de oportunidade, derivado de escopo, governabilidade e posição na coalizão; orçamento real na Fase 2 | orçamento exige dados não previstos na 1B |
| P13 coalizão de governo | Fase 2 para formação completa da coalizão federal com distribuição de ministérios; MVP já cobre base parlamentar (D11) e nomeações (D8) | evita o item mais caro sem perder o essencial |

## Decisões finais de pendências, 17/11/2026

| Id | Decisão | Onde |
|---|---|---|
| D23 | P5 credibilidade MVP, só sobre atores políticos, quadro de não duplicação | `carreira-e-poder.md` 1 |
| D24 | H1 fora do MVP, hipótese futura sem implementação | `motor-eleitoral.md` 1.3 |
| D25 | Posições partidárias sem Capital de Entrega; efeitos de influência partidária e organizacional | `carreira-e-poder.md` 10.4 |
| D26 | P8 influência MVP, dimensão própria sem cargo | `carreira-e-poder.md` 12 |
| D27 | P10 estados temporários MVP simplificado com origem, duração e efeitos | `eventos-e-risco.md` 6.1 |
| D28 | P12 valor do cargo MVP simplificado, descritivo, sem bônus | `carreira-e-poder.md` 10.5 |
| D29 | P13 coalizão completa na Fase 2 | `carreira-e-poder.md` 10.6 |
| D30 | Repartição detalhada: pontuação normalizada, τ = 1 estrutural, maior resto, legenda, candidato genérico | `motor-eleitoral.md` 4 e 5 |
| D31 | Eleitores que conhecem sem opinião formada (`semOpiniao`) | `motor-eleitoral.md` 4.6 |
| D32 | Gasto em alocações distintas com reserva | `motor-eleitoral.md` 4.4 |
| D33 | Quatro canais de aliança sem duplicação | `motor-eleitoral.md` 4.5 e 6.1 |

## Revisão pós-auditoria, 17/11/2026

| Id | Decisão | Onde |
|---|---|---|
| D34 | Potencial sem efeito eleitoral direto; aptidões adquiridas agem normalmente. D1 atualizada | `motor-eleitoral.md` 0 e 1.2; `carreira-e-poder.md` 3; testes 26 e 60 |
| D35 | Proporcional por competição única com segmentos fiéis e livre, voto de legenda e candidatos sintéticos prévios | `motor-eleitoral.md` 5 |
| D36 | Novas origens, todos sem mandato, origem como caminho | `carreira-e-poder.md` 1 |
| D37 | Só presidente de diretório no MVP; demais posições partidárias na Fase 2 | `carreira-e-poder.md` 10.4 |
| D38 | Aposentadoria voluntária, sem idade máxima | `GDD.md` 1 |
| D39 | O Fenômeno por trajetória; quadro de desenvolvimento no lugar de potencial versus alcançado | `titulos.md`; `carreira-e-poder.md` 12 |

Correções técnicas da auditoria, aplicadas sem decisão nova por não alterarem escopo:
- Ruído e transferência com multiplicador de média 1 (`exp(σZ - σ²/2)`).
- Pontuação descrita como positiva sem teto.
- Mobilização alocada por município.
- Transferência generalizada para lideranças individuais.
- Grupo político retirado da máquina (fica em influência).
- Senado por matriz condicional de pares distintos.
- `identChapa` inclui o próprio partido ou federação.
- Eleitorado, comparecimento, brancos, nulos e válidos separados; 2º turno sobre o eleitorado.
- Simulação própria de cada um dos 5.570 municípios, sem agentes.
- Condenação distinta de inelegibilidade.
- Capital de Entrega definido como capacidade institucional abstrata.
- Capital político sem uso conjunto com seus componentes.
- Influência ao longo da carreira e legado só após a saída.
- Senado com influência legislativa alta; vice com notoriedade no escopo da chapa; vice e suplente separados.
- Tempo legal de TV separado da distribuição interna de exposição.
- Contrapartida legítima e ilícita de emenda definida pelo tipo de apoio.
- Teste 19 dividido em determinístico e estatístico.
- Fonte única por regra declarada em `CLAUDE.md`.

## Ajustes finais da revisão documental, 17/11/2026

| Id | Mudança | Onde |
|---|---|---|
| D40 | O Improvável por condições políticas desfavoráveis observáveis, sem potencial | `titulos.md` |
| D41 | Amostragem das câmaras municipais não validada; critério de validação registrado; decisão na etapa 2 | `motor-eleitoral.md` 9.1 |
| D42 | Comparecimento, abstenção, brancos e nulos fixos e não dinâmicos no MVP | `motor-eleitoral.md` 4.2.1 |
| D43 | Afinidade no Senado como hipótese futura sem fórmula | `motor-eleitoral.md` 6.2 |
| D44 | Calendário oficial único no `GDD.md` 3; demais docs referenciam | `GDD.md`, `regras-e-mundo.md`, `roadmap.md` |
| D45 | Pendências legais L1 a L32 com objeto e tipo de fonte | `roadmap.md` 7.1 |
| D46 | Correção de definição: `identPartidaria` como fração dos válidos, normalizada, sem sobreposição. A arquitetura D35 não muda | `motor-eleitoral.md` 2 e 5.2 |

## Correções de fechamento, 17/11/2026

| Id | Mudança | Onde |
|---|---|---|
| D47 | Propriedade `redePoliticaPrevia` (nenhuma, indireta, direta) por origem; O Improvável a consulta; comparações com a média dos registrados na disputa, início da campanha | `carreira-e-poder.md` 1; `titulos.md` |
| D48 | Identificação como distribuição exclusiva com categoria residual, atualização conservativa, normalização só como proteção | `motor-eleitoral.md` 2 e 5.2 |
| D49 | Segmentos convertidos em inteiros por maior resto antes da repartição interna | `motor-eleitoral.md` 5.2 |

Os valores de `redePoliticaPrevia` por origem são proposta para revisão do autor.

## Correções da auditoria de consistência cruzada, 17/11/2026

Base: `3b9b68e`. Itens R1 a R24 e A1 do relatório de auditoria.

| Id | Decisão | Onde |
|---|---|---|
| D50 (R1) | Segmento livre repartido em dois níveis (listas por `S_L = Σ S_i`, depois candidatos), equivalente à competição única antes do arredondamento; erro do total da lista menor que `2 + s_L` | `motor-eleitoral.md` 5.2 |
| D51 (R2) | `k` fixo por cargo; a polarização não entra na pontuação eleitoral e age só antes da urna (conversão de exposição em rejeição, alcance das redes, gatilhos de eventos, vantagem de partidos pequenos). Redação corrigida em 17/11/2026 | `motor-eleitoral.md` 4.6 e 6 |
| D52 (R4) | Dois conjuntos municipais: agentes (fixo, inicial mais nove maiores eleitorados da UF inicial) e base (dinâmico, até 10, qualquer UF). D12 interpretada: o limite de 10 vale para cada conjunto | `regras-e-mundo.md` 4; `motor-eleitoral.md` 4.5 e 9 |
| D53 (R3) | Base territorial sem apoio local; força das lideranças só na transferência | `carreira-e-poder.md` 10.2 |
| D54 (R6) | Oferta de nomeação sem capital político | `carreira-e-poder.md` 10.4 |
| D55 (R8) | Suplência mínima no MVP; detalhamento na Fase 2 | `eventos-e-risco.md` 6.1; `regras-e-mundo.md` 1 |
| A1 | Professor/Educador mantém `nenhuma`; descrição como vínculo profissional | `carreira-e-poder.md` 1 |

Demais correções (R5, R7, R9 a R24) são de redação, referência e testes, sem nova decisão de projeto. Pendências L33 a L35 incluídas e abertas.

## Ajustes pós-auditoria, 17/11/2026

| Id | Mudança | Onde |
|---|---|---|
| D51 (redação) | Polarização fora da pontuação e do `k`; caminhos anteriores à urna mantidos como em 1.2 | `motor-eleitoral.md` 4.6; teste 85 |
| D56 | Fora do conjunto da base, `baseTerritorial = 0` na máquina municipal; agregado regional só em disputa estadual ou nacional | `motor-eleitoral.md` 2 e 4.5; teste 91 |
| D55 (redação) | Suplente só quando a regra do cargo determinar convocação | `eventos-e-risco.md` 6.1; teste 92 |
| D57 | Tela de decisão: no máximo 6 números simultâneos; faixas fora da contagem | `GDD.md` 5; teste 22 |
| Títulos | O Articulador passa à Fase 2 | `titulos.md` |
| Teste 42 | Enunciado (c) corrigido: convergência para máquina igual a 1 | `roadmap.md` |

D50 inalterada.

## Dados estatísticos, 17/11/2026

| Id | Decisão | Onde |
|---|---|---|
| D58 | Três conjuntos: 5.571 municípios do cadastro IBGE; 5.569 com eleição municipal própria (sem Brasília e Fernando de Noronha); unidades estatísticas eleitorais variáveis, com exterior sem associação a município | `regras-e-mundo.md` 4; `motor-eleitoral.md` 9 |
| D59 | Identidade do comparecimento com as seis parcelas do TSE (válidos, brancos, nulos com técnicos, anulados, anulados sub judice, anulados em apuração separada) e votos por eleitor; agregação em `anuladosTotal` só com transformação explícita | `motor-eleitoral.md` 4.2.1 |
| D60 | Mundo inicial só com dados publicados até 31/12/2025; dados de 2026 só para calibração. Consequência: a regra do conjunto de agentes (D52) passa a usar o último retrato de eleitorado até essa data, em vez do snapshot de 2026 | `regras-e-mundo.md` 4; `roadmap.md` 4 |
| D61 | Eleições ordinária e suplementares separadas por `CD_ELEICAO`; suplementares mantidas nos brutos e fora dos parâmetros da ordinária | `roadmap.md` 4; `coleta-estatistica.md` 2 |
| D62 | No MVP, as três categorias de votos anulados são parâmetros históricos fixos por unidade eleitoral e tipo de eleição, da última eleição ordinária anterior a 31/12/2025 (municipal: 2024; geral: 2022), calculadas sobre o total de votos possíveis com `votosPorEleitor`, mantidas separadas e não atribuídas a candidatos. Ausência de referência tem fallback explícito (taxa da UF, marcada como estimativa) ou lacuna registrada, nunca zero. Relação com a situação jurídica das candidaturas: Fase 2 | `motor-eleitoral.md` 4.2.1; teste 97 |
