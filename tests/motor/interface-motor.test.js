"use strict";
// Ajustes do motor para a interface (D79): compromissos na prévia, ritmo, nome, votos no histórico, distribuições.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const Motor = carregarMotor().Motor;
const { Carreira, Distribuicoes, RNG } = Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), CAT = ler("cartas-exemplo.json"), CAND = ler("candidatura-exemplo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const novo = (mod) => { const c = clone(CEN); delete c.eleicoes; if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const dados = () => Object.assign(clone(CAND), { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas) });
const opcoes = { opcoesEleicao: (c) => Distribuicoes.opcoesDoCenario(c) };
const k = (id, recurso, q, prazo) => ({ id, tipo: "votoEmProposta", ator: "P2", objeto: "votar a proposta", prazo: prazo || { ano: 2026, janela: "J1" },
  custo: { recurso, quantidade: q }, contrapartida: "x", seCumprir: "x", seRomper: "x", custoPoliticoDeRomper: 1, estado: "ativo", efeitosCumprir: [], efeitosRomper: [] });

test("prévia, fase zero: compromissos que vencem na janela manual, com podeCumprir; fases seguintes nulas até decidir", () => {
  const e = novo(); e.bolsos.capitalEntrega = 2;
  e.compromissos.ativos = [k("K2", "capitalEntrega", 3), k("K1", "cupula", 0.1), k("K3", "bancada", 0.1, { ano: 2027, janela: "C1" })];
  const p = Carreira.previa(e, dados(), { decisoes: {} });
  assert.deepEqual(plano(p.compromissos.map((c) => [c.id, c.podeCumprir])), [["K1", true], ["K2", false]]);
  assert.equal(p.eventos, null); assert.equal(p.candidaturas, null); assert.equal(p.mao, null);
  assert.equal(Carreira.previa(e, dados(), { decisoes: { compromissos: { K1: "cumprir" } } }).mao, null);
  const ok = Carreira.previa(e, dados(), { decisoes: { compromissos: { K1: "cumprir", K2: "romper" } } });
  assert.deepEqual(plano(ok.compromissos), []); assert.ok(ok.mao.segura);
  const auto = clone(e); auto.tempo = { ano: 2026, janela: "J2" }; auto.compromissos.ativos = [k("K9", "cupula", 0.1, { ano: 2026, janela: "J2" })];
  assert.deepEqual(plano(Carreira.compromissosDaJanela(auto)), []);                       // J2 automática no Express
});

test("mudarRitmo: função pura validada; personagem.nome opcional", () => {
  const e = novo();
  const r = Carreira.mudarRitmo(e, "intenso");
  assert.equal(r.ritmo, "intenso"); assert.equal(e.ritmo, "express");
  assert.throws(() => Carreira.mudarRitmo(e, "turbo"), ERRO);
  assert.equal(novo((c) => { c.inicio.personagem.nome = "Fulana"; }).personagem.nome, "Fulana");
  assert.throws(() => novo((c) => { c.inicio.personagem.nome = "  "; }), ERRO);
  assert.equal(novo().personagem.nome, undefined);
});

test("histórico da eleição: votos, válidos e posição do personagem", () => {
  let e = novo(); e.tempo = { ano: 2028, janela: "J3" };
  e = Carreira.avancar(e, CAND, { decisoes: { candidatura: "vaga-na-lista:2028|VEREADOR|EX001|1" }, opcoes }).resultado.estado;
  while (e.tempo.janela !== "J6") e = Carreira.avancar(e, CAND, { decisoes: Carreira.ehManual(e) ? {} : undefined, opcoes }).resultado.estado;
  const h = e.historico.find((x) => x.tipo === "eleicao");
  assert.equal(h.cargo, "VEREADOR"); assert.ok(Number.isInteger(h.votos) && h.votos > 0);
  assert.ok(h.validos >= h.votos); assert.ok(Number.isInteger(h.posicao) && h.posicao >= 1); assert.equal(h.segundoTurno, null);
  let m = novo((c) => { c.inicio.indicadores.local = { notoriedade: 0.6, popularidade: 0.3, rejeicao: 0.05 }; }); m.tempo = { ano: 2028, janela: "J3" };
  m = Carreira.avancar(m, CAND, { decisoes: { candidatura: "indicacao-prefeitura:2028|PREFEITO|EX001|1" }, opcoes }).resultado.estado;
  while (!(m.tempo.ano === 2029)) m = Carreira.avancar(m, CAND, { decisoes: Carreira.ehManual(m) ? {} : undefined, opcoes }).resultado.estado;
  const hm = m.historico.find((x) => x.tipo === "eleicao");
  assert.ok(Number.isInteger(hm.votos)); assert.ok(hm.posicao >= 1 && hm.posicao <= 3);
  if (hm.segundoTurno) assert.ok(hm.segundoTurno.votos <= hm.segundoTurno.validos);
});

test("Distribuicoes no motor: mesmas formas e mensagens; sim.js delega", () => {
  const u = Distribuicoes.sorteador({ forma: "uniforme", min: 1, max: 3 }, "q"), r = RNG.criar("v1-D", "eleicao");
  const x = u(r), d = RNG.decimal(r);
  assert.equal(x.valor, 1 + 2 * d.valor);
  assert.throws(() => Distribuicoes.sorteador({ forma: "normal" }, "q"), /forma desconhecida/);
  assert.throws(() => Distribuicoes.opcoesDoCenario({}), /distribuição ausente/);
  const sim = require("../../tools/sim.js");
  assert.equal(sim.sorteador(Motor, { forma: "exponencialTruncada", media: 2, max: 5 }, "r")(r).valor,
    Distribuicoes.sorteador({ forma: "exponencialTruncada", media: 2, max: 5 }, "r")(r).valor);
});
