"use strict";
// Estado da carreira, ciclo de janelas e save (D75). Cenário artificial de tools/cenarios/carreira.json.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");
const sim = require("../../tools/sim.js");

const { Carreira, Save } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const CEN = JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", "carreira.json"), "utf8"));
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const novo = (mod) => { const c = clone(CEN); if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const desfecho = (e, c, d) => { e.relacoes.credibilidade = d === "cumprido" ? 0.6 : 0.4; return e; };
function passo(e, entrada) { return Carreira.avancar(e, {}, entrada || {}).resultado; }
function compromisso(id, custoPolitico, qtd, prazo) {
  return { id, tipo: "repasseInstitucional", ator: "P2", objeto: "emenda", prazo: prazo || { ano: 2027, janela: "C2" },
    custo: { recurso: "capitalEntrega", quantidade: qtd }, contrapartida: "apoio", seCumprir: "x", seRomper: "y",
    custoPoliticoDeRomper: custoPolitico, estado: "ativo" };
}
// avança até a janela pedida com decisões vazias nas manuais
function ate(e, ano, janela) {
  while (!(e.tempo.ano === ano && e.tempo.janela === janela)) e = passo(e, { decisoes: Carreira.ehManual(e) ? {} : undefined }).estado;
  return e;
}

test("criar: estado inicial válido em J1 de 2026, com os quatro fluxos de RNG", () => {
  const e = novo();
  assert.deepEqual(plano(e.tempo), { ano: 2026, janela: "J1" });
  assert.deepEqual(Object.keys(e.rng).sort(), ["cartas", "eleicao", "eventos", "mundo"]);
  assert.equal(e.saveVersion, 5); assert.equal(e.personagem.municipioLocal, "EX001");
  assert.equal(Carreira.validar(e), e);
});

test("criar e validar: invariantes e escalas", () => {
  const casos = [
    (c) => { delete c.inicio; },
    (c) => { c.inicio.indicadores.local.popularidade = 0.18; },          // 0,18 + 0,03 > 0,2
    (c) => { c.inicio.personagem.potencial = 101; },
    (c) => { c.inicio.personagem.aptidoes.gestao = 1.2; },
    (c) => { c.inicio.bolsos.caixaPessoal = 10.5; },
    (c) => { c.inicio.relacoes.cupula = -0.1; },
    (c) => { c.ritmo = "turbo"; },
    (c) => { for (let i = 0; i < 11; i++) c.inicio.base.municipios["EX1" + i] = { forca: 0.1, custoManutencao: 0 }; }
  ];
  for (const m of casos) assert.throws(() => novo(m), ERRO);
  const e = novo(); e.compromissos.ativos = [1, 2, 3, 4, 5, 6].map((i) => compromisso("K" + i, 1, 0));
  assert.throws(() => Carreira.validar(e), ERRO);
  const f = novo(); f.compromissos.ativos = [Object.assign(compromisso("K1", 1, 0), { custo: { recurso: "fundoCampanha", quantidade: 1 } })];
  assert.throws(() => Carreira.validar(f), ERRO);
});

test("ciclo: seis janelas no ano eleitoral, quatro no calmo; manuais conforme o ritmo", () => {
  let e = novo((c) => { c.ritmo = "intenso"; });
  const vistas = [];
  for (let i = 0; i < 10; i++) { vistas.push(e.tempo.ano + e.tempo.janela + (Carreira.ehManual(e) ? "m" : "a")); e = passo(e, { decisoes: {} }).estado; }
  assert.deepEqual(vistas, ["2026J1m", "2026J2m", "2026J3m", "2026J4m", "2026J5m", "2026J6m", "2027C1m", "2027C2m", "2027C3m", "2027C4m"]);
  assert.deepEqual(plano(e.tempo), { ano: 2028, janela: "J1" });
  const manuais = (ritmo) => {
    let x = novo((c) => { c.ritmo = ritmo; }); const m = [];
    for (let i = 0; i < 10; i++) { if (Carreira.ehManual(x)) m.push(x.tempo.janela); x = passo(x, { decisoes: Carreira.ehManual(x) ? {} : undefined }).estado; }
    return m;
  };
  assert.deepEqual(manuais("normal"), ["J1", "J2", "J3", "J4", "J5", "J6", "C1", "C3"]);
  assert.deepEqual(manuais("express"), ["J1", "J3", "J5", "C1"]);
  assert.throws(() => passo(novo(), { decisoes: {} }) && passo(passo(novo(), { decisoes: {} }).estado, { decisoes: {} }), ERRO); // J2 automática no Express
});

test("ciclo: o ritmo não altera a simulação (mesmo estado, exceto ritmo e marcação manual)", () => {
  const rodar = (ritmo) => {
    const c = clone(CEN); c.ritmo = ritmo;
    const dir = path.join(RAIZ, "tools", "cenarios");
    const eleicoes = { 2028: c.eleicoes["2028"].map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) };
    let e = Carreira.criar({}, c, null).resultado;
    const opcoes = { opcoesEleicao: (x) => sim.opcoesDoCenario(carregarMotor().Motor, x) };
    while (e.tempo.ano < 2030) e = Carreira.avancar(e, { eleicoes }, { opcoes, decisoes: Carreira.ehManual(e) ? {} : undefined }).resultado.estado;
    const x = plano(e); delete x.ritmo; x.historico.forEach((h) => { delete h.manual; });
    return x;
  };
  const a = rodar("intenso"), b = rodar("express");
  assert.deepEqual(a, b);
  assert.equal(a.cargos.mandatos.length, 1);
});

