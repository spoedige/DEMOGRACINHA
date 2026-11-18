"use strict";
// Etapa 3: RNG.normal, ordem de desempate do maior resto, pontuação (4.1), módulos 8, 9 e 11.
// Resultados esperados calculados à mão e comentados em cada teste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, MaiorResto, Pontuacao, Comparecimento, Proporcional, Majoritaria, Cadeiras } = carregarMotor().Motor;
const ERRO = { name: "TypeError" };

// ---------- RNG.normal ----------
test("normal: determinística, sem cache fora do estado, sem mutação, restaurável", () => {
  const e0 = RNG.criar("v1-NORMAL", "eleicao");
  const a = RNG.normal(e0), b = RNG.normal(e0);
  assert.equal(a.valor, b.valor); // mesma entrada, mesma saída: nada guardado entre chamadas
  assert.deepEqual(plano(a.rngStateNext), plano(b.rngStateNext));
  const antes = JSON.stringify(e0);
  RNG.normal(e0);
  assert.equal(JSON.stringify(e0), antes);
  const restaurado = JSON.parse(JSON.stringify(a.rngStateNext));
  assert.equal(RNG.normal(restaurado).valor, RNG.normal(a.rngStateNext).valor);
  assert.throws(() => RNG.normal({ s: [1, 2, 3, 4] }), ERRO);
});

test("normal: média perto de 0 e variância perto de 1", () => {
  let e = RNG.criar("v1-NORMAL-DIST", "eleicao"), s = 0, s2 = 0;
  const n = 40000;
  for (let i = 0; i < n; i++) { const r = RNG.normal(e); e = r.rngStateNext; s += r.valor; s2 += r.valor * r.valor; }
  const media = s / n, variancia = s2 / n - media * media;
  assert.ok(Math.abs(media) < 0.02, "média " + media);
  assert.ok(Math.abs(variancia - 1) < 0.03, "variância " + variancia);
});

// ---------- MaiorResto: ordem de desempate ----------
test("maior resto: ordem de desempate explícita; sem opção, comportamento anterior", () => {
  const P = (o) => Object.entries(o).map(([id, peso]) => ({ id, peso }));
  assert.deepEqual(plano(MaiorResto.distribuir(1, P({ A: 1, B: 1 }))), { A: 1, B: 0 });
  assert.deepEqual(plano(MaiorResto.distribuir(1, P({ A: 1, B: 1 }), { ordemDesempate: ["B", "A"] })), { A: 0, B: 1 });
  // ids fora da lista vêm depois, em ordem UTF-16
  assert.deepEqual(plano(MaiorResto.distribuir(2, P({ A: 1, B: 1, C: 1 }), { ordemDesempate: ["C"] })), { A: 1, B: 0, C: 1 });
  // a ordem só desempata restos iguais: maior resto continua prevalecendo
  assert.deepEqual(plano(MaiorResto.distribuir(1, P({ A: 2, B: 1 }), { ordemDesempate: ["B", "A"] })), { A: 1, B: 0 });
  for (const op of [{ ordemDesempate: "AB" }, { ordemDesempate: ["A", "A"] }, { ordemDesempate: [""] }, 5]) {
    assert.throws(() => MaiorResto.distribuir(1, P({ A: 1 }), op), ERRO);
  }
});

