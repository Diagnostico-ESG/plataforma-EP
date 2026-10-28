# Fim do Arquivado — Plano do ticket 01

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`); marque `- [x]` ao concluir cada um.

**Goal:** Remover o Arquivado por inteiro (banco, função do Drive e tela) e deixar pronto o campo `tirado_do_quadro_em` e a coluna derivada `no_quadro` da view, de modo que o concluído que estava arquivado seja editável como qualquer concluído e continue fora do Quadro.

**Architecture:** Uma migração destrutiva única (copia o dado, recria as funções sem a trava, recria a view, apaga `arquivado_em`). A camada de acesso (`ModuloDeProcessos`) perde `arquivar`/`desarquivar`; a tela perde o selo, os botões, o filtro e as frases do arquivado; o Quadro passa a filtrar pelo campo `noQuadro` (vindo da view) no lugar de `arquivadoEm`. Nenhuma função nova grava `tirado_do_quadro_em` neste ticket (vêm no ticket 03); só o gatilho que o protege.

**Tech Stack:** React + Vite + TypeScript, Vitest, Supabase (Postgres, pgTAP, Edge Function Deno).

**Spec:** `.scratch/repositorio-de-processos/spec.md` (seções "Trabalho em curso x portfólio", "Modelo de dados", "Migração", linha da Edge Function em "Interface"). **Ticket:** `.scratch/repositorio-de-processos/issues/01-fim-do-arquivado.md`. ADR 0034.

## Global Constraints

- Regras de `.claude/regras/banco.md` (lidas): teste de banco antes da migração; migração e teste e tipos no mesmo commit; view com `security_invoker = true`; função nova em `private` com `search_path` vazio, `execute` só a `authenticated`; sem `security definer` nas funções públicas; migração nunca é editada depois de enviada ao remoto.
- Banco: vínculo atual é o remoto de desenvolvimento (`yclkzyoebpsxmgpbcbus`, `supabase/AMBIENTES.md`). Os testes de banco rodam no Docker local (`npx supabase start`, `npx supabase test db`, contar linhas `ok`/`not ok`; o "FAIL" final do runner é do formato dos testes) — decisão de 2026-10-24. Nada vai ao remoto de desenvolvimento por mim: a migração é aplicada pelo workflow "Migrar banco de desenvolvimento" (disparado na branch, autorizado). Saída de `supabase start`/`status` traz chaves: não repetir.
- Código: funções de lógica de 4 a 20 linhas, arquivos até 300 linhas, sem `any`, mensagens de erro com valor e formato esperado, early return. Dados de teste só inventados. Sem dependência nova.
- `ProcessoDaLista`/`ProcessoLido` ganham `tiradoDoQuadroEm?: string | null` e `noQuadro?: boolean` (opcionais, como `arquivadoEm` era); `noQuadro` ausente vale verdadeiro.
- Recusa nova do banco: `tirado_do_quadro_so_pela_funcao` (P0001). Setting da sessão: `ep.liberando_tirada` (ligada só pelas funções do ticket 03).
- Rótulos e frases em português. Marcas "Concluído em" e commit ficam para o fim (passo do `/executar-complexo`).

## Mapa de arquivos

- Criar: `supabase/migrations/<ts>_fim_do_arquivado.sql` (ts por `npx supabase migration new fim_do_arquivado`); `supabase/tests/68_fim_do_arquivado.test.sql`.
- Apagar: `supabase/tests/49_arquivar_e_registrar_publicacao.test.sql`; `src/processos/arquivamentoFalso.ts`, `arquivamentoSupabase.ts` e seus testes; `src/App.arquivamento.test.tsx`; `src/App.listaDosArquivados.test.tsx`; `src/processos/ProcessosFalso.arquivamento.test.ts`.
- Alterar (banco): testes 39, 41, 44, 50, 52, 53, 55, 60, 61, 62, 65; `src/types/database.ts` (gerado).
- Alterar (código): lista na Tarefa 5 e 6; Edge Function `supabase/functions/arquivos-no-drive/{acoes,registrar}.ts`, `_shared/decisao.ts` e `decisao.test.ts`.

---

### Tarefa 1: Branch e ponto de partida

- [ ] **1.1** Confirmar árvore limpa (só os 5 arquivos soltos de `.scratch/` não rastreados, que ficam como estão) e que o marco `marco/2026-10-28-inicio-repositorio-de-processos` existe: `git status --short`, `git tag -l "marco/2026-10-28-inicio-repositorio*"`.
- [ ] **1.2** `git switch -c repositorio-de-processos` (a partir da `main`, na pasta principal, sem worktree).
- [ ] **1.3** Subir o Docker local do banco: `npx supabase start` (descartar a saída, que traz chaves) e `npx supabase test db 2>&1 | tail -5` para a linha de base. Anotar quantos arquivos passam. (Se o Docker não subir, parar e me avisar.)

### Tarefa 2: Teste de banco novo (falha antes da migração)

**Files:** Create `supabase/tests/68_fim_do_arquivado.test.sql`.

**Interfaces:** Produces — contrato do banco usado pelas tarefas 3 a 6: coluna `public.processos.tirado_do_quadro_em timestamptz`; colunas da view `tirado_do_quadro_em` e `no_quadro boolean`; funções `private.liberando_tirada()`, `private.conferir_tirada_do_quadro()`; recusa `tirado_do_quadro_so_pela_funcao`; ausência de `arquivado_em`, `arquivar_processo`, `desarquivar_processo`.

- [ ] **2.1** Montar o arquivo copiando o cabeçalho e os auxiliares de `supabase/tests/55_registrar_publicacao.test.sql` (linhas 1 a ~60: transação, `_tap`, quatro usuários a1 administrador, a2 integrante, a3 consulta, a4 inativo, setor e macro inventados com ids próprios, `pg_temp.claims`, `processo`, `etapa`, `mover`, `linha`). Usar setor `5f000000-0000-0000-0000-000000000068` (sigla `T68`) e macro própria.
- [ ] **2.2** Processos de teste (criados por a1 como no 55): `Recente`, `Antigo`, `Andamento`, `Tirado`, `Volta`, `Perfis`. Levar `Recente`, `Antigo`, `Tirado`, `Volta` e `Perfis` a Concluídos com `pg_temp.mover(nome, 'concluidos')` (a2; use `enviar_completa` e a data/explicação de publicação como o 55 faz para chegar a Concluídos — copie o jeito de `Conc` e `Corrige` do 55). Depois, como dono do banco (antes de `set local role`), ajustar a data de entrada: `update public.passagens set entrou_em = now() - interval '31 days' where processo_id = pg_temp.processo('Antigo') and saiu_em is null;` e `'29 days'` para `Recente`.
- [ ] **2.3** Asserções (um `insert into _tap (linha) select …` por linha; `plan(N)` com N = total):
  1. `hasnt_column('public', 'processos', 'arquivado_em', 'a coluna arquivado_em não existe mais')`
  2. `has_column('public', 'processos', 'tirado_do_quadro_em', …)`
  3. `hasnt_column('public', 'processos_com_andamento', 'arquivado_em', …)`
  4. `hasnt_function('public', 'arquivar_processo', …)` e `hasnt_function('public', 'desarquivar_processo', …)` (2 asserções)
  5. `no_quadro` verdadeiro para `Recente` (29 dias); falso para `Antigo` (31 dias); verdadeiro para `Andamento` (fora de Concluídos)
  6. Tirado depois de entrar: como dono do banco, `select set_config('ep.liberando_tirada','on',true); update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Tirado'); select set_config('ep.liberando_tirada','off',true);` → `no_quadro` falso para `Tirado`
  7. Sair e voltar devolve ao Quadro: `Volta` com `tirado_do_quadro_em` gravado do mesmo jeito, `pg_temp.mover('Volta','publicacao')` e `pg_temp.mover('Volta','concluidos')` por a2 → `no_quadro` verdadeiro (a passagem nova é mais recente que a marca)
  8. Gravação direta recusada: `throws_ok($sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$, 'P0001', 'tirado_do_quadro_so_pela_funcao', …)` para a1 e para a2 (duas asserções)
  9. Consulta (a3): o mesmo `update` não altera nada (`lives_ok` e `is((select tirado_do_quadro_em from public.processos where id = …), null::timestamptz, …)`); inativo (a4) idem; visitante (`set local role anon`): `throws_ok(…, '42501', null, …)`
  10. Leitura por perfil de `tirado_do_quadro_em` e `no_quadro` pela view: a1, a2, a3 leem (`is(pg_temp.linha('Perfis').no_quadro, true, …)` três vezes); a4 vê 0 linhas; anon `throws_ok('select no_quadro from public.processos_com_andamento', '42501', null, …)`
  11. O concluído (com `tirado_do_quadro_em` gravado) aceita as alterações de qualquer concluído, por a2: mudar a etiqueta e o responsável (copie as chamadas do teste 53, trecho "Suspenso, cancelado e arquivado congelam", trocando a expectativa para `lives_ok`), gravar Anotações (`public.gravar_anotacoes_do_processo`, como no 50), `pg_temp.mover('Tirado','publicacao')` e registrar a publicação de um concluído sem data (como no 55, caso `Arq`), enviar o .pdf e editar o número da versão são cobertos nos testes 60 e 65 adaptados na Tarefa 4 (não repetir aqui)
  12. Tirado/mover não geram evento novo: depois do passo 6, `is((select count(*) from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Tirado')::text and acao in ('arquivar','desarquivar')), 0::bigint, …)`
