# Ticket 02 de revisoes-aprovacao (Revisão interna na janela de concluir) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a janela de concluir a Revisão interna pede o resultado ("Sem alteração" ou "Corrigida", com escopo e comentário), grava a revisão e a conclusão juntas, impede o autor da versão revisada de concluir e mostra as revisões na gaveta da etapa e no histórico do processo.

**Architecture:** uma migração não destrutiva cria os tipos, a tabela `revisoes_internas` (RLS, privilégios de coluna, gatilhos, evento), a função `concluir_revisao_interna` e estende o gatilho de conclusão do ticket 01. A interface ganha um módulo próprio `src/revisoes/` (interface, implementação real e falsa nomeada, frases e funções puras), o bloco do Resultado na `JanelaDeAvanco` e a lista de revisões na gaveta da `DetalheDaEtapa`.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/revisoes-aprovacao/spec.md` (histórias 1 a 10, 24, 25, 27 a 31 para a revisão; "Decisões de implementação", "Modelo de dados › revisoes_internas", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/revisoes-aprovacao/issues/02-revisao-interna-no-concluir.md` (critérios citados como "critério N", na ordem do ticket) · ADRs 0014 e 0015 · plano do ticket 01 (`plano-01.md`) e `desvios.md`.

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; tabela nasce com RLS e políticas na mesma migração, com um teste por célula de "quem pode o quê"; função sem `security definer` (a RLS de quem chama decide), exceto a que grava o evento, que é `security definer` em `private` com `search_path` vazio; execução tirada de `public` e `anon` e dada a `authenticated`; nada calculado é guardado; `10_privilegios_padrao`, `00_rls_ligada` e `01_buckets_privados` continuam passando; nenhuma Edge Function, nenhum Storage. Conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes do `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Não há `gh`: os workflows se disparam pelo navegador do app (skill `anthropic-skills:built-in-browser`). Produção e `migration repair` só pelo `/ship`. A trava de git barra algumas formas combinadas: um comando por vez.
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso`, `ProcessosFalso`, `CatalogoFalso`, `VersoesFalso` e a nova `RevisoesFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos. Dados de teste inventados. Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Frases literais da spec: "Sem alteração: segue a V7", "Corrigida: a V8, enviada por você, corrige a V7", "Quem enviou a versão V7 não pode revisá-la.", "Nenhuma revisão registrada.", "Carregando…", "Corrigida, gerou a V8". O erro de leitura é o de `ErroAoCarregar`: "Não foi possível carregar as revisões. Verifique a conexão e tente de novo." com [Tentar de novo].

## Decisões de execução (tomadas aqui, sem mudar a spec; registrar no `desvios.md`)

- **A edição da revisão fica toda no ticket 04** (privilégio e política de `update`, gatilhos de alterar, evento "editar"). Aqui `revisoes_internas` só tem `select` e `insert` (colunas `processo_id`, `resultado`, `escopo`, `comentario`); alterar e apagar são recusados por falta de privilégio (42501), e o teste prova as duas recusas. As células "alterar sim" da tabela de perfis são provadas no ticket 04.
- **"Versão anterior" da "Corrigida" = a não histórica de número imediatamente menor que a mais recente**, na mesma linha da decisão do ticket 01 (mais recente = não histórica de maior número). Processo cuja única anterior é histórica fica "sem versão anterior".
- **Códigos das recusas (P0001):** `revisor_e_autor:<número>`, `corrigida_sem_versao_do_revisor`, `corrigida_sem_versao_anterior`, `escopo_obrigatorio`, `escopo_so_na_corrigida`, `revisao_fora_da_etapa`, `sem_revisao_da_versao:<número>`, `processo_com_revisoes:<n>`; `sem_versao` e `processo_parado:<situação>` já existem.
- **Frases** (módulo `src/revisoes/frasesDeRevisao.ts`): `Quem enviou a versão V7 não pode revisá-la.` · `Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.` · `Não há versão anterior para corrigir.` · `Escolha o escopo da correção.` · `O escopo só vale na revisão corrigida.` · `A revisão só pode ser registrada com a Revisão interna em andamento.` · `A V8 ainda não tem revisão registrada. Conclua a Revisão interna pela janela de concluir.` · `Não é possível excluir: processo tem 1 revisão registrada. Cancele o processo em vez de excluí-lo.`
- **O gatilho de inclusão confere o perfil primeiro** (`private.pode_alterar_cadastros()`, recusa `42501`), para a recusa de Consulta e inativo ser sempre a de perfil e não uma frase de regra (um inativo não lê andamentos pela RLS).
- **`concluir_revisao_interna` só aceita o andamento da etapa `revisao_interna`** (outro código ou andamento inexistente: `registro_inexistente`), para a revisão não ser gravada junto da conclusão de outra etapa.
- **A falsa `RevisoesFalso` conclui a etapa na `ProcessosFalso`** (ela recebe a falsa de processos e o usuário da tela no construtor), como a função do banco faz numa gravação só; a trava de `ProcessosFalso.concluirEtapa` direto na `revisao_interna` **não** é imitada (nenhum caminho da tela a usa mais): a prova do "direto recusado" é do teste de banco. Registrar.
- **`UltimaVersao.anterior?: { numero: number; autorId: string }`** (opcional: fixtures sem ela valem "sem anterior"), lida junto com a mais recente, para a janela montar "a V8, enviada por você, corrige a V7".
- **O bloco do Resultado vive em `JanelaDeAvanco` por prop (`revisao`)**, não genérico: o ticket 03 acrescenta o da Aprovação e só então se generaliza (segunda repetição real).
- **Sem etapa pendente depois da Revisão interna não ocorre:** a Revisão pelo setor é obrigatória e protegida (ticket 01), então o [Concluir] da Revisão interna sempre abre a janela de avanço.
- **Eventos:** entidade `revisao_interna`, ação `registrar`, referência = id do processo (o histórico do processo lê por `like 'id%'`), com `antes` nulo e `depois` = estado (versão revisada e corrigida como "V7"/"V8", resultado, escopo, comentário, revisor, data).

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/39_revisao_interna.test.sql` (novo) | pgTAP: perfis, regras, conclusão, eventos |
| `supabase/migrations/<data>_revisao_interna.sql` (novo) | tipos, tabela, gatilhos, função, evento, conclusão |
| `supabase/tests/19_*`, `35_*`, `36_*` (e os que o CI apontar) | testes antigos que concluem a etapa 3 passam a montar a revisão |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `src/revisoes/tipos.ts` (novo) | `ModuloDeRevisoes`, `RevisaoInterna`, `DadosDaRevisao` |
| `src/revisoes/frasesDeRevisao.ts` (+ teste) | frases das recusas e do histórico |
| `src/revisoes/opcoesDaRevisao.ts` (+ teste) | opções que cabem e prévia das versões |
| `src/revisoes/revisoesSupabase.ts` (+ teste) | módulo real |
| `src/revisoes/RevisoesFalso.ts` (+ teste) | módulo falso nomeado |
| `src/processos/tipos.ts` · `lerProcessoSupabase.ts` | `UltimaVersao.anterior` |
| `src/processos/andamentosSupabase.ts` | códigos de recusa novos |
| `src/processos/gravarAcoes.ts` · `src/hooks/useAcoesDaEtapa.ts` · `useConclusaoPeloQuadro.ts` | a conclusão da Revisão interna vai por `revisoes` |
| `src/components/processos/BlocoDaRevisao.tsx` (novo) · `JanelaDeAvanco.tsx` · `JanelasDaEtapa.tsx` | o Resultado na janela |
| `src/components/processos/RevisoesDaEtapa.tsx` (novo) · `DetalheDaEtapa.tsx` | as revisões na gaveta |
| `src/cadastros/historicoDosCadastros.ts` · `src/processos/lerProcessoSupabase.ts` | eventos no histórico |
| `src/App.tsx`, `main.tsx`, `AreaDeProcessos.tsx`, `VisaoDosProcessos.tsx`, `QuadroDeProcessos.tsx`, `VersoDoCartao.tsx`, `CaminhoDoProcesso.tsx`, `src/testes/*`, testes `App.*.test.tsx` | a prop `revisoes` |
| `src/App.revisaoInterna.test.tsx` (novo) | tela inteira |

---

### Task 1: Banco: revisões internas (critério 1)

**Files:**
- Create: `supabase/tests/39_revisao_interna.test.sql`, `supabase/migrations/<data>_revisao_interna.sql`
- Modify: testes antigos que concluem a Revisão interna por `concluida` (19, 35, 36 e os que o CI apontar), `supabase/AMBIENTES.md`, `src/types/database.ts` (regenerado)

