"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Dados } = carregarMotor().Motor;
const ERRO = { name: "TypeError" };
const congeladoProfundo = (o) => Object.isFrozen(o) && Object.values(o).every((v) => !v || typeof v !== "object" || congeladoProfundo(v));

const DISPUTA = { id: "2026|DEPUTADO_FEDERAL|SP|1", ano: 2026, cargo: "DEPUTADO_FEDERAL", unidadeId: "SP", vagas: 70, turno: 1 };

test("identificadores estáveis: preservados, sem geração automática, formato validado", () => {
  const p = Dados.partido({ id: "PT", sigla: "PT", nome: "Partido dos Trabalhadores" });
  assert.equal(p.id, "PT");
  assert.equal(Dados.disputa(DISPUTA).id, DISPUTA.id);
  for (const id of ["", " PT", "P T", "-PT", "a".repeat(129), 13, null, "__proto__"]) {
    assert.throws(() => Dados.partido({ id, sigla: "X", nome: "X" }), ERRO);
  }
  assert.deepEqual(plano(Dados.federacao({ id: "FED_A", nome: "Federação A", partidos: ["PV", "PT", "PCDOB"] }).partidos), ["PCDOB", "PT", "PV"]);
});

test("campos obrigatórios", () => {
  assert.throws(() => Dados.unidade({ id: "3550308", tipo: "municipio" }), ERRO);
  assert.throws(() => Dados.unidade({ id: "3550308", tipo: "bairro", uf: "SP" }), ERRO);
  assert.equal(Dados.unidade({ id: "BR", tipo: "pais" }).uf, null);
  assert.throws(() => Dados.partido({ id: "PT", sigla: "", nome: "X" }), ERRO);
  assert.throws(() => Dados.federacao({ id: "F", nome: "F", partidos: ["PT"] }), ERRO);
  assert.throws(() => Dados.federacao({ id: "F", nome: "F", partidos: ["PT", "PT"] }), ERRO);
  assert.throws(() => Dados.disputa({ ...DISPUTA, cargo: "VICE_PREFEITO" }), ERRO);
  assert.throws(() => Dados.disputa({ ...DISPUTA, vagas: 0 }), ERRO);
  assert.throws(() => Dados.disputa({ ...DISPUTA, turno: 2 }), ERRO);
  assert.throws(() => Dados.disputa({ ...DISPUTA, votosPorEleitor: 2 }), ERRO);
  assert.throws(() => Dados.disputa({ ...DISPUTA, ano: 2025 }), ERRO);
  const sen = Dados.disputa({ id: "2026|SENADOR|SP|1", ano: 2026, cargo: "SENADOR", unidadeId: "SP", vagas: 2, turno: 1, votosPorEleitor: 2 });
  assert.equal(sen.votosPorEleitor, 2);
  assert.equal(Dados.disputa({ ...DISPUTA, id: "2026|PRESIDENTE|BR|2", cargo: "PRESIDENTE", unidadeId: "BR", vagas: 1, turno: 2 }).sistema, "majoritario");
  assert.throws(() => Dados.candidatura({ id: "C1", disputaId: DISPUTA.id, listaId: "PT", tipo: "individual" }), ERRO);
  assert.equal(Dados.candidatura({ id: "C2", disputaId: DISPUTA.id, listaId: "PT", tipo: "sintetica", pessoaId: "X" }).pessoaId, null);
});

test("dados estáticos congelados e sem estado de RNG; estado mutável só em EstadoEleicao", () => {
  const estaticos = [
    Dados.unidade({ id: "3550308", tipo: "municipio", uf: "SP" }),
    Dados.partido({ id: "PL", sigla: "PL", nome: "Partido Liberal" }),
    Dados.federacao({ id: "FED_A", nome: "Federação A", partidos: ["PT", "PV"] }),
    Dados.disputa(DISPUTA),
    Dados.candidatura({ id: "C1", disputaId: DISPUTA.id, listaId: "PL", tipo: "individual", pessoaId: "P1" })
  ];
  for (const o of estaticos) {
    assert.ok(congeladoProfundo(o));
    assert.ok(!JSON.stringify(o).includes("rng"));
  }
  const rng = RNG.criar("v1-X", "eleicao");
  const est = Dados.estadoEleicao({ disputaId: DISPUTA.id, fase: "preparada", rngState: rng });
  assert.ok(Object.isFrozen(est));
  assert.throws(() => Dados.estadoEleicao({ disputaId: DISPUTA.id, fase: "preparada", rngState: RNG.criar("v1-X", "mundo") }), ERRO);
  assert.throws(() => Dados.estadoEleicao({ disputaId: DISPUTA.id, fase: "votando", rngState: rng }), ERRO);
  assert.throws(() => Dados.estadoEleicao({ disputaId: DISPUTA.id, fase: "preparada", rngState: { s: [1, 2, 3, 4] } }), ERRO);
});

