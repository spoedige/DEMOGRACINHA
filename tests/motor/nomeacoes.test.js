"use strict";
// Nomeações e desincompatibilização (D80). Catálogos artificiais de tools/cenarios.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");

const Motor = carregarMotor().Motor;
const { Carreira, Nomeacoes, Elegibilidade, Candidatura, Cartas, Save, RNG, Distribuicoes } = Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), NOM = ler("nomeacoes-exemplo.json"), CAND = ler("candidatura-exemplo.json"), CAT = ler("cartas-exemplo.json"), EVS = ler("eventos-exemplo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = (mod) => { const d = Object.assign(clone(CAND), { posicoes: clone(NOM.posicoes) }); if (mod) mod(d); return d; };
const comCartas = (mod) => dados((d) => { Object.assign(d, { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas), eventos: clone(EVS.eventos) }); if (mod) mod(d); });
const novo = (mod) => { const c = clone(CEN); delete c.eleicoes; c.ritmo = "normal"; if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const em = (e, ano, janela) => { const x = clone(e); x.tempo = { ano, janela }; return x; };
const ids = (os) => plano(os.map((o) => o.id));
const opcoes = { opcoesEleicao: (c) => Distribuicoes.opcoesDoCenario(c) };
const nomeado = (e, posicaoId, tipo, escopo, inicio) => { e.cargos.nomeacoes = [{ id: posicaoId + ":x", posicaoId, tipo, escopo, inicio: inicio || { ano: 2027, janela: "C1" },
  fim: null, situacao: "exercicio", motivoSaida: null, licencaMandato: null }]; return e; };

test("catálogo de posições válido; tipo, escopo, textos, condição e posição partidária sem Capital de Entrega", () => {
  assert.doesNotThrow(() => Nomeacoes.validarCatalogo(dados()));
  const casos = [(d) => { d.posicoes[0].tipo = "eleito"; }, (d) => { d.posicoes[0].escopo = "global"; }, (d) => { d.posicoes[0].orgao = ""; },
    (d) => { d.posicoes[0].condicao = [{ alvo: "capitalPolitico", op: ">=", valor: 1 }]; }, (d) => { d.posicoes[5].capitalEntregaPorJanela = 1; },
    (d) => { d.posicoes[5].exigeGovernoAliado = true; }, (d) => { d.posicoes[0].capitalEntregaPorJanela = 1.5; }, (d) => { d.posicoes.push(clone(d.posicoes[0])); }];
  for (const m of casos) assert.throws(() => Nomeacoes.validarCatalogo(dados(m)), ERRO);
});

test("ofertas em C1 e C3 de ano calmo: condição, governo aliado, um cargo por vez, chefe do Executivo e legislador com licença", () => {
  const e = em(novo(), 2027, "C1");
  assert.deepEqual(ids(Nomeacoes.ofertas(e, dados())), ["diretorio-municipal", "sec-obras-ex001"]); // estadual: oposição; federal: sem informação
  const f = dados((d) => { d.governos.nacional = { P1: "aliado" }; });
  const x = clone(e); x.relacoes.executivo = 0.5; x.indicadores.nacional = { notoriedade: 0.1, popularidade: 0.05, rejeicao: 0.01 };
  assert.deepEqual(ids(Nomeacoes.ofertas(x, f)), ["diretorio-municipal", "presidente-embratur", "sec-obras-ex001", "secex-turismo"]);
  assert.deepEqual(ids(Nomeacoes.ofertas(em(e, 2027, "C2"), dados())), []);
  assert.deepEqual(ids(Nomeacoes.ofertas(em(e, 2028, "J1"), dados())), []);
  assert.deepEqual(ids(Nomeacoes.ofertas(nomeado(clone(e), "diretorio-municipal", "partidaria", "municipal"), dados())), []);
  const pref = clone(e); pref.cargos.mandatos = [{ disputaId: "D", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }];
  assert.deepEqual(ids(Nomeacoes.ofertas(pref, dados())), []);
  const ver = clone(e); ver.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }];
  const o = Nomeacoes.ofertas(ver, dados());
  assert.deepEqual(ids(o), ["sec-obras-ex001"]); assert.equal(o[0].comLicenca, true);
  assert.deepEqual(plano(o[0].ficha), { capacidadeEntregaPorJanela: 2, exposicaoPorJanela: 0.005, posicaoCoalizao: "aliado", risco: "Obra atrasada vira desgaste local." });
});

