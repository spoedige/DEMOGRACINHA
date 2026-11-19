"use strict";
// Lote de calibração (D87): reprodutível com a mesma semente e dentro das faixas em amostra pequena.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor } = require("../../tools/sim.js");
const { lote } = require("../../tools/lote.js");

test("lote: mesma semente, mesmo resultado; métricas em percentual por origem e porte", () => {
  const M = carregarMotor();
  const a = lote(M, 15, 4, "v1-TESTE"), b = lote(M, 15, 4, "v1-TESTE");
  assert.deepEqual(a, b);
  assert.equal(a.geral.n, 15); assert.deepEqual(Object.keys(a.porPorte).sort(), ["grande", "medio", "pequeno"]);
  assert.equal(Object.keys(a.porOrigem).length, 5);
  for (const v of Object.values(a.geral)) assert.ok(v >= 0);
});
