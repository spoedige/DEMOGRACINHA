# Carreira e poder

## 1. Personagem

### Origens (decisão D36)

Origem é o que o personagem era antes de entrar na carreira política, não o que já conquistou politicamente. Regra geral: **todos começam sem mandato eletivo**; nenhuma origem concede mandato, eleição, nomeação ou Capital de Entrega. Partida com mandato, se um dia existir, será um cenário inicial separado.

Cada origem define principalmente **caminhos**: rede inicial, cartas próprias no pool e tipos de oportunidade que tendem a surgir. Diferenças numéricas iniciais são pequenas (calibrar) e servem ao caminho, não o substituem.

| Origem | Rede inicial | `redePoliticaPrevia` | Cartas e oportunidades próprias | Limitação de partida |
|---|---|---|---|---|
| Influenciador/Coach | audiência digital | nenhuma | cartas de redes sociais; convites de partidos que buscam exposição | Cúpula inicial baixa; pouca base territorial |
| Pastor | comunidade religiosa | indireta | cartas de mobilização da congregação; diálogo com eleitorado evangélico | notoriedade fora da comunidade baixa |
| Líder Comunitário | associações de bairro, movimentos locais | indireta | cartas de demandas locais e mutirões; base territorial inicial em um município | notoriedade estadual e nacional baixa |
| Empresário | entidades empresariais, fornecedores | indireta | doações próprias a campanha dentro da lei; cartas de gestão e investimento local | rejeição inicial maior entre trabalhadores organizados (calibrar); risco jurídico só por ações, nunca pela origem |
| Rede Familiar Política | relações preexistentes com políticos da família | direta | acesso facilitado à Cúpula e a convites; cartas de herança de base | expectativa de lealdade à família (compromissos herdados); nenhuma tag de nepotismo ou corrupção pela origem |
| Liderança Sindical ou Associativa | sindicato, associação profissional ou de classe | indireta | cartas de mobilização organizada; diálogo com eleitorado sindicalizado ou associado | relação inicial com Executivo dependente do alinhamento do governo |
| Servidor | carreira pública, colegas de órgão | nenhuma | cartas técnicas; oportunidades em funções de gestão | sem penalidade automática |
| Assessor | gabinetes, bastidores | direta | cartas de articulação; acesso a lideranças | baixa exposição pública inicial (notoriedade baixa), sem penalidade de popularidade |
| Gestor Público | ex-gestor de órgão ou programa, fora do cargo | direta | cartas de gestão e entrega; oportunidades de nomeação futura | Bancada inicial baixa |
| Professor/Educador | vínculo profissional com escola, universidade e comunidade escolar, sem acesso institucional nem rede organizada com peso político na partida | nenhuma | cartas de educação, serviços públicos e articulação comunitária | recurso financeiro inicial baixo |

`redePoliticaPrevia` (propriedade fixa da origem, valores propostos para revisão):
- **nenhuma:** sem acesso prévio a políticos, partidos ou governos e sem rede organizada com peso político.
- **indireta:** rede organizada não partidária com peso político (igreja, associação, sindicato, entidade empresarial), sem acesso direto à política institucional.
- **direta:** acesso prévio a políticos, gabinetes, direção partidária ou estrutura de governo.

Regras e títulos que dependem de rede prévia consultam só esta propriedade.

### Indicadores
Popularidade, notoriedade e rejeição em 3 escopos (local, estadual, nacional). Reputação é indicador derivado, não atributo.

### Três bolsos
- **Caixa Pessoal:** dinheiro do personagem.
- **Fundo de Campanha:** partidário, eleitoral (FEFC) e doações. Só para campanha.
- **Capital de Entrega:** representação abstrata da capacidade institucional de produzir entregas, articular recursos orçamentários e negociar espaços políticos. Obtido só pelo exercício de função pública (mandato ou nomeação governamental). Não é dinheiro público à disposição do personagem. Os usos (emenda, indicação, prioridade de projeto) são tipos distintos de entrega e não se convertem entre si nem em unidade econômica. Desviar a capacidade institucional para ganho pessoal é corrupção.

Caixa do partido pertence aos agentes do partido, não ao jogador.

### Três relações
Cúpula (direção partidária), Bancada (pares no Legislativo), Executivo (vínculo com governos: aliado, independente ou oposição). Relação com Executivo é relacional e vale para todos; não se confunde com governabilidade.

