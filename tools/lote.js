"use strict";
// Lote de calibração (D87): N carreiras com dados reais, origens e portes de município, jogador automático simples.
// Política do simulador, não regra do motor: concorre quando há oferta (pedido majoritário com chance média ou alta,
// senão a lista do cargo mais alto), escolhe a carta de maior ganho esperado, aceita nomeações, sai para disputar,
// escolhe nos eventos a opção de maior soma de efeitos (sem filtro de risco) e cumpre compromissos quando pode.
// Uso: node tools/sim.js --lote [--n 300] [--anos 12] [--semente-base v1-LOTE]
const fs = require("node:fs");
const path = require("node:path");
const RAIZ = path.join(__dirname, "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8"));
const PORTES = { pequeno: [0, 20000], medio: [20001, 200000], grande: [200001, Infinity] };
const ESCADA = ["VEREADOR", "VICE_PREFEITO", "PREFEITO", "DEPUTADO_ESTADUAL", "DEPUTADO_DISTRITAL", "DEPUTADO_FEDERAL", "VICE_GOVERNADOR",
  "SENADOR", "GOVERNADOR", "VICE_PRESIDENTE", "PRESIDENTE"];
const NIVEL = { VEREADOR: 1, VICE_PREFEITO: 1, PREFEITO: 1, DEPUTADO_ESTADUAL: 2, DEPUTADO_DISTRITAL: 2, DEPUTADO_FEDERAL: 2, SENADOR: 2,
  VICE_GOVERNADOR: 3, GOVERNADOR: 3, VICE_PRESIDENTE: 3, PRESIDENTE: 3 };

function contexto(Motor) {
  const reg = J("data/consolidado/partidos.json"), cfg = J("data/consolidado/parametros-modelos.json"), cat = J("data/catalogo/catalogo-jogo.json");
  const cand = J("tools/cenarios/candidatura-exemplo.json"), car = J("tools/cenarios/carreira.json"), orig = J("data/catalogo/origens.json");
  const mun = J("public/data/municipios.json").municipios, br = J("public/data/eleicoes/BR.json"), bases = {};
  const base = (uf) => bases[uf] || (bases[uf] = J("public/data/eleicoes/" + uf + ".json"));
  const dados = { cartas: cat.cartas, ambicoes: cat.ambicoes, parametrosCartas: cat.parametrosCartas, parametrosDegrau: cat.parametrosDegrau,
    eventos: cat.eventos, posicoes: cat.posicoes, regrasIndicacao: cand.regrasIndicacao, faixasFicha: cand.faixasFicha, ambicoesCargos: cand.ambicoesCargos,
    regrasCargo: cfg.regrasCargo, governos: {}, clausula: Object.assign({ base: br.deputadoFederal2022, registro: reg }, cfg.clausula) };
  return { Motor, reg, cfg, cat, car, orig, mun, br, base, dados, porId: new Map(cat.cartas.map((c) => [c.id, c])) };
}
// amostra determinística: município do porte pela semente, entre os que têm eleição municipal
function escolher(lista, chave) { let h = 0; for (const ch of chave) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return lista[h % lista.length]; }

// partido entre os 5 mais votados para vereador em 2024 no município (jogador que escolhe legenda viável)
function partidoLocal(ctx, m, semente) {
  const v = (ctx.base(m.uf).municipios[m.id] || { votos: {} }).votos.VEREADOR || {};
  const top = Object.keys(v).sort((a, b) => v[b] - v[a] || (a < b ? -1 : 1)).slice(0, 5);
  return top.length ? escolher(top, semente + "p") : escolher(ctx.reg.partidos, semente + "p").id;
}
function ganho(carta) {
  if (!carta || carta.segura) return 0;
  const s = (xs) => (xs || []).reduce((a, x) => a + (x.alvo.includes("rejeicao") ? -x.delta : x.delta), 0);
  const p = carta.sucesso ? carta.sucesso.base : 0.5, r = carta.risco ? carta.risco.probBase : 0;
  return p * s(carta.efeitos) + (1 - p) * s(carta.efeitosFalha) + r * s(carta.risco && carta.risco.efeitos);
}
function oferta(ofs) {
  const nivel = (o) => ESCADA.indexOf(o.cargo.replace(/^VICE_/, "")) * 2 + (o.tipo === "vice" ? 0 : 1);
  // majoritário só com chance alta e competitividade não baixa; senão, a lista proporcional
  const boas = ofs.filter((o) => o.tipo === "proporcional" || (o.ficha.chanceIndicacao === "alta" && o.ficha.competitividade !== "baixa"));
  const pool = boas.length ? boas : ofs;
  return pool.slice().sort((a, b) => nivel(b) - nivel(a) || (a.id < b.id ? -1 : 1))[0].id;
}
function soma(op) { return (op.efeitos || []).reduce((a, x) => a + (x.alvo.includes("rejeicao") ? -x.delta : x.delta), 0); }

