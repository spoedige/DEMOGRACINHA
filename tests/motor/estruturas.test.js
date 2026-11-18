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
