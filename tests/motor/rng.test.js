"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { Motor, codigo } = carregarMotor();
const { RNG, MaiorResto } = Motor;

// Instantâneo de "v1-ABCD-1234", domínio eleição, primeiras 4 saídas (gerado por esta implementação).
const INSTANTANEO = [105808456,3607076798,2808001814,4225288249];

function sequencia(estado, n) {
  const out = [];
  let e = estado;
  for (let i = 0; i < n; i++) { const r = RNG.u32(e); out.push(r.valor); e = r.rngStateNext; }
  return { valores: out, estado: e };
}

// Implementação de referência independente do sfc32, em BigInt, para conferir o passo do gerador.
function sfc32Ref(s) {
  const M = (1n << 32n) - 1n;
  let [a, b, c, d] = s.map(BigInt);
  const t = (a + b + d) & M;
  d = (d + 1n) & M;
  a = b ^ (b >> 9n);
  b = (c + (c << 3n)) & M;
  c = (((c << 21n) | (c >> 11n)) & M);
  c = (c + t) & M;
  return { valor: Number(t), s: [a, b, c, d].map(Number) };
}

test("motor não usa Math.random, relógio nem identificadores aleatórios", () => {
  const semComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(semComentarios, /Math\.random|Date\.now|new Date|performance\.now|crypto\./);
});

test("mesma semente produz a mesma sequência", () => {
  const a = sequencia(RNG.criar("v1-ABCD-1234", "eleicao"), 200).valores;
  const b = sequencia(RNG.criar("v1-ABCD-1234", "eleicao"), 200).valores;
  assert.deepEqual(a, b);
});

test("normalização da semente: espaços, caixa e forma Unicode não mudam o fluxo", () => {
  const a = sequencia(RNG.criar("v1-ação", "mundo"), 20).valores;
  const b = sequencia(RNG.criar("  V1-AÇÃO ", "mundo"), 20).valores;
  const c = sequencia(RNG.criar("v1-ação", "mundo"), 20).valores; // forma decomposta
  assert.deepEqual(a, b);
  assert.deepEqual(a, c);
});

test("sementes diferentes produzem sequências diferentes", () => {
  const a = sequencia(RNG.criar("v1-ABCD-1234", "eleicao"), 50).valores;
  const b = sequencia(RNG.criar("v1-ABCD-1235", "eleicao"), 50).valores;
  assert.notDeepEqual(a, b);
  assert.ok(a.filter((v, i) => v === b[i]).length < 3);
});

test("restaurar o estado reproduz a sequência seguinte", () => {
  const ini = RNG.criar("v1-RESTAURA", "eventos");
  const meio = sequencia(ini, 37).estado;
  const serializado = JSON.stringify(meio);
  const restaurado = JSON.parse(serializado);
  assert.deepEqual(sequencia(restaurado, 100).valores, sequencia(meio, 100).valores);
  assert.deepEqual(sequencia(ini, 137).valores.slice(37), sequencia(meio, 100).valores);
});

test("estado recebido não é alterado (sem mutação implícita)", () => {
  const e = RNG.criar("v1-IMUTAVEL", "cartas");
  const antes = JSON.stringify(e);
  RNG.u32(e); RNG.decimal(e); RNG.inteiro(e, 7);
  assert.equal(JSON.stringify(e), antes);
  assert.ok(Object.isFrozen(e) && Object.isFrozen(e.s));
  assert.equal(RNG.u32(e).valor, RNG.u32(e).valor);
});

test("fluxos de domínios e chaves diferentes são independentes", () => {
  const sem = "v1-FLUXOS";
  const elei = sequencia(RNG.criar(sem, "eleicao"), 30).valores;
  // consumir muito do fluxo de mundo não altera o de eleição
  sequencia(RNG.criar(sem, "mundo"), 5000);
  assert.deepEqual(sequencia(RNG.criar(sem, "eleicao"), 30).valores, elei);
  const doms = RNG.DOMINIOS.map((d) => sequencia(RNG.criar(sem, d), 10).valores.join(","));
  assert.equal(new Set(doms).size, RNG.DOMINIOS.length);
  // subfluxo por chave (ex.: unidade, lista, eleição) difere do fluxo-base e entre chaves
  const sub1 = sequencia(RNG.criar(sem, "eleicao", "3550308", "PT", 2026), 10).valores;
  const sub2 = sequencia(RNG.criar(sem, "eleicao", "3550308", "PL", 2026), 10).valores;
  assert.notDeepEqual(sub1, sub2);
  assert.notDeepEqual(sub1, elei.slice(0, 10));
  // chaves não colidem por concatenação
  assert.notDeepEqual(sequencia(RNG.criar(sem, "eleicao", "ab", "c"), 5).valores,
    sequencia(RNG.criar(sem, "eleicao", "a", "bc"), 5).valores);
});

