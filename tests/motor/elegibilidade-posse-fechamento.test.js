"use strict";
// Etapa 6: módulos 3 (elegibilidade), 15 (posse, suplência e vacância) e 16 (fechamento do ciclo), D72.
// Resultados esperados calculados à mão e comentados em cada teste.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarMotor, plano } = require("./carregar");

const { RNG, Datas, Elegibilidade, Posse, Fechamento } = carregarMotor().Motor;
const ERRO = { name: "TypeError" };

// ---------- Datas ----------
test("datas: idade civil e soma de meses de calendário", () => {
  const D = (s) => Datas.ler(s, "d");
  assert.equal(Datas.idade(D("2010-08-15"), D("2028-08-15")), 18);   // aniversário no dia de referência conta
  assert.equal(Datas.idade(D("2010-08-16"), D("2028-08-15")), 17);
  assert.equal(Datas.idade(D("2008-02-29"), D("2029-02-28")), 20);   // nascido em 29/02: conta a partir de 01/03
  assert.equal(Datas.idade(D("2008-02-29"), D("2029-03-01")), 21);
  assert.deepEqual(plano(Datas.somarMeses(D("2029-10-31"), 15)), { a: 2031, m: 1, d: 31 });
  assert.deepEqual(plano(Datas.somarMeses(D("2030-11-30"), 3)), { a: 2031, m: 2, d: 28 }); // fim do mês curto
  for (const s of ["2026-02-30", "2026-13-01", "26-01-01", "2026-1-01", 20260101]) assert.throws(() => Datas.ler(s, "d"), ERRO);
});

// ---------- Módulo 3 ----------
const CAL = { dataRegistro: "2026-08-15", dataPosse: "2027-02-01", prazoFiliacao: "2026-04-04", prazoDesincompatibilizacao: "2026-04-04" };
const cand = (id, extra) => ({ id, partidoId: "PL", dataNascimento: "1980-01-01", dataFiliacao: "2025-01-10", ...(extra || {}) });
const eleg = (cargo, candidatos, extra) => plano(Elegibilidade.avaliar({}, { cargo, unidadeId: "SP", calendario: CAL, limiteLista: 5,
  listas: [{ id: "PL", membros: ["PL"], candidatos }], ...(extra || {}) }, null).resultado.listas[0]);

test("elegibilidade: idade mínima na data de referência do cargo", () => {
  // deputado federal: 21 anos na posse (01/02/2027). Nascido em 01/02/2006: 21 exatos. Em 02/02/2006: 20.
  const r = eleg("DEPUTADO_FEDERAL", [cand("a", { dataNascimento: "2006-02-01" }), cand("b", { dataNascimento: "2006-02-02" })]);
  assert.deepEqual(r.aptos, ["a"]);
  assert.deepEqual(r.inelegiveis, [{ id: "b", motivos: ["idadeMinima"] }]);
  // vereador: 18 anos no registro (15/08/2028)
  const v = eleg("VEREADOR", [cand("a", { dataNascimento: "2010-08-15", dataFiliacao: "2028-01-01" }), cand("b", { dataNascimento: "2010-08-16", dataFiliacao: "2028-01-01" })],
    { calendario: { dataRegistro: "2028-08-15", dataPosse: "2029-01-01", prazoFiliacao: "2028-04-07", prazoDesincompatibilizacao: "2028-04-07" } });
  assert.deepEqual([v.aptos, v.inelegiveis.map((x) => x.id)], [["a"], ["b"]]);
  // senador: 35 na posse
  assert.deepEqual(eleg("SENADOR", [cand("a", { dataNascimento: "1992-02-01" }), cand("b", { dataNascimento: "1992-02-02" })]).aptos, ["a"]);
});

test("elegibilidade: filiação até o prazo", () => {
  const r = eleg("DEPUTADO_FEDERAL", [cand("a", { dataFiliacao: "2026-04-04" }), cand("b", { dataFiliacao: "2026-04-05" })]);
  assert.deepEqual([r.aptos, r.inelegiveis], [["a"], [{ id: "b", motivos: ["filiacaoForaDoPrazo"] }]]);
});

