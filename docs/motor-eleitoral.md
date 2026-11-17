# Motor eleitoral

Todas as fórmulas aqui são estrutura. Pesos e expoentes são (calibrar).

## 0. Mapa de causalidade

Regra central: **cada fenômeno chega à urna por um único caminho.** Causas atualizam estados ao longo das janelas; a urna lê só estados e fatores de campanha. Nenhuma causa entra ao mesmo tempo num estado e na fórmula de voto.

### Camadas
| Camada | Variáveis | Atualizada quando |
|---|---|---|
| Causas externas | conjuntura (aprovação do governo, polarização, clima econômico, tensão institucional), ruído | a cada janela, fluxo de RNG de mundo |
| Causas do jogador | cartas, entregas do mandato (realizações), compromissos, gasto de campanha | ao resolver cartas e eventos |
| Estados acumulados do candidato | popularidade, notoriedade, rejeição (por escopo), base territorial, grupo político, credibilidade | a cada janela, com decaimento |
| Estados acumulados do partido | baseUF (identificação partidária na UF), Fundo, tempo de TV | a cada janela (baseUF) e por ciclo (Fundo, TV) |
| Fatores de campanha | gasto, coligação, tempo de TV, redes, máquina | só no ano eleitoral |
| Resultado | votos, eleitos, 2º turno | na urna |

### Caminhos permitidos
```
clima econômico ----------> aprovação do governo
aprovação do governo -----> baseUF dos partidos do governo e da oposição   (único caminho)
entregas do mandato ------> popularidade e rejeição do candidato           (único caminho)
associação ao governo ----> popularidade do candidato, só por evento explícito (vice, secretário, apoio declarado)
polarização --------------> pesos: k da rejeição, peso das redes, bônus de partido pequeno (muda pesos, não níveis)
tensão institucional -----> gatilhos de eventos e bônus de partido pequeno
base territorial + grupo -> máquina
estados + campanha -------> votos
```

### Proibições
- Aprovação do governo não entra direto na fórmula de voto: já está em baseUF.
- Desempenho do mandato não entra direto na fórmula de voto: já está em popularidade e rejeição. O termo `desempenho` da versão anterior foi removido.
- A "carona nacional" é efeito do candidato nacional do partido sobre baseUF no ano eleitoral, não um fator separado da aprovação do governo. Se o candidato nacional é o próprio governo, a carona já está em baseUF.
- Potencial não entra em nenhum ponto da urna (D1).

### Teste de dupla contagem
Para cada causa, a calibração mede o efeito total na votação por dois caminhos alternativos desligados; se o efeito dobrar ao religar, há dupla contagem.

## 1. Estoques

- **Voto:** intenção acumulada (popularidade, notoriedade e rejeição no escopo da disputa). Estado, não causa.
- **Máquina:** organização territorial. Derivada da base territorial agregada e do grupo político (`carreira-e-poder.md` 10.1 e 10.2).
- **Dinheiro:** Fundo de Campanha disponível (FEFC repassado, fundo partidário, doações). Nunca se mistura com recurso público ou patrimônio pessoal.

## 2. Máquina e transferência

Prefeito aliado não transfere voto automaticamente. A transferência é probabilística:

```
transferencia = forcaPrefeito × aderencia × N(1, sigma)   (sigma alto, calibrar)
```

Um candidato pode ter votação extraordinária sem prefeitos ou fracassar com muitos.

## 3. Proporcional (vereador, deputado estadual, deputado federal)

Votos nominais do candidato:
```
V = baseUF(partido)^a      (identificação partidária; já contém aprovação do governo e carona)
  × maquina^b
  × popLocal^c             (já contém desempenho do mandato)
  × gasto^d                (retorno decrescente)
  × ruido(semente)
```

A capacidade efetiva entra só de forma indireta, pela qualidade das ações de campanha resolvidas nas cartas.

Apuração:
1. Quociente eleitoral = válidos ÷ vagas.
2. Quociente partidário por partido ou federação.
3. Eleitos dentro do quociente exigem 10% do QE individual.
4. Sobras: partido com 80% do QE e candidato com 20% do QE.
5. Regra de distribuição final das sobras conforme Código Eleitoral vigente (a confirmar).

Coligação não existe em proporcional. Federação conta como um partido.

## 4. Majoritária (prefeito, governador, senador, presidente)

Peso maior em opinião e rejeição:
```
V = (popEscopo - k × rejeicao)^a × notoriedade^b × baseUF^c × maquina^d × gasto^e × coligacao^f × tempoTV^g × redes^h × ruido
```

`k` e o peso de `redes` variam com a polarização. Desempenho e aprovação chegam via popularidade, rejeição e baseUF (seção 0).