test("passo do gerador confere com implementação de referência independente", () => {
  let e = RNG.criar("v1-REFERENCIA", "mundo");
  let s = e.s.slice();
  for (let i = 0; i < 2000; i++) {
    const r = RNG.u32(e);
    const ref = sfc32Ref(s);
    assert.equal(r.valor, ref.valor);
    assert.deepEqual(plano(r.rngStateNext.s), ref.s);
    e = r.rngStateNext; s = ref.s;
  }
});

test("instantâneo fixo: detecta mudança acidental de algoritmo ou semeadura", () => {
  // Valores gerados por esta implementação em 18/11/2026; não são vetores oficiais do sfc32.
  const v = sequencia(RNG.criar("v1-ABCD-1234", "eleicao"), 4).valores;
  assert.deepEqual(v, INSTANTANEO);
});

test("inteiro uniforme em [0, n): limites e distribuição", () => {
  let e = RNG.criar("v1-INTEIRO", "eleicao");
  const cont = new Array(6).fill(0);
  for (let i = 0; i < 60000; i++) { const r = RNG.inteiro(e, 6); cont[r.valor]++; e = r.rngStateNext; }
  cont.forEach((c) => assert.ok(Math.abs(c - 10000) < 500, "contagem fora da faixa: " + c));
  assert.equal(RNG.inteiro(e, 1).valor, 0);
  assert.ok(RNG.inteiro(e, 4294967296).valor >= 0);
  for (const n of [0, -1, 1.5, 4294967297, NaN]) assert.throws(() => RNG.inteiro(e, n), { name: "RangeError" });
});

test("decimal em [0, 1) com média próxima de 0,5", () => {
  let e = RNG.criar("v1-DECIMAL", "eleicao");
  let soma = 0;
  for (let i = 0; i < 20000; i++) {
    const r = RNG.decimal(e);
    assert.ok(r.valor >= 0 && r.valor < 1);
    soma += r.valor; e = r.rngStateNext;
  }
  assert.ok(Math.abs(soma / 20000 - 0.5) < 0.01);
});

test("estados inválidos são rejeitados", () => {
  const bom = plano(RNG.criar("v1-VALIDA", "eleicao"));
  const ruins = [
    null, undefined, 42, {},
    { ...bom, versao: 2 }, { ...bom, algoritmo: "mulberry32" }, { ...bom, dominio: "outro" },
    { ...bom, chave: 1 }, { ...bom, s: [1, 2, 3] }, { ...bom, s: [1, 2, 3, -1] },
    { ...bom, s: [1, 2, 3, 2 ** 32] }, { ...bom, s: [1, 2, 3, 1.5] }, { ...bom, s: "1234" }
  ];
  for (const r of ruins) assert.throws(() => RNG.u32(r), { name: "TypeError" });
  assert.doesNotThrow(() => RNG.u32(bom));
  assert.throws(() => RNG.criar("", "eleicao"), { name: "RangeError" });
  assert.throws(() => RNG.criar("   ", "eleicao"), { name: "RangeError" });
  assert.throws(() => RNG.criar(123, "eleicao"), { name: "TypeError" });
  assert.throws(() => RNG.criar("v1-X", "clima"), { name: "RangeError" });
  assert.throws(() => RNG.criar("v1-X", "eleicao", { a: 1 }), { name: "TypeError" });
  assert.throws(() => RNG.criar("v1-X", "eleicao", 1.5), { name: "TypeError" });
});