// ---------- Pontuação (4.1) ----------
test("pontuação base: média geométrica ponderada com ε; fator zero não zera", () => {
  const S = Pontuacao.base({ a: 0.25, b: 1 }, { a: 0.5, b: 0.5 }, 1e-12);
  assert.ok(Math.abs(S - 0.5) < 1e-9); // √0,25 × 1
  const comZero = Pontuacao.base({ a: 0, b: 1 }, { a: 0.5, b: 0.5 }, 0.01);
  assert.ok(comZero > 0 && Math.abs(comZero - Math.sqrt(0.01 * 1.01)) < 1e-12);
  assert.throws(() => Pontuacao.base({ a: 1 }, { a: 0.9 }, 0.01), ERRO);          // pesos não somam 1
  assert.throws(() => Pontuacao.base({ a: 1.1 }, { a: 1 }, 0.01), ERRO);          // fator fora de [0, 1]
  assert.throws(() => Pontuacao.base({ a: 1 }, { a: 1 }, 0), ERRO);               // ε deve ser positivo
  assert.throws(() => Pontuacao.base({ a: 1, b: 1 }, { a: 1 }, 0.01), ERRO);      // nomes diferentes
  assert.throws(() => Pontuacao.base({ a: 1, b: 1 }, { a: 1.5, b: -0.5 }, 0.01), ERRO);
});

test("pontuação com ruído: Z em ordem de id, um por concorrente; σ = 0 dá a base; média do ruído 1", () => {
  const rng = RNG.criar("v1-PONTUACAO", "eleicao", "D");
  const c = (id, sigma) => ({ id, fatores: { o: 0.5 }, pesos: { o: 1 }, epsilon: 0.01, sigma });
  const r1 = Pontuacao.calcularLote([c("B", 0.3), c("A", 0.3), c("C", 0)], rng);
  const r2 = Pontuacao.calcularLote([c("C", 0), c("A", 0.3), c("B", 0.3)], rng);
  assert.deepEqual(plano(r1), plano(r2)); // independe da ordem de entrada
  assert.ok(Math.abs(r1.resultado.C - 0.51) < 1e-12); // σ = 0: S = 0,5 + 0,01
  let e = rng; for (let i = 0; i < 3; i++) e = RNG.normal(e).rngStateNext;
  assert.deepEqual(plano(r1.rngStateNext), plano(e)); // exatamente três normais consumidas
  const zA = RNG.normal(rng);
  assert.ok(Math.abs(r1.resultado.A - 0.51 * Math.exp(0.3 * zA.valor - 0.045)) < 1e-12); // A é o primeiro sorteado
  assert.throws(() => Pontuacao.calcularLote([c("A", 0.3)], RNG.criar("v1-X", "mundo")), ERRO);
  assert.throws(() => Pontuacao.calcularLote([c("A", -1)], rng), ERRO);
  // média do ruído lognormal normalizado perto de 1
  const muitos = Array.from({ length: 20000 }, (_, i) => c("K" + String(i).padStart(5, "0"), 0.5));
  const r = Pontuacao.calcularLote(muitos, rng).resultado;
  const media = Object.values(r).reduce((a, b) => a + b, 0) / 20000 / 0.51;
  assert.ok(Math.abs(media - 1) < 0.02, "média do ruído " + media);
});

// ---------- Módulo 8 ----------
const T1 = (c, a, s, den) => ({ comparecimento: { numerador: c, denominador: den }, abstencao: { numerador: a, denominador: den },
  eleitoresSecoesNaoInstaladas: { numerador: s, denominador: den } });
const T2 = (v, b, n, an, sj, ap, den) => Object.fromEntries(Object.entries({ validos: v, brancos: b, nulos: n, anulados: an,
  anuladosSubJudice: sj, anuladosApuracaoSeparada: ap }).map(([k, x]) => [k, { numerador: x, denominador: den }]));

test("módulo 8: taxas exatas do pipeline; identidades do eleitorado e D59", () => {
  // eleitorado 1000: 800, 190, 10. Votos possíveis 800 × 1: 7000/8000 etc. dão 700, 40, 50, 6, 3, 1.
  const r = plano(Comparecimento.calcular({}, { disputaId: "D", eleitorado: 1000, votosPorEleitor: 1,
    taxasEleitorado: T1(800, 190, 10, 1000), taxasVotos: T2(7000, 400, 500, 60, 30, 10, 8000) }, null).resultado);
  assert.deepEqual([r.comparecimento, r.abstencao, r.eleitoresSecoesNaoInstaladas], [800, 190, 10]);
  assert.deepEqual([r.votosPossiveis, r.validos, r.brancos, r.nulos, r.anulados, r.anuladosSubJudice, r.anuladosApuracaoSeparada],
    [800, 700, 40, 50, 6, 3, 1]);
});

