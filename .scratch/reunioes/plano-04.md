# Ticket 04 de reunioes (Reuniões no setor e no processo) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o setor aberto e o painel do processo mostram as reuniões ligadas a eles, com [Registrar reunião] que abre o formulário já preenchido; o histórico do processo mostra os eventos de reunião em que ele aparece; excluir setor ou processo com reunião mostra a recusa com a contagem e o caminho.

**Architecture:** o banco já recusa a exclusão com contagem (`setor_com_reunioes:N`, `processo_com_reunioes:N`, ticket 01) e já guarda o evento com os processos no estado: **nenhuma migração**. A interface ganha: (1) as duas frases de recusa; (2) funções puras que pegam, da lista de reuniões, as do setor e as do processo; (3) a leitura dos eventos de reunião do processo no módulo de reuniões, juntada ao histórico do processo; (4) a seção `SecaoDeReunioes` usada no setor e no processo; (5) o endereço `#/reunioes/nova?para-setor=&para-tipo=&para-processo=` que abre o formulário preenchido; (6) o módulo de reuniões chegando às áreas de Setores e de Processos.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions só para a conferência do banco.

**Spec:** `.scratch/reunioes/spec.md` (histórias 32 a 36, 42, 43, 45; "Interface") · **Ticket:** `.scratch/reunioes/issues/04-reunioes-no-setor-e-no-processo.md` (critérios citados como "critério N", na ordem do ticket: 1 banco, 2 setor aberto, 3 painel do processo, 4 histórico do processo, 5 recusas ao excluir, 6 Consulta, 7 testes de interface).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova. Regras de `.claude/regras/banco.md` lidas nesta sessão; este ticket **não cria migração, tabela nem função**, só um teste de banco que confere o que já existe. Alvo conferido: "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` são `yclkzyoebpsxmgpbcbus`; o banco só é tocado pelo workflow "Testes de banco" na branch.
- Funções de lógica 4 a 20 linhas (hooks até 40), arquivos até 300 linhas, complexidade até 10, tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Mensagem de erro inclui o valor recebido e o formato esperado. Dados de teste só inventados. Falha e recusa em vermelho (`cadastros-falha`, `role="alert"`).
- Teste vem antes do código (TDD); teste que falha por erro de digitação não conta como o "vermelho".

## Decisões do plano

- **Sem migração (critério 1):** a recusa com contagem e o teste dela já existem no `23_reunioes.test.sql` (linhas "excluir setor com 2 reuniões…" e "excluir processo tratado em 1 reunião…"). Falta provar, no banco, que **reclassificar um processo com reunião mantém a reunião**: teste novo `25_reunioes_nos_cadastros.test.sql`. Como o comportamento já existe, esse teste nasce verde (não há "vermelho" a esperar); vai para o `desvios.md`. Os testes antigos de exclusão de setor (11) e de processo (17) são conferidos pelo "Testes de banco" verde da branch.
- **As reuniões do setor e do processo saem de `listarReunioes()`**, filtradas na tela por funções puras, no molde do `ProcessosDoSetor` (que filtra `listarProcessos()`). Não há leitura nova no módulo para isso: com a escala do escritório (centenas de reuniões) basta, e o falso funciona sem mudança. Vai para o `desvios.md` (a spec previa "leituras do setor e do processo com as reuniões ligadas").
- **Eventos de reunião no histórico do processo:** método novo `lerEventosDeReuniaoDoProcesso(processoId)` no `ModuloDeReunioes`. A versão real lê os eventos de entidade `reuniao` e filtra na tela os que trazem o processo nos `processos` do estado de antes ou de depois (inclui a reunião já excluída). O filtro no PostgREST (`antes->processos.cs.…`) não é testável aqui sem o banco; fica no backlog como otimização. O histórico do processo junta os dois módulos (`lerHistoricoDoProcesso` + este) por `juntarEventos` (mais recente primeiro; empate pelo id).
- **[Registrar reunião] preenchido:** navega para `#/reunioes/nova?para-setor=<id>[&para-tipo=modelagem&para-processo=<id>]`. Os nomes `para-*` não colidem com os filtros `setor` e `tipo` da lista. O formulário parte do modelo só se o setor estiver entre os ativos (setor inativo: formulário em branco, e o botão nem aparece no setor inativo). Depois de salvar ou cancelar, a pessoa fica na área Reuniões (lista).
- **Clicar numa reunião da seção** navega para `#/reunioes/<id>` (abre o painel da reunião na área Reuniões).
- **Frases novas:** "Não é possível excluir: setor tem N reuniões registradas. Desative o setor em vez de excluí-lo." e "Não é possível excluir: processo foi tratado em N reuniões. Cancele o processo em vez de excluí-lo." (singular com 1). A do setor entra em `recusasDeProcessos.ts` (que já traduz as recusas por vínculo do setor); a do processo em `andamentosSupabase.ts` (que traduz as do processo), com a frase em `src/processos/frasesDeReuniao.ts`.
- **A Consulta** vê as seções sem [Registrar reunião] (`podeAlterar` falso).

