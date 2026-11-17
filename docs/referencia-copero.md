# Referência Copero e crítica independente

Status: análise para decisão. Não altera o GDD nem os docs aprovados.
Data: 17/11/2026.

## 0. Escopo e fontes

| Fonte | Situação |
|---|---|
| `qpbo/copero-99-ovr` (README e `src/copero-99-ovr.user.js`, 501 linhas) | Lido em `/tmp/copero`, fora do repositório. Não executado |
| copero.me/guias/como-funciona e /decisiones | Bloqueado pela rede (HTTP 403). Não lido |

Consequência: quase nada do Copero foi observado de fato. O script adultera o estado do jogo e não contém o motor. A maior parte desta análise é crítica independente do DEMOGRACINHA, que é o que o projeto mais precisa agora.

Princípio adotado: o DEMOGRACINHA é avaliado pela coerência da própria proposta. O Copero serve só para isolar princípios de experiência. Nenhuma mecânica é recomendada por existir lá.

## 1. O que o repositório mostra

### 1.1 Fato (lido no código ou no README)
- O jogo é uma SPA em React e Vite. O estado da carreira fica no estado do componente, não em `localStorage` nem em `window` (README).
- Campos de estado citados pelo script: `player.overall`, `player.age`, `player.injuryType`, `player.suspensionSeasonsRemaining`.
- Existe um atributo `data-career-phase` no contêiner da carreira: a carreira é dividida em fases nomeadas.
- O README afirma um limite rígido de 40 a 99 para o overall e que ele "não se calcula por gols nem estatísticas", e sim pelas decisões (eventos, lesões, transferências).
- A unidade de tempo das punições é a temporada (`suspensionSeasonsRemaining`).

### 1.2 Inferência (dedução, não verificado)
- Um único número síntese (overall) concentra a progressão e é o que o jogador percebe como "estar indo bem". É isso que o cheat ataca.
- Como o número nasce de decisões e não de partidas, o jogo é uma narrativa de escolhas com placar resumido, não um simulador de partidas.
- Lesão e suspensão são estados temporários que bloqueiam ou punem por tempo.
- O fato de existir demanda por "Modo Deus" e por "curva realista por idade" sugere que jogadores sentem a progressão como arbitrária ou punitiva demais. É hipótese.

### 1.3 Não encontrado
Fórmulas, pool de eventos, estrutura de cartas, probabilidades, títulos, telas, ritmo, save, interface móvel. Nada disso pode ser afirmado sobre o Copero a partir das fontes permitidas.

### 1.4 Confronto com o GDD
| Achado | Efeito no DEMOGRACINHA |
|---|---|
| Número síntese visível de progressão | **Contradiz por escolha.** O GDD esconde o potencial e não tem número síntese. Mantido: política não tem "overall"; o mais próximo é a soma de mandato, base, relações e reputação, que não se reduz a um número |
| Progressão por decisões, não por estatística | **Confirma** o princípio das cartas, sem acrescentar mecânica |
| Fases nomeadas da carreira | **Confirma** a ideia de janelas, que no DEMOGRACINHA vem do calendário eleitoral real, não de temporada |
| Curva por idade (no cheat, não no jogo) | **Contradiz por escolha.** O GDD diz que capacidade política não decai por idade. Mantido |
| Estado temporário que bloqueia (lesão, suspensão) | **Acrescenta uma pergunta**, não uma mecânica: o DEMOGRACINHA tem estados temporários equivalentes por motivos próprios (investigação, licença médica, afastamento cautelar). Ver P10 |
| Clamp rígido de 40 a 99 | **Alerta.** Limites rígidos geram demanda por trapaça. O GDD já evita piso e teto artificiais em partidos; falta aplicar a mesma regra aos indicadores do personagem |
| Estado só em memória | **Diverge.** O DEMOGRACINHA salva o delta e exporta por código. Sem mudança |

Conclusão da comparação: o Copero, visto por estas fontes, oferece um alerta (número síntese e limites rígidos convidam à adulteração) e uma confirmação (decisões como motor). Não oferece arquitetura a seguir.

## 2. Crítica independente do DEMOGRACINHA

Cada item: diagnóstico e problema. Propostas ficam na seção 3.

