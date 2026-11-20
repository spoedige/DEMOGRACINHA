"use strict";
// Estilo de atuação (D89): etiqueta, ajustes leves, opção própria em eventos e troca em C1 do ano calmo.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { carregarMotor, plano } = require("./carregar");

const { Carreira, Origens, Eventos, Mudancas } = carregarMotor().Motor;
const RAIZ = path.join(__dirname, "..", "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8"));
const CEN = J("tools/cenarios/carreira.json"), EST = J("data/catalogo/estilos.json"), CAT = J("data/catalogo/catalogo-jogo.json");
const ERRO = { name: "TypeError" };
const clone = (x) => JSON.parse(JSON.stringify(x));
const est = (id) => EST.estilos.find((x) => x.id === id);
const novo = (id) => { const c = clone(CEN); delete c.eleicoes; if (id) Origens.aplicarEstilo(c.inicio, est(id)); return Carreira.criar({}, c, null).resultado; };
const dados = () => ({ eventos: clone(CAT.eventos), personagens: CAT.personagens, cartas: clone(CAT.cartas), ambicoes: CAT.ambicoes, parametrosCartas: CAT.parametrosCartas,
  parametrosDegrau: CAT.parametrosDegrau, estilos: EST });

test("estilo no início: etiqueta única e ajustes leves dentro das escalas", () => {
  const e = novo("influencer"), base = novo();
  assert.deepEqual(plano(e.personagem.tags.filter((t) => t.startsWith("estilo:"))), ["estilo:influencer"]);
  assert.ok(Math.abs(e.personagem.aptidoes.comunicacao - base.personagem.aptidoes.comunicacao - 0.1) < 1e-9);
  const a = novo("articulador"); assert.ok(a.relacoes.cupula > base.relacoes.cupula);
  assert.doesNotThrow(() => Carreira.validar(a));
});

test("opção própria de estilo: aparece só com a etiqueta; contenção não pode exigir etiqueta", () => {
  const d = dados(), item = { id: "R", janelaAlvo: { ano: 2026, janela: "J1" }, dados: { eventoId: "video-repercute", origemCartaId: "x", prob: 1, condicao: null, nivelCorrupcao: null } };
  const com = novo("influencer"), sem = novo("tecnico"); com.filaEventos = [item]; sem.filaEventos = [clone(item)];
  const ops = (e) => Eventos.resolverJanela(e, d, { manual: true, previa: true, decisoes: {} }).pendentes[0].opcoes.map((o) => o.id);
  assert.ok(ops(com).includes("live-explicando")); assert.ok(!ops(sem).includes("live-explicando"));
  const ruim = dados(); ruim.eventos.find((x) => x.id === "video-repercute").opcoes[0].exigeTag = "estilo:tecnico";
  assert.throws(() => Eventos.validarCatalogo(ruim), ERRO);
});

test("troca de estilo: só em C1 do ano calmo, troca a etiqueta e custa credibilidade", () => {
  const troca = { trocaPartido: { cupulaEntrada: 0.2, perdaBancada: 0.05, perdaCredibilidadeJanela: 0.02, perdaCredibilidadeFora: 0.06, fatorParaquedista: 0.5,
    partidos: ["P1", "P2"], municipios: [{ id: "EX001", uf: "EX" }] }, estilos: EST };
  const e = novo("tecnico"); e.tempo = { ano: 2027, janela: "C1" };
  assert.ok(!Mudancas.opcoes(e, troca).estilos.includes("tecnico"));
  const oc = [], x = clone(e); Mudancas.aplicar(x, troca, true, { estilo: "combativo" }, oc);
  assert.deepEqual(plano(x.personagem.tags.filter((t) => t.startsWith("estilo:"))), ["estilo:combativo"]);
  assert.ok(Math.abs(x.relacoes.credibilidade - (e.relacoes.credibilidade - EST.perdaCredibilidadeTroca)) < 1e-9);
  const j = clone(e); j.tempo = { ano: 2028, janela: "J1" };
  assert.throws(() => Mudancas.aplicar(j, troca, true, { estilo: "combativo" }, []), ERRO);
});