// Módulo de exemplo no contrato D67, só para teste: sorteia votos de desempate entre concorrentes.
function moduloExemplo(estado, dados, rngState) {
  let e = rngState;
  const pesos = dados.concorrentes.map((id) => { const r = RNG.decimal(e); e = r.rngStateNext; return { id, peso: r.valor }; });
  return { resultado: MaiorResto.distribuir(estado.validos, pesos), rngStateNext: e };
}

test("repetir a mesma eleição com o mesmo estado produz o mesmo resultado", () => {
  const dados = { concorrentes: ["A", "B", "C", "D"] };
  const estado = { validos: 100003 };
  const rng = RNG.criar("v1-ELEICAO", "eleicao", "2026", "SP");
  const r1 = moduloExemplo(estado, dados, rng);
  const r2 = moduloExemplo(estado, dados, JSON.parse(JSON.stringify(rng)));
  assert.deepEqual(plano(r1), plano(r2));
  assert.notDeepEqual(plano(r1.rngStateNext), plano(rng));
  const soma = Object.values(r1.resultado).reduce((a, b) => a + b, 0);
  assert.equal(soma, 100003);
});


// Referência independente da semeadura: hash de 128 bits em BigInt (multiplicação módulo 2^32) e descarte de 15 passos.
function hash128Ref(str) {
  const M = (1n << 32n) - 1n;
  const mul = (a, b) => (BigInt(a) * BigInt(b)) & M;
  const x = (a, b) => (BigInt(a) ^ BigInt(b)) & M;
  let h1 = 1779033703n, h2 = 3144134277n, h3 = 1013904242n, h4 = 2773480762n;
  for (let i = 0; i < str.length; i++) {
    const k = BigInt(str.charCodeAt(i));
    h1 = x(h2, mul(x(h1, k), 597399067n));
    h2 = x(h3, mul(x(h2, k), 2869860233n));
    h3 = x(h4, mul(x(h3, k), 951274213n));
    h4 = x(h1, mul(x(h4, k), 2716044179n));
  }
  h1 = mul(x(h3, h1 >> 18n), 597399067n);
  h2 = mul(x(h4, h2 >> 22n), 2869860233n);
  h3 = mul(x(h1, h3 >> 17n), 951274213n);
  h4 = mul(x(h2, h4 >> 19n), 2716044179n);
  h1 = x(h1, x(h2, x(h3, h4))); h2 = x(h2, h1); h3 = x(h3, h1); h4 = x(h4, h1);
  return [h1, h2, h3, h4].map(Number);
}

test("semeadura confere com referência independente (hash da chave JSON e descarte)", () => {
  const casos = [["v1-ABCD-1234", "eleicao"], ["  v1-ação ", "mundo"], ["v1-X", "eleicao", "3550308", "PT", 2026], ["v1-Ω", "cartas", 0]];
  for (const [sem, dom, ...ch] of casos) {
    const chave = JSON.stringify([sem.normalize("NFC").trim().toUpperCase(), dom, ...ch]);
    let s = hash128Ref(chave);
    for (let i = 0; i < 15; i++) s = sfc32Ref(s).s;
    const e = RNG.criar(sem, dom, ...ch);
    assert.equal(e.chave, chave);
    assert.deepEqual(plano(e.s), s);
  }
});

test("consumo intercalado de dois fluxos preserva a sequência de cada um", () => {
  const a0 = RNG.criar("v1-INTERCALA", "eleicao"), b0 = RNG.criar("v1-INTERCALA", "eventos");
  const sa = sequencia(a0, 300).valores, sb = sequencia(b0, 300).valores;
  let a = a0, b = b0; const ia = [], ib = [];
  let e = RNG.criar("v1-ORDEM", "mundo");
  while (ia.length < 300 || ib.length < 300) {
    const r = RNG.inteiro(e, 3); e = r.rngStateNext;
    if (r.valor < 2 && ia.length < 300) { const x = RNG.u32(a); ia.push(x.valor); a = x.rngStateNext; }
    else if (ib.length < 300) { const y = RNG.u32(b); ib.push(y.valor); b = y.rngStateNext; }
  }
  assert.deepEqual(ia, sa);
  assert.deepEqual(ib, sb);
});