- [ ] **2.4** Rodar só este arquivo no Docker: `npx supabase test db supabase/tests/68_fim_do_arquivado.test.sql`. Esperado: **falha** (coluna e funções antigas ainda existem, `tirado_do_quadro_em` não existe). Guardar o resultado (quantas linhas `not ok`) no plano.
- [ ] **2.5** Não comitar ainda; o commit sai junto da migração e dos tipos (regra do banco).

### Tarefa 3: Migração destrutiva

**Files:** Create `supabase/migrations/<ts>_fim_do_arquivado.sql`.

**Interfaces:** Consumes — o contrato da Tarefa 2. Produces — a view `public.processos_com_andamento` sem `arquivado_em` e com `tirado_do_quadro_em`, `no_quadro` no fim; `public.registrar_publicacao(uuid, date, text)` sem a regra do arquivado.

- [ ] **3.1** `npx supabase migration new fim_do_arquivado` e escrever, nesta ordem (cabeçalho com data, ticket, "Destrutiva", e o que apaga):

  ```sql
  -- 1. Coluna nova, privilégio e a liberação (como foi o arquivado), mas o gatilho só depois da cópia.
  alter table public.processos add column tirado_do_quadro_em timestamptz;
  grant update (tirado_do_quadro_em) on public.processos to authenticated;

  create function private.liberando_tirada() returns boolean
  language sql stable set search_path = ''
  as $$ select coalesce(current_setting('ep.liberando_tirada', true), '') = 'on' $$;

  create function private.conferir_tirada_do_quadro() returns trigger
  language plpgsql set search_path = ''
  as $$
  begin
    if new.tirado_do_quadro_em is distinct from old.tirado_do_quadro_em and not private.liberando_tirada() then
      raise exception 'tirado_do_quadro_so_pela_funcao';
    end if;
    return new;
  end $$;

  -- 2. Soltar os gatilhos do arquivado (antes da cópia, para ela não gerar evento nem recusa).
  drop trigger conferir_processo_arquivado on public.processos;
  drop trigger conferir_arquivamento on public.processos;
  drop trigger registrar_evento_do_arquivamento on public.processos;

  -- 3. Os concluídos arquivados continuam fora do Quadro: a data do arquivamento vira a de Tirar do Quadro.
  update public.processos p set tirado_do_quadro_em = p.arquivado_em
  from public.passagens pa join public.etapas e on e.id = pa.etapa_id
  where pa.processo_id = p.id and pa.saiu_em is null and e.codigo = 'concluidos'
    and p.situacao = 'em_andamento' and p.arquivado_em is not null;

  create trigger conferir_tirada_do_quadro before update of tirado_do_quadro_em on public.processos
    for each row execute function private.conferir_tirada_do_quadro();
  ```

