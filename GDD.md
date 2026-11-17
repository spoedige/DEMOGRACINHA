# DEMOGRACINHA: Game Design Document

Versão 1A.1 (17/11/2026). Status: em revisão.

Simulador de carreira política brasileira, só modo carreira, tom sério e sem sátira. Partidos, federações e municípios são reais. Pessoas, agentes e eventos são fictícios. A inspiração é o Simulador de Carreira do Copero; todas as mecânicas aqui são adaptações de design próprio. Nenhum código, texto ou imagem do Copero é usado, e o repositório copero-99-ovr não é referência técnica.

## Convenções

- **(a confirmar)**: dado legal ou numérico sem verificação em fonte oficial.
- **(calibrar)**: parâmetro de balanceamento. É hipótese, nunca verdade.
- Nenhum número oficial é inventado. Nenhum travessão em texto do jogo ou da documentação.

## Mapa dos documentos

| Arquivo | Conteúdo |
|---|---|
| `GDD.md` | Visão, loop, UX mobile, visual, acoplamento de cartas, ritmos |
| `docs/regras-e-mundo.md` | Cargos, regras legais, partidos, federações, municípios, alianças |
| `docs/motor-eleitoral.md` | Estoques, fórmulas, FEFC, TV, rede social, cláusula, fechamento do ciclo |
| `docs/carreira-e-poder.md` | Personagem, bolsos, relações, talento, potencial, platô, vice, legado, poder entre eleições |
| `docs/eventos-e-risco.md` | Eventos atrasados, agentes, crises, Pontos de Inflexão, corrupção, jurídico |
| `docs/roadmap.md` | Etapas, MVP, Fase 2, dados da 1B, calibração, testes, itens a confirmar |
| `titulos.md` | Títulos, resumo de carreira, grau e cartão de conquista |
| `docs/decisoes.md` | Registro de decisões aprovadas e dependências |
| `docs/referencia-copero.md` | Análise de referência e crítica independente (estudo, não especificação) |
| `CLAUDE.md` | Regras de trabalho e arquitetura técnica |

## 1. Visão

O jogador vive uma carreira de 01/01/2026 até a aposentadoria, a saída voluntária ou o fim por saúde. Cada janela pergunta o que ele aceita perder agora para chegar aonde quer depois. Não há trilha obrigatória. A Presidência é possível para qualquer personagem e nunca é desbloqueada por nível, pontuação, flag ou sequência de cargos.

Pilares:
1. **Tensão em toda escolha.** Toda carta, exceto a segura, ganha em um eixo e paga em outro.
2. **Trajetória vence lance isolado.** Efeitos limitados e decrescentes no tempo.
3. **Talento oculto, nunca destino.** O potencial molda a velocidade de desenvolvimento, nunca a urna. O teto real da carreira vem do espaço político: partido, território, alianças e conjuntura.
4. **Objetivos em conflito.** O jogo não pode virar maximização de pontos.
5. **Lei como terreno.** Calendário, idades, quociente, cláusula, fundo e TV seguem as regras reais.
6. **Celular primeiro.** Uma coluna, poucos números, decisões em cartas.
7. **Poder não é só cargo.** Influência sobrevive fora do mandato por meio do grupo político, da base territorial e dos compromissos.
8. **Mundo com vida própria.** A conjuntura evolui sem o jogador e abre ou fecha oportunidades.
9. **Variável nova só com função nova.** Nenhum indicador entra se repetir a função de outro.

## 2. Loop

1. **Criação:** nome fictício, data de nascimento (idade 18 a 60), UF e município, origem, partido, dificuldade, ritmo, ambição declarada, semente opcional. Tela inicial com aviso de ficção: "Partidos e lugares são reais. Pessoas e eventos são fictícios."
2. **Janela:** atualização da conjuntura, eventos e compromissos vencidos, 2 a 4 cartas (uma segura), resolução, novos eventos atrasados.
3. **Eleição:** motor proporcional ou majoritário, 2º turno quando a regra exige.
4. **Mandato ou fase sem cargo.** Posse na primeira janela do ano seguinte.
5. **Balanço de carreira** a cada 4 anos.
6. **Fim:** resumo, títulos, grau em cinco dimensões, cartão de conquista, linha de potencial estimado vs alcançado.

