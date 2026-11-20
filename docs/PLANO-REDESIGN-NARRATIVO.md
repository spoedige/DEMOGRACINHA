# Plano do redesign narrativo

Documento de controle e continuidade (D91). Atualizar ao fim de cada etapa. Decisões aprovadas ficam em `docs/decisoes.md`; aqui só o estado do trabalho.

## Estado

| Campo | Valor |
|---|---|
| Branch | `implementacao-motor` (sem commit nem push sem autorização) |
| Etapa atual | 1 concluída, aguardando revisão do autor |
| Próxima ação | Etapa 2: personagens recorrentes, save 7 e arcos |

## Diagnóstico consolidado (etapa 0)

| Área | Achado | Prioridade | Etapa |
|---|---|---|---|
| Cartas (53) | Textos no padrão "X tende a subir"; explicavam indicador em vez de situação | P0 | 1 (feito) |
| Ação segura (5) | "Sem ganho visível", sem efeito | P0 | 1 (feito) |
| Elegibilidade | "Divulgar o mandato em vídeos curtos" aparecia sem mandato | P0 | 1 (feito) |
| Eventos (31) | 11 com uma só opção; sem personagens nem memória | P1 | 2 |
| Personagens e arcos | Inexistentes; motor já tem `familia`, `atrasado`, `gatilho`, `exigeTag`, `eventosRecentes` | P1 | 2 |
| Origens | 5 no código, 10 no doc; Família Política ausente | P1 | 4 |
| Estilos (4) | Só bônus e 2 cartas cada | P2 | 4 |
| Talento Nato | Não implementado | P2 | 4 |
| Partidos (29) | Sem campo de espectro | P2 | 5 |
| Nascimento | Data completa, sem seletor de mês e ano | P2 | 7 |
| Calibragem (adendo) | Ver seção própria | P0 | 5 e 6 |

## Etapas

| Etapa | Escopo | Situação |
|---|---|---|
| 0 | Auditoria | Aprovada |
| 1 | Tom, reescrita de cartas e eventos, segura, textos provisórios | Concluída |
| 2 | 5 personagens, relações internas, save 7, 6 arcos | Pendente |
| 3 | 24 cartas adicionais (lista abaixo) | Pendente |
| 4 | Família Política, estilos, sinergias, Talento Nato | Pendente |
| 5 | Partidos: espectro, ordem alfabética, troca; calibragem de recursos | Pendente |
| 6 | Biografia, eleições, carimbo; calibragem de votos | Pendente |
| 7 | Interface e nascimento por mês e ano | Pendente |
| 8 | Testes completos | Pendente |

## Padrão de texto (etapa 1)

- Situação concreta em segunda pessoa, ação e risco, em duas ou três frases. Sem nome de indicador no texto.
- Ambiente institucional pelo cargo: Câmara Municipal, Assembleia Legislativa, Congresso, Esplanada.
- Rótulo de interface: "Cúpula" passou a "Direção do partido". Demais termos mantidos.

## Etapa 1: entregue

- 53 cartas reescritas (títulos ajustados onde o antigo era técnico ou incoerente); 24 textos de evento e 1 opção.
- Segura com defesa leve (calibrar): degraus 1 e 2 reduzem rejeição local em 0,003; degrau 3 sobe credibilidade, 4 bancada, 5 direção do partido, em 0,003.
- `pool.cargos: "comMandato"` no motor e em "Divulgar o mandato em vídeos curtos". "Transmissão ao vivo do gabinete" virou "Transmissão ao vivo respondendo moradores".
- Removidos da tela: "(a confirmar)" de inelegibilidade (foi para `_nota`), do prazo de 04/04 e do registro de partidos.
- Arquivos: `data/catalogo/degrau-1..5.json`, `eventos-comuns.json`, `catalogo-jogo.json`, `public/index.html` (Cartas, UI e JSON embutido), `tests/motor/cartas.test.js`, `docs/especificacao-motor.md`, `docs/decisoes.md`.
- Testes: motor 232 pass / 0 fail; UI 17 / 0.
- Lote de 300 carreiras (12 anos): eleito alguma vez 50,0% para 48,7%; deputado ou senador 17,0% para 16,7%. Queda maior em empresário (65,0% para 58,3%) e liderança sindical (52,0% para 46,7%). O jogador automático passa a escolher a segura em parte das janelas. Monitorar na etapa 5.

## Pendências registradas

- 11 eventos de opção única: decidir na etapa 2 quais ganham escolha (cobrança da associação e dos bairros primeiro). Jurídicos e sucessão continuam como notícia.
- Origens futuras: Influenciador, Pastor, Gestor Público, Professor.
- "Mutirão de atendimento" e "Pôr em dia os pedidos" pressupõem equipe; avaliar restrição no degrau 2.

## Adendo de calibragem (teste real 2026 a 2048)

