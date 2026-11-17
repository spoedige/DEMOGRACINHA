# Roadmap, dados, calibração e testes

## 1. Etapas

| Etapa | Entrega | Critério de saída |
|---|---|---|
| 1A | GDD, docs, títulos, CLAUDE.md | Revisão do autor |
| 1B | Arquivos de dados com fonte e confiança | Revisão do autor |
| 2 | MVP em `public/index.html` | Testes de coerência passando, jogável no celular |
| 3 | Fase 2 | Por item |

Cada etapa termina com commit na `main`, que dispara deploy no Cloudflare.

## 2. MVP

Cargos de vereador a presidente; motor proporcional, majoritário e 2º turno; 30 partidos com dados básicos e 5 federações; 5.570 municípios (estatístico por UF, agentes só nos selecionados); potencial, aptidão, experiência, oportunidades contextuais, platô e 3 a 5 cadeias de Ponto de Inflexão; vice; janela partidária simulada; corrupção em 3 níveis; saúde; fase sem cargo básica; resumo, títulos, grau e cartão de conquista; exportar e importar save; visual pixel de Brasília; ritmos Intenso, Normal e Express.

Incluídos após a análise de referência (versões simplificadas, ver `decisoes.md`): potencial fora da urna (P11), conjuntura autônoma (P9), compromissos (P6), base territorial agregada (P3), grupo político agregado (P1), base parlamentar e governabilidade (P4), credibilidade visível, capital político derivado, avaliação final em cinco dimensões.

Também: cargos de nomeação (P7), conjuntura com alcance nacional, estadual e local simplificado.

Sem classificação: P5, P8, P10, P12, P13 (P5 e P8 já estão parcialmente cobertas por credibilidade e pela dimensão influência do grau).

## 3. Fase 2

Suplentes de senador; sucessão e apadrinhamento; desenvolvimento detalhado das 6 dimensões e reputação por atividade; ambição dinâmica e oportunidades que cruzam mandatos; poder entre eleições completo; legado dinâmico; conformidade eleitoral ampliada (prestação de contas, limites de gasto); facções partidárias (P2); membros individuais, disputa interna e sucessão do grupo político; parlamentares individuais. Ranking global fora do MVP.

## 4. Dados da etapa 1B

| Arquivo | Conteúdo |
|---|---|
| `rules-and-offices.json` | cargos, idades, mandatos, calendário, cláusula, barreiras |
| `politics-2026.json` | partidos, federações, bancadas, FEFC, TV |
| `world-2026.json` | estado inicial por UF, governos, prefeituras 2024 |
| `municipios.json` | 5.570 municípios, UF, eleitorado, vagas de vereador |
| `calibration-targets.json` | metas de calibração; nunca alimenta o mundo inicial |

Cada registro leva `fonte` e `confianca` (`oficial`, `secundaria`, `estimado`). Divergências entre fontes ficam registradas.

Rede: antes de coletar, testar IBGE e TSE com `curl -sI`. Em 403, parar, registrar o que faltou e usar arquivos enviados pelo autor. Nunca fabricar dados.

## 5. Calibração e estresse

- Simulações headless (Node rodando o mesmo motor do HTML).
- Eventos raros exigem dezenas de milhares de rodadas ou amostragem dirigida.
- Verificar a frequência de resultados entre 1,45% e 1,5% na cláusula.
- Calibrar 2026 (janela, Câmara, Senado) e a municipal de 2028. Backtest do motor municipal com 2024.
- Calibrar também: evolução da conjuntura, coesão e custo das bases parlamentares, decaimento da base territorial e do grupo, pesos das cinco dimensões do grau, limites de compromissos.
- Calibrar: distribuição de potencial, taxa de platô, frequência de Pontos de Inflexão, chance de Presidência por faixa de potencial, penalidade do vice sucessor, decaimento dos modificadores, custo de subir cedo demais.

## 6. Testes de coerência (mínimo)