test("resultado da apuração conserva os válidos", () => {
  const r = Dados.resultadoApuracao({ disputaId: DISPUTA.id, validos: 10, votos: { B: 4, A: 6 } });
  assert.deepEqual(Object.keys(r.votos), ["A", "B"]);
  assert.throws(() => Dados.resultadoApuracao({ disputaId: DISPUTA.id, validos: 10, votos: { A: 6, B: 3 } }), ERRO);
  assert.throws(() => Dados.resultadoApuracao({ disputaId: DISPUTA.id, validos: 10, votos: { A: 11, B: -1 } }), ERRO);
  assert.throws(() => Dados.resultadoApuracao({ disputaId: DISPUTA.id, validos: 10, votos: { A: 9.5, B: 0.5 } }), ERRO);
});

test("resultado de cadeiras: cadeiras somam vagas; eleitos mais não preenchidas também", () => {
  const ok = Dados.resultadoCadeiras({ disputaId: DISPUTA.id, vagas: 3, cadeiras: { PT: 2, PL: 1 }, eleitos: ["C1", "C2"], naoPreenchidas: 1 });
  assert.equal(ok.naoPreenchidas, 1);
  assert.deepEqual(plano(ok.desempates), []);
  assert.throws(() => Dados.resultadoCadeiras({ disputaId: DISPUTA.id, vagas: 3, cadeiras: { PT: 2 }, eleitos: ["C1", "C2"], naoPreenchidas: 0 }), ERRO);
  assert.throws(() => Dados.resultadoCadeiras({ disputaId: DISPUTA.id, vagas: 3, cadeiras: { PT: 3 }, eleitos: ["C1", "C2"], naoPreenchidas: 0 }), ERRO);
  assert.throws(() => Dados.resultadoCadeiras({ disputaId: DISPUTA.id, vagas: 3, cadeiras: { PT: 3 }, eleitos: ["C1", "C1", "C2"], naoPreenchidas: 0 }), ERRO);
});

test("compatibilidade com o contrato D67: estado da eleição carrega rngState serializável", () => {
  const rng = RNG.criar("v1-CONTRATO", "eleicao", DISPUTA.id);
  const est = Dados.estadoEleicao({ disputaId: DISPUTA.id, fase: "preparada", rngState: rng });
  const volta = JSON.parse(JSON.stringify(est));
  const e2 = Dados.estadoEleicao(volta);
  assert.equal(RNG.u32(e2.rngState).valor, RNG.u32(est.rngState).valor);
});

const HERDADOS = ["constructor", "toString", "hasOwnProperty", "valueOf", "isPrototypeOf"];

test("identificadores iguais a propriedades herdadas são aceitos e não contam como repetidos", () => {
  for (const nome of HERDADOS) {
    assert.equal(Dados.partido({ id: nome, sigla: "X", nome: "X" }).id, nome);
  }
  const fed = Dados.federacao({ id: "FED_H", nome: "F", partidos: ["constructor", "toString", "hasOwnProperty"] });
  assert.equal(fed.partidos.length, 3);
  const r = Dados.resultadoCadeiras({ disputaId: "D1", vagas: 3, cadeiras: { constructor: 2, toString: 1 },
    eleitos: ["hasOwnProperty", "valueOf", "toString"], naoPreenchidas: 0 });
  assert.deepEqual(plano(r.cadeiras), { constructor: 2, toString: 1 });
  assert.throws(() => Dados.federacao({ id: "F", nome: "F", partidos: ["toString", "toString"] }), ERRO);
});

test("cargo com nome de propriedade herdada é recusado", () => {
  for (const cargo of HERDADOS.concat(["__proto__", "prototype", "vereador", 1, null])) {
    assert.throws(() => Dados.disputa({ ...DISPUTA, cargo }), ERRO);
  }
});

