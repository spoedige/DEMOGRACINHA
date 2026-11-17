# Carreira e poder

## 1. Personagem

### Origens (magnitudes a calibrar)
| Origem | Mais | Menos | Extra |
|---|---|---|---|
| Influenciador/Coach | notoriedade por ação de mídia | Cúpula inicial | cartas de redes sociais |
| Pastor/Líder Comunitário | popularidade local | notoriedade nacional | bônus com eleitorado evangélico |
| Empresário do Agro/Construtora | Caixa Pessoal, risco jurídico | popularidade entre trabalhadores | |
| Herdeiro de Clã | Cúpula, Bancada | reputação | tag Nepotismo permanente |
| Sindicalista/Militante | Bancada | Executivo | bônus com eleitorado sindicalizado |
| Servidor | Gestão | carisma (Comunicação) | bônus em cargos técnicos |
| Assessor | Articulação | popularidade | bônus em bastidores |
| Vereador em exercício | popularidade local | notoriedade nacional | começa com mandato |
| Secretário | Gestão, Executivo | Bancada | |

### Indicadores
Popularidade, notoriedade e rejeição em 3 escopos (local, estadual, nacional). Reputação é indicador derivado, não atributo.

### Três bolsos
- **Caixa Pessoal:** dinheiro do personagem.
- **Fundo de Campanha:** partidário, eleitoral (FEFC) e doações. Só para campanha.
- **Capital de Entrega:** emendas e cargos, obtido pelo exercício de funções. É recurso político, não dinheiro. Converter em Caixa Pessoal é corrupção.

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

- **Credibilidade** sobe com compromissos cumpridos e cai com rompidos. É distinta de popularidade (eleitor) e de reputação histórica (identidade).
- **Governabilidade**: ver `motor-eleitoral.md` seção 8.
- **Capital político** não é estado guardado. É calculado quando necessário:
  `capitalPolitico = f(relações, influência do grupo, credibilidade, reputação, base territorial)` (pesos a calibrar). Usado para definir convites e força em negociação.

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
- É capacidade de desenvolvimento, não teto de carreira. O alcance real depende do espaço político (partido, território, grupo, conjuntura).
- Efeitos (decisão D1): velocidade de aprendizado e de ganho de experiência; evolução das aptidões; recuperação e adaptação após derrotas e crises; disponibilidade de oportunidades de desenvolvimento e formação (cursos, mentorias, funções técnicas, relatorias de aprendizado).
- Proibido: o potencial não modifica urna, não aumenta quantidade ou qualidade de oportunidades eleitorais, candidaturas competitivas, alianças ou recursos de campanha.
- Mutável: feitos e fracassos extremos movem 1 a 5 pontos, com teto acumulado na carreira (calibrar, hipótese ±10).
- Descoberta: número nunca exibido. Após 2 a 3 eleições aparecem faixas qualitativas. Balanço a cada 4 anos compara a posição com a faixa inferida.

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
- Senado é escolha de identidade: 8 anos, estabilidade, menos exposição executiva, menos influência no dia a dia legislativo.

## 7. Caminho à Presidência

- Sem gate. A candidatura emerge de notoriedade nacional, indicação partidária, coligação competitiva, recursos, rejeição administrável, apoio territorial e relações.
- Trajetórias: carreira legislativa, executivo (prefeito, governador), articulador de bastidor (liderança, vice), fenômeno eleitoral, ascensão improvável.
- Pode chegar e perder. Meta (hipótese): Presidência em 1 a 3% das carreiras. Como o potencial não age na urna, a diferença entre faixas de potencial deve emergir só do desenvolvimento mais rápido; é medida na calibração, não imposta.
- Outros grandes finais: senador influente, governador popular, líder partidário.

## 8. Ambição, oportunidades e identidade

