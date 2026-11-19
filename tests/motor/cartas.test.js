"use strict";
// Cartas e ações por janela (D76). Catálogo artificial de tools/cenarios/cartas-exemplo.json.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Cartas, RNG } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CAT = ler("cartas-exemplo.json"), CEN = ler("carreira.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const carta = (id) => clone(CAT.cartas.find((c) => c.id === id));
const dadosCom = (mod) => { const d = { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas) }; if (mod) mod(d); return d; };
const novo = (mod) => { const c = clone(CEN); if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const rngC = RNG.criar("v1-CARTAS", "cartas");
// força o resultado dos sorteios de uma carta
const certa = (c) => { c.sucesso = { base: 1, pesoCapacidade: 0 }; c.risco.probBase = 0; c.risco.pesoCapacidade = 0; return c; };

test("catálogo de exemplo válido; regra de acoplamento recusa cartas fora da regra", () => {
  assert.doesNotThrow(() => Cartas.validarCatalogo(dadosCom()));
  const casos = [
    (d) => { d.cartas[2].custo = { recurso: "caixaPessoal", quantidade: 1, compromisso: d.cartas[4].custo.compromisso }; },   // duas moedas
    (d) => { d.cartas[2].efeitos.push({ alvo: "grupo.influencia", delta: 0.01 }, { alvo: "personagem.experiencia", delta: 1 }); }, // 3 estoques
    (d) => { d.cartas[2].risco.efeitos.push({ alvo: "relacoes.bancada", delta: -0.01 }); },     // 2 relações
    (d) => { d.cartas[2].efeitos = [{ alvo: "relacoes.cupula", delta: -0.05 }]; },             // sem ganho
    (d) => { d.cartas[0].custo = { recurso: "caixaPessoal", quantidade: 1 }; },                // segura com custo
    (d) => { d.cartas[0].efeitos = [{ alvo: "indicadores.local.popularidade", delta: 0.01 }]; }, // segura com ganho
    (d) => { d.cartas[6].pool.janelas = ["J3", "J4"]; },                                        // fundo fora da campanha
    (d) => { d.cartas[4].custo.compromisso.tipo = "repasseInstitucional"; },                   // repasse com relação
    (d) => { delete d.cartas[2].risco; },
    (d) => { delete d.cartas[2].atraso; },
    (d) => { d.cartas[2].efeitos.push({ alvo: "bolsos.caixaPessoal", delta: 0.5 }); },          // bolso com delta real
    (d) => { d.cartas[0].ambicoes = ["presidencia"]; },                                         // ambição fora da lista
    (d) => { d.parametrosCartas.acoesPorMao = 4; },
    (d) => { delete d.parametrosCartas; },
    (d) => { d.cartas.push(clone(d.cartas[2])); }                                              // id repetido
  ];
  for (const m of casos) assert.throws(() => Cartas.validarCatalogo(dadosCom(m)), ERRO);
});

test("mão: segura pela ambição (desempate por id), ações por peso, determinística", () => {
  const e = novo();
  const m = Cartas.montarMao(e, dadosCom(), rngC).resultado;
  assert.equal(m.segura, "agenda-bairro");                         // sem ambição: empate, menor id
  assert.equal(m.acoes.length, 2);
  assert.ok(m.acoes.every((x) => ["discurso-mesa", "mutirao", "acordo-lideranca"].includes(x)));
  assert.deepEqual(plano(Cartas.montarMao(e, dadosCom(), rngC)), plano(Cartas.montarMao(e, dadosCom(), rngC)));
  e.personagem.ambicao = ["legislativo"];
  assert.equal(Cartas.montarMao(e, dadosCom(), rngC).resultado.segura, "rotina-gabinete");
  e.personagem.ambicao = ["presidencia"];
  assert.throws(() => Cartas.montarMao(e, dadosCom(), rngC), ERRO);
  assert.throws(() => Cartas.montarMao(novo(), dadosCom(), RNG.criar("v1-X", "eventos")), ERRO);
  assert.throws(() => Cartas.montarMao(novo(), dadosCom((d) => { d.cartas = d.cartas.filter((c) => !c.segura); }), rngC), ERRO);
  const vistos = new Set();
  for (let i = 0; i < 60; i++) Cartas.montarMao(novo(), dadosCom(), RNG.criar("v1-M" + i, "cartas")).resultado.acoes.forEach((x) => vistos.add(x));
  assert.deepEqual([...vistos].sort(), ["acordo-lideranca", "discurso-mesa", "mutirao"]);
});

test("mão: pool, saldo e limite de compromissos decidem a elegibilidade; mão de 1 carta quando só a segura cabe", () => {
  const e = novo();
  const elegiveis = (est) => {
    const s = new Set();
    for (let i = 0; i < 40; i++) Cartas.montarMao(est, dadosCom((d) => { d.parametrosCartas.acoesPorMao = 3; }), RNG.criar("v1-E" + i, "cartas")).resultado.acoes.forEach((x) => s.add(x));
    return [...s].sort();
  };
  assert.deepEqual(elegiveis(e), ["acordo-lideranca", "discurso-mesa", "mutirao"]); // favor exige cargo; panfletagem exige J4/J5 e fundo
  const v = clone(e); v.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }]; v.bolsos.capitalEntrega = 1;
  assert.ok(elegiveis(v).includes("favor-emenda"));
  const c = clone(e); c.tempo = { ano: 2026, janela: "J4" }; c.bolsos.fundoCampanha = 100000;
  assert.ok(elegiveis(c).includes("panfletagem"));
  c.bolsos.fundoCampanha = 99999;
  assert.ok(!elegiveis(c).includes("panfletagem"));
  const pobre = clone(e); pobre.bolsos.caixaPessoal = 0; pobre.personagem.saude = 0.01; pobre.relacoes.cupula = 0;
  pobre.compromissos.ativos = [1, 2, 3, 4, 5].map((i) => ({ id: "K" + i, tipo: "votoEmProposta", ator: "P2", objeto: "x", prazo: { ano: 2027, janela: "C4" },
    custo: { recurso: "bancada", quantidade: 0 }, contrapartida: "x", seCumprir: "x", seRomper: "x", custoPoliticoDeRomper: 1, estado: "ativo" }));
  const m = Cartas.montarMao(pobre, dadosCom(), rngC).resultado;
  assert.deepEqual(plano(m.ids), ["agenda-bairro"]);
});

