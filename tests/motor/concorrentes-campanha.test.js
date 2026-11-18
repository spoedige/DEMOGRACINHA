"use strict";
// Etapa 5: módulos 2 (cadastro), 4 (sintéticos), 5 (opinião), 6 (máquina) e 7 (campanha), e pontuação da legenda (D71).
// Resultados esperados calculados à mão e comentados em cada teste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Pontuacao, Cadastro, Sinteticos, Opiniao, Maquina, Campanha } = carregarMotor().Motor;
const ERRO = { name: "TypeError" };
const perto = (a, b, tol = 1e-12) => assert.ok(Math.abs(a - b) < tol, a + " != " + b);

// ---------- Módulo 2 ----------
const PARTIDOS = ["PT", "PV", "PCDOB", "PL", "NOVO"];
const FEDS = [{ id: "FED", nome: "Federação", partidos: ["PT", "PV", "PCDOB"] }];
const IDENT = { PT: 0.2, PV: 0.05, PCDOB: 0.05, PL: 0.3 };
const prop = (extra) => plano(Cadastro.montarListasProporcionais({}, { disputaId: "D", partidos: PARTIDOS, federacoes: FEDS,
  identPartidaria: IDENT, semIdentificacao: 0.4, candidaturas: [{ id: "c1", partidoId: "PT" }, { id: "c2", partidoId: "PV" }, { id: "c3", partidoId: "PL" }], ...(extra || {}) }, null).resultado);

test("cadastro proporcional: federação como lista única com identificação somada; partidos isolados como listas", () => {
  const r = prop();
  assert.deepEqual(r.listas.map((l) => [l.id, l.membros, l.candidatos]), [
    ["FED", ["PCDOB", "PT", "PV"], ["c1", "c2"]], ["NOVO", ["NOVO"], []], ["PL", ["PL"], ["c3"]]]);
  perto(r.listas[0].identPartidaria, 0.3);   // 0,2 + 0,05 + 0,05
  perto(r.listas[2].identPartidaria, 0.3);
  assert.equal(r.listas[1].identPartidaria, 0); // sem identificação informada
});

test("cadastro proporcional: partido federado não é lista própria; sem coligação; validações", () => {
  assert.throws(() => prop({ listasDeclaradas: ["PT"] }), /partido federado/);
  assert.throws(() => prop({ listasDeclaradas: ["PL+NOVO"] }), ERRO);   // agrupamento sem federação
  assert.doesNotThrow(() => prop({ listasDeclaradas: ["FED", "PL"] }));
  assert.throws(() => prop({ coligacoes: [["PL", "NOVO"]] }), /coligação não existe/);
  assert.throws(() => prop({ federacoes: FEDS.concat([{ id: "F2", nome: "F2", partidos: ["PT", "NOVO"] }]) }), /duas federações/);
  assert.throws(() => prop({ candidaturas: [{ id: "c9", partidoId: "XX" }] }), ERRO);
  assert.throws(() => prop({ semIdentificacao: 0.5 }), ERRO);
  assert.throws(() => prop({ identPartidaria: { ...IDENT, XX: 0 } }), ERRO);
});

const chap = (chapas) => plano(Cadastro.montarChapasMajoritarias({}, { disputaId: "D", partidos: PARTIDOS, federacoes: FEDS,
  identPartidaria: IDENT, semIdentificacao: 0.4, chapas }, null).resultado);

test("cadastro majoritário: identChapa = Σ identificação × adesão; federação pela soma dos membros", () => {
  // X: PL 0,3 × 0,9 + NOVO 0 × 0,5 = 0,27. Y: FED 0,3 × 0,8 = 0,24.
  const r = chap([{ id: "X", titular: "PL", coligados: ["NOVO"], adesao: { PL: 0.9, NOVO: 0.5 } }, { id: "Y", titular: "FED", adesao: { FED: 0.8 } }]);
  perto(r.chapas[0].identChapa, 0.27);
  perto(r.chapas[1].identChapa, 0.24);
  assert.deepEqual(r.chapas.map((c) => [c.id, c.titular, c.coligados]), [["X", "PL", ["NOVO"]], ["Y", "FED", []]]);
});

test("cadastro majoritário: cada ator em uma chapa só; validações", () => {
  assert.throws(() => chap([{ id: "X", titular: "PL", adesao: { PL: 1 } }, { id: "Y", titular: "NOVO", coligados: ["PL"], adesao: { NOVO: 1, PL: 1 } }]), /mais de uma chapa/);
  assert.throws(() => chap([{ id: "X", titular: "PT", adesao: { PT: 1 } }]), /federado entra pela federação/);
  assert.throws(() => chap([{ id: "X", titular: "PL", coligados: ["NOVO"], adesao: { PL: 1 } }]), /adesão ausente/);
  assert.throws(() => chap([{ id: "X", titular: "PL", adesao: { PL: 1, NOVO: 1 } }]), /fora da chapa/);
  assert.throws(() => chap([{ id: "X", titular: "PL", adesao: { PL: 1.2 } }]), ERRO);
  assert.throws(() => chap([{ id: "X", titular: "XX", adesao: { XX: 1 } }]), ERRO);
});

