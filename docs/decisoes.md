# Registro de decisões

Decisões aprovadas pelo autor. Cada uma indica o que muda nos docs e o que depende de outra decisão. Até a revisão integrada da arquitetura, os docs de 1A continuam valendo onde não houver conflito.

## D1. Potencial fora da urna (P11), 17/11/2026

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
