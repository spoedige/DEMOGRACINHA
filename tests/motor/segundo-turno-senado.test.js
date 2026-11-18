"use strict";
// Etapa 4: módulo 13 (Senado, motor-eleitoral.md 6.2) e módulo 12 (2º turno, 6.3), D70.
// Resultados esperados calculados à mão e comentados em cada teste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Senado, SegundoTurno, Majoritaria } = carregarMotor().Motor;
const ERRO = { name: "TypeError" };
const ch = (o) => Object.entries(o).map(([id, S]) => ({ id, S }));
const sen = (chapas, extra, opcoes) => plano(Senado.apurar({ opcoes: opcoes || {} },
  { disputaId: "D", vagas: 2, eleitorado: 5000, validos1: 1000, taxaInvalidos2: 0, chapas: ch(chapas), ...(extra || {}) }, null).resultado);

// ---------- Módulo 13 ----------
test("Senado com 2 vagas: matriz de segundo voto sem diagonal", () => {
  // v1: 400, 300, 200, 100 (S 4, 3, 2, 1). Sem inválidos no 2º voto: linhas 400, 300, 200, 100.
  // Linha A (400) entre B, C, D (3, 2, 1): 200, 133,33, 66,67 -> 200, 133, 67.
  // Linha B (300) entre A, C, D (4, 2, 1): 171,43, 85,71, 42,86 -> 171, 86, 43.
  // Linha C (200) entre A, B, D (4, 3, 1): 100, 75, 25.
  // Linha D (100) entre A, B, C (4, 3, 2): 44,44, 33,33, 22,22 -> 45, 33, 22.
  // Segundo voto: A 316, B 308, C 241, D 135. Totais: A 716, B 608, C 441, D 235 -> A e B.
  const r = sen({ A: 4, B: 3, C: 2, D: 1 });
  assert.deepEqual(r.primeiroVoto, { A: 400, B: 300, C: 200, D: 100 });
  assert.deepEqual(r.segundoVoto, { A: { B: 200, C: 133, D: 67 }, B: { A: 171, C: 86, D: 43 }, C: { A: 100, B: 75, D: 25 }, D: { A: 45, B: 33, C: 22 } });
  assert.deepEqual(r.votos, { A: 716, B: 608, C: 441, D: 235 });
  assert.deepEqual([r.validos1, r.validos2, r.invalidos2, r.validos], [1000, 1000, 0, 2000]);
  assert.deepEqual([r.eleitos, r.segundoTurno, r.votosNaoModelados], [["A", "B"], false, 0]);
});

test("Senado com 2 vagas: inválidos no segundo voto reduzem as linhas na mesma proporção", () => {
  // taxa 0,25: validos2 750, invalidos2 250. Linhas por v1: 300, 225, 150, 75.
  // A 300 entre B, C, D: 150, 100, 50. B 225 entre A, C, D: 128,57, 64,29, 32,14 -> 129, 64, 32.
  // C 150 entre A, B, D: 75, 56,25, 18,75 -> 75, 56, 19. D 75 entre A, B, C: 33,33, 25, 16,67 -> 33, 25, 17.
  // Segundo voto: A 237, B 231, C 181, D 101 (soma 750). Totais: A 637, B 531, C 381, D 201.
  const r = sen({ A: 4, B: 3, C: 2, D: 1 }, { taxaInvalidos2: 0.25 });
  assert.deepEqual([r.validos2, r.invalidos2], [750, 250]);
  assert.deepEqual(r.votos, { A: 637, B: 531, C: 381, D: 201 });
  assert.deepEqual(r.eleitos, ["A", "B"]);
});

test("Senado com 2 vagas: empate na segunda vaga vai ao desempate técnico", () => {
  // v1 400, 300, 300. A 400 entre B e C: 200, 200. B 300 entre A, C (4, 3): 171, 129. C 300 entre A, B: 171, 129.
  // Totais: A 742, B 629, C 629 -> empate na segunda vaga entre B e C.
  const chamadas = [];
  const r = sen({ A: 4, B: 3, C: 3 }, {}, { resolverDesempateTecnico: (e, ctx) => { chamadas.push(plano([e, ctx.tipo, ctx.posicao])); return { vencedorId: "C" }; } });
  assert.deepEqual(r.votos, { A: 742, B: 629, C: 629 });
  assert.deepEqual(r.eleitos, ["A", "C"]);
  assert.deepEqual(chamadas, [[["B", "C"], "senado", 2]]);
  assert.throws(() => sen({ A: 4, B: 3, C: 3 }), /desempate técnico necessário/);
});

