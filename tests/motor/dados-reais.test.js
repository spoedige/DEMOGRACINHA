"use strict";
// Etapa 1B (D86): modelos de disputa a partir das bases reais e cláusula de desempenho (EC 97/2017).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");
const sim = require("../../tools/sim.js");

const M = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8"));
const REG = J("data/consolidado/partidos.json"), CFG = J("data/consolidado/parametros-modelos.json"), BR = J("public/data/eleicoes/BR.json");
const SP = J("public/data/eleicoes/SP.json"), CAND = J("tools/cenarios/candidatura-exemplo.json"), CEN = J("tools/cenarios/carreira.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
const ERRO = { name: "TypeError" };
const dadosAno = (ano, mods, extra) => Object.assign(clone(CAND), { modelosDisputa: { [ano]: mods }, regrasCargo: CFG.regrasCargo, governos: {} }, extra || {});
const pessoa = (mun, uf, partido) => {
  const c = clone(CEN); delete c.eleicoes;
  Object.assign(c.inicio.personagem, { municipioInicial: mun, ufInicial: uf, partidoId: partido });
  c.inicio.base.municipios = { [mun]: { forca: 0.2, custoManutencao: 0 } };
  return M.Carreira.criar({}, c, null).resultado;
};

test("municípios e partidos: 27 UFs, 5.571 municípios com eleitorado, ids internos sem acento", () => {
  const m = J("public/data/municipios.json");
  assert.equal(m.ufs.length, 27); assert.equal(m.municipios.length, 5571);
  assert.ok(m.municipios.every((x) => Number.isSafeInteger(x.eleitorado) && x.eleitorado > 0));
  assert.ok(REG.partidos.every((p) => /^[A-Z0-9]+$/.test(p.id)));
  assert.deepEqual(REG.federacoes.map((f) => f.id).sort(), ["FED_CIDADANIA_PSDB", "FED_PCDOB_PT_PV", "FED_PSOL_REDE"]);
});

test("modelos municipais de 2028 (base 2024): vagas, taxas exatas e listas com federação", () => {
  const ms = M.Modelos.doAno(2028, SP, BR, REG, CFG, "3550308", "SP");
  const v = ms.find((x) => x.disputa.cargo === "VEREADOR"), p = ms.find((x) => x.disputa.cargo === "PREFEITO");
  assert.equal(v.disputa.vagas, 55); assert.equal(v.limiteLista, 56);
  assert.equal(v.taxasEleitorado.comparecimento.denominador, v.eleitorado);
  assert.ok(v.sinteticos.FED_PCDOB_PT_PV && !v.sinteticos.PT);                         // federação disputa como lista única
  assert.equal(p.chapas.length, CFG.chapasMajoritarias);
  assert.ok(p.candidatos.every((c) => /^S_/.test(c.id)));                              // rivais sintéticos, sem nome real
  assert.deepEqual(plano(p.posse), { dataPosse: "2029-01-01", fimMandato: "2032-12-31", _nota: "datas (a confirmar)" });
  assert.equal(M.Modelos.doAno(2028, J("public/data/eleicoes/DF.json"), BR, REG, CFG, "5300108", "DF").length, 0); // Brasília sem eleição municipal
});

test("modelos gerais (base 2022): Senado com 2 vagas em 2026 e 1 em 2030; distrital no DF; presidente nacional", () => {
  const s26 = M.Modelos.doAno(2026, SP, BR, REG, CFG, "3550308", "SP"), s30 = M.Modelos.doAno(2030, SP, BR, REG, CFG, "3550308", "SP");
  assert.equal(s26.find((x) => x.disputa.cargo === "SENADOR").disputa.vagas, 2);
  assert.equal(s30.find((x) => x.disputa.cargo === "SENADOR").disputa.vagas, 1);
  assert.equal(s26.find((x) => x.disputa.cargo === "DEPUTADO_FEDERAL").disputa.vagas, 70);
  assert.equal(s26.find((x) => x.disputa.cargo === "PRESIDENTE").disputa.unidadeId, "BR");
  const df = M.Modelos.doAno(2026, J("public/data/eleicoes/DF.json"), BR, REG, CFG, "5300108", "DF");
  assert.ok(df.some((x) => x.disputa.cargo === "DEPUTADO_DISTRITAL") && !df.some((x) => x.disputa.cargo === "DEPUTADO_ESTADUAL"));
});

test("modelo real roda no motor: oferta em J3 e eleição com os eleitos iguais às vagas", () => {
  const ms = M.Modelos.doAno(2028, SP, BR, REG, CFG, "3550308", "SP"), d = dadosAno(2028, ms);
  let e = pessoa("3550308", "SP", "PT"); e.tempo = { ano: 2028, janela: "J3" };
  const of = M.Candidatura.ofertas(e, d).find((o) => o.cargo === "VEREADOR");
  assert.equal(of.listaOuChapaId, "FED_PCDOB_PT_PV");
  e = M.Candidatura.registrar(e, of, null);
  const cen = M.Candidatura.montarDisputa(e, d, e.candidaturas[0]); cen.semente = e.semente;
  const r = M.Eleicao.executar({ opcoes: sim.opcoesDoCenario(M, cen) }, cen, M.RNG.criar(e.semente, "eleicao", "t")).resultado;
  assert.equal(r.eleitos.length, 55);
});

test("cláusula: votos com distribuição em 9 UFs ou bancada mínima; arredondamento a uma casa (a confirmar)", () => {
  const regra = CFG.clausula.regras["2026"];
  const uf = (a, b, ea, eb) => ({ votos: { A: a, B: b }, eleitos: { A: ea, B: eb } });
  const r = {}; for (let i = 0; i < 27; i++) r["U" + i] = i < 9 ? uf(3, 97, 1, 9) : uf(1, 99, 0, 10);
  // A: 1,67% nacional (abaixo de 2,5%), 3% em 9 UFs, 9 deputados em 9 UFs: abaixo nos dois critérios
  assert.equal(M.Clausula.avaliar(r, regra).A.atinge, false);
  for (let i = 0; i < 13; i++) r["U" + i].eleitos = { A: 1, B: 9 };
  assert.equal(M.Clausula.avaliar(r, regra).A.atinge, true);                           // 13 deputados em 13 UFs
  const v = {}; for (let i = 0; i < 27; i++) v["U" + i] = uf(2.46, 97.54, 0, 10);
  assert.equal(M.Clausula.avaliar(v, regra).A.atinge, true);                           // 2,46% arredonda a 2,5%
  assert.throws(() => M.Clausula.avaliar({}, regra), ERRO);
});

test("cláusula na carreira: projeção determinística, partido abaixo perde exposição e recebe o evento de reação", () => {
  const ms = M.Modelos.doAno(2026, SP, BR, REG, CFG, "3550308", "SP");
  const cat = J("data/catalogo/catalogo-jogo.json");
  const cl = Object.assign({ base: BR.deputadoFederal2022, registro: REG }, CFG.clausula);
  const d = dadosAno(2026, ms, { clausula: cl, eventos: cat.eventos, personagens: cat.personagens, parametrosDegrau: cat.parametrosDegrau });
  let e = pessoa("3550308", "SP", "NOVO"); e.tempo = { ano: 2026, janela: "J5" }; e.ritmo = "intenso";
  const r = M.Carreira.avancar(e, d, { decisoes: {}, opcoes: { opcoesEleicao: (c) => sim.opcoesDoCenario(M, c) } }).resultado;
  const c = r.estado.conjuntura.clausula;
  assert.equal(c.valeDe, 2027); assert.ok(Array.isArray(c.partidosAbaixo));
  const r2 = M.Carreira.avancar(e, d, { decisoes: {}, opcoes: { opcoesEleicao: (x) => sim.opcoesDoCenario(M, x) } }).resultado;
  assert.deepEqual(plano(r2.estado.conjuntura.clausula), plano(c));                    // fluxo derivado próprio
  if (c.partidosAbaixo.includes("NOVO")) assert.ok(r.estado.filaEventos.some((x) => x.dados.eventoId === "partido-abaixo-da-clausula"));
  // justa causa: com a tag e o partido abaixo, o vereador troca fora da janela sem aviso de perda do mandato
  const v = pessoa("3550308", "SP", "NOVO"); v.tempo = { ano: 2027, janela: "C1" };
  v.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", unidadeId: "3550308", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio", papel: "titular" }];
  v.conjuntura.clausula = { ano: 2026, valeDe: 2027, agremiacoesAbaixo: ["NOVO"], partidosAbaixo: ["NOVO"] };
  const troca = { trocaPartido: { cupulaEntrada: 0.2, perdaBancada: 0.05, perdaCredibilidadeJanela: 0.02, perdaCredibilidadeFora: 0.06, fatorParaquedista: 0.5,
    partidos: ["NOVO", "PL"], municipios: [{ id: "3550308", uf: "SP" }] } };
  assert.equal(M.Mudancas.opcoes(v, troca).bloqueioPartido, M.Mudancas.AVISO_JANELA);
  v.personagem.tags.push("justaCausaClausula");
  assert.equal(M.Mudancas.opcoes(v, troca).bloqueioPartido, null);
});

test("calendário calculado para qualquer ano par sem entrada no catálogo (D90): carreira não trava em 2040 ou depois", () => {
  assert.deepEqual(plano(M.Modelos.calendarioPadrao(2040)), { dataRegistro: "2040-08-15", prazoFiliacao: "2040-04-07", prazoDesincompatibilizacao: "2040-04-07", _nota: "calendário calculado (a confirmar)" });
  assert.equal(M.Modelos.calendarioPadrao(2026).prazoFiliacao, "2026-04-04");                       // confere com o calendário de 2026
  for (const ano of [2040, 2042, 2044, 2060]) {
    const ms = M.Modelos.doAno(ano, SP, BR, REG, CFG, "3550308", "SP");
    assert.ok(ms.length >= 2, "modelos em " + ano);
  }
  assert.throws(() => M.Modelos.calendarioPadrao(2041), ERRO);
});