**Interfaces:**
- Consumes (ticket 01): `private.id_da_versao_mais_recente(uuid)`, `private.conferir_conclusao_da_etapa()`, `private.conferir_versao_completa(uuid)`; (existentes) `private.pode_alterar_cadastros()`, `private.usuario_ativo()`, `private.conferir_processo_em_andamento(uuid)`, `public.avancar_etapa(uuid, text, text, uuid)`.
- Produces: tipos `public.resultado_da_revisao` (`sem_alteracao`, `corrigida`) e `public.escopo_da_correcao` (`fluxograma`, `relatorio`, `ambos`); tabela `public.revisoes_internas`; `private.id_da_versao_anterior(p_processo uuid) returns uuid`; `public.concluir_revisao_interna(p_andamento uuid, p_resultado public.resultado_da_revisao, p_escopo public.escopo_da_correcao, p_comentario text, p_responsavel uuid) returns void`; recusas listadas nas decisões.

- [x] **Step 0: Conferir o alvo e ler `.claude/regras/banco.md`** (lido nesta sessão). `supabase/AMBIENTES.md` "vínculo atual" = `yclkzyoebpsxmgpbcbus` (dev). Árvore sem mudança real (o `database.ts` só difere por fim de linha).

- [x] **Step 1: Criar a branch e o marco.** `git switch -c revisoes-aprovacao-02`; `git tag marco/2026-10-19-inicio-ticket-02-revisoes-aprovacao`; `git push origin "refs/tags/marco/*:refs/tags/marco/*"` (marcos vão ao GitHub sem pedir aprovação).

- [x] **Step 2: Escrever o teste que falha** `supabase/tests/39_revisao_interna.test.sql`. Cabeçalho (transação, `_tap`, usuários a1 administrador / a2 integrante / a3 consulta / a4 inativo, setor `...0039`, macro `...0039`) e auxiliares `andamento`, `agir`, `status`, `processo`, `arquivo`, `par`, `enviar` iguais aos de `38_etapas_protegidas_e_revisao_do_setor.test.sql` (sufixo `T39`). Processos: `array['Sem Alteracao','Corrigida','Autor Unico','Autor Duplo','Assumiu','Sem Versao','Escopo','Parado','Etapa Pendente','Direta','Nova Versao','Atomica','Perfis','Pai','Filho']` (o `Filho` é inserido à parte, como subprocesso do `Pai`, no estilo do teste 21). Auxiliares novos:

```sql
create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Leva o processo até a Revisão interna em andamento (as etapas 1 e 2 resolvidas, como a2).
create function pg_temp.ate_a_revisao_interna(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_revisao_interna(text) to authenticated;

-- A chamada da tela: a revisão e a conclusão numa função só.
create function pg_temp.revisar(nome_do_processo text, resultado public.resultado_da_revisao,
  escopo public.escopo_da_correcao default null, responsavel uuid default null, comentario text default null) returns void
language sql as $$
  select public.concluir_revisao_interna(pg_temp.andamento(nome_do_processo, 'revisao_interna'), resultado, escopo, comentario, responsavel) $$;
grant execute on function pg_temp.revisar(text, public.resultado_da_revisao, public.escopo_da_correcao, uuid, text) to authenticated;
```

Corpo do teste (cada bloco começa com `pg_temp.claims('a2')` e `set local role authenticated`; ajustar o `plan(N)` ao número real, o `finish()` acusa a diferença). Cada `throws_ok` usa `'P0001'` e a mensagem exata:

1. **Sem alteração (Sem Alteracao):** a1 envia V1; a2 `ate_a_revisao_interna`; `lives_ok` `revisar('Sem Alteracao','sem_alteracao', null, a1, '  Segue  ')`. Provar: revisão com `resultado='sem_alteracao'`, `versao_revisada_id` = a V1, `versao_corrigida_id` nulo, `escopo` nulo, `comentario='Segue'` (aparado), `revisor_id` = a2, `revisada_em = current_date`; a etapa 3 `concluida`; a etapa 4 `em_andamento` com responsável a1; um evento (`entidade='revisao_interna'`, `acao='registrar'`, `entidade_ref = processo::text`, `detalhes->'depois'->>'resultado' = 'sem_alteracao'`, `detalhes->'antes'` nulo).
2. **Corrigida (Corrigida):** a1 envia V1, a2 envia V2; `ate_a_revisao_interna`; `revisar('Corrigida','corrigida','ambos', null, null)` aceito: `versao_revisada_id` = V1, `versao_corrigida_id` = V2, `escopo='ambos'`, `comentario` nulo (vazio vira nulo), conclusão feita.
3. **Autor (Autor Unico):** a2 envia V1; `ate_a_revisao_interna`. `revisar(..., 'sem_alteracao')` → `revisor_e_autor:1`; `revisar(..., 'corrigida', 'fluxograma')` → `corrigida_sem_versao_anterior`; a etapa segue `em_andamento` e a contagem de revisões do processo é 0.
4. **Autor Duplo:** a2 envia V1 e V2; `revisar(..., 'corrigida','relatorio')` → `revisor_e_autor:1` (a anterior também é dele); `revisar(..., 'sem_alteracao')` → `revisor_e_autor:2`.
5. **Assumiu:** a2 `ate_a_revisao_interna`, assume a etapa (`update andamentos set responsavel_id = a2`), depois envia V1; `revisar(..., 'sem_alteracao')` → `revisor_e_autor:1` (quem assumiu e depois enviou não conclui).
6. **Sem Versao:** `revisar(..., 'sem_alteracao')` → `sem_versao`; `avancar_etapa(... 'concluir')` direto → `sem_versao`.
7. **Escopo:** a1 envia V1, a2 envia V2; `revisar(..., 'sem_alteracao', 'ambos')` → `escopo_so_na_corrigida`; `revisar(..., 'corrigida', null)` → `escopo_obrigatorio`; `a1` (autor da V1, não da V2) tenta `corrigida` com `fluxograma` → `corrigida_sem_versao_do_revisor`.
8. **Parado / Etapa Pendente:** o processo `Parado` suspenso (`suspender_processo`) → `revisar` → `processo_parado:suspenso`. `Etapa Pendente` (a Revisão interna ainda pendente, só as etapas 1 e 2 resolvidas): `insert into public.revisoes_internas (processo_id, resultado) values (..., 'sem_alteracao')` → `revisao_fora_da_etapa`.
9. **Direta:** a1 envia V1, `ate_a_revisao_interna`; `agir('Direta','revisao_interna','concluida')` → `sem_revisao_da_versao:1`; `avancar_etapa(..., 'concluir', null, null)` → `sem_revisao_da_versao:1`.
10. **Nova Versao:** a1 envia V1; a2 `ate_a_revisao_interna` e `revisar(... 'sem_alteracao')` (aceito, a etapa 4 em andamento); `voltar_a_etapa(andamento da revisao_interna, 'Ajustar', null)`; a1 envia V2; `agir(..., 'concluida')` direto → `sem_revisao_da_versao:2`; `revisar(... 'sem_alteracao')` aceito; contagem de revisões do processo = 2, com as versões revisadas V1 e V2.
11. **Atômica:** a1 envia V1; a2 `ate_a_revisao_interna`; `revisar(... 'sem_alteracao', null, a4)` (a4 inativo) → `throws_ok` com `'P0001'` e `null` na mensagem; contagem de revisões do processo = 0 e a etapa 3 `em_andamento`.
12. **Nada se altera nem se apaga:** `update public.revisoes_internas set comentario = 'x'` → `42501`; `delete from public.revisoes_internas` → `42501` (a1 e a2). A inclusão direta de `versao_revisada_id` → `42501` (coluna sem privilégio).
13. **Perfis (Perfis):** a1 envia V1, a2 `ate_a_revisao_interna`. Como **a3 (consulta)**: `revisar` → `throws_ok` `42501`; ler `revisoes_internas` e os eventos `revisao_interna` (já gravados pelos casos 1 a 11): `count > 0`. Como **a4 (inativo)**: `revisar` → `42501`; `count(*)` de `revisoes_internas` e dos eventos = 0. Como **a1 (administrador)**: `revisar('Perfis','sem_alteracao')` aceito. Como **visitante** (`set local role anon`, claims vazias): `select count(*) from public.revisoes_internas` → `42501`; `select public.concluir_revisao_interna(...)` → `42501`; `select count(*) from public.eventos` → `42501`. Como a2 (integrante): `insert into public.eventos (acao, entidade, entidade_ref) values ('registrar','revisao_interna','x')` → `42501`.
14. **Excluir processo com revisão:** como a2, `delete from public.processos where nome = 'Sem Alteracao'` → `processo_com_revisoes:1` (esta recusa vem antes da de versões).
15. **Subprocesso:** como `38`/`21`, `Pai` (tipo processo) e `Filho` (`'subprocesso'`, `processo_pai_id` = Pai) em andamento; a1 envia V1 no Filho; a2 `ate_a_revisao_interna('Filho')` e `revisar('Filho','sem_alteracao')` aceito; depois `public.reclassificar_processo(Filho, 'processo', null, 'Virou processo')` e a revisão continua com o mesmo `processo_id` (contagem = 1).
16. **Estrutura:** `reset role`; `pg_trigger` com `conferir_conclusao_da_etapa` ainda em `andamentos` (1); `preparar_revisao_interna` em `revisoes_internas` (1); `conferir_processo_sem_revisoes` em `processos` (1); a função de conclusão do ticket 01 continua recusando a `revisao_setor` sem versão completa (reaproveita o caso: `Direta`/`Sem Alteracao` na etapa 4 com a V1 sem relatório → `versao_incompleta:1:relatorio`).

