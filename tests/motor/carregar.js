// Carrega o motor de public/index.html (bloco <script id="motor">) num contexto isolado, sem DOM.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const HTML = path.join(__dirname, "..", "..", "public", "index.html");

function carregarMotor() {
  const html = fs.readFileSync(HTML, "utf8");
  const m = html.match(/<script id="motor">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("bloco do motor não encontrado em public/index.html");
  const ctx = vm.createContext({});
  vm.runInContext("Math.random = function () { throw new Error('Math.random proibido no motor'); };", ctx);
  vm.runInContext(m[1] + "\n;globalThis.Motor = Motor;", ctx, { filename: "index.html#motor" });
  return { Motor: ctx.Motor, codigo: m[1] };
}

// Objetos vêm de outro realm: comparar pela forma JSON.
const plano = (x) => JSON.parse(JSON.stringify(x));

module.exports = { carregarMotor, plano };