test("estado da eleição restaurado de JSON fica congelado em profundidade e isolado da referência externa", () => {
  const restaurado = JSON.parse(JSON.stringify(RNG.criar("v1-RESTAURA", "eleicao", "D1")));
  const est = Dados.estadoEleicao({ disputaId: "D1", fase: "preparada", rngState: restaurado });
  assert.ok(Object.isFrozen(est) && Object.isFrozen(est.rngState) && Object.isFrozen(est.rngState.s));
  const antes = RNG.u32(est.rngState).valor;
  restaurado.s[0] = (restaurado.s[0] + 1) >>> 0; // alterar o objeto de origem não afeta o estado validado
  restaurado.dominio = "mundo";
  assert.equal(RNG.u32(est.rngState).valor, antes);
  assert.equal(est.rngState.dominio, "eleicao");
  assert.ok(Object.isFrozen(RNG.validar(JSON.parse(JSON.stringify(restaurado))).s));
});

test("Senado: sem 2º turno; votos por eleitor obrigatórios e coerentes com ano e vagas", () => {
  const SEN = { id: "2026|SENADOR|SP|1", ano: 2026, cargo: "SENADOR", unidadeId: "SP", vagas: 2, turno: 1, votosPorEleitor: 2 };
  assert.equal(Dados.disputa(SEN).votosPorEleitor, 2);
  assert.throws(() => Dados.disputa({ ...SEN, turno: 2 }), ERRO);
  const { votosPorEleitor, ...semVotos } = SEN;
  assert.throws(() => Dados.disputa(semVotos), ERRO);
  assert.throws(() => Dados.disputa({ ...SEN, votosPorEleitor: 1, vagas: 1 }), ERRO); // 2026: renovação de dois terços
  assert.throws(() => Dados.disputa({ ...SEN, vagas: 1 }), ERRO);
  const s2030 = { ...SEN, id: "2030|SENADOR|SP|1", ano: 2030, vagas: 1, votosPorEleitor: 1 };
  assert.equal(Dados.disputa(s2030).vagas, 1);
  assert.throws(() => Dados.disputa({ ...s2030, vagas: 2, votosPorEleitor: 2 }), ERRO);
  assert.equal(Dados.disputa({ ...SEN, id: "2034|SENADOR|SP|1", ano: 2034 }).vagas, 2);
  for (const [cargo, ano] of [["PREFEITO", 2028], ["GOVERNADOR", 2026], ["PRESIDENTE", 2030]]) {
    assert.equal(Dados.disputa({ id: ano + "|" + cargo + "|X|2", ano, cargo, unidadeId: "X", vagas: 1, turno: 2 }).turno, 2);
  }
  // anos municipais não têm eleição ordinária para o Senado
  for (const ano of [2028, 2032]) {
    assert.throws(() => Dados.disputa({ ...SEN, id: ano + "|SENADOR|SP|1", ano, vagas: 1, votosPorEleitor: 1 }), ERRO);
    assert.throws(() => Dados.disputa({ ...SEN, id: ano + "|SENADOR|SP|1", ano }), ERRO);
  }
  assert.throws(() => Dados.disputa({ ...DISPUTA, ano: 2027 }), ERRO);
});

test("calendário ordinário por cargo: gerais desde 2026 e municipais desde 2028, a cada 4 anos", () => {
  const base = { id: "D", unidadeId: "X", vagas: 1, turno: 1 };
  const geral = ["DEPUTADO_FEDERAL", "DEPUTADO_ESTADUAL", "DEPUTADO_DISTRITAL", "GOVERNADOR", "PRESIDENTE"];
  const municipal = ["VEREADOR", "PREFEITO"];
  for (const cargo of geral) {
    for (const ano of [2026, 2030, 2034]) assert.equal(Dados.disputa({ ...base, cargo, ano }).ano, ano);
    for (const ano of [2024, 2027, 2028, 2032]) assert.throws(() => Dados.disputa({ ...base, cargo, ano }), ERRO);
  }
  for (const cargo of municipal) {
    for (const ano of [2028, 2032]) assert.equal(Dados.disputa({ ...base, cargo, ano }).ano, ano);
    for (const ano of [2024, 2026, 2029, 2030]) assert.throws(() => Dados.disputa({ ...base, cargo, ano }), ERRO);
  }
});