## 3. Tempo e ritmo

### Ano eleitoral: 6 janelas

| Janela | Período | Foco |
|---|---|---|
| J1 | janeiro a 04/04 | Janela partidária (05/03 a 03/04), filiação, domicílio, desincompatibilização |
| J2 | 05/04 a 19/07 | Pré-campanha. Rádio e TV fora dos programas de pré-candidatos a partir de 30/06. Restrições a inaugurações e agentes públicos a partir de 04/07 |
| J3 | 20/07 a 15/08 | Convenções (20/07 a 05/08), registro até 15/08, vice, coligação, TV |
| J4 | a partir de 16/08 | Campanha de rua |
| J5 | 28/08 a 04/10 | Horário gratuito (28/08 a 01/10), debates, reta final, urna em 04/10 |
| J6 | após 04/10 | Entre turnos (2º turno em 25/10) ou pós-urna |

Limites de J2 e J6 são convenção do jogo. Datas do calendário 2026 (a confirmar no TSE).

### Ano calmo: 2 janelas (ritmo Normal)

O ano calmo tem função própria: manter e expandir a base territorial, cumprir ou renegociar compromissos, sustentar ou disputar a base parlamentar (quem governa), fortalecer o grupo político e preparar o próximo passo. Anos de eleição municipal (2028, 2032) são eleitorais para vereador e prefeito e afetam a base de todos os outros cargos.

Posse 2027: presidente 05/01, governadores 06/01, Câmara e Senado 01/02. A posse cai na primeira janela do ano seguinte.

### Ritmos

O ritmo muda só a frequência das decisões manuais. A simulação é idêntica.

| Ritmo | Ano eleitoral | Ano calmo |
|---|---|---|
| Intenso | 6 | 4 |
| Normal | 6 | 2 |
| Express | 3 (J1, J3, J5) | 1 (calibrar) |

Janela pulada é resolvida pela opção segura alinhada à ambição declarada, com os mesmos eventos e sorteios. Nenhum evento é removido.

Compromissos vencidos em janela automática: cumpridos se houver recurso. Se o recurso não cobrir todos, cumprem-se primeiro os de maior `custoPoliticoDeRomper`; empate resolvido por prazo mais antigo e depois por `id`, nunca por sorteio. Os não cumpridos são registrados como rompidos e geram as consequências normais. Requisito técnico: a sequência de consumo do RNG nunca depende do ritmo (fluxos de RNG separados por domínio; ver `CLAUDE.md`).

## 4. Cartas e janela de decisão

### Composição da janela
- Mínimo 2, máximo 4 cartas de ação. Sempre uma opção segura. Nunca completar com carta armadilha.
- Pool contextual: cargo, fase do calendário, partido, tags, talento, experiência e histórico.
- Talento nunca bloqueia carta. Altera probabilidade de sucesso, qualidade e risco.

### Regra de acoplamento (cartas de ação)
Cada carta tem:
- custo em **uma** moeda (Caixa Pessoal, Fundo de Campanha, Capital de Entrega, saúde, uma relação ou um compromisso assumido);
- efeito visível em no máximo **2 estoques + 1 relação**;
- **um** risco;
- **um** atraso (evento futuro possível).

O motor pode encadear consequências extras via eventos atrasados. Toda carta, exceto a segura, tem tensão (exemplo: popularidade sobe, Cúpula cai). Não existe carta só de vantagem.

Compromisso como custo: cartas de negociação podem cobrar em compromisso com um ator (partido, governo, grupo, liderança local). O compromisso tem prazo, benefício e custo de rompimento, e seu desfecho alimenta a credibilidade. Assim a tensão deixa de ser só entre números e passa a envolver quem lembra do acordo. Ver `docs/carreira-e-poder.md` seção 10.

