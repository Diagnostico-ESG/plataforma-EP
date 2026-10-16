# Ticket 03 de documentos-versoes (Baixar os arquivos) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o nome de cada arquivo na seção Versões vira um link que baixa o arquivo pela função do servidor (qualquer perfil ativo, inclusive Consulta), abrindo numa aba nova quando o navegador mostra o formato (.png, .pdf) e baixando com o nome padrão nos outros casos.

**Architecture:** a ação `baixar` da função passa a receber `arquivo_id`, lê a linha de `arquivos_da_versao` com o login de quem chamou (a RLS "ativo lê" decide) e busca os bytes no Drive pelo `drive_id` guardado. A resposta é sempre `application/octet-stream`, porque o `functions.invoke` do supabase-js só devolve `Blob` para esse tipo e `application/pdf`; qualquer outro vira texto e corrompe os bytes. O módulo de versões ganha `baixarArquivo(arquivo): Promise<Blob>` (real e falso); a tela decide entre aba nova e download.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`).

**Spec:** `.scratch/documentos-versoes/spec.md` (histórias 33 a 35 e 44; "Função do servidor", ação `baixar`) · **Ticket:** `.scratch/documentos-versoes/issues/03-baixar-os-arquivos.md` (critérios 1 a 6, na ordem).

## Global Constraints

- `.claude/regras/banco.md` lido nesta sessão. Valem: a função confere quem chamou antes de tocar o Drive (já feito em `index.ts`); a chave secreta do Supabase não é usada; a decisão fica no arquivo puro testado no Vitest; resposta e logs sem dado pessoal; bucket/Storage não se aplicam (os arquivos estão no Drive).
- **Sem migração e sem teste de banco novo:** a RLS de `arquivos_da_versao` ("ativo lê") e o teste 27 ("consulta lê os arquivos") já existem desde o ticket 02. A decisão fica registrada no `desvios.md`.
- Nenhuma dependência nova. Funções de 4 a 20 linhas, arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): rodar em segundo plano.
- A função Deno não passa pelo `tsc` nem pelo Vitest (só o arquivo puro); o comportamento real se prova na prova de ponta a ponta (critério 6), que depende do roteiro do usuário.

## Decisões do plano

- **Resposta sempre `application/octet-stream`;** o módulo real recria o `Blob` com o tipo do formato (`tipoMimeDaExtensao`), para o navegador mostrar o .png/.pdf.
- **Aba só para .png e .pdf.** Abrir aba em branco para um .bpmn/.docx e depois baixar deixaria uma aba vazia; para esses, o download vai direto. A aba é aberta dentro do clique (`window.open` antes do `await`); se o navegador a bloquear (`null`), cai no download.
- **Frases próprias do download** (`falhaDoDownload`), porque as de `recusasDeVersoes.ts` falam em "enviar versões".

## Arquivos

- Modifica: `supabase/functions/_shared/decisao.ts` e `.test.ts` (`EntradaBaixar`, `validarBaixar`), `supabase/functions/arquivos-no-drive/acoes.ts` (`baixar`), `src/versoes/tipos.ts`, `src/versoes/recusasDeVersoes.ts` e `.test.ts`, `src/versoes/versoesSupabase.ts` e `.test.ts`, `src/versoes/VersoesFalso.ts` e `.test.ts`, `src/components/versoes/ListaDeVersoes.tsx` e `SecaoDeVersoes.tsx`, `src/components/versoes/Versoes.css`, `scripts/prova-do-drive.mjs`.
- Cria: `src/versoes/abrirOuBaixar.ts` e `.test.ts`, `src/components/versoes/LinkDoArquivo.tsx`, `src/App.baixarArquivo.test.tsx`.

---

### Task 1: Função do servidor — `baixar` pelo arquivo da versão (critério 1)

- [x] Teste: em `decisao.test.ts`, `validarBaixar` aceita `{ arquivo_id: <uuid> }` → `{ ok: true, valor: { arquivoId } }` e recusa (`entrada_invalida`) vazio, texto que não é uuid, número, ausente e corpo nulo. Rodar `npx vitest run supabase/functions/_shared/decisao.test.ts`: falha.
- [x] `decisao.ts`: `EntradaBaixar = { arquivoId: string }`; `validarBaixar` lê `arquivo_id` com `FORMATO_UUID`. Teste passa.
- [x] `acoes.ts`: `baixar` lê `arquivos_da_versao` (`nome, formato, drive_id`, `.eq('id', arquivoId).maybeSingle()`) com o cliente de quem chamou; sem linha → `recusar('sem_permissao')` (não revela se existe); busca os bytes no Drive pelo `drive_id`; devolve `application/octet-stream` com `Content-Disposition` do nome padrão. Remove `estaEmPastaDeProcesso` e o uso de `lerJsonDoDrive` que ficarem sem uso.
- [ ] Comitar.

### Task 2: Módulo de versões — `baixarArquivo` (critérios 4 e 5, parte do módulo)

- [x] Testes: `recusasDeVersoes.test.ts` (frases do download: inativo, sem login, sem permissão, não encontrado no Drive, Drive indisponível, desconhecido); `versoesSupabase.test.ts` (chama a função com `{ acao: 'baixar', arquivo_id }`; devolve `Blob` com o tipo do formato e os bytes intactos, lidos como arquivo; recusa vira `TravaDoBanco` com a frase do download; resposta que não é `Blob` vira erro com o recebido); `VersoesFalso.test.ts` (devolve Blob com o nome no conteúdo, registra o arquivo pedido, falha programada).
- [x] `tipos.ts`: `baixarArquivo(arquivo: ArquivoDaVersao): Promise<Blob>` em `ModuloDeVersoes`.
- [x] `recusasDeVersoes.ts`: `falhaDoDownload(codigo, mensagem)`. `versoesSupabase.ts`: `chamarFuncao` aceita o tradutor de falha; `baixarArquivo`. `VersoesFalso.ts`: `baixados: string[]`, `falharNoDownload: boolean | Error`.
- [x] Comitar.

### Task 3: Abrir ou baixar no navegador (critério 3)

- [x] Teste `abrirOuBaixar.test.ts`: `abrirAba(formato)` abre aba só para png e pdf (`window.open` chamado/não); `entregarArquivo({ aba, blob, nome })` navega a aba para a URL do blob quando há aba; sem aba (bloqueada ou formato que não abre) cria `<a download=nome>` e clica; a URL é revogada depois.
- [x] `abrirOuBaixar.ts` com `abrirAba`, `entregarArquivo`, `fecharAba`.
- [x] Comitar.

### Task 4: Links na seção Versões (critérios 2, 3 e 4)

- [x] Teste `App.baixarArquivo.test.tsx` (aplicativo inteiro com `VersoesFalso`): cada perfil (administrador, integrante, consulta) vê o nome de cada arquivo como link; clicar num .png abre a aba (`window.open` simulado) e a leva à URL do blob; num .bpmn não abre aba e baixa com o nome padrão; aba bloqueada (`null`) baixa; falha no download fecha a aba aberta e mostra mensagem em vermelho (`role="alert"`); processo suspenso ainda mostra os links.
- [x] `LinkDoArquivo.tsx` (link + aviso) e `ListaDeVersoes`/`SecaoDeVersoes` passam o módulo; CSS do aviso.
- [x] Comitar.

### Task 5: Prova, registros e fecho (critério 6)

- [ ] `scripts/prova-do-drive.mjs`: depois do `registrar`, a Consulta inventada chama `baixar` com o `arquivo_id` e confere os bytes. A prova real depende do roteiro do usuário e fica pendente, como a do ticket 01.
- [ ] Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`.
- [ ] Registro no ticket 03, `desvios.md`, itens não testados em `.scratch/melhorias-protocolo.md` (os de `.claude/regras/nao-testados.md` que aconteceram), comitar. **Sem a linha `Concluído em`** enquanto a prova do Drive não for feita (mesma regra dos tickets 01 e 02, decisão do usuário em 2026-10-15).
