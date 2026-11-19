"use strict";
// Candidatura em J3 e ficha de oportunidade (D78). Modelos e catálogo artificiais de tools/cenarios/candidatura-exemplo.json.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");
const sim = require("../../tools/sim.js");

const Motor = carregarMotor().Motor;
const { Carreira, Candidatura, Maquina, Save } = Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), CAND = ler("candidatura-exemplo.json"), CAT = ler("cartas-exemplo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = (mod) => { const d = clone(CAND); if (mod) mod(d); return d; };
const opcoes = { opcoesEleicao: (x) => sim.opcoesDoCenario(Motor, x) };
const novo = (mod) => { const c = clone(CEN); delete c.eleicoes; if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const em = (e, ano, janela) => { const x = clone(e); x.tempo = { ano, janela }; return x; };
const ids = (os) => plano(os.map((o) => o.id));
const V = "vaga-na-lista:2028|VEREADOR|EX001|1", P = "indicacao-prefeitura:2028|PREFEITO|EX001|1", S = "indicacao-senado:2026|SENADOR|EX|1";

test("catálogo de oportunidades válido; tipo, cargo, custo, risco e condição conferidos", () => {
  assert.doesNotThrow(() => Candidatura.validarCatalogo(dados()));
  const casos = [
    (d) => { d.oportunidades[0].tipo = "convite"; },
    (d) => { d.oportunidades[0].cargos.push("PREFEITO"); },                       // majoritário em oferta proporcional
    (d) => { d.oportunidades[0].custo = { recurso: "fundoCampanha", quantidade: 1 }; }, // fundo só a partir de J4
    (d) => { d.oportunidades[0].risco = ""; },
    (d) => { d.oportunidades[1].condicao[0].alvo = "escopo.capital"; },
    (d) => { delete d.regrasCargo; },
    (d) => { delete d.governos; },
    (d) => { d.oportunidades.push(clone(d.oportunidades[0])); }
  ];
  for (const m of casos) assert.throws(() => Candidatura.validarCatalogo(dados(m)), ERRO);
});

test("ofertas em J3 de 2028: lista do partido com ficha descritiva; cabeça de chapa só com as condições", () => {
  const e = em(novo(), 2028, "J3");
  const o = Candidatura.ofertas(e, dados());
  assert.deepEqual(ids(o), [V]);
  assert.deepEqual(plano(o[0].ficha), { eleitoradoAlcancado: 60000, exposicaoEsperada: 0.02, recursoPolitico: 4, posicaoCoalizao: "aliado",
    papelEsperado: "coadjuvante", custo: { recurso: "caixaPessoal", quantidade: 50000 }, risco: "Disputa por votos dentro da própria lista.", aderenciaAmbicao: 0 });
  const f = clone(e); f.indicadores.local = { notoriedade: 0.6, popularidade: 0.3, rejeicao: 0.05 }; f.personagem.ambicao = ["executivo"];
  const o2 = Candidatura.ofertas(f, dados((d) => { d.ambicoes = ["executivo"]; }));
  assert.deepEqual(ids(o2), [P, V]);
  assert.equal(o2[0].ficha.papelEsperado, "protagonista"); assert.equal(o2[0].ficha.aderenciaAmbicao, 1);
  assert.equal(o2[0].listaOuChapaId, "CH1");
  f.relacoes.cupula = 0.2;
  assert.deepEqual(ids(Candidatura.ofertas(f, dados())), [V]);
});

test("ofertas: unidade, partido, saldo, lista cheia, módulo 3 e uma candidatura por ano", () => {
  const e = em(novo(), 2028, "J3"), d = dados();
  const sem = (mod) => { const x = clone(e); mod(x); return ids(Candidatura.ofertas(x, d)); };
  assert.deepEqual(sem((x) => { x.personagem.municipioLocal = "EX009"; }), []);
  assert.deepEqual(sem((x) => { x.personagem.partidoId = "P9"; }), []);
  assert.deepEqual(sem((x) => { x.bolsos.caixaPessoal = 49999; }), []);
  assert.deepEqual(sem((x) => { x.personagem.statusJuridico = "inelegibilidadeReconhecida"; }), []);
  assert.deepEqual(sem((x) => { x.personagem.dataNascimento = "2012-01-01"; }), []);                 // idade mínima no registro
  assert.deepEqual(sem((x) => { x.personagem.dataFiliacao = "2028-05-01"; }), []);                   // filiação após o prazo
  assert.deepEqual(sem((x) => { x.candidaturas = [{ ano: 2028, ofertaId: "x", disputaId: "y", cargo: "VEREADOR", unidadeId: "EX001", partidoId: "P1", listaOuChapaId: "P1", tipo: "proporcional" }]; }), []);
  const cheia = dados((x) => { x.modelosDisputa["2028"][0].limiteLista = 1; });
  assert.deepEqual(ids(Candidatura.ofertas(e, cheia)), []);
  assert.deepEqual(ids(Candidatura.ofertas(em(novo(), 2026, "J3"), d)), []);                         // senado: notoriedade estadual baixa
});

test("mandato atual: dois mandatos consecutivos de prefeito impedem a terceira indicação", () => {
  const e = em(novo(), 2028, "J3");
  e.indicadores.local = { notoriedade: 0.6, popularidade: 0.3, rejeicao: 0.05 };
  e.cargos.mandatos = [
    { disputaId: "D1", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2021-01-01", fim: "2024-12-31", situacao: "encerrado" },
    { disputaId: "D2", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }];
  assert.deepEqual(plano(Candidatura.mandatoAtual(e)), { cargo: "PREFEITO", unidadeId: "EX001", consecutivos: 2 });
  assert.ok(!ids(Candidatura.ofertas(e, dados())).includes(P));
  e.cargos.mandatos[0].fim = "2020-12-31"; e.cargos.mandatos[0].inicio = "2017-01-01"; e.cargos.mandatos[1].inicio = "2025-01-01";
  assert.equal(Candidatura.mandatoAtual(e).consecutivos, 1);
  assert.ok(ids(Candidatura.ofertas(e, dados())).includes(P));
});

test("J3: prévia em três fases, decisão obrigatória e registro com custo", () => {
  const d = dados((x) => { Object.assign(x, { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas) }); });
  const e = em(novo(), 2028, "J3");
  const p = Carreira.previa(e, d, { decisoes: {} });
  assert.equal(p.mao, null); assert.deepEqual(plano(p.eventos), []);
  assert.deepEqual(ids(p.candidaturas), [V]);
  const p2 = Carreira.previa(e, d, { decisoes: { candidatura: V } });
  assert.equal(p2.candidaturas, null); assert.ok(p2.mao.segura);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: p2.mao.segura } }), ERRO);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: p2.mao.segura, candidatura: "inexistente" } }), ERRO);
  const r = Carreira.avancar(e, d, { decisoes: { carta: p2.mao.segura, candidatura: V } }).resultado.estado;
  assert.equal(r.bolsos.caixaPessoal, e.bolsos.caixaPessoal - 50000);
  assert.deepEqual(plano(r.candidaturas), [{ ano: 2028, ofertaId: V, disputaId: "2028|VEREADOR|EX001|1", cargo: "VEREADOR", unidadeId: "EX001",
    partidoId: "P1", listaOuChapaId: "P1", tipo: "proporcional" }]);
  const n = Carreira.avancar(e, d, { decisoes: { carta: p2.mao.segura, candidatura: "naoConcorrer" } }).resultado;
  assert.deepEqual(plano(n.estado.candidaturas), []); assert.ok(n.ocorrencias.some((o) => o.tipo === "naoConcorreu"));
  assert.throws(() => Carreira.avancar(novo(), d, { decisoes: { carta: "agenda-bairro", candidatura: "naoConcorrer" } }), ERRO); // fora de J3
});

