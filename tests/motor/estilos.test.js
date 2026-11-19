"use strict";
// Estilo de atuação (D89): etiqueta, ajustes leves, opção própria em eventos e troca em C1 do ano calmo.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Origens, Eventos, Mudancas } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8"));
const CEN = J("tools/cenarios/carreira.json"), EST = J("data/catalogo/estilos.json"), CAT = J("data/catalogo/catalogo-jogo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const est = (id) => EST.estilos.find((x) => x.id === id);
const novo = (id) => { const c = clone(CEN); delete c.eleicoes; if (id) Origens.aplicarEstilo(c.inicio, est(id)); return Carreira.criar({}, c, null).resultado; };
const dados = () => ({ eventos: clone(CAT.eventos), cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes, parametrosCartas: CAT.parametrosCartas,
  parametrosDegrau: CAT.parametrosDegrau, estilos: EST });

test("estilo no início: etiqueta única e ajustes leves dentro das escalas", () => {
  const e = novo("influencer"), base = novo();
  assert.deepEqual(plano(e.personagem.tags.filter((t) => t.startsWith("estilo:"))), ["estilo:influencer"]);
  assert.ok(Math.abs(e.personagem.aptidoes.comunicacao - base.personagem.aptidoes.comunicacao - 0.1) < 1e-9);
  const a = novo("articulador"); assert.ok(a.relacoes.cupula > base.relacoes.cupula);
  assert.doesNotThrow(() => Carreira.validar(a));
});

test("opção própria de estilo: aparece só com a etiqueta; contenção não pode exigir etiqueta", () => {
  const d = dados(), item = { id: "R", janelaAlvo: { ano: 2026, janela: "J1" }, dados: { eventoId: "video-repercute", origemCartaId: "x", prob: 1, condicao: null, nivelCorrupcao: null } };
  const com = novo("influencer"), sem = novo("tecnico"); com.filaEventos = [item]; sem.filaEventos = [clone(item)];
  const ops = (e) => Eventos.resolverJanela(e, d, { manual: true, previa: true, decisoes: {} }).pendentes[0].opcoes.map((o) => o.id);
  assert.ok(ops(com).includes("live-explicando")); assert.ok(!ops(sem).includes("live-explicando"));
  const ruim = dados(); ruim.eventos.find((x) => x.id === "video-repercute").opcoes[0].exigeTag = "estilo:tecnico";
  assert.throws(() => Eventos.validarCatalogo(ruim), ERRO);
});

test("troca de estilo: só em C1 do ano calmo, troca a etiqueta e custa credibilidade", () => {
  const troca = { trocaPartido: { cupulaEntrada: 0.2, perdaBancada: 0.05, perdaCredibilidadeJanela: 0.02, perdaCredibilidadeFora: 0.06, fatorParaquedista: 0.5,
    partidos: ["P1", "P2"], municipios: [{ id: "EX001", uf: "EX" }] }, estilos: EST };
  const e = novo("tecnico"); e.tempo = { ano: 2027, janela: "C1" };
  assert.ok(!Mudancas.opcoes(e, troca).estilos.includes("tecnico"));
  const oc = [], x = clone(e); Mudancas.aplicar(x, troca, true, { estilo: "combativo" }, oc);
  assert.deepEqual(plano(x.personagem.tags.filter((t) => t.startsWith("estilo:"))), ["estilo:combativo"]);
  assert.ok(Math.abs(x.relacoes.credibilidade - (e.relacoes.credibilidade - EST.perdaCredibilidadeTroca)) < 1e-9);
  const j = clone(e); j.tempo = { ano: 2028, janela: "J1" };
  assert.throws(() => Mudancas.aplicar(j, troca, true, { estilo: "combativo" }, []), ERRO);
});