// ---------- Módulo 4 ----------
const decimal = (e) => RNG.decimal(e);
const gerar = (extra, opcoes) => Sinteticos.gerar({ opcoes: opcoes || { sortearQ: decimal, sortearR: decimal } },
  { semente: "v1-SINT", unidadeId: "3550308", listaId: "PL", eleicaoId: "2028", quantidadeSinteticos: 3, quadros: 0.5, capilaridade: 0.4, ...(extra || {}) });

test("sintéticos: subfluxo da semente e das chaves; mesma semente recria; atributos multiplicados", () => {
  const a = plano(gerar()), b = plano(gerar());
  assert.deepEqual(a, b);
  assert.deepEqual(a.resultado.map((s) => s.id), ["sint:PL:0", "sint:PL:1", "sint:PL:2"]);
  // primeiro sintético: q e r são os dois primeiros decimais do subfluxo
  let e = RNG.criar("v1-SINT", "eleicao", "sinteticos", "3550308", "PL", "2028");
  const q = RNG.decimal(e); const r = RNG.decimal(q.rngStateNext);
  perto(a.resultado[0].opiniao, 0.5 * q.valor);
  perto(a.resultado[0].maquinaEfetiva, 0.4 * r.valor);
  assert.notDeepEqual(plano(gerar({ listaId: "PT" })).resultado.map((s) => s.opiniao), a.resultado.map((s) => s.opiniao));
  assert.deepEqual(plano(gerar({ quantidadeSinteticos: 0 })).resultado, []);
  assert.equal(Sinteticos.designacao(a.resultado[1]), "Candidatura sintética 2 (PL)");
});

test("sintéticos: sorteadores injetados validados; valor acima de 1 é cortado no produto", () => {
  assert.throws(() => gerar({}, { sortearQ: decimal }), /sorteador injetado/);
  assert.throws(() => gerar({}, { sortearQ: (e) => ({ valor: -1, rngStateNext: e }), sortearR: decimal }), /inválido/);
  assert.throws(() => gerar({}, { sortearQ: () => ({ valor: 0.1, rngStateNext: RNG.criar("v1-X", "eleicao") }), sortearR: decimal }), /trocou de fluxo/);
  const r = plano(gerar({ quadros: 1, capilaridade: 1 }, { sortearQ: (e) => ({ valor: 3, rngStateNext: e }), sortearR: (e) => ({ valor: 0.5, rngStateNext: e }) }));
  assert.deepEqual([r.resultado[0].opiniao, r.resultado[0].maquinaEfetiva], [1, 0.5]);
  assert.throws(() => gerar({ quadros: 1.5 }), ERRO);
});

// ---------- Módulo 5 ----------
test("opinião: popularidade + α × sem opinião − k × rejeição, cortada em [0, 1]", () => {
  const r = plano(Opiniao.calcular({}, { alpha: 0.5, k: 1, candidatos: [
    { id: "A", desconhecimento: 0.4, popularidade: 0.3, rejeicao: 0.2, semOpiniao: 0.1 },   // 0,3 + 0,05 - 0,2 = 0,15
    { id: "B", desconhecimento: 0.3, popularidade: 0.1, rejeicao: 0.5, semOpiniao: 0.1 }    // negativo -> 0
  ] }, null).resultado);
  perto(r.A, 0.15);
  assert.equal(r.B, 0);
  const c = { id: "A", desconhecimento: 0.4, popularidade: 0.3, rejeicao: 0.2, semOpiniao: 0.1 };
  assert.throws(() => Opiniao.calcular({}, { alpha: 0.5, k: 1, candidatos: [{ ...c, semOpiniao: 0.2 }] }, null), /não somam 1/);
  assert.throws(() => Opiniao.calcular({}, { alpha: 0.5, k: 1, candidatos: [{ ...c, identPartidaria: 0.3 }] }, null), /não entra na opinião/);
  assert.throws(() => Opiniao.calcular({}, { alpha: 1.5, k: 1, candidatos: [c] }, null), ERRO);
  assert.throws(() => Opiniao.calcular({}, { alpha: 0.5, k: -1, candidatos: [c] }, null), ERRO);
});

