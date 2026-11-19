"use strict";
// Vice e sucessão (D84). Catálogos artificiais de tools/cenarios.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const Motor = carregarMotor().Motor;
const { Carreira, Candidatura, Cartas, Eventos, Dados, Save, Distribuicoes } = Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), CAND = ler("candidatura-exemplo.json"), CAT = ler("cartas-exemplo.json"), EVS = ler("eventos-exemplo.json"), NOM = ler("nomeacoes-exemplo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = (mod) => {
  const d = Object.assign(clone(CAND), { cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas), eventos: clone(EVS.eventos) });
  if (mod) mod(d); return d;
};
const novo = (mod) => { const c = clone(CEN); delete c.eleicoes; if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const em = (e, ano, janela) => { const x = clone(e); x.tempo = { ano, janela }; return x; };
const ids = (os) => plano(os.map((o) => o.id));
const opcoes = { opcoesEleicao: (c) => Distribuicoes.opcoesDoCenario(c) };
const VP = "vice:2028|PREFEITO|EX001|1", V = "lista:2028|VEREADOR|EX001|1";
const chanceVice = (x) => (d) => { d.regrasIndicacao.VICE_PREFEITO.chance.piso = x; d.regrasIndicacao.VICE_PREFEITO.chance.teto = x; };
const item = (id, eventoId, tempo) => ({ id, janelaAlvo: tempo, dados: { eventoId, origemCartaId: "x", prob: 1, condicao: null, nivelCorrupcao: null } });
// vice em exercício na prefeitura de EX001 (mandato 2029 a 2032)
const viceEmExercicio = (ano, janela) => {
  const e = em(novo(), ano, janela);
  e.cargos.mandatos = [{ disputaId: "2028|PREFEITO|EX001|1", cargo: "VICE_PREFEITO", unidadeId: "EX001", inicio: "2029-01-01", fim: "2032-12-31",
    situacao: "exercicio", papel: "vice", chapaId: "CH1", titularId: "X1" }];
  return e;
};

test("cargos de vice: sem disputa própria, idade mínima do titular, escopo do titular", () => {
  for (const c of ["VICE_PREFEITO", "VICE_GOVERNADOR", "VICE_PRESIDENTE"]) assert.equal(Dados.CARGOS[c].vice, true);
  assert.throws(() => Dados.disputa({ id: "x", ano: 2028, cargo: "VICE_PREFEITO", unidadeId: "EX001", vagas: 1, turno: 1 }), /sem disputa própria/);
  assert.equal(Candidatura.escopoDe("VICE_PREFEITO"), "local"); assert.equal(Candidatura.escopoDe("VICE_GOVERNADOR"), "estadual");
  assert.equal(Candidatura.escopoDe("VICE_PRESIDENTE"), "nacional");
  assert.throws(() => Candidatura.validarCatalogo(dados((d) => { d.regrasIndicacao.VICE_PREFEITO.tipo = "cabecaDeChapa"; })), ERRO);
  assert.throws(() => Candidatura.validarCatalogo(dados((d) => { delete d.regrasIndicacao.VICE_PREFEITO.chance; })), ERRO);
  const jovem = em(novo((c) => { c.inicio.personagem.dataNascimento = "2009-01-01"; }), 2028, "J3"); // 20 anos na posse
  assert.ok(!ids(Candidatura.ofertas(jovem, dados())).includes(VP));
});

test("convite de vice: chapa própria ou com o partido na adesão; ficha com titular e papel de vice", () => {
  const e = em(novo(), 2028, "J3");
  const o = Candidatura.ofertas(e, dados()).find((x) => x.id === VP);
  assert.equal(o.tipo, "vice"); assert.equal(o.cargo, "VICE_PREFEITO"); assert.equal(o.listaOuChapaId, "CH1"); assert.equal(o.titularId, "X1");
  assert.equal(o.ficha.papelEsperado, "vice"); assert.equal(o.ficha.competitividade, "alta"); // 0,35 do titular frente a 0,30
  const fed = clone(e); fed.personagem.partidoId = "P4"; fed.personagem.filiacoes[0].partidoId = "P4";
  assert.equal(Candidatura.ofertas(fed, dados()).find((x) => x.id === VP).listaOuChapaId, "CH3");               // federação titular da chapa
  const ades = dados((d) => { d.modelosDisputa["2028"][1].chapas[1].adesao.P1 = 0.1; d.modelosDisputa["2028"][1].chapas.shift(); });
  assert.equal(Candidatura.ofertas(e, ades).find((x) => x.id === VP).listaOuChapaId, "CH2");                    // partido coligado
  const sem = dados((d) => { d.modelosDisputa["2028"][1].chapas.shift(); });
  assert.ok(!ids(Candidatura.ofertas(e, sem)).includes(VP));
  assert.ok(!ids(Candidatura.ofertas(e, dados((d) => { delete d.regrasIndicacao.VICE_PREFEITO; }))).includes(VP));
});

test("aceite do convite: chance em fluxo derivado próprio; negativa leva à lista ou a não concorrer", () => {
  const e = em(novo(), 2028, "J3");
  const sim = dados(chanceVice(1));
  const p = Carreira.previa(e, sim, { decisoes: { candidatura: VP } });
  assert.equal(p.indicacaoNegada, null);
  const r = Carreira.avancar(e, sim, { decisoes: { candidatura: VP, carta: p.mao.segura } }).resultado;
  assert.deepEqual(plano(r.estado.candidaturas), [{ ano: 2028, ofertaId: VP, disputaId: "2028|PREFEITO|EX001|1", cargo: "VICE_PREFEITO", unidadeId: "EX001",
    partidoId: "P1", listaOuChapaId: "CH1", tipo: "vice", titularId: "X1", indicacao: { pedida: true, concedida: true } }]);
  assert.ok(r.ocorrencias.some((o) => o.tipo === "viceConfirmado"));
  assert.deepEqual(plano(r.estado.rng), plano(Carreira.avancar(e, sim, { decisoes: { candidatura: V, carta: p.mao.segura } }).resultado.estado.rng));
  const nao = dados(chanceVice(0));
  const q = Carreira.previa(e, nao, { decisoes: { candidatura: VP } });
  assert.deepEqual(plano(q.indicacaoNegada), { ofertaId: VP, disputaId: "2028|PREFEITO|EX001|1", cargo: "VICE_PREFEITO", vice: true });
  assert.deepEqual(ids(q.candidaturas), [V]);
  const s = Carreira.avancar(e, nao, { decisoes: { candidatura: VP, alternativa: V, carta: "agenda-bairro" } }).resultado;
  assert.ok(s.ocorrencias.some((o) => o.tipo === "viceRecusado")); assert.equal(s.estado.candidaturas[0].ofertaId, V);
  // sorteio do vice e da cabeça de chapa em fluxos distintos
  const of = Candidatura.ofertas(e, dados());
  const u = (o) => Motor.RNG.decimal(Motor.RNG.criar(e.semente, "mundo", "indicacao", 2028, o.disputaId, ...(o.tipo === "vice" ? ["vice"] : []))).valor;
  assert.notEqual(u(of.find((x) => x.id === VP)), u(of.find((x) => x.tipo === "cabecaDeChapa")));
});

test("J5: a chapa disputa com o titular; mandato de vice quando o titular vence", () => {
  const d = dados(chanceVice(1));
  let e = em(novo(), 2028, "J3");
  const p = Carreira.previa(e, d, { decisoes: { candidatura: VP } });
  e = Carreira.avancar(e, d, { opcoes, decisoes: { candidatura: VP, carta: p.mao.segura } }).resultado.estado;
  let oc;
  while (!(e.tempo.ano === 2028 && e.tempo.janela === "J6")) {
    const pr = Carreira.ehManual(e) ? Carreira.previa(e, d, { opcoes, decisoes: {} }) : null;
    const r = Carreira.avancar(e, d, { opcoes, decisoes: pr ? { carta: pr.mao.segura } : undefined }).resultado;
    if (e.tempo.janela === "J5") oc = r; e = r.estado;
  }
  const h = e.historico.find((x) => x.tipo === "eleicao");
  assert.equal(h.papel, "vice"); assert.equal(h.titularId, "X1"); assert.equal(h.cargo, "PREFEITO");
  assert.equal(h.personagemEleito, h.eleitos.includes("X1"));
  if (h.personagemEleito) {
    assert.deepEqual(plano(e.cargos.mandatos), [{ disputaId: "2028|PREFEITO|EX001|1", cargo: "VICE_PREFEITO", unidadeId: "EX001", inicio: "2029-01-01",
      fim: "2032-12-31", situacao: "eleito", papel: "vice", chapaId: "CH1", titularId: "X1" }]);
  } else assert.deepEqual(plano(e.cargos.mandatos), []);
  assert.ok(oc.ocorrencias.some((o) => o.tipo === "eleicao"));
});

test("substituição temporária: o vice exerce o cargo do titular enquanto durar; depois volta", () => {
  const d = dados();
  const e = viceEmExercicio(2029, "C1");
  e.filaEventos = [item("S", "ausencia-do-titular", { ano: 2029, janela: "C1" })];
  assert.deepEqual(plano(Cartas.cargosAtuais(e)), ["VICE_PREFEITO"]);
  const p = Carreira.previa(e, d, { decisoes: {} });
  const r = Carreira.avancar(e, d, { decisoes: { carta: p.mao.segura } }).resultado;
  assert.ok(r.ocorrencias.some((o) => o.tipo === "substituicao" && o.cargo === "PREFEITO"));
  assert.deepEqual(plano(Cartas.cargosAtuais(r.estado)), ["VICE_PREFEITO", "PREFEITO"]);
  assert.equal(r.estado.cargos.mandatos[0].cargo, "VICE_PREFEITO");                                             // mandato do titular preservado
  let x = r.estado;
  for (let i = 0; i < 2; i++) x = Carreira.avancar(x, d, { decisoes: Carreira.ehManual(x) ? { carta: Carreira.previa(x, d, { decisoes: {} }).mao.segura } : undefined }).resultado.estado;
  assert.deepEqual(plano(Cartas.cargosAtuais(x)), ["VICE_PREFEITO"]);
});

test("sucessão por evento: vice efetivado no cargo do titular, com legitimidade reduzida nos efeitos", () => {
  const d = dados();
  const e = viceEmExercicio(2029, "C1");
  e.filaEventos = [item("V", "vaga-do-titular", { ano: 2029, janela: "C1" })];
  const p = Carreira.previa(e, d, { decisoes: {} });
  const r = Carreira.avancar(e, d, { decisoes: { carta: p.mao.segura } }).resultado;
  const m = r.estado.cargos.mandatos[0];
  assert.equal(m.cargo, "PREFEITO"); assert.equal(m.papel, "titular"); assert.equal(m.sucedeu, true); assert.equal(m.fim, "2032-12-31");
  assert.deepEqual(plano(m.sucessao), { ano: 2029, janela: "C1", eventoId: "vaga-do-titular" });
  assert.ok(Math.abs(r.estado.relacoes.bancada - (e.relacoes.bancada - 0.05)) < 1e-9);
  assert.ok(r.ocorrencias.some((o) => o.tipo === "sucessao" && o.cargo === "PREFEITO"));
  // sem vice em exercício, os eventos de vice não disparam (condição)
  const sem = em(novo(), 2029, "C1"); sem.filaEventos = [item("V", "vaga-do-titular", { ano: 2029, janela: "C1" })];
  const r2 = Carreira.avancar(sem, d, { decisoes: { carta: Carreira.previa(sem, d, { decisoes: {} }).mao.segura } }).resultado;
  assert.ok(!r2.ocorrencias.some((o) => o.tipo === "sucessao"));
});

test("catálogo de eventos: sucessão e substituição exigem condição de vice em exercício", () => {
  const ev = (d, id) => d.eventos.find((x) => x.id === id);
  assert.doesNotThrow(() => Eventos.validarCatalogo(dados()));
  for (const m of [(d) => { ev(d, "vaga-do-titular").condicao = []; }, (d) => { ev(d, "ausencia-do-titular").condicao = []; },
    (d) => { ev(d, "vaga-do-titular").opcoes[0].sucederTitular = 1; }, (d) => { ev(d, "ausencia-do-titular").opcoes[0].substituirTitular = { duracaoJanelas: 0 }; },
    (d) => { ev(d, "vaga-do-titular").opcoes[0].substituirTitular = { duracaoJanelas: 1 }; }])
    assert.throws(() => Eventos.validarCatalogo(dados(m)), ERRO);
});

test("cartas de vice: só com mandato de vice em exercício", () => {
  const d = dados(), vice = ["agenda-do-vice", "bastidor-do-vice"];
  const acoes = (e) => Carreira.previa(e, d, { decisoes: {} }).mao.acoes;
  // a mão sorteia pelo peso: em várias sementes, as cartas de vice aparecem só para o vice
  let viu = false;
  for (const s of ["v1-A", "v1-B", "v1-C", "v1-D"]) {
    const a = em(novo((c) => { c.semente = s; }), 2029, "C1"); const b = clone(a);
    a.cargos.mandatos = viceEmExercicio(2029, "C1").cargos.mandatos;
    if (acoes(a).some((x) => vice.includes(x))) viu = true;
    assert.ok(!acoes(b).some((x) => vice.includes(x)));
  }
  assert.ok(viu);
});

test("renúncia do prefeito titular: o vice sintético da chapa assume (módulo 15)", () => {
  const d = Object.assign(dados(), { posicoes: clone(NOM.posicoes) });
  const base = em(novo(), 2028, "J1");
  base.cargos.mandatos = [{ disputaId: "D1", cargo: "PREFEITO", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio", papel: "titular" }];
  const ren = Carreira.avancar(base, d, { decisoes: { desincompatibilizacao: "sair", carta: "agenda-bairro" } }).resultado.estado;
  const h = ren.historico.find((x) => x.tipo === "renuncia");
  assert.equal(h.sucessor, "vice:D1"); assert.equal(ren.cargos.mandatos[0].situacao, "encerrado");
});

test("save versão 6: migração de 5 marca todo mandato como titular; vice sem correspondência recusado", () => {
  const e = viceEmExercicio(2029, "C1");
  assert.equal(e.saveVersion, 6);
  const v5 = clone(e); v5.saveVersion = 5;
  v5.cargos.mandatos = [{ disputaId: "D1", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "encerrado" }];
  const m = Save.ler(JSON.stringify(v5));
  assert.equal(m.saveVersion, 6); assert.equal(m.cargos.mandatos[0].papel, "titular");
  const ruim = clone(v5); ruim.cargos.mandatos[0].cargo = "VICE_PREFEITO";
  assert.throws(() => Save.ler(JSON.stringify(ruim)), /sem correspondência/);
  const inval = clone(e); inval.cargos.mandatos[0].papel = "suplente";
  assert.throws(() => Carreira.validar(inval), ERRO);
  const papelErrado = clone(e); papelErrado.cargos.mandatos[0].cargo = "PREFEITO";
  assert.throws(() => Carreira.validar(papelErrado), ERRO);
  assert.deepEqual(plano(Save.ler(Save.serializar(e))), plano(e));
});

test("gatilho de conjuntura: queda do titular só com vice em exercício, com probabilidade base baixa (calibrar)", () => {
  const d = dados(), ev = d.eventos.find((x) => x.id === "crise-do-titular");
  assert.equal(ev.tipo, "gatilho"); assert.ok(ev.probBase <= 0.05);
  const certo = dados((x) => { x.eventos.find((y) => y.id === "crise-do-titular").probBase = 1; });
  const r = Eventos.resolverJanela(viceEmExercicio(2029, "C1"), certo, { manual: false });
  assert.ok(r.ocorrencias.some((o) => o.tipo === "sucessao")); assert.equal(r.estado.cargos.mandatos[0].cargo, "PREFEITO");
  const sem = Eventos.resolverJanela(em(novo(), 2029, "C1"), certo, { manual: false });
  assert.ok(!sem.ocorrencias.some((o) => o.tipo === "sucessao"));
});
