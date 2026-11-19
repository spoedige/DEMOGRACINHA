"use strict";
// Etapa 7a: módulo 14 (desempate técnico), módulo 1 (orquestrador) e tools/sim.js (D73).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");
const sim = require("../../tools/sim.js");

const { RNG, Desempate, Eleicao, Cadeiras } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const cenario = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n + ".json"), "utf8"));
const ERRO = { name: "TypeError" };

// ---------- Módulo 14 ----------
test("desempate técnico, forma mínima: sorteio determinístico entre os ids em ordem", () => {
  const rng = RNG.criar("v1-DESEMPATE", "eleicao");
  const a = Desempate.resolver(["C", "A", "B"], {}, rng), b = Desempate.resolver(["B", "C", "A"], {}, rng);
  assert.deepEqual(plano(a), plano(b));
  const r = RNG.inteiro(rng, 3);
  assert.equal(a.vencedorId, ["A", "B", "C"][r.valor]);
  assert.deepEqual(plano(a.rngStateNext), plano(r.rngStateNext));
  const cont = { A: 0, B: 0 };
  let e = rng;
  for (let i = 0; i < 4000; i++) { const x = Desempate.resolver(["A", "B"], {}, e); cont[x.vencedorId]++; e = x.rngStateNext; }
  assert.ok(Math.abs(cont.A - 2000) < 150, JSON.stringify(cont));
  assert.throws(() => Desempate.resolver(["A"], {}, rng), ERRO);
  assert.throws(() => Desempate.resolver(["A", "A"], {}, rng), ERRO);
  assert.throws(() => Desempate.resolver(["A", "B"], {}, RNG.criar("v1-X", "mundo")), ERRO);
});

test("desempate técnico com atributos: votação técnica de 5.5; empate persistente vai ao sorteio", () => {
  const rng = RNG.criar("v1-DESEMPATE", "eleicao");
  // carisma 3 e 1 -> 0,75 e 0,25; financeiro 0 e 0 -> 0,5 cada. T_A = 0,625, T_B = 0,375 -> 625 e 375 de 1000.
  const r = Desempate.resolver(["A", "B"], { validos: 1000, atributos: { A: { carisma: 3, financeiro: 0 }, B: { carisma: 1, financeiro: 0 } } }, rng);
  assert.equal(r.vencedorId, "A");
  assert.deepEqual(plano(r.rngStateNext), plano(rng)); // decidido sem sorteio
  const t = Desempate.resolver(["A", "B"], { validos: 1000, atributos: { A: { carisma: 1, financeiro: 1 }, B: { carisma: 1, financeiro: 1 } } }, rng);
  assert.equal(t.vencedorId, Desempate.resolver(["A", "B"], {}, rng).vencedorId); // mesmo sorteio da forma mínima
  assert.throws(() => Desempate.resolver(["A", "B"], { validos: 10, atributos: { A: { carisma: 1, financeiro: 1 } } }, rng), /atributos ausentes/);
  assert.throws(() => Desempate.resolver(["A", "B"], { validos: 10, pesos: { carisma: 0.7, financeiro: 0.7 }, atributos: { A: { carisma: 1, financeiro: 1 }, B: { carisma: 1, financeiro: 1 } } }, rng), ERRO);
});

test("desempate técnico serve como resolvedor dos módulos 10 a 13", () => {
  const rng = RNG.criar("v1-RESOLVEDOR", "eleicao");
  const r = Cadeiras.distribuir({ opcoes: { resolverDesempateTecnico: Desempate.resolver } },
    { disputaId: "D", vagas: 1, listas: [{ id: "A", votosLegenda: 0, candidatos: [{ id: "A1", votos: 100, idade: 50 }, { id: "A2", votos: 100, idade: 50 }] }] }, rng);
  assert.equal(r.resultado.cadeiras.eleitos.length, 1);
  assert.notDeepEqual(plano(r.rngStateNext), plano(rng));
});

// ---------- Módulo 1 ----------
const executar = (cen, semente) => Eleicao.executar({ opcoes: sim.opcoesDoCenario(carregarMotor().Motor, cen) }, { ...cen, semente: semente || cen.semente },
  RNG.criar(semente || cen.semente, "eleicao", cen.eleicaoId, cen.disputa.id));