// ---------- Módulo 7 ----------
test("campanha: efeito da mobilização com retorno decrescente; zero dá zero", () => {
  assert.equal(Campanha.efeitoMobilizacao(0, 100), 0);
  perto(Campanha.efeitoMobilizacao(100, 100), 1 - Math.exp(-1));
  const a = Campanha.efeitoMobilizacao(100, 100), b = Campanha.efeitoMobilizacao(200, 100), c = Campanha.efeitoMobilizacao(300, 100);
  assert.ok(b - a < a - 0 && c - b < b - a && c < 1);
  assert.throws(() => Campanha.efeitoMobilizacao(10, 0), ERRO);
  assert.throws(() => Campanha.efeitoMobilizacao(-1, 10), ERRO);
});

test("campanha: alocações com reserva, padrão proporcional ao eleitorado e limite do fundo", () => {
  const r = plano(Campanha.alocarRecursos({}, { fundoDisponivel: 1000, alocExposicao: { J1: 200, J2: 100 }, alocMobilizacao: { M1: 300 } }, null).resultado);
  assert.deepEqual([r.reserva, r.gastoEfetivo], [400, 600]);
  // padrão: 100 entre M1 (3) e M2 (1) -> 75 e 25
  const p = plano(Campanha.alocarRecursos({}, { fundoDisponivel: 100, totalMobilizacao: 100,
    municipiosBase: [{ id: "M1", eleitorado: 3 }, { id: "M2", eleitorado: 1 }] }, null).resultado);
  assert.deepEqual([p.alocMobilizacao, p.reserva], [{ M1: 75, M2: 25 }, 0]);
  assert.throws(() => Campanha.alocarRecursos({}, { fundoDisponivel: 500, alocExposicao: { J1: 300 }, alocMobilizacao: { M1: 300 } }, null), /excedem o fundo/);
  assert.throws(() => Campanha.alocarRecursos({}, { fundoDisponivel: 500, alocMobilizacao: { M1: 1 }, totalMobilizacao: 1 }, null), ERRO);
  assert.throws(() => Campanha.alocarRecursos({}, { fundoDisponivel: 500, alocExposicao: { J1: 1.5 } }, null), ERRO);
  assert.throws(() => Campanha.alocarRecursos({}, { fundoDisponivel: 500, totalMobilizacao: 10 }, null), /municipiosBase/);
});

test("campanha: conversão de exposição injetada; partição de saída garantida", () => {
  const op = { desconhecimento: 0.5, popularidade: 0.2, rejeicao: 0.1, semOpiniao: 0.2 };
  const conv = (o) => ({ opiniao: { desconhecimento: o.desconhecimento - 0.1, popularidade: o.popularidade + 0.05, rejeicao: o.rejeicao, semOpiniao: o.semOpiniao + 0.05 } });
  const r = plano(Campanha.aplicarExposicao({ opcoes: { conversorExposicao: conv } }, { opiniao: op, entradas: {}, parametros: {} }, null).resultado);
  perto(r.desconhecimento, 0.4); perto(r.popularidade, 0.25);
  assert.throws(() => Campanha.aplicarExposicao({ opcoes: { conversorExposicao: (o) => ({ opiniao: { ...o, popularidade: 0.9 } }) } }, { opiniao: op }, null), /não somam 1/);
  assert.throws(() => Campanha.aplicarExposicao({}, { opiniao: op }, null), /conversorExposicao/);
});

// ---------- Módulo 6 ----------
const mun = (extra) => Maquina.calcularMunicipal({}, { semente: "v1-MAQ", eleicaoId: "2028", candidatoId: "C1", municipioId: "3550308",
  naBase: true, baseTerritorial: 0.2, estruturaAliada: 0.1, aliancaFormal: true, aliadosEstrutura: ["NOVO"], titularId: "PL",
  alocMobilizacao: 0, mobAliada: 0, escalaGasto: 100, sigmaT: 0, liderancas: [], ...(extra || {}) }, null).resultado;

test("máquina municipal: complemento dos quatro componentes", () => {
  // 1 - (1 - 0,2)(1 - 0,1)(1 - 0)(1 - 0) = 0,28
  perto(mun().maquinaEfetiva, 0.28);
  // lideranças com σt = 0: t1 = 0,5 × 0,4 = 0,2; t2 = 0,3 × 1 = 0,3; transferência = 1 - 0,8 × 0,7 = 0,44
  // máquina = 1 - 0,8 × 0,9 × 1 × 0,56 = 0,5968
  const r = mun({ liderancas: [{ id: "L1", tipo: "pessoa", forca: 0.5, aderencia: 0.4 }, { id: "L2", tipo: "pessoa", forca: 0.3, aderencia: 1 }] });
  perto(r.transferencia, 0.44);
  perto(r.maquinaEfetiva, 0.5968);
  // mobilização própria e de aliados somadas: R = 60 + 40 = 100 -> efeito 1 - e^-1
  perto(mun({ alocMobilizacao: 60, mobAliada: 40 }).efeitoMob, 1 - Math.exp(-1));
});