test("prévia e decisão: fase de nomeações, obrigatória na manual, recusa na automática; aceite registra e soma presença", () => {
  const d = comCartas(), e = em(novo(), 2027, "C1");
  const p = Carreira.previa(e, d, { decisoes: {} });
  assert.deepEqual(ids(p.nomeacoes), ["diretorio-municipal", "sec-obras-ex001"]); assert.equal(p.mao, null);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: "agenda-bairro" } }), ERRO);
  const p2 = Carreira.previa(e, d, { decisoes: { nomeacao: "sec-obras-ex001" } });
  assert.equal(p2.nomeacoes, null); assert.ok(p2.mao.segura);
  const r = Carreira.avancar(e, d, { decisoes: { nomeacao: "sec-obras-ex001", carta: p2.mao.segura } }).resultado.estado;
  assert.deepEqual(plano(r.cargos.nomeacoes[0]), { id: "sec-obras-ex001:2027C1", posicaoId: "sec-obras-ex001", tipo: "governamental", escopo: "municipal",
    inicio: { ano: 2027, janela: "C1" }, fim: null, situacao: "exercicio", motivoSaida: null, licencaMandato: null });
  assert.equal(r.grupo.presenca.municipal, 1);
  assert.equal(r.bolsos.capitalEntrega, 2);                                         // exercício já na janela do aceite
  const rec = Carreira.avancar(e, d, { decisoes: { nomeacao: "recusar", carta: p2.mao.segura } }).resultado;
  assert.deepEqual(plano(rec.estado.cargos.nomeacoes), []); assert.ok(rec.ocorrencias.some((o) => o.tipo === "nomeacaoRecusada"));
  const auto = em(novo((c) => { c.ritmo = "express"; }), 2027, "C3");                // C3 automática no Express
  assert.deepEqual(plano(Carreira.avancar(auto, d, {}).resultado.estado.cargos.nomeacoes), []);
});

test("exercício por janela: Capital de Entrega, experiência e notoriedade do escopo; sem entrega em afastamento; partidária sem entrega", () => {
  const d = dados();
  const e = nomeado(em(novo(), 2027, "C2"), "sec-turismo-ex", "governamental", "estadual");
  const oc = [], x = clone(e);
  Nomeacoes.exercer(x, d, oc);
  assert.equal(x.bolsos.capitalEntrega, 3); assert.ok(Math.abs(x.personagem.experiencia - 0.5) < 1e-12);
  assert.ok(Math.abs(x.indicadores.estadual.notoriedade - (e.indicadores.estadual.notoriedade + 0.008)) < 1e-12);
  const af = clone(e); af.personagem.estadosTemporarios = [{ id: "A", tipo: "afastamentoCautelar", origem: "x", inicio: { ano: 2027, janela: "C1" }, fim: { ano: 2027, janela: "C4" } }];
  Nomeacoes.exercer(af, d, []); assert.equal(af.bolsos.capitalEntrega, 0);
  const pa = nomeado(clone(e), "diretorio-municipal", "partidaria", "municipal"); Nomeacoes.exercer(pa, d, []); assert.equal(pa.bolsos.capitalEntrega, 0);
});

