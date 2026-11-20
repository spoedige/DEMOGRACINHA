"use strict";
// Troca de partido e de domicílio (D83). Catálogo artificial de tools/cenarios/troca-exemplo.json.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Mudancas, Save } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), TROCA = ler("troca-exemplo.json"), CAT = ler("cartas-exemplo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = (mod) => { const d = Object.assign(clone(TROCA), { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas) }); if (mod) mod(d); return d; };
const novo = () => { const c = clone(CEN); delete c.eleicoes; c.ritmo = "normal"; return Carreira.criar({}, c, null).resultado; };
const em = (e, ano, janela) => { const x = clone(e); x.tempo = { ano, janela }; return x; };
const vereador = (e) => { e.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }]; return e; };
const prefeito = (e) => { e.cargos.mandatos = [{ disputaId: "D", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }]; return e; };
const jogar = (e, dec) => Carreira.avancar(e, dados(), { decisoes: Object.assign({ carta: "agenda-bairro" }, dec) }).resultado;

test("catálogo de troca válido; valores e listas conferidos", () => {
  assert.doesNotThrow(() => Mudancas.validarCatalogo(dados()));
  for (const m of [(d) => { delete d.trocaPartido; }, (d) => { d.trocaPartido.cupulaEntrada = 1.5; }, (d) => { d.trocaPartido.partidos = []; },
    (d) => { d.trocaPartido.municipios = [{ id: "EX001" }]; }, (d) => { delete d.trocaPartido.fatorParaquedista; }]) assert.throws(() => Mudancas.validarCatalogo(dados(m)), ERRO);
});

test("opções por janela: J1 do ano eleitoral (partido e domicílio), C1 do ano calmo (só partido), nada fora delas", () => {
  const j1 = Mudancas.opcoes(em(novo(), 2028, "J1"), dados());
  assert.deepEqual(plano(j1.partidos), ["P2", "P3", "P4"]); assert.deepEqual(plano(j1.municipios.map((m) => m.id)), ["EX002", "EY001"]);
  assert.equal(j1.bloqueioPartido, null); assert.equal(j1.bloqueioDomicilio, null); assert.equal(j1.dentroDaJanela, true);
  const c1 = Mudancas.opcoes(em(novo(), 2027, "C1"), dados());
  assert.equal(c1.bloqueioPartido, null); assert.deepEqual(plano(c1.municipios), []); assert.match(c1.bloqueioDomicilio, /só em J1/);
  assert.equal(Mudancas.opcoes(em(novo(), 2027, "C2"), dados()), null); assert.equal(Mudancas.opcoes(em(novo(), 2028, "J3"), dados()), null);
});

test("troca de partido na janela: filiação nova, histórico de filiações, custos e sem tag sem mandato", () => {
  const e = em(novo(), 2028, "J1");
  const r = jogar(e, { trocaPartido: "P2" });
  const p = r.estado.personagem;
  assert.equal(p.partidoId, "P2"); assert.equal(p.dataFiliacao, "2028-01-01");
  assert.deepEqual(plano(p.filiacoes), [{ partidoId: "P1", desde: "2025-06-01", ate: "2028-01-01", tipo: "filiacao", dentroDaJanela: false },
    { partidoId: "P2", desde: "2028-01-01", ate: null, tipo: "mudanca", dentroDaJanela: true }]);
  assert.equal(r.estado.relacoes.cupula, 0.2); assert.ok(Math.abs(r.estado.relacoes.bancada - 0.15) < 1e-12);
  assert.ok(Math.abs(r.estado.relacoes.credibilidade - 0.48) < 1e-12); assert.deepEqual(plano(p.tags), []);
  assert.ok(r.ocorrencias.some((o) => o.tipo === "trocaPartido" && o.para === "P2"));
  assert.throws(() => jogar(e, { trocaPartido: "P1" }), ERRO);                           // mesmo partido
  assert.throws(() => jogar(e, { trocaPartido: "P9" }), ERRO);
});

test("mandato proporcional: troca na janela sem perda; em C1 do ano calmo é bloqueada com aviso; majoritário troca e ganha a tag", () => {
  const r = jogar(vereador(em(novo(), 2028, "J1")), { trocaPartido: "P3" });
  assert.equal(r.estado.cargos.mandatos[0].situacao, "exercicio"); assert.ok(r.estado.personagem.tags.includes("infidelidadePartidaria"));
  const c1 = vereador(em(novo(), 2027, "C1"));
  assert.equal(Mudancas.opcoes(c1, dados()).bloqueioPartido, Mudancas.AVISO_JANELA);
  assert.throws(() => jogar(c1, { trocaPartido: "P3" }), /janela partidária/);
  const pr = jogar(prefeito(em(novo(), 2027, "C1")), { trocaPartido: "P3" });
  assert.equal(pr.estado.personagem.partidoId, "P3"); assert.ok(Math.abs(pr.estado.relacoes.credibilidade - 0.44) < 1e-12);   // fora da janela: perda maior
});

test("domicílio em J1: mesma UF muda o município; outra UF dá paraquedista e popularidade pela notoriedade nacional; com mandato, bloqueado", () => {
  const e = em(novo(), 2028, "J1"); e.indicadores.nacional = { notoriedade: 0.1, popularidade: 0.03, rejeicao: 0.01 };
  const mesma = jogar(e, { domicilio: "EX002" }).estado;
  assert.equal(mesma.personagem.municipioLocal, "EX002"); assert.equal(mesma.personagem.ufAtual, "EX"); assert.ok(!mesma.personagem.tags.includes("paraquedista"));
  assert.deepEqual(plano(mesma.indicadores.local), plano(e.indicadores.estadual));
  const outra = jogar(e, { domicilio: "EY001" }).estado;
  assert.equal(outra.personagem.ufAtual, "EY"); assert.ok(outra.personagem.tags.includes("paraquedista"));
  assert.deepEqual(plano(outra.indicadores.estadual), { notoriedade: 0.1, popularidade: 0.05, rejeicao: 0.01 });
  assert.equal(outra.personagem.ufInicial, "EX");                                         // a origem não muda
  const m = vereador(clone(e));
  assert.equal(Mudancas.opcoes(m, dados()).bloqueioDomicilio, Mudancas.AVISO_DOMICILIO);
  assert.throws(() => jogar(m, { domicilio: "EX002" }), /domicílio com mandato/);
  assert.throws(() => jogar(em(novo(), 2027, "C1"), { domicilio: "EX002" }), ERRO);     // ano calmo: só partido
});

test("prévia traz as opções na fase de ações; janela automática recusa a troca", () => {
  const d = dados(), e = em(novo(), 2028, "J1");
  const p = Carreira.previa(e, d, { decisoes: {} });
  assert.ok(p.mao); assert.deepEqual(plano(p.mudancas.partidos), ["P2", "P3", "P4"]);
  const auto = em(novo(), 2027, "C2");
  assert.throws(() => Carreira.avancar(auto, d, { decisoes: { trocaPartido: "P2" } }), ERRO);
});

test("save versão 5: migração de 4 recria as filiações e a UF atual; filiação aberta precisa ser o partido atual", () => {
  const e = novo();
  const v4 = JSON.parse(Save.serializar(e)); v4.saveVersion = 4; delete v4.personagem.filiacoes; delete v4.personagem.ufAtual;
  const m = Save.ler(JSON.stringify(v4));
  assert.equal(m.saveVersion, 7); assert.deepEqual(plano(m), plano(e));
  const x = clone(e); x.personagem.partidoId = "P2";
  assert.throws(() => Carreira.validar(x), /filiações/);
});