const ORI = J("data/catalogo/origens.json");
const inicioDe = (origemId, estiloId) => { const ini = Origens.inicio(CEN.inicio, ORI.origens.find((o) => o.id === origemId)); if (estiloId) Origens.aplicarEstilo(ini, est(estiloId)); return ini; };

test("D91: seis origens; Família Política com caixa, acesso e nome conhecido, mas rejeição maior e menos credibilidade", () => {
  assert.equal(ORI.origens.length, 6);
  const f = inicioDe("familiaPolitica"), outras = ORI.origens.filter((o) => o.id !== "familiaPolitica");
  const fo = ORI.origens.find((o) => o.id === "familiaPolitica");
  assert.ok(outras.every((o) => fo.local.rejeicao > o.local.rejeicao));                    // resistência à herança
  assert.ok(outras.filter((o) => o.id !== "empresario").every((o) => fo.caixaPessoal > o.caixaPessoal)); // recursos da família (calibrar)
  assert.ok(fo.redePoliticaPrevia === "direta" && fo.relacoes.cupula >= 0.35);
  assert.ok(outras.every((o) => fo.relacoes.credibilidade <= o.relacoes.credibilidade));
  assert.ok(f.indicadores.estadual.notoriedade > CEN.inicio.indicadores.estadual.notoriedade);
  const e = Carreira.criar({}, Object.assign(clone(CEN), { inicio: f, eleicoes: undefined }), null).resultado;
  assert.doesNotThrow(() => Carreira.validar(e));
  assert.ok(CAT.cartas.filter((c) => c.pool && c.pool.origens && c.pool.origens.includes("familiaPolitica")).length >= 2);
});

test("D91: sinergia só no par previsto, com etiqueta e reforço leve; troca de estilo não duplica", () => {
  const com = inicioDe("servidor", "tecnico"), sem = inicioDe("empresario", "tecnico");
  assert.ok(com.personagem.tags.includes("sinergia:servidor-tecnico"));
  assert.ok(!sem.personagem.tags.some((t) => t.startsWith("sinergia:")));
  const base = inicioDe("servidor");
  assert.ok(com.relacoes.executivo - base.relacoes.executivo > 0.03 && com.relacoes.executivo - base.relacoes.executivo < 0.05);
  Origens.aplicarEstilo(com, est("combativo"));
  assert.ok(!com.personagem.tags.some((t) => t.startsWith("sinergia:")));
});

test("D91: talento nato determinístico pela semente, perto de 1/8 no geral e 1/5 no influencer, com bônus moderado", () => {
  const par = EST.talentoNato;
  assert.equal(Origens.temTalento("v1-ABCD", "tecnico", par), Origens.temTalento("v1-ABCD", "tecnico", par));
  const taxa = (estilo) => { let n = 0; for (let i = 0; i < 4000; i++) if (Origens.temTalento("v1-T" + i, estilo, par)) n++; return n / 4000; };
  assert.ok(Math.abs(taxa("tecnico") - 0.125) < 0.02); assert.ok(Math.abs(taxa("influencer") - 0.2) < 0.02);
  let s = 0; while (!Origens.temTalento("v1-T" + s, "tecnico", par)) s++;
  const ini = inicioDe("servidor", "tecnico"), antes = clone(ini);
  Origens.aplicarTalento(ini, "v1-T" + s, "tecnico", par);
  assert.ok(ini.personagem.tags.includes("talento:nato"));
  assert.ok(Math.abs(ini.indicadores.local.notoriedade - antes.indicadores.local.notoriedade - par.notoriedadeLocal) < 1e-9);
  assert.ok(Math.abs(ini.personagem.aptidoes.gestao - antes.personagem.aptidoes.gestao - par.aptidoes) < 1e-9);
  let n = 0; while (Origens.temTalento("v1-N" + n, "tecnico", par)) n++;
  const sem = inicioDe("servidor", "tecnico"); Origens.aplicarTalento(sem, "v1-N" + n, "tecnico", par);
  assert.ok(!sem.personagem.tags.includes("talento:nato"));
});