- Objetivos declarados e emergentes, mutáveis, nunca obrigatórios. Orientam eventos, janelas automáticas e o veredito final.
- Oportunidades têm prazo, dependem de talento, experiência, relações, notoriedade, histórico e posição. Podem ser aceitas, recusadas ou perdidas. Algumas nascem de decisões de anos antes.
- Capital político (oculto, derivado): ver seção 1. Define convites e negociações.
- Oportunidades eleitorais e de aliança dependem de posição, relações, grupo, base e conjuntura, nunca do potencial.
- Reputação histórica: articulador, gestor, populista, reformista, oportunista, conciliador. Tag que influencia relações.

## 9. Vice

- Convite chega como carta quando uma chapa majoritária precisa de companheiro.
- Ganhos: notoriedade nacional, rede do titular, experiência executiva, crédito na Cúpula.
- Custos: menos autonomia, popularidade avaliada junto com o titular, Bancada menos favorável.
- Risco: se o titular cai, o vice sucede com legitimidade reduzida (calibrar; regras a confirmar).
- Armadilha do vice: exposição sem descolamento. Cartas de posicionamento próprio custam Cúpula e liberam candidatura própria.
- Pool próprio de bastidor. Substituição (temporária) é diferente de sucessão (definitiva).

## 10. Poder entre eleições (MVP enxuto)

Áreas: partido por dentro, Legislativo, emendas, Executivo, federalismo, instituições externas, eleitorado, crises, conformidade eleitoral.

- Capital de Entrega é a moeda de governar e legislar: emendas, cargos, apoio a projetos.
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

Agregada por município, com até 10 municípios individualizados no MVP (decisão D12). O restante da UF fica num agregado regional único.

```
base[municipio] = { forca, custoManutencao, apoioLocal (prefeito e vereadores aliados, agregado) }
```

- Cresce com presença, entregas (Capital de Entrega dirigido) e aliados eleitos em 2028 e 2032.
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
| Municipal | secretário municipal (nos 10 municípios individualizados) |
| Estadual | secretário estadual |
| Federal | ministro, secretário executivo de ministério |
| Partidária | presidente de diretório municipal, estadual ou nacional |

- Não há simulação de todas as nomeações do país. Só existem as vagas que podem ser oferecidas ao personagem, criadas quando ele tem relação suficiente com o governo ou o partido.
- Oferta depende de: relação com Executivo (ou Cúpula, para cargo partidário), composição do governo (partido do personagem na coalizão), capital político derivado, compromissos firmados (tipo "cargo ou espaço") e conjuntura.
- Efeitos: gera Capital de Entrega e presença institucional para o grupo; dá experiência executiva; exige desincompatibilização para disputar eleição (prazos a confirmar).
- Saída: demissão por mudança de coalizão, crise ou queda de governabilidade; ou saída voluntária para disputar.
- Sem Ponto de Inflexão próprio além de "Ministério em crise", já previsto.

## 11. Fase sem cargo

Sabático, mídia, livro, aulas, curso, negócio. Cada opção troca recursos e indicadores (exemplo: livro sobe notoriedade e custa tempo; negócio sobe Caixa Pessoal e pode subir risco jurídico).

Fora do mandato eletivo o personagem mantém poder por quatro vias: cargo de nomeação ou direção partidária (10.4), liderança do grupo político, base territorial e compromissos a receber.

## 12. Avaliação final (decisão D4)

Grau qualitativo (faixas a definir, fórmula oculta) em cinco dimensões:

| Dimensão | Fontes no MVP |
|---|---|
| Alcance institucional | cargos e posições ocupadas, tempo em cada um |
| Influência política | pico e duração da influência do grupo, presença institucional, liderança |
| Realizações | entregas dos mandatos, propostas aprovadas |
| Reputação | credibilidade, reputação histórica, Arquivo Vermelho, escândalos |
| Legado | influência do grupo ao fim da carreira, base territorial remanescente, aliados em posição |

O cargo mais alto pesa, mas não é multiplicador dominante. Pesos a calibrar para que presidente isolado, senador articulador e governador bem avaliado possam ter graus comparáveis. A avaliação considera o contexto: oportunidades que a conjuntura ofereceu.

Linha de potencial estimado vs alcançado: abaixo, no teto, acima (tag Fenômeno). Sucessores individuais: Fase 2.