test("módulo 8: arredondamento por maior resto e Senado com dois votos por eleitor", () => {
  // eleitorado 7 com taxas 1/3: pisos 2, 2, 2; uma unidade sobra, restos iguais, desempate por id (abstencao primeiro)
  const r = plano(Comparecimento.calcular({}, { disputaId: "D", eleitorado: 7, votosPorEleitor: 1,
    taxasEleitorado: T1(1, 1, 1, 3), taxasVotos: T2(1, 0, 0, 0, 0, 0, 1) }, null).resultado);
  assert.deepEqual([r.comparecimento, r.abstencao, r.eleitoresSecoesNaoInstaladas], [2, 3, 2]);
  const s = plano(Comparecimento.calcular({}, { disputaId: "D", eleitorado: 1000, votosPorEleitor: 2,
    taxasEleitorado: T1(800, 190, 10, 1000), taxasVotos: T2(7000, 400, 500, 60, 30, 10, 8000) }, null).resultado);
  assert.equal(s.votosPossiveis, 1600);
  assert.equal(s.validos, 1400);
});

test("módulo 8: taxas numéricas com tolerância; validações", () => {
  const num1 = { comparecimento: 0.75, abstencao: 0.25, eleitoresSecoesNaoInstaladas: 0 };
  const num2 = { validos: 0.875, brancos: 0.0625, nulos: 0.0625, anulados: 0, anuladosSubJudice: 0, anuladosApuracaoSeparada: 0 };
  const r = plano(Comparecimento.calcular({}, { disputaId: "D", eleitorado: 160, votosPorEleitor: 1, taxasEleitorado: num1, taxasVotos: num2 }, null).resultado);
  assert.deepEqual([r.comparecimento, r.validos, r.brancos, r.nulos], [120, 105, 8, 7]); // 7,5 e 7,5: brancos leva a unidade (id antes de nulos)
  const base = { disputaId: "D", eleitorado: 160, votosPorEleitor: 1, taxasEleitorado: num1, taxasVotos: num2 };
  assert.throws(() => Comparecimento.calcular({}, { ...base, taxasEleitorado: { ...num1, abstencao: 0.3 } }, null), ERRO);
  assert.throws(() => Comparecimento.calcular({}, { ...base, taxasEleitorado: { comparecimento: 1, abstencao: 0 } }, null), ERRO);
  assert.throws(() => Comparecimento.calcular({}, { ...base, taxasEleitorado: { ...T1(1, 1, 1, 3), comparecimento: 0.5 } }, null), ERRO);
  assert.throws(() => Comparecimento.calcular({}, { ...base, taxasEleitorado: { ...T1(1, 1, 1, 3), comparecimento: { numerador: 1, denominador: 4 } } }, null), ERRO);
  assert.throws(() => Comparecimento.calcular({}, { ...base, taxasEleitorado: T1(1, 1, 2, 3) }, null), ERRO);
  assert.throws(() => Comparecimento.calcular({}, { ...base, votosPorEleitor: 3 }, null), ERRO);
});