test("máquina municipal: transferência sorteada por par, determinística e cortada na força", () => {
  const L = [{ id: "L1", tipo: "pessoa", forca: 0.5, aderencia: 1 }];
  const a = mun({ liderancas: L, sigmaT: 0.8 }), b = mun({ liderancas: L, sigmaT: 0.8 });
  assert.equal(a.t.L1, b.t.L1);
  assert.notEqual(mun({ liderancas: L, sigmaT: 0.8, candidatoId: "C2" }).t.L1, a.t.L1);
  const z = RNG.normal(RNG.criar("v1-MAQ", "eleicao", "transferencia", "3550308", "L1", "C1", "2028")).valor;
  perto(a.t.L1, Math.min(0.5, 0.5 * Math.exp(0.8 * z - 0.32)));
  for (let i = 0; i < 200; i++) {
    const r = mun({ liderancas: L, sigmaT: 1.5, candidatoId: "C" + i });
    assert.ok(r.t.L1 >= 0 && r.t.L1 <= 0.5);
  }
});

test("máquina municipal: canais sem duplicação e condições da 6.1", () => {
  assert.throws(() => mun({ naBase: false }), /fora do conjunto da base/);
  assert.doesNotThrow(() => mun({ naBase: false, baseTerritorial: 0 }));
  assert.throws(() => mun({ aliancaFormal: false }), /coligação registrada ou federação/);
  assert.throws(() => mun({ aliadosEstrutura: ["PL"] }), /própria lista/);
  assert.throws(() => mun({ aliadosEstrutura: ["NOVO", "NOVO"] }), /repetido/);
  assert.throws(() => mun({ liderancas: [{ id: "PL", tipo: "partido", forca: 0.5, aderencia: 1 }] }), /só pessoas/);
  assert.throws(() => mun({ liderancas: [{ id: "L1", tipo: "pessoa", forca: 0.5, aderencia: 1 }, { id: "L1", tipo: "pessoa", forca: 0.2, aderencia: 1 }] }), /repetida/);
  assert.throws(() => mun({ mobAliada: -1 }), ERRO);
  assert.throws(() => mun({ escalaGasto: 0 }), ERRO);
});

test("máquina estadual ou nacional: média ponderada pelo eleitorado, sem dupla contagem", () => {
  // (100 × 0,5 + 300 × 0,1 + 600 × 0,2) ÷ 1000 = 0,2
  const r = plano(Maquina.agregarEstadualOuNacional({}, { eleitoradoTotal: 1000,
    municipiosBase: [{ id: "M1", eleitorado: 100, maquinaEfetiva: 0.5 }, { id: "M2", eleitorado: 300, maquinaEfetiva: 0.1 }],
    regional: { eleitorado: 600, maquina: 0.2, municipios: ["M3", "M4"] } }, null).resultado);
  perto(r.maquinaEfetiva, 0.2);
  assert.throws(() => Maquina.agregarEstadualOuNacional({}, { eleitoradoTotal: 1000, municipiosBase: [{ id: "M1", eleitorado: 100, maquinaEfetiva: 0.5 }],
    regional: { eleitorado: 600, maquina: 0.2, municipios: ["M1"] } }, null), /inclui município da base/);
  assert.throws(() => Maquina.agregarEstadualOuNacional({}, { eleitoradoTotal: 500, municipiosBase: [{ id: "M1", eleitorado: 100, maquinaEfetiva: 0.5 }],
    regional: { eleitorado: 600, maquina: 0.2 } }, null), /excede o total/);
});

// ---------- Pontuação da legenda ----------
test("pontuação efetiva da legenda: λ × ruído, Z em ordem de id; σ = 0 dá λ", () => {
  const rng = RNG.criar("v1-LEGENDA", "eleicao", "D");
  const a = Pontuacao.legendas([{ id: "PT", lambda: 0.4, sigma: 0.3 }, { id: "PL", lambda: 0.2, sigma: 0 }], rng);
  const b = Pontuacao.legendas([{ id: "PL", lambda: 0.2, sigma: 0 }, { id: "PT", lambda: 0.4, sigma: 0.3 }], rng);
  assert.deepEqual(plano(a), plano(b));
  assert.equal(a.resultado.PL, 0.2);
  const z1 = RNG.normal(rng), z2 = RNG.normal(z1.rngStateNext); // PL primeiro, PT segundo
  perto(a.resultado.PT, 0.4 * Math.exp(0.3 * z2.valor - 0.045));
  assert.deepEqual(plano(a.rngStateNext), plano(z2.rngStateNext));
  assert.throws(() => Pontuacao.legendas([{ id: "PT", lambda: -1, sigma: 0 }], rng), ERRO);
});