### Dimensões institucionais e reputacionais (decisão D3)
| Conceito | Natureza | Exibição | Quem tem |
|---|---|---|---|
| Relação com Executivo | relacional | número | todos |
| Governabilidade | institucional, contextual | faixa | ocupante de cargo executivo |
| Credibilidade | reputacional (confiança dos atores políticos) | faixa | todos |
| Capital político | derivado | oculto | todos |

- **Credibilidade (P5, MVP)** sobe com compromissos cumpridos e cai com rompidos. Atua só sobre atores políticos: aceitação de compromissos, ofertas de nomeação, negociação da governabilidade, coesão de blocos aliados. Não atua sobre o eleitor. Sem duplicação:
  | Dimensão | Público | Muda com | Atua em |
  |---|---|---|---|
  | Popularidade e rejeição | eleitor | exposição, entregas, escândalos públicos | voto |
  | Credibilidade | atores políticos | cumprimento de compromissos | negociação, convites, coesão |
  | Reputação histórica | ambos, como tag | padrão de escolhas ao longo da carreira | relações (modificador de partida), grau |
  | Arquivo Vermelho | justiça e imprensa | atos ilícitos | risco jurídico, escândalos |
  Um mesmo fato só altera mais de uma dimensão quando atinge públicos diferentes por meios diferentes (exemplo: escândalo publicado atinge rejeição; o rompimento de acordo que o causou atinge credibilidade).
- **Governabilidade**: ver `motor-eleitoral.md` seção 10.
- **Capital político** não é estado guardado. É calculado quando necessário:
  `capitalPolitico = f(relações, influência do grupo, credibilidade, reputação, base territorial)` (pesos a calibrar).
  Regra de não duplicação: onde capital político é usado (oferta de convites e nomeações, força em negociação), seus componentes não entram de novo como termos separados. Uma regra usa ou o capital político ou componentes específicos, nunca os dois.

### Estado adicional
Tags, Arquivo Vermelho, eventos atrasados, `mandatosConsecutivos`, saúde gradual (sem game over automático), status jurídico (ver `eventos-e-risco.md`).

### Mudanças de base
- Migração de estado: tag Paraquedista. Popularidade inicial no novo estado = notoriedade nacional × fator (calibrar; a confirmar).
- Troca de partido: custo ideológico e relacional (Cúpula, Bancada, tag de infidelidade partidária). Menor dentro da janela para cargos proporcionais.

## 2. Camadas de progressão

1. Personagem: origem, talento, potencial, capacidade efetiva, experiência.
2. Desenvolvimento: aprendizado, especialização, desgaste, maturação.
3. Oportunidades: convites, candidaturas, alianças, disputas internas.
4. Legado: resultados e reputação.

## 3. Potencial Político (oculto, 0 a 100)

- Sorteado pela semente, distribuição concentrada no meio (hipótese: normal truncada, média 50, desvio 15; calibrar). Origem e dificuldade deslocam a média.
- É capacidade de desenvolvimento, não teto de carreira.
- Regra (D34): o potencial não possui efeito direto sobre resultados eleitorais, candidaturas, elegibilidade, alianças ou recursos de campanha. Pode influenciar o desenvolvimento das aptidões, que, uma vez adquiridas, afetam normalmente as ações e seus resultados.
- Efeitos: velocidade e teto de crescimento das aptidões por oportunidade de aprendizado; recuperação e adaptação após derrotas e crises; disponibilidade de oportunidades de formação (cursos, mentorias, funções técnicas).
- Não gera oportunidades eleitorais, candidaturas, alianças nem recursos de campanha.
- Mutável: feitos e fracassos extremos movem 1 a 5 pontos, com teto acumulado na carreira (calibrar, hipótese ±10).
- Descoberta: número nunca exibido. Após 2 a 3 eleições aparecem faixas qualitativas. O balanço a cada 4 anos mostra a evolução das aptidões, não um teto.

## 4. Aptidão e capacidade efetiva

- Seis dimensões ocultas: Articulação, Comunicação, Mobilização, Gestão, Estratégia, Resiliência. Geradas pela semente com especializações e limitações.
- Capacidade efetiva = aptidão natural desenvolvida pela experiência. A aptidão define margem e velocidade; a capacidade é o que vale nas cartas e no motor.
- UI: descrição qualitativa e até 3 etiquetas. Nunca números.
- Talento nunca bloqueia carta.

