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

Sem classificação: P5, P7, P8, P10, P12, P13.

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
26. Potencial não altera nenhum resultado de urna nem oportunidade eleitoral (mesma carreira com potenciais diferentes e mesmas ações produz a mesma votação).
27. Governabilidade difere com mesma fração de cadeiras e coesão diferente.
28. Conjuntura evolui igual com e sem ações do jogador fora do escopo dele.
29. Compromisso rompido reduz credibilidade; cumprido aumenta.
30. Grupo político mantém influência após saída do cargo e decai sem entregas.
31. Grau final permite que carreiras sem Presidência superem uma carreira com Presidência.

## 7. Itens a confirmar

- Distribuição do FEFC para federados.
- TV em eleições municipais.
- Cláusula de 2030 (EC 97/2017).
- Regras do vice que assume.
- Domicílio eleitoral com mandato em curso.
- Texto exato do mínimo individual (arts. 108 e 109 do Código Eleitoral).
- Propaganda antecipada.
- ADI 5081 e troca de partido por majoritários.
- Fator de migração de estado.
- Valor total e por partido do FEFC 2026 (fonte secundária).
- Metas da Câmara 2026 (fonte e data de corte).
- Datas do calendário eleitoral 2026.
- Todos os parâmetros de calibração.
