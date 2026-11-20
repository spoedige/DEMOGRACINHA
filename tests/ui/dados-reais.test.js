"use strict";
// Etapa 1B (D86): criação com estado, município e partido reais e convenção com modelos reais, servidos por HTTP local
// (o mesmo domínio do site). Com CAPTURAS_DIR, grava capturas.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { chromium } = require("playwright");
const { carregarMotor } = require("../motor/carregar");

const RAIZ = path.join(__dirname, "..", "..");
const PUB = path.join(RAIZ, "public");
const CAPTURAS = process.env.CAPTURAS_DIR;
const { Motor } = carregarMotor();
const TIPOS = { ".html": "text/html; charset=utf-8", ".json": "application/json" };

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
      const f = path.join(PUB, rel);
      if (!f.startsWith(PUB) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
    }).listen(0, "127.0.0.1", () => ok(s));
  });
}
async function abrir(nav, url) {
  const pg = await (await nav.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: CAPTURAS ? 2 : 1 })).newPage();
  const erros = []; pg.on("pageerror", (x) => erros.push(x.message)); pg.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  await pg.goto(url);
  return { pg, erros };
}
const titulo = (pg) => pg.textContent("h1.dossier-title");

test("criação com dados reais: estado, município com busca e partido do registro", { timeout: 90000 }, async () => {
  const srv = await servidor(), nav = await chromium.launch();
  try {
    const { pg, erros } = await abrir(nav, `http://127.0.0.1:${srv.address().port}/index.html`);
    await pg.click("[data-acao=criar-tela]");
    await pg.fill("#nome", "Personagem Real");
    await pg.click("[data-acao=passo-seguinte]"); await pg.click("[data-acao=passo-seguinte]");
    await pg.locator("[data-ambicao]").first().click(); await pg.click("[data-acao=passo-seguinte]");
    await pg.waitForSelector("#uf-novo");
    await pg.selectOption("#uf-novo", "RR");
    assert.equal(await pg.locator("#municipio-novo-lista option").count(), 15);          // 15 municípios em Roraima
    await pg.fill("#municipio-novo", "Boa Vista (RR)");
    await pg.selectOption("#partido-novo", "PT");
    if (CAPTURAS) await pg.screenshot({ path: path.join(CAPTURAS, "1b-criacao.png"), fullPage: true });
    await pg.click("#criacao button[type=submit]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent !== "Território e partido");
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.equal(salvo.personagem.municipioLocal, "1400100"); assert.equal(salvo.personagem.ufAtual, "RR"); assert.equal(salvo.personagem.partidoId, "PT");
    assert.deepEqual(erros, []);
  } finally { await nav.close(); srv.close(); }
});

test("convenção de 2026 com modelos reais: cargos gerais da UF e nomes reais na ficha", { timeout: 90000 }, async () => {
  const srv = await servidor(), nav = await chromium.launch();
  try {
    const c = JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", "carreira.json"), "utf8")); delete c.eleicoes; c.ritmo = "express";
    Object.assign(c.inicio.personagem, { municipioInicial: "3550308", ufInicial: "SP", partidoId: "PT" });
    c.inicio.base.municipios = { 3550308: { forca: 0.2, custoManutencao: 0 } };
    const e = JSON.parse(JSON.stringify(Motor.Carreira.criar({}, c, null).resultado)); e.tempo = { ano: 2026, janela: "J3" };
    const { pg, erros } = await abrir(nav, `http://127.0.0.1:${srv.address().port}/index.html`);
    await pg.evaluate((s) => localStorage.setItem("demogracinha.save", s), Motor.Save.serializar(e));
    await pg.reload(); await pg.click("[data-acao=continuar-salvo]");
    await pg.waitForFunction(() => document.querySelector("h1.dossier-title") && document.querySelector("h1.dossier-title").textContent === "Oferta de candidatura");
    const txt = await pg.textContent("main");
    assert.match(txt, /Deputado federal em São Paulo/); assert.match(txt, /Deputado estadual em São Paulo/);
    assert.match(txt, /Presidente em Brasil/);
    if (CAPTURAS) await pg.screenshot({ path: path.join(CAPTURAS, "1b-convencao.png"), fullPage: true });
    assert.deepEqual(erros, []);
  } finally { await nav.close(); srv.close(); }
});