Fechar com `select * from finish();` e o `do $$ raise exception ... $$` do relatório, como o 38.

- [x] **Step 3: Rodar para ver falhar.** `git add supabase/tests/39_revisao_interna.test.sql`; commit "Ticket 02 de revisoes-aprovacao: teste de banco da Revisão interna"; `git push -u origin revisoes-aprovacao-02`; disparar "Testes de banco" na branch e ler o resultado. Esperado: o 39 falha (tipo e tabela inexistentes); os outros 38 arquivos verdes.

- [x] **Step 4: Escrever a migração.** `npx supabase migration new revisao_interna`, com:

```sql
-- Revisão interna na janela de concluir (revisoes-aprovacao, ticket 02; ADRs 0014 e 0015). Não destrutiva: tipos,
-- tabela, funções e gatilhos novos; o gatilho de conclusão do ticket 01 ganha a Revisão interna. As recusas chegam à
-- interface como "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts). A edição fica no ticket 04: aqui a
-- tabela só tem leitura e inclusão (nada se altera nem se apaga). Reaproveita private.pode_alterar_cadastros(),
-- private.usuario_ativo(), private.conferir_processo_em_andamento() e private.id_da_versao_mais_recente().

create type public.resultado_da_revisao as enum ('sem_alteracao', 'corrigida');
create type public.escopo_da_correcao as enum ('fluxograma', 'relatorio', 'ambos');

create table public.revisoes_internas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete restrict,
  versao_revisada_id uuid not null references public.versoes (id) on delete restrict,
  versao_corrigida_id uuid references public.versoes (id) on delete restrict,
  resultado public.resultado_da_revisao not null,
  escopo public.escopo_da_correcao,
  comentario text constraint revisoes_comentario_tamanho check (char_length(comentario) <= 2000),
  revisada_em date not null,
  revisor_id uuid not null references public.usuarios (id) on delete restrict,
  registrada_em timestamptz not null default now(),
  constraint revisoes_corrigida_completa check (
    (resultado = 'corrigida' and escopo is not null and versao_corrigida_id is not null)
    or (resultado = 'sem_alteracao' and escopo is null and versao_corrigida_id is null))
);
create index revisoes_internas_processo on public.revisoes_internas (processo_id, registrada_em desc);

alter table public.revisoes_internas enable row level security;
revoke all on public.revisoes_internas from anon, authenticated;
grant select on public.revisoes_internas to authenticated;
grant insert (processo_id, resultado, escopo, comentario) on public.revisoes_internas to authenticated;

create policy "revisoes_internas: ativo lê" on public.revisoes_internas
  for select to authenticated using ((select private.usuario_ativo()));
create policy "revisoes_internas: administrador e integrante ativos criam" on public.revisoes_internas
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

-- A versão não histórica de número imediatamente menor que a mais recente; null sem anterior.
create function private.id_da_versao_anterior(p_processo uuid) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = p_processo and not historica
    and numero < (select numero from public.versoes where id = private.id_da_versao_mais_recente(p_processo))
  order by numero desc limit 1 $$;

-- Quem enviou a versão (para a trava do revisor).
create function private.autor_da_versao(p_versao uuid) returns uuid
language sql stable set search_path = ''
as $$ select enviada_por from public.versoes where id = p_versao $$;

-- A Revisão interna do processo tem de estar em andamento.
create function private.conferir_revisao_interna_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p_processo and e.codigo = 'revisao_interna' and a.status = 'em_andamento') then
    raise exception 'revisao_fora_da_etapa';
  end if;
end $$;

-- "Sem alteração": a revisada é a mais recente e não é de quem revisa; sem escopo.
create function private.preparar_sem_alteracao(nova public.revisoes_internas, revisor uuid) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(nova.processo_id);
begin
  if nova.escopo is not null then
    raise exception 'escopo_so_na_corrigida';
  end if;
  if private.autor_da_versao(ultima) = revisor then
    raise exception 'revisor_e_autor:%', (select numero from public.versoes where id = ultima);
  end if;
  nova.versao_revisada_id := ultima;
  nova.versao_corrigida_id := null;
  return nova;
end $$;

-- "Corrigida": a mais recente é do revisor (a correção) e a anterior, de outra pessoa (a revisada); escopo obrigatório.
create function private.preparar_corrigida(nova public.revisoes_internas, revisor uuid) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(nova.processo_id);
  anterior uuid := private.id_da_versao_anterior(nova.processo_id);
begin
  if nova.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  if private.autor_da_versao(ultima) <> revisor then
    raise exception 'corrigida_sem_versao_do_revisor';
  end if;
  if anterior is null then
    raise exception 'corrigida_sem_versao_anterior';
  end if;
  if private.autor_da_versao(anterior) = revisor then
    raise exception 'revisor_e_autor:%', (select numero from public.versoes where id = anterior);
  end if;
  nova.versao_revisada_id := anterior;
  nova.versao_corrigida_id := ultima;
  return nova;
end $$;

-- Antes de incluir: perfil, processo e etapa em andamento, versão e regras do revisor; revisor, data e versões
-- preenchidos pelo banco (o que vier é ignorado); comentário aparado, vazio vira nulo.
create function private.preparar_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  perform private.conferir_revisao_interna_em_andamento(new.processo_id);
  if private.id_da_versao_mais_recente(new.processo_id) is null then
    raise exception 'sem_versao';
  end if;
  new.revisor_id := (select auth.uid());
  new.revisada_em := current_date;
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado = 'corrigida' then
    new := private.preparar_corrigida(new, new.revisor_id);
  else
    new := private.preparar_sem_alteracao(new, new.revisor_id);
  end if;
  return new;
end $$;

create trigger preparar_revisao_interna before insert on public.revisoes_internas
  for each row execute function private.preparar_revisao_interna();

-- A revisão como o evento a guarda: processo, versões como "V7", resultado, escopo, comentário, revisor e data.
create function private.estado_da_revisao(p_revisao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla,
    'versao_revisada', 'V' || vr.numero, 'versao_corrigida', 'V' || vc.numero, 'resultado', r.resultado,
    'escopo', r.escopo, 'comentario', r.comentario, 'revisor_nome', u.nome, 'revisada_em', r.revisada_em)
  from public.revisoes_internas r
  join public.processos p on p.id = r.processo_id
  join public.setores s on s.id = p.setor_id
  join public.versoes vr on vr.id = r.versao_revisada_id
  left join public.versoes vc on vc.id = r.versao_corrigida_id
  join public.usuarios u on u.id = r.revisor_id
  where r.id = p_revisao $$;

-- Um evento por revisão registrada; a referência é o id do processo (o histórico do processo lê por ela).
create function private.registrar_evento_da_revisao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'registrar', 'revisao_interna', new.processo_id::text,
    jsonb_build_object('antes', null, 'depois', private.estado_da_revisao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_revisao after insert on public.revisoes_internas
  for each row execute function private.registrar_evento_da_revisao();

-- Todo perfil ativo lê os eventos de revisão (políticas de leitura somam).
create policy "eventos: perfil ativo lê as revisões internas" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'revisao_interna');

-- Processo com revisão não se exclui, e a recusa traz a contagem. O nome vem antes de conferir_processo_sem_versoes.
create function private.conferir_processo_sem_revisoes() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.revisoes_internas where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_revisoes:%', total;
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_revisoes before delete on public.processos
  for each row execute function private.conferir_processo_sem_revisoes();

-- Concluir a Revisão interna exige revisão que cubra a versão mais recente: a revisada (sem alteração) ou a corrigida.
create function private.conferir_revisao_da_versao(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(p_processo);
begin
  if ultima is null then
    raise exception 'sem_versao';
  end if;
  if not exists (select 1 from public.revisoes_internas r
    where r.processo_id = p_processo and coalesce(r.versao_corrigida_id, r.versao_revisada_id) = ultima) then
    raise exception 'sem_revisao_da_versao:%', (select numero from public.versoes where id = ultima);
  end if;
end $$;

-- O gatilho de conclusão do ticket 01, com a Revisão interna. Tickets seguintes acrescentam a Aprovação pelo setor.
create or replace function private.conferir_conclusao_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
declare
  codigo_da_etapa text := (select codigo from public.etapas where id = new.etapa_id);
begin
  if new.status <> 'concluida' or old.status = 'concluida' then
    return new;
  end if;
  if codigo_da_etapa = 'revisao_interna' then
    perform private.conferir_revisao_da_versao(new.processo_id);
  elsif codigo_da_etapa = 'revisao_setor' then
    perform private.conferir_versao_completa(new.processo_id);
  end if;
  return new;
end $$;

-- Grava a revisão e conclui a etapa numa transação só: se a conclusão falha, a revisão não fica. Sem security
-- definer: a RLS de quem chama decide. Outro andamento que não o da Revisão interna é registro inexistente.
create function public.concluir_revisao_interna(p_andamento uuid, p_resultado public.resultado_da_revisao,
  p_escopo public.escopo_da_correcao, p_comentario text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  select a.processo_id into processo from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.id = p_andamento and e.codigo = 'revisao_interna';
  if not found then
    raise exception 'registro_inexistente';
  end if;
  insert into public.revisoes_internas (processo_id, resultado, escopo, comentario)
  values (processo, p_resultado, p_escopo, p_comentario);
  perform public.avancar_etapa(p_andamento, 'concluir', null, p_responsavel);
end $$;

revoke execute on function public.concluir_revisao_interna(uuid, public.resultado_da_revisao, public.escopo_da_correcao, text, uuid),
  private.id_da_versao_anterior(uuid), private.autor_da_versao(uuid), private.conferir_revisao_interna_em_andamento(uuid),
  private.conferir_revisao_da_versao(uuid), private.conferir_conclusao_da_etapa()
  from public, anon;
grant execute on function public.concluir_revisao_interna(uuid, public.resultado_da_revisao, public.escopo_da_correcao, text, uuid),
  private.id_da_versao_anterior(uuid), private.autor_da_versao(uuid), private.conferir_revisao_interna_em_andamento(uuid),
  private.conferir_revisao_da_versao(uuid), private.conferir_conclusao_da_etapa()
  to authenticated;
-- Chamadas só pelos gatilhos (e pelas funções acima, que rodam com a permissão de quem grava).
revoke execute on function private.preparar_sem_alteracao(public.revisoes_internas, uuid),
  private.preparar_corrigida(public.revisoes_internas, uuid), private.preparar_revisao_interna(),
  private.estado_da_revisao(uuid), private.registrar_evento_da_revisao(), private.conferir_processo_sem_revisoes()
  from public, anon;
grant execute on function private.preparar_sem_alteracao(public.revisoes_internas, uuid),
  private.preparar_corrigida(public.revisoes_internas, uuid), private.preparar_revisao_interna(),
  private.conferir_processo_sem_revisoes() to authenticated;
```