test("módulo 8: identidades em cenários gerados e estado de RNG intacto", () => {
  let e = RNG.criar("v1-MOD8", "mundo");
  const s = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  const rng = RNG.criar("v1-MOD8", "eleicao");
  for (let k = 0; k < 300; k++) {
    const den1 = 1 + s(100000), c = s(den1 + 1), a = s(den1 - c + 1);
    const den2 = 1 + s(100000), v = s(den2 + 1), b = s(den2 - v + 1), n = s(den2 - v - b + 1);
    const resto = den2 - v - b - n, an = s(resto + 1), sj = s(resto - an + 1);
    const out = Comparecimento.calcular({}, { disputaId: "D", eleitorado: s(3000000), votosPorEleitor: 1 + s(2),
      taxasEleitorado: T1(c, a, den1 - c - a, den1), taxasVotos: T2(v, b, n, an, sj, resto - an - sj, den2) }, rng);
    const r = out.resultado;
    assert.equal(r.comparecimento + r.abstencao + r.eleitoresSecoesNaoInstaladas, r.eleitorado);
    assert.equal(r.validos + r.brancos + r.nulos + r.anulados + r.anuladosSubJudice + r.anuladosApuracaoSeparada, r.comparecimento * r.votosPorEleitor);
    assert.equal(out.rngStateNext, rng);
  }
});

// ---------- Módulo 9 ----------
const Lp = (id, identPartidaria, lambda, candidatos) => ({ id, identPartidaria, lambda, candidatos: candidatos.map(([cid, S]) => ({ id: cid, S })) });

test("módulo 9: segmentos fiel e livre, legenda e dois níveis no arredondamento", () => {
  // válidos 1000, δ 0,25, identificação A 0,25, B 0,25, sem identificação 0,5.
  // I_A = I_B = 187,5; F = 1000 × (0,5 + 0,25 × 0,5) = 625. Restos iguais: A, B, F nessa ordem -> 188, 187, 625.
  // Fiel A (188): legenda λ 1, A1 2, A2 1 -> 47, 94, 47. Fiel B (187): legenda λ 0, B1 -> 187.
  // Livre: S_A 3, S_B 1 -> 468,75 e 156,25 -> 469 e 156. Dentro de A: 312,67 e 156,33 -> 313 e 156.
  const r = plano(Proporcional.apurar({}, { disputaId: "D", validos: 1000, delta: 0.25, semIdentificacao: 0.5,
    listas: [Lp("A", 0.25, 1, [["A1", 2], ["A2", 1]]), Lp("B", 0.25, 0, [["B1", 1]])] }, null).resultado);
  assert.deepEqual(r.segmentos, { fiel: { A: 188, B: 187 }, livre: 625, livrePorLista: { A: 469, B: 156 } });
  assert.deepEqual(r.votos, { A1: 407, A2: 203, B1: 343 });
  assert.deepEqual(r.legenda, { A: 47, B: 0 });
  assert.deepEqual(r.votosLista, { A: 657, B: 343 });
});

test("módulo 9: F por último no desempate dos segmentos", () => {
  // válidos 3, δ 0, A 1/2, sem identificação 1/2: I_A = 1,5 e F = 1,5; restos iguais: A recebe a unidade (F por último).
  // Sem a ordem explícita, o id "segmento:livre" viria depois de "A" de qualquer forma; com lista "zz" ele viria antes.
  const r = plano(Proporcional.apurar({}, { disputaId: "D", validos: 3, delta: 0, semIdentificacao: 0.5,
    listas: [Lp("zz", 0.5, 0, [["z1", 1]])] }, null).resultado);
  assert.deepEqual(r.segmentos.fiel, { zz: 2 });
  assert.equal(r.segmentos.livre, 1);
});

test("módulo 9: lista sem candidatos fica só com a legenda no segmento fiel e fora do livre", () => {
  // válidos 100, δ 0: I_A 50, I_C 25, F 25. A: λ 0 -> A1 50. C sem candidatos -> legenda 25. Livre só A -> A1 25.
  const r = plano(Proporcional.apurar({}, { disputaId: "D", validos: 100, delta: 0, semIdentificacao: 0.25,
    listas: [Lp("A", 0.5, 0, [["A1", 1]]), Lp("C", 0.25, 0, [])] }, null).resultado);
  assert.deepEqual(r.votos, { A1: 75 });
  assert.deepEqual(r.legenda, { A: 0, C: 25 });
  assert.deepEqual(r.votosLista, { A: 75, C: 25 });
});