test("legislador nomeado: licença do mandato, cartas de vereador fora da mão e cadeira reassumida ao deixar o cargo", () => {
  const d = comCartas();
  const e = em(novo(), 2029, "C1"); e.bolsos.capitalEntrega = 5;
  e.cargos.mandatos = [{ disputaId: "2028|VEREADOR|EX001|1", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2029-01-01", fim: "2032-12-31", situacao: "exercicio" }];
  const p = Carreira.previa(e, d, { decisoes: { nomeacao: "sec-obras-ex001" } });
  const r = Carreira.avancar(e, d, { decisoes: { nomeacao: "sec-obras-ex001", carta: p.mao.segura } }).resultado.estado;
  assert.equal(r.cargos.mandatos[0].licenciado, true); assert.equal(r.cargos.nomeacoes[0].licencaMandato, "2028|VEREADOR|EX001|1");
  const elegiveis = new Set();
  for (let i = 0; i < 30; i++) Cartas.montarMao(r, Object.assign(clone(d), { parametrosCartas: { acoesPorMao: 3 } }), RNG.criar("v1-L" + i, "cartas")).resultado.acoes.forEach((x) => elegiveis.add(x));
  assert.ok(!elegiveis.has("favor-emenda")); assert.ok(elegiveis.has("entrega-de-obra"));                  // vereador licenciado; cartas do cargo nomeado
  const c3 = Carreira.avancar(r, d, {}).resultado.estado;                             // C2 automática no Normal
  const s = Carreira.avancar(c3, d, { decisoes: { deixarNomeacao: true, carta: "agenda-bairro" } }).resultado.estado;
  assert.equal(s.cargos.mandatos[0].licenciado, false); assert.equal(s.cargos.nomeacoes[0].motivoSaida, "voluntaria");
  assert.equal(s.grupo.presenca.municipal, 0);
});

test("troca de governo: a posse do novo governo encerra a nomeação do âmbito; nova oferta na mesma C1", () => {
  const d = comCartas();
  const mun = nomeado(em(novo(), 2029, "C1"), "sec-obras-ex001", "governamental", "municipal", { ano: 2027, janela: "C1" });
  mun.grupo.presenca.municipal = 1;
  const p = Carreira.previa(mun, d, { decisoes: {} });
  assert.ok(p.nomeacoes.some((o) => o.id === "sec-obras-ex001"));                    // encerrada e oferecida de novo
  const est = nomeado(em(novo(), 2029, "C1"), "sec-turismo-ex", "governamental", "estadual");
  const r = Carreira.avancar(est, d, { decisoes: { nomeacao: "recusar", carta: "agenda-bairro" } }).resultado;
  assert.equal(r.estado.cargos.nomeacoes[0].situacao, "exercicio");                   // 2028 foi municipal: o governo estadual segue
  const est27 = nomeado(em(novo(), 2027, "C1"), "sec-turismo-ex", "governamental", "estadual", { ano: 2026, janela: "J1" });
  const r27 = Carreira.avancar(est27, d, { decisoes: { nomeacao: "recusar", carta: "agenda-bairro" } }).resultado;
  assert.equal(r27.estado.cargos.nomeacoes[0].motivoSaida, "trocaDeGoverno");
});

test("evento de saída: a opção encerrarNomeacao tira o personagem do cargo", () => {
  const { Eventos } = Motor;
  const e = nomeado(em(novo(), 2027, "C2"), "sec-obras-ex001", "governamental", "municipal");
  e.filaEventos = [{ id: "CP", janelaAlvo: { ano: 2027, janela: "C2" }, dados: { eventoId: "crise-na-pasta", origemCartaId: "entrega-de-obra", prob: 1, condicao: null, nivelCorrupcao: null } }];
  const r = Eventos.resolverJanela(e, comCartas(), { manual: true, decisoes: { eventos: { CP: "demissao" } } });
  assert.equal(r.estado.cargos.nomeacoes[0].motivoSaida, "evento:crise-na-pasta");
  assert.throws(() => Eventos.validarCatalogo(comCartas((d) => { d.eventos.find((x) => x.id === "crise-na-pasta").opcoes[1].encerrarNomeacao = "sim"; })), ERRO);
});

test("desincompatibilização em J1: nomeado sai ou permanece; quem permanece não recebe oferta de candidatura em J3", () => {
  const d = comCartas();
  const e = nomeado(em(novo(), 2028, "J1"), "sec-obras-ex001", "governamental", "municipal");
  const p = Carreira.previa(e, d, { decisoes: {} });
  assert.deepEqual(plano(p.desincompatibilizacao), { tipo: "nomeacao", posicaoId: "sec-obras-ex001" }); assert.equal(p.mao, null);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: "agenda-bairro" } }), ERRO);
  const sai = Carreira.avancar(e, d, { decisoes: { desincompatibilizacao: "sair", carta: "agenda-bairro" } }).resultado.estado;
  assert.equal(sai.cargos.nomeacoes[0].motivoSaida, "desincompatibilizacao");
  assert.deepEqual(ids(Candidatura.ofertas(em(sai, 2028, "J3"), d)), ["indicacao:2028|PREFEITO|EX001|1", "lista:2028|VEREADOR|EX001|1", "vice:2028|PREFEITO|EX001|1"]);
  const fica = Carreira.avancar(e, d, { decisoes: { desincompatibilizacao: "permanecer", carta: "agenda-bairro" } }).resultado.estado;
  assert.equal(fica.cargos.nomeacoes[0].situacao, "exercicio");
  assert.deepEqual(ids(Candidatura.ofertas(em(fica, 2028, "J3"), d)), []);
  assert.throws(() => Carreira.avancar(em(novo(), 2028, "J1"), d, { decisoes: { desincompatibilizacao: "sair", carta: "agenda-bairro" } }), ERRO);
});