- [ ] **3.2** Recriar, com `create or replace`, as funções sem a trava (copiar o corpo vigente do arquivo indicado, retirando só o que está dito):
  - `private.conferir_processo_em_andamento(uuid)`: o corpo de `20261014201236_situacao_do_processo.sql` linhas 81 a 94 (só a conferência de `situacao <> 'em_andamento'` → `processo_parado:%`).
  - `private.desmarcar_publicacao()`: o de `20261023004441` linhas 205 a 211, sem o terceiro `set_config('ep.liberando_arquivado', …)`.
  - `private.gravar_publicacao(uuid, date, text)`: o de `20261024193536` sem as duas linhas `set_config('ep.liberando_arquivado', …)`; ajustar o comentário.
  - `public.registrar_publicacao(uuid, date, text default null)`: o de `20261024193536`, trocando o bloco `if processo.arquivado_em is null … elsif … end if;` por `perform private.conferir_processo_em_andamento(p_processo);` e removendo a variável `processo` se ficar sem uso (o `select * … if not found` de `registro_inexistente` fica, lendo só o `id`).
  - `private.preparar_anexo()`: o de `20261026205450` linhas 46 a 58 sem o `if exists (… arquivado_em …) then raise exception 'processo_arquivado'; end if;`.
  - `private.conferir_processo_do_anexo_retirado()`: o de `20261026220736` linhas 15 a 24 sem o mesmo bloco.
  - `public.editar_numero_da_versao(uuid, integer, integer)`: o de `20261027160000` inteiro, sem o bloco `if exists (… arquivado_em …) then raise exception 'processo_arquivado'; end if;`.
  - `create or replace` mantém os privilégios das funções que já existiam.