## Estrutura de arquivos

Criar: `supabase/tests/25_reunioes_nos_cadastros.test.sql`, `src/reunioes/reunioesLigadas.ts` (+ teste), `src/reunioes/juntarEventos.ts` (+ teste), `src/processos/frasesDeReuniao.ts`, `src/components/reunioes/SecaoDeReunioes.tsx`, `ReunioesDoSetor.tsx`, `ReunioesDoProcesso.tsx`, `src/components/processos/HistoricoDoProcesso` (muda), `src/App.reunioesNoSetor.test.tsx`, `src/App.reunioesNoProcesso.test.tsx`, `src/App.recusaComReunioes.test.tsx`.

Modificar: `src/cadastros/recusasDeProcessos.ts` (+ teste), `src/processos/andamentosSupabase.ts` (+ teste), `src/reunioes/enderecoDasReunioes.ts` (+ teste), `src/reunioes/tipos.ts`, `reunioesSupabase.ts` (+ teste), `ReunioesFalso.ts` (+ teste), `src/components/reunioes/AreaDeReunioes.tsx`, `PainelDeNovaReuniao.tsx`, `FormularioDaReuniao.tsx`, `src/components/cadastros/AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx`, `src/components/processos/AreaDeProcessos.tsx`, `PainelDoProcesso.tsx`, `HistoricoDoProcesso.tsx`, `src/App.tsx`, `src/testes/reunioesDeTeste.tsx`.

## Tarefas

### Tarefa 1 — Branch, marco e teste de banco (critério 1)

**Arquivos:** `supabase/tests/25_reunioes_nos_cadastros.test.sql` (novo).

- [x] `git switch -c reunioes-04` e `git tag marco/2026-10-15-inicio-ticket-04-reunioes` (feitos). Alvo conferido: os dois são `yclkzyoebpsxmgpbcbus`.
- [ ] Criar o 25 no molde do 23 (`begin`, `_tap`, `plan(N)`, usuários a1 a4, `finish()` e a exceção `RESULTADO DOS TESTES`): setor TN1 com um processo `a_classificar` ("Solto N") tratado numa reunião de modelagem registrada pelo integrante; asserções: (1) o integrante reclassifica o "Solto N" para `processo`; (2) a reunião continua existindo; (3) a ligação com o processo continua (1 linha em `reunioes_processos`, com o mesmo id do processo); (4) o histórico do processo ganha o evento `reclassificar` e a reunião **não** ganha evento de alteração por causa disso.
- [ ] Comitar ("Ticket 04 de reunioes: plano de execução e teste de banco da reclassificação"), `git push -u origin reunioes-04`, disparar "Testes de banco" na branch e ler: o 25 e todos os demais verdes.

### Tarefa 2 — Frases de recusa (critério 5)

**Arquivos:** `src/cadastros/recusasDeProcessos.ts` (+ teste), `src/processos/frasesDeReuniao.ts`, `src/processos/andamentosSupabase.ts` (+ teste).

- [ ] Testes que falham: `setor_com_reunioes:2` vira `TravaDoBanco` "Não é possível excluir: setor tem 2 reuniões registradas. Desative o setor em vez de excluí-lo."; com `:1`, "1 reunião registrada"; `processo_com_reunioes:1` vira "Não é possível excluir: processo foi tratado em 1 reunião. Cancele o processo em vez de excluí-lo." e `:3`, "3 reuniões".
- [ ] Implementar: `setor_com_reunioes` no padrão e no mapa de `recusasDeProcessos.ts` (o mais longo continua primeiro; `setor_com_reunioes` não é prefixo de outro); `processo_com_reunioes` no padrão e no mapa de `andamentosSupabase.ts`, com `fraseDoProcessoComReunioes(n: string)` em `frasesDeReuniao.ts`.
- [ ] Rodar os testes dos dois arquivos e comitar.

### Tarefa 3 — Funções puras e endereço (critérios 2, 3)

**Arquivos:** `src/reunioes/reunioesLigadas.ts` (+ teste), `src/reunioes/juntarEventos.ts` (+ teste), `src/reunioes/enderecoDasReunioes.ts` (+ teste).

