#!/usr/bin/env node
"use strict";
// Simulação headless do motor (etapa 7a, D73). Carrega o bloco <script id="motor"> de public/index.html, sem DOM.
// Nenhum parâmetro calibrável nasce aqui: valores e formas das distribuições vêm do arquivo de cenário.
//   node tools/sim.js --cenario tools/cenarios/vereador.json [--semente v1-X]
//   node tools/sim.js --cenario tools/cenarios/vereador.json --rodadas 200 [--semente-base v1-LOTE]
//   node tools/sim.js --cenario tools/cenarios/carreira.json --carreira [--anos N] [--semente v1-X] [--cartas arquivo.json [--eventos arquivo.json]] [--modelos arquivo.json] [--nomeacoes arquivo.json]
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

function carregarMotor() {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("bloco do motor não encontrado");
  const ctx = vm.createContext({});
  vm.runInContext("Math.random = function () { throw new Error('Math.random proibido no motor'); };", ctx);
  vm.runInContext(m[1] + "\n;globalThis.Motor = Motor;", ctx, { filename: "index.html#motor" });
  return ctx.Motor;
}

// JSON com chaves em ordem: base do hash reproduzível
function canonico(x) {
  if (Array.isArray(x)) return "[" + x.map(canonico).join(",") + "]";
  if (x && typeof x === "object") return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + canonico(x[k])).join(",") + "}";
  return JSON.stringify(x);
}
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Sorteadores: código no motor (Motor.Distribuicoes, D79), valores no cenário (calibrar).
function sorteador(Motor, def, nome) { return Motor.Distribuicoes.sorteador(def, nome); }
function opcoesDoCenario(Motor, cen) { return Motor.Distribuicoes.opcoesDoCenario(cen); }

function rodar(Motor, cen, semente) {
  const dados = { ...cen, semente };
  const rng = Motor.RNG.criar(semente, "eleicao", cen.eleicaoId, cen.disputa.id);
  const r = Motor.Eleicao.executar({ opcoes: opcoesDoCenario(Motor, cen) }, dados, rng);
  const resultado = JSON.parse(JSON.stringify(r.resultado));
  return { semente, hash: sha256(canonico(resultado)), resultado };
}

function lote(Motor, cen, base, n) {
  const t = { rodadas: n, concluidas: 0, segundosTurnos: 0, vagasNaoPreenchidas: 0, desempates: {}, erros: {} };
  for (let i = 0; i < n; i++) {
    try {
      const { resultado } = rodar(Motor, cen, base + "-" + i);
      t.concluidas++;
      if (resultado.etapas.segundoTurno) t.segundosTurnos++;
      if (resultado.etapas.cadeiras) t.vagasNaoPreenchidas += resultado.etapas.cadeiras.naoPreenchidas;
      for (const d of resultado.desempates) t.desempates[d.tipo] = (t.desempates[d.tipo] || 0) + 1;
    } catch (err) {
      const msg = err.message;
      const k = /insuficiência de modelagem/.test(msg) ? "insuficienciaDeModelagem" : /excedem as vagas/.test(msg) ? "excessoQuocientePartidario" : "outro: " + msg;
      t.erros[k] = (t.erros[k] || 0) + 1;
    }
  }
  return { sementeBase: base, hash: sha256(canonico(t)), telemetria: t };
}