- [ ] **3.3** Apagar o que sobra do arquivado, nesta ordem:
  ```sql
  drop function public.arquivar_processo(uuid);
  drop function public.desarquivar_processo(uuid);
  drop function private.gravar_arquivamento(uuid, timestamptz);
  drop function private.conferir_processo_arquivado();
  drop function private.conferir_arquivamento();
  drop function private.registrar_evento_do_arquivamento();
  drop function private.liberando_arquivado();
  ```
- [ ] **3.4** Recriar a view (`drop view public.processos_com_andamento;` e `create view … with (security_invoker = true)`): a definição de `20261028010945_cor_do_setor_na_view_dos_processos.sql` linhas 3 a 41, **sem** `p.arquivado_em`, e com no fim, depois de `s.cor as setor_cor`:
  ```sql
  ,
  p.tirado_do_quadro_em,
  -- Verdadeiro fora de Concluídos; em Concluídos, até 30 dias da entrada e enquanto ninguém tirou depois dela.
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos'
    then (p.tirado_do_quadro_em is null or p.tirado_do_quadro_em < pa.entrou_em)
      and pa.entrou_em > now() - interval '30 days'
    else true end as no_quadro
  ```
  e repetir `revoke all … from anon, authenticated; grant select … to authenticated;`.
- [ ] **3.5** Apagar a coluna: `alter table public.processos drop column arquivado_em;`.
- [ ] **3.6** Permissões das funções novas: `revoke execute on function private.liberando_tirada(), private.conferir_tirada_do_quadro() from public, anon; grant execute on function … to authenticated;`.
- [ ] **3.7** Rodar o `68` no Docker (`npx supabase test db supabase/tests/68_…` — o `start` aplica as migrações; se já estava no ar, `npm run db:reset`). Esperado: **todas as linhas `ok`**. Se alguma falhar, corrigir a migração (ainda não foi para o remoto).
- [ ] **3.8** Ensaio da cópia de dados (arquivo temporário `supabase/tests/68b_ensaio_fim_do_arquivado.test.sql`, apagado ao fim): numa cópia do cabeçalho do 68, **antes** de qualquer migração (rodar este arquivo num banco reiniciado só até a migração anterior: `npx supabase db reset --version 20261028010945`), criar com as funções antigas um concluído arquivado, um suspenso arquivado e um cancelado arquivado; colar a migração inteira no meio do arquivo; afirmar que o concluído tem `tirado_do_quadro_em` igual ao `arquivado_em` antigo e `no_quadro` falso, que o suspenso e o cancelado ficam com `tirado_do_quadro_em` nulo, e que os eventos `arquivar`/`desarquivar` antigos continuam em `eventos`. Rodar, ver verde, apagar o arquivo, voltar o banco ao estado atual (`npm run db:reset`).

### Tarefa 4: Ajustar os testes de banco antigos e fechar o banco

**Files:** apagar `49_…`; alterar `39, 41, 44, 50, 52, 53, 55, 60, 61, 62, 65`; gerar `src/types/database.ts`.