test("Senado com 1 vaga: mesmo resultado do módulo 11", () => {
  const dados = { disputaId: "D", vagas: 1, eleitorado: 5000, validos: 1000, chapas: ch({ A: 4, B: 3, C: 2 }) };
  const r = plano(Senado.apurar({}, dados, null).resultado);
  const m = plano(Majoritaria.apurar({}, { ...dados, cargo: "SENADOR" }, null).resultado);
  assert.deepEqual(r, m);
  assert.deepEqual(r.eleitos, ["A"]);
  assert.throws(() => Senado.apurar({}, { ...dados, taxaInvalidos2: 0.1 }, null), ERRO);
});

test("Senado: conservação, sem voto duplo no mesmo candidato, em cenários gerados", () => {
  let e = RNG.criar("v1-SENADO", "mundo");
  const s = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  const resolver = (empatados) => ({ vencedorId: empatados[0] });
  for (let k = 0; k < 300; k++) {
    const n = 2 + s(8), chapas = {};
    for (let i = 0; i < n; i++) chapas["C" + i] = 1 + s(1000);
    const validos1 = 1 + s(200000), taxa = s(5) / 10;
    const r = sen(chapas, { validos1, eleitorado: validos1 + s(1000), taxaInvalidos2: taxa }, { resolverDesempateTecnico: resolver });
    assert.equal(r.validos2 + r.invalidos2, validos1);
    assert.equal(Object.values(r.votos).reduce((a, b) => a + b, 0), validos1 + r.validos2);
    let soma2 = 0;
    for (const [c, linha] of Object.entries(r.segundoVoto)) {
      assert.ok(!(c in linha), "diagonal presente em " + c);
      soma2 += Object.values(linha).reduce((a, b) => a + b, 0);
    }
    assert.equal(soma2, r.validos2);
    assert.equal(new Set(r.eleitos).size, 2);
  }
});

test("Senado: validações", () => {
  assert.throws(() => sen({ A: 4, B: 3 }, { D: 1 }), ERRO);                 // D = 0 com 2 vagas
  assert.throws(() => sen({ A: 4, B: 3 }, { taxaInvalidos2: 1 }), ERRO);
  assert.throws(() => sen({ A: 4, B: 3 }, { taxaInvalidos2: -0.1 }), ERRO);
  assert.throws(() => sen({ A: 4 }), ERRO);                                  // menos de duas chapas
  assert.throws(() => sen({ A: 4, B: 3 }, { eleitorado: 999 }), ERRO);       // validos1 acima do eleitorado
  assert.throws(() => sen({ A: 4, B: 3 }, { vagas: 3 }), ERRO);
  assert.throws(() => sen({ A: 1, B: 0 }), ERRO);                            // linha A sem outro candidato com pontuação
  assert.throws(() => sen({ A: 4, B: 3 }, { tau: 2 }), ERRO);
});

// ---------- Módulo 12 ----------
const T1 = { votos: { A: 300, B: 250, C: 150 }, votosNaoModelados: 0, brancos: 40, nulos: 30, anulados: 10,
  anuladosSubJudice: 0, anuladosApuracaoSeparada: 0, abstencao: 200, eleitoresSecoesNaoInstaladas: 20 };
const PESOS = {
  A: { A: 90, B: 2, brancoNulo: 3, abstencao: 5 }, B: { A: 2, B: 90, brancoNulo: 3, abstencao: 5 },
  C: { A: 50, B: 30, brancoNulo: 10, abstencao: 10 }, brancoNuloAnulado: { A: 10, B: 10, brancoNulo: 70, abstencao: 10 },
  abstencao: { A: 5, B: 5, brancoNulo: 5, abstencao: 85 }
};
const PROP = { brancos: 4, nulos: 3, anulados: 1, anuladosSubJudice: 0, anuladosApuracaoSeparada: 0 };
const st = (extra, opcoes) => plano(SegundoTurno.apurar({ opcoes: opcoes || {} }, { disputaId: "D", eleitorado: 1000,
  primeiroTurno: T1, finalistas: ["A", "B"], pesos: PESOS, proporcoesInvalidos2: PROP, ...(extra || {}) }, null).resultado);

