"use strict";
// Módulo 10: distribuição proporcional de cadeiras (motor-eleitoral.md 5.4). Cenários artificiais com resultado
// calculado à mão; o cálculo esperado está comentado em cada teste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Cadeiras } = carregarMotor().Motor;

const L = (id, legenda, candidatos) => ({ id, votosLegenda: legenda, candidatos: candidatos.map(([cid, votos, idade]) => ({ id: cid, votos, idade: idade === undefined ? 40 : idade })) });
function rodar(vagas, listas, opcoes, rng) {
  const r = Cadeiras.distribuir({ opcoes: opcoes || {} }, { disputaId: "D", vagas, listas }, rng === undefined ? null : rng);
  return { c: plano(r.resultado.cadeiras), a: plano(r.resultado.auditoria), rngStateNext: r.rngStateNext, bruto: r };
}

test("quociente eleitoral: fração até meio desprezada, acima de meio arredonda (art. 106)", () => {
  assert.equal(Cadeiras.quocienteEleitoral(1003, 2), 501); // 501,5
  assert.equal(Cadeiras.quocienteEleitoral(1005, 2), 502); // 502,5
  assert.equal(Cadeiras.quocienteEleitoral(1001, 2), 500); // 500,5
  assert.equal(Cadeiras.quocienteEleitoral(1007, 4), 252); // 251,75
  assert.equal(Cadeiras.quocienteEleitoral(10, 4), 2);     // 2,5
  assert.equal(Cadeiras.quocienteEleitoral(11, 4), 3);     // 2,75
  assert.equal(Cadeiras.quocienteEleitoral(1000, 5), 200);
});

test("caso base: QP, 10% e 1ª fase das sobras", () => {
  // V = 1000, vagas 5, QE 200. QP: A 2 (550), B 1 (350), C 0 (100). Eleitos pelo QP: A1, A2, B1.
  // Sobras, 1ª fase (lista >= 160, candidato >= 40): A 550/3 = 183,3 > B 350/2 = 175 -> A3; depois A sem candidato, B -> B2.
  const { c, a } = rodar(5, [L("A", 0, [["A1", 300], ["A2", 200], ["A3", 50]]), L("B", 0, [["B1", 250], ["B2", 100]]), L("C", 0, [["C1", 80], ["C2", 20]])]);
  assert.equal(a.quocienteEleitoral, 200);
  assert.deepEqual(c.eleitos, ["A1", "A2", "B1", "A3", "B2"]);
  assert.deepEqual(c.cadeiras, { A: 3, B: 2 });
  assert.equal(c.naoPreenchidas, 0);
  assert.deepEqual(c.suplentes, { A: [], B: [] }); // C não obteve vaga: sem suplência (Res. 23.677, art. 14)
  assert.deepEqual(a.sobras.map((s) => s.fase), [1, 1]);
});

test("candidato abaixo de 20% não disputa a 1ª fase; lista abaixo de 80% também não", () => {
  // A3 = 30. V = 980, QE 196. QP A 2, B 1. 1ª fase: A3 30 < 39,2; C 100 < 156,8; só B -> B2.
  // Depois nenhuma lista na 1ª fase: 2ª fase (mínimo 0): A 530/3 = 176,7 > C 100/1 -> A3.
  const { c, a } = rodar(5, [L("A", 0, [["A1", 300], ["A2", 200], ["A3", 30]]), L("B", 0, [["B1", 250], ["B2", 100]]), L("C", 0, [["C1", 80], ["C2", 20]])]);
  assert.equal(a.quocienteEleitoral, 196);
  assert.deepEqual(c.eleitos, ["A1", "A2", "B1", "B2", "A3"]);
  assert.deepEqual(a.sobras.map((s) => [s.fase, s.candidato]), [[1, "B2"], [2, "A3"]]);
});