Notas ao executar: (a) o `autor_da_versao` lê `versoes` com a permissão de quem grava (todo perfil ativo lê); (b) se o Postgres recusar `new := ...` com tipo composto, trocar por atribuição de campos (`new.versao_revisada_id := ...`) nas duas funções `preparar_*` (que passam a devolver as duas ids em vez do registro); (c) a ordem dos gatilhos de `processos` em exclusão é alfabética: `conferir_processo_sem_revisoes` < `conferir_processo_sem_versoes`; (d) manter cada função com um propósito (ESLint não lê SQL).

- [x] **Step 5: Aplicar e testar.** Commit da migração; `git push`; disparar "Migrar banco de desenvolvimento" na branch (informar a migração; o vínculo é o dev) e depois "Testes de banco". Esperado: o 39 verde; **falham** os testes antigos que concluem a Revisão interna por `concluida`/`avancar_etapa` sem versão e revisão (pelo menos o 19 — "Processo Volta" — e o 36 — "Volta Autor" —, e o 35, linha "concluir a 3 sem responsável"). Para cada um, acrescentar ao arquivo o auxiliar abaixo e trocar a conclusão direta pela montagem da revisão, mantendo a intenção do caso (status final, responsável, eventos):

```sql
-- Conclui a Revisão interna pelo caminho que o banco exige: a1 envia a versão e quem está nas claims revisa.
create function pg_temp.revisar_e_concluir(nome_do_processo text, responsavel uuid default null) returns void
language plpgsql as $$
declare
  claims text := current_setting('request.jwt.claims');
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  perform pg_temp.enviar(nome_do_processo);
  perform set_config('request.jwt.claims', claims, true);
  perform public.concluir_revisao_interna(pg_temp.andamento(nome_do_processo, 'revisao_interna'), 'sem_alteracao', null, null, responsavel);
end $$;
grant execute on function pg_temp.revisar_e_concluir(text, uuid) to authenticated;
```

(adaptar o nome do auxiliar `enviar` e o do processo a cada arquivo; onde quem conclui é a1, trocar o `sub` de quem envia para a2). Repetir o ciclo (commit, push, "Testes de banco") até os 39 arquivos ficarem verdes. Se o 39 falhar por montagem do próprio teste, corrigir o teste.

- [x] **Step 6: Tipos e registro.** `npm run db:types` (vínculo conferido; porta 443); `public.concluir_revisao_interna` e `public.revisoes_internas` entram em `src/types/database.ts`. Se o arquivo ficar modificado só por CRLF além das novidades, tudo bem: as novidades vão no commit. `git restore` fica bloqueado: guardar cópia antes de qualquer restauração. Acrescentar o registro em `supabase/AMBIENTES.md` (migração, teste 39 falhou antes e passou depois, números dos workflows, testes antigos ajustados) e comitar: "Ticket 02 de revisoes-aprovacao: migração da Revisão interna".

---

### Task 2: Frases, tipos e funções puras do módulo de revisões (critérios 2, 4 e 6)

**Files:**
- Create: `src/revisoes/tipos.ts`, `src/revisoes/frasesDeRevisao.ts`, `src/revisoes/frasesDeRevisao.test.ts`, `src/revisoes/opcoesDaRevisao.ts`, `src/revisoes/opcoesDaRevisao.test.ts`
- Modify: `src/processos/tipos.ts` (`UltimaVersao.anterior`), `src/processos/lerProcessoSupabase.ts`, `src/processos/lerProcessoSupabase.test.ts`, `src/processos/andamentosSupabase.ts`, `src/processos/andamentosSupabase.test.ts`

**Interfaces:**
- Produces (`tipos.ts`): `ResultadoDaRevisao = 'sem_alteracao' | 'corrigida'`; `EscopoDaCorrecao = 'fluxograma' | 'relatorio' | 'ambos'`; `DadosDaRevisao = { resultado: ResultadoDaRevisao; escopo: EscopoDaCorrecao | null; comentario: string | null }`; `RevisaoInterna = { id: string; versaoRevisada: number; versaoCorrigida: number | null; resultado: ResultadoDaRevisao; escopo: EscopoDaCorrecao | null; comentario: string | null; revisor: string | null; revisadaEm: string }` (data AAAA-MM-DD); `ModuloDeRevisoes = { listarRevisoes(processoId: string): Promise<RevisaoInterna[]>; concluirRevisaoInterna(andamentoId: string, dados: DadosDaRevisao, proximoResponsavelId: string | null): Promise<void> }` (listar: da mais recente para a mais antiga; recusas como `TravaDoBanco`).
- Produces (`opcoesDaRevisao.ts`): `OpcaoDaRevisao = { disponivel: boolean; previa: string; motivo: string | null }`; `OpcoesDaRevisao = { semAlteracao: OpcaoDaRevisao; corrigida: OpcaoDaRevisao; bloqueio: string | null }`; `opcoesDaRevisao(ultima: UltimaVersao | null, usuarioId: string): OpcoesDaRevisao`; `rotuloDoResultado(revisao: RevisaoInterna): string` ("Sem alteração" / "Corrigida, gerou a V8") e `ROTULO_DO_ESCOPO: Record<EscopoDaCorrecao, string>` ("Fluxograma", "Relatório", "Fluxograma e relatório") em `frasesDeRevisao.ts`.
- Produces (`UltimaVersao`): `anterior?: { numero: number; autorId: string }`.

- [x] **Step 1: Teste que falha** `src/revisoes/opcoesDaRevisao.test.ts` (use `ultima = { numero: 7, autorId: 'ana', autorNome: 'Ana', papeis: [...], anterior: { numero: 6, autorId: 'ana' } }` e o `usuarioId` variando):
  1. sem versão (`null`): as duas indisponíveis e `bloqueio` = `FRASE_SEM_VERSAO`;
  2. revisor que não é o autor: `semAlteracao` disponível, `previa` "segue a V7"; `corrigida` indisponível com o motivo "Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos."; `bloqueio` nulo;
  3. o revisor é o autor da V8 e a V7 é de outra pessoa (`ultima = {numero: 8, autorId: 'eu', anterior: {numero: 7, autorId: 'ana'}}`): `semAlteracao` indisponível com "Quem enviou a versão V8 não pode revisá-la."; `corrigida` disponível, `previa` "a V8, enviada por você, corrige a V7"; `bloqueio` nulo;
  4. o revisor é o autor das duas: nenhuma cabe, `bloqueio` = "Quem enviou a versão V8 não pode revisá-la." e o motivo da corrigida é "Quem enviou a versão V7 não pode revisá-la.";
  5. o revisor é o autor da única versão: nenhuma cabe, `bloqueio` = "Quem enviou a versão V1 não pode revisá-la." e o motivo da corrigida "Não há versão anterior para corrigir.".
  Rodar `npx vitest run src/revisoes/opcoesDaRevisao.test.ts` → FALHA.

- [x] **Step 2: Implementar** `tipos.ts` (acima) e `opcoesDaRevisao.ts`:

