# DEMOGRACINHA: Game Design Document

Versão do documento: 1A.0 (17/11/2026). Status: em revisão.

Simulador de carreira política brasileira, só modo carreira, tom sério. Partidos, federações e municípios reais; pessoas e eventos fictícios. Mecânicas inspiradas no Simulador de Carreira do Copero são adaptações de design próprio. Nenhum código, texto ou imagem do Copero é usado.

Convenções deste documento:
- **(a confirmar)**: informação legal ou numérica não verificada em fonte oficial.
- **(calibrar)**: parâmetro de balanceamento. É hipótese, não verdade.
- Detalhes ficam em `docs/`. Este arquivo é o mapa.

## 1. Visão

O jogador vive uma carreira política de 01/01/2026 até a aposentadoria, morte ou saída. A pergunta central de cada janela é "o que eu sacrifico agora para chegar onde quero depois". Não há trilha obrigatória e a Presidência nunca é desbloqueada: ela emerge de condições.

Pilares:
1. **Tensão em toda escolha.** Toda carta, exceto a segura, ganha em um eixo e paga em outro.
2. **Trajetória vence lance isolado.** Efeitos limitados e decrescentes.
3. **Talento oculto, nunca destino.** Potencial molda o teto provável, decisões podem superá-lo.
4. **Regras reais como terreno.** Calendário, idades, cláusula, quociente e fundo seguem a lei (com marcações de confirmação).
5. **Celular primeiro.** Uma coluna, poucos números, decisões em cartas.

## 2. Escopo por etapa

| Etapa | Conteúdo | Saída |
|---|---|---|
| 1A | GDD, docs, títulos, CLAUDE.md | Este repositório, sem código de jogo |
| 1B | Dados consolidados (partidos, federações, municípios, FEFC, TV, calibração) | `data/` e embutido no HTML |
| 2 | MVP jogável | `public/index.html` |
| 3 | Fase 2 | Incrementos sobre o MVP |

MVP e Fase 2 detalhados em `docs/roadmap.md`.

## 3. Loop de jogo

1. Criação: nome, nascimento (idade 18 a 60), UF e município, origem, partido, dificuldade, ritmo, ambição inicial, semente.
2. Ano: sequência de janelas (6 no ano eleitoral, 2 no calmo no ritmo Normal).
3. Janela: evento de contexto, 2 a 4 cartas (uma segura), resolução, eventos atrasados.
4. Eleição: motor proporcional ou majoritário, 2º turno quando cabe.
5. Mandato ou fase sem cargo, posse na primeira janela do ano seguinte.
6. Balanço a cada 4 anos. Fim de carreira: resumo, títulos, grau, cartão de conquista.

Calendário e ritmos: `docs/tempo-e-ritmo.md`.

## 4. Personagem

- **Origens:** Influenciador/Coach, Pastor/Líder Comunitário, Empresário do Agro/Construtora, Herdeiro de Clã (tag Nepotismo permanente), Sindicalista/Militante, Servidor, Assessor, Vereador em exercício, Secretário. Efeitos em `docs/personagem.md`.
- **Indicadores:** popularidade, notoriedade e rejeição em 3 escopos (local, estadual, nacional). Reputação é indicador.
- **Três bolsos:** Caixa Pessoal, Fundo de Campanha, Capital de Entrega. Converter Capital de Entrega em Caixa Pessoal é corrupção.
- **Três relações:** Cúpula, Bancada, Executivo.
- **Estado:** tags, Arquivo Vermelho, eventos atrasados, mandatosConsecutivos, saúde gradual, status jurídico (Regular, Investigado, Condenado, InelegibilidadeReconhecida) separado do risco jurídico.
- **Dificuldade:** Normal ou Difícil. A marca "modo difícil" do partido soma por fora.

## 5. Talento e progressão

Potencial oculto 0 a 100, seis aptidões (Articulação, Comunicação, Mobilização, Gestão, Estratégia, Resiliência), capacidade efetiva, experiência sem decaimento por idade, platô com peso de saída, Pontos de Inflexão em cadeia com Momento temporário, caminho à Presidência sem gate, ambição mutável, vice como exposição, legado com grau qualitativo. Ver `docs/progressao.md`.

## 6. Regras legais

Idades mínimas, Senado 2026 com 2 vagas por UF, reeleição, desincompatibilização, 2º turno, janela partidária, barreira individual de 10% e 20% do quociente, cláusula de desempenho 2026 e 2030. Ver `docs/regras-legais.md`.

## 7. Mundo

30 partidos jogáveis, 5 federações, 5.570 municípios reais (agentes individuais só nos selecionados), partidos dinâmicos sem piso nem teto. Ver `docs/mundo.md`.

## 8. Alianças

Partido, federação e coligação são estruturas distintas. Coligação como leilão de até 4 ofertas. Peso ideológico municipal por tamanho do eleitorado. Janela partidária por agentes com efeito manada. Ver `docs/aliancas.md`.

## 9. Eleição

Estoques Voto, Máquina e Dinheiro. Transferência de prefeito é probabilística. FEFC, TV e rede social como canais separados. Ver `docs/motor-eleitoral.md`.

## 10. Interface e visual

Viewport 360 px, toque de 44 px, navegação inferior, no máximo cerca de 6 números na tela de decisão, cartas com efeitos prováveis em 5 horizontes, telas de consulta sem decisão, pixel art de Brasília gerada em código. Ver `docs/ux-mobile.md` e `docs/visual.md`.

## 11. Técnica

HTML único, Vanilla JS, sem build, sem dependências, sem backend, sem analytics. RNG com semente. localStorage só com o delta. Save por código de texto. Ver `docs/arquitetura.md`.

## 12. Títulos e fim de carreira

Lista em `titulos.md`. Derrotas entram no resumo por padrão.

## 13. Pendências abertas

- O prompt original terminou em "Fechamento do ciclo: urna, matrizes, fundo". O restante da seção 9 (e seções seguintes, se houver) precisa ser reenviado.
- Itens "(a confirmar)" listados em `docs/fontes-e-pendencias.md`.
