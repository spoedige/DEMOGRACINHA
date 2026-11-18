# Validação das fontes legais

Branch: `validacao-fontes-legais`, a partir de `main` em `81d80f5`.
Objetivo: verificar as pendências L1 a L36 (`roadmap.md` 7.1) com fonte oficial e evidência documental. Nenhuma pendência é marcada como resolvida sem isso.

## Registro de acesso, 17/11/2026

Teste com `curl -sI`:

| Host | Resultado |
|---|---|
| www.ibge.gov.br | 403 |
| servicodados.ibge.gov.br | 403 |
| www.tse.jus.br | 403 |
| dadosabertos.tse.jus.br | 403 |
| cdn.tse.jus.br | 403 |
| www.planalto.gov.br | 403 |

Diagnóstico: a recusa vem do gateway de rede do ambiente de execução (403 no CONNECT, corpo em texto simples do proxy), não dos sites oficiais. Coleta interrompida conforme a regra do projeto. Nenhum dado foi coletado nem inferido.

## O que falta

| Fonte | Pendências que dependem dela |
|---|---|
| Legislação federal (Constituição, Código Eleitoral, Lei 9.504/1997, Lei 9.096/1995, LC 64/1990), no Planalto | L1, L2, L6, L7, L8, L9, L10, L12, L13, L14, L15, L16, L17, L19, L20, L21, L22, L23, L24, L25, L28, L29, L30, L31, L32, L33, L34, L35, L36 (só o limite constitucional; o número concreto exige as leis orgânicas municipais) |
| TSE: resoluções de 2026 (calendário, registro, propaganda, arrecadação, prestação de contas, FEFC, federações), Resolução 22.610/2007 | L1, L2, L3, L4, L5, L7, L8, L9, L17, L18, L19, L21, L28, L29, L32, L34, L35 |
| TSE: dados abertos (eleitorado, resultados 2022 e 2024, candidaturas, comparecimento) | dados da 1B; L21; parâmetros fixos de comparecimento (D42) |
| IBGE: lista de municípios e códigos | `municipios.json`; conjunto de agentes (D52) |
| STF: ADI 4650, ADI 5081, decisões sobre sobras | L2, L14, L34, L35 |
| Constituições estaduais, leis orgânicas, regimentos | L11, L16, L23, L25, L26, L27 |

## Liberação de rede e novo teste, 17/11/2026

Hosts incluídos na lista de permissões do ambiente pessoal "DEMOGRACINHA", sem curingas: www.ibge.gov.br, servicodados.ibge.gov.br, www.tse.jus.br, dadosabertos.tse.jus.br, cdn.tse.jus.br, www.planalto.gov.br. O gateway passou a aceitar todos (CONNECT 200).

| Host | Resultado | Origem da recusa | Uso |
|---|---|---|---|
| servicodados.ibge.gov.br | 200 com JSON (API de localidades) | nenhuma | lista de municípios e códigos IBGE |
| dadosabertos.tse.jus.br | 200 | nenhuma | dados abertos do TSE |
| cdn.tse.jus.br | 200 | nenhuma | arquivos de dados do TSE |
| www.ibge.gov.br | 403, página "Just a moment" | proteção contra automação do próprio site (Cloudflare) | dispensável se a API atender |
| www.tse.jus.br | 403, "Access Denied" | proteção do próprio site | resoluções e legislação eleitoral do TSE |
| www.planalto.gov.br | 302 para gov.br/planalto, sem o texto da lei | balanceador do próprio site | legislação federal |

Não foram feitas tentativas de contornar as proteções dos sites. O redirecionamento do Planalto aponta para a página inicial de outro host, não para o documento; incluir esse host não daria acesso à lei, por isso não foi submetido.

## Bases de legislação da Câmara e do Senado, 17/11/2026

Aprovados pelo autor e incluídos na rede do ambiente, sem curingas: `www2.camara.leg.br` (H1) e `legis.senado.leg.br` (H3). Não aprovados: `www.camara.leg.br` (H2), `www.lexml.gov.br` (H4). Os testes foram feitos sem seguir redirecionamentos.

| Host | Teste | Resultado |
|---|---|---|
| `www2.camara.leg.br` | página da Lei 9.504/1997 no endereço `legin/fed/lei/1997/lei-9504-30-setembro-1997-366871-norma-pl.html` | 404, sem redirecionamento. O endereço testado não existe; o identificador numérico da página não é conhecido. Teste inconclusivo: o host responde, mas o documento não foi localizado |
| `legis.senado.leg.br` | Lei 9.504/1997 e Constituição pela API de dados abertos de legislação | 200. A lista identifica as duas normas (ids 551380 e 579494). A ficha de cada uma traz publicações, dispositivos e normas posteriores, mas não o texto integral |

Redirecionamento e referência a host não aprovado: a ficha do Senado indica o texto em `https://normas.leg.br/?urn=...` (URN da Lei 9.504/1997 e da Constituição). Esse host não foi acessado e fica submetido à aprovação do autor.

Evidência guardada: as quatro respostas do Senado, em `data/raw/legislacao/senado/`, registradas em `data/raw/MANIFESTO.md`.

