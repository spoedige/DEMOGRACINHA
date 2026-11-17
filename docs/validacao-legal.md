# Validação das fontes legais

Branch: `validacao-fontes-legais`, a partir de `main` em `81d80f5`.
Objetivo: verificar as pendências L1 a L35 (`roadmap.md` 7.1) com fonte oficial e evidência documental. Nenhuma pendência é marcada como resolvida sem isso.

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
| Legislação federal (Constituição, Código Eleitoral, Lei 9.504/1997, Lei 9.096/1995, LC 64/1990), no Planalto | L1, L2, L6, L7, L8, L9, L10, L12, L13, L14, L15, L16, L17, L19, L20, L21, L22, L23, L24, L25, L28, L29, L30, L31, L32, L33, L34, L35 |
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

## Próximo passo

Coleta estatística em `coleta-estatistica.md`. Texto integral da legislação federal ainda sem acesso: depende da aprovação de `normas.leg.br` ou de endereço correto na Câmara. Resoluções do TSE e acórdãos do STF continuam sem fonte acessível.