test("jogar: custo, efeitos, atraso agendado na sequência canônica e dois sorteios sempre", () => {
  const e = novo(); e.tempo = { ano: 2026, janela: "J5" };
  const d = dadosCom((x) => { x.cartas[2] = certa(x.cartas[2]); });
  const r = Cartas.jogar(e, d, rngC, { cartaId: "discurso-mesa" });
  const s = r.resultado.estado;
  assert.equal(s.bolsos.caixaPessoal, e.bolsos.caixaPessoal - 20000);
  assert.ok(Math.abs(s.indicadores.local.notoriedade - 0.23) < 1e-12);
  assert.ok(Math.abs(s.relacoes.cupula - 0.25) < 1e-12);
  assert.equal(r.resultado.sucesso, true); assert.equal(r.resultado.risco, false);
  assert.deepEqual(plano(s.filaEventos), [{ id: "discurso-mesa:2026J5", janelaAlvo: { ano: 2027, janela: "C2" },
    dados: { eventoId: "convite-oposicao", origemCartaId: "discurso-mesa", prob: 0.3, condicao: null, nivelCorrupcao: null } }]);
  assert.equal(s.historico.at(-1).cartaId, "discurso-mesa");
  const seg = Cartas.jogar(e, d, rngC, { cartaId: "agenda-bairro" });
  assert.deepEqual(plano(seg.rngStateNext), plano(r.rngStateNext)); // mesma quantidade de sorteios
  assert.deepEqual(plano(Carreira.deslocar({ ano: 2026, janela: "J5" }, 3)), { ano: 2027, janela: "C2" });
  assert.deepEqual(plano(Carreira.deslocar({ ano: 2027, janela: "C4" }, 7)), { ano: 2029, janela: "C1" });
  assert.deepEqual(plano(e.filaEventos), []); // entrada intacta
});

test("jogar: falha e risco pelos sorteios; capacidade desloca as chances", () => {
  const e = novo();
  const d = dadosCom((x) => { const c = x.cartas[2]; c.sucesso = { base: 0, pesoCapacidade: 0 }; c.risco.probBase = 1; c.risco.pesoCapacidade = 0; });
  const r = Cartas.jogar(e, d, rngC, { cartaId: "discurso-mesa" }).resultado;
  assert.equal(r.sucesso, false); assert.equal(r.risco, true);
  assert.ok(Math.abs(r.estado.indicadores.local.notoriedade - 0.21) < 1e-12);
  assert.ok(Math.abs(r.estado.indicadores.local.rejeicao - 0.05) < 1e-12);
  const d2 = dadosCom((x) => { x.cartas[2].sucesso = { base: 0, pesoCapacidade: 1 }; });
  const alta = novo(); alta.personagem.capacidade.comunicacao = 1;
  assert.equal(Cartas.jogar(alta, d2, rngC, { cartaId: "discurso-mesa" }).resultado.sucesso, true);
});

