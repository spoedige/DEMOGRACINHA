# CLAUDE.md: DEMOGRACINHA

Guia para quem trabalha neste repositório. Leia antes de qualquer alteração.

## Regras invioláveis

1. **Nunca usar travessão** (" — ", "—" ou "–" como pontuação) em texto do jogo, da documentação, de commits ou de comentários. Use vírgula, dois-pontos, parênteses ou ponto. Hífen em palavras compostas e em intervalos "AAAA - AAAA" do resumo é permitido.
2. Texto em português do Brasil, UTF-8, acentuação correta. Tom sério, sem sátira.
3. Partidos, federações e municípios reais. Pessoas, agentes e eventos fictícios. Nenhum nome ou rosto de pessoa real no jogo.
4. Nunca inventar número oficial. Marcar "(a confirmar)" o que não foi verificado em fonte oficial e "(calibrar)" todo parâmetro de balanceamento.
5. Não copiar código, texto ou imagem do Copero. copero-99-ovr não é referência.
6. Não alterar `wrangler.jsonc` e não mover `public/`.
7. Sem backend, sem analytics, sem anúncios, sem CDN, sem assets externos.
8. Em tarefa grande ou ambígua, perguntar antes de construir. Corrigir erros anteriores ao identificá-los.

## Fluxo

- Etapas: 1A docs, 1B dados, 2 MVP, 3 Fase 2. Não implementar o motor sem 1A e 1B aprovadas.
- Cada etapa termina com commit na `main` (deploy Cloudflare automático) e relatório de até 10 linhas separando verificado, estimado e a confirmar.
- Coleta de dados: testar IBGE e TSE com `curl -sI`. Em 403, parar, registrar e pedir arquivos ao autor.

## Onde está cada coisa

| Precisa de | Leia |
|---|---|
| Visão, loop, cartas, UX, visual, ritmos | `GDD.md` |
| Cargos, lei, partidos, federações, alianças | `docs/regras-e-mundo.md` |
| Fórmulas de voto, FEFC, TV, cláusula | `docs/motor-eleitoral.md` |
| Módulos, contratos e testes do motor | `docs/especificacao-motor.md` |
| Personagem, potencial, platô, vice, legado | `docs/carreira-e-poder.md` |
| Eventos, crises, corrupção, jurídico, saúde | `docs/eventos-e-risco.md` |
| Etapas, dados, calibração, testes, pendências | `docs/roadmap.md` |
| Títulos e resumo | `titulos.md` |
| Decisões aprovadas | `docs/decisoes.md` |
| Fontes, coleta e pipeline de dados | `docs/coleta-estatistica.md`, `docs/pipeline-dados.md`, `data/fontes.json` |

Testes do pipeline de dados: `python3 -m unittest discover -s tests -v`, da raiz. Testes do motor: `node --test tests/motor/*.test.js`, da raiz.

Para economizar contexto: leia só o documento da área da tarefa. Fonte única por regra: calendário e ritmos no `GDD.md`; regras legais em `docs/regras-e-mundo.md`; fórmulas em `docs/motor-eleitoral.md`. Outros documentos citam e não redefinem. O GDD é o índice.

## Arquitetura técnica (etapa 2)

- Entrega: `public/index.html` único, Vanilla JS, sem build. Dados consolidados embutidos como JSON em `<script type="application/json">` ou carregados de `public/data/*.json` pelo mesmo domínio (decidir na etapa 2 pelo tamanho).
- Organização interna do HTML em seções com comentário de cabeçalho fixo, para busca rápida: `/* == RNG == */`, `/* == DADOS == */`, `/* == ESTADO == */`, `/* == MOTOR ELEITORAL == */`, `/* == CARTAS == */`, `/* == EVENTOS == */`, `/* == UI == */`, `/* == PIXEL == */`, `/* == SAVE == */`.
- Motor separado da UI: funções puras `(estado, dados, rngState) => { resultado, rngStateNext }` (D67), sem acesso ao DOM. Módulos e contratos em `docs/especificacao-motor.md`. Permite rodar o mesmo código em Node para calibração headless (`tools/sim.js`, fora de `public/`).
- RNG: PRNG com semente (ex.: sfc32 ou mulberry32 com hash da semente textual). Nunca `Math.random`. Fluxos separados por domínio (mundo, eleição, eventos, cartas) para que o ritmo não altere a sequência do mundo.
- Semente textual compartilhável com prefixo de versão (ex.: `v1-ABCD-1234`).
- Save (decisão D13):
  - Objeto com `saveVersion` inteiro, `gameVersion` e semente.
  - Persiste só o estado mutável da carreira: personagem, indicadores, bolsos, relações, grupo, base, compromissos (ativos e histórico), bases parlamentares em que atua, conjuntura atual, fila de eventos, histórico, posição dos fluxos de RNG.
  - Dados consolidados (partidos, municípios, regras) nunca vão no save; são referenciados por identificadores estáveis (código IBGE para município, sigla fixa interna para partido, id textual para evento, carta, título e compromisso). Ids nunca são reutilizados nem renomeados.
  - Migração: função `migrar[n]` de `saveVersion` n para n+1, aplicada em cadeia ao carregar. Save mais novo que o jogo é recusado com aviso.
  - localStorage com chave versionada. Sem IndexedDB. Export e import por código de texto (JSON compactado e base64). Aviso de que limpar o navegador apaga a partida.
- Acessibilidade: viewport 360 px, toque de 44 px, contraste 4.5:1, `prefers-reduced-motion`.

## Skills úteis por fase

| Fase | Skill | Uso |
|---|---|---|
| Todo texto | `anthropic-skills:escrita-natural` | revisar textos do jogo e docs, remove vícios e travessões |
| 1B | `data:validate-data`, `data:explore-data` | conferir municípios, FEFC, bancadas |
| 2 | `design:ux-copy` | textos de cartas, botões e avisos |
| 2 | `design:accessibility-review` | contraste, toque, leitores de tela |
| 2 | `design:design-system` | tokens de cor e componentes pixel |
| 2 | `engineering:testing-strategy` | testes de coerência e calibração |
| 2 e 3 | `code-review`, `simplify` | revisão e enxugamento do HTML único |
| 2 | `run` | abrir o jogo no Chromium e capturar tela de 360 px |

Não há skill específica de economia de tokens; a economia vem da estrutura acima (um doc por área, seções nomeadas no HTML, leitura parcial com offset).