```ts
import { FRASE_SEM_VERSAO } from '../processos/frasesDaVersaoCompleta'
import type { UltimaVersao } from '../processos/tipos'
import { fraseDoRevisorQueEAutor } from './frasesDeRevisao'

export type OpcaoDaRevisao = { disponivel: boolean; previa: string; motivo: string | null }
export type OpcoesDaRevisao = { semAlteracao: OpcaoDaRevisao; corrigida: OpcaoDaRevisao; bloqueio: string | null }

const INDISPONIVEL = (motivo: string): OpcaoDaRevisao => ({ disponivel: false, previa: '', motivo })

function corrigidaDoAutor(ultima: UltimaVersao, usuarioId: string): OpcaoDaRevisao {
  const anterior = ultima.anterior
  if (!anterior) return INDISPONIVEL('Não há versão anterior para corrigir.')
  if (anterior.autorId === usuarioId) return INDISPONIVEL(fraseDoRevisorQueEAutor(anterior.numero))
  return { disponivel: true, previa: `a V${ultima.numero}, enviada por você, corrige a V${anterior.numero}`, motivo: null }
}

/** O que a janela de concluir a Revisão interna oferece: as duas opções com a prévia ou o motivo, e a frase quando nenhuma cabe. */
export function opcoesDaRevisao(ultima: UltimaVersao | null, usuarioId: string): OpcoesDaRevisao {
  if (ultima === null) {
    const sem = INDISPONIVEL(FRASE_SEM_VERSAO)
    return { semAlteracao: sem, corrigida: sem, bloqueio: FRASE_SEM_VERSAO }
  }
  if (ultima.autorId !== usuarioId) {
    return {
      semAlteracao: { disponivel: true, previa: `segue a V${ultima.numero}`, motivo: null },
      corrigida: INDISPONIVEL('Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.'),
      bloqueio: null,
    }
  }
  const corrigida = corrigidaDoAutor(ultima, usuarioId)
  const frase = fraseDoRevisorQueEAutor(ultima.numero)
  return { semAlteracao: INDISPONIVEL(frase), corrigida, bloqueio: corrigida.disponivel ? null : frase }
}
```

Rodar → PASSA.

- [x] **Step 3: Frases** — teste primeiro em `frasesDeRevisao.test.ts` (cada frase com o valor recebido; `rotuloDoResultado` "Sem alteração" e "Corrigida, gerou a V8"; `ROTULO_DO_ESCOPO`), depois `frasesDeRevisao.ts` com `fraseDoRevisorQueEAutor(numero: number | string)` ("Quem enviou a versão V7 não pode revisá-la."), `FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR`, `FRASE_DA_CORRIGIDA_SEM_ANTERIOR`, `FRASE_DO_ESCOPO_OBRIGATORIO`, `FRASE_DO_ESCOPO_SO_NA_CORRIGIDA`, `FRASE_DA_REVISAO_FORA_DA_ETAPA`, `fraseDaVersaoSemRevisao(numero)`, `fraseDoProcessoComRevisoes(total)` (as frases da seção "Decisões"), `rotuloDoResultado(revisao)` e `ROTULO_DO_ESCOPO`. Rodar → PASSA.

- [x] **Step 4: Códigos de recusa.** Teste primeiro em `andamentosSupabase.test.ts` (seguir os casos de `autor_da_versao`): `concluirEtapa` e `excluir` com erro P0001 de cada código novo rejeitam com `TravaDoBanco` da frase. Implementar: incluir `revisor_e_autor|corrigida_sem_versao_do_revisor|corrigida_sem_versao_anterior|escopo_obrigatorio|escopo_so_na_corrigida|revisao_fora_da_etapa|sem_revisao_da_versao|processo_com_revisoes` no `PADRAO_DA_RECUSA` e uma entrada em `FRASE_DA_RECUSA` por código (`revisor_e_autor: fraseDoRevisorQueEAutor`, `sem_revisao_da_versao: fraseDaVersaoSemRevisao`, `processo_com_revisoes: fraseDoProcessoComRevisoes`, os outros `() => FRASE_...`). Rodar → PASSA. O módulo de revisões reaproveita `falhaDoAndamento` (mesmo formato de recusa).

- [x] **Step 5: `UltimaVersao.anterior`.** Em `tipos.ts` de processos: `export type UltimaVersao = { numero: number; autorId: string; autorNome: string; papeis: PapelDoArquivo[]; anterior?: { numero: number; autorId: string } }` e acrescentar ao comentário "e a anterior (número e autor), que a Revisão interna 'corrigida' corrige". Teste primeiro em `lerProcessoSupabase.test.ts` (seguir o caso de `ultimaVersao.papeis`): o cliente simulado devolve duas linhas (V8 e V7) e o esperado traz `anterior: { numero: 7, autorId }`; com uma linha só, `anterior` ausente. Implementar em `lerUltimaVersao`: `.limit(2)`, `const [ultima, anterior] = ...`, `anterior: anterior ? { numero: anterior.numero, autorId: anterior.enviada_por } : undefined` (o objeto sem a chave quando não há). Rodar `npx tsc -b`, os testes do arquivo → PASSAM.

- [x] **Step 6: Comitar** "Ticket 02 de revisoes-aprovacao: frases, tipos e opções do resultado da revisão".

---

### Task 3: Módulo de revisões real e falso, e a prop `revisoes` (critérios 6 e 3, parte)

**Files:**
- Create: `src/revisoes/revisoesSupabase.ts`, `src/revisoes/revisoesSupabase.test.ts`, `src/revisoes/RevisoesFalso.ts`, `src/revisoes/RevisoesFalso.test.ts`
- Modify: `src/main.tsx`, `src/App.tsx`, `src/components/processos/AreaDeProcessos.tsx`, `VisaoDosProcessos.tsx`, `QuadroDeProcessos.tsx`, `VersoDoCartao.tsx`, `CaminhoDoProcesso.tsx`, `src/testes/*.tsx` (4 helpers) e os `App.*.test.tsx` que montam `<App ...>`

**Interfaces:**
- Consumes: `ModuloDeRevisoes`, `falhaDoAndamento`, `RecusasDoModulo` (de `../acesso/falhasDeGravacao`, a mesma que `processosSupabase.ts` passa), `ProcessosFalso`, `opcoesDaRevisao`.
- Produces: `criarRevisoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDeRevisoes`; `class RevisoesFalso implements ModuloDeRevisoes` com `constructor(processos?: ProcessosFalso, usuario?: UsuarioResponsavel)`, campos `revisoes: Record<string, RevisaoInterna[]>` (por processo), `falharLeitura`, `segurarLeitura`, `falhaNaGravacao: string | Error | null`, `conclusoes: { andamentoId: string; dados: DadosDaRevisao; responsavelId: string | null }[]`; prop `revisoes: ModuloDeRevisoes` em `App` e nos componentes até `CaminhoDoProcesso` e `QuadroDeProcessos`.

- [x] **Step 1: Teste do módulo real que falha** `revisoesSupabase.test.ts`, com o cliente simulado de `src/testes/ClienteSupabaseFalso.ts` (seguir `versoesSupabase.test.ts` e `andamentosSupabase.test.ts`):
  1. `listarRevisoes('p1')` consulta `revisoes_internas` com `processo_id = p1`, ordem `registrada_em` decrescente, juntando o revisor (`revisor:usuarios(nome)`) e as versões (`revisada:versoes!versao_revisada_id(numero)`, `corrigida:versoes!versao_corrigida_id(numero)`), e traduz a linha em `RevisaoInterna` (`versaoRevisada` 7, `versaoCorrigida` 8 ou `null`, `revisor` nome, `revisadaEm` data); erro do cliente → `Error` "Falha ao ler as revisões do processo p1: …";
  2. `concluirRevisaoInterna('a3', { resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei' }, 'u2')` chama `rpc('concluir_revisao_interna', { p_andamento: 'a3', p_resultado: 'corrigida', p_escopo: 'ambos', p_comentario: 'Ajustei', p_responsavel: 'u2' })`; com `escopo`, `comentario` e responsável `null`, vão como `null` (o tipo gerado não os admite: `as string`, como em `avancar`);
  3. erro P0001 `revisor_e_autor:7` → rejeita com `TravaDoBanco` "Quem enviou a versão V7 não pode revisá-la."; erro `42501` → recusa por perfil (`recusas.semPermissao`); `registro_inexistente` → `recusas.registroInexistente()`.
  Rodar → FALHA.

- [x] **Step 2: Implementar `revisoesSupabase.ts`:**

