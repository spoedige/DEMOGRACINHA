"use strict";
// Montagem das disputas ordinárias do ano (módulo 1, D74). Unidades, vagas e eleitorado artificiais.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Eleicao } = carregarMotor().Motor;
const rng = RNG.criar("v1-MONTAGEM", "eleicao");
const ERRO = { name: "TypeError" };
const CAL = { primeiroTurno: "2026-10-04", segundoTurno: "2026-10-25" };

const BR = { id: "BR", tipo: "pais" };
const DF = { id: "DF", tipo: "uf", uf: "DF" };
const PE = { id: "PE", tipo: "uf", uf: "PE" };
const EXT = { id: "ZZ", tipo: "exterior", uf: "ZZ" };
const BSB = { id: "M0001", tipo: "municipio", uf: "DF" };
const FN = { id: "M0002", tipo: "municipio", uf: "PE" };
const GRANDE = { id: "M0003", tipo: "municipio", uf: "PE" };
const PEQUENO = { id: "M0004", tipo: "municipio", uf: "PE" };

function geral(ano, extra) {
  return Object.assign({ ano: ano, calendario: CAL, unidades: [BR, DF, PE, EXT, GRANDE],
    vagas: { DEPUTADO_FEDERAL: { DF: 8, PE: 25 }, DEPUTADO_DISTRITAL: { DF: 24 }, DEPUTADO_ESTADUAL: { PE: 49 } } }, extra);
}
function municipal(extra) {
  return Object.assign({ ano: 2028, calendario: CAL, unidades: [BR, PE, BSB, FN, GRANDE, PEQUENO],
    vagas: { VEREADOR: { M0003: 21, M0004: 9 } }, eleitorado: { M0003: 200001, M0004: 200000 },
    excluidosMunicipais: ["M0001", "M0002"] }, extra);
}
const ids = (r) => plano(r.resultado.disputas.map((d) => d.id));

test("eleição geral: circunscrições por país e UF, distrital só no DF, Senado com 2 vagas em 2026", () => {
  const r = Eleicao.montarAno({}, geral(2026), rng);
  assert.deepEqual(ids(r), ["2026:DEPUTADO_DISTRITAL:DF", "2026:DEPUTADO_ESTADUAL:PE", "2026:DEPUTADO_FEDERAL:DF",
    "2026:DEPUTADO_FEDERAL:PE", "2026:GOVERNADOR:DF", "2026:GOVERNADOR:PE", "2026:PRESIDENTE:BR", "2026:SENADOR:DF", "2026:SENADOR:PE"]);
  const d = Object.fromEntries(r.resultado.disputas.map((x) => [x.id, x]));
  assert.equal(d["2026:SENADOR:PE"].vagas, 2); assert.equal(d["2026:SENADOR:PE"].votosPorEleitor, 2);
  assert.equal(d["2026:SENADOR:PE"].segundoTurnoPrevisto, false);
  assert.equal(d["2026:PRESIDENTE:BR"].segundoTurnoPrevisto, true);
  assert.equal(d["2026:GOVERNADOR:DF"].segundoTurnoPrevisto, true);
  assert.equal(d["2026:DEPUTADO_ESTADUAL:PE"].vagas, 49);
  assert.equal(d["2026:DEPUTADO_FEDERAL:PE"].sistema, "proporcional");
  assert.equal(r.resultado.tipo, "geral");
  assert.ok(Object.isFrozen(r.resultado.disputas[0]));
  assert.equal(r.rngStateNext, rng);
});

test("eleição geral: Senado com 1 vaga em 2030 e 2 em 2034", () => {
  const s = (ano) => Eleicao.montarAno({}, geral(ano), rng).resultado.disputas.filter((x) => x.cargo === "SENADOR");
  assert.deepEqual(plano(s(2030).map((x) => [x.vagas, x.votosPorEleitor])), [[1, 1], [1, 1]]);
  assert.deepEqual(plano(s(2034).map((x) => [x.vagas, x.votosPorEleitor])), [[2, 2], [2, 2]]);
  assert.throws(() => Eleicao.montarAno({}, geral(2030, { vagas: Object.assign({}, geral(2030).vagas, { SENADOR: { PE: 2 } }) }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { vagas: Object.assign({}, geral(2026).vagas, { GOVERNADOR: { PE: 2 } }) }), rng), ERRO);
});

test("eleição municipal: exclusão de Brasília e Fernando de Noronha e 2º turno acima de 200 mil", () => {
  const r = Eleicao.montarAno({}, municipal(), rng);
  assert.deepEqual(ids(r), ["2028:PREFEITO:M0003", "2028:PREFEITO:M0004", "2028:VEREADOR:M0003", "2028:VEREADOR:M0004"]);
  const d = Object.fromEntries(r.resultado.disputas.map((x) => [x.id, x]));
  assert.equal(d["2028:PREFEITO:M0003"].segundoTurnoPrevisto, true);
  assert.equal(d["2028:PREFEITO:M0004"].segundoTurnoPrevisto, false);
  assert.equal(d["2028:VEREADOR:M0004"].vagas, 9);
  assert.equal(d["2028:VEREADOR:M0004"].segundoTurnoPrevisto, false);
  // subconjunto: só um município informado
  const s = Eleicao.montarAno({}, municipal({ unidades: [PEQUENO] }), rng);
  assert.deepEqual(ids(s), ["2028:PREFEITO:M0004", "2028:VEREADOR:M0004"]);
});

test("montagem: anos sem eleição ordinária e unidades obrigatórias", () => {
  for (const ano of [2025, 2027, 2022, 2024]) assert.throws(() => Eleicao.montarAno({}, geral(ano), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { unidades: [DF, PE] }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { unidades: [BR, BR, DF] }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { unidades: [BR], vagas: {} }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ unidades: [BSB, FN], vagas: {}, eleitorado: {} }), rng), ERRO);
});

test("montagem: vagas, eleitorado, exclusão e calendário ausentes ou incompatíveis", () => {
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { vagas: { DEPUTADO_FEDERAL: { DF: 8, PE: 25 }, DEPUTADO_DISTRITAL: { DF: 24 } } }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { vagas: Object.assign({}, geral(2026).vagas, { DEPUTADO_ESTADUAL: { PE: 49, DF: 24 } }) }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { vagas: Object.assign({}, geral(2026).vagas, { DEPUTADO_DISTRITAL: { DF: 24, PE: 3 } }) }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, geral(2026, { vagas: Object.assign({}, geral(2026).vagas, { VEREADOR: { M0003: 21 } }) }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ eleitorado: { M0003: 200001 } }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ eleitorado: { M0003: 200001, constructor: 1 } }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ vagas: { VEREADOR: { M0003: 21 } } }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ excluidosMunicipais: undefined }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ calendario: undefined }), rng), ERRO);
  assert.throws(() => Eleicao.montarAno({}, municipal({ calendario: {} }), rng), ERRO);
});

test("montagem: determinística e sem consumo de RNG", () => {
  const a = Eleicao.montarAno({}, municipal(), rng), b = Eleicao.montarAno({}, municipal(), RNG.criar("v1-OUTRA", "eleicao"));
  assert.deepEqual(plano(a.resultado), plano(b.resultado));
  assert.deepEqual(plano(a.rngStateNext), plano(rng));
});