test("renúncia do chefe do Executivo em J1: com a renúncia, pode disputar outro cargo; sem ela, só a reeleição", () => {
  const d = comCartas();
  const base = em(novo(), 2028, "J1");
  base.indicadores.local = { notoriedade: 0.6, popularidade: 0.3, rejeicao: 0.05 };
  base.cargos.mandatos = [{ disputaId: "D1", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }];
  assert.deepEqual(plano(Carreira.previa(base, d, { decisoes: {} }).desincompatibilizacao), { tipo: "executivo", cargo: "PREFEITO", disputaId: "D1" });
  const ren = Carreira.avancar(base, d, { decisoes: { desincompatibilizacao: "sair", carta: "agenda-bairro" } }).resultado.estado;
  assert.equal(ren.cargos.mandatos[0].situacao, "encerrado"); assert.equal(ren.cargos.mandatos[0].renuncia, "2028-01-01");
  assert.ok(ids(Candidatura.ofertas(em(ren, 2028, "J3"), d)).includes("lista:2028|VEREADOR|EX001|1"));
  const fica = Carreira.avancar(base, d, { decisoes: { desincompatibilizacao: "permanecer", carta: "agenda-bairro" } }).resultado.estado;
  assert.deepEqual(ids(Candidatura.ofertas(em(fica, 2028, "J3"), d)), ["indicacao:2028|PREFEITO|EX001|1"]);
});

test("módulo 3: nomeação governamental depois do prazo é inaptidão por desincompatibilização", () => {
  const base = { cargo: "VEREADOR", unidadeId: "EX001", limiteLista: 5,
    calendario: { dataRegistro: "2028-08-15", dataPosse: "2029-01-01", prazoFiliacao: "2028-04-04", prazoDesincompatibilizacao: "2028-04-04" },
    listas: [{ id: "P1", membros: ["P1"], candidatos: [{ id: "A", partidoId: "P1", dataNascimento: "1990-01-01", dataFiliacao: "2020-01-01", nomeacaoGovernamental: true }] }] };
  assert.deepEqual(plano(Elegibilidade.avaliar({}, base, null).resultado.listas[0].inelegiveis), [{ id: "A", motivos: ["semDesincompatibilizacao"] }]);
  base.listas[0].candidatos[0].nomeacaoGovernamental = "sim";
  assert.throws(() => Elegibilidade.avaliar({}, base, null), ERRO);
});

test("cartas do cargo: pool por tipo de nomeação ou por lista de posições; valor inválido é erro", () => {
  const d = comCartas();
  const sem = em(novo(), 2027, "C2"), com = nomeado(em(novo(), 2027, "C2"), "diretorio-municipal", "partidaria", "municipal");
  const vistas = (e) => { const s = new Set(); for (let i = 0; i < 30; i++) Cartas.montarMao(e, Object.assign(clone(d), { parametrosCartas: { acoesPorMao: 3 } }), RNG.criar("v1-P" + i, "cartas")).resultado.acoes.forEach((x) => s.add(x)); return s; };
  assert.ok(!vistas(sem).has("mobilizar-diretorio")); assert.ok(vistas(com).has("mobilizar-diretorio")); assert.ok(!vistas(com).has("entrega-de-obra"));
  assert.throws(() => Cartas.validarCatalogo(comCartas((x) => { x.cartas.find((c) => c.id === "entrega-de-obra").pool.nomeacao = "eletivo"; })), ERRO);
});

test("save versão 4: migração de 3 com lista vazia; lista não vazia não tem correspondência; nomeação validada", () => {
  const e = novo();
  const v3 = JSON.parse(Save.serializar(e)); v3.saveVersion = 3;
  const m = Save.ler(JSON.stringify(v3));
  assert.equal(m.saveVersion, 7); assert.deepEqual(plano(m), plano(e)); // 3 -> 4 -> 5
  v3.cargos.nomeacoes = [{ id: "x" }];
  assert.throws(() => Save.ler(JSON.stringify(v3)), /migração 3/);
  const duas = nomeado(clone(e), "a", "governamental", "municipal"); duas.cargos.nomeacoes.push(clone(duas.cargos.nomeacoes[0]));
  assert.throws(() => Carreira.validar(duas), ERRO);
});

test("sim.js --nomeacoes: hash reproduzível em carreira de 8 anos", () => {
  const C = path.join(RAIZ, "tools", "cenarios");
  const run = () => JSON.parse(execFileSync("node", [path.join(RAIZ, "tools", "sim.js"), "--cenario", path.join(C, "carreira.json"), "--carreira", "--anos", "8",
    "--cartas", path.join(C, "cartas-exemplo.json"), "--eventos", path.join(C, "eventos-exemplo.json"), "--modelos", path.join(C, "candidatura-exemplo.json"),
    "--nomeacoes", path.join(C, "nomeacoes-exemplo.json")], { encoding: "utf8" }));
  const a = run();
  assert.equal(a.hash, run().hash);
  assert.ok(a.ocorrencias.some((o) => o.tipo === "nomeacaoAceita"));
});