test("módulo 9: conservação e erro do total da lista menor que 2 + s_L (D50), em cenários gerados", () => {
  let e = RNG.criar("v1-MOD9", "mundo");
  const u = () => { const r = RNG.decimal(e); e = r.rngStateNext; return r.valor; };
  const s = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  for (let k = 0; k < 300; k++) {
    const n = 1 + s(6), brutos = Array.from({ length: n + 1 }, () => u() + 0.01);
    const soma = brutos.reduce((a, b) => a + b, 0), idents = brutos.map((b) => b / soma);
    const semId = 1 - idents.slice(0, n).reduce((a, b) => a + b, 0);
    const listas = idents.slice(0, n).map((id, i) => Lp("L" + i, id, u(), Array.from({ length: 1 + s(8) }, (_, j) => ["L" + i + "c" + j, u() + 0.001])));
    const validos = s(500000), delta = u();
    const r = plano(Proporcional.apurar({}, { disputaId: "D", validos, delta, semIdentificacao: Math.max(0, semId), listas }, null).resultado);
    assert.equal(Object.values(r.votosLista).reduce((a, b) => a + b, 0), validos);
    const somaS = listas.reduce((a, l) => a + l.candidatos.reduce((x, c) => x + c.S, 0), 0);
    const pesoF = Math.max(0, semId) + delta * idents.slice(0, n).reduce((a, b) => a + b, 0);
    for (const l of listas) {
      const sL = l.candidatos.reduce((x, c) => x + c.S, 0) / somaS;
      const real = validos * l.identPartidaria * (1 - delta) + validos * pesoF * sL;
      assert.ok(Math.abs(r.votosLista[l.id] - real) < 2 + sL + 1e-6, "erro da lista " + (r.votosLista[l.id] - real));
    }
  }
});

test("módulo 9: validações", () => {
  const base = { disputaId: "D", validos: 100, delta: 0, semIdentificacao: 0.5, listas: [Lp("A", 0.5, 0, [["A1", 1]])] };
  assert.throws(() => Proporcional.apurar({}, { ...base, semIdentificacao: 0.6 }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, tau: 2 }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, delta: 1.5 }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, listas: [Lp("A", 0.5, 0, [["A1", 0]])] }, null), ERRO); // F > 0 sem S > 0
  assert.throws(() => Proporcional.apurar({}, { ...base, listas: [Lp("segmento:livre", 0.5, 0, [["A1", 1]])] }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, listas: [Lp("A", 0.5, 0, [["legenda:L", 1]])] }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, listas: [Lp("A", 0.25, 0, [["X", 1]]), Lp("B", 0.25, 0, [["X", 1]])] }, null), ERRO);
  assert.throws(() => Proporcional.apurar({}, { ...base, listas: [Lp("A", 0.5, -1, [["A1", 1]])] }, null), ERRO);
});

// ---------- Módulo 11 ----------
const ch = (o) => Object.entries(o).map(([id, S]) => ({ id, S }));
const maj = (cargo, eleitorado, chapas, extra, opcoes) => plano(Majoritaria.apurar({ opcoes: opcoes || {} },
  { disputaId: "D", cargo, vagas: 1, eleitorado, validos: 1000, chapas: ch(chapas), ...(extra || {}) }, null).resultado);

