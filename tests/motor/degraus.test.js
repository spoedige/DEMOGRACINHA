"use strict";
// Catálogo em escada (Lote 1): validação do catálogo do jogo por degrau e regra de peso por degrau.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Cartas, Eventos, Nomeacoes, Degraus } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const CAT = path.join(RAIZ, "data", "catalogo");
const CEN = JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", "carreira.json"), "utf8"));
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const lotes = fs.readdirSync(CAT).filter((f) => /^degrau-\d\.json$/.test(f)).sort();
const ler = (f) => JSON.parse(fs.readFileSync(path.join(CAT, f), "utf8"));
const COMUNS = ler("eventos-comuns.json").eventos, CARTAS_COMUNS = ler("eventos-comuns.json").cartas;                                // escada jurídica comum a todos os degraus
const dadosDe = (l) => ({ cartas: l.cartas.concat(CARTAS_COMUNS), eventos: l.eventos.concat(COMUNS), posicoes: l.posicoes, ambicoes: ["legislativo", "executivo", "bastidor"],
  parametrosCartas: { acoesPorMao: 2 }, parametrosDegrau: l.parametrosDegrau, governos: {} });
const novo = () => { const c = clone(CEN); delete c.eleicoes; return Carreira.criar({}, c, null).resultado; };
const TRAVESSAO = /[–—]/;

test("lotes do catálogo: válidos pelo motor, com degrau do arquivo e sem travessão", () => {
  assert.ok(lotes.length >= 1);
  for (const f of lotes) {
    const n = Number(f.match(/\d/)[0]), l = ler(f), d = dadosDe(l);
    assert.doesNotThrow(() => Cartas.validarCatalogo(d), f);
    assert.doesNotThrow(() => Eventos.validarCatalogo(d), f);
    assert.doesNotThrow(() => Nomeacoes.validarCatalogo(d), f);
    for (const x of [...l.cartas, ...l.eventos, ...l.posicoes].filter((y) => !COMUNS.includes(y) && !CARTAS_COMUNS.includes(y))) assert.equal(x.degrau, n, f + ": " + x.id);
    assert.ok(l.cartas.some((c) => c.segura), f + ": carta segura");
    assert.ok(!TRAVESSAO.test(JSON.stringify(l)), f + ": travessão");
  }
  assert.ok(COMUNS.every((x) => x.degrau === undefined), "eventos comuns sem degrau");
  assert.ok(!TRAVESSAO.test(JSON.stringify(COMUNS)));
});

test("degrau atual: maior escopo exercido, degrau da posição e notoriedade", () => {
  const l = ler("degrau-1.json"), d = dadosDe(l), e = novo();
  assert.equal(Degraus.atual(e, d), 1);
  const ver = clone(e); ver.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }];
  assert.equal(Degraus.atual(ver, d), 2);
  const eleito = clone(ver); eleito.cargos.mandatos[0].situacao = "eleito"; assert.equal(Degraus.atual(eleito, d), 1); // sem posse, sem degrau
  const ass = clone(e); ass.cargos.nomeacoes = [{ id: "x", posicaoId: "assessor-camara-municipal", tipo: "governamental", escopo: "municipal", inicio: { ano: 2027, janela: "C1" }, fim: null, situacao: "exercicio", motivoSaida: null, licencaMandato: null }];
  assert.equal(Degraus.atual(ass, d), 1);                                                       // posição de degrau 1
  const fama = clone(e); fama.indicadores.estadual = { notoriedade: 0.3, popularidade: 0.1, rejeicao: 0.05 }; assert.equal(Degraus.atual(fama, d), 3);
});

test("peso por degrau: até o atual + 1 cheio, + 2 com fator de salto, acima fora; sem degrau, 1", () => {
  const d = dadosDe(ler("degrau-1.json")), e = novo();
  assert.equal(Degraus.fator(e, d, { degrau: 2 }), 1);
  assert.equal(Degraus.fator(e, d, { degrau: 3 }), d.parametrosDegrau.fatorSalto);
  assert.equal(Degraus.fator(e, d, { degrau: 4 }), 0);
  assert.equal(Degraus.fator(e, d, {}), 1);
  assert.throws(() => Degraus.fator(e, {}, { degrau: 2 }), ERRO);                                // parâmetros obrigatórios
  const ruim = clone(d); ruim.cartas[1].degrau = 6; assert.throws(() => Cartas.validarCatalogo(ruim), ERRO);
  // carta fora do alcance não entra na mão
  const alto = clone(d); alto.cartas.forEach((c) => { if (!c.segura) c.degrau = 4; });
  const m = Cartas.montarMao(e, alto, e.rng.cartas).resultado;
  assert.deepEqual(plano(m.acoes), []);
});

test("catálogo consolidado: em dia com os lotes, válido pelo motor e com segura em todo degrau", () => {
  const { consolidar, SAIDA } = require("../../tools/catalogo.js");
  assert.equal(fs.readFileSync(SAIDA, "utf8"), consolidar(), "rode node tools/catalogo.js");
  const c = JSON.parse(consolidar()), d = Object.assign({ governos: {} }, c);
  assert.doesNotThrow(() => Cartas.validarCatalogo(d));
  assert.doesNotThrow(() => Eventos.validarCatalogo(d));
  assert.doesNotThrow(() => Nomeacoes.validarCatalogo(d));
  for (let n = 1; n <= 5; n++) assert.ok(c.cartas.some((x) => x.degrau === n && x.segura && !x.pool), "segura sem pool no degrau " + n);
  // a mão monta em qualquer degrau, só com cartas até o atual + 2
  const e = novo(); e.tempo = { ano: 2027, janela: "C1" };
  const m = Cartas.montarMao(e, d, e.rng.cartas).resultado;
  assert.ok(m.segura);
  for (const id of m.acoes) assert.ok(c.cartas.find((x) => x.id === id).degrau <= 3);
});
