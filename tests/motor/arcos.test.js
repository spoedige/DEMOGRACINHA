"use strict";
// Personagens recorrentes, relações internas e arcos narrativos (D91, etapa 2).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor } = require("./carregar");

const { Carreira, Eventos, Save } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8"));
const CAT = J("data/catalogo/catalogo-jogo.json"), CEN = J("tools/cenarios/carreira.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = () => ({ eventos: clone(CAT.eventos), cartas: clone(CAT.cartas), personagens: CAT.personagens, parametrosDegrau: CAT.parametrosDegrau, posicoes: CAT.posicoes });
const novo = () => { const c = clone(CEN); delete c.eleicoes; return Carreira.criar({}, c, null).resultado; };
const agendar = (e, eventoId) => e.filaEventos.push({ id: "T:" + eventoId, janelaAlvo: clone(e.tempo), dados: { eventoId, prob: 1, condicao: null } });
const resolver = (e, escolhas) => Eventos.resolverJanela(e, dados(), { manual: true, decisoes: { eventos: escolhas || {} } });

test("cinco personagens fictícios e seis arcos com começo alcançável e sem travessão", () => {
  assert.deepEqual(CAT.personagens.map((p) => p.id).sort(), ["articulador", "jornalista", "lideranca", "padrinho", "rival"]);
  const arcos = new Map();
  CAT.eventos.filter((e) => e.arco).forEach((e) => { if (!arcos.has(e.arco.id)) arcos.set(e.arco.id, []); arcos.get(e.arco.id).push(e); });
  assert.equal(arcos.size, 6);
  const alvos = new Set(CAT.cartas.map((c) => c.atraso && c.atraso.eventoId));
  CAT.eventos.forEach((e) => e.opcoes.forEach((o) => [].concat(o.agendar || []).forEach((a) => alvos.add(a.eventoId))));
  for (const [id, evs] of arcos) {
    const ini = evs.filter((e) => e.arco.passo === 1);
    assert.ok(ini.length >= 1, id + ": passo 1");
    ini.forEach((e) => assert.ok(e.tipo === "gatilho" || alvos.has(e.id), id + ": começo sem entrada " + e.id));
    evs.filter((e) => e.arco.passo > 1).forEach((e) => assert.ok(alvos.has(e.id), id + ": passo sem continuidade " + e.id));
    const passos = new Set(evs.map((e) => e.arco.passo));
    assert.ok(passos.size >= 2 && passos.size <= 4, id + ": de 2 a 4 acontecimentos");
  }
  assert.ok(!/[–—]/.test(JSON.stringify(CAT.personagens) + JSON.stringify([...arcos.values()])));
  assert.ok(!CAT.eventos.some((e) => e.opcoes.length === 1 && /^Registrar/.test(e.opcoes[0].texto)), "nenhum evento só com Registrar");
});

test("save 7: relações começam neutras, migração 6 para 7 e validação do limite", () => {
  const e = novo();
  assert.equal(e.saveVersion, 7); assert.equal(JSON.stringify(e.relacoesPessoais), "{}");
  const v6 = clone(e); v6.saveVersion = 6; delete v6.relacoesPessoais;
  const m = Save.ler(JSON.stringify(v6));
  assert.equal(m.saveVersion, 7); assert.equal(JSON.stringify(m.relacoesPessoais), "{}");
  const ruim = clone(e); ruim.relacoesPessoais = { lideranca: { confianca: 3 } };
  assert.throws(() => Save.ler(JSON.stringify(ruim)));
});

test("promessa no bairro: a escolha muda a relação, marca a promessa e agenda a cobrança; o personagem lembra", () => {
  let e = novo(); agendar(e, "cobranca-associacao");
  const r = resolver(e, { "T:cobranca-associacao": "prometer-prazo" });
  e = r.estado;
  assert.equal(e.relacoesPessoais.lideranca.confianca, 1);
  assert.ok(e.personagem.tags.includes("arco:promessa"));
  assert.ok(e.filaEventos.some((x) => x.dados.eventoId === "promessa-cobrada"));
  // cobrança e desfecho: com confiança 2 a liderança reconhece; o rompimento fica bloqueado pela condição
  e.filaEventos = []; agendar(e, "promessa-cobrada");
  e = resolver(e, { "T:promessa-cobrada": "prestar-contas" }).estado;
  assert.equal(e.relacoesPessoais.lideranca.confianca, 2);
  e.filaEventos = []; agendar(e, "lideranca-reconhece"); agendar(e, "lideranca-rompe");
  const fim = resolver(e, {});
  assert.equal(fim.ocorrencias.filter((o) => o.tipo === "evento").map((o) => o.eventoId).join(), "lideranca-reconhece");
});

test("relação limitada a -2..2 e condição de pessoa: o padrinho só vira adversário depois de romper", () => {
  let e = novo(); e.personagem.tags.push("arco:afilhado");
  agendar(e, "padrinho-vira-adversario");
  assert.equal(resolver(e, {}).ocorrencias.filter((o) => o.tipo === "evento").length, 0);   // confiança neutra
  e.filaEventos = [];
  e.relacoesPessoais.padrinho = { confianca: -1 };
  agendar(e, "padrinho-cobra");
  e = resolver(e, { "T:padrinho-cobra": "recusar-a-troca" }).estado;
  assert.equal(e.relacoesPessoais.padrinho.confianca, -2);                                  // -1 - 2, limitado
  assert.ok(e.filaEventos.some((x) => x.dados.eventoId === "padrinho-vira-adversario"));
});

test("primeira derrota: dispara depois de eleição perdida, uma vez só; peso do mandato com cargo eletivo", () => {
  let e = novo();
  const lista = (r) => r.ocorrencias.filter((o) => o.tipo === "evento").map((o) => o.eventoId);
  assert.ok(!lista(resolver(e)).includes("primeira-derrota"));
  e.historico.push({ ano: 2026, janela: "J5", tipo: "eleicao", disputaId: "D", cargo: "DEPUTADO_ESTADUAL", eleitos: [], personagemEleito: false, votos: 900 });
  const r = resolver(e, { ["primeira-derrota:" + e.tempo.ano + e.tempo.janela]: "avaliar-erros" });
  assert.ok(lista(r).includes("primeira-derrota"));
  e = r.estado; e.tempo = Carreira.deslocar(e.tempo, 1);
  assert.ok(!lista(resolver(e)).includes("primeira-derrota"));
  const v = novo(); v.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio", papel: "titular" }];
  assert.ok(lista(resolver(v, { ["peso-do-mandato:" + v.tempo.ano + v.tempo.janela]: "explicar-limites" })).includes("peso-do-mandato"));
});

test("evento com personagem desconhecido ou delta de relação fora do limite é recusado", () => {
  const d = dados(); d.eventos.find((x) => x.id === "rival-questiona").pessoa = "fulano";
  assert.throws(() => Eventos.validarCatalogo(d));
  const d2 = dados(); d2.eventos.find((x) => x.id === "rival-questiona").opcoes[1].relacoes = [{ pessoa: "rival", delta: 3 }];
  assert.throws(() => Eventos.validarCatalogo(d2));
});
