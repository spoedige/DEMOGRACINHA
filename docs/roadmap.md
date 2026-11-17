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

Também: credibilidade sem duplicação (P5), influência como dimensão própria (P8), estados temporários (P10), valor do cargo por contexto (P12). Todas as propostas P1 a P13 estão classificadas.

## 3. Fase 2

Suplentes de senador; sucessão e apadrinhamento; desenvolvimento detalhado das 6 dimensões e reputação por atividade; ambição dinâmica e oportunidades que cruzam mandatos; poder entre eleições completo; legado dinâmico; conformidade eleitoral ampliada (prestação de contas, limites de gasto); facções partidárias (P2); posições partidárias secundárias (secretário-geral, tesoureiro, coordenador de campanha, D37); modelo de comparecimento sensível à conjuntura; coalizão de governo completa (P13); hipótese H1 de palanque presidencial, se aprovada; membros individuais, disputa interna e sucessão do grupo político; parlamentares individuais. Ranking global fora do MVP.

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
3. Renúncia antes do prazo de desincompatibilização (`GDD.md` 3) para disputar outro cargo.
4. 2º turno correto por cargo e porte.
5. Senado com 2 vagas em 2026 e 1 em 2030.
6. Vice assumindo.
7. Federação como unidade.
8. Janela só para proporcionais.
9. TV pelo resultado de 2022.
10. Cláusula e arredondamento de 1,45%.
11. Barreira de 10% e 20% só em proporcional.
12. Migração de estado.
13. Condenado só fica impedido de concorrer quando há inelegibilidade reconhecida por hipótese legal; condenação sem enquadramento não impede.
14. Saúde sem game over automático.
15. Talento nunca bloqueia carta.
16. Presidência sem gate.
17. Momento decai.
18. Modificadores de carta decaem.
19. Ritmos: (a) determinístico: com a mesma semente, o fluxo de RNG de mundo e a conjuntura são idênticos em Intenso, Normal e Express; (b) estatístico: a distribuição dos resultados de carreira é equivalente entre ritmos.
20. Janela pulada resolve com a opção segura.
21. Nenhuma carta sem tensão, fora a segura.
22. No máximo 6 números na tela de decisão.
23. Export e import restauram a mesma carreira.
24. Resumo inclui derrotas.
25. Nenhum travessão em textos do jogo (varredura automática).
26. Potencial sem efeito eleitoral direto (D34): com aptidões e capacidades efetivas congeladas, mesmos demais fatores e mesma semente, personagens com potenciais diferentes obtêm a mesma votação, elegibilidade, ofertas de candidatura e aliança, recurso de campanha e transferência.
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
48. Soma exata: em toda disputa, votos distribuídos (legenda, nominais, genérico, dispersão) somam exatamente os válidos após arredondamento.
49. Proporcionalidade: com τ = 1 e sem ruído, concorrentes de pontuação igual recebem votos iguais e a razão de votos é a razão das pontuações.
50. Lista sem candidatos individualizados recebe votos e tem eleitos entre seus candidatos sintéticos.
51. Identificação partidária só define o tamanho dos segmentos fiéis; nenhuma pontuação de candidato ou legenda a contém.
52. `semOpiniao` nunca é somado a popularidade nem a rejeição; a partição soma 1.
53. Nenhum real é alocado a exposição e mobilização ao mesmo tempo; soma das alocações e reserva igual ao fundo disponível.
54. Cada aliado contribui no máximo uma vez por canal; partido não gera transferência; pessoa não gera identificação; apoio sem coligação não gera identificação.
55. Credibilidade não altera votação com os demais estados fixos.
56. Influência não muda ao ganhar ou perder cargo com grupo, partido, compromissos e base fixos.
57. Posição partidária nunca gera Capital de Entrega.
58. Estados temporários têm origem, duração e fim; nenhum gera game over.
59. Atributos da ficha de oportunidade não alteram efeitos do cargo.
60. Desenvolvimento: sob as mesmas oportunidades de aprendizado e a mesma semente, potenciais diferentes podem gerar trajetórias de aptidões diferentes.
61. Concentração: sem ruído, a distribuição de participações tem o mesmo índice de concentração (HHI) que a distribuição normalizada das pontuações; com ruído, a média do HHI sobre sementes não cresce com σ além do esperado pela variância.
62. Ruído com média 1: para qualquer σ, a média do multiplicador sobre muitas sementes é 1 dentro da tolerância; aumentar `alcanceRedes` não aumenta a votação esperada.
63. Puxador: elevar a opinião de um candidato aumenta `votosLista` da sua lista apenas pela soma dos seus votos nominais adicionais.
64. Número de candidatos: adicionar um candidato sintético de pontuação mínima a uma lista não altera o segmento fiel `I_L`.
65. Candidatos sintéticos existem antes da apuração; barreira de 10% e sobras são verificadas para eles; recriação pela semente dá os mesmos candidatos.
66. Soma exata no proporcional: legenda mais nominais de todas as listas igual a `validos`.
67. Senado: cada eleitor representado dá dois votos a candidatos distintos; soma dos segundos votos igual aos primeiros votos válidos; diagonal da matriz nula.
68. `identChapa` de candidatura isolada é igual à do próprio partido ou federação.
69. 2º turno: eleitorado constante; contingentes de origem distribuídos sem sobra entre A, B, branco/nulo e abstenção; nenhuma origem transfere integralmente.
70. Cada um dos 5.570 municípios produz prefeito e câmara próprios em 2028 e 2032; agregados da UF são somas.
71. Nenhuma origem inicia com mandato, nomeação ou Capital de Entrega.
72. Rede Familiar Política não gera tag de nepotismo nem risco jurídico pela origem.
73. Aposentadoria nunca ocorre sem decisão do jogador, em qualquer idade.
74. Posições partidárias da Fase 2 não aparecem no pool do MVP.
75. Uma mesma regra nunca usa capital político e seus componentes ao mesmo tempo.
76. Influência e legado não somam o mesmo período: legado só mede o ciclo posterior à saída.
77. Segmentos: em toda unidade, `Σ_L I_L ≤ validos` e `F ≥ 0`, inclusive após atualizações extremas de conjuntura.
78. Normalização: identificação bruta com soma acima de 1 é reescalada antes da eleição; a soma resultante é no máximo 1 e as proporções entre listas são preservadas.
79. Sem sobreposição: partido federado não tem identificação própria fora da federação na mesma unidade; identificação da federação é a soma das dos membros.
80. Base única: `identPartidaria` e segmentos usam a mesma base (válidos); nenhuma etapa aplica fração do eleitorado sobre válidos.
81. Dupla contagem no proporcional: zerar `identPartidaria` de uma lista elimina só o segmento fiel e a legenda dela, sem mudar pontuações; zerar a opinião de um candidato muda só os votos dele nos dois segmentos e, por soma, o total da lista; legenda não muda com opinião ou máquina.
82. Parâmetros de comparecimento, abstenção, brancos e nulos permanecem iguais com e sem mudanças de conjuntura no MVP.
83. O Improvável não depende do potencial e exige ao menos duas condições desfavoráveis registradas no histórico.

