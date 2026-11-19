"use strict";
// Interface (D79, sistema visual "Plano Piloto: Dossiê e Palanque"). Chromium headless a 360 x 800 sobre file://.
// Fora da suíte do motor: node --test tests/ui/*.test.js
// Com CAPTURAS_DIR definido, grava capturas das telas principais nessa pasta (escala 2).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { carregarMotor } = require("../motor/carregar");

const RAIZ = path.join(__dirname, "..", "..");
const HTML = path.join(RAIZ, "public", "index.html");
const URL_ = "file://" + HTML;
const CAPTURAS = process.env.CAPTURAS_DIR;
const FONTE = fs.readFileSync(HTML, "utf8");
const ler = (n) => JSON.parse(fs.readFileSync(path.join(RAIZ, "tools", "cenarios", n), "utf8"));
const titulo = (pg) => pg.textContent("h1.dossier-title");

test("dados embutidos são cópia exata dos catálogos de tools/cenarios; partidos só fictícios e sem logo", () => {
  const d = JSON.parse(FONTE.match(/<script type="application\/json" id="dados-exemplo">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(d.inicio, ler("carreira.json").inicio);
  assert.deepEqual(d.cartas, ler("cartas-exemplo.json"));
  assert.deepEqual(d.eventos, ler("eventos-exemplo.json"));
  assert.deepEqual(d.candidatura, ler("candidatura-exemplo.json"));
  const p = JSON.parse(FONTE.match(/<script type="application\/json" id="parties-data">([\s\S]*?)<\/script>/)[1]);
  for (const [k, v] of Object.entries(p)) if (k !== "_nota") { assert.match(k, /^P\d$/); assert.equal(v.logo, undefined); assert.equal(v.dataUri, undefined); }
  assert.doesNotMatch(FONTE, /data:image|https?:\/\/(?!www\.w3\.org\/2000\/svg)/);   // nada externo nem imagem embutida
  assert.doesNotMatch(FONTE, /Simular cena/);
});

test("contraste: texto de pelo menos 4,5:1 e bordas de controle de pelo menos 3:1", () => {
  const css = FONTE.match(/:root \{([\s\S]*?)\}/)[1];
  const cor = (n) => (n.startsWith("#") ? n : css.match(new RegExp("--" + n + ":\\s*(#[0-9A-Fa-f]{6})"))[1]);
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const razao = (a, b) => { const x = lum(cor(a)), y = lum(cor(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const texto = [["ink-primary", "bg-mesa"], ["ink-primary", "bg-card"], ["ink-primary", "bg-subtle"], ["ink-secondary", "bg-card"], ["ink-secondary", "bg-subtle"],
    ["ink-secondary", "branco"], ["brass-dark", "bg-card"], ["brass-dark", "branco"], ["civic-blue", "bg-card"], ["civic-blue", "civic-tint"], ["civic-navy", "civic-tint"],
    ["#FFFFFF", "civic-blue"], ["good-ink", "good-bg"], ["warn-ink", "warn-bg"], ["bad-ink", "bad-bg"], ["hud-label", "hud-bg"], ["hud-accent", "hud-bg"], ["ink-inverse", "hud-bg"],
    ["#FFFFFF", "#821D1D"], ["#FFFFFF", "#114226"], ["#FFFFFF", "#5B2A86"]];
  for (const [a, b] of texto) assert.ok(razao(a, b) >= 4.5, a + " sobre " + b + ": " + razao(a, b).toFixed(2));
  for (const b of ["bg-mesa", "bg-card", "branco", "bg-subtle"]) assert.ok(razao("border-card", b) >= 3, "borda sobre " + b + ": " + razao("border-card", b).toFixed(2));
});

test("fluxo completo a 360 px: criação, janelas, eventos, candidatura, eleição, abas, ritmo, export e import", { timeout: 180000 }, async () => {
  const navegador = await chromium.launch();
  try {
    const ctx = await navegador.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: CAPTURAS ? 2 : 1 });
    const pg = await ctx.newPage();
    const erros = [];
    pg.on("pageerror", (e) => erros.push(e.message));
    pg.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
    const feitas = new Set();
    // espera as animações finitas (entrada de fase, contagem) antes de capturar; as bandeiras em laço não contam
    const capturar = async (nome) => { if (CAPTURAS && !feitas.has(nome)) { feitas.add(nome);
      await pg.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect.getTiming().iterations !== Infinity).map((a) => a.finished)));
      await pg.waitForTimeout(400); await pg.screenshot({ path: path.join(CAPTURAS, nome + ".png") }); } };
    const layout = async () => {
      const r = await pg.evaluate(() => ({ largura: document.documentElement.scrollWidth,
        baixos: Array.from(document.querySelectorAll("button, select, input, textarea, [role=radio], [role=checkbox], [role=tab]"))
          .filter((b) => b.offsetParent !== null && b.getBoundingClientRect().height < 44).map((b) => b.outerHTML.slice(0, 80)) }));
      assert.ok(r.largura <= 360, "rolagem horizontal: " + r.largura);
      assert.deepEqual(r.baixos, [], "alvos menores que 44 px");
    };

    await pg.goto(URL_);
    assert.match(await pg.textContent("main"), /Partidos e lugares são reais\. Pessoas e eventos são fictícios\./);
    await layout(); await capturar("01-inicio");
    await pg.click("[data-acao=criar-tela]");
    await pg.fill("#nome", "Personagem de Teste"); await pg.fill("#nascimento", "2010-01-02"); await pg.fill("#semente", "v1-UITESTE-01");
    await pg.selectOption("#ritmo-novo", "express"); await pg.click("[data-ambicao=legislativo]");
    await pg.click("button[type=submit]");
    assert.match(await pg.textContent(".erro"), /entre 18 e 60 anos/);
    assert.equal(await pg.inputValue("#nome"), "Personagem de Teste");                 // o formulário sobrevive ao erro
    assert.equal(await pg.getAttribute("[data-ambicao=legislativo]", "aria-checked"), "true");
    await pg.fill("#nascimento", "1990-05-10");
    await layout(); await capturar("02-criacao");
    await pg.click("button[type=submit]");

    const vistos = new Set(); let viuEleicao = false;
    for (let i = 0; i < 90 && !viuEleicao; i++) {
      const h = await titulo(pg);
      await layout();
      const hud = await pg.locator(".metric-cell").count();
      if (await pg.isVisible("#hud")) assert.ok(hud >= 4 && hud <= 6, "números no painel: " + hud);
      if (h === "O que aconteceu") {
        if (/Eleição:/.test(await pg.textContent("main"))) { viuEleicao = true; await capturar("07-resultado"); }
        await pg.click("[data-acao=continuar]");
      } else if (h === "Janela automática") await pg.click("[data-acao=avancar]");
      else if (h === "Compromissos que vencem" || h === "Acontecimentos") {
        vistos.add(h); await capturar(h === "Acontecimentos" ? "04-evento" : "05-compromisso");
        for (const g of await pg.locator("[data-radiogroup]").evaluateAll((els) => els.map((x) => x.dataset.radiogroup))) {
          await pg.locator(`[data-grupo="${g}"]:not([aria-disabled=true])`).first().click();
        }
        await pg.click("[data-acao=confirmar]");
      } else if (h === "Oferta de candidatura") {
        vistos.add(h);
        const oferta = pg.locator("[data-grupo=cand]").first();
        await oferta.click(); await capturar("06-candidatura");
        await pg.click("[data-acao=confirmar]");
      } else if (h === "Ações disponíveis") {
        vistos.add(h);
        const confirmar = pg.locator("[data-acao=confirmar]");
        assert.equal(await confirmar.isDisabled(), true);                               // nada escolhido ainda
        const ids = await pg.locator("[data-grupo=carta]").evaluateAll((els) => els.map((x) => x.dataset.valor));
        const alvo = ["acordo-lideranca", "favor-emenda", "discurso-mesa", "mutirao"].find((x) => ids.includes(x)) || ids[0];
        const card = pg.locator(`[data-grupo=carta][data-valor="${alvo}"]`);
        const antes = await card.elementHandle();
        await card.click();
        assert.equal(await antes.evaluate((el) => el.isConnected && el.classList.contains("is-selected") && el.getAttribute("aria-checked")), "true"); // seleção no lugar
        await capturar("03-acoes");
        assert.equal(await confirmar.isDisabled(), false);
        await confirmar.click();
        await pg.waitForFunction(() => document.querySelector("h1.dossier-title").textContent !== "Ações disponíveis");
      } else assert.fail("tela inesperada: " + h);
    }
    assert.ok(vistos.has("Oferta de candidatura"), "a oferta de candidatura de 2028 apareceu");
    assert.ok(viuEleicao, "o resultado da eleição apareceu");

    for (const aba of ["carreira", "partido", "indicadores", "menu"]) { await pg.click(`[data-aba=${aba}]`); await layout(); await capturar("08-" + aba); }
    await pg.click("[data-aba=carreira]");
    const texto = await pg.textContent("main");
    assert.ok(texto.indexOf("Trajetória partidária") < texto.indexOf("Registro biográfico"));
    assert.match(texto, /Filiação/); assert.match(texto, /P1/);
    assert.match(texto, /2028 - Vereador(Eleito|Não eleito), [\d.]+ votos/);
    await pg.click("[data-aba=indicadores]");
    assert.match(await pg.textContent("main"), /Capacidade de entrega/);

    await pg.click("[data-aba=menu]");
    assert.match(await pg.textContent("main"), /Limpar os dados do navegador apaga a partida/);
    await pg.selectOption("#ritmo", "intenso");
    const salvo = JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save")));
    assert.equal(salvo.ritmo, "intenso"); assert.equal(salvo.saveVersion, 3); assert.equal(salvo.personagem.nome, "Personagem de Teste");
    assert.doesNotThrow(() => carregarMotor().Motor.Save.ler(JSON.stringify(salvo)));
    await pg.click("[data-acao=exportar]");
    await pg.waitForSelector("#codigo-export");
    const codigo = await pg.inputValue("#codigo-export");
    assert.match(codigo, /^DG1:/);

    await pg.evaluate(() => localStorage.removeItem("demogracinha.save")); await pg.reload();
    assert.equal(await pg.locator("[data-acao=continuar-salvo]").count(), 0);
    await pg.click("[data-acao=abrir-import]");
    assert.equal(await pg.evaluate(() => document.activeElement.id), "codigo-import");
    await pg.fill("#codigo-import", "DG1:////"); await pg.click("[data-acao=importar]");
    assert.match(await pg.textContent("#gaveta-import .erro"), /Não foi possível importar/);
    await capturar("09-importar");
    await pg.fill("#codigo-import", codigo); await pg.click("[data-acao=importar]");
    assert.equal(await pg.isHidden("#gaveta-import"), true);
    assert.deepEqual(JSON.parse(await pg.evaluate(() => localStorage.getItem("demogracinha.save"))), salvo);
    await pg.reload(); await pg.click("[data-acao=continuar-salvo]");
    assert.match(await pg.textContent(".hud-turn"), new RegExp(salvo.tempo.ano + ", janela " + salvo.tempo.janela));

    assert.deepEqual(erros, []);
  } finally { await navegador.close(); }
});