test("elegibilidade: uma reeleição consecutiva e desincompatibilização do chefe do Executivo", () => {
  const g = (consecutivos) => cand("g", { mandatoAtual: { cargo: "GOVERNADOR", unidadeId: "SP", consecutivos } });
  assert.deepEqual(eleg("GOVERNADOR", [g(1)]).aptos, ["g"]);                                   // primeira reeleição
  assert.deepEqual(eleg("GOVERNADOR", [g(2)]).inelegiveis, [{ id: "g", motivos: ["reeleicaoEsgotada"] }]);
  // governador que disputa o Senado: renúncia até 04/04
  assert.deepEqual(eleg("SENADOR", [g(1)]).inelegiveis, [{ id: "g", motivos: ["semDesincompatibilizacao"] }]);
  assert.deepEqual(eleg("SENADOR", [{ ...g(1), renuncia: { data: "2026-04-04" } }]).aptos, ["g"]);
  assert.deepEqual(eleg("SENADOR", [{ ...g(1), renuncia: { data: "2026-04-05" } }]).inelegiveis[0].motivos, ["semDesincompatibilizacao"]);
  // legislador concorre sem renunciar
  assert.deepEqual(eleg("GOVERNADOR", [cand("d", { mandatoAtual: { cargo: "DEPUTADO_FEDERAL", unidadeId: "SP", consecutivos: 3 } })]).aptos, ["d"]);
  // governador de outra UF disputando governador em SP: é outro cargo para a regra, exige renúncia
  assert.deepEqual(eleg("GOVERNADOR", [cand("x", { mandatoAtual: { cargo: "GOVERNADOR", unidadeId: "RJ", consecutivos: 1 } })]).inelegiveis[0].motivos, ["semDesincompatibilizacao"]);
});

test("elegibilidade: limite da lista e vagas restantes para sintéticos", () => {
  assert.equal(eleg("DEPUTADO_FEDERAL", [cand("a"), cand("b")]).vagasRestantesSinteticos, 3);
  assert.throws(() => eleg("DEPUTADO_FEDERAL", [cand("a"), cand("b")], { limiteLista: 1 }), /acima do limite/);
  assert.throws(() => eleg("DEPUTADO_FEDERAL", [cand("a", { partidoId: "PT" })]), /partido fora da lista/);
  assert.throws(() => eleg("DEPUTADO_FEDERAL", [cand("a"), cand("a")]), ERRO);
  assert.throws(() => eleg("VICE", [cand("a")]), ERRO);
});

// ---------- Módulo 15 ----------
const vac = (extra) => plano(Posse.vacancia({}, { cargo: "DEPUTADO_FEDERAL", tipo: "definitiva", titularId: "T",
  dataEvento: "2028-05-10", fimMandato: "2031-01-31", suplentes: ["S1", "S2"], ...(extra || {}) }, null).resultado);

test("posse: ocupantes na data do calendário", () => {
  const r = plano(Posse.empossar({}, { disputaId: "D", cargo: "DEPUTADO_FEDERAL", eleitos: ["A", "B"], dataPosse: "2027-02-01", fimMandato: "2031-01-31" }, null).resultado);
  assert.deepEqual(r.ocupantes.map((o) => [o.titularId, o.emExercicio, o.inicio, o.fim]), [["A", "A", "2027-02-01", "2031-01-31"], ["B", "B", "2027-02-01", "2031-01-31"]]);
  assert.throws(() => Posse.empossar({}, { disputaId: "D", cargo: "DEPUTADO_FEDERAL", eleitos: ["A"], dataPosse: "2031-01-31", fimMandato: "2031-01-31" }, null), ERRO);
});