// Carreira (D75): avança janela a janela. Sem catálogo, janelas manuais recebem decisões vazias; com catálogo
// (--cartas, D76; --eventos, D77), escolhem a contenção nos eventos e a carta segura da prévia, como a automática.
// eleicoes[ano] lista arquivos de cenário de disputa, relativos ao arquivo da carreira.
// Com --modelos (D78), J3 escolhe a oferta de maior aderência à ambição (desempate por id); sem oferta, não concorre.
// É política do simulador, não regra do motor.
// Com --nomeacoes (D80), a política do simulador aceita a primeira oferta de nomeação e permanece no cargo em J1.
function carreira(Motor, cen, dir, anos, catalogo, eventos, modelos, nomeacoes) {
  const eleicoes = {};
  // com --modelos, a candidatura nasce em J3; os cenários prontos com o personagem (D75) não são carregados
  Object.keys(modelos ? {} : (cen.eleicoes || {})).forEach((a) => {
    eleicoes[a] = cen.eleicoes[a].map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  });
  let e = Motor.Carreira.criar({}, cen, null).resultado;
  const fim = e.tempo.ano + anos, opcoes = { opcoesEleicao: (c) => opcoesDoCenario(Motor, c) };
  const ocorrencias = [];
  const dados = catalogo ? { eleicoes, cartas: catalogo.cartas, ambicoes: catalogo.ambicoes, parametrosCartas: catalogo.parametrosCartas } : { eleicoes };
  if (eventos) {
    if (!catalogo) throw new Error("--eventos exige --cartas");
    dados.eventos = eventos.eventos;
  }
  if (modelos) ["modelosDisputa", "regrasIndicacao", "faixasFicha", "regrasCargo", "ambicoesCargos", "governos"].forEach((k) => { dados[k] = modelos[k]; });
  if (nomeacoes) {
    if (!catalogo) throw new Error("--nomeacoes exige --cartas");
    dados.posicoes = nomeacoes.posicoes;
  }
  const escolherOferta = (ofs) => {
    if (!ofs.length) return "naoConcorrer";
    // maior aderência; no empate, a lista proporcional (vaga garantida) antes do pedido de indicação; depois id
    const peso = (o) => (o.tipo === "proporcional" ? 0 : 1);
    return ofs.slice().sort((a, b) => (b.ficha.aderenciaAmbicao - a.ficha.aderenciaAmbicao) || (peso(a) - peso(b)) || (a.id < b.id ? -1 : 1))[0].id;
  };
  const decidir = () => {
    const dec = { compromissos: {}, eventos: {} };
    let p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec });
    p.eventos.forEach((x) => { dec.eventos[x.id] = x.opcoes.find((o) => o.contencao).id; });
    if (p.eventos.length) p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec });
    if (p.desincompatibilizacao) { dec.desincompatibilizacao = "permanecer"; p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec }); }
    if (p.nomeacoes) { dec.nomeacao = p.nomeacoes[0].id; p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec }); }
    if (p.candidaturas) { dec.candidatura = escolherOferta(p.candidaturas); p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec }); }
    if (p.indicacaoNegada) { dec.alternativa = escolherOferta(p.candidaturas); p = Motor.Carreira.previa(e, dados, { opcoes, decisoes: dec }); }
    dec.carta = p.mao.segura;
    return dec;
  };
  const decidirSemCartas = () => {
    const dec = { compromissos: {} };
    if (modelos && e.tempo.janela === "J3" && Motor.Carreira.tipoAno(e.tempo.ano) === "eleitoral") {
      const ofs = Motor.Candidatura.ofertas(e, dados);
      if (ofs.length) dec.candidatura = escolherOferta(ofs);
      const pedida = ofs.find((o) => o.id === dec.candidatura);
      if (pedida && pedida.tipo === "cabecaDeChapa" && !Motor.Candidatura.sortearIndicacao(e, dados, pedida).concedida) {
        const listas = ofs.filter((o) => o.tipo === "proporcional");
        dec.alternativa = listas.length ? escolherOferta(listas) : "naoConcorrer";   // indicação negada (D82)
      }
    }
    return dec;
  };
  while (e.tempo.ano < fim) {
    const manual = Motor.Carreira.ehManual(e);
    let decisoes;
    if (manual) decisoes = catalogo ? decidir() : decidirSemCartas();
    const r = Motor.Carreira.avancar(e, dados, { opcoes, decisoes });
    e = r.resultado.estado;
    r.resultado.ocorrencias.forEach((o) => ocorrencias.push(o));
  }
  const save = Motor.Save.serializar(e);
  return { semente: cen.semente, hash: sha256(save), tempo: e.tempo, mandatos: e.cargos.mandatos, ocorrencias: JSON.parse(JSON.stringify(ocorrencias)) };
}

function principal(argv) {
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.indexOf("--lote") >= 0) { // calibração com dados reais (D87); não usa --cenario
    const n = Number(arg("--n") || 300), anos = Number(arg("--anos") || 12);
    return JSON.stringify(require("./lote.js").lote(carregarMotor(), n, anos, arg("--semente-base") || "v1-LOTE"), null, 1);
  }
  const arq = arg("--cenario");
  if (!arq) throw new Error("uso: node tools/sim.js --cenario <arquivo.json> [--semente S] [--rodadas N --semente-base S] [--carreira --anos N]");
  const cen = JSON.parse(fs.readFileSync(arq, "utf8"));
  const Motor = carregarMotor();
  if (argv.indexOf("--carreira") >= 0) {
    const anos = arg("--anos") === undefined ? cen.anos : Number.parseInt(arg("--anos"), 10);
    if (!Number.isSafeInteger(anos) || anos < 1) throw new Error("--anos: inteiro positivo");
    const c = arg("--semente") ? { ...cen, semente: arg("--semente") } : cen;
    const cat = arg("--cartas") ? JSON.parse(fs.readFileSync(arg("--cartas"), "utf8")) : undefined;
    const evs = arg("--eventos") ? JSON.parse(fs.readFileSync(arg("--eventos"), "utf8")) : undefined;
    const mods = arg("--modelos") ? JSON.parse(fs.readFileSync(arg("--modelos"), "utf8")) : undefined;
    const noms = arg("--nomeacoes") ? JSON.parse(fs.readFileSync(arg("--nomeacoes"), "utf8")) : undefined;
    return canonico(carreira(Motor, c, path.dirname(arq), anos, cat, evs, mods, noms));
  }
  const n = arg("--rodadas");
  const out = n === undefined ? rodar(Motor, cen, arg("--semente") || cen.semente)
    : lote(Motor, cen, arg("--semente-base") || cen.semente, Number.parseInt(n, 10));
  return canonico(out);
}

if (require.main === module) process.stdout.write(principal(process.argv.slice(2)) + "\n");
module.exports = { carregarMotor, canonico, sorteador, opcoesDoCenario, rodar, lote, carreira, principal };