Situação das pendências: nenhuma alterada. As fichas do Senado servem para rastrear alterações da norma, mas não substituem a leitura do texto vigente.

## normas.leg.br (H5) e busca na Câmara (H1, ajuste), 17/11/2026

| Teste | Resultado |
|---|---|
| `normas.leg.br`, URN da Lei 9.504/1997 | 200, mas o conteúdo é a casca de uma aplicação web (66.002 bytes), sem nenhum trecho da lei |
| `normas.leg.br`, URN da Constituição de 1988 | 200, conteúdo idêntico byte a byte ao anterior (mesmo SHA-256): a mesma casca |
| `www2.camara.leg.br`, uma consulta de busca limitada à Lei 9.504/1997 | 404, sem redirecionamento |

Conclusões:
- `normas.leg.br` não entrega o texto integral pela URN. O texto é carregado por scripts da aplicação (`main.*.js`, no mesmo host), que fazem outras requisições. Essas requisições estão fora do escopo aprovado (só as duas URNs) e não foram feitas. Versão vigente não identificada.
- A casca referencia também `www.googletagmanager.com` (rastreamento); não acessado.
- Na Câmara, a única consulta autorizada não encontrou a busca no endereço usado. Nenhuma outra tentativa foi feita.

Situação das pendências: nenhuma alterada; L1 a L36 abertas.

## Abertura da validação de L1, L2, L21, L8, L3 a L5, 18/11/2026

Escopo aprovado: pesquisa, validação e documentação. Sem motor, sem promoção de `QT_VAGA`, sem alteração de dados eleitorais, sem merge. Critério de encerramento de cada item: fonte oficial, dispositivo identificado, interpretação aplicável ao jogo e registro documental. Lacunas ficam abertas; nenhuma regra é presumida.

Teste de acesso ao texto do Código Eleitoral (Lei 4.737/1965, compilada):
| Endereço | Resultado |
|---|---|
| `www.planalto.gov.br/ccivil_03/leis/l4737compilado.htm` | CONNECT aceito pelo gateway; falha na negociação TLS com o site (curl, código 35), sem conteúdo |
| cópia em `web.archive.org` | túnel fechado antes da resposta, sem conteúdo |

Coleta interrompida conforme a regra do projeto. Nenhuma tentativa de contornar a falha. Textos a pedir ao autor (versão vigente, com data de consulta e endereço de origem):

| Item | Documento | Trecho |
|---|---|---|
| L1, L2 | Código Eleitoral, compilado | arts. 106 a 113 (quocientes, barreira, sobras, preenchimento) |
| L2 | STF, decisão sobre a distribuição das sobras após a Lei 14.211/2021 (número do processo e acórdão a identificar pelo autor) | dispositivo e modulação temporal |
| L1, L2, L21 | Resolução do TSE de atos gerais do processo eleitoral e de registro de candidaturas aplicáveis a 2026 | artigos de totalização proporcional e limite de candidaturas |
| L21 | Lei 9.504/1997, compilada | art. 10 |
| L8 | Lei 9.504/1997, compilada | arts. 44 a 57 (propaganda gratuita) |
| L8 | Resolução do TSE de propaganda aplicável a 2026 e plano de mídia de 2026, se publicado | distribuição do tempo |
| L3 a L5 | Lei 9.504/1997, arts. 16-C e 16-D; Lei 9.096/1995, art. 41-A e dispositivos de federação (art. 11-A) | critérios do FEFC e do Fundo Partidário |
| L4, L5 | Resolução TSE 23.605/2019, compilada; publicação do TSE da distribuição do FEFC de 2026 | art. 5º e anexos |
| L3 a L5 | dispositivo que prevê a contagem em dobro dos votos de candidatos negros (2022 a 2030) | texto e alcance |

Indicação do autor, 18/11/2026 (pista, não evidência; nada lido nem guardado neste ambiente):
- L2: STF, ADIs 7.228 (0125262-02.2022.1.00.0000), 7.263 (0130016-84.2022.1.00.0000) e 7.325. Segundo o autor: embargos julgados em 13/03/2025, com interpretação conforme do art. 109, § 2º, do Código Eleitoral (todos os partidos participam das sobras do art. 109, III, sem as exigências de 80% e 20%), inconstitucionalidade do art. 111 do Código e do art. 13 da Resolução TSE 23.677/2021, aplicação às eleições de 2022; trânsito em julgado em agosto de 2025. A conferir no inteiro teor do acórdão.
- L1, L2: versão compilada do Código Eleitoral no portal do TSE, com anotação da decisão de 2025 ao art. 109, § 2º. Fonte alternativa ao Planalto, pendente de aprovação do autor. `www.tse.jus.br` recusa acesso automatizado deste ambiente (403, ver acima): o arquivo teria de ser enviado pelo autor.

Arquivos recebidos irão para `data/raw/legislacao/` com SHA-256 no manifesto. Situação: L1 a L36 abertas.

## Próximo passo

Coleta estatística em `coleta-estatistica.md`. Texto integral da legislação federal ainda sem acesso: `normas.leg.br` só entrega a casca da aplicação, e a busca da Câmara deu 404. Resoluções do TSE e acórdãos do STF continuam sem fonte acessível.