```ts
import { type RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from '../processos/andamentosSupabase'
import type { DadosDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

const COLUNAS = 'id, resultado, escopo, comentario, revisada_em, revisor:usuarios(nome), '
  + 'revisada:versoes!versao_revisada_id(numero), corrigida:versoes!versao_corrigida_id(numero)'

type LinhaDaRevisao = {
  id: string; resultado: RevisaoInterna['resultado']; escopo: RevisaoInterna['escopo']; comentario: string | null
  revisada_em: string; revisor: { nome: string } | null; revisada: { numero: number }; corrigida: { numero: number } | null
}

function revisaoDaLinha(linha: LinhaDaRevisao): RevisaoInterna {
  return {
    id: linha.id, versaoRevisada: linha.revisada.numero, versaoCorrigida: linha.corrigida?.numero ?? null,
    resultado: linha.resultado, escopo: linha.escopo, comentario: linha.comentario, revisor: linha.revisor?.nome ?? null,
    revisadaEm: linha.revisada_em,
  }
}

export function criarRevisoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDeRevisoes {
  return {
    listarRevisoes: (processoId) => listarRevisoes(cliente, processoId),
    concluirRevisaoInterna: (id, dados, responsavelId) => concluirRevisaoInterna(cliente, id, dados, responsavelId, recusas),
  }
}

async function listarRevisoes(cliente: ClienteSupabase, processoId: string): Promise<RevisaoInterna[]> {
  const { data, error } = await cliente.from('revisoes_internas').select(COLUNAS)
    .eq('processo_id', processoId).order('registrada_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler as revisões do processo ${processoId}: ${error.message}`)
  return (data as unknown as LinhaDaRevisao[]).map(revisaoDaLinha)
}

