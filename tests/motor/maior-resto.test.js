"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, MaiorResto } = carregarMotor().Motor;
const d = (total, pesos) => plano(MaiorResto.distribuir(total, pesos));
const P = (o) => Object.entries(o).map(([id, peso]) => ({ id, peso }));
const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);

// Referência independente: pesos inteiros, quotas e restos em BigInt, empate por id.
function referencia(total, pesos) {
  const ids = Object.keys(pesos).sort();
  const W = ids.reduce((a, k) => a + BigInt(pesos[k]), 0n);
  const T = BigInt(total);
  const q = ids.map((k) => ({ k, piso: (T * BigInt(pesos[k])) / W, resto: (T * BigInt(pesos[k])) % W }));
  let sobra = T - q.reduce((a, x) => a + x.piso, 0n);
  [...q].sort((a, b) => (a.resto === b.resto ? (a.k < b.k ? -1 : 1) : a.resto > b.resto ? -1 : 1))
    .forEach((x) => { if (sobra > 0n) { x.piso += 1n; sobra -= 1n; } });
  return Object.fromEntries(q.map((x) => [x.k, Number(x.piso)]));
}

test("distribuição proporcional simples", () => {
  assert.deepEqual(d(100, P({ A: 1, B: 1 })), { A: 50, B: 50 });
  assert.deepEqual(d(10, P({ A: 3, B: 2 })), { A: 6, B: 4 });
  assert.deepEqual(d(10, P({ A: 1, B: 2, C: 3, D: 4 })), { A: 1, B: 2, C: 3, D: 4 });
});

test("restos iguais: desempate pelo id, independente da ordem de entrada", () => {
  assert.deepEqual(d(1, P({ B: 1, A: 1 })), { A: 1, B: 0 });
  assert.deepEqual(d(2, P({ C: 1, B: 1, A: 1 })), { A: 1, B: 1, C: 0 });
  const pesos = [{ id: "Z9", peso: 1 }, { id: "a1", peso: 1 }, { id: "M5", peso: 1 }];
  const r1 = d(1, pesos), r2 = d(1, [...pesos].reverse());
  assert.deepEqual(r1, r2);
  assert.equal(r1.M5, 1); // ordem de código UTF-16: dígitos e maiúsculas antes de minúsculas
});

test("peso zero recebe zero", () => {
  assert.deepEqual(d(7, P({ A: 0, B: 1, C: 1 })), { A: 0, B: 4, C: 3 });
  assert.deepEqual(d(5, P({ A: 0, B: 1 })), { A: 0, B: 5 });
});

test("total zero", () => {
  assert.deepEqual(d(0, P({ A: 1, B: 2 })), { A: 0, B: 0 });
  assert.deepEqual(d(0, P({ A: 0, B: 0 })), { A: 0, B: 0 });
});

test("total menor que o número de participantes", () => {
  const r = d(2, P({ A: 1, B: 1, C: 1, D: 1, E: 1 }));
  assert.equal(soma(r), 2);
  assert.deepEqual(r, { A: 1, B: 1, C: 0, D: 0, E: 0 });
  assert.deepEqual(d(1, P({ A: 1, B: 3, C: 2 })), { A: 0, B: 1, C: 0 });
});

test("pesos muito diferentes, sem perda de precisão", () => {
  assert.deepEqual(d(1000, P({ A: 1e300, B: 1e-300 })), { A: 1000, B: 0 });
  assert.deepEqual(d(3, P({ A: Number.MAX_VALUE, B: Number.MIN_VALUE })), { A: 3, B: 0 });
  const r = d(1e15, P({ A: 0.1, B: 0.2, C: 0.3 }));
  assert.equal(soma(r), 1e15);
  // 0.1, 0.2 e 0.3 em binário não são 1:2:3 exatos; o resultado segue os valores exatos dos números recebidos
  assert.deepEqual(r, d(1e15, P({ C: 0.3, A: 0.1, B: 0.2 })));
});

test("pesos fracionários equivalentes a inteiros dão o mesmo resultado", () => {
  assert.deepEqual(d(17, P({ A: 0.25, B: 0.5, C: 0.25 })), d(17, P({ A: 1, B: 2, C: 1 })));
});

test("soma exata e não negatividade em casos gerados (comparação com referência independente)", () => {
  let e = RNG.criar("v1-PROPRIEDADE", "mundo");
  const sortear = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  for (let caso = 0; caso < 500; caso++) {
    const n = 1 + sortear(12);
    const pesos = {};
    for (let i = 0; i < n; i++) pesos["P" + i] = sortear(4) === 0 ? 0 : sortear(1000000);
    if (Object.values(pesos).every((p) => p === 0)) pesos.P0 = 1;
    const total = sortear(5) === 0 ? sortear(10) : sortear(200000000);
    const r = d(total, P(pesos));
    assert.equal(soma(r), total);
    Object.values(r).forEach((v) => assert.ok(Number.isSafeInteger(v) && v >= 0));
    assert.deepEqual(r, referencia(total, pesos));
  }
});

test("pesos inválidos geram erro explícito", () => {
  for (const peso of [-1, -0.5, NaN, Infinity, -Infinity, "1", null, undefined, 1n]) {
    assert.throws(() => MaiorResto.distribuir(10, [{ id: "A", peso }, { id: "B", peso: 1 }]), { name: "RangeError" });
  }
});

test("soma dos pesos igual a zero com total positivo é erro", () => {
  assert.throws(() => MaiorResto.distribuir(5, P({ A: 0, B: 0 })), { name: "RangeError" });
});

test("entradas inválidas", () => {
  for (const t of [-1, 1.5, NaN, 2 ** 53]) assert.throws(() => MaiorResto.distribuir(t, P({ A: 1 })), { name: "RangeError" });
  assert.throws(() => MaiorResto.distribuir(1, []), { name: "TypeError" });
  assert.throws(() => MaiorResto.distribuir(1, P({ A: 1 }).concat(P({ A: 2 }))), { name: "TypeError" });
  assert.throws(() => MaiorResto.distribuir(1, [{ id: "", peso: 1 }]), { name: "TypeError" });
  assert.throws(() => MaiorResto.distribuir(1, [{ id: "__proto__", peso: 1 }]), { name: "TypeError" });
});

test("-0 é tratado como zero", () => {
  assert.deepEqual(d(3, P({ A: -0, B: 1 })), { A: 0, B: 3 });
});