### Eventos de crise e escândalo
Livres da regra de acoplamento: até 3 variáveis de uma vez e até 4 opções, sempre com uma saída de contenção.

### Efeitos
- Cinco horizontes: imediato, curto, médio, longo prazo e efeito adverso. A carta exibe só o essencial (em geral imediato e adverso); o detalhe fica em toque longo ou botão "ver mais".
- Exibição em linguagem provável ("tende a subir", "risco moderado"), nunca resultado garantido.
- Modificadores decaem no tempo (calibrar meia-vida).

### Ficha de oportunidade
Para convites, filiações, candidaturas e vice: nível do cargo, prestígio, papel esperado (protagonista ou coadjuvante), custo, risco, aderência à ambição. Subir cedo demais, sem base, reduz papel esperado e exposição.

### Exemplo de carta

> **Discurso contra a mesa diretora**
> Custo: Capital de Entrega (pequeno)
> Tende a subir: notoriedade local
> Relação: Cúpula cai
> Risco: retaliação na distribuição de emendas
> Atraso: pode voltar como convite de oposição

## 5. UX mobile

- Viewport base 360 px, uma coluna, sem hover, alvos de toque de 44 px ou mais.
- Navegação inferior fixa: **Janela** (decisão), **Carreira** (histórico, mandatos, biografia), **Partido** (situação partidária, federação, bancada), **Indicadores** (todos os escopos), **Menu** (save, ritmo, opções).
- Tela de decisão com no máximo cerca de 6 números: dos indicadores, só o escopo do cargo atual (local, estadual ou nacional) mais até 3 números de recurso. O resto vai para as telas de consulta.
- Credibilidade, governabilidade (só para executivos), conjuntura e grupo político aparecem por faixa qualitativa (ex.: "base frágil", "credibilidade sólida"), não por número, e não contam no limite.
- Capital político nunca aparece: é calculado internamente.
- Telas de consulta nunca exigem decisão.
- Aptidões aparecem só como descrição qualitativa e até 3 etiquetas.
- Aviso permanente no menu: limpar os dados do navegador apaga a partida. Botão de exportar save sempre visível ali.
- Acessibilidade: contraste mínimo 4.5:1, `prefers-reduced-motion` respeitado, texto sem depender de cor (sigla sempre escrita).

## 6. Visual

- Pixel art inspirada em Brasília, gerada em código (canvas ou SVG), `image-rendering: pixelated`. Sem assets externos, sem CDN.
- Paleta base (tons exatos a fixar na etapa 2 com teste de contraste): concreto claro, céu azul do cerrado, verde, ocre, terra vermelha.
- Elementos: Congresso Nacional (duas torres e as duas cúpulas), Esplanada dos Ministérios, Catedral, colunas do Alvorada, Eixo Monumental, céu amplo.
- Cenário muda com o cargo: câmara municipal genérica, assembleia, Congresso, Planalto. Céu muda com o mês (seca e chuva do cerrado), sem animação se `prefers-reduced-motion`.
- Fonte pixel embutida em código ou fallback de sistema monoespaçado.
- Siglas de partido em texto com cor própria, sem logos. Nenhum rosto de pessoa real; personagens são silhuetas ou sprites genéricos.

## 7. Dificuldade

Normal (potencial mais favorável) e Difícil (potencial mais baixo, mais escândalos, menos recursos). A marca "modo difícil" de partido (sem TV ou com risco de cláusula) soma por fora.

## 8. Fim de carreira

Resumo no formato "AAAA - AAAA - Cargo - Local", lista de partidos "AAAA - AAAA - Partido", derrotas incluídas, títulos e cartão de conquista.

Grau em cinco dimensões: alcance institucional, influência política, realizações, reputação e legado. O cargo mais alto pesa, mas não decide sozinho; a Presidência não é multiplicador dominante. Pesos (calibrar). Ver `docs/carreira-e-poder.md` seção 12 e `titulos.md`.