test("orquestrador proporcional: módulos 2 a 10 e posse; conservação de votos e vagas", () => {
  const cen = cenario("vereador");
  const r = plano(executar(cen).resultado);
  const c = r.etapas.comparecimento, a = r.etapas.apuracao;
  assert.equal(Object.values(a.votosLista).reduce((x, y) => x + y, 0), c.validos);
  assert.equal(r.eleitos.length + r.etapas.cadeiras.naoPreenchidas, cen.disputa.vagas);
  assert.equal(r.ocupantes.length, r.eleitos.length);
  assert.deepEqual(r.ocupantes.map((o) => o.inicio), r.eleitos.map(() => cen.posse.dataPosse));
  // federação como lista única; sintéticos limitados às vagas restantes da lista
  assert.deepEqual(r.etapas.cadastro.listas.map((l) => l.id), ["F1", "P1", "P2"]);
  assert.ok(Object.keys(a.votos).filter((id) => id.startsWith("sint:P1:")).length <= cen.limiteLista - 2);
});

test("orquestrador majoritário: 1º turno, decisão e 2º turno; Senado com duas vagas", () => {
  const p = plano(executar(cenario("prefeito")).resultado);
  if (p.etapas.primeiroTurno.segundoTurno) {
    assert.ok(p.etapas.segundoTurno);
    const ch = { CH1: "X1", CH2: "X2", CH3: "X3" };
    assert.ok(p.etapas.primeiroTurno.finalistas.map((f) => ch[f]).includes(p.eleitos[0]));
  }
  assert.equal(p.eleitos.length, 1);
  const s = plano(executar(cenario("senado")).resultado);
  assert.equal(new Set(s.eleitos).size, 2);
  assert.equal(s.etapas.primeiroTurno.validos, s.etapas.primeiroTurno.validos1 + s.etapas.primeiroTurno.validos2);
});

test("orquestrador: mesma semente, mesmo resultado; outra semente, outro resultado", () => {
  const cen = cenario("vereador");
  assert.deepEqual(plano(executar(cen)), plano(executar(cen)));
  assert.notDeepEqual(plano(executar(cen, "v1-OUTRA").resultado.etapas.apuracao.votos), plano(executar(cen).resultado.etapas.apuracao.votos));
});

test("orquestrador sem constante própria: parâmetro ou distribuição ausente é erro", () => {
  const cen = cenario("vereador");
  const semLambda = { ...cen, parametros: { ...cen.parametros, lambda: { P1: 0.3, P2: 0.3 } } };
  assert.throws(() => executar(semLambda), /lambda ausente/);
  const semIdade = { ...cen, parametros: { ...cen.parametros, idadeSinteticos: undefined } };
  assert.throws(() => executar(semIdade), /idadeSinteticos/);
  assert.throws(() => sim.opcoesDoCenario(carregarMotor().Motor, { distribuicoes: {} }), /distribuição ausente/);
  assert.throws(() => sim.sorteador(carregarMotor().Motor, { forma: "normal" }, "q"), /forma desconhecida/);
  assert.throws(() => executar({ ...cen, parametros: undefined }), /parametros obrigatórios/);
});

// ---------- tools/sim.js ----------
test("sim.js: execução única com hash reproduzível, pela linha de comando", () => {
  const rodarCli = (...a) => JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, "tools", "sim.js"), ...a], { encoding: "utf8" }));
  const arq = path.join(RAIZ, "tools", "cenarios", "vereador.json");
  const a = rodarCli("--cenario", arq), b = rodarCli("--cenario", arq);
  assert.equal(a.hash, b.hash);
  assert.match(a.hash, /^[0-9a-f]{64}$/);
  assert.notEqual(rodarCli("--cenario", arq, "--semente", "v1-OUTRA").hash, a.hash);
});

test("sim.js: lote com telemetria de casos-limite e hash reproduzível", () => {
  const cen = cenario("prefeito");
  const Motor = carregarMotor().Motor;
  const a = sim.lote(Motor, cen, "v1-LOTE", 30), b = sim.lote(Motor, cen, "v1-LOTE", 30);
  assert.equal(a.hash, b.hash);
  const t = a.telemetria;
  assert.equal(t.concluidas + Object.values(t.erros).reduce((x, y) => x + y, 0), 30);
  assert.ok(t.segundosTurnos <= t.concluidas);
  // cenário com mínimo alternativo e quadros baixos gera vagas não preenchidas contabilizadas
  const v = cenario("vereador");
  const alt = { ...v, parametros: { ...v.parametros, minimoNominalFase2: 0.1 } };
  assert.ok(typeof sim.lote(Motor, alt, "v1-LOTE", 5).telemetria.vagasNaoPreenchidas === "number");
});