## 7. Itens a confirmar

### 7.1 Regras legais para validação na etapa 1B

Nenhuma está resolvida. Uma pendência só sai desta lista com fonte oficial citada e evidência documental registrada em `data/` na 1B. Os diplomas citados indicam onde procurar, não confirmam o conteúdo.

| # | Objeto da verificação | Tipo de fonte oficial necessária | Onde é usada |
|---|---|---|---|
| L1 | Votação nominal mínima de 10% do QE e requisitos de 80% e 20% nas sobras | Código Eleitoral (texto vigente, arts. 108 e 109); resolução do TSE para 2026 | `motor-eleitoral.md` 5.4 |
| L2 | Regra final de distribuição das sobras | Código Eleitoral; resolução do TSE; decisões do STF sobre sobras | 5.4 |
| L3 | Tratamento eleitoral das federações: lista única, duração mínima, efeitos em fundo, TV e cláusula | Lei dos Partidos Políticos; resolução do TSE sobre federações; registro das federações no TSE | 5.2, 7.2, 7.3; `regras-e-mundo.md` 3 |
| L4 | Total do FEFC 2026 e valores por partido | Lei orçamentária anual; publicação do TSE da distribuição | 7.2 |
| L5 | Distribuição do FEFC entre partidos federados | Resolução do TSE; publicação da distribuição | 7.2 |
| L6 | Distribuição do Fundo Partidário e vínculo com a cláusula | Lei dos Partidos Políticos; Constituição (EC 97/2017); publicação do TSE | 7.2 |
| L7 | Cotas legais na distribuição interna do FEFC aos candidatos | Lei das Eleições; resolução do TSE; decisões do TSE e STF sobre cotas | 7.1 |
| L8 | Tempo de TV: 90% e 10%, base de deputados eleitos em 2022, partidos sem TV em 2026 | Lei das Eleições; resolução do TSE; plano de mídia do TSE para 2026 | 7.3 |
| L9 | Tempo de TV em eleições municipais | Lei das Eleições; resolução do TSE do ciclo municipal | 7.3 |
| L10 | Cláusula de desempenho 2026 e 2030, arredondamento de 1,45%, data de efeito | Constituição (EC 97/2017); resolução ou decisão do TSE sobre arredondamento | `regras-e-mundo.md` 1; `motor-eleitoral.md` 8 |
| L11 | Quóruns de aprovação por tipo de proposta e por casa | Constituição; constituições estaduais; leis orgânicas; regimentos internos | `motor-eleitoral.md` 10 |
| L12 | Prazos de desincompatibilização para cargos de nomeação | Lei Complementar de inelegibilidades; resoluções e consultas do TSE | `carreira-e-poder.md` 10.4 |
| L13 | Desincompatibilização em posições partidárias | Lei Complementar de inelegibilidades; jurisprudência do TSE | 10.4 |
| L14 | Troca de partido por majoritários sem perda de mandato | Acórdão da ADI 5081 (STF); resolução do TSE sobre fidelidade | `regras-e-mundo.md` 1 |
| L15 | Domicílio eleitoral com mandato em curso | Lei das Eleições; jurisprudência do TSE | idem |
| L16 | Regras de vice por cargo: substituição, sucessão, dupla vacância, legitimidade | Constituição (presidente); constituições estaduais (governador); leis orgânicas (prefeito) | `carreira-e-poder.md` 9; `eventos-e-risco.md` 6.1 |
| L17 | Propaganda antecipada e restrições de 30/06 e 04/07 | Lei das Eleições (condutas vedadas e propaganda); resolução de propaganda do TSE | `GDD.md` 3 |
| L18 | Calendário eleitoral 2026 completo | Resolução do calendário eleitoral do TSE; Constituição (datas de posse) | `GDD.md` 3 |
| L19 | Senado: dois votos em 2026 e um em 2030; voto em branco ou nulo em cada voto | Constituição; Código Eleitoral; resolução de votação do TSE | `motor-eleitoral.md` 6.2 |
| L20 | Segundo turno de prefeito acima de 200 mil eleitores | Constituição | `regras-e-mundo.md` 1 |
| L21 | Limite legal de candidatos por lista em cada cargo proporcional | Lei das Eleições; resolução de registro do TSE | `motor-eleitoral.md` 5.3 |
| L22 | Hipóteses legais de inelegibilidade: tipos de condenação, órgão colegiado ou trânsito em julgado, prazos | Lei Complementar de inelegibilidades e alterações (Ficha Limpa); jurisprudência do TSE e STF | `eventos-e-risco.md` 6 |
| L23 | Regras de suplência por cargo: ordem, convocação, licenças que a geram, posse | Constituição; Código Eleitoral; regimentos da Câmara, do Senado, das assembleias e câmaras | `eventos-e-risco.md` 6.1; `carreira-e-poder.md` 9 |
| L24 | Enquadramento jurídico de emendas usadas em negociação de apoio eleitoral | Lei das Eleições (condutas vedadas, abuso de poder); Código Penal; Lei de Improbidade; jurisprudência do TSE | `eventos-e-risco.md` 5 |
| L25 | Licença de legislador para assumir cargo de nomeação e manutenção do mandato | Constituição (federal e estaduais); leis orgânicas; regimentos | `eventos-e-risco.md` 6.1 |
| L26 | Afastamento cautelar de mandatário: hipóteses e prazos | Código de Processo Penal; jurisprudência do STF | `eventos-e-risco.md` 6.1 |
| L27 | Prazos de licença de saúde e convocação de suplente ou vice | Regimentos internos; constituições estaduais; leis orgânicas | `eventos-e-risco.md` 6.1 |
| L28 | Doações de pessoa física e autofinanciamento: limites | Lei das Eleições; resolução de arrecadação do TSE | `carreira-e-poder.md` 1 (Empresário) |
| L29 | Destino de recurso de campanha não gasto | Lei das Eleições; resolução de prestação de contas do TSE | `motor-eleitoral.md` 4.4 |
| L30 | Idades mínimas e data de referência por cargo | Constituição; Lei das Eleições | `regras-e-mundo.md` 1 |
| L31 | Reeleição única para chefes do Executivo | Constituição | `regras-e-mundo.md` 1 |
| L32 | Regra de candidatura laranja e cassação da chapa | Lei das Eleições (cota de gênero); jurisprudência do TSE | `eventos-e-risco.md` 5 |

### 7.2 Outros itens a confirmar
- Fator de migração de estado.
- Metas da Câmara 2026 (fonte e data de corte).
- Todos os parâmetros de calibração e as funções listadas em `motor-eleitoral.md` 11.