test("jogar: compromisso como custo e corrupção no Arquivo Vermelho", () => {
  const e = novo(); e.tempo = { ano: 2027, janela: "C3" };
  const r = Cartas.jogar(e, dadosCom(), rngC, { cartaId: "acordo-lideranca" }).resultado.estado;
  assert.equal(r.compromissos.ativos.length, 1);
  assert.deepEqual(plano(r.compromissos.ativos[0].prazo), { ano: 2028, janela: "J3" });
  assert.equal(r.compromissos.ativos[0].id, "acordo-lideranca:2027C3");
  assert.doesNotThrow(() => Carreira.validar(r));
  const v = novo(); v.bolsos.capitalEntrega = 2;
  const f = Cartas.jogar(v, dadosCom(), rngC, { cartaId: "favor-emenda" }).resultado.estado;
  assert.equal(f.bolsos.capitalEntrega, 1);
  assert.deepEqual(plano(f.personagem.arquivoVermelho), [{ cartaId: "favor-emenda", nivel: 1, ano: 2026, janela: "J1" }]);
  assert.equal(f.filaEventos[0].dados.nivelCorrupcao, 1);
});

test("invariante: popularidade e rejeição reduzidas na mesma proporção; com notoriedade 0, zeradas", () => {
  const e = novo();
  e.indicadores.local = { notoriedade: 0.2, popularidade: 0.15, rejeicao: 0.1 };
  e.indicadores.nacional = { notoriedade: 0, popularidade: 0.1, rejeicao: 0 };
  Cartas.ajustarIndicadores(e);
  assert.ok(Math.abs(e.indicadores.local.popularidade - 0.12) < 1e-12);
  assert.ok(Math.abs(e.indicadores.local.rejeicao - 0.08) < 1e-12);
  assert.deepEqual(plano(e.indicadores.nacional), { notoriedade: 0, popularidade: 0, rejeicao: 0 });
  const d = dadosCom((x) => { x.cartas[3] = certa(x.cartas[3]); x.cartas[3].efeitos[0].delta = 0.5; });
  const r = Cartas.jogar(novo(), d, rngC, { cartaId: "mutirao" }).resultado.estado.indicadores.local;
  assert.ok(r.popularidade + r.rejeicao <= r.notoriedade + 1e-12);
});

test("Carreira.avancar com catálogo: prévia, escolha manual obrigatória e segura na automática", () => {
  const d = dadosCom(), e = novo();
  const p = Carreira.previa(e, d, { decisoes: {} }).mao;
  assert.throws(() => Carreira.avancar(e, d, { decisoes: {} }), ERRO);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: "favor-emenda" } }), ERRO);
  const r = Carreira.avancar(e, d, { decisoes: { carta: p.acoes[0] } }).resultado;
  assert.equal(r.ocorrencias.find((o) => o.tipo === "carta").id, p.acoes[0]);
  const auto = Carreira.avancar(r.estado, d, {}).resultado;                 // J2 automática no Express
  assert.equal(auto.ocorrencias.find((o) => o.tipo === "carta").id, "agenda-bairro");
  assert.deepEqual(plano(auto.estado.historico.filter((h) => h.tipo === "carta").map((h) => h.cartaId)), [p.acoes[0], "agenda-bairro"]);
});

test("ritmo não altera a simulação com cartas, quando as manuais jogam a segura", () => {
  const rodar = (ritmo) => {
    const d = dadosCom();
    let e = novo((c) => { c.ritmo = ritmo; });
    while (e.tempo.ano < 2029) {
      const dec = Carreira.ehManual(e) ? { carta: Carreira.previa(e, d, { decisoes: {} }).mao.segura } : undefined;
      e = Carreira.avancar(e, d, { decisoes: dec }).resultado.estado;
    }
    const x = plano(e); delete x.ritmo; x.historico.forEach((h) => { delete h.manual; });
    return x;
  };
  assert.deepEqual(rodar("intenso"), rodar("express"));
});

test("sim.js --carreira --cartas: hash reproduzível e diferente do modo sem cartas", () => {
  const run = (...a) => JSON.parse(execFileSync("node", [path.join(RAIZ, "tools", "sim.js"), "--cenario",
    path.join(RAIZ, "tools", "cenarios", "carreira.json"), "--carreira", ...a], { encoding: "utf8" }));
  const cat = path.join(RAIZ, "tools", "cenarios", "cartas-exemplo.json");
  const a = run("--cartas", cat), b = run("--cartas", cat);
  assert.equal(a.hash, b.hash);
  assert.notEqual(a.hash, run().hash);
  assert.ok(a.ocorrencias.filter((o) => o.tipo === "carta").length === 20); // 4 anos: 6 + 4 + 6 + 4 janelas
});