test("módulo 11: maioria absoluta encerra no 1º turno; sem ela, dois finalistas", () => {
  // presidente: 600, 300, 100 -> A eleito (2 × 600 > 1000)
  const a = maj("PRESIDENTE", 5000000, { A: 6, B: 3, C: 1 });
  assert.deepEqual([a.regra, a.segundoTurno, a.eleitos, a.votos], ["maioriaAbsoluta", false, ["A"], { A: 600, B: 300, C: 100 }]);
  // governador: 400, 350, 250 -> 2º turno A e B
  const g = maj("GOVERNADOR", 5000000, { A: 4, B: 3.5, C: 2.5 });
  assert.deepEqual([g.segundoTurno, g.finalistas, g.eleitos], [true, ["A", "B"], []]);
  // exatamente metade não é maioria absoluta: 500 e 500 -> 2º turno, os dois empatados são finalistas sem desempate
  const m = maj("PRESIDENTE", 5000000, { A: 1, B: 1 });
  assert.deepEqual([m.segundoTurno, m.finalistas, m.desempates], [true, ["A", "B"], []]);
});

test("módulo 11: prefeito com até 200 mil eleitores tem maioria simples; acima, maioria absoluta", () => {
  const p1 = maj("PREFEITO", 200000, { A: 4, B: 3.5, C: 2.5 });
  assert.deepEqual([p1.regra, p1.segundoTurno, p1.eleitos], ["maioriaSimples", false, ["A"]]);
  const p2 = maj("PREFEITO", 200001, { A: 4, B: 3.5, C: 2.5 });
  assert.deepEqual([p2.regra, p2.segundoTurno, p2.finalistas], ["maioriaAbsoluta", true, ["A", "B"]]);
});

test("módulo 11: Senado com uma ou duas vagas, maioria simples, sem 2º turno", () => {
  const s2 = maj("SENADOR", 5000000, { A: 4, B: 3, C: 2, D: 1 }, { vagas: 2 });
  assert.deepEqual([s2.regra, s2.segundoTurno, s2.eleitos], ["maioriaSimples", false, ["A", "B"]]);
  const s1 = maj("SENADOR", 5000000, { A: 4, B: 3, C: 2, D: 1 });
  assert.deepEqual(s1.eleitos, ["A"]);
});

test("módulo 11: empates na posição decisiva vão ao desempate técnico injetado", () => {
  // governador 400, 300, 300: segundo finalista entre B e C
  const ch2 = [];
  const resolver = (empatados, ctx) => { ch2.push(plano([empatados, ctx.tipo, ctx.posicao])); return { vencedorId: "C" }; };
  const g = maj("GOVERNADOR", 5000000, { A: 4, B: 3, C: 3 }, {}, { resolverDesempateTecnico: resolver });
  assert.deepEqual(g.finalistas, ["A", "C"]);
  assert.deepEqual(ch2, [[["B", "C"], "finalistasMajoritario", 2]]);
  assert.throws(() => maj("GOVERNADOR", 5000000, { A: 4, B: 3, C: 3 }), /desempate técnico necessário/);
  // Senado, segunda vaga: 400, 300, 300
  const s = maj("SENADOR", 5000000, { A: 4, B: 3, C: 3 }, { vagas: 2 }, { resolverDesempateTecnico: () => ({ vencedorId: "B" }) });
  assert.deepEqual([s.eleitos, s.desempates.length], [["A", "B"], 1]);
  // prefeito pequeno com empate no topo
  const p = maj("PREFEITO", 1000, { A: 1, B: 1 }, {}, { resolverDesempateTecnico: () => ({ vencedorId: "B" }) });
  assert.deepEqual(p.eleitos, ["B"]);
});

test("módulo 11: votos não modelados (D) separados, no denominador da maioria e com limite de modelagem", () => {
  // A 5, B 3, D 2 sobre 1000: 500, 300, não modelados 200. A não tem maioria absoluta (2 × 500 = 1000): 2º turno A e B.
  const r = maj("PRESIDENTE", 5000000, { A: 5, B: 3 }, { D: 2 });
  assert.deepEqual([r.votos, r.votosNaoModelados, r.segundoTurno, r.finalistas], [{ A: 500, B: 300 }, 200, true, ["A", "B"]]);
  // D alto: não modelados (400 de 1200 válidos) superam o segundo colocado (300): resultado indefinido, erro explícito
  assert.throws(() => maj("PRESIDENTE", 5000000, { A: 5, B: 3 }, { D: 4, validos: 1200 }), /insuficiência de modelagem/);
  // maioria absoluta com D: A 600 de 1000 é eleito qualquer que seja a composição dos não modelados
  const v = maj("PRESIDENTE", 5000000, { A: 6, B: 1 }, { D: 3 });
  assert.deepEqual([v.eleitos, v.votosNaoModelados], [["A"], 300]);
});

