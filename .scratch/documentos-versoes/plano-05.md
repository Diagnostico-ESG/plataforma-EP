# Ticket 05 de documentos-versoes (Relatório depois e "sem alteração de conteúdo") — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** acrescentar o relatório a uma versão nova que ainda não tem (a mais recente pendente vem escolhida) e marcar "sem alteração de conteúdo" (a função copia no Drive o relatório da versão anterior com o nome da versão nova), com a marca "relatório pendente" calculada na tela.

**Architecture:** o banco impõe as regras (gatilhos do ticket 02 e 04 ganham o ramo do relatório depois e da cópia; funções novas sem `security definer`: `acrescentar_relatorio`, `registrar_sem_alteracao` e a leitura `origem_do_relatorio`). A função do servidor reaproveita `iniciar_envio` (papel `relatorio`) e faz `registrar` chamar `acrescentar_relatorio` quando vem `versao_id`; a ação nova `sem_alteracao` copia no Drive e grava. A interface ganha dois métodos no módulo (real e falso), o formulário do relatório, a marca e o botão por versão.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`); Postgres/pgTAP pelo GitHub Actions; Drive API v3 por `fetch`.

**Spec:** `.scratch/documentos-versoes/spec.md` (histórias 22 a 27 e 45; regras "Versão histórica é somente leitura", "Sem alteração de conteúdo só copia o relatório da versão imediatamente anterior…", "Um arquivo por papel…") · **Ticket:** `.scratch/documentos-versoes/issues/05-relatorio-depois-e-sem-alteracao.md` (critérios citados como "critério N", na ordem: 1 banco, 2 `sem_alteracao` copia no Drive, 3 marca, 4 [Acrescentar relatório], 5 [Sem alteração de conteúdo], 6 recusas e testes de interface).

## Global Constraints

- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui: teste de banco antes da migração; RLS e privilégios mínimos (`grant insert (copiado_de)` e mais nada; o teste `10_privilegios_padrao` continua passando); regra de negócio em gatilho ou função; funções de gravação sem `security definer` (a RLS decide); função `security definer` só a que grava o evento, com `search_path` vazio e nomes qualificados; nenhuma view nova; nenhum bucket; a Edge Function confere o chamador antes de tocar o Drive, decisão em arquivo puro testado no Vitest; a chave secreta do Supabase não é usada.
- Banco só pelos workflows do GitHub (porta 5432 fechada): "Testes de banco" e "Migrar banco de desenvolvimento" na branch `documentos-versoes-05`, pelo navegador do app. Alvo conferido antes de `db:types`: "vínculo atual" de `supabase/AMBIENTES.md` = `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`. Migração aplicada no dev não se edita: ensaiar antes (Tarefa 1).
- Nenhuma dependência nova. Funções de lógica de 4 a 20 linhas (hooks até 40), arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): rodar em segundo plano. Nunca `--no-verify`.
- A branch parte de `documentos-versoes-01` (pedido do usuário); a `main` só recebe os tickets 01 a 05 depois da prova do Drive.

## Decisões do plano

- **Recusas do banco em P0001 `motivo:valor`**, como as dos tickets 02 e 04 (a função do servidor repassa qualquer `motivo` como código, 409): `relatorio_ja_existe`, `versao_anterior_sem_relatorio`, `copia_so_de_relatorio`, `copia_de_versao_que_nao_e_a_anterior`, `copia_diferente_do_original`; a histórica já recusa com `versao_historica_somente_leitura` (ticket 04: inclusão fora da chamada que criou a versão).
- **"Outra chamada" no pgTAP:** como no teste 28, o teste recua `enviada_em` como superusuário, porque o banco reconhece "a mesma chamada" por `enviada_em = now()`.
- **`private.preparar_arquivo_da_versao` ganha, no `insert`, as conferências do arquivo novo** (`create or replace`): relatório repetido na versão (`relatorio_ja_existe`, em vez do erro 23505 da restrição, que fica como rede de segurança) e a cópia (`private.conferir_copia_do_relatorio`: só relatório, só do arquivo da versão imediatamente anterior, e com o mesmo formato, tamanho e MD5 do original).
- **"Versão imediatamente anterior"** = `private.versao_anterior(versao)`: a de maior número menor que o dela no mesmo processo (a histórica conta; o relatório dela, se existe, pode ser copiado).
- **Evento por arquivo que entra depois da versão:** gatilho `after insert` em `arquivos_da_versao`, que só grava quando `versoes.enviada_em <> now()` (arquivos da criação já estão no evento da versão). `acao` = `acrescentar_relatorio` ou, com `copiado_de`, `sem_alteracao`; `detalhes.depois` = estado da versão + `relatorio_de` (rótulo da versão de origem, só na cópia).
- **Funções do banco:** `public.origem_do_relatorio(p_versao uuid)` (devolve `arquivo_id`, `formato`, `drive_id` do relatório da versão anterior; vazio se não há), `public.acrescentar_relatorio(p_versao uuid, p_numero integer, p_arquivo jsonb) returns uuid` (força o papel `relatorio`; recusa `numero_da_versao_mudou:<n>` se o número não bate, como o `registrar_versao`), `public.registrar_sem_alteracao(p_versao uuid, p_arquivo jsonb) returns uuid` (acha a origem, recusa `versao_anterior_sem_relatorio` se não há, grava com `copiado_de`).
- **Função do servidor:** `registrar` aceita `versao_id` (uuid, opcional): com ele, `arquivos` tem de ser um só, o `relatorio`, e `historica` falso; chama `acrescentar_relatorio`. `iniciar_envio` não muda (papel `relatorio`, `numero` da versão, `historica` falso). Ação nova `sem_alteracao` (Administrador e Integrante): confere situação do processo e que a versão é nova, lê `origem_do_relatorio`, copia no Drive (`files/{id}/copy`) para a pasta do processo com o nome padrão da versão nova, confere pelo `conferirArquivosNoDrive` e grava por `registrar_sem_alteracao`. Se o banco recusar depois da cópia, o arquivo copiado fica órfão na pasta (a função não apaga).
- **Tela:** o botão [Acrescentar relatório] fica na seção (abre o formulário com a versão mais recente pendente escolhida e a lista para trocar), e o [Sem alteração de conteúdo] fica em cada versão pendente cuja anterior tem relatório (a spec fala em "cada versão" para os dois; a história 23 pede a escolha da versão num formulário só, por isso o primeiro é único).
- **Marcas calculadas na tela:** "Relatório pendente" (versão nova sem relatório); no relatório copiado, "Sem alteração de conteúdo · relatório da V4", resolvido pelo `copiadoDe` do arquivo na lista que a tela já tem.
- **Prova do Drive (`scripts/prova-do-drive.mjs`)** ganha o passo do relatório depois e da cópia; roda no roteiro do usuário, junto com a dos tickets 01 a 04.
- **Concluído em:** este ticket segue a regra dos tickets 01 a 04 (sem a linha `Concluído em` até a prova do Drive, decisão do usuário em 2026-10-15). O comando manda gravar a linha; a Tarefa 6 pergunta ao usuário antes.

## Estrutura de arquivos

Criar:
- `supabase/tests/29_relatorio_depois.test.sql`
- `supabase/migrations/<data>_relatorio_depois_e_sem_alteracao.sql` (criada com `npx supabase migration new relatorio_depois_e_sem_alteracao`)
- `supabase/functions/_shared/semAlteracao.ts` (+ teste)
- `supabase/functions/arquivos-no-drive/semAlteracao.ts`, `gravacao.ts`
- `src/components/versoes/FormularioDeRelatorio.tsx`, `AcaoSemAlteracao.tsx`
- `src/App.relatorioDepois.test.tsx`

Modificar: `supabase/functions/_shared/decisao.ts`, `registro.ts` (+ testes), `arquivos-no-drive/index.ts`, `acoes.ts`, `registrar.ts`, `scripts/prova-do-drive.mjs`, `src/versoes/tipos.ts`, `rotulos.ts`, `versaoDaLinha.ts`, `recusasDeVersoes.ts`, `versoesSupabase.ts`, `VersoesFalso.ts` (+ testes), `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/versoes/SecaoDeVersoes.tsx`, `ListaDeVersoes.tsx`, `Versoes.css`, `src/App.versoesNoHistorico.test.tsx`, `src/types/database.ts` (gerado), `supabase/AMBIENTES.md`, `.scratch/documentos-versoes/desvios.md`, `issues/05-relatorio-depois-e-sem-alteracao.md`, `.scratch/melhorias-protocolo.md`.

## Tarefas

### Tarefa 1 — Banco: teste, ensaio, migração, aplicação e tipos (critério 1)

**Arquivos:** `supabase/tests/29_relatorio_depois.test.sql`, a migração, `src/types/database.ts`, `supabase/AMBIENTES.md`.

- [x] Teste `29_relatorio_depois.test.sql`, no molde do 28 (usuários a1 a a4, `_tap`, exceção final, funções `pg_temp`; setor `RD1`; processos e1 a e6; e2 suspenso, e3 cancelado, e4 concluído, e5 com histórica, e6 do integrante; versões criadas por `registrar_versao` antes das mudanças de situação; depois `enviada_em` recuado). Casos: sem relatório anterior (V1) → `versao_anterior_sem_relatorio`; relatório acrescentado a V1; de novo → `relatorio_ja_existe`; a V2 criada com relatório → `relatorio_ja_existe`; papel forçado (`png` no jsonb) → 23514; `p_numero` errado → `numero_da_versao_mudou`; histórica → `versao_historica_somente_leitura`; "sem alteração" V3 ← V2 aceito com `copiado_de` e `enviado_por`; V5 (anterior V4 sem relatório) recusado; inserção direta de cópia de versão que não é a anterior, de arquivo não relatório, com hash diferente e pela função com hash diferente; V3 de novo → `relatorio_ja_existe`; V4 ← V3 (cadeia) aceita; um evento por operação (`acrescentar_relatorio` 1, `sem_alteracao` 2, `relatorio_de` = `V2`, nenhum evento extra da V2 criada com relatório); situação (suspenso, cancelado, concluído); perfis (integrante aceita; consulta e inativo recusados 42501; consulta lê eventos, inativo não; visitante recusado).
- [x] Commit do teste, push da branch, "Testes de banco" na branch: o 29 falha (funções não existem). Esse é o vermelho; o 28 continua passando.
- [x] Migração (`npx supabase migration new relatorio_depois_e_sem_alteracao`).
- [x] **Ensaio antes de aplicar:** teste temporário com a migração dentro do teste (transação desfeita) e os testes 27, 28 e 29 na sequência; "Testes de banco" tudo verde; apagar o ensaio em commit à parte. Usar a forma com função no `replace` ao colar SQL com `$$`.
- [x] Commit da migração, push, "Migrar banco de desenvolvimento" com o nome da migração (escolher a branch antes de preencher o campo). Depois "Testes de banco": tudo verde, inclusive `00_rls_ligada`, `01_buckets_privados`, `10_privilegios_padrao`, 27, 28 e 29. Se falhar, a correção é uma migração nova.
- [x] `npm run db:types` (alvo conferido), `npm run typecheck`; registrar a migração e os números das execuções em `supabase/AMBIENTES.md`. Commit.

### Tarefa 2 — Função do servidor (critérios 1 e 2)

**Arquivos:** `_shared/decisao.ts`, `_shared/registro.ts`, `_shared/semAlteracao.ts` (+ testes), `arquivos-no-drive/{index,acoes,registrar,semAlteracao,gravacao}.ts`, `scripts/prova-do-drive.mjs`.

- [x] Testes do Vitest primeiro (vermelho): `lerAcao` e `conferirChamador` para `sem_alteracao` (perfis); `validarRegistrar` com `versao_id` (uuid; só um arquivo relatório; `historica` verdadeiro recusado; tipo errado cita o tipo), `funcaoDoBancoPara` e `parametrosDoBanco` para as três funções; `validarSemAlteracao` (campos e tipos); `recusaDoBanco` para os códigos novos → 409.
- [x] Implementar. Verde. `registrar.ts` usa os parâmetros pela função pura; `gravacao.ts` guarda a resposta ao resultado do banco (já repetida em `registrar` e em `sem_alteracao`); `semAlteracao.ts` (Deno) faz o fluxo da decisão acima. Os arquivos Deno não passam pelo `tsc` (desvio do ticket 01): conferir à mão contra a documentação do Drive (`files.copy`).
- [x] `prova-do-drive.mjs`: passo novo no fim (relatório depois numa versão sem relatório; "sem alteração" na versão seguinte). Sem versão assim, relata e segue.
- [x] `npm run lint`, `npm run typecheck`, `npm test`. Commit.

### Tarefa 3 — Funções puras e módulo (critérios 3, 4, 5 e 6)

**Arquivos:** `src/versoes/{tipos,rotulos,versaoDaLinha,recusasDeVersoes,versoesSupabase,VersoesFalso}.ts` (+ testes), `src/cadastros/historicoDosCadastros.ts` (+ teste).

- [x] Testes primeiro (vermelho). `rotulos`: `relatorioPendente`, `versoesComRelatorioPendente` (da mais recente), `podeCopiarRelatorio` (nova pendente com anterior com relatório; histórica nunca; anterior sem relatório não), `origemDoRelatorio` (rótulo de onde veio). `versaoDaLinha`: `copiadoDe` só quando existe. Recusas: frases novas. Módulo real: `acrescentarRelatorio` chama `iniciar_envio` com papel `relatorio`, número da versão, `historica: false`, faz o `PUT`, avisa o progresso e só então chama `registrar` com `versao_id`; falha no `PUT` não registra; `semAlteracaoDeConteudo` chama a ação. Falso: as duas operações com as regras do banco, os eventos (`acrescentar_relatorio`, `sem_alteracao`) pelo `aoRegistrar` e as falhas programáveis. Histórico: os textos novos.
- [x] Implementar. Verde. Commit.

### Tarefa 4 — Marca, botões e formulário (critérios 3 a 6)

**Arquivos:** `src/components/versoes/{SecaoDeVersoes,ListaDeVersoes,FormularioDeRelatorio,AcaoSemAlteracao}.tsx`, `Versoes.css`, `src/App.relatorioDepois.test.tsx`, `src/App.versoesNoHistorico.test.tsx`.

- [x] Testes de interface (vermelho), com o aplicativo inteiro e a `VersoesFalso`: marca "Relatório pendente" só na nova sem relatório (não na histórica, nem na que tem); [Acrescentar relatório] aparece para Administrador e Integrante, com o processo em andamento e alguma versão pendente (não para a Consulta, nem com o processo suspenso, cancelado ou concluído, nem sem pendente); o formulário traz a versão mais recente pendente escolhida e permite trocar; só `.docx` ou `.pdf` até 20 MB (recusa ao lado do campo, botão desabilitado); prévia do nome; registrar tira a marca; progresso "Enviando 1 de 1…" com campos travados; recusa vira mensagem e o formulário continua preenchido; [Sem alteração de conteúdo] só na nova pendente cuja anterior tem relatório, pede confirmação, e a versão mostra "relatório da V…"; recusas (relatório já existe, anterior sem relatório); a histórica sem a marca e sem os botões; histórico mostra os dois eventos.
- [x] Componentes. Verde. Commit.

### Tarefa 5 — Fecho do ticket

- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`; "Testes de banco" verde na branch.
- [x] `desvios.md` (entrada "ticket 05"), ticket 05 (caixas dos critérios provados, ressalva do `[visual]`, prova do Drive pendente), `.scratch/melhorias-protocolo.md` (itens de `.claude/regras/nao-testados.md` que aconteceram).
- [x] Juntar à `documentos-versoes-01` (fast-forward) e apagar a branch com `git branch -d`; enviar a `documentos-versoes-01` (sem `--force`). Se o `-d` recusar, parar e perguntar.
- [x] **Perguntar ao usuário** se grava a linha `Concluído em` do ticket 05 agora ou só depois da prova do Drive. Depois, apontar o ticket 06 e lembrar o `/cost`.

> **Situação em 2026-10-16:** tarefas 1 a 5 feitas. O ticket 05 foi juntado à `documentos-versoes-01` por fast-forward (último commit `a7e6d71`), e não à `main`. A linha `Concluído em` não foi gravada (regra dos tickets 01 a 04, prova do Drive pendente); a pergunta ao usuário ficou para o relatório final da sessão.