**Interfaces — Produz:** `reunioesDoSetor(reunioes: Reuniao[], setorId: string): Reuniao[]` (mais recente primeiro, empate pelo id); `reunioesDoProcesso(reunioes: Reuniao[], processoId: string): Reuniao[]` (só as que trazem o processo, mais recente primeiro); `juntarEventos(a: EventoDoCadastro[], b: EventoDoCadastro[]): EventoDoCadastro[]` (mais recente primeiro; empate, id maior primeiro); `ModeloDaReuniao = { setorId: string; tipo: TipoDeReuniao | null; processoId: string | null }`; `montarEnderecoDeNovaReuniao(modelo: ModeloDaReuniao | null): string` (`#/reunioes/nova` com `para-*`); `lerModeloDaReuniao(endereco: string): ModeloDaReuniao | null`.

- [ ] Testes que falham para cada função (incluindo: setor sem reunião devolve lista vazia; reunião de sensibilização nunca aparece no processo; modelo sem setor vira `null`; tipo inválido ignorado).
- [ ] Implementar o mínimo e rodar os testes; comitar.

### Tarefa 4 — Módulo: eventos de reunião do processo (critério 4)

**Arquivos:** `src/reunioes/tipos.ts`, `reunioesSupabase.ts` (+ teste), `ReunioesFalso.ts` (+ teste).

**Interfaces — Produz:** `ModuloDeReunioes.lerEventosDeReuniaoDoProcesso(processoId: string): Promise<EventoDoCadastro[]>` (mais recente primeiro).

- [ ] Testes que falham: no módulo real (cliente falso), o pedido lê `eventos` de entidade `reuniao`, devolve só os eventos cujo `antes` ou `depois` traz o processo em `processos`, e a falha de leitura vira `Error` "Falha ao ler o histórico do processo p1: …"; no falso, `lerEventosDeReuniaoDoProcesso` devolve do `historico` os eventos que citam o processo (antes ou depois), do mais recente ao mais antigo, e respeita `falharHistoricoDoProcesso`/`segurarHistoricoDoProcesso` (campos novos).
- [ ] Implementar o mínimo; rodar; comitar.

### Tarefa 5 — Interface: seções, formulário preenchido, histórico (critérios 2 a 6)

**Arquivos:** `src/components/reunioes/SecaoDeReunioes.tsx`, `ReunioesDoSetor.tsx`, `ReunioesDoProcesso.tsx`, `AreaDeReunioes.tsx`, `PainelDeNovaReuniao.tsx`, `FormularioDaReuniao.tsx`; `AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx`; `AreaDeProcessos.tsx`, `PainelDoProcesso.tsx`, `HistoricoDoProcesso.tsx`; `App.tsx`; testes de tela (arquivos novos, listados acima) e `src/testes/reunioesDeTeste.tsx`.

- [ ] Testes de tela que falham (renderizando o aplicativo inteiro, falsos nomeados): **setor aberto** — seção Reuniões com data, tipo e processos, ordem da mais recente; "Nenhuma reunião."; carregando; erro com [Tentar de novo]; clicar abre `#/reunioes/<id>` com o painel; [Registrar reunião] abre o formulário com o setor preenchido; Consulta sem o botão; setor inativo sem o botão. **Painel do processo** — só as reuniões de modelagem que o trataram; "Nenhuma reunião."; [Registrar reunião] abre o formulário com tipo modelagem, setor e processo marcados; Consulta sem o botão; aba Histórico mostra o evento de reunião (criação com o processo, e a exclusão da reunião) junto dos do processo. **Recusa** — excluir setor e excluir processo com a recusa programada (`falhaDeGravacao`) mostram a frase em vermelho com a contagem e o caminho.
- [ ] Implementar: `SecaoDeReunioes` (título "Reuniões", carregando, erro, vazio, tabela curta, botão), os dois usos, o modelo no endereço/painel/formulário (partindo do modelo só se o setor está ativo), a junção dos históricos, e o módulo de reuniões chegando às áreas.
- [ ] `npx vitest run` dos arquivos tocados; `npx tsc -b`; `npx eslint` nos arquivos; comitar por etapas.

### Tarefa 6 — Fecho

- [ ] Bateria completa (`npm test`), `tsc -b`, `eslint`; `desvios.md` (sem migração, teste 25 nasce verde, leituras por filtro na tela, filtro do histórico na tela, frases, destino após registrar); `melhorias-protocolo.md`; marcar as caixas deste plano.
- [ ] Merge na `main` (`git switch main`, `git merge reunioes-04`), `git branch -d reunioes-04`, linha `Concluído em` no ticket, push da `main`, conferir o "Testes de banco" da `main` se mexeu em `supabase/` (mexeu: teste novo).
