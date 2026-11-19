"use strict";
// Eventos e risco (D77). Catálogos artificiais de tools/cenarios/eventos-exemplo.json e cartas-exemplo.json.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Eventos, Elegibilidade, Save, RNG } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const EVS = ler("eventos-exemplo.json"), CAT = ler("cartas-exemplo.json"), CEN = ler("carreira.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const dados = (mod) => { const d = { eventos: clone(EVS.eventos), cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes.slice(), parametrosCartas: clone(CAT.parametrosCartas) }; if (mod) mod(d); return d; };
const novo = (mod) => { const c = clone(CEN); if (mod) mod(c); return Carreira.criar({}, c, null).resultado; };
const item = (id, eventoId, prob, tempo) => ({ id, janelaAlvo: tempo || { ano: 2026, janela: "J1" }, dados: { eventoId, origemCartaId: "x", prob, condicao: null, nivelCorrupcao: null } });
const resolver = (e, d, ctx) => Eventos.resolverJanela(e, d || dados(), Object.assign({ manual: false }, ctx));
const ev = (d, id) => d.eventos.find((x) => x.id === id);

test("catálogo de exemplo válido; regras de forma, crise e escada jurídica", () => {
  assert.doesNotThrow(() => Eventos.validarCatalogo(dados()));
  const casos = [
    (d) => { const o = ev(d, "crise-gestao").opcoes; o.push(clone(o[1]), clone(o[1])); o[3].id = "a"; o[4].id = "b"; },  // 5 opções
    (d) => { ev(d, "crise-gestao").opcoes[0].contencao = false; },                                          // crise sem contenção
    (d) => { ev(d, "crise-gestao").opcoes[1].contencao = true; },                                           // duas contenções
    (d) => { ev(d, "crise-gestao").opcoes[1].efeitos.push({ alvo: "relacoes.cupula", delta: -0.01 }); },    // 4 variáveis
    (d) => { ev(d, "denuncia-mp").condicao = []; },                                                         // transição sem estado de partida
    (d) => { ev(d, "reconhecimento-inelegibilidade").condicao.pop(); },                                     // reconhecer sem enquadramento
    (d) => { delete ev(d, "exposicao-favor").opcoes[0].estadoTemporario; },                                 // investigar sem prazo máximo
    (d) => { ev(d, "denuncia-mp").opcoes[0].agendar.eventoId = "inexistente"; },
    (d) => { d.cartas[2].atraso.eventoId = "inexistente"; },                                                // referência cruzada
    (d) => { ev(d, "exposicao-favor").condicao[0].op = "~"; },
    (d) => { ev(d, "exposicao-favor").condicao[0] = { alvo: "relacoes.cupula", op: "contem", valor: 1 }; },
    (d) => { ev(d, "convite-oposicao").probBase = 0.5; },                                                   // atrasado com probBase
    (d) => { ev(d, "crise-gestao").reagendar = { emJanelas: 1, incrementoProb: 0.1, probMax: 1 }; },
    (d) => { ev(d, "crise-gestao").limiar.escala = 0; },
    (d) => { d.eventos.push(clone(d.eventos[0])); }
  ];
  for (const m of casos) assert.throws(() => Eventos.validarCatalogo(dados(m)), ERRO);
});

test("fila: dispara com a prob do item, um sorteio por item, e evento desconhecido é erro", () => {
  const e = novo();
  e.filaEventos = [item("A", "convite-oposicao", 1), item("B", "cobranca-acordo", 0), item("C", "demanda-bairro", 1, { ano: 2026, janela: "J2" })];
  const r = resolver(e);
  assert.deepEqual(plano(r.ocorrencias.map((o) => [o.tipo, o.id])), [["eventoNaoDisparou", "B"], ["evento", "A"]]);
  assert.ok(Math.abs(r.estado.relacoes.executivo - 0.18) < 1e-12);
  assert.deepEqual(plano(r.estado.filaEventos.map((x) => x.id)), ["C"]);
  let rng = e.rng.eventos;
  for (let i = 0; i < 2 + 1; i++) rng = RNG.decimal(rng).rngStateNext;          // 2 itens + 1 gatilho do catálogo
  assert.deepEqual(plano(r.estado.rng.eventos), plano(rng));
  const f = novo(); f.filaEventos = [item("Z", "nao-existe", 1)];
  assert.throws(() => resolver(f), ERRO);
});

test("descoberta atrasada: sem disparo, reagenda com prob crescente até o teto", () => {
  const e = novo(); e.filaEventos = [item("F", "exposicao-favor", 0)];
  const r = resolver(e).estado;
  assert.deepEqual(plano(r.filaEventos), [{ id: "F:r1", janelaAlvo: { ano: 2026, janela: "J3" },
    dados: { eventoId: "exposicao-favor", origemCartaId: "x", prob: 0.1, condicao: null, nivelCorrupcao: null, reagendamentos: 1, idBase: "F" } }]);
  const x = novo(); x.filaEventos = [Object.assign(item("G", "exposicao-favor", 0.79), {})];
  x.personagem.statusJuridico = "investigado";                                     // condição falha: não dispara
  assert.equal(resolver(x).estado.filaEventos[0].dados.prob, 0.8);
});