**C1. O loop representa a política brasileira?** Parcialmente. O loop é eleição, mandato, eleição, com janelas guiadas pelo calendário legal. Isso captura bem o ano eleitoral. Falha no ano calmo: duas janelas genéricas, sem estrutura própria. Na política real o ano calmo é onde se constrói base, se disputa o partido, se negocia orçamento e se escolhe o próximo passo. O GDD trata o intervalo como espera entre urnas.

**C2. Consequências em vários prazos?** O formato existe (5 horizontes, eventos atrasados), mas o conteúdo não. Nenhum doc define o que persiste entre mandatos além de tags e Arquivo Vermelho. Uma promessa, uma aliança, um adversário criado não têm objeto próprio. Sem isso, o longo prazo vira só "risco atrasado de escândalo", que é uma única cor de consequência.

**C3. Influência sem cargo eletivo?** Fraca. A fase sem cargo lista sabático, mídia, livro, aulas, curso e negócio. Todas são atividades de espera ou de acumular recurso. Faltam as posições reais de poder sem mandato: presidência de diretório, secretaria de governo, ministério, coordenação de campanha, assessoria de liderança, direção de estatal ou autarquia. O jogo hoje diz que fora do mandato o personagem não manda em nada.

**C4. Trajetórias relevantes sem Presidência?** O texto afirma que sim, mas o sistema não sustenta. Grau e títulos premiam cargo alcançado. "Senador influente" e "líder partidário" não têm medida de influência própria. Sem medir influência, o jogador lê a escada de cargos como o placar real.

**C5. Partido, território, coalizão e instituições funcionam por conta própria?** Partido tem atributos (marca, coesão, liderança), mas nenhuma dinâmica interna: não há facção, disputa de comando nem regra de quem recebe legenda e fundo. Território é um número (Máquina) e uma lista de prefeitos. Coalizão de governo e base parlamentar são citadas como objetos separados, mas sem regras. A relação Executivo e Legislativo resume-se à relação "Executivo" do personagem, que mistura governo municipal, estadual e federal num só eixo.

**C6. Potencial, aptidões e experiência se sobrepõem?** Sim, e há risco de determinismo. Potencial acelera experiência, aumenta ganho de exposição e modifica chance eleitoral. Aptidão define margem de crescimento. Experiência eleva capacidade. São três camadas ocultas que fazem a mesma coisa: aumentar a eficácia do personagem. Pior, potencial modifica diretamente a urna. Na política, a falta de espaço institucional explica mais do que a falta de talento. O sistema atual coloca a causa dentro do indivíduo, onde ela menos pesa.

**C7. O mundo tem autonomia?** Declarada, não especificada. Agentes existem e decidem trocar de partido, mas não há governos governando, crises surgindo da conjuntura, partidos mudando de líder ou aprovação presidencial variando por si só. Sem ciclo de conjuntura, os Pontos de Inflexão parecem roteiro disparado pelo jogador.

**C8. Decisões estratégicas ou bônus e penalidades?** A regra de acoplamento garante tensão, mas a tensão é entre números (popularidade sobe, Cúpula cai). Isso tende a virar aritmética: o jogador escolhe o número que importa menos no momento. Decisão estratégica exige comprometimento com alguém (quem você apoia, contra quem vai, o que promete), com efeito que depende do que essa pessoa ou grupo fará depois. Hoje as cartas não criam compromissos com atores.

**C9. A escada de cargos é artificial?** Em parte. O platô e o peso de saída ajudam, mas a ficha de oportunidade ainda mede "nível do cargo" e "prestígio", sugerindo ordem única. Na política brasileira um deputado federal pode valer mais que um prefeito de cidade média, e um secretário estadual de peso pode valer mais que um vereador de capital. O valor depende de orçamento, visibilidade e posição na coalizão.

**C10. Popularidade, credibilidade e governabilidade.** O GDD tem popularidade e reputação (indicador derivado) e capital político oculto. Governabilidade não existe. Um prefeito popular sem maioria na câmara e um impopular com maioria vivem situações opostas, e o jogo hoje não distingue.

## 3. Propostas

Formato: problema que resolve, por que é político, como funciona, consequência no resto, vale a complexidade. Classificação e dependências no fim de cada uma. Nenhuma tem origem no Copero.

