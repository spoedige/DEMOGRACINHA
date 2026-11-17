# Regras e mundo

## 1. Cargos

Vereador, prefeito, vice-prefeito, deputado estadual (distrital no DF), deputado federal, governador, vice-governador, senador, presidente, vice-presidente. Vices são cargos reais.

### Idade mínima
| Cargo | Idade | Referência da data |
|---|---|---|
| Vereador | 18 | em 15/08 (data do registro) |
| Deputado, prefeito, vice-prefeito | 21 | na posse |
| Governador e vice | 30 | na posse |
| Senador, presidente e vice | 35 | na posse |

### Senado
- 81 cadeiras, mandato de 8 anos.
- 2026: 2 vagas por UF (54), 2 votos por eleitor, majoritária, sem quociente.
- 2030: 1 vaga por UF (27).
- Eleitos em 2026 exercem de 01/02/2027 a 31/01/2035.
- Cada senador tem 2 suplentes (Fase 2).

### Executivos e desincompatibilização
- Uma reeleição consecutiva para o mesmo cargo executivo.
- Para disputar outro cargo, chefe do Executivo renuncia 6 meses antes (04/04/2026).
- Legisladores concorrem sem renunciar.

### 2º turno
- Governador e presidente: sem maioria absoluta dos válidos.
- Prefeito: só em municípios com mais de 200 mil eleitores.
- Senador: nunca.

### Janela partidária e filiação
- 05/03 a 03/04/2026, só para detentores de cargos proporcionais.
- Majoritários podem trocar sem perder o mandato (ADI 5081, a confirmar).
- Filiação e domicílio eleitoral até 04/04.
- Domicílio com mandato em curso (a confirmar).

### Barreira individual (só proporcional)
- 10% do quociente eleitoral para ser eleito.
- 20% para disputar sobras; o partido precisa de 80% do quociente.
- Fonte: Código Eleitoral, arts. 108 e 109 (a confirmar o texto vigente).
- Em majoritária basta vencer.

### Cláusula de desempenho
| Eleição | Votos | Ou |
|---|---|---|
| 2026 | 2,5% dos válidos, com 1,5% em 9 UFs | 13 deputados em 9 UFs |
| 2030 | 3% com 2% em 9 UFs (a confirmar, EC 97/2017) | 15 deputados em 9 UFs (a confirmar) |

Arredondamento do TSE: acima de 1,45% conta como 1,5%. O resultado de 2026 vale a partir de 2027.

## 2. Partidos

Os 30 registrados no TSE são jogáveis: MDB, PT, PSDB, PP, PDT, PL, PSB, PSD, Republicanos, União Brasil, Podemos, PSOL, Novo, Solidariedade, Avante, PCdoB, PV, Cidadania, Rede, PRD, Agir, DC, Democrata (ex-PMB), Mobiliza (ex-PMN), PCB, PCO, PSTU, UP, PRTB, Missão.

Lista a validar contra o registro do TSE na etapa 1B.

### Atributos dinâmicos
Marca, capilaridade, quadros, caixa, coesão, liderança (agente fictício). Sem piso nem teto artificial. Grande pode encolher (exemplos históricos: PSDB, Cidadania). Pequeno cresce por caminhos raros: rede social, coligação, incorporação. Evento extremo como o PCO eleger presidente é possível e raríssimo.

### Partido como ambiente
- Grande: dinheiro, máquina, fila interna longa, papel coadjuvante para recém-chegado.
- Pequeno: espaço para protagonismo, risco de cláusula, pouca ou nenhuma TV.
- Vantagem assimétrica do pequeno: bônus em mídia digital e discurso antissistema quando polarização ou tensão institucional estão altas.
- Marca "modo difícil": partido sem TV ou com risco de cláusula. Em 2026, Novo e Missão estão sem TV.

## 3. Federações

| Federação | Partidos |
|---|---|
| FE Brasil | PT, PCdoB, PV |
| PSDB Cidadania | PSDB, Cidadania |
| PSOL Rede | PSOL, Rede |
| Renovação Solidária | PRD, Solidariedade |
| União Progressista | União Brasil, PP (criada no jogo no 1º trimestre, registro em 26/03/2026) |

Federação atua como unidade única em todas as eleições e no Legislativo, com duração mínima legal (a confirmar prazo). Distribuição de fundo para federados (a confirmar).

## 4. Municípios

- 5.570 municípios reais em um único `municipios.json` compacto (meta de cerca de 380 KB), com número oficial de vagas de vereador.
- Agentes individuais só no município do jogador, nas capitais e nas cidades com mais de 200 mil eleitores. O resto é estatístico por UF.
- Resultados municipais de 2024 entram como estado inicial fixo.

## 5. Alianças

### Três estruturas
- **Partido:** unidade básica.
- **Federação:** unidade única, vale para proporcional e majoritária.
- **Coligação:** só majoritária, por eleição.

Aliança eleitoral, coalizão de governo e base parlamentar são três objetos separados no motor. Um aliado de campanha pode ser oposição no governo.

### Negociação
Nunca automática. Coligação é um leilão: o jogador recebe no máximo 4 ofertas, cada uma com contrapartida (vice, secretarias, apoio em outra disputa, tempo de TV).

### Coerência ideológica municipal
```
pesoIdeologico = clamp((eleitorado - 20000) / 180000, 0.1, 1.0)   (calibrar)
```
Cidade pequena: clã e interesse local, partidos opostos juntos. Cidade grande: alinhamento ao quadro nacional.

### Janela partidária simulada
Agentes decidem trocar de partido com efeito demonstração (manada): a chance cresce com as trocas já feitas no mesmo grupo. Meta de calibração só com dados oficiais da Câmara no corte. Fontes divergem (120 a 138 trocas); nenhum número entra sem fonte oficial.

### Meta de calibração da Câmara 2026
PL 121, PT 70, União 46, PSD 43, PP 41, Republicanos 41 (fonte e data de corte a registrar na 1B; a confirmar).