test("gatilho: limiar, intensidade, contenção na automática e bloqueio da família", () => {
  const d = dados((x) => { ev(x, "crise-gestao").probBase = 1; ev(x, "crise-gestao").limiar.escala = 0.0001; });
  const e = novo(); e.indicadores.local.rejeicao = 0.05; e.tempo = { ano: 2026, janela: "J2" };
  const r = resolver(e, d);
  assert.deepEqual(plano(r.ocorrencias), [{ tipo: "evento", id: "crise-gestao:2026J2", eventoId: "crise-gestao", opcaoId: "nota" }]);
  assert.deepEqual(plano(r.estado.eventosRecentes), { crise: { ano: 2026, janela: "J2" } });
  const b = clone(r.estado); b.tempo = { ano: 2026, janela: "J3" };
  assert.equal(resolver(b, d).ocorrencias.length, 0);                              // bloqueada por 4 janelas
  b.tempo = { ano: 2026, janela: "J6" };
  assert.equal(resolver(b, d).ocorrencias.length, 1);
  const baixo = novo(); baixo.tempo = { ano: 2026, janela: "J2" };
  assert.equal(resolver(baixo, d).ocorrencias.length, 0);                          // limiar não cruzado
  const z = clone(e); ev(d, "crise-gestao").limiar.escala = 1000;                  // intensidade quase zero
  assert.equal(resolver(z, d).ocorrencias.length, 0);
});

test("crise manual: prévia lista a pendência sem mão; com a escolha, mão; avancar exige a escolha", () => {
  const d = dados((x) => { ev(x, "crise-gestao").probBase = 1; ev(x, "crise-gestao").limiar.escala = 0.0001; });
  const e = novo(); e.indicadores.local.rejeicao = 0.05;                            // J1, manual no Express
  const p = Carreira.previa(e, d, { decisoes: {} });
  assert.equal(p.mao, null);
  assert.deepEqual(plano(p.eventos), [{ id: "crise-gestao:2026J1", eventoId: "crise-gestao", titulo: "Crise de imagem",
    texto: "A rejeição cresce e a imprensa pede explicações.", opcoes: [{ id: "nota", texto: "Divulgar nota de esclarecimento", contencao: true },
      { id: "enfrentar", texto: "Enfrentar a imprensa", contencao: false }, { id: "culpar-aliado", texto: "Atribuir a culpa a um aliado", contencao: false }] }]);
  const dec = { eventos: { "crise-gestao:2026J1": "culpar-aliado" } };
  const p2 = Carreira.previa(e, d, { decisoes: dec });
  assert.equal(p2.eventos.length, 0); assert.ok(p2.mao.segura);
  assert.throws(() => Carreira.avancar(e, d, { decisoes: { carta: p2.mao.segura } }), ERRO);
  const r = Carreira.avancar(e, d, { decisoes: Object.assign({ carta: p2.mao.segura }, dec) }).resultado.estado;
  assert.ok(Math.abs(r.relacoes.bancada - 0.15) < 1e-12);
  assert.deepEqual(plano(e.rng), plano(novo((c) => c).rng));                        // entrada intacta
});

test("escada jurídica: investigação, denúncia, condenação com enquadramento e inelegibilidade", () => {
  const d = dados();
  let e = novo(); e.filaEventos = [item("F", "exposicao-favor", 1)];
  e = resolver(e, d).estado;
  assert.equal(e.personagem.statusJuridico, "investigado");
  assert.deepEqual(plano(e.personagem.estadosTemporarios), [{ id: "F:investigado", tipo: "investigado", origem: "exposicao-favor",
    inicio: { ano: 2026, janela: "J1" }, fim: { ano: 2027, janela: "C3" } }]);
  const fila = (id, eventoId) => { e.filaEventos = [item(id, eventoId, 1, e.tempo)]; e = resolver(e, d).estado; };
  fila("D", "denuncia-mp");
  assert.equal(e.personagem.denunciaRegistrada, true);
  fila("J", "julgamento");
  assert.equal(e.personagem.statusJuridico, "condenado"); assert.equal(e.personagem.condenacaoEnquadrada, true);
  assert.equal(e.personagem.estadosTemporarios.length, 0);
  fila("R", "reconhecimento-inelegibilidade");
  assert.equal(e.personagem.statusJuridico, "inelegibilidadeReconhecida");
  assert.doesNotThrow(() => Carreira.validar(e));
  const sem = dados((x) => { delete ev(x, "julgamento").enquadramentoInelegibilidade; });
  let c = novo(); c.personagem.statusJuridico = "investigado"; c.personagem.denunciaRegistrada = true;
  c.filaEventos = [item("J", "julgamento", 1), item("K", "reconhecimento-inelegibilidade", 1)];
  c = resolver(c, sem).estado;
  assert.equal(c.personagem.statusJuridico, "condenado");                          // condenação sem enquadramento não gera inelegibilidade
});