- [ ] **4.1** `git rm supabase/tests/49_arquivar_e_registrar_publicacao.test.sql` (só tratava do Arquivado; o que ele provava do concluído editável está no 68 e nos adaptados abaixo). Conferir antes que nada nele cobre registrar publicação que o 55 já não cubra.
- [ ] **4.2** Em cada arquivo abaixo, remover as linhas `select public.arquivar_processo(…)`; onde a asserção provava **recusa** `processo_arquivado`, trocar por prova de **aceite** do concluído quando o comportamento é o mesmo do concluído comum (mover, etiqueta, responsável, Anotações, data da validação, .pdf, anexo, retirar anexo, editar número) — exceto onde a regra de concluído já recusa por outro motivo (então a asserção passa a esperar esse motivo, que já aparece no mesmo arquivo para `Concluido`) ou onde ficaria duplicada (então a linha sai); ajustar o `plan(N)` ao novo total:
  - `39` (linhas 213-215), `41` (310-324), `50` (102, 224-234), `52` (138-148), `53` (87, 161-175), `60` (192-194, 298-317), `61` (99, 154-166), `62` (111, 119-132), `65` (120, 155-167): o caso "Arquivado" vira "Concluído que estava arquivado" ou sai.
  - `44` (79-86 e 171): o processo `T44 Arquivado` fica como um concluído comum (sem arquivar); a asserção "continua no pacote, em Concluídos" permanece.
  - `55` (101-103, 170-176): `Arq` e `ArqPub` ficam como concluídos comuns; "o arquivado com data não corrige a publicação" (`arquivado_ja_publicado`) sai, porque o concluído com data corrige a publicação como qualquer concluído; "o arquivado sem data registra" fica como "o concluído sem data registra" sem a coluna arquivado.
  - Conferir com `grep -nE "arquivad|arquivar" supabase/tests/*.sql` que sobra só `68_…` (e o nome "Arquivado" quando for apenas rótulo de processo de teste, trocando para outro nome).
- [ ] **4.3** `npx supabase test db 2>&1 | tail -25` — **todos** os arquivos verdes (contar `ok`/`not ok`, o "FAIL" final do runner é do formato). Ajustar até zerar os `not ok`.
- [ ] **4.4** Tipos pelo banco local: `npx supabase gen types typescript --local > src/types/database.ts` (conferir que saíram `arquivado_em`, `arquivar_processo`, `desarquivar_processo` e entraram `tirado_do_quadro_em`, `no_quadro`). Se o arquivo de tipos do projeto tem cabeçalho ou formatação própria, preservar (ver `scripts/gerar-tipos.mjs`).
- [ ] **4.5** Commit do banco: `git add supabase/migrations supabase/tests src/types/database.ts` e `git commit -m "repositorio-de-processos 01: migração do fim do Arquivado, testes de banco e tipos"` (o pre-commit roda; se barrar, corrigir a causa — nunca `--no-verify`). Nota: o `npm test` pode falhar aqui porque a camada TS ainda lê `arquivado_em`; se o pre-commit rodar os testes de tela, comitar o banco **junto** com a Tarefa 5 (um commit só) em vez de separado.

### Tarefa 5: Camada de acesso (TypeScript)

**Files:** `src/processos/tipos.ts`, `processoDaLinha.ts` (+ teste), `ProcessosFalso.ts`, `AnotacoesFalso.ts`, `src/revisoes/RevisoesFalso.ts`, `src/processos/processosSupabase.ts`, `recusasDoBanco.ts`, `frasesDePublicacao.ts`, `publicacao.ts` (+ teste), `publicacaoFalso.ts`, `src/anexos/recusasDeAnexos.ts`, `src/versoes/recusasDeVersoes.ts`, `src/cadastros/historicoDosCadastros.ts` (+ teste); apagar `arquivamentoFalso.ts`, `arquivamentoSupabase.ts` e testes dele.

**Interfaces:** Produces — `ProcessoLido.tiradoDoQuadroEm?: string | null`, `ProcessoLido.noQuadro?: boolean`; `ModuloDeProcessos` sem `arquivar` e `desarquivar`; sem `conferirNaoArquivado`.