test("J5: disputa montada a partir do modelo, personagem eleito e mandato com unidade", () => {
  let e = em(novo(), 2028, "J3");
  e = Carreira.avancar(e, dados(), { decisoes: { candidatura: V }, opcoes }).resultado.estado;
  while (e.tempo.janela !== "J6") e = Carreira.avancar(e, dados(), { decisoes: Carreira.ehManual(e) ? {} : undefined, opcoes }).resultado.estado;
  const h = e.historico.find((x) => x.tipo === "eleicao");
  assert.equal(h.disputaId, "2028|VEREADOR|EX001|1"); assert.equal(typeof h.personagemEleito, "boolean");
  if (h.personagemEleito) assert.equal(e.cargos.mandatos[0].unidadeId, "EX001");
});

test("montagem da disputa: opinião do escopo com semOpiniao limitado a 0, máquina municipal da base, chapa substituída", () => {
  const e = em(novo(), 2028, "J3");
  e.indicadores.local = { notoriedade: 0.3, popularidade: 0.1, rejeicao: 0.2 };   // 0,3 - 0,1 - 0,2 dá resíduo negativo em ponto flutuante
  const c = { ano: 2028, ofertaId: P, disputaId: "2028|PREFEITO|EX001|1", cargo: "PREFEITO", unidadeId: "EX001", partidoId: "P1", listaOuChapaId: "CH1", tipo: "cabecaDeChapa" };
  const cen = Candidatura.montarDisputa(e, dados(), c);
  const a1 = cen.candidatos.find((x) => x.id === "A1");
  assert.equal(a1.opiniao.semOpiniao, 0); assert.ok(0.3 - 0.1 - 0.2 < 0);
  assert.equal(a1.maquina.municipal.naBase, true); assert.equal(a1.maquina.municipal.baseTerritorial, 0.2);
  assert.equal(cen.chapas.find((x) => x.id === "CH1").candidato, "A1");
  assert.ok(!cen.candidatos.some((x) => x.id === "X1"));
  assert.equal(cen.maquinaPersonagem, undefined);
  const fora = clone(e); fora.base.municipios = {};
  assert.equal(Candidatura.montarDisputa(fora, dados(), c).candidatos.find((x) => x.id === "A1").maquina.municipal.baseTerritorial, 0);
});