**P1. Grupo político como objeto persistente.**
Resolve C2, C4 e a sucessão. O grupo é o conjunto de aliados fictícios que devem lealdade ao jogador: vereadores que ele elegeu, prefeitos que apoiou, assessores que virou secretários. Cada membro tem lealdade e ambição próprias e pode crescer, trair ou herdar a base. Ser "dono de grupo" é poder real na política brasileira e não depende de cargo. Consequência: dá corpo ao título O Puxador, à sucessão e à fase sem cargo. Vale: é a peça que mais conecta o resto.
*MVP enxuto (até 6 membros, sem sucessão formal); Fase 2 completa. Depende de agentes individuais e de C3.*

**P2. Facções e comando do partido.**
Resolve C5. Cada partido tem 2 ou 3 facções fictícias com peso no diretório. Legenda, fundo e tempo de TV são distribuídos pela facção dominante. O jogador pode alinhar-se, fundar uma facção ou disputar a presidência do diretório (municipal, estadual, nacional). Cúpula deixa de ser um número e vira "relação com a facção que manda agora", que muda quando o comando muda. Consequência: troca de partido ganha motivo além de cláusula. Vale: é o maior gerador de decisão estratégica com ator.
*MVP para partido do jogador em escopo estadual; Fase 2 nacional e demais partidos. Depende de agentes.*

**P3. Base territorial por município.**
Resolve C5 e o "Máquina como número". Base deixa de ser escalar e vira mapa: para cada município relevante, força da base, liderança local que a sustenta e custo de manutenção por ano. Base sem manutenção decai. Perder a liderança local (morte, troca de lado, derrota em 2028) derruba a base naquele município. É como deputados realmente se elegem no Brasil. Consequência: o ano calmo ganha função (manter base), prefeitos aliados viram relações, eleição municipal de 2028 passa a importar para quem é deputado. Vale, desde que limitado aos municípios onde o jogador atua.
*MVP com até 10 municípios de base; Fase 2 sem limite. Depende de `municipios.json` e do motor municipal.*

**P4. Governabilidade como eixo separado.**
Resolve C10. Para quem ocupa Executivo: governabilidade = apoio no Legislativo correspondente, medido por bancada fictícia aliada. Afeta o que o Capital de Entrega consegue aprovar. Popularidade decide eleição, credibilidade decide convite, governabilidade decide entrega. É a diferença central do presidencialismo de coalizão. Consequência: a relação "Executivo" do personagem se divide em duas: relação com governos (se é legislador) e governabilidade (se é executivo). Vale: sem ela, mandato executivo é só acumular popularidade.
*MVP. Depende de bancadas simuladas por casa.*

**P5. Credibilidade como indicador visível.**
Resolve C10 e C8. Promover o capital político oculto a credibilidade visível em faixas: cumpre ou não cumpre acordo. Cada compromisso das cartas (P6) altera credibilidade quando vence. Ser confiável é ativo central de quem negocia. Consequência: some uma camada oculta, o que alivia C6. Vale.
*MVP. Depende de P6.*

**P6. Compromissos com atores.**
Resolve C8 e C2. Cartas de negociação criam compromissos registrados: "apoio ao candidato X em 2028", "secretaria para a facção Y", "voto a favor do projeto Z". O compromisso tem prazo, contraparte e custo de rompimento. Cumprir custa recurso; romper custa credibilidade e relação com a contraparte, que lembra. É o tecido real da política. Consequência: a regra de acoplamento precisa admitir "compromisso" como tipo de custo. Vale: transforma tensão numérica em tensão estratégica.
*MVP com até 5 compromissos ativos. Depende de agentes e de P5.*

**P7. Cargos de nomeação e direção partidária.**
Resolve C3 e C9. Secretário municipal ou estadual, ministro, presidente de diretório, coordenador de campanha, cargos de direção em estatal. São obtidos por indicação da coalizão, dependem de P2 e P4 do governante e saem quando a coalizão muda. Dão Capital de Entrega e rede, nunca mandato. Consequência: fase sem cargo deixa de ser espera; trajetória de bastidor ganha corpo. Vale.
*MVP com secretaria, ministério e presidência de diretório; Fase 2 com estatais e autarquias. Depende de P2 e P4.*

**P8. Influência como medida própria.**
Resolve C4. Influência = soma ponderada de grupo (P1), comando partidário (P2), base (P3), compromissos a receber (P6) e cargo. Entra no grau final e nos títulos com o mesmo peso que o cargo mais alto. Consequência: líder partidário sem mandato pode ter grau maior que presidente de um mandato só. Vale, e é barata se P1 a P6 existirem.
*MVP, depende de P1, P2, P3, P6.*