- Senado 2026: cada eleitor tem 2 votos; as 2 maiores votações vencem.
- 2º turno: os dois primeiros, com eventos de apoio, debate e transferência probabilística dos derrotados. TV com tempo igual.

## 5. Dinheiro e exposição (canais separados)

### FEFC 2026
Total: R$ 4.961.519.777 (a confirmar no TSE).

| Critério | Peso |
|---|---|
| Igual entre os 30 partidos | 2% |
| Votos para deputado federal | 35% |
| Bancada da Câmara | 48% |
| Bancada do Senado | 15% |

Bancadas contadas no primeiro dia útil de junho. Cálculo por partido; tratamento de federados (a confirmar).

Valores de referência em R$ milhões, fonte secundária, a validar no TSE: PL 881,7; PT 615,4; União 526,2; PSD 421; PP 417,1; MDB 400; Republicanos 348,6; Podemos 246; PDT 169,3; PSB 152,3; PSDB 147,9; PSOL 131,5; Solidariedade 88,5; Avante 72,5; PRD 71,8; PCdoB 60,5; Cidadania 60,2; PV 45,2; Novo 37; Rede 35,8; demais na cota mínima.

O motor recalcula o FEFC dos ciclos seguintes pela mesma regra, com os resultados simulados.

### TV
- 90% proporcional aos deputados eleitos na última eleição (2022 para 2026), não à bancada atual.
- 10% igual entre partidos que passaram a cláusula.
- 2º turno: tempo igual.
- Novo e Missão sem TV em 2026.
- Efeito fraco e decrescente por ano. TV em eleição municipal (a confirmar).

### Rede social
Canal próprio, peso crescente por ano. Favorece notoriedade, Influenciador/Coach e partido pequeno em ambiente polarizado. Aumenta variância e rejeição.

| Canal | Força | Tendência |
|---|---|---|
| FEFC | forte | estável |
| TV | fraca | decrescente |
| Rede | média | crescente |

Pesos por ano: (calibrar).

## 6. Fechamento do ciclo

Após a urna, em ordem:
1. Apuração e posse agendada.
2. Atualização das matrizes (bancadas, governos, prefeituras, relações entre partidos) e da base parlamentar inicial de cada governo (ver seção 8).
3. Recalculo de fundo, TV e cláusula para o próximo ciclo. Partido abaixo da cláusula perde fundo e TV a partir de 2027.
4. Abertura do próximo ciclo: oportunidades, convites, distribuição de Capital de Entrega.

Pós-urna, eleitos governam e legislam via Capital de Entrega (ver `carreira-e-poder.md`).

## 7. Simulação de fundo

Disputas sem o jogador rodam no modo estatístico por UF. Em municípios com agentes, as disputas usam candidatos individuais fictícios.

## 8. Base parlamentar e governabilidade (MVP simplificado, P4)

Calculada por casa legislativa (câmara municipal, assembleia, Câmara, Senado) para cada governo, a partir de partidos e federações, resultados eleitorais e acordos. Sem parlamentares individuais.

Por bloco partidário na casa:
```
bloco = { partido ou federação, cadeiras, alinhamento (aliado, independente, oposição), coesao }
```

Componentes:
- **Composição e tamanho:** cadeiras aliadas sobre o total.
- **Coesão:** fração esperada de cada bloco aliado que vota com o governo. Cai com aprovação do governo baixa, compromissos rompidos e disputa de espaço.
- **Custo de manutenção:** Capital de Entrega por ciclo para cada bloco, maior para blocos grandes, independentes ou com baixa coesão.

```
apoioEfetivo    = Σ cadeiras(bloco aliado) × coesao(bloco)
estabilidade    = f(tempo da coalizão sem ruptura, compromissos cumpridos com os blocos, dispersão ideológica dos blocos)
folgaDeCusto    = Capital de Entrega disponível ÷ custo de manutenção da base
negociacao      = f(credibilidade, relação com Bancada, capacidade efetiva em Articulação)
governabilidade = faixa( apoioEfetivo / maioriaExigida, ajustado por estabilidade, folgaDeCusto e negociacao )
                  faixas: crítica, frágil, funcional, sólida
```

Sem barra na interface: só a faixa textual. Folga de custo negativa (custo maior que o disponível) reduz a coesão no ciclo seguinte.

`maioriaExigida` varia por tipo de proposta (simples, absoluta, qualificada; quóruns reais a confirmar). Governabilidade não equivale ao percentual de cadeiras: 60% de cadeiras com coesão 0,6 rendem menos que 52% com coesão 0,95.

Uso: chance de aprovar propostas do Executivo; resistência a CPI, pedido de impeachment e rejeição de contas. Perda de apoio durante o mandato: a cada janela, blocos podem mudar de alinhamento por conjuntura, custo não pago ou evento.