## 5. Experiência e idade

- Vem de ações, mandatos, crises, derrotas, negociações e eventos. Compensa limitações. Repetição gera especialização com retorno decrescente.
- Capacidade não decai com a idade. Idade afeta energia, saúde, disponibilidade e desgaste de popularidade. Influência interna e experiência tendem a crescer. Veterano pode perder popularidade e ganhar influência.

## 6. Platô

- Peso de saída por cargo: quanto mais tempo, maior o custo político e menor o retorno de continuar. Após 2 mandatos surgem cartas de "ciclo cumprido".
- Cada degrau é mais caro e arriscado. O jogador típico circula entre vereador, deputado e cargos próximos.
- Senado é escolha de identidade: 8 anos, estabilidade e menos exposição executiva, com influência legislativa alta (revisão, aprovação de autoridades, papel federativo).

## 7. Caminho à Presidência

- Sem gate. A candidatura emerge de notoriedade nacional, indicação partidária, coligação competitiva, recursos, rejeição administrável, apoio territorial e relações.
- Trajetórias: carreira legislativa, executivo (prefeito, governador), articulador de bastidor (liderança, vice), fenômeno eleitoral, ascensão improvável.
- Pode chegar e perder. Meta (hipótese): Presidência em 1 a 3% das carreiras. A diferença entre faixas de potencial emerge só pelo desenvolvimento das aptidões; é medida na calibração, não imposta.
- Outros grandes finais: senador influente, governador popular, líder partidário.

## 8. Ambição, oportunidades e identidade

- Objetivos declarados e emergentes, mutáveis, nunca obrigatórios. Orientam eventos, janelas automáticas e o veredito final.
- Oportunidades têm prazo, dependem de talento, experiência, relações, notoriedade, histórico e posição. Podem ser aceitas, recusadas ou perdidas. Algumas nascem de decisões de anos antes.
- Capital político (oculto, derivado): ver seção 1. Define convites e negociações.
- Oportunidades eleitorais e de aliança dependem de posição, relações, grupo, base e conjuntura, nunca diretamente do potencial.
- Reputação histórica: articulador, gestor, populista, reformista, oportunista, conciliador. Tag que influencia relações.

## 9. Vice

- Convite chega como carta quando uma chapa majoritária precisa de companheiro.
- Ganhos: notoriedade no escopo da chapa (municipal, estadual ou nacional), rede do titular, experiência executiva, crédito na Cúpula.
- Custos: menos autonomia, popularidade avaliada junto com o titular, Bancada menos favorável.
- Risco: se o titular cai, o vice sucede com legitimidade reduzida (calibrar; regras a confirmar). Vice substitui e sucede titular do Executivo; suplente substitui ou sucede legislador (senador, deputado, vereador). As regras são distintas por cargo (a confirmar na 1B).
- Armadilha do vice: exposição sem descolamento. Cartas de posicionamento próprio custam Cúpula e liberam candidatura própria.
- Pool próprio de bastidor. Substituição (temporária) é diferente de sucessão (definitiva).

## 10. Poder entre eleições (MVP enxuto)

Áreas: partido por dentro, Legislativo, emendas, Executivo, federalismo, instituições externas, eleitorado, crises, conformidade eleitoral.

- Capital de Entrega (definição na seção 1) é a capacidade de governar e legislar; não é dinheiro.
- Legislador: votações, relatorias, comissões, liderança, emendas. Pode integrar a base ou a oposição do governo correspondente.
- Executivo: entregas, nomeações, formação e manutenção da base parlamentar (governabilidade).
- Conformidade no MVP: candidatura laranja, desincompatibilização, registro e impugnação. Prestação de contas e limite de gastos ficam para a Fase 2.

### 10.1 Grupo político (MVP simplificado, P1)

Conjunto de aliados que orbitam o personagem e atravessa partidos. Não é partido nem facção. Permite que a influência sobreviva fora do cargo.

Representação agregada no MVP:
| Variável | Significado |
|---|---|
| influência | peso do grupo nas decisões em que atua |
| relações | coesão interna e lealdade média ao personagem |
| presença institucional | contagem de posições ocupadas por membros (mandatos e nomeações) por escopo |
| papel do personagem | líder, integrante |

