# Títulos, resumo e cartão de conquista

Títulos são conquistas de carreira em tom sério. Cada um tem condição verificável no histórico. Uma carreira exibe no cartão até 3 títulos, escolhidos por raridade.

## 1. Títulos semente

| Título | Condição |
|---|---|
| O Fenômeno | Trajetória excepcional: ascensão rápida entre escopos, resultados eleitorais acima do esperado para a posição de partida e conquista de espaço institucional (critérios a calibrar; não depende do potencial) |
| O Incombustível | Sobreviveu a 3 ou mais escândalos do Arquivo Vermelho |
| O Puxador | Elegeu 5 ou mais aliados de carona |
| O Reformador | Aprovou 3 reformas estruturais |
| O Vice | Sucedeu um titular |
| O Paraquedista | Venceu eleições em 3 estados |
| O Municipalista | Fase 2: condição depende de votação por município em disputas proporcionais, não calculada no MVP |
| O Cassado | Perdeu mandato por decisão da Justiça |
| O Vitalício | 40 anos de vida pública |
| O Improvável | Venceu eleição para governador, senador ou presidente acumulando ao menos duas condições políticas desfavoráveis observáveis na trajetória: partido marcado "modo difícil" na eleição vencida; origem com `redePoliticaPrevia` igual a "nenhuma" (`docs/carreira-e-poder.md` 1); derrota na eleição imediatamente anterior; notoriedade abaixo da média dos candidatos registrados na mesma disputa; rejeição acima dessa mesma média. As duas comparações usam o escopo da disputa e os valores no início da campanha (abertura de J4). Limiares a calibrar; não depende do potencial |

## 2. Títulos ampliados

### Trajetória
| Título | Condição |
|---|---|
| O Fundador | Primeiro mandato antes dos 25 anos |
| O Tardio | Primeiro mandato depois dos 55 anos |
| O Persistente | Eleito após 3 derrotas seguidas |
| O Fiel | Carreira inteira em um só partido, com 3 ou mais mandatos |
| O Andarilho | Passou por 5 ou mais partidos |
| O Escalador | Venceu em todos os níveis: municipal, estadual e federal |
| O Retorno | Voltou a um cargo eletivo após 8 ou mais anos fora |
| O Senador de Ofício | Dois mandatos completos no Senado |

### Executivo
| Título | Condição |
|---|---|
| O Gestor | Reeleito no Executivo com popularidade local alta |
| O Governador | Governou um estado por 8 anos |
| O Presidente | Exerceu a Presidência |
| O Interino | Assumiu como vice por substituição temporária 3 ou mais vezes |

### Legislativo e bastidor
| Título | Condição |
|---|---|
| O Relator | Relatou uma CPI que terminou em Momento |
| O Líder | Fase 2: liderança de bancada não é modelada no MVP |
| O Articulador | Fase 2: coligações para chapas de outros candidatos não são modeladas no MVP |
| O Presidente da Casa | Fase 2: mesa diretora não é modelada no MVP |
| O Dono da Legenda | Presidiu o próprio partido nacionalmente |

### Partido e eleição
| Título | Condição |
|---|---|
| O Salvador | Levou o partido a superar a cláusula de desempenho |
| O Azarão | Venceu majoritária por partido marcado "modo difícil" |
| O Recordista | Maior votação proporcional da UF no ano |
| O Virada | Venceu 2º turno saindo em segundo no 1º |

### Derrotas e quedas (entram no resumo por padrão)
| Título | Condição |
|---|---|
| O Quase | Perdeu a Presidência no 2º turno |
| O Inelegível | Teve inelegibilidade reconhecida |
| O Renunciante | Renunciou para disputar e perdeu |
| O Ciclo Encerrado | Saiu por decisão própria após o platô |

## 3. Resumo de carreira

Formato de cargos (derrotas incluídas):
```
2027 - 2028 - Vereador - Passa e Fica / RN
2031 - 2034 - Deputado Federal - Rio Grande do Norte
2034 - Derrota - Senador - Rio Grande do Norte
2039 - 2042 - Presidente - Brasil
```

Formato de partidos:
```
2026 - 2030 - PSB
2030 - 2042 - PSD
```

## 4. Grau

Faixas qualitativas (nomes provisórios, fórmula oculta, calibrar): Discreta, Regional, Relevante, Destacada, Histórica.

O grau combina cinco dimensões: alcance institucional, influência política, realizações, reputação e legado (ver `docs/carreira-e-poder.md` seção 12). O cartão mostra a dimensão mais forte em texto (ex.: "Carreira marcada pela influência política").

## 5. Cartão de conquista

Nome, período, cargo mais alto, grau, dimensão mais forte, até 3 títulos, quadro de desenvolvimento (potencial inicial, aptidões atuais, evolução) e semente da carreira. Renderizado em canvas pixel, exportável como imagem e como texto.
