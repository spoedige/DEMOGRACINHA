"use strict";
// Vice e sucessão (D84): convite de vice na convenção, convite desfeito e sucessão por evento.
// Estados montados pelo motor; sementes escolhidas pelo próprio sorteio do convite. Com CAPTURAS_DIR, grava capturas.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { carregarMotor } = require("../motor/carregar");

const RAIZ = path.join(__dirname, "..", "..");
const URL_ = "file://" + path.join(RAIZ, "public", "index.html");
const CAPTURAS = process.env.CAPTURAS_DIR;
const { Motor } = carregarMotor();
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const CEN = ler("carreira.json"), CAND = ler("candidatura-exemplo.json");
const VICE = '[data-grupo=cand][data-valor="vice:2028|PREFEITO|EX001|1"]';

function estado(semente, ano, janela) {
  const c = JSON.parse(JSON.stringify(CEN)); delete c.eleicoes; c.ritmo = "express"; c.semente = semente;
  const e = JSON.parse(JSON.stringify(Motor.Carreira.criar({}, c, null).resultado));
  e.tempo = { ano, janela };
  return e;
}
function sementePara(confirmado) {
  for (let i = 0; i < 200; i++) {
    const e = estado("v1-VICE-" + i, 2028, "J3"), o = Motor.Candidatura.ofertas(e, CAND).find((x) => x.tipo === "vice");
    if (Motor.Candidatura.sortearIndicacao(e, CAND, o).concedida === confirmado) return Motor.Save.serializar(e);
  }
  throw new Error("sem semente para o desfecho " + confirmado);
}
async function abrir(nav, save) {
  const pg = await (await nav.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: CAPTURAS ? 2 : 1 })).newPage();
  const erros = []; pg.on("pageerror", (x) => erros.push(x.message)); pg.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  await pg.goto(URL_);
  await pg.evaluate((s) => localStorage.setItem("demogracinha.save", s), save);
  await pg.reload(); await pg.click("[data-acao=continuar-salvo]");
  return { pg, erros };
}
const titulo = (pg) => pg.textContent("h1.dossier-title");
const capturar = async (pg, nome) => { if (CAPTURAS) { await pg.waitForTimeout(450); await pg.screenshot({ path: path.join(CAPTURAS, nome + ".png"), fullPage: true }); } };

test("convite de vice: ficha própria, confirmação e registro da candidatura de vice", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, sementePara(true));
    assert.equal(await titulo(pg), "Oferta de candidatura");
    const card = await pg.textContent(VICE);
    assert.match(card, /Convite de vice/); assert.match(card, /Vice-prefeito em EX001/);
    assert.match(card, /Chance de confirmação/); assert.match(card, /Competitividade do titular/); assert.match(card, /Vice na chapa de P1/);
    await pg.locator(VICE).scrollIntoViewIfNeeded(); await capturar(pg, "vice-convite");
    await pg.click(VICE); await pg.click("[data-acao=detalhe-escolher]"); await pg.click("[data-acao=confirmar]");
    assert.equal(await titulo(pg), "Ações disponíveis");
    await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
    assert.match(await pg.textContent("main"), /A chapa confirmou o seu nome para vice/);
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.equal(salvo.candidaturas[0].cargo, "VICE_PREFEITO"); assert.equal(salvo.candidaturas[0].titularId, "X1");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});

test("convite desfeito: carimbo próprio e segunda escolha só com lista ou não concorrer", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, sementePara(false));
    await pg.click(VICE); await pg.click("[data-acao=detalhe-escolher]"); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.getElementById("carimbo-main").textContent === "CONVITE DESFEITO");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "Convite desfeito");
    assert.match(await pg.textContent("main"), /A chapa preferiu outro nome para Vice-prefeito/);
    const opcoes = await pg.locator("[data-grupo=alt]").evaluateAll((els) => els.map((x) => x.dataset.valor));
    assert.deepEqual(opcoes, ["lista:2028|VEREADOR|EX001|1", "naoConcorrer"]);
    await capturar(pg, "vice-desfeito");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});

test("sucessão por evento: o vice assume o cargo do titular e o HUD mostra o novo cargo", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const e = estado("v1-SUCESSAO", 2029, "C1");
    e.cargos.mandatos = [{ disputaId: "2028|PREFEITO|EX001|1", cargo: "VICE_PREFEITO", unidadeId: "EX001", inicio: "2029-01-01", fim: "2032-12-31",
      situacao: "exercicio", papel: "vice", chapaId: "CH1", titularId: "X1" }];
    e.filaEventos = [{ id: "V", janelaAlvo: { ano: 2029, janela: "C1" }, dados: { eventoId: "vaga-do-titular", origemCartaId: "x", prob: 1, condicao: null, nivelCorrupcao: null } }];
    const { pg, erros } = await abrir(nav, Motor.Save.serializar(e));
    assert.match(await pg.textContent("body"), /Vice-prefeito/);
    // evento de opção única: resolve na abertura; segue para as ações
    await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
    const main = await pg.textContent("main");
    assert.match(main, /Vaga no cargo do titular/); assert.match(main, /Você assumiu o cargo de Prefeito até o fim do mandato/);
    await capturar(pg, "vice-sucessao");
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.equal(salvo.cargos.mandatos[0].cargo, "PREFEITO"); assert.equal(salvo.cargos.mandatos[0].sucedeu, true);
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});