- Cresce quando o personagem elege aliados, indica nomeações e cumpre compromissos com o grupo. Decai sem entregas, com compromissos rompidos e com longos períodos sem posição.
- O personagem pode liderar um grupo próprio ou integrar o de outro líder (agente). Integrar dá acesso; liderar dá influência e custo.
- Sem membros individuais, sem disputa interna, sem sucessão detalhada (Fase 2).

### 10.2 Base territorial (MVP simplificado, P3)

Detalhada nos municípios do conjunto da base (até 10, qualquer UF, inclui o município inicial; `regras-e-mundo.md` 4; D12 interpretada por D52). Fora dele, um agregado regional. O conjunto da base não altera o conjunto de agentes.

```
base[municipio] = { forca, custoManutencao }
```

- Cresce com presença, entregas (Capital de Entrega dirigido) e organização construída com aliados eleitos em 2028 e 2032.
- Distinção (D53): base territorial é estrutura política duradoura do próprio personagem. A força pessoal de prefeitos, vereadores e lideranças aliadas não faz parte da base; chega à máquina só pela transferência (`motor-eleitoral.md` 4.5), eleição a eleição.
- Lacuna registrada: não há regra para o que acontece quando o personagem tenta criar base num 11º município com o conjunto cheio.
- Decai sem manutenção a cada ciclo.
- Alimenta Máquina no motor eleitoral; transferência continua probabilística.

### 10.3 Compromissos com atores (MVP simplificado, P6)

```
compromisso = {
  id, tipo,
  ator,            // contraparte agregada
  objeto,          // o que foi prometido
  prazo,           // janela de vencimento
  custo,           // o que custa cumprir, em uma moeda
  contrapartida,   // o que o personagem recebeu ao firmar
  seCumprir,       // consequência de cumprir
  seRomper,        // consequência de romper
  custoPoliticoDeRomper,   // usado na priorização do Express
  estado           // ativo, cumprido, rompido
}
```

Tipos (lista fechada no MVP):
| Tipo | Objeto | Moeda de cumprimento |
|---|---|---|
| Apoio eleitoral | apoiar candidato ou chapa em eleição futura | relação, notoriedade emprestada |
| Cargo ou espaço | indicar aliado do ator para posição | vaga de nomeação, Capital de Entrega |
| Voto em proposta | votar ou orientar voto | relação com outros atores |
| Repasse institucional | emenda, convênio ou prioridade orçamentária dirigida ao ator | Capital de Entrega |

O repasse é sempre institucional ou orçamentário. Nunca envolve Fundo de Campanha, fundo partidário ou Caixa Pessoal. Prometer dinheiro de campanha ou pessoal em troca de apoio não é compromisso: é carta de corrupção (`eventos-e-risco.md` seção 5).

- Ator agregado: partido, federação, governo, grupo político ou liderança local. Sem negociação aberta: o compromisso nasce de uma carta.
- Até 5 compromissos ativos (decisão D12). Vencidos, cumpridos ou rompidos ficam no histórico e continuam valendo para credibilidade e memória do ator.
- No vencimento: cumprido (credibilidade sobe, relação com a contraparte sobe) ou rompido (credibilidade cai, contraparte guarda memória e pode retaliar via evento atrasado).
- Compromissos podem atravessar mandatos.

### 10.4 Cargos de nomeação (MVP simplificado, P7)

Posições relevantes que dão influência sem mandato eletivo. Lista fechada no MVP:
| Escopo | Posições |
|---|---|
| Municipal | secretário municipal (nos municípios do conjunto de agentes) |
| Estadual | secretário estadual |
| Federal | ministro, secretário executivo de ministério, presidente de órgão ou estatal federal (como Embratur e BNDES; D80) |
| Partidária | presidente de diretório municipal, estadual ou nacional |

Fase 2 (decisão D37): secretário-geral, tesoureiro, coordenador de campanha do partido.

Nomeações governamentais (municipal, estadual, federal) dependem de relação com Executivo e composição do governo e exigem desincompatibilização para disputar. Posições partidárias dependem da Cúpula, não exigem desincompatibilização (a confirmar) e não recebem Capital de Entrega (decisão D25). Seus efeitos são de influência partidária e organizacional: peso na escolha de candidaturas, na distribuição interna de fundos, na distribuição interna da exposição dentro do tempo de TV que a lei dá à legenda (o tempo legal não muda) e na capilaridade da legenda.