1. Idade mínima por cargo.
2. Reeleição única para executivos.
3. Renúncia antes de 04/04 para disputar outro cargo.
4. 2º turno correto por cargo e porte.
5. Senado com 2 vagas em 2026 e 1 em 2030.
6. Vice assumindo.
7. Federação como unidade.
8. Janela só para proporcionais.
9. TV pelo resultado de 2022.
10. Cláusula e arredondamento de 1,45%.
11. Barreira de 10% e 20% só em proporcional.
12. Migração de estado.
13. Condenado não concorre.
14. Saúde sem game over automático.
15. Talento nunca bloqueia carta.
16. Presidência sem gate.
17. Momento decai.
18. Modificadores de carta decaem.
19. Intenso, Normal e Express produzem a mesma distribuição com a mesma semente de mundo (teste estatístico).
20. Janela pulada resolve com a opção segura.
21. Nenhuma carta sem tensão, fora a segura.
22. No máximo 6 números na tela de decisão.
23. Export e import restauram a mesma carreira.
24. Resumo inclui derrotas.
25. Nenhum travessão em textos do jogo (varredura automática).
26. Potencial fora da urna: personagens com potenciais diferentes, nas mesmas condições e com as mesmas ações, obtêm a mesma votação, a mesma elegibilidade, as mesmas ofertas de candidatura e aliança, o mesmo recurso de campanha e a mesma transferência.
27. Governabilidade difere com mesma fração de cadeiras e coesão diferente.
28. Conjuntura evolui igual com e sem ações do jogador fora do escopo dele.
29. Compromisso rompido reduz credibilidade; cumprido aumenta.
30. Grupo político mantém influência após saída do cargo e decai sem entregas.
31. Grau final permite que carreiras sem Presidência superem uma carreira com Presidência.
32. Dupla contagem, por caminho do mapa (`motor-eleitoral.md` 1.2): desligar um caminho específico, mantendo os demais fatores e a semente constantes; verificar que (a) desaparece somente a contribuição daquele caminho e (b) a causa não produz efeito residual por nenhum outro caminho além dos documentados. Não se espera proporção fixa de queda.
33. Evento de conjuntura não dispara com certeza ao cruzar limiar e respeita o bloqueio de repetição.
34. Repasse institucional nunca movimenta Fundo de Campanha, fundo partidário ou Caixa Pessoal.
35. Express prioriza compromissos de forma determinística e registra os rompidos.
36. Save de versão anterior migra e reproduz a mesma carreira; ids estáveis entre versões.
37. Nomeação só é oferecida com relação e composição de governo compatíveis.
38. Votos nunca negativos nem acima dos válidos, para qualquer combinação de estados nos limites de escala.
39. Transferência de prefeito entre 0 e a força do prefeito; mesmo sorteio com a mesma semente, em qualquer ritmo.
40. Força do prefeito não altera identificação partidária nem base territorial do candidato.
41. `popularidade + rejeicao` nunca excede `notoriedade`.
42. Dinheiro isolado satura: com opinião e máquina nulas, gasto máximo não elege.
43. TV e redes não aparecem na fórmula de voto; desligar o fluxo zera seu efeito.
44. 2º turno nunca transfere integralmente os votos dos derrotados.
45. Fechamento do ciclo: oportunidades e Capital de Entrega são distribuídos só após matrizes, fundos, TV e cláusula atualizados.
46. Simulação agregada da UF desconta municípios individualizados; soma de votos igual aos válidos.
47. Candidato não recebe automaticamente parcela do FEFC proporcional ao desempenho do partido.

## 7. Itens a confirmar

### 7.1 Regras legais para validação na etapa 1B
| # | Regra | Onde é usada |
|---|---|---|
| L1 | Mínimo individual de 10% do QE e requisitos de 80% e 20% nas sobras (Código Eleitoral, arts. 108 e 109) | `motor-eleitoral.md` 5.2 |
| L2 | Regra final de distribuição das sobras | 5.2 |
| L3 | Tratamento eleitoral das federações (lista única, duração mínima, efeitos em fundo e TV) | 5.1, 7.2, 7.3; `regras-e-mundo.md` 3 |
| L4 | Total do FEFC 2026 e valores por partido (hoje fonte secundária) | 7.2 |
| L5 | Distribuição do FEFC entre partidos federados | 7.2 |
| L6 | Distribuição do Fundo Partidário entre partidos e vínculo com a cláusula | 7.2 |
| L7 | Cotas legais na distribuição interna do FEFC aos candidatos | 7.1 |
| L8 | Tempo de TV: regra 90% e 10%, base 2022, partidos sem TV em 2026 | 7.3 |
| L9 | Tempo de TV em eleições municipais | 7.3 |
| L10 | Cláusula de desempenho 2026 e 2030 (EC 97/2017), arredondamento de 1,45%, data de efeito | `regras-e-mundo.md` 1; 8 |
| L11 | Quóruns de aprovação por tipo de proposta e por casa | 10 |
| L12 | Prazos de desincompatibilização para cargos de nomeação | `carreira-e-poder.md` 10.4 |
| L13 | Desincompatibilização em posições partidárias | 10.4 |
| L14 | ADI 5081 e troca de partido por majoritários | `regras-e-mundo.md` 1 |
| L15 | Domicílio eleitoral com mandato em curso | idem |
| L16 | Regras do vice que assume (substituição e sucessão) | `carreira-e-poder.md` 9 |
| L17 | Propaganda antecipada e restrições de 30/06 e 04/07 | `GDD.md` 3 |
| L18 | Calendário eleitoral 2026 completo | `GDD.md` 3 |
| L19 | Senado: dois votos por eleitor em 2026 e um em 2030 | 6.1 |
| L20 | Segundo turno de prefeito acima de 200 mil eleitores | `regras-e-mundo.md` 1 |

### 7.2 Outros itens a confirmar
- Fator de migração de estado.
- Metas da Câmara 2026 (fonte e data de corte).
- Todos os parâmetros de calibração e as funções listadas em `motor-eleitoral.md` 11.