test("vaga do QP sem candidato com 10% conta no denominador da média (Res. 23.677, art. 11, §§ 1º e 5º)", () => {
  // V = 1800, vagas 6, QE 300. QP X 3 (915), Y 2 (885). X sem candidato com 30 votos: as 3 vagas do QP vão às sobras.
  // 2ª fase (ninguém com 60 votos restante): X 915/4 = 228,75 < Y 885/3 = 295 -> Y2. Com denominador só das
  // preenchidas, X teria 915/1 e venceria. Depois X 228,75 > Y 221,25 -> X1; Y 221,25 > X 183 -> Y3; Y sem candidato -> X2.
  const listas = [L("X", 900, [["X1", 10], ["X2", 5]]), L("Y", 0, [["Y1", 800], ["Y4", 50], ["Y2", 20], ["Y3", 15]])];
  const { c, a } = rodar(6, listas);
  assert.deepEqual(c.eleitos, ["Y1", "Y4", "Y2", "X1", "Y3", "X2"]);
  assert.deepEqual(c.cadeiras, { X: 2, Y: 4 });
  assert.deepEqual(a.sobras.map((s) => s.media), [[885, 3], [915, 4], [885, 4], [915, 5]]);
  // com o mínimo alternativo (10% do QE = 30), nenhum candidato restante é elegível: 4 vagas não preenchidas
  const alt = rodar(6, listas, { minimoNominalFase2: 0.1 });
  assert.deepEqual(alt.c.eleitos, ["Y1", "Y4"]);
  assert.equal(alt.c.naoPreenchidas, 4);
  assert.deepEqual(alt.c.cadeiras, { Y: 2 });
});

test("lista sem candidato restante sai da disputa da vaga", () => {
  // V = 900, vagas 3, QE 300. QP A 2, B 1. A elege só A1 (sem segundo candidato); B elege B1.
  // Sobra: A teria a maior média (600/3 = 200), mas não tem candidato; B 300/2 -> B2.
  const { c, a } = rodar(3, [L("A", 0, [["A1", 600]]), L("B", 0, [["B1", 150], ["B2", 100], ["B3", 50]])]);
  assert.deepEqual(c.eleitos, ["A1", "B1", "B2"]);
  assert.equal(c.naoPreenchidas, 0);
  assert.deepEqual(c.suplentes, { A: [], B: ["B3"] });
  assert.equal(a.listas.find((l) => l.id === "A").vagasObtidasDenominador, 2);
});

test("na 2ª fase, lista sem candidato restante também sai da disputa", () => {
  // V = 780, vagas 3, QE 260. QP A 2 (600), B 0 (180). A elege só A1. 1ª fase: A sem candidato; B 180 < 208.
  // 2ª fase: A teria 600/3 = 200, mas sai; B 180/1 -> B1; B 180/2 -> B2. Nenhuma vaga fica sem ocupante.
  const { c } = rodar(3, [L("A", 0, [["A1", 600]]), L("B", 0, [["B1", 150], ["B2", 20], ["B3", 10]])]);
  assert.deepEqual(c.eleitos, ["A1", "B1", "B2"]);
  assert.equal(c.naoPreenchidas, 0);
  assert.deepEqual(c.suplentes, { A: [], B: ["B3"] });
});

test("nenhuma lista alcança o QE (art. 12-A): Fase I com 80% e 20%; Fase II sem votação mínima", () => {
  // V = 600, vagas 2, QE 300; nenhuma lista com 300. Fase I (lista >= 240, candidato >= 60): só A -> A1.
  // Fase II: A 250/2 = 125, B 200/1 = 200, C 150 -> B1, mesmo com 20 votos (abaixo de 10% do QE).
  const listas = [L("A", 0, [["A1", 200], ["A2", 50]]), L("B", 180, [["B1", 20]]), L("C", 0, [["C1", 150]])];
  for (const minimoNominalFase2 of [0, 0.1]) {
    const { c, a } = rodar(2, listas, { minimoNominalFase2 });
    assert.equal(a.cenarioSemQuociente, true);
    assert.deepEqual(c.eleitos, ["A1", "B1"]);
    assert.deepEqual(a.sobras.map((s) => s.fase), [1, 2]);
  }
});

test("mínimo alternativo da 2ª fase gera vaga não preenchida; padrão preenche", () => {
  // V = 900, vagas 3, QE 300. QP A 1, B 1. Sobra sem 1ª fase (A2 e B2 com 5 votos < 60).
  // Padrão (0): A 505/2 = 252,5 > B 197,5 -> A2. Alternativo (30 votos): ninguém -> 1 não preenchida.
  const listas = [L("A", 0, [["A1", 500], ["A2", 5]]), L("B", 0, [["B1", 390], ["B2", 5]])];
  const pad = rodar(3, listas);
  assert.deepEqual(pad.c.eleitos, ["A1", "B1", "A2"]);
  assert.equal(pad.c.naoPreenchidas, 0);
  const alt = rodar(3, listas, { minimoNominalFase2: 0.1 });
  assert.deepEqual(alt.c.eleitos, ["A1", "B1"]);
  assert.equal(alt.c.naoPreenchidas, 1);
  assert.deepEqual(alt.c.suplentes, { A: ["A2"], B: ["B2"] });
});