function carreira(ctx, origemId, municipio, ambicao, semente, anos) {
  const { Motor: M, dados, cfg, reg } = ctx;
  const org = ctx.orig.origens.find((o) => o.id === origemId);
  const cen = JSON.parse(JSON.stringify(ctx.car)); delete cen.eleicoes;
  cen.semente = semente; cen.ritmo = "express";
  cen.inicio = M.Origens.inicio(ctx.car.inicio, org, municipio.id, municipio.uf, partidoLocal(ctx, municipio, semente), municipio.eleitorado, ctx.orig.escalaPorte);
  cen.inicio.personagem.ambicao = [ambicao];
  let e = M.Carreira.criar({}, cen, null).resultado;
  const fim = e.tempo.ano + anos, opcoes = { opcoesEleicao: (c) => M.Distribuicoes.opcoesDoCenario(c) }, cache = {};
  const prep = () => {
    const p = e.personagem, k = e.tempo.ano + "|" + p.municipioLocal + "|" + p.ufAtual;
    cache[k] = cache[k] || M.Modelos.doAno(e.tempo.ano, ctx.base(p.ufAtual), ctx.br, reg, cfg, p.municipioLocal, p.ufAtual);
    dados.modelosDisputa = { [e.tempo.ano]: cache[k] };
  };
  const decidir = () => {
    const dec = { compromissos: {}, eventos: {} };
    const pv = () => M.Carreira.previa(e, dados, { opcoes, decisoes: dec });
    let p = pv();
    (p.compromissos || []).forEach((c) => { dec.compromissos[c.id] = c.podeCumprir ? "cumprir" : "romper"; });
    if ((p.compromissos || []).length) p = pv();
    if (p.eventos.length) { p.eventos.forEach((x) => { const ev = dados.eventos.find((y) => y.id === x.eventoId); const ops = ev.opcoes.slice().sort((a, b) => soma(b) - soma(a)); dec.eventos[x.id] = ops[0].id; }); p = pv(); }
    if (p.desincompatibilizacao) { dec.desincompatibilizacao = "sair"; p = pv(); }
    if (p.nomeacoes) { dec.nomeacao = p.nomeacoes.length ? p.nomeacoes[0].id : "recusar"; p = pv(); }
    if (p.candidaturas) { dec.candidatura = p.candidaturas.length ? oferta(p.candidaturas) : "naoConcorrer"; p = pv(); }
    if (p.indicacaoNegada) { const ls = p.candidaturas || []; dec.alternativa = ls.length ? oferta(ls) : "naoConcorrer"; p = pv(); }
    const ops = [p.mao.segura].concat(p.mao.acoes);
    dec.carta = ops.slice().sort((a, b) => ganho(ctx.porId.get(b)) - ganho(ctx.porId.get(a)) || (a < b ? -1 : 1))[0];
    return dec;
  };
  while (e.tempo.ano < fim) {
    prep();
    const r = M.Carreira.avancar(e, dados, { opcoes, decisoes: M.Carreira.ehManual(e) ? decidir() : undefined });
    e = r.resultado.estado;
  }
  const cargos = e.cargos.mandatos.map((m) => m.cargo);
  return { origem: origemId, cargos, nivel: Math.max(0, ...cargos.map((c) => NIVEL[c] || 0)),
    inelegivel: e.personagem.statusJuridico === "inelegibilidadeReconhecida", nomeado: e.cargos.nomeacoes.length > 0 };
}

function lote(Motor, n, anos, sementeBase) {
  const ctx = contexto(Motor), origens = ctx.orig.origens.map((o) => o.id), ambs = ctx.cat.ambicoes;
  const comEleicao = ctx.mun.filter((m) => !["5300108", "2605459"].includes(m.id));
  const porPorte = {}; Object.keys(PORTES).forEach((k) => { porPorte[k] = comEleicao.filter((m) => m.eleitorado >= PORTES[k][0] && m.eleitorado <= PORTES[k][1]); });
  const linhas = [];
  for (let i = 0; i < n; i++) {
    const porte = Object.keys(PORTES)[i % 3], origem = origens[Math.floor(i / 3) % origens.length], amb = ambs[Math.floor(i / 15) % ambs.length];
    const sem = sementeBase + "-" + i, m = escolher(porPorte[porte], sem);
    const r = carreira(ctx, origem, m, amb, sem, anos); r.porte = porte; linhas.push(r);
  }
  const pct = (xs, f) => (xs.length ? Math.round(1000 * xs.filter(f).length / xs.length) / 10 : 0);
  const resumo = (xs) => ({ n: xs.length, eleitoAlgumaVez: pct(xs, (x) => x.nivel >= 1), deputadoOuSenador: pct(xs, (x) => x.nivel >= 2),
    governadorOuPresidente: pct(xs, (x) => x.nivel >= 3), semCargo: pct(xs, (x) => x.nivel === 0 && !x.nomeado), inelegivel: pct(xs, (x) => x.inelegivel) });
  const por = (k) => Object.fromEntries([...new Set(linhas.map((x) => x[k]))].sort().map((v) => [v, resumo(linhas.filter((x) => x[k] === v))]));
  return { n, anos, sementeBase, geral: resumo(linhas), porOrigem: por("origem"), porPorte: por("porte") };
}
module.exports = { lote, carreira, contexto, PORTES };