test("teclado e movimento reduzido: setas no grupo de ações, sem animação de fase nem carimbo", { timeout: 60000 }, async () => {
  const navegador = await chromium.launch();
  try {
    const pg = await (await navegador.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" })).newPage();
    await pg.goto(URL_);
    await pg.click("[data-acao=criar-tela]"); await pg.fill("#nome", "Teclado"); await pg.fill("#semente", "v1-TECLADO-01");
    await pg.click("button[type=submit]");
    assert.equal(await titulo(pg), "Ações disponíveis");
    assert.equal(await pg.locator(".phase-enter").count(), 0);
    const primeiro = pg.locator("[data-grupo=carta]").first();
    await primeiro.focus(); await pg.keyboard.press("Space");
    assert.equal(await primeiro.getAttribute("aria-checked"), "true");
    await pg.keyboard.press("ArrowDown");
    assert.equal(await primeiro.getAttribute("aria-checked"), "false");
    assert.equal(await pg.evaluate(() => document.activeElement.getAttribute("aria-checked")), "true");
    await pg.click("[data-acao=confirmar]");
    assert.equal(await titulo(pg), "O que aconteceu");                                   // sem espera do carimbo
    assert.equal(await pg.evaluate(() => document.getElementById("carimbo").classList.contains("is-visible")), false);
  } finally { await navegador.close(); }
});