test("2º turno: matriz origem e destino e decomposição dos inválidos pela D59", () => {
  // 1º turno: 700 válidos + 80 inválidos + 200 abstenções + 20 seções = 1000.
  // Origem A 300: 270, 6, 9, 15. Origem B 250: 5, 225, 7,5, 12,5 -> 5, 225, 7, 13 (resto igual: abstencao antes de brancoNulo).
  // Origem C 150: 75, 45, 15, 15. Brancos, nulos e anulados 80: 8, 8, 56, 8. Abstenção 200 (seções mantidas): 10, 10, 10, 170.
  // Totais: A 368, B 294, brancoNulo 97, abstenção 221; 368 + 294 + 97 + 221 = 980 = 1000 - 20.
  // Inválidos 97 em 4 : 3 : 1 : 0 : 0 -> 48,5, 36,375, 12,125 -> 49, 36, 12.
  const r = st();
  assert.deepEqual(r.votos, { A: 368, B: 294 });
  assert.deepEqual([r.validos, r.comparecimento, r.abstencao, r.eleitoresSecoesNaoInstaladas], [662, 759, 221, 20]);
  assert.deepEqual([r.brancos, r.nulos, r.anulados, r.anuladosSubJudice, r.anuladosApuracaoSeparada], [49, 36, 12, 0, 0]);
  assert.equal(r.eleito, "A");
  assert.deepEqual(r.transferencias.B, { A: 5, B: 225, brancoNulo: 7, abstencao: 13 });
});

test("2º turno: seções não instaladas do 2º turno ajustam a origem abstenção", () => {
  // Seções 30 no 2º turno: origem abstenção = 200 + 20 - 30 = 190 -> 9,5 em A, B e brancoNulo, 161,5 em abstenção
  // -> 10, 10, 9, 161 (restos iguais: A, B, abstencao, brancoNulo). Soma da matriz 970 = 1000 - 30.
  const r = st({ eleitoresSecoesNaoInstaladas2: 30 });
  assert.deepEqual(r.transferencias.abstencao, { A: 10, B: 10, brancoNulo: 9, abstencao: 161 });
  assert.equal(r.comparecimento + r.abstencao + r.eleitoresSecoesNaoInstaladas, 1000);
  assert.equal(r.eleitoresSecoesNaoInstaladas, 30);
  assert.throws(() => st({ eleitoresSecoesNaoInstaladas2: 221 }), ERRO); // excede abstenção e seções do 1º turno
});

test("2º turno: não modelados do 1º turno entram como origem própria", () => {
  const t1 = { ...T1, votos: { A: 300, B: 250, C: 100 }, votosNaoModelados: 50 };
  const r = st({ primeiroTurno: t1, pesos: { ...PESOS, "naoModelados:D": { A: 1, B: 1, brancoNulo: 1, abstencao: 1 } } });
  assert.deepEqual(r.transferencias["naoModelados:D"], { A: 13, B: 13, brancoNulo: 12, abstencao: 12 }); // 12,5 cada: A e B levam
  assert.throws(() => st({ primeiroTurno: t1 }), ERRO); // origem com votos sem pesos
});

test("2º turno: empate entre os finalistas vai ao desempate técnico", () => {
  // A 300 (9,1,1,1)/12: 225, 25, 25, 25; B 300 simétrico; inválidos 100 (1,1,1,1): 25 cada -> A 275, B 275.
  const t1 = { votos: { A: 300, B: 300 }, brancos: 100, nulos: 0, anulados: 0, anuladosSubJudice: 0, anuladosApuracaoSeparada: 0,
    abstencao: 0, eleitoresSecoesNaoInstaladas: 0 };
  const pesos = { A: { A: 9, B: 1, brancoNulo: 1, abstencao: 1 }, B: { A: 1, B: 9, brancoNulo: 1, abstencao: 1 },
    brancoNuloAnulado: { A: 1, B: 1, brancoNulo: 1, abstencao: 1 } };
  const base = { eleitorado: 700, primeiroTurno: t1, pesos };
  const chamadas = [];
  const r = st(base, { resolverDesempateTecnico: (e, ctx) => { chamadas.push(plano([e, ctx.tipo])); return { vencedorId: "B" }; } });
  assert.deepEqual([r.votos, r.eleito], [{ A: 275, B: 275 }, "B"]);
  assert.deepEqual(chamadas, [[["A", "B"], "segundoTurno"]]);
  assert.throws(() => st(base), /desempate técnico necessário/);
});