- [ ] **5.1** (teste primeiro) Em `processoDaLinha.test.ts`, trocar a asserção de `arquivadoEm` por: uma linha com `tirado_do_quadro_em: '2026-10-01T10:00:00Z'` e `no_quadro: false` vira `{ tiradoDoQuadroEm: '2026-10-01T10:00:00Z', noQuadro: false }`; uma linha sem `tirado_do_quadro_em` e `no_quadro: true` vira `{ tiradoDoQuadroEm: null, noQuadro: true }`. Rodar `npx vitest run src/processos/processoDaLinha.test.ts` — falha (campos novos).
- [ ] **5.2** `processoDaLinha.ts`: no lugar de `arquivadoEm: linha.arquivado_em`, `tiradoDoQuadroEm: linha.tirado_do_quadro_em, noQuadro: linha.no_quadro ?? true`. `tipos.ts`: trocar `arquivadoEm` pelos dois campos (comentário: "Quando o concluído foi tirado do Quadro; …" / "Falso: o concluído saiu da coluna Concluídos do Quadro (tirado ou com mais de 30 dias); ausente vale verdadeiro"); tirar `arquivar` e `desarquivar` de `ModuloDeProcessos` e ajustar os comentários de `registrarPublicacao` e `TravaDoBanco` (sem arquivado). Rodar o teste do 5.1 — passa.
- [ ] **5.3** Apagar `arquivamentoFalso.ts`, `arquivamentoSupabase.ts`, `arquivamentoSupabase.test.ts`, `ProcessosFalso.arquivamento.test.ts`. Em `ProcessosFalso.ts` remover os métodos `arquivar`/`desarquivar`, o import e **todas** as chamadas `conferirNaoArquivado(...)` (linhas 78, 101, 111, 148, 192, 207, 214, 286); em `AnotacoesFalso.ts` (linhas 4 e 46) e `RevisoesFalso.ts` (linhas 5, 95, 108) idem. Em `processosSupabase.ts` tirar `criarArquivamentoSupabase` e o espalhamento dele. `publicacaoFalso.ts`: sempre `conferirProcessoEmAndamento(processo)`; `publicacao.ts`: tirar `textoDaPublicacaoNoArquivado` e o ramo `if (processo.arquivadoEm) …` de quem pode registrar (com a regra "concluído sem data registra, com data corrige", já presente no ramo comum); atualizar `publicacao.test.ts`.
- [ ] **5.4** Frases e recusas: em `frasesDePublicacao.ts` apagar `FRASE_DO_PROCESSO_ARQUIVADO`, `…_JA_ARQUIVADO`, `…_NAO_ARQUIVADO`, `fraseDoArquivarSoConcluido`, `FRASE_DO_ARQUIVADO_JA_PUBLICADO` e `FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO` (onde estiver definida); em `recusasDoBanco.ts` tirar os motivos `arquivar_so_concluido|ja_arquivado|nao_arquivado|processo_arquivado|arquivamento_so_pela_funcao|arquivado_ja_publicado` da lista e do mapa; em `recusasDeAnexos.ts` e `recusasDeVersoes.ts` tirar `processo_arquivado`. **Não** apagar `arquivar`/`desarquivar` de `historicoDosCadastros.ts` (o histórico antigo continua legível; só ajustar comentário se falar em função removida).
- [ ] **5.5** `npx tsc --noEmit` até zerar os erros da camada (a tela ainda pode acusar: ficam para a Tarefa 6).

### Tarefa 6: Tela

**Files:** `src/components/processos/{AgoraDoConcluido,AgoraDoProcesso,CaminhoDoProcesso,VersoDoCartao,CartaoDoProcesso,TabelaDeProcessos,FiltrosDosProcessos,BlocoDasAnotacoes,DetalheDaEtapa,PdfDaAprovacao}.tsx`, `Quadro.css`; `src/components/anexos/SecaoDeAnexos.tsx`; `src/processos/{colunasDoQuadro,destinoDoArrastar,filtrosDosProcessos,enderecoDosProcessos}.ts` e seus testes.