test("estado temporário: investigado vence sem denúncia e é arquivado na abertura da janela", () => {
  const d = dados();
  let e = novo(); e.filaEventos = [item("F", "exposicao-favor", 1)];
  e = Carreira.avancar(e, d, { decisoes: { carta: "agenda-bairro" } }).resultado.estado;
  assert.equal(e.personagem.statusJuridico, "investigado");
  e.filaEventos = e.filaEventos.filter((x) => x.dados.eventoId !== "denuncia-mp");     // sem denúncia até o prazo
  while (!(e.tempo.ano === 2027 && e.tempo.janela === "C3")) {
    const dec = Carreira.ehManual(e) ? { carta: Carreira.previa(e, d, { decisoes: {} }).mao.segura } : undefined;
    e = Carreira.avancar(e, d, { decisoes: dec }).resultado.estado;
  }
  const r = Carreira.avancar(e, d, {}).resultado;
  assert.equal(r.estado.personagem.statusJuridico, "regular");
  assert.ok(r.ocorrencias.some((o) => o.tipo === "arquivamento"));
});

test("estados temporários na mão: licença de saúde só a segura; afastamento cautelar sem Capital de Entrega", () => {
  const { Cartas } = carregarMotor().Motor;
  const rng = RNG.criar("v1-T", "cartas"), d = dados();
  const e = novo(); e.personagem.estadosTemporarios = [{ id: "L", tipo: "licencaSaude", origem: "x", inicio: { ano: 2026, janela: "J1" }, fim: { ano: 2026, janela: "J3" } }];
  assert.deepEqual(plano(Cartas.montarMao(e, d, rng).resultado.ids), ["agenda-bairro"]);
  const v = novo(); v.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }]; v.bolsos.capitalEntrega = 5;
  v.personagem.estadosTemporarios = [{ id: "A", tipo: "afastamentoCautelar", origem: "x", inicio: { ano: 2026, janela: "J1" }, fim: { ano: 2026, janela: "J3" } }];
  for (let i = 0; i < 30; i++) assert.ok(!Cartas.montarMao(v, Object.assign(d, { parametrosCartas: { acoesPorMao: 3 } }), RNG.criar("v1-A" + i, "cartas")).resultado.acoes.includes("favor-emenda"));
});

test("compromisso: desfecho em dados e retaliação agendada quando rompido", () => {
  const d = dados();
  const { Cartas } = carregarMotor().Motor;
  let e = novo(); e.tempo = { ano: 2027, janela: "C3" };
  e = Cartas.jogar(e, d, RNG.criar("v1-K", "cartas"), { cartaId: "acordo-lideranca" }).resultado.estado;
  e.tempo = { ano: 2028, janela: "J3" };                                            // J3: manual em todos os ritmos
  const semCartas = clone(d); delete semCartas.cartas;
  const r = Carreira.avancar(e, semCartas, { decisoes: { compromissos: { "acordo-lideranca:2027C3": "romper" } } }).resultado.estado;
  assert.equal(r.compromissos.historico[0].estado, "rompido");
  assert.ok(Math.abs(r.relacoes.credibilidade - 0.46) < 1e-12);
  assert.deepEqual(plano(r.filaEventos.find((x) => x.id === "acordo-lideranca:2027C3:retaliacao")),
    { id: "acordo-lideranca:2027C3:retaliacao", janelaAlvo: { ano: 2028, janela: "J5" },
      dados: { eventoId: "cobranca-acordo", origemCompromissoId: "acordo-lideranca:2027C3", prob: 0.5, condicao: null, nivelCorrupcao: null } });
});

