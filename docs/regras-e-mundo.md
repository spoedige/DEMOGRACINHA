# Regras e mundo

**Situação das regras legais:** cada uma traz entre colchetes a pendência de `roadmap.md` 7.1, onde consta se está encerrada, simplificada para o MVP ou aberta; registro das evidências em `validacao-legal.md`. Regras sem pendência encerrada continuam hipóteses documentais. O calendário oficial está em `GDD.md` 3.

## 1. Cargos

Vereador, prefeito, vice-prefeito, deputado estadual (distrital no DF), deputado federal, governador, vice-governador, senador, presidente, vice-presidente. Vices são cargos reais.

### Idade mínima [L30]
| Cargo | Idade | Referência da data |
|---|---|---|
| Vereador | 18 | na data do registro de candidatura (`GDD.md` 3) |
| Deputado, prefeito, vice-prefeito | 21 | na posse |
| Governador e vice | 30 | na posse |
| Senador, presidente e vice | 35 | na posse |

### Senado [L19, L23]
- 81 cadeiras, mandato de 8 anos.
- 2026: 2 vagas por UF (54), 2 votos por eleitor, majoritária, sem quociente.
- 2030: 1 vaga por UF (27).
- Início e fim do mandato dos eleitos em 2026: `GDD.md` 3.
- Cada senador tem 2 suplentes. MVP: suplência mínima (`eventos-e-risco.md` 6.1); detalhamento na Fase 2.

### Executivos e desincompatibilização [L31, L12]
- Uma reeleição consecutiva para o mesmo cargo executivo.
- Para disputar outro cargo, chefe do Executivo renuncia 6 meses antes da eleição (data em `GDD.md` 3).
- Legisladores concorrem sem renunciar.
- Ocupante de cargo de nomeação governamental (secretário, ministro, presidente de órgão ou estatal) deixa o cargo até o mesmo prazo para disputar (D80). Prazo único de 04/04 no MVP; prazos específicos por cargo (a confirmar, 1B). Cargo partidário não exige saída (a confirmar).

### 2º turno [L20; Res. TSE 23.677, art. 6º, na redação da Res. 23.748/2026, conferido]
- Governador e presidente: sem maioria absoluta dos válidos.
- Prefeito: só em municípios com mais de 200 mil eleitores.
- Senador: nunca.

### Janela partidária e filiação [L14, L15, L35]
- Período: `GDD.md` 3. Vale só para detentores de cargos proporcionais.
- Majoritários podem trocar sem perder o mandato (ADI 5081, a confirmar).
- Filiação e domicílio eleitoral até o prazo de `GDD.md` 3.
- Domicílio com mandato em curso (a confirmar).

### Barreira individual (só proporcional) [L1 encerrada, L2]
- Regra completa (quociente, 10% no quociente partidário, sobras em duas fases, cenário sem quociente, empates): fonte única em `motor-eleitoral.md` 5.4. Este documento não a redefine.
- Em majoritária, vencedor pela maioria dos válidos (`motor-eleitoral.md` 6).

### Cláusula de desempenho [L10]
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
- Marca "modo difícil": partido sem TV ou com risco de cláusula. Hipótese para 2026: Novo e Missão sem TV [L8].

## 3. Federações

| Federação | Partidos |
|---|---|
| FE Brasil | PT, PCdoB, PV |
| PSDB Cidadania | PSDB, Cidadania |
| PSOL Rede | PSOL, Rede |
| Renovação Solidária | PRD, Solidariedade |
| União Progressista | União Brasil, PP (criada no jogo no 1º trimestre; data de registro no calendário de `GDD.md` 3) [L3] |

Federação atua como unidade única em todas as eleições e no Legislativo, com duração mínima legal [L3]. Distribuição de fundo para federados [L5].

## 4. Municípios

- Três conjuntos distintos (D58):
  - **Cadastro territorial:** 5.571 municípios do cadastro IBGE, identificados pelo código IBGE.
  - **Eleição municipal própria:** 5.569 municípios. Brasília (DF) e Fernando de Noronha (PE) não têm eleição municipal.
  - **Unidades estatísticas eleitorais:** variáveis por eleição; incluem Fernando de Noronha e o exterior nas eleições gerais. O exterior não é associado a nenhum município.
- `municipios.json` compacto (meta de cerca de 380 KB), com número oficial de vagas de vereador da eleição ordinária (D61).
- Cada um dos 5.569 municípios com eleição própria elege prefeito e câmara (`motor-eleitoral.md` 9).
- Corte temporal do mundo inicial (D60 e D63): o fenômeno representado precisa ser de até 31/12/2025; a versão usada precisa ter publicação histórica comprovada ou conteúdo validado. Data de coleta não conta. Dados de 2026 ficam restritos à calibração. Critério em `decisoes.md` (D63) e operação em `pipeline-dados.md`.
- **Conjunto de agentes (fixo durante a carreira, D52):** município inicial mais os nove maiores eleitorados da UF inicial, pelo último retrato oficial de eleitorado disponível até 31/12/2025 (D60; disponibilidade a verificar na 1B). Se o município inicial estiver entre os nove maiores, entra o próximo da lista. Desempate pelo código IBGE. Agentes individuais e conjuntura local existem só nesse conjunto.
- **Conjunto da base (dinâmico, até 10, D52):** inclui o município inicial e os municípios onde o personagem constrói base, em qualquer UF. Representa a base política do personagem, com ou sem agentes, e não altera o conjunto de agentes.
- Lacunas registradas: (1) regra quando o conjunto da base está cheio; (2) UFs com menos de 10 municípios (o DF tem um só): o conjunto de agentes fica menor, sem regra de complemento definida.
- Resultados municipais de 2024 entram como estado inicial fixo.
- Base territorial do personagem é agregada por município (ver `carreira-e-poder.md` seção 10.2).

## 5. Alianças

### Três estruturas
- **Partido:** unidade básica.
- **Federação:** unidade única, vale para proporcional e majoritária.
- **Coligação:** só majoritária, por eleição.

Aliança eleitoral, coalizão de governo e base parlamentar são três objetos separados no motor. Um aliado de campanha pode ser oposição no governo. Base parlamentar e governabilidade: ver `motor-eleitoral.md` seção 10. Grupo político atravessa partidos e não é estrutura partidária. Facções internas: Fase 2.

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