test("compromissos em janela automática: prioridade por custo de romper, prazo e id; saldo verificado", () => {
  let e = ate(novo(), 2027, "C2");
  e.bolsos.capitalEntrega = 10;
  e.compromissos.ativos = [compromisso("K3", 5, 6), compromisso("K1", 9, 6), compromisso("K2", 5, 4)];
  const r = passo(e, { opcoes: { aplicarDesfecho: desfecho } });
  assert.deepEqual(plano(r.ocorrencias.filter((o) => o.tipo === "compromisso")),
    [{ tipo: "compromisso", id: "K1", desfecho: "cumprido" }, { tipo: "compromisso", id: "K2", desfecho: "cumprido" },
      { tipo: "compromisso", id: "K3", desfecho: "rompido" }]);
  assert.equal(r.estado.bolsos.capitalEntrega, 0);
  assert.equal(r.estado.compromissos.ativos.length, 0);
  assert.deepEqual(plano(r.estado.compromissos.historico.map((c) => c.estado)), ["cumprido", "cumprido", "rompido"]);
  assert.equal(r.estado.relacoes.credibilidade, 0.4); // último desfecho aplicado
  assert.throws(() => passo(e, {}), ERRO); // sem aplicarDesfecho
  assert.equal(e.compromissos.ativos.length, 3); // entrada intacta
});

test("compromissos em janela manual: decisão obrigatória; cumprir exige recurso", () => {
  let e = ate(novo(), 2027, "C1");
  e.compromissos.ativos = [compromisso("K1", 1, 3, { ano: 2027, janela: "C1" })];
  const op = { aplicarDesfecho: desfecho };
  assert.throws(() => passo(e, { opcoes: op, decisoes: {} }), ERRO);
  assert.throws(() => passo(e, { opcoes: op, decisoes: { compromissos: { K1: "cumprir" } } }), ERRO);
  const r = passo(e, { opcoes: op, decisoes: { compromissos: { K1: "romper" } } });
  assert.equal(r.estado.compromissos.historico[0].estado, "rompido");
  e.bolsos.capitalEntrega = 3;
  assert.equal(passo(e, { opcoes: op, decisoes: { compromissos: { K1: "cumprir" } } }).estado.bolsos.capitalEntrega, 0);
});