**P9. Conjuntura como ciclo autônomo.**
Resolve C7. Variáveis de mundo atualizadas por tick mensal, independentes do jogador: aprovação do governo federal e estaduais, polarização, economia percebida, tensão institucional. Pontos de Inflexão e crises surgem quando essas variáveis cruzam limiares, não por sorteio puro. O jogador lê a conjuntura e se posiciona. Consequência: o mesmo personagem tem carreiras distintas em conjunturas distintas, o que responde ao reparo sobre "potencial". Vale.
*MVP com 4 variáveis; Fase 2 com mais. Depende só do RNG de mundo.*

**P10. Estados institucionais temporários.**
Pergunta suscitada pela comparação, com justificativa própria: investigação, afastamento cautelar, licença de saúde, licença para cargo de nomeação, suplente em exercício. Cada estado altera quais cartas aparecem e o que o personagem pode fazer, sem game over. Consequência: dá forma ao status jurídico e à saúde, que hoje só mudam números. Vale, é pequeno.
*MVP para investigação, licença e afastamento; Fase 2 o resto.*

**P11. Consolidar talento em duas camadas e tirá-lo da urna.**
Resolve C6. Proposta: (a) aptidões e experiência permanecem, fundidas em capacidade; (b) potencial deixa de modificar a urna e passa a afetar só velocidade de aprendizado; (c) o teto real da carreira é dado pelo espaço institucional (P2, P3, P7, P9). Consequência: o balanço de 4 anos compara alcance com "oportunidades que existiram", não com um número interno. A meta de 1 a 3% de Presidência continua, mas emerge de conjuntura e posição. Vale, e reduz complexidade.
*MVP. Afeta `carreira-e-poder.md` seção 3 e `motor-eleitoral.md` (remover potencialMod).*

**P12. Valor do cargo por contexto.**
Resolve C9. A ficha de oportunidade passa a mostrar orçamento, visibilidade e posição na coalizão, calculados do contexto, em vez de nível fixo. Consequência: escolhas laterais (deputado vira secretário estadual) ficam legíveis. Vale, custo baixo.
*MVP. Depende de P4 e P7.*

**P13. Coalizão de governo e base parlamentar com regras.**
Resolve C5. Após a posse, o chefe do Executivo (jogador ou agente) monta coalizão distribuindo cargos (P7) entre partidos e facções. Base parlamentar é quem vota com o governo, recalculada por votação relevante. Membros da coalizão saem quando a conjuntura (P9) piora. Consequência: impeachment e ruptura de coalizão passam a ser emergentes. Vale, mas é o item mais caro.
*MVP para governos onde o jogador está (municipal ou estadual); Fase 2 federal completo. Depende de P4, P7, P9.*

## 4. Mapa de dependências e ordem sugerida

```
P9 conjuntura ─┐
agentes ───────┼─ P2 facções ─┬─ P7 nomeação ─┬─ P13 coalizão
               │              │               └─ P12 valor do cargo
               ├─ P1 grupo ───┤
               │              └─ P4 governabilidade
municípios ────┴─ P3 base
P6 compromissos ─ P5 credibilidade
P1+P2+P3+P6 ───── P8 influência
P11 independente (simplifica)
P10 independente
```

Ordem: P11 e P9 primeiro (simplificam e dão autonomia); depois P6, P5, P2, P3, P1; depois P4, P7, P12, P8; P13 por último.

## 5. Riscos

- Somadas, P1 a P13 dobram o escopo do MVP. A versão "MVP enxuto" de cada uma é obrigatória, ou o MVP não sai.
- P6 e P1 aumentam o estado salvo; o delta em localStorage precisa ser revisto.
- A regra de "no máximo 6 números" fica pressionada por P4, P5 e P8. Propor exibição por faixa, não por número.
- Mais atores fictícios exigem gerador de nomes robusto contra nomes reais.

## 6. Decisões pedidas ao autor

1. Aceitar P11 (potencial fora da urna)?
2. Quais de P1 a P13 entram no MVP e em que versão?
3. Governabilidade (P4) e credibilidade (P5) substituem a relação "Executivo" e o capital político oculto?
4. O grau final passa a pesar influência (P8) igual a cargo?