- [ ] **6.1** (teste primeiro) `colunasDoQuadro.test.ts`: o concluído com `noQuadro: false` não aparece em nenhuma coluna (por etapa, responsável, setor); o com `noQuadro: true` ou sem o campo aparece. `destinoDoArrastar.test.ts`: `podeArrastar` não olha mais `arquivadoEm`; o concluído arrasta como antes do Arquivado. `enderecoDosProcessos.test.ts`: o endereço antigo `?visao=lista&arquivados=esconder` é lido sem erro e o campo `arquivados` não existe mais no resultado nem é gravado. `filtrosDosProcessos.test.ts`: tirar o filtro `arquivados`. Rodar `npx vitest run src/processos` — falha nos pontos novos.
- [ ] **6.2** Implementar: `colunasDoQuadro.ts` → `processosDoQuadro` filtra `SITUACOES_NO_QUADRO.has(situacao) && processo.noQuadro !== false` (comentário: o concluído tirado do Quadro ou com mais de 30 dias fica só na Lista; cancelado também); `destinoDoArrastar.ts` sem `arquivadoEm` (tipo do `Pick` e o `if`); `filtrosDosProcessos.ts` e `enderecoDosProcessos.ts` sem `arquivados` (lista de nomes, `SO_DA_LISTA`, padrões, leitura/gravação; o parâmetro antigo é ignorado); `FiltrosDosProcessos.tsx` sem o seletor "Arquivados" e `OPCOES_DOS_ARQUIVADOS`; `TabelaDeProcessos.tsx` sem a `Pilula` "Arquivado". Rodar os testes de `src/processos` — passam.
- [ ] **6.3** Verso e Agora: `AgoraDoConcluido.tsx` sem o botão **Arquivar**, sem `AgoraDoArquivado`, `situacaoDoArquivado` e o import de `textoDaPublicacaoNoArquivado` (fica o Agora do concluído com [Corrigir publicação]/[Registrar publicação]); `AgoraDoProcesso.tsx` sem `arquivado`/`classeDoAgora(…, arquivado)`/o ramo `AgoraDoArquivado` e sem o botão **Arquivar** ao lado de [Retomar] (suspenso/cancelado só retomam); `CaminhoDoProcesso.tsx` e `VersoDoCartao.tsx` sem `Boolean(processo.arquivadoEm)` (`parado` é só suspenso/cancelado; `alteravel = podeAlterar`; `AcoesDoProcesso` recebe `podeAlterar`); ajustar os comentários de `CartaoDoProcesso`, `BlocoDasAnotacoes`, `DetalheDaEtapa`, `PdfDaAprovacao`, `SecaoDeAnexos` e de `Quadro.css` (linha 353) que falam em arquivado.
- [ ] **6.4** Testes de tela: apagar `App.arquivamento.test.tsx` e `App.listaDosArquivados.test.tsx`; nos demais (`App.anexosPerfis, anotacoesDoProcesso, arrastarParaMover, chegadaAConcluidos, concluidos, contextoDoVerso, dataDaValidacao, filtrosDosProcessos, lista, pdfDaAprovacao, processosDoSetor, reclassificar, registrarPublicacao, subprocessos` e os de `src/acesso`, `src/anexos`, `src/cadastros`, `src/processos`, `src/revisoes`, `src/versoes`, `src/testes` que ainda citem arquivado — achar com `grep -rlE "arquivad|arquivar|Arquivad|Arquivar" src`), cada caso que arquivava para provar recusa sai ou vira prova do concluído editável (mover, etiqueta, responsável, Anotações, registrar publicação) pela tela, com os módulos falsos. Acrescentar em `App.concluidos.test.tsx` um caso: concluído com `noQuadro: false` não aparece no Quadro e aparece na Lista, e o seu verso aceita alterar a etiqueta (sem botão Arquivar/Desarquivar).
- [ ] **6.5** `grep -rnE "arquivad|arquivar|Arquivad|Arquivar" src | grep -v "database.ts\|historicoDosCadastros"` — sobra só o que é nome de arquivo/“arquivo” ou rótulo de processo de teste.
- [ ] **6.6** `npx tsc --noEmit`, `npx eslint src` e `npm test` — tudo verde.

### Tarefa 7: Edge Function `arquivos-no-drive`

**Files:** `supabase/functions/_shared/decisao.ts` (+ `decisao.test.ts`), `supabase/functions/arquivos-no-drive/{acoes,registrar}.ts`.