test("empate de médias: votação da lista, depois votação nominal e idade do candidato que disputa a vaga", () => {
  // V = 1200, vagas 3, QE 400. QP B 1 (B1). 2ª fase: A 300/1 = B 600/2 = 300; B tem mais votos na lista -> B2; depois A1.
  const r1 = rodar(3, [L("B", 10, [["B1", 520], ["B2", 70]]), L("A", 0, [["A1", 300]]), L("C", 0, [["C1", 150]]), L("D", 0, [["D1", 150]])]);
  assert.deepEqual(r1.c.eleitos, ["B1", "B2", "A1"]);
  // V = 600, vagas 1, QE 600, sem quociente. A 300 = B 300 e listas iguais; B1 250 > A1 200 -> B1.
  assert.deepEqual(rodar(1, [L("A", 100, [["A1", 200]]), L("B", 50, [["B1", 250]])]).c.eleitos, ["B1"]);
  // votos iguais do candidato; B1 mais velho -> B1.
  assert.deepEqual(rodar(1, [L("A", 50, [["A1", 250, 40]]), L("B", 50, [["B1", 250, 50]])]).c.eleitos, ["B1"]);
});

test("empate de médias residual vai ao desempate técnico injetado, com os candidatos que disputam a vaga", () => {
  const listas = [L("A", 50, [["A1", 250, 50]]), L("B", 50, [["B1", 250, 50]])];
  const chamadas = [];
  const rng = RNG.criar("v1-DESEMPATE", "eleicao", "D");
  const resolver = (empatados, contexto, rngState) => {
    chamadas.push(plano({ empatados, contexto }));
    return { vencedorId: "A1", rngStateNext: RNG.u32(rngState).rngStateNext };
  };
  const r = rodar(1, listas, { resolverDesempateTecnico: resolver }, rng);
  assert.deepEqual(r.c.eleitos, ["A1"]);
  assert.equal(chamadas.length, 1);
  assert.deepEqual(chamadas[0].empatados, ["A1", "B1"]);
  assert.equal(chamadas[0].contexto.tipo, "mediasListas");
  assert.deepEqual(chamadas[0].contexto.listas, ["A", "B"]);
  assert.deepEqual(r.c.desempates, [{ tipo: "mediasListas", empatados: ["A1", "B1"], vencedorId: "A1" }]);
  assert.deepEqual(plano(r.rngStateNext), plano(RNG.u32(rng).rngStateNext)); // estado do RNG repassado pelo resolvedor
  assert.throws(() => rodar(1, listas), /desempate técnico necessário/);
  assert.throws(() => rodar(1, listas, { resolverDesempateTecnico: () => ({ vencedorId: "X9" }) }), /fora dos empatados/);
});

test("ordem única da lista: votos, idade e desempate técnico; mesma ordem para eleitos e suplentes", () => {
  // V = 200, vagas 1, QE 200, QP A 1. Votos iguais: A2 mais velho é eleito, A1 é suplente.
  const r = rodar(1, [L("A", 0, [["A1", 100, 30], ["A2", 100, 50]])]);
  assert.deepEqual(r.c.eleitos, ["A2"]);
  assert.deepEqual(r.c.suplentes, { A: ["A1"] });
  // votos e idade iguais: resolvedor decide a ordem
  const ch = [];
  const r2 = rodar(1, [L("A", 0, [["A1", 100, 50], ["A2", 100, 50]])],
    { resolverDesempateTecnico: (e, ctx) => { ch.push(plano([e, ctx.tipo, ctx.listaId])); return { vencedorId: "A2" }; } });
  assert.deepEqual(r2.c.eleitos, ["A2"]);
  assert.deepEqual(r2.c.suplentes, { A: ["A1"] });
  assert.deepEqual(ch, [[["A1", "A2"], "candidatosLista", "A"]]);
});

test("suplentes: todos os não eleitos da lista com vaga, sem votação mínima, inclusive com zero votos", () => {
  const r = rodar(1, [L("A", 0, [["A1", 100], ["A2", 0, 30], ["A3", 0, 40]]), L("B", 0, [["B1", 20]])]);
  assert.deepEqual(r.c.eleitos, ["A1"]);
  assert.deepEqual(r.c.suplentes, { A: ["A3", "A2"] }); // B sem vaga: sem suplência
});