test("módulo 11: validações", () => {
  assert.throws(() => maj("VEREADOR", 1000, { A: 1 }), ERRO);
  assert.throws(() => maj("PREFEITO", 1000, { A: 1, B: 1 }, { vagas: 2 }), ERRO);
  assert.throws(() => maj("SENADOR", 1000, { A: 1, B: 1 }, { vagas: 3 }), ERRO);
  assert.throws(() => maj("SENADOR", 1000, { A: 1 }, { vagas: 2 }), ERRO);
  assert.throws(() => maj("PRESIDENTE", 1000, { A: 1 }, { tau: 2 }), ERRO);
  assert.throws(() => maj("PRESIDENTE", 1000, { "naoModelados:D": 1 }), ERRO);
  assert.throws(() => maj("PRESIDENTE", 1000, { A: 1 }, { D: -1 }), ERRO);
  // válidos acima do máximo possível: eleitorado × vagas no Senado, eleitorado nos demais
  assert.throws(() => maj("PRESIDENTE", 999, { A: 1 }), ERRO);
  assert.throws(() => maj("PRESIDENTE", 0, { A: 1 }, { validos: 1 }), ERRO);
  assert.deepEqual(maj("SENADOR", 500, { A: 2, B: 1.5, C: 1 }, { vagas: 2 }).eleitos.length, 2); // 1000 válidos com 500 eleitores e 2 votos
  assert.throws(() => maj("SENADOR", 499, { A: 2, B: 1, C: 1 }, { vagas: 2 }), ERRO);
});

// ---------- Encadeamento 8 -> 9 -> 10 ----------
test("encadeamento: comparecimento, apuração proporcional e cadeiras conservam votos e vagas", () => {
  const m8 = Comparecimento.calcular({}, { disputaId: "D", eleitorado: 100000, votosPorEleitor: 1,
    taxasEleitorado: T1(8000, 1900, 100, 10000), taxasVotos: T2(9000, 400, 500, 60, 30, 10, 10000) }, null).resultado;
  let rng = RNG.criar("v1-ENCADEAMENTO", "eleicao", "D");
  const cand = (id) => ({ id, fatores: { o: 0.5, m: 0.4 }, pesos: { o: 0.6, m: 0.4 }, epsilon: 0.01, sigma: 0.4 });
  const ids = { A: ["A1", "A2", "A3"], B: ["B1", "B2"], C: ["C1"] };
  const pont = Pontuacao.calcularLote(Object.values(ids).flat().map(cand), rng);
  rng = pont.rngStateNext;
  const m9 = Proporcional.apurar({}, { disputaId: "D", validos: m8.validos, delta: 0.1, semIdentificacao: 0.4,
    listas: Object.entries(ids).map(([l, cs], i) => Lp(l, [0.3, 0.2, 0.1][i], 0.5, cs.map((c) => [c, pont.resultado[c]]))) }, rng).resultado;
  assert.equal(Object.values(m9.votosLista).reduce((a, b) => a + b, 0), m8.validos);
  const m10 = Cadeiras.distribuir({}, { disputaId: "D", vagas: 5, listas: Object.entries(ids).map(([l, cs]) => ({
    id: l, votosLegenda: m9.legenda[l], candidatos: cs.map((c, k) => ({ id: c, votos: m9.votos[c], idade: 30 + k })) })) },
    rng).resultado.cadeiras;
  assert.equal(m10.eleitos.length + m10.naoPreenchidas, 5);
});