- [ ] **7.1** (teste primeiro) `decisao.test.ts`: `conferirProcessoDoPdf(situacao)` — `'em_andamento'` e `'concluido'` → `null`; `'suspenso'` e `'cancelado'` → `recusar('processo_fora_de_andamento')`; remover o caso "arquivado". Rodar `npx vitest run supabase/functions/_shared/decisao.test.ts` — falha (assinatura).
- [ ] **7.2** `decisao.ts`: `export function conferirProcessoDoPdf(situacao: string): Recusa | null` (aceita `em_andamento` e `concluido`; comentário sem "não arquivado"). `acoes.ts`: tirar `arquivado_em` do tipo `ProcessoDoEnvio`, do `.select(...)` e da chamada (`conferirProcessoDoPdf(processo.situacao)`); `registrar.ts`: idem (linhas 23 e 29). `_shared/planilhasCenario.ts`: só o comentário/nome “Arquivado” do cenário pode ficar (é rótulo de dado de teste); se a coluna `arquivado_em` aparecer em algum fixture de `planilhas*.test.ts`, remover.
- [ ] **7.3** `npx vitest run supabase/functions` e `npx tsc --noEmit` verdes. A publicação nova da função no desenvolvimento **não** é feita por mim: fica registrada como pendência do usuário em `.scratch/proximo-passo.md`.

### Tarefa 8: Conferência final, remoto e entrega do ticket

- [ ] **8.1** `npm test` completo, `npx supabase test db` completo (contar `not ok` = 0), `npx eslint .`.
- [ ] **8.2** Um só commit (ou dois, banco e código, se o pre-commit deixar) com a mensagem `repositorio-de-processos 01: fim do Arquivado` mais a linha de co-autoria; sem `--no-verify`. `git push -u origin repositorio-de-processos` (autorizado, sem `--force`).
- [ ] **8.3** Disparar o workflow "Testes de banco" na branch e ler o resultado (`gh workflow run` e `gh run watch`/`gh run view`): ele aplica a migração nova dentro da transação de cada teste (ensaio automático de `scripts/migracoesPendentes.mjs`). Esperado: todos verdes. Se falhar, corrigir **antes** de aplicar.
- [ ] **8.4** Disparar o workflow "Migrar banco de desenvolvimento" na branch indicando a migração `fim_do_arquivado` (autorizado) e ler o resultado; depois `npm run db:types` contra o remoto **só se** o vínculo for o de desenvolvimento (conferir `supabase/AMBIENTES.md` e `supabase/.temp/project-ref`); se o arquivo gerado difere do da Tarefa 4.4, usar o do remoto e comitar. Registrar a migração em `supabase/AMBIENTES.md` na lista de migrações do desenvolvimento, no formato das anteriores (data, ticket, testes, workflow).
- [ ] **8.5** Seguir o `/executar-complexo`: juntar à `main` (`git switch main`, merge, `git branch -d repositorio-de-processos`), acrescentar `Concluído em AAAA-MM-DD (commit <hash>)` ao fim do ticket 01, atualizar `.scratch/proximo-passo.md` (próximo: ticket 02, Sonnet; pendência do usuário: publicar `arquivos-no-drive` de novo no desenvolvimento), comitar e enviar a `main`.

## Auto-revisão contra o ticket

- Migração (copia, travas, view, apaga coluna, gatilho da coluna nova, eventos antigos ficam) → Tarefa 3; ensaio da cópia → 3.8.
- Tela (sem Arquivar/Desarquivar/selo/filtro/frases; concluído editável; endereço antigo ignorado) → Tarefa 6.
- Edge Function e teste puro → Tarefa 7; publicação no desenvolvimento = pendência do usuário.
- pgTAP por célula (cinco tipos de usuário, 29/31 dias, update direto recusado, sem evento) → Tarefa 2; testes antigos 39…65 → Tarefa 4.
- Tipos regenerados → 4.4 e 8.4. `npm test` verde → 6.6 e 8.1.
- Histórico antigo legível → 5.4 (rótulos de `arquivar`/`desarquivar` mantidos).
- Efeito intermediário aceito: com `no_quadro` filtrando o Quadro, o concluído com mais de 30 dias sai de todas as colunas do Quadro já neste ticket; os tickets 02 (Quadro por setor mostra concluídos sempre) e 03 (botão, aviso, pé) completam o desenho.