test("suplência: convocação preserva o mandato; vaga definitiva efetiva o primeiro suplente", () => {
  const c = vac({ tipo: "convocacao" });
  assert.deepEqual([c.acao, c.emExercicio, c.suplentesRestantes, c.mandatoDoTitular], ["suplenteConvocado", "S1", ["S2"], "preservado"]);
  const d = vac();
  assert.deepEqual([d.acao, d.emExercicio, d.mandatoDoTitular], ["suplenteEfetivado", "S1", "extinto"]);
  assert.throws(() => vac({ tipo: "convocacao", suplentes: [] }), /sem regra documentada/);
  assert.throws(() => vac({ suplentes: ["T"] }), ERRO);
});

test("vaga sem suplente: deputados, 15 meses; eleição quando faltam 15 meses ou mais", () => {
  // fim 31/01/2031. Vaga em 31/10/2029: + 15 meses = 31/01/2031, faltam exatamente 15 meses -> eleição.
  const a = vac({ suplentes: [], dataEvento: "2029-10-31" });
  assert.deepEqual([a.acao, a.eleicaoSuplementar, a.prazoMeses], ["eleicaoSuplementar", true, 15]);
  // vaga em 01/11/2029: faltam menos de 15 meses -> sem eleição
  assert.deepEqual([vac({ suplentes: [], dataEvento: "2029-11-01" }).acao], ["vagaSemPreenchimento"]);
});

test("vaga sem suplente: vereador pela lei orgânica ou, sem ela, art. 113 (9 meses)", () => {
  const v = (extra) => vac({ cargo: "VEREADOR", suplentes: [], fimMandato: "2032-12-31", ...extra });
  const a = v({ dataEvento: "2032-03-31" });   // + 9 meses = 31/12/2032: faltam 9 -> eleição
  assert.deepEqual([a.acao, a.prazoMeses], ["eleicaoSuplementar", 9]);
  assert.match(a.fonteDoPrazo, /art\. 113/);
  assert.equal(v({ dataEvento: "2032-04-01" }).acao, "vagaSemPreenchimento");
  const lo = v({ dataEvento: "2032-03-31", mesesLeiOrganica: 12 });   // + 12 meses passa do fim -> sem eleição
  assert.deepEqual([lo.acao, lo.fonteDoPrazo], ["vagaSemPreenchimento", "lei orgânica municipal"]);
});

test("vacância: Executivo passa ao vice (D84); sem vice, erro; Senado só com suplente", () => {
  for (const cargo of ["PREFEITO", "GOVERNADOR", "PRESIDENTE"]) {
    const d = vac({ cargo, viceId: "V1" });
    assert.equal(d.emExercicio, "V1"); assert.equal(d.acao, "viceSucede"); assert.equal(d.mandatoDoTitular, "extinto");
    const c = vac({ cargo, viceId: "V1", tipo: "convocacao" });
    assert.equal(c.acao, "viceSubstitui"); assert.equal(c.mandatoDoTitular, "preservado");
    assert.throws(() => vac({ cargo }), /sem vice/);
    assert.throws(() => vac({ cargo, viceId: "T" }), ERRO);
  }
  assert.equal(vac({ cargo: "SENADOR", tipo: "convocacao" }).emExercicio, "S1");
  assert.throws(() => vac({ cargo: "SENADOR", suplentes: [] }), /Senado sem suplente/);
  assert.throws(() => vac({ dataEvento: "2031-02-01" }), ERRO);
});

// ---------- Módulo 16 ----------
const faixa = (c) => (c.razaoApoio >= 1.2 ? "solida" : c.razaoApoio >= 1 ? "funcional" : c.razaoApoio >= 0.7 ? "fragil" : "critica");
const OP = { estabilidade: () => 0.5, negociacao: () => 0.5, faixa };
const gov = (blocos, extra) => Fechamento.governabilidade({ opcoes: OP }, { totalCadeiras: 100, maioriaExigida: 51,
  capitalEntrega: 50, custoManutencao: 100, blocos, ...(extra || {}) }, null).resultado;

