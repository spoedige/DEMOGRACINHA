"use strict";
// Cenário vivo (D81): postura pelo clima de rua, multidão pela popularidade, fogos na posse; parado com movimento reduzido.
// Estados montados pelo motor e carregados pelo save local. Com CAPTURAS_DIR, grava as capturas das posturas e da posse.
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
const CEN = JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", "carreira.json"), "utf8"));

function estado(mod) {
  const c = JSON.parse(JSON.stringify(CEN)); delete c.eleicoes; c.ritmo = "express";
  const e = Motor.Carreira.criar({}, c, null).resultado;
  const x = JSON.parse(JSON.stringify(e)); mod(x);
  return Motor.Save.serializar(x);
}
async function abrir(navegador, save, opcoes) {
  const ctx = await navegador.newContext(Object.assign({ viewport: { width: 360, height: 800 }, deviceScaleFactor: CAPTURAS ? 2 : 1 }, opcoes || {}));
  const pg = await ctx.newPage();
  const erros = []; pg.on("pageerror", (x) => erros.push(x.message)); pg.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  await pg.goto(URL_);
  await pg.evaluate((s) => localStorage.setItem("demogracinha.save", s), save);
  await pg.reload(); await pg.click("[data-acao=continuar-salvo]");
  return { pg, erros };
}
const palco = (pg, a) => pg.getAttribute("#sky-stage", a);
// chega à fase de ações recusando convites de nomeação, se houver
async function jogarAcao(pg) {
  if ((await pg.textContent("h1.dossier-title")) === "Convites de nomeação") { await pg.click("[data-grupo=nom][data-valor=recusar]"); await pg.click("[data-acao=confirmar]"); }
  await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
  await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
}
const indicadores = (pop, rej, noto) => (x) => { x.indicadores.local = { notoriedade: noto, popularidade: pop, rejeicao: rej }; };

test("postura pelo clima de rua e multidão pelos limites de popularidade (0,05, 0,10, 0,20, 0,30)", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const casos = [[0.04, 0.01, 0.1, "discreta", "0"], [0.05, 0.01, 0.1, "discreta", "1"], [0.12, 0.03, 0.2, "discreta", "2"],
      [0.25, 0.02, 0.4, "popular", "3"], [0.3, 0.02, 0.5, "popular", "4"], [0.05, 0.2, 0.3, "hostil", "1"]];
    for (const [pop, rej, noto, postura, nivel] of casos) {
      const { pg, erros } = await abrir(nav, estado(indicadores(pop, rej, noto)));
      assert.equal(await palco(pg, "data-postura"), postura, "postura com popularidade " + pop);
      assert.equal(await palco(pg, "data-multidao"), nivel, "multidão com popularidade " + pop);
      const visiveis = await pg.evaluate(() => Array.from(document.querySelectorAll(".multidao")).filter((g) => getComputedStyle(g).opacity === "1").length);
      if (!CAPTURAS) assert.ok(visiveis <= Number(nivel));
      const figuras = await pg.evaluate(() => Array.from(document.querySelectorAll(".figura")).map((g) => g.classList[1]));
      assert.deepEqual(figuras, ["pose-discreta", "pose-popular", "pose-hostil"]);
      if (CAPTURAS && (nivel === "2" || postura !== "discreta")) {
        await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(CAPTURAS, "cena-" + postura + "-" + nivel + ".png"), clip: { x: 0, y: 0, width: 360, height: 400 } });
      }
      assert.deepEqual(erros, []);
      await pg.context().close();
    }
    const { pg } = await abrir(nav, estado(indicadores(0.3, 0.02, 0.5)));
    const cor = await pg.evaluate(() => getComputedStyle(document.querySelector(".bandeira-partido")).fill);
    assert.equal(cor, "rgb(19, 64, 116)");                                              // cor do P1 em parties-data
    await pg.click("[data-aba=menu]"); await pg.click("[data-acao=nova]"); await pg.click("[data-acao=nova]");
    assert.equal(await palco(pg, "data-postura"), "");                                    // fora da partida, sem figura
  } finally { await nav.close(); }
});

const posse = (x) => { x.tempo = { ano: 2029, janela: "C1" };
  x.cargos.mandatos = [{ disputaId: "2028|VEREADOR|EX001|1", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2029-01-01", fim: "2032-12-31", situacao: "eleito" }]; };

test("fogos na posse de mandato eletivo, uma vez, com céu noturno; sem posse, sem fogos", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, estado(posse));
    assert.equal(await palco(pg, "data-fogos"), "0");
    await jogarAcao(pg);
    assert.equal(await palco(pg, "data-fogos"), "1");
    assert.match(await pg.textContent("main"), /Posse no mandato/);
    const rodando = await pg.evaluate(() => document.getAnimations().filter((a) => a.effect.target.closest && a.effect.target.closest(".fogo")).length);
    assert.ok(rodando > 0);
    if (CAPTURAS) { await pg.waitForTimeout(900); await pg.screenshot({ path: path.join(CAPTURAS, "cena-posse-fogos.png"), clip: { x: 0, y: 0, width: 360, height: 400 } }); }
    await pg.waitForFunction(() => document.getElementById("sky-stage").getAttribute("data-fogos") === "0", null, { timeout: 5000 });
    await pg.click("[data-acao=continuar]");
    assert.equal(await palco(pg, "data-fogos"), "0");
    assert.deepEqual(erros, []);
    const sem = await abrir(nav, estado(() => {}));
    await jogarAcao(sem.pg);
    assert.equal(await palco(sem.pg, "data-fogos"), "0"); assert.equal(await palco(sem.pg, "data-brilho"), "0");
  } finally { await nav.close(); }
});

test("movimento reduzido: sem fogos, brilho dourado parado no céu na posse e nenhuma animação rodando", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, estado((x) => { posse(x); indicadores(0.3, 0.02, 0.5)(x); }), { reducedMotion: "reduce" });
    assert.equal(await palco(pg, "data-postura"), "popular");
    await pg.waitForTimeout(150);
    const ativas = () => pg.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    assert.equal(await ativas(), 0);                                                     // aceno e bandeiras parados
    await jogarAcao(pg);
    assert.equal(await palco(pg, "data-fogos"), "0"); assert.equal(await palco(pg, "data-brilho"), "1");
    await pg.waitForTimeout(150);
    assert.equal(await ativas(), 0);
    assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector(".brilho-ceu")).opacity), "1");
    const caixa = await pg.evaluate(() => { const b = document.querySelector(".brilho-ceu").getBoundingClientRect(), h = document.getElementById("hud").getBoundingClientRect(); return { topo: b.top, hud: h.top }; });
    assert.ok(caixa.topo < caixa.hud - 60, "brilho visível acima do painel");
    if (CAPTURAS) await pg.screenshot({ path: path.join(CAPTURAS, "cena-posse-reduzido.png"), clip: { x: 0, y: 0, width: 360, height: 400 } });
    await pg.click("[data-acao=continuar]");
    assert.equal(await palco(pg, "data-brilho"), "0");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});