test("propriedades em cenários gerados: conservação de vagas, unicidade, determinismo", () => {
  let e = RNG.criar("v1-PROPRIEDADES-CADEIRAS", "mundo");
  const s = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  const resolver = (empatados) => ({ vencedorId: empatados[0] });
  let excesso = 0, casos = 0;
  for (let k = 0; k < 400; k++) {
    const vagas = 1 + s(30);
    const listas = [];
    let totalCand = 0;
    for (let i = 0, n = 1 + s(8); i < n; i++) {
      const cs = [];
      for (let j = 0, m = s(12); j < m; j++) cs.push(["L" + i + "C" + j, s(4) === 0 ? 0 : s(5000), 18 + s(60)]);
      totalCand += cs.length;
      listas.push(L("L" + i, s(3) === 0 ? s(3000) : 0, cs));
    }
    if (listas.every((l) => l.votosLegenda === 0 && l.candidatos.every((c) => c.votos === 0))) listas[0].votosLegenda = 1;
    for (const minimoNominalFase2 of [0, 0.1]) {
      let r;
      try { r = rodar(vagas, listas, { minimoNominalFase2, resolverDesempateTecnico: resolver }); }
      catch (err) { if (/excedem as vagas/.test(err.message)) { excesso++; continue; } throw err; }
      casos++;
      const { c } = r;
      const soma = Object.values(c.cadeiras).reduce((a, b) => a + b, 0);
      assert.equal(soma, c.eleitos.length);
      assert.equal(c.eleitos.length + c.naoPreenchidas, vagas);
      assert.equal(new Set(c.eleitos).size, c.eleitos.length);
      if (minimoNominalFase2 === 0 && totalCand >= vagas) assert.equal(c.naoPreenchidas, 0);
      assert.deepEqual(rodar(vagas, listas, { minimoNominalFase2, resolverDesempateTecnico: resolver }).c, c);
    }
  }
  assert.ok(casos > 700, "casos válidos: " + casos + ", excesso: " + excesso);
});

test("eleitos pelo QP acima das vagas: erro explícito (caso sem regra nas fontes lidas)", () => {
  // V = 13, vagas 9, QE = 1 (1,44 arredonda para baixo); QP 13, todos com 1 voto >= 10%: 13 eleitos > 9 vagas.
  const cs = Array.from({ length: 13 }, (_, i) => ["C" + i, 1, 20 + i]);
  assert.throws(() => rodar(9, [L("A", 0, cs)]), /excedem as vagas/);
});

test("contrato D67 e validação de entrada", () => {
  const rng = RNG.criar("v1-SEM-RESOLVEDOR", "eleicao");
  const r = Cadeiras.distribuir({}, { disputaId: "D", vagas: 1, listas: [L("A", 0, [["A1", 10]])] }, rng);
  assert.equal(r.rngStateNext, rng); // sem desempate, o estado de RNG volta intacto
  assert.ok(Object.isFrozen(r.resultado.cadeiras));
  const base = { disputaId: "D", vagas: 2, listas: [L("A", 0, [["A1", 10]]), L("B", 0, [["B1", 5]])] };
  const ERRO = { name: "TypeError" };
  assert.throws(() => Cadeiras.distribuir({}, { ...base, listas: [L("A", 0, [["A1", 0]])] }, null), ERRO); // sem votos válidos
  assert.throws(() => Cadeiras.distribuir({ opcoes: { minimoNominalFase2: 0.2 } }, base, null), ERRO);
  assert.throws(() => Cadeiras.distribuir({}, { ...base, listas: [L("A", 0, [["X", 1]]), L("B", 0, [["X", 2]])] }, null), ERRO);
  assert.throws(() => Cadeiras.distribuir({}, { ...base, listas: [L("A", 0, []), L("A", 0, [])] }, null), ERRO);
  assert.throws(() => Cadeiras.distribuir({}, { ...base, listas: [{ id: "A", votosLegenda: 0, candidatos: [{ id: "A1", votos: 3 }] }] }, null), ERRO);
  assert.throws(() => Cadeiras.distribuir({}, { ...base, listas: [L("A", -1, [["A1", 3]])] }, null), ERRO);
  assert.throws(() => Cadeiras.distribuir({}, { ...base, vagas: 0 }, null), ERRO);
  // ids iguais a propriedades herdadas funcionam
  assert.deepEqual(rodar(1, [L("constructor", 0, [["toString", 3], ["valueOf", 1]])]).c.suplentes, { constructor: ["valueOf"] });
});