test("módulo 3: inelegibilidade reconhecida torna o candidato inapto; na carreira, o personagem não se elege", () => {
  const base = { cargo: "VEREADOR", unidadeId: "EX001", limiteLista: 5,
    calendario: { dataRegistro: "2028-08-15", dataPosse: "2029-01-01", prazoFiliacao: "2028-04-04", prazoDesincompatibilizacao: "2028-04-04" },
    listas: [{ id: "P1", membros: ["P1"], candidatos: [{ id: "A", partidoId: "P1", dataNascimento: "1990-01-01", dataFiliacao: "2020-01-01", inelegibilidadeReconhecida: true }] }] };
  const r = Elegibilidade.avaliar({}, base, null).resultado;
  assert.deepEqual(plano(r.listas[0].inelegiveis), [{ id: "A", motivos: ["inelegibilidadeReconhecida"] }]);
  base.listas[0].candidatos[0].inelegibilidadeReconhecida = "sim";
  assert.throws(() => Elegibilidade.avaliar({}, base, null), ERRO);
  const sim = require("../../tools/sim.js");
  const cen = clone(CEN), Motor = carregarMotor().Motor;
  const eleicoes = { 2028: [ler("vereador.json")] };
  const rodar = (inelegivel) => {
    let e = Motor.Carreira.criar({}, cen, null).resultado;
    if (inelegivel) e.personagem.statusJuridico = "inelegibilidadeReconhecida";
    while (e.tempo.ano < 2029) e = Motor.Carreira.avancar(e, { eleicoes }, { opcoes: { opcoesEleicao: (x) => sim.opcoesDoCenario(Motor, x) }, decisoes: Motor.Carreira.ehManual(e) ? {} : undefined }).resultado.estado;
    return e.historico.find((h) => h.tipo === "eleicao");
  };
  assert.equal(rodar(false).personagemEleito, true);
  const h = rodar(true);
  assert.equal(h.personagemEleito, false); assert.ok(!h.eleitos.includes("A1"));
});

test("save: migração 1 para 2 (e 3) em cadeia; status sem correspondência recusado", () => {
  const e = novo(); e.compromissos.ativos = [{ id: "K1", tipo: "votoEmProposta", ator: "P2", objeto: "x", prazo: { ano: 2027, janela: "C4" },
    custo: { recurso: "bancada", quantidade: 0 }, contrapartida: "x", seCumprir: "x", seRomper: "x", custoPoliticoDeRomper: 1, estado: "ativo" }];
  const v1 = JSON.parse(Save.serializar(e));
  v1.saveVersion = 1; delete v1.eventosRecentes;
  ["estadosTemporarios", "denunciaRegistrada", "condenacaoEnquadrada"].forEach((k) => delete v1.personagem[k]);
  const m = Save.ler(JSON.stringify(v1));
  assert.equal(m.saveVersion, 3); // 1 -> 2 -> 3 em cadeia
  const esperado = plano(e); esperado.compromissos.ativos[0].efeitosCumprir = []; esperado.compromissos.ativos[0].efeitosRomper = []; esperado.compromissos.ativos[0].retaliacao = null;
  assert.deepEqual(plano(m), esperado);
  v1.personagem.statusJuridico = "processado";
  assert.throws(() => Save.ler(JSON.stringify(v1)), ERRO);
  assert.ok(Object.isFrozen(Save.MIGRAR));
  assert.throws(() => Save.ler(JSON.stringify(v1), {}), ERRO);                       // sem migrador para a versão 1
});

test("ritmo não altera a simulação com eventos e cartas, quando as manuais escolhem contenção e segura", () => {
  const d = dados((x) => { ev(x, "crise-gestao").probBase = 1; ev(x, "crise-gestao").limiar.escala = 0.0001; });
  const rodar = (ritmo) => {
    let e = novo((c) => { c.ritmo = ritmo; c.inicio.indicadores.local.rejeicao = 0.05; });
    e.filaEventos = [item("F", "exposicao-favor", 0.3), item("G", "convite-oposicao", 0.5, { ano: 2026, janela: "J4" })];
    while (e.tempo.ano < 2029) {
      let dec;
      if (Carreira.ehManual(e)) {
        dec = { eventos: {} };
        Carreira.previa(e, d, { decisoes: dec }).eventos.forEach((x) => { dec.eventos[x.id] = x.opcoes.find((o) => o.contencao).id; });
        dec.carta = Carreira.previa(e, d, { decisoes: dec }).mao.segura;
      }
      e = Carreira.avancar(e, d, { decisoes: dec }).resultado.estado;
    }
    const x = plano(e); delete x.ritmo; x.historico.forEach((h) => { delete h.manual; });
    return x;
  };
  const a = rodar("intenso");
  assert.deepEqual(a, rodar("express"));
  assert.ok(a.historico.some((h) => h.tipo === "evento"));
});

test("sim.js --carreira --cartas --eventos: hash reproduzível", () => {
  const run = () => JSON.parse(execFileSync("node", [path.join(RAIZ, "tools", "sim.js"), "--cenario", path.join(RAIZ, "tools", "cenarios", "carreira.json"),
    "--carreira", "--anos", "6", "--cartas", path.join(RAIZ, "tools", "cenarios", "cartas-exemplo.json"),
    "--eventos", path.join(RAIZ, "tools", "cenarios", "eventos-exemplo.json")], { encoding: "utf8" }));
  const a = run();
  assert.equal(a.hash, run().hash);
  assert.deepEqual(a.tempo, { ano: 2032, janela: "J1" });
});
