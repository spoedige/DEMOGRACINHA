"use strict";
// Convenção (D82): ficha com chance de indicação e competitividade; indicação negada com segunda escolha; indicação concedida.
// Estados montados pelo motor; sementes escolhidas pelo próprio sorteio da indicação. Com CAPTURAS_DIR, grava capturas.
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

function estadoEm2028(semente) {
  const c = JSON.parse(JSON.stringify(CEN)); delete c.eleicoes; c.ritmo = "express"; c.semente = semente;
  const e = JSON.parse(JSON.stringify(Motor.Carreira.criar({}, c, null).resultado));
  e.tempo = { ano: 2028, janela: "J3" };
  return e;
}
// primeira semente cujo sorteio de indicação para prefeito dá o desfecho pedido
function sementePara(concedida) {
  for (let i = 0; i < 200; i++) {
    const e = estadoEm2028("v1-CONV-" + i), o = Motor.Candidatura.ofertas(e, CAND).find((x) => x.cargo === "PREFEITO");
    if (Motor.Candidatura.sortearIndicacao(e, CAND, o).concedida === concedida) return Motor.Save.serializar(e);
  }
  throw new Error("sem semente para o desfecho " + concedida);
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
const PEDIDO = '[data-grupo=cand][data-valor="indicacao:2028|PREFEITO|EX001|1"]';

test("ficha da convenção: lista com vaga garantida e pedido de indicação com faixas, sem número de chance", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, sementePara(false));
    assert.equal(await titulo(pg), "Oferta de candidatura");
    const lista = await pg.textContent('[data-grupo=cand][data-valor^="lista:"]');
    assert.match(lista, /Vaga garantida na lista/); assert.match(lista, /Competitividade hoje/);
    const pedido = await pg.textContent(PEDIDO);
    assert.match(pedido, /Pedir indicação/); assert.match(pedido, /Chance de indicaçãoBaixa/);
    const valor = await pg.locator(PEDIDO + " .ficha-item").first().locator(".ficha-v").textContent();
    assert.ok(["Baixa", "Média", "Alta"].includes(valor), "chance em faixa, sem número: " + valor);
    await capturar(pg, "convencao-oferta");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});

test("indicação negada: carimbo, segunda escolha só com lista ou não concorrer, e candidatura registrada na lista", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, sementePara(false));
    await pg.click(PEDIDO); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.getElementById("carimbo-main").textContent === "INDICAÇÃO NEGADA");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "Indicação negada");
    assert.match(await pg.textContent("main"), /O partido preferiu outro nome para Prefeito/);
    const opcoes = await pg.locator("[data-grupo=alt]").evaluateAll((els) => els.map((x) => x.dataset.valor));
    assert.deepEqual(opcoes, ["lista:2028|VEREADOR|EX001|1", "naoConcorrer"]);
    await capturar(pg, "convencao-negada");
    await pg.click('[data-grupo=alt][data-valor^="lista:"]'); await pg.click("[data-acao=confirmar]");
    assert.equal(await titulo(pg), "Ações disponíveis");
    await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
    assert.match(await pg.textContent("main"), /O partido negou a indicação/);
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.deepEqual(salvo.candidaturas[0].indicacao, { pedida: true, concedida: false, pedidoDisputaId: "2028|PREFEITO|EX001|1" });
    assert.equal(salvo.candidaturas[0].cargo, "VEREADOR");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});

test("indicação concedida: segue para as ações e registra a cabeça de chapa", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, sementePara(true));
    await pg.click(PEDIDO); await pg.click("[data-acao=confirmar]");
    assert.equal(await titulo(pg), "Ações disponíveis");
    await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
    assert.match(await pg.textContent("main"), /O partido confirmou a sua indicação/);
    await capturar(pg, "convencao-concedida");
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.deepEqual(salvo.candidaturas[0].indicacao, { pedida: true, concedida: true });
    assert.equal(salvo.candidaturas[0].cargo, "PREFEITO");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});