- Não há simulação de todas as nomeações do país. Só existem as vagas que podem ser oferecidas ao personagem, criadas quando ele tem relação suficiente com o governo ou o partido.
- Oferta depende de: relação com Executivo (ou Cúpula, para cargo partidário), composição do governo (partido do personagem na coalizão), compromissos firmados (tipo "cargo ou espaço") e conjuntura. Capital político não entra, porque seus componentes já estão presentes (D54).
- Efeitos das nomeações governamentais: Capital de Entrega, presença institucional para o grupo, experiência executiva; exigem desincompatibilização para disputar eleição (prazos a confirmar).
- Efeitos das posições partidárias: influência sobre legenda, distribuição interna de fundos e presença institucional; sem Capital de Entrega.
- Saída: demissão por mudança de coalizão, crise ou queda de governabilidade; ou saída voluntária para disputar.
- Sem Ponto de Inflexão próprio além de "Ministério em crise", já previsto.

### 10.5 Valor do cargo por contexto (P12, MVP simplificado)
A ficha de oportunidade substitui "nível do cargo" e "prestígio" fixos por atributos calculados de dados já existentes, sem bônus:
| Atributo | Cálculo |
|---|---|
| Eleitorado alcançado | eleitorado do escopo do cargo |
| Exposição esperada | variação esperada de notoriedade no escopo, pelas regras de exposição do cargo |
| Recurso político | Capital de Entrega esperado por ciclo, pela regra do cargo |
| Posição na coalizão | aliado, independente ou oposição ao governo correspondente; para executivo, faixa de governabilidade inicial |
| Papel esperado | protagonista ou coadjuvante, já previsto |
Nenhum atributo altera o efeito do cargo; só descreve. Orçamento real de secretarias e ministérios: Fase 2.

### 10.6 Coalizão de governo completa (P13): Fase 2
Formação da coalizão federal com distribuição de ministérios por partido fica para a Fase 2. No MVP, base parlamentar (D11) e nomeações (D8) cobrem o essencial.

## 11. Fase sem cargo

Sabático, mídia, livro, aulas, curso, negócio. Cada opção troca recursos e indicadores (exemplo: livro sobe notoriedade e custa tempo; negócio sobe Caixa Pessoal e pode subir risco jurídico).

Fora do mandato eletivo o personagem mantém poder por quatro vias: cargo de nomeação ou direção partidária (10.4), liderança do grupo político, base territorial e compromissos a receber.

## 12. Avaliação final (decisão D4)

Grau qualitativo (faixas a definir, fórmula oculta) em cinco dimensões:

| Dimensão | Fontes no MVP |
|---|---|
| Alcance institucional | cargos e posições ocupadas, tempo em cada um |
| Influência política | influência (P8, abaixo); exclui cargos ocupados |
| Realizações | entregas dos mandatos, propostas aprovadas |
| Reputação | credibilidade, reputação histórica, Arquivo Vermelho, escândalos |
| Legado | o que persiste sem o personagem: simulação de um ciclo após a saída, medindo influência residual do grupo, base remanescente e aliados em posição |

### Influência (P8, MVP)
Dimensão própria, separada do poder institucional. Poder institucional é o que o cargo dá (Capital de Entrega, competências legais) e já entra em alcance institucional. Influência é a capacidade de mover decisões de outros, com ou sem cargo:
```
influencia = f( grupo.influencia, influenciaPartidaria, compromissosAReceber, baseTerritorial agregada )
```
- `influenciaPartidaria`: posições partidárias e relação com a Cúpula.
- `compromissosAReceber`: compromissos ativos em que outro ator deve ao personagem.
- Cargo não entra. Um mesmo fato não conta nas duas dimensões: eleger-se soma a alcance; eleger aliados soma ao grupo e, por ele, à influência.
- Influência é medida ao longo da carreira (ponderada pelo tempo); legado é medido só depois da saída. As fontes são as mesmas, mas os períodos não se sobrepõem.
- Função `f` (calibrar). Não é exibida como número: aparece em faixa na tela de consulta.

O cargo mais alto pesa, mas não é multiplicador dominante. Pesos a calibrar para que presidente isolado, senador articulador e governador bem avaliado possam ter graus comparáveis. A avaliação considera o contexto: oportunidades que a conjuntura ofereceu.

Quadro de desenvolvimento (D39), em texto qualitativo: potencial inicial (faixa), aptidões atuais (até 3 etiquetas) e evolução desde o início da carreira. Substitui a linha potencial versus alcançado. Sucessores individuais: Fase 2.