test("2º turno: identidades em cenários gerados", () => {
  let e = RNG.criar("v1-SEGUNDO-TURNO", "mundo");
  const s = (n) => { const r = RNG.inteiro(e, n); e = r.rngStateNext; return r.valor; };
  const peso = () => ({ A: 1 + s(100), B: 1 + s(100), brancoNulo: 1 + s(100), abstencao: 1 + s(100) });
  for (let k = 0; k < 300; k++) {
    const votos = { A: s(100000), B: s(100000), C: s(50000) };
    const t1 = { votos, votosNaoModelados: s(2) ? s(1000) : 0, brancos: s(5000), nulos: s(5000), anulados: s(500),
      anuladosSubJudice: s(100), anuladosApuracaoSeparada: s(100), abstencao: s(80000), eleitoresSecoesNaoInstaladas: s(500) };
    const eleitorado = Object.values(votos).reduce((a, b) => a + b, 0) + t1.votosNaoModelados + t1.brancos + t1.nulos +
      t1.anulados + t1.anuladosSubJudice + t1.anuladosApuracaoSeparada + t1.abstencao + t1.eleitoresSecoesNaoInstaladas;
    const pesos = { A: peso(), B: peso(), C: peso(), brancoNuloAnulado: peso(), abstencao: peso() };
    if (t1.votosNaoModelados > 0) pesos["naoModelados:D"] = peso();
    const r = plano(SegundoTurno.apurar({ opcoes: { resolverDesempateTecnico: (x) => ({ vencedorId: x[0] }) } },
      { disputaId: "D", eleitorado, primeiroTurno: t1, finalistas: ["A", "B"], pesos, proporcoesInvalidos2: { brancos: 1 + s(9), nulos: 1 + s(9), anulados: s(3), anuladosSubJudice: s(2), anuladosApuracaoSeparada: s(2) } }, null).resultado);
    assert.equal(r.comparecimento + r.abstencao + r.eleitoresSecoesNaoInstaladas, eleitorado);
    assert.equal(r.validos + r.brancos + r.nulos + r.anulados + r.anuladosSubJudice + r.anuladosApuracaoSeparada, r.comparecimento);
    assert.equal(r.validos, r.votos.A + r.votos.B);
    for (const [o, t] of Object.entries(r.transferencias)) {
      const n = o === "abstencao" ? t1.abstencao : o === "brancoNuloAnulado" ? t1.brancos + t1.nulos + t1.anulados + t1.anuladosSubJudice + t1.anuladosApuracaoSeparada : o === "naoModelados:D" ? t1.votosNaoModelados : votos[o];
      assert.equal(t.A + t.B + t.brancoNulo + t.abstencao, n);
    }
  }
});

test("2º turno: validações", () => {
  assert.throws(() => st({ pesos: { ...PESOS, C: { A: 50, B: 30, brancoNulo: 0, abstencao: 10 } } }), ERRO); // transfere integralmente
  assert.throws(() => st({ pesos: { ...PESOS, X: { A: 1, B: 1, brancoNulo: 1, abstencao: 1 } } }), ERRO);   // origem desconhecida
  assert.throws(() => st({ pesos: { ...PESOS, C: { A: 1, B: 1, brancoNulo: 1 } } }), ERRO);                 // destino faltando
  assert.throws(() => st({ eleitorado: 999 }), ERRO);                                                        // 1º turno não fecha
  assert.throws(() => st({ finalistas: ["A", "Z"] }), ERRO);
  assert.throws(() => st({ finalistas: ["A", "A"] }), ERRO);
  assert.throws(() => st({ proporcoesInvalidos2: { brancos: 0, nulos: 0, anulados: 0, anuladosSubJudice: 0, anuladosApuracaoSeparada: 0 } }), ERRO);
  assert.throws(() => st({ primeiroTurno: { ...T1, votos: { ...T1.votos, abstencao: 0 }, abstencao: 200 } }), /id reservado/); // id reservado
});