// A revisão e a conclusão se gravam juntas, numa função do banco. O supabase-js manda null como null; o tipo gerado não o admite.
async function concluirRevisaoInterna(
  cliente: ClienteSupabase, andamentoId: string, dados: DadosDaRevisao, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('concluir_revisao_interna', {
    p_andamento: andamentoId, p_resultado: dados.resultado, p_escopo: dados.escopo as 'ambos',
    p_comentario: dados.comentario as string, p_responsavel: responsavelId as string,
  })
  if (error) throw falhaDoAndamento(error, recusas)
}
```

Em `src/main.tsx`: `const revisoes = criarRevisoesSupabase(supabase, <as recusas que processosSupabase já monta>)` — conferir em `processosSupabase.ts` de onde vêm as `recusas` e exportá-las, em vez de duplicar. `<App ... revisoes={revisoes} />`. Rodar o teste → PASSA.

- [x] **Step 3: Teste da falsa que falha** `RevisoesFalso.test.ts`: (a) `listarRevisoes` devolve a lista do processo e falha/segura conforme os campos; (b) `concluirRevisaoInterna` com a falsa de processos que tem o processo `p1` (Revisão interna `a3` em andamento, `ultimaVersao` V8 enviada por `u1`, anterior V7 de `u2`) e o usuário da tela `u2`: "sem alteração" é recusado com "Quem enviou a versão V8 não pode revisá-la."… (use as combinações do Step 1 da Task 2 via `opcoesDaRevisao`), "corrigida" sem escopo → `FRASE_DO_ESCOPO_OBRIGATORIO`, e o caso aceito grava uma revisão em `revisoes['p1']` (revisada V7/V8 conforme o resultado, revisor = nome do usuário, data fixa `2026-10-13` como a `HOJE` da `ProcessosFalso`), conclui a etapa na falsa de processos (a próxima em andamento com o responsável) e registra em `conclusoes`; `falhaNaGravacao` lança antes de tudo e nada é gravado. Rodar → FALHA.

- [x] **Step 4: Implementar `RevisoesFalso.ts`** (≤ 100 linhas): campos do Interfaces; `concluirRevisaoInterna` faz, nesta ordem: `falhaNaGravacao`; acha o processo da etapa em `processos.processos` (`CadastroInexistente` se não achar); `const opcoes = opcoesDaRevisao(processo.ultimaVersao, usuario.id)`; escopo/resultado conferidos como o banco (`escopo_obrigatorio`, `escopo_so_na_corrigida`); a opção escolhida precisa estar `disponivel` (senão `TravaDoBanco(opcao.motivo ?? opcoes.bloqueio)`); guarda a revisão (`id` `r${n}`), chama `await this.processos.concluirEtapa(andamentoId, responsavelId)` (que repete as travas de responsável e processo parado da falsa de processos) e só então grava a revisão e `conclusoes` (assim a conclusão que falha não deixa a revisão, como a função do banco). Sem `processos`, `concluirRevisaoInterna` lança `Error('RevisoesFalso sem ProcessosFalso: monte new RevisoesFalso(processos, usuario)')`. Rodar → PASSA.

- [x] **Step 5: A prop `revisoes`.** `App.tsx`: `revisoes: ModuloDeRevisoes` em `AppProps` e `revisoes={revisoes}` em `AreaDeProcessos`. Nos componentes: `AreaDeProcessos` → `VisaoDosProcessos` → `QuadroDeProcessos` → `useConclusaoPeloQuadro(processos, revisoes, podeAlterar, aoMudar)`; `AreaDeProcessos` → `VersoDoCartao` → `ProcessoAberto`/`ColunasDoVerso` → `CaminhoDoProcesso` → `useAcoesDaEtapa(processos, revisoes, aoMudar, aoSumir)` (a assinatura muda aqui; o hook só repassa à `gravarAvanco`, na Task 4). Rodar `npx tsc -b` e seguir os erros.

- [x] **Step 6: Testes que montam o `<App>`.** Cada `render(<App ... versoes={new VersoesFalso()} />)` ganha `revisoes={new RevisoesFalso()}` e o `import { RevisoesFalso } from '<caminho>/revisoes/RevisoesFalso'`. Fazer com um script Node de uma vez só (rodado da raiz, com o `git diff --stat` conferido depois): para cada arquivo de `src/**/*.test.tsx` e `src/testes/*.tsx` que contém `<App ` e `versoes={`, inserir ` revisoes={new RevisoesFalso()}` logo depois de cada `versoes={new VersoesFalso()}` (ou do `versoes={...}` que estiver) e o `import` com o caminho relativo certo (`./revisoes/RevisoesFalso` em `src/`, `../revisoes/RevisoesFalso` em `src/testes/`). Os helpers `montarVerso` (`processoNoVerso.tsx`) e `quadroDeTeste.tsx`, que já têm a `ProcessosFalso` à mão, passam `new RevisoesFalso(falso, EU)`. Rodar `npx tsc -b` e `npm test` (os testes das telas continuam como estavam: só as que concluem a Revisão interna mudam na Task 4).

- [x] **Step 7: Comitar** "Ticket 02 de revisoes-aprovacao: módulo de revisões (real e falso) e a prop revisoes".

---

### Task 4: A janela de concluir a Revisão interna (critérios 2, 4 e 6)

**Files:**
- Create: `src/components/processos/BlocoDaRevisao.tsx`, `src/App.revisaoInterna.test.tsx`
- Modify: `src/components/processos/JanelaDeAvanco.tsx`, `src/components/processos/JanelasDaEtapa.tsx`, `src/processos/gravarAcoes.ts`, `src/hooks/useAcoesDaEtapa.ts`, `src/hooks/useConclusaoPeloQuadro.ts`, testes de tela existentes que concluem a Revisão interna (`App.agoraDoVerso.test.tsx`, `App.assumirEAutor.test.tsx`, `App.arrastarParaConcluir.test.tsx` e os que o `npm test` apontar), `src/styles` ou o CSS da janela (só se o bloco precisar)

**Interfaces:**
- Consumes: `opcoesDaRevisao`, `DadosDaRevisao`, `ModuloDeRevisoes`, `ROTULO_DO_ESCOPO`.
- Produces: `JanelaDeAvanco` ganha `revisao?: OpcoesDaRevisao` e `aoConfirmar(nota, responsavelId, revisao?: DadosDaRevisao): void | Promise<string | null>` (com `revisao`, a janela **espera** a gravação: texto devolvido = falha, mostrada em vermelho dentro da janela, que fica aberta com o preenchido; `null` = gravou, a janela fecha); `BlocoDaRevisao` (props `opcoes: OpcoesDaRevisao`, `valor: RascunhoDaRevisao`, `aoMudar: (valor: RascunhoDaRevisao) => void`), `RascunhoDaRevisao = { resultado: ResultadoDaRevisao | null; escopo: EscopoDaCorrecao | ''; comentario: string }`; `gravarAvanco(processos, acao, etapa, texto, responsavelId)` continua como está; novo `gravarRevisao(revisoes, etapa, dados, responsavelId, aoSumir): Promise<string | null>` em `gravarAcoes.ts` (devolve o texto da falha por `textoDaFalha`, ou `null`; `CadastroInexistente` chama `aoSumir` e devolve `null`); `useAcoesDaEtapa(processos, revisoes, aoMudar, aoSumir).gravarComAvanco(nota, responsavelId, revisao?)`: com `revisao`, devolve a `Promise<string | null>` de `gravarRevisao` (e chama `aoMudar()` se deu certo); sem, o `executar` de sempre.

- [x] **Step 1: Testes de tela que falham** `src/App.revisaoInterna.test.tsx` (montar como `App.revisaoDoSetor.test.tsx` e `App.arrastarParaConcluir.test.tsx`: `montarVerso`, a Revisão interna `a3` em andamento sob `EU`, a Revisão pelo setor `a4` pendente depois; a falsa de revisões com `new RevisoesFalso(falso, EU)`). Casos, cada um pelo [Concluir] do Agora e, onde indicado, pelo arrastar do cartão no Quadro:
  1. versão V7 de `Bia` (`ultimaVersao.autorId = BIA.id`): a janela mostra "Sem alteração: segue a V7"; "Corrigida" desabilitada com o motivo "Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos."; o Escopo não aparece; o botão principal "Concluir e iniciar Revisão pelo setor" desabilitado até escolher o resultado; escolher "Sem alteração", digitar o comentário "Conferi" e confirmar: `revisoes.conclusoes` tem `{ resultado: 'sem_alteracao', escopo: null, comentario: 'Conferi' }` e a etapa 4 entra em andamento; **o mesmo pelo arrastar**.
  2. V8 de `EU` e V7 de `Bia`: "Sem alteração" desabilitada com "Quem enviou a versão V8 não pode revisá-la."; "Corrigida: a V8, enviada por você, corrige a V7" disponível; ao escolhê-la aparece o Escopo (Fluxograma / Relatório / Fluxograma e relatório), sem escolha o botão fica desabilitado; com "Fluxograma e relatório" grava `{ resultado: 'corrigida', escopo: 'ambos', comentario: null }` (comentário vazio vira `null`); **o mesmo pelo arrastar**.
  3. V8 de `EU` sem anterior (ou com a anterior também de `EU`): nenhuma opção cabe; a frase "Quem enviou a versão V8 não pode revisá-la." aparece em `role="alert"` e o botão principal fica desabilitado; clicar não grava (`revisoes.conclusoes` vazio).
  4. Sem versão (`ultimaVersao: null`): "O processo ainda não tem versão enviada." e o botão desabilitado.
  5. Recusa do banco: com `revisoes.falhaNaGravacao = new TravaDoBanco('Quem enviou a versão V7 não pode revisá-la.')`, confirmar mantém a **janela aberta**, com o resultado, o escopo, o comentário e a escolha do responsável como estavam, e a frase em vermelho (`role="alert"` dentro do `dialog`); a etapa continua em andamento; sem a falha, confirmar de novo grava e fecha. Falha genérica (`falhaNaGravacao = 'falha de conexão simulada'`): a frase de `textoDaFalha`. Durante a gravação (falsa que segura), o botão fica desabilitado com "Salvando…".
  6. O comentário passa de 2.000 caracteres: o campo tem `maxLength=2000`.
  7. Dispensar e "Realizada anteriormente" na Revisão interna não mostram o Resultado (a janela da nota abre como hoje).
  8. A janela de concluir a Revisão pelo setor e a de voltar não mostram o Resultado.
  9. [visual] não coberto por teste: registrar para o `/polir` (critério 7).
  Rodar `npx vitest run src/App.revisaoInterna.test.tsx` → FALHA.

- [x] **Step 2: Implementar `BlocoDaRevisao.tsx`** (≤ 80 linhas): `fieldset` "Resultado da revisão" com dois `input type="radio"` (rótulos `Sem alteração: ${previa}` e `Corrigida: ${previa}`; a opção indisponível `disabled`, o rótulo só "Sem alteração"/"Corrigida" e o `motivo` num `<span className="janela-ajuda">` ao lado); `fieldset` "Escopo da correção" só quando `valor.resultado === 'corrigida'` (três rádios, `ROTULO_DO_ESCOPO`); `textarea` "Comentário (opcional)" com `maxLength={2000}` e a dica "Não anote dado pessoal de pessoas do setor."; `bloqueio` fica com a `JanelaDeAvanco` (como o do ticket 01). Reaproveitar as classes de formulário que `JanelaDeAvanco`/`EscolhaDoResponsavel` já usam (conferir os nomes em `JanelaDeConfirmacao.css` e `Verso.css`; abrir o CSS só se faltar algo; manter a janela dentro de 1366×768, critério 7).

- [x] **Step 3: `JanelaDeAvanco`.** Nova prop `revisao?: OpcoesDaRevisao`; estado `const [rascunho, setRascunho] = useState<RascunhoDaRevisao>({ resultado: null, escopo: '', comentario: '' })`; o bloco aparece entre o `bloqueio` e o `EscolhaDoResponsavel` quando `revisao` existe; `bloqueio` da janela passa a ser `bloqueio ?? revisao?.bloqueio ?? null`; `pronta` ganha `&& revisaoPronta(revisao, rascunho)` com a função pura (no próprio arquivo de `BlocoDaRevisao.tsx`, testada na Task 4 pelo teste de tela) `revisaoPronta = (rascunho.resultado !== null) && (rascunho.resultado !== 'corrigida' || rascunho.escopo !== '')`; `confirmar()` sem `revisao` é o de sempre (fecha e chama `aoConfirmar`). Com `revisao`: estados `salvando` e `falhaAoGravar`; `confirmar` vira `async`: `setSalvando(true)`, `const falha = await aoConfirmar(nota.trim(), responsavel, dadosDaRevisao(rascunho))`, `setSalvando(false)`; com `falha` mostra `<p className="cadastros-falha" role="alert">{falha}</p>` dentro do `dialog` e a janela fica aberta; sem falha chama `aoFechar()`. `dadosDaRevisao` aparata o comentário (vazio → `null`) e devolve `escopo: null` em "sem alteração". O botão principal mostra "Salvando…" e fica desabilitado enquanto `salvando`; Cancelar e Esc continuam valendo (fechar sem gravar). Manter o arquivo ≤ 300 linhas e a função do componente dentro do limite (se estourar, extrair o estado para um hook `useRascunhoDaRevisao` em `src/hooks/`).

- [x] **Step 4: Ligar a janela à etapa.** Em `JanelasDaEtapa.tsx`, `JanelaDoAvancoDaEtapa`: `const revisao = acao === 'concluir' && etapa.codigo === 'revisao_interna' ? opcoesDaRevisao(ultimaVersao, usuarioId) : undefined` e `revisao={revisao}`; o tipo de `aoConfirmar` ganha o terceiro argumento. Em `gravarAcoes.ts`: `gravarAvanco(modulos, acao, etapa, texto, responsavelId, revisao = null)` — `if (acao === 'concluir' && revisao) return modulos.revisoes.concluirRevisaoInterna(etapa.id, revisao, responsavelId)` antes dos outros ramos; `gravarTexto` passa os módulos e `null`. Em `useAcoesDaEtapa.ts`: recebe `revisoes`; `gravarComAvanco(nota, responsavelId, revisao?)` faz `if (avanco && revisao) return gravarRevisao(revisoes, avanco.etapa, revisao, responsavelId, aoSumir).then((falha) => { if (!falha) aoMudar(); return falha })` e, sem `revisao`, o `executar` de sempre (manter o hook ≤ 40 linhas; se estourar, mover o ramo para uma função em `gravarAcoes.ts` que recebe o necessário). Quem não tem `revisao` não muda de comportamento. `useConclusaoPeloQuadro` repassa `revisoes` e já guarda a `ultimaVersao` lida (o arrastar usa o mesmo caminho). Rodar o arquivo de teste → PASSA.

- [x] **Step 5: Ajustar os testes de tela existentes** que concluem a Revisão interna e agora veem o Resultado (o `npm test` indica quais: provavelmente `App.agoraDoVerso`, `App.assumirEAutor`, `App.arrastarParaConcluir`): dar à fixture uma `ultimaVersao` de outra pessoa (`autorId: BIA.id`, `papeis` completos) e escolher "Sem alteração" antes de confirmar, ou ajustar a expectativa de `processos.chamadas` (a conclusão agora vem em `revisoes.conclusoes`). Rodar `npm test` completo, `npx tsc -b`, `npx madge --circular src`, `npx eslint src`.

- [x] **Step 6: Comitar** "Ticket 02 de revisoes-aprovacao: a janela de concluir pede o resultado da revisão".

---

### Task 5: As revisões na gaveta e no histórico (critérios 3 e 5)

**Files:**
- Create: `src/components/processos/RevisoesDaEtapa.tsx`
- Modify: `src/components/processos/DetalheDaEtapa.tsx`, `EtapasDoProcesso.tsx` (a prop `revisoes` e o `processo.id`), `CaminhoDoProcesso.tsx`, `src/cadastros/historicoDosCadastros.ts` (+ `historicoDasRevisoes.test.ts` em `src/cadastros/`), `src/processos/lerProcessoSupabase.ts` (+ teste), `src/App.revisaoInterna.test.tsx`

**Interfaces:**
- Consumes: `ModuloDeRevisoes.listarRevisoes`, `rotuloDoResultado`, `ROTULO_DO_ESCOPO`, `useCarregamento`, `ErroAoCarregar`.
- Produces: `RevisoesDaEtapa({ revisoes, processoId })` (props: `revisoes: ModuloDeRevisoes; processoId: string`), montada na gaveta da etapa `revisao_interna` (aberta); `DadosDasEtapas` ganha `processoId: string` e `revisoes: ModuloDeRevisoes`.

- [x] **Step 1: Testes de tela que falham** (acrescentar ao `App.revisaoInterna.test.tsx`; abrir a gaveta da Revisão interna clicando na linha "Revisão interna: …" das Etapas):
  1. com `revisoes.revisoes['p1']` com duas revisões: lista da mais recente para a mais antiga (a falsa devolve na ordem dada; o teste dá na ordem do banco), cada uma com a versão revisada ("V7"), o revisor ("Bia Teste"), a data (`formatarData`), o resultado ("Sem alteração" ou "Corrigida, gerou a V8"), o escopo ("Fluxograma e relatório") e o comentário;
  2. sem revisões: "Nenhuma revisão registrada.";
  3. enquanto a leitura não responde (`segurarLeitura`): "Carregando…";
  4. leitura que falha (`falharLeitura`): o alerta "Não foi possível carregar as revisões. Verifique a conexão e tente de novo." com [Tentar de novo]; clicar volta a "Carregando…" e, com a falha desligada, mostra as revisões;
  5. as revisões aparecem só na gaveta da Revisão interna (não nas outras etapas) e para a Consulta também (sem botões);
  6. processo suspenso e Consulta: a lista aparece, sem nenhum botão novo (o [Editar] é do ticket 04);
  7. um subprocesso (`tipo: 'subprocesso'`) mostra as próprias revisões.
  Rodar → FALHA.

- [x] **Step 2: Implementar `RevisoesDaEtapa.tsx`**: `useCarregamento(() => revisoes.listarRevisoes(processoId))`; carregando → `<p className="cadastros-vazio" role="status">Carregando…</p>`; erro → `<ErroAoCarregar alvo="as revisões" aoTentarDeNovo={tentarDeNovo} />`; vazio → `<p className="cadastros-vazio">Nenhuma revisão registrada.</p>`; senão `<ul className="etapa-registros">` com um `<li>` por revisão: `V7 · Bia Teste · 13/10/2026`, o resultado/escopo e o comentário (`etapa-nota` para o comentário, igual à nota da gaveta). O componente só monta quando a gaveta está aberta (a gaveta já é montada só aberta, então a leitura acontece ao abrir) e **relê quando o processo recarrega**: usar `key={processo.id + etapa.resolvidaEm}` ou receber um `recarga` simples — escolher o mais curto que o teste 1 e a conclusão pela tela provem (a lista deve mostrar a revisão recém-gravada depois do `aoMudar`). Estilo: reaproveitar `etapa-datas`/`etapa-nota` de `Etapas.css`; acrescentar no máximo uma regra de lista ali (critério 7, [visual], fica para o `/polir`).

- [x] **Step 3: `DetalheDaEtapa`.** Depois da nota e antes do responsável: `{etapa.codigo === 'revisao_interna' && <RevisoesDaEtapa revisoes={props.revisoes} processoId={props.processoId} />}`. `EtapasDoProcesso` e `CaminhoDoProcesso` passam `processoId={processo.id}` e `revisoes`. Rodar → PASSA.

- [x] **Step 4: Histórico (critério 5).** Teste primeiro em `src/cadastros/historicoDasRevisoes.test.ts` (seguir `historicoDasVersoes.test.ts`): um evento `{ acao: 'registrar', entidade: 'revisao_interna', antes: null, depois: { processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', versao_revisada: 'V7', versao_corrigida: 'V8', resultado: 'corrigida', escopo: 'ambos', comentario: 'Ajustei', revisor_nome: 'Bia Teste', revisada_em: '2026-10-13' } }` vira: `textoDaAcaoDoCadastro` = "Registrou a revisão interna"; `nomeDoItem` = "V7 — Emitir Ofício"; `descreverEstadoDoCadastro(depois)` lista "Versão revisada: V7; Versão corrigida: V8; Resultado: Corrigida; Escopo: Fluxograma e relatório; Comentário: Ajustei; Revisor: Bia Teste; Data da revisão: 13/10/2026" (sem o nome do processo e a sigla, que já estão no título: acrescentar `processo_nome` e `setor_sigla` ao que o `descreverEstadoDoCadastro` já esconde para as outras entidades só se o resultado repetir o processo; seguir o que as versões fazem). Implementar em `historicoDosCadastros.ts`: `TEXTO_DA_ACAO_DA_REVISAO = { registrar: 'Registrou a revisão interna' }` em `TEXTOS_DA_ENTIDADE`, `revisao_interna` em `nomeDoItemComDono` (`"${versao_revisada} — ${processo_nome}"`), rótulos de campo (`versao_revisada: 'Versão revisada'`, `versao_corrigida: 'Versão corrigida'`, `resultado`, `escopo`, `comentario: 'Comentário'`, `revisor_nome: 'Revisor'`, `revisada_em: 'Data da revisão'`) e valores legíveis (resultado "Sem alteração"/"Corrigida", escopo pelos rótulos, a data em `CAMPOS_DE_DATA`). Atenção ao arquivo (já tem ~230 linhas; se passar de 300, mover os textos novos para `historicoDasRevisoes.ts`).
  Em `lerProcessoSupabase.ts`, `.in('entidade', ['processo', 'andamento', 'versao', 'revisao_interna'])` (teste em `lerProcessoSupabase.test.ts`: a consulta inclui a entidade). Teste de tela: `App.revisaoInterna.test.tsx` abre o Histórico do processo com um evento `revisao_interna` em `historicoDosProcessos['p1']` e vê "Registrou a revisão interna" e o resumo.

- [x] **Step 5: `npm test` completo, `npx tsc -b`, `npx madge --circular src`, `npx eslint src`.** Comitar "Ticket 02 de revisoes-aprovacao: revisões na gaveta da etapa e no histórico".

---

### Task 6: Fecho do ticket

**Files:**
- Modify: `.scratch/revisoes-aprovacao/desvios.md`, `.scratch/revisoes-aprovacao/spec.md` (só se algo divergir), `.scratch/revisoes-aprovacao/issues/02-*.md` (marcas `[x]`), `CONTEXT.md` (só se houver termo novo), `.scratch/melhorias-protocolo.md`

- [x] **Step 1: Conferência na tela (critério 7, [visual]) — NÃO FEITA: registrada nos desvios; fica para o /polir.** Subir o Vite (`.claude/launch.json` já tem a configuração) e, na vitrine local com módulos falsos, abrir a janela de concluir a Revisão interna (as duas opções, o Escopo, a frase de bloqueio) a 1366×768 e a gaveta com revisões. Se não for possível, registrar nos desvios que a conferência **não foi feita** e fica para o `/polir`.
- [x] **Step 2: `desvios.md`** (entrada datada): (1) a edição da revisão (privilégio, política, gatilhos, evento) fica no ticket 04; aqui só `select` e `insert`; (2) "versão anterior" = não histórica imediatamente menor; (3) gatilho de inclusão confere o perfil primeiro; (4) `concluir_revisao_interna` só aceita o andamento da `revisao_interna`; (5) `RevisoesFalso` conclui a etapa na `ProcessosFalso` e a trava direta da `revisao_interna` não é imitada na falsa (a prova é do banco); (6) `UltimaVersao.anterior` opcional; (7) o bloco do Resultado não é genérico (o ticket 03 generaliza); (8) testes antigos de banco ajustados (quais).
- [x] **Step 3: Marcar os critérios do ticket (`- [x]`) e as caixas deste plano; `.scratch/melhorias-protocolo.md`** com os itens não testados deste comando (conforme `.claude/regras/nao-testados.md`, bloco do `/executar-complexo`).
- [x] **Step 4: Comitar** "Ticket 02 de revisoes-aprovacao: desvios, critérios e melhorias do protocolo".

(O merge na `main`, a linha `Concluído em` e o envio ficam por conta do passo 4 do `/executar-complexo`.)

---

## Autoverificação

- **Cobertura da spec/ticket:** critério 1 (banco: células de perfil, uma regra por caso, atomicidade, exclusão com contagem, eventos, subprocesso/reclassificação, testes antigos) → Task 1; critério 2 (janela, opções, autor impedido, sem versão, Escopo, arrastar) → Tasks 2 e 4; critério 3 (gaveta com lista, vazio, carregando, erro) → Task 5; critério 4 (recusas em vermelho na janela sem perder o preenchido) → Task 4, caso 5 (a janela da Revisão interna espera a gravação e fica aberta ao falhar); critério 5 (eventos no histórico) → Tasks 1 (evento) e 5 (texto); critério 6 (testes do módulo real, das puras e da tela) → Tasks 2, 3, 4 e 5; critério 7 [visual] → Task 6, passo 1.
- **Tipos e nomes:** `DadosDaRevisao`, `RevisaoInterna`, `ModuloDeRevisoes`, `opcoesDaRevisao`, `OpcoesDaRevisao`, `RascunhoDaRevisao`, `criarRevisoesSupabase`, `RevisoesFalso`, `RevisoesDaEtapa`, `BlocoDaRevisao`, `concluirRevisaoInterna`, `listarRevisoes`, `UltimaVersao.anterior`, `public.concluir_revisao_interna`, `public.revisoes_internas` — mesmos nomes em todas as tarefas.
- **Lacunas aceitas:** as outras ações da etapa (dispensar, realizada anteriormente, voltar e concluir das demais etapas) continuam fechando a janela antes de gravar, com a falha em vermelho no verso, como hoje; só a Revisão interna mantém a janela aberta (o ticket 03 faz o mesmo na Aprovação). Estender às demais é mudança à parte (backlog).