test("eventos da janela: em ordem de id, com resolvedor obrigatório e fluxo de eventos", () => {
  const e = novo();
  e.filaEventos = [{ id: "EV2", janelaAlvo: { ano: 2026, janela: "J1" }, dados: {} }, { id: "EV1", janelaAlvo: { ano: 2026, janela: "J1" }, dados: {} },
    { id: "EV3", janelaAlvo: { ano: 2027, janela: "C1" }, dados: {} }];
  const ordem = [];
  const r = passo(e, { decisoes: {}, opcoes: { resolverEvento: (s, ev, rng) => { ordem.push(ev.id); return { estado: s, rngStateNext: rng }; } } });
  assert.deepEqual(ordem, ["EV1", "EV2"]);
  assert.deepEqual(plano(r.estado.filaEventos.map((x) => x.id)), ["EV3"]);
  assert.throws(() => passo(e, { decisoes: {} }), ERRO);
});

test("mandato: posse na janela que começa na data de posse e fim após o término", () => {
  let e = novo();
  e.cargos.mandatos = [{ disputaId: "D1", cargo: "VEREADOR", inicio: "2026-08-16", fim: "2027-03-31", situacao: "eleito" }];
  e = passo(e, { decisoes: {} }).estado;                       // J1: ainda eleito
  assert.equal(e.cargos.mandatos[0].situacao, "eleito");
  e = ate(e, 2026, "J4"); e = passo(e, { decisoes: undefined }).estado;
  assert.equal(e.cargos.mandatos[0].situacao, "exercicio");
  e = ate(e, 2027, "C2"); e = passo(e).estado;
  assert.equal(e.cargos.mandatos[0].situacao, "encerrado");
});

test("save: serialização canônica, leitura de volta e versão mais nova recusada", () => {
  const e = ate(novo(), 2026, "J3");
  const t = Save.serializar(e);
  assert.equal(t, Save.serializar(JSON.parse(t)));
  assert.deepEqual(plano(Save.ler(t)), plano(e));
  const futuro = JSON.parse(t); futuro.saveVersion = 6;
  assert.throws(() => Save.ler(JSON.stringify(futuro)), /mais nova/);
  assert.throws(() => Save.ler("{x"), ERRO);
  assert.throws(() => Save.ler(JSON.stringify({ a: 1 })), ERRO);
});

test("save: export e import por código de texto, com acentos e caracteres fora do BMP", () => {
  const e = novo(); e.personagem.tags = ["situação regular, ação arquivada 𝄞"];
  const cod = Save.exportar(e);
  assert.match(cod, /^DG1:[A-Za-z0-9+/]+={0,2}$/);
  assert.deepEqual(plano(Save.importar(cod)), plano(e));
  assert.deepEqual(plano(Save.importar(cod.slice(0, 20) + "\n " + cod.slice(20))), plano(e)); // quebra de linha colada
  assert.throws(() => Save.importar(cod.slice(4)), ERRO);
  assert.throws(() => Save.importar(cod.slice(0, -3)), ERRO);
  assert.throws(() => Save.importar("DG1:////"), ERRO);
});

test("sim.js --carreira: hash reproduzível, outra semente muda o hash", () => {
  const arq = path.join(RAIZ, "tools", "cenarios", "carreira.json");
  const run = (...a) => JSON.parse(execFileSync("node", [path.join(RAIZ, "tools", "sim.js"), "--cenario", arq, "--carreira", ...a], { encoding: "utf8" }));
  const a = run(), b = run();
  assert.equal(a.hash, b.hash); assert.match(a.hash, /^[0-9a-f]{64}$/);
  assert.deepEqual(a.tempo, { ano: 2030, janela: "J1" });
  assert.notEqual(run("--semente", "v1-OUTRA").hash, a.hash);
});