test("governabilidade: apoio efetivo pela coesão e folga de custo", () => {
  // 60 cadeiras aliadas com coesão 0,6 = 36; folga 50 ÷ 100 = 0,5
  const r = gov([{ id: "A", cadeiras: 60, alinhamento: "aliado", coesao: 0.6 }, { id: "B", cadeiras: 40, alinhamento: "oposicao", coesao: 0.9 }]);
  assert.equal(r.apoioEfetivo, 36);
  assert.equal(r.folgaDeCusto, 0.5);
  assert.equal(r.razaoApoio, 36 / 51);
  // mesma fração de cadeiras, coesão diferente, governabilidade diferente: 60 × 0,95 = 57
  const s = gov([{ id: "A", cadeiras: 60, alinhamento: "aliado", coesao: 0.95 }, { id: "B", cadeiras: 40, alinhamento: "oposicao", coesao: 0.9 }]);
  assert.equal(s.apoioEfetivo, 57);
  assert.notEqual(r.faixa, s.faixa);
  assert.deepEqual([r.faixa, s.faixa], ["fragil", "funcional"]);
});

test("governabilidade: validações e funções injetadas", () => {
  const B = [{ id: "A", cadeiras: 100, alinhamento: "aliado", coesao: 1 }];
  assert.throws(() => gov([{ id: "A", cadeiras: 90, alinhamento: "aliado", coesao: 1 }]), /diferentes do total/);
  assert.throws(() => gov([{ id: "A", cadeiras: 100, alinhamento: "neutro", coesao: 1 }]), ERRO);
  assert.throws(() => gov(B, { custoManutencao: 0 }), ERRO);
  assert.throws(() => gov(B, { maioriaExigida: 101 }), ERRO);
  assert.throws(() => Fechamento.governabilidade({ opcoes: { ...OP, faixa: () => "ótima" } }, { totalCadeiras: 100, maioriaExigida: 51, capitalEntrega: 0, custoManutencao: 1, blocos: B }, null), /faixa injetada/);
  assert.throws(() => Fechamento.governabilidade({ opcoes: { ...OP, estabilidade: () => 2 } }, { totalCadeiras: 100, maioriaExigida: 51, capitalEntrega: 0, custoManutencao: 1, blocos: B }, null), ERRO);
  assert.throws(() => Fechamento.governabilidade({ opcoes: {} }, { totalCadeiras: 100, maioriaExigida: 51, capitalEntrega: 0, custoManutencao: 1, blocos: B }, null), /função injetada/);
});

test("fechamento: cinco passos na ordem obrigatória, cada um sobre o estado do anterior", () => {
  const passos = {};
  for (const p of Fechamento.PASSOS) passos[p] = (estado, ctx) => ({ estadoPolitico: { log: estado.log.concat([p]), ordem: ctx.ordem } });
  const rng = RNG.criar("v1-FECHAMENTO", "eleicao");
  const r = plano(Fechamento.executar({ opcoes: { passos } }, { estadoPolitico: { log: [] } }, rng));
  assert.deepEqual(r.resultado.estadoPolitico.log, ["apuracaoEPosse", "atualizarMatrizes", "recalcularRecursos", "aplicarClausula", "abrirProximoCiclo"]);
  assert.deepEqual(r.resultado.passos, r.resultado.estadoPolitico.log);
  assert.equal(r.resultado.estadoPolitico.ordem, 5);
  // passo 5 vê os passos 2 a 4 já concluídos
  let visto = null;
  const p2 = { ...passos, abrirProximoCiclo: (e, ctx) => { visto = ctx.passosConcluidos; return { estadoPolitico: e }; } };
  Fechamento.executar({ opcoes: { passos: p2 } }, { estadoPolitico: { log: [] } }, rng);
  assert.deepEqual(plano(visto), ["apuracaoEPosse", "atualizarMatrizes", "recalcularRecursos", "aplicarClausula"]);
  // passo ausente ou com retorno inválido
  const { aplicarClausula, ...semClausula } = passos;
  assert.throws(() => Fechamento.executar({ opcoes: { passos: semClausula } }, { estadoPolitico: { log: [] } }, rng), /aplicarClausula/);
  assert.throws(() => Fechamento.executar({ opcoes: { passos: { ...passos, recalcularRecursos: () => ({}) } } }, { estadoPolitico: { log: [] } }, rng), /deve devolver/);
});