1. Notoriedade alta com rejeição baixa presa em popularidade baixa (55,1% / 4% / 10,1%, 10 derrotas). Converter parte do ganho de notoriedade com baixa rejeição em popularidade e usar `notoriedade - rejeição` na fórmula de votos. Etapa 6.
2. 23.122 votos para deputado estadual em 2038 e 231 para vereador em 2040. Piso de força no reduto a partir do desempenho estadual. Etapa 6.
3. Primeira eleição travada (Caixa R$ 430, Fundo R$ 0). Repasse mínimo do partido em janela eleitoral para notoriedade local acima de 30% e calibrar a primeira disputa de vereador para que 4 a 8 anos de construção consistente elejam. Etapa 5.
4. Cartas que falam em mandato exigem cargo eletivo. Feito na etapa 1 para a única carta encontrada; revisar as 24 novas na etapa 3.

## 24 cartas adicionais (etapa 3)

Custos em saúde e caixa conforme o autor (calibrar). Restrições de cargo e estilo a conferir no motor.

| N | Degrau | Carta | Exige | Custo | Efeito e risco |
|---|---|---|---|---|---|
| 1 | 1 | Abaixo-assinado por melhoria no bairro | | Saúde 2% | Base e popularidade local; cobrança da associação |
| 2 | 1 | Transmissão ao vivo andando pelas ruas | estilo:influencer | Saúde 1% | Notoriedade local; rejeição leve |
| 3 | 1 | Artigo de opinião no jornal ou portal local | estilo:tecnico | Saúde 1% | Credibilidade e notoriedade local |
| 4 | 1 | Caminhada no comércio e pontos de ônibus | | Saúde 3% | Popularidade e base local |
| 5 | 1 | Ofício formal ao Ministério Público ou Defensoria | problema concreto | Saúde 1% | Credibilidade; relação com Executivo cai |
| 6 | 1 | Apoiar campeonato de várzea ou evento cultural | | Caixa R$ 800 | Popularidade e base local |
| 7 | 1 | Reunião reservada com lideranças de bairro | estilo:articulador | Saúde 1% | Base local e direção do partido |
| 8 | 1 | Debate acalorado em grupo de WhatsApp da cidade | estilo:combativo | Saúde 1% | Notoriedade local; rejeição leve |
| 9 | 2 | Fiscalização surpresa em obra ou hospital municipal | vereador | Saúde 2% | Notoriedade e popularidade local; Executivo cai |
| 10 | 2 | Audiência pública sobre transporte ou saúde | vereador ou secretário municipal | Saúde 2% | Credibilidade e base local |
| 11 | 2 | Mutirão de regularização fundiária ou zeladoria | prefeito ou secretário municipal | Saúde 2% | Popularidade local; rejeição cai |
| 12 | 2 | Negociar emenda com deputado aliado | acesso institucional | Saúde 2% | Capital de Entrega e bancada |
| 13 | 2 | Pressionar líderes na votação da LDO ou do orçamento | vereador, calendário | Saúde 1% | Base local |
| 14 | 2 | Gravar prestação de contas semanal em vídeo curto | estilo:influencer | Saúde 1% | Notoriedade e popularidade local; sem "mandato" sem cargo eletivo |
| 15 | 3 | Caravana regional pelo interior do estado | | Saúde 3% e Caixa R$ 2.500 | Notoriedade e base estadual |
| 16 | 3 | Audiência com prefeitos na Assembleia Legislativa | deputado estadual | Saúde 2% | Base estadual e articulação |
| 17 | 3 | Entrevista a rádio e TV regional no horário nobre | | Saúde 1% | Notoriedade estadual |
| 18 | 3 | Lançar mutirão estadual de cirurgias ou habitação | governador ou secretário estadual | Saúde 2% | Popularidade estadual; rejeição cai |
| 19 | 3 | Articular bloco suprapartidário na Assembleia | estilo:articulador | Saúde 2% | Bancada e credibilidade |
| 20 | 4 | Discurso de repercussão nacional na tribuna do Congresso | deputado federal ou senador | Saúde 1% | Notoriedade nacional; rejeição leve |
| 21 | 4 | Negociar liberação de recursos com a Casa Civil | | Saúde 2% | Capital de Entrega e base estadual |
| 22 | 4 | Sabatina técnica em comissão da Câmara ou do Senado | estilo:tecnico | Saúde 2% | Credibilidade e notoriedade nacional |
| 23 | 5 | Cúpula com governadores e prefeitos de capitais | presidente ou ministro | Saúde 2% | Popularidade nacional e direção do partido |
| 24 | 5 | Convocar coletiva de imprensa no Palácio | presidente ou ministro | Saúde 2% | Notoriedade nacional; rejeição cai |

Pontos a resolver na etapa 3: a regra de acoplamento admite no máximo 2 estoques e 1 relação por carta; a carta 15 tem dois custos, e o motor aceita uma moeda só; as cartas 11, 18 e 24 têm só ganho, o que exige um risco próprio; "base estadual" (15, 16, 21) não existe como estoque, só `base.local.forca`.
