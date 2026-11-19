"use strict";
// Consolida o catálogo em escada (D85): degrau-1..5 e eventos comuns em data/catalogo/catalogo-jogo.json.
// Uso: node tools/catalogo.js (grava) ou node tools/catalogo.js --verificar (só compara). Sem dependências.
const fs = require("node:fs");
const path = require("node:path");
const DIR = path.join(__dirname, "..", "data", "catalogo");
const SAIDA = path.join(DIR, "catalogo-jogo.json");
const ler = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));

function consolidar() {
  const lotes = fs.readdirSync(DIR).filter((f) => /^degrau-\d\.json$/.test(f)).sort().map(ler);
  const comuns = ler("eventos-comuns.json");
  const pd = JSON.stringify(lotes[0].parametrosDegrau);
  if (lotes.some((l) => JSON.stringify(l.parametrosDegrau) !== pd)) throw new Error("parametrosDegrau diferente entre lotes");
  const out = {
    _cenario: "Catálogo do jogo consolidado por tools/catalogo.js a partir de data/catalogo/degrau-N.json e eventos-comuns.json. Não editar à mão.",
    _parametros: "Todos os valores (calibrar). Itens marcados (a confirmar) dependem da 1B.",
    ambicoes: ["legislativo", "executivo", "bastidor"],
    parametrosCartas: { acoesPorMao: 2 },
    parametrosDegrau: lotes[0].parametrosDegrau,
    cartas: [].concat(...lotes.map((l) => l.cartas)),
    eventos: [].concat(...lotes.map((l) => l.eventos), comuns.eventos),
    posicoes: [].concat(...lotes.map((l) => l.posicoes))
  };
  for (const k of ["cartas", "eventos", "posicoes"]) {
    const ids = new Set();
    for (const x of out[k]) { if (ids.has(x.id)) throw new Error(k + ": id repetido " + x.id); ids.add(x.id); }
  }
  return JSON.stringify(out, null, 1) + "\n";
}
if (require.main === module) {
  const txt = consolidar();
  if (process.argv.includes("--verificar")) {
    const atual = fs.existsSync(SAIDA) ? fs.readFileSync(SAIDA, "utf8") : "";
    if (atual !== txt) { console.error("catalogo-jogo.json desatualizado: rode node tools/catalogo.js"); process.exit(1); }
    console.log("catalogo-jogo.json em dia");
  } else { fs.writeFileSync(SAIDA, txt); console.log("gravado " + path.relative(process.cwd(), SAIDA)); }
}
module.exports = { consolidar, SAIDA };
