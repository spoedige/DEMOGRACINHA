"use strict";
// Troca de partido e de domicílio (D83) na interface: painel na fase de ações, bloqueio explicado e trajetória partidária.
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

function save(ano, janela, mod) {
  const c = JSON.parse(JSON.stringify(CEN)); delete c.eleicoes; c.ritmo = "normal";
  const e = JSON.parse(JSON.stringify(Motor.Carreira.criar({}, c, null).resultado));
  e.tempo = { ano, janela }; if (mod) mod(e);
  return Motor.Save.serializar(e);
}
async function abrir(nav, s) {
  const pg = await (await nav.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: CAPTURAS ? 2 : 1 })).newPage();
  const erros = []; pg.on("pageerror", (x) => erros.push(x.message)); pg.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  await pg.goto(URL_); await pg.evaluate((v) => localStorage.setItem("demogracinha.save", v), s);
  await pg.reload(); await pg.click("[data-acao=continuar-salvo]");
  return { pg, erros };
}
const shot = async (pg, nome, sel) => { if (CAPTURAS) { await pg.waitForTimeout(450); await (sel ? pg.locator(sel) : pg).screenshot({ path: path.join(CAPTURAS, nome + ".png"), ...(sel ? {} : { fullPage: true }) }); } };

test("J1 do ano eleitoral: troca de partido e de domicílio junto com a ação; trajetória com os dois registros", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, save(2028, "J1"));
    assert.equal(await pg.textContent("h1.dossier-title"), "Ações disponíveis");
    assert.match(await pg.textContent("main"), /Filiação e domicílio/);
    await pg.selectOption("#troca-partido", "P2"); await pg.selectOption("#troca-domicilio", "EY001");
    await shot(pg, "troca-painel");
    await pg.locator("[data-grupo=carta]").first().click(); await pg.click("[data-acao=confirmar]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent === "O que aconteceu");
    const txt = await pg.textContent("main");
    assert.match(txt, /Filiação ao P2\./); assert.match(txt, /transferido para EY001, em outro estado/);
    await pg.click("[data-aba=carreira]");
    const marcas = await pg.locator(".pt-item").evaluateAll((els) => els.map((x) => x.querySelector(".pt-sigla").textContent + "|" + x.querySelector(".pt-chip").textContent));
    assert.deepEqual(marcas, ["P2|Mudança de partido", "P1|Filiação"]);
    assert.match(await pg.textContent(".pt-item.is-latest"), /Troca na janela partidária\. Filiação atual\./);
    await shot(pg, "troca-trajetoria", ".dossier-card >> nth=0");
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.equal(salvo.personagem.partidoId, "P2"); assert.equal(salvo.personagem.ufAtual, "EY"); assert.ok(salvo.personagem.tags.includes("paraquedista"));
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});

test("vereador no ano calmo: troca de partido bloqueada com o aviso da janela", { timeout: 60000 }, async () => {
  const nav = await chromium.launch();
  try {
    const s = save(2027, "C1", (e) => { e.cargos.mandatos = [{ disputaId: "D", cargo: "VEREADOR", unidadeId: "EX001", inicio: "2025-01-01", fim: "2028-12-31", situacao: "exercicio" }]; });
    const { pg, erros } = await abrir(nav, s);
    if ((await pg.textContent("h1.dossier-title")) === "Convites de nomeação") { await pg.click("[data-grupo=nom][data-valor=recusar]"); await pg.click("[data-acao=confirmar]"); }
    assert.equal(await pg.isDisabled("#troca-partido"), true);
    assert.match(await pg.textContent("main"), /Fora da janela partidária, trocar de partido acarretaria perda do mandato/);
    assert.equal(await pg.locator("#troca-domicilio").count(), 0);                       // ano calmo: sem domicílio
    await shot(pg, "troca-bloqueada");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); }
});