test("Senado (estadual): oferta com notoriedade estadual e máquina agregada com o agregado regional", () => {
  const e = em(novo(), 2026, "J3");
  e.indicadores.estadual = { notoriedade: 0.1, popularidade: 0.04, rejeicao: 0.01 }; e.base.agregadoRegional = 0.05;
  const o = Candidatura.ofertas(e, dados());
  assert.deepEqual(ids(o), [S]);
  const cen = Candidatura.montarDisputa(e, dados(), Object.assign({ ano: 2026, ofertaId: S }, o[0]));
  const m = cen.candidatos.find((x) => x.id === "A1").maquina.maquinaEfetiva;
  const mo = CAND.modelosDisputa["2026"][0], ag = mo.maquinaPersonagem.estadual;
  const mun = Maquina.calcularMunicipal({}, Object.assign(clone(ag.municipal), { naBase: true, baseTerritorial: 0.2, semente: e.semente, eleicaoId: mo.eleicaoId,
    candidatoId: "A1", municipioId: "EX001", titularId: "P1", escalaGasto: mo.parametros.escalaGasto, sigmaT: mo.parametros.sigmaT }), null).resultado.maquinaEfetiva;
  const reg = 1 - (1 - 0.05) * (1 - ag.regional.maquinaSemBase);
  const esperado = (ag.eleitoradoMunicipios.EX001 * mun + ag.regional.eleitorado * reg) / (ag.eleitoradoMunicipios.EX001 + ag.regional.eleitorado);
  assert.ok(Math.abs(m - esperado) < 1e-12);
});

test("personagem em duas disputas no mesmo ano é erro", () => {
  let e = em(novo(), 2028, "J5");
  e.candidaturas = [{ ano: 2028, ofertaId: V, disputaId: "2028|VEREADOR|EX001|1", cargo: "VEREADOR", unidadeId: "EX001", partidoId: "P1", listaOuChapaId: "P1", tipo: "proporcional" }];
  const d = dados(); d.eleicoes = { 2028: [ler("vereador.json")] };                 // cenário pronto com A1
  assert.throws(() => Carreira.avancar(e, d, { decisoes: {}, opcoes }), ERRO);
});

test("save: migração 2 para 3 exige data de filiação; sem inventar", () => {
  const e = novo();
  const v2 = JSON.parse(Save.serializar(e)); v2.saveVersion = 2; delete v2.candidaturas; delete v2.personagem.dataFiliacao;
  assert.throws(() => Save.ler(JSON.stringify(v2)), /dataFiliacao/);
  const m = Save.ler(JSON.stringify(v2), undefined, { dataFiliacao: "2025-06-01" });
  assert.equal(m.saveVersion, 4); assert.deepEqual(plano(m), plano(e)); // 2 -> 3 -> 4 em cadeia
  const comCampo = clone(v2); comCampo.personagem.dataFiliacao = "2025-06-01";
  assert.deepEqual(plano(Save.ler(JSON.stringify(comCampo))), plano(e));
});

test("sim.js --carreira --modelos: candidatura em J3, eleição em J5, hash reproduzível", () => {
  const run = () => JSON.parse(execFileSync("node", [path.join(RAIZ, "tools", "sim.js"), "--cenario", path.join(RAIZ, "tools", "cenarios", "carreira.json"),
    "--carreira", "--anos", "4", "--modelos", path.join(RAIZ, "tools", "cenarios", "candidatura-exemplo.json")], { encoding: "utf8" }));
  const a = run();
  assert.equal(a.hash, run().hash);
  assert.deepEqual(plano(a.ocorrencias.filter((o) => ["candidatura", "eleicao"].includes(o.tipo)).map((o) => o.tipo)), ["candidatura", "eleicao"]);
});
