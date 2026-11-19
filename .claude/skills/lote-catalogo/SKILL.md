---
name: lote-catalogo
description: Redigir ou revisar um lote do catálogo em escada do DEMOGRACINHA (cartas, eventos e posições de um degrau). Use ao criar data/catalogo/degrau-N.json.
---

# Lote do catálogo em escada (D85)

Um arquivo por degrau: `data/catalogo/degrau-N.json`, com `_cenario`, `_parametros`, `parametrosDegrau`, `cartas`, `eventos`, `posicoes`. Todo item leva `"degrau": N`. Volume por lote: ~6 cartas (ao menos 1 segura), ~4 eventos, ~3 posições.

## Degraus

| N | Escopo | Posições típicas |
|---|---|---|
| 1 | Base local | assessoria parlamentar, diretório municipal, conselho municipal |
| 2 | Município | secretarias municipais, presidência da Câmara |
| 3 | Estado | secretarias estaduais, diretório estadual, autarquias estaduais |
| 4 | Federal técnico | secretarias executivas, autarquias e estatais (Embratur, BNDES) |
| 5 | Federal político | ministérios, liderança de governo, executiva nacional |

Peso: até atual + 1 cheio; atual + 2 com `fatorSalto`; acima, fora.

## Esquemas

- Carta: `id, degrau, titulo, texto, segura, ambicoes (segura), pool { peso, cargos?, nomeacao?, janelas? }, custo { recurso, quantidade } | { compromisso }, aptidao, sucesso { base, pesoCapacidade }, efeitos, efeitosFalha, risco { probBase, pesoCapacidade, efeitos }, atraso { eventoId, emJanelas, prob, condicao }`. Efeitos (com risco) em no máximo 2 estoques ou 1 relação.
- Evento: `id, degrau, familia, titulo, texto, tipo (atrasado | gatilho), condicao?, limiar { alvo, op, valor, escala } e probBase (só gatilho), bloqueioJanelas?, opcoes [1 a 4] { id, texto, contencao?, efeitos, juridico?, estadoTemporario?, agendar?, encerrarNomeacao?, sucederTitular?, substituirTitular? }`. Mais de uma opção exige exatamente uma de contenção; no máximo 3 variáveis no evento.
- Posição: `id, degrau, titulo, orgao, tipo (governamental | partidaria), escopo (municipal | estadual | federal), condicao, exigeGovernoAliado, capitalEntregaPorJanela (0 em partidária), experienciaPorJanela, notoriedadePorJanela, risco`.
- `atraso.eventoId` e `agendar.eventoId` precisam existir no mesmo lote.

## Regras

Instituições reais pelo nome; pessoas e situações fictícias; nenhum número oficial inventado; magnitudes "(calibrar)"; sem travessão. Validar com `node --test tests/motor/degraus.test.js`. Relatório de até 10 linhas.
