# Ticket 05 de processos-etapas (Andamento das etapas do processo) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a equipe anda com o processo pelo painel (Iniciar, Concluir, Dispensar, Realizada anteriormente), com o banco impondo a sequência, e o cartão do Quadro muda de coluna e some quando o processo conclui.

**Architecture:** uma migração só reescreve gatilhos do `andamentos` (sequência do processo, setor resolvido antes da primeira etapa, uma etapa em andamento, evento do andamento do processo) e devolve à política de alteração o andamento de processo. O módulo de processos já tem as quatro ações (`iniciarEtapa` etc., por id de andamento): ganha só as duas frases novas de recusa e a leitura do histórico passa a trazer os eventos das etapas. A tela reaproveita o componente das etapas do setor (renomeado `CaminhoDeEtapas`) também no painel do processo.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 22 (concluídos), 30 a 37, 44, 57; "Interface", "Regras que o banco impõe", "Regras de estado") · **Ticket:** `.scratch/processos-etapas/issues/05-andamento-das-etapas-do-processo.md` (critérios citados como "critério N", na ordem do ticket) · **Desvio herdado:** `desvios.md`, entrada de 2026-10-14 ("Andamentos de processo só se leem até o ticket 05").

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Teste antes da migração; migração, teste de banco e tipos no mesmo commit (regra do `.claude/regras/banco.md`, lida nesta sessão).
- Dados de teste inventados. Funções de gatilho pequenas, uma responsabilidade; as de conferência rodam com a permissão de quem altera (sem `security definer`) e recebem `revoke ... from public, anon` + `grant execute ... to authenticated`; as de gatilho e de evento, `revoke` de todos.
- TypeScript sem `any`; função de lógica 4–20 linhas; arquivo até 300 linhas; complexidade ≤ 10.
- Mensagens de recusa (spec, "Mensagens de recusa"): "O setor {SIGLA} ainda não resolveu as etapas do setor." e "Já há uma etapa em andamento neste processo: {etapa}.", além das do ticket 02 ("A etapa {anterior} ainda não foi resolvida.", "A etapa {nome} é obrigatória e não pode ser dispensada.").
- O banco é alvo de **desenvolvimento** (`yclkzyoebpsxmgpbcbus`, linha "vínculo atual" de `supabase/AMBIENTES.md`). Testes de banco: workflow "Testes de banco" (push da branch + Run workflow). Migração: workflow "Migrar banco de desenvolvimento" (Run workflow, arquivo indicado). Ambos autorizados na seção "Ajustes deste Projeto" do `CLAUDE.md`. Produção: nada.
- Branch `processos-etapas-05` a partir da `main`; marco `marco/2026-10-14-inicio-ticket-05-processos-etapas` antes da primeira alteração.
- Fora do escopo (tickets seguintes): voltar a etapa, corrigir datas, responsável (06); suspender/cancelar/retomar e o congelamento (07); reclassificar (08).

## Mapa de arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/tests/18_andamento_do_processo.test.sql` | novo: sequência, setor resolvido, uma em andamento, dispensa, nota, concluído, perfis, eventos |
| `supabase/tests/17_processos.test.sql` | tira o teste "ainda não muda (ticket 05)" e o desvio do gatilho de evento; resolve as etapas em ordem |
| `supabase/migrations/<data>_andamento_do_processo.sql` | novo (criada com `npx supabase migration new andamento_do_processo`) |
| `src/processos/processosSupabase.ts` (+ `.test.ts`) | duas frases novas de recusa |
| `src/processos/lerProcessoSupabase.ts` (+ `.test.ts`), `src/testes/ClienteSupabaseFalso.ts` | histórico do processo traz os eventos das etapas (`like`) |
| `src/cadastros/historicoDosCadastros.ts` (+ teste) | o nome do item do evento de etapa de processo traz o processo |
| `src/processos/andamentoFalso.ts` (+ `.test.ts`), `src/processos/ProcessosFalso.ts` | o falso aplica a ação às etapas do processo e recalcula etapa atual, situação e "aguardando o setor" |
| `src/components/processos/CaminhoDoSetor.tsx` → `CaminhoDeEtapas.tsx` | renomeado; mostra o responsável quando a etapa o traz |
| `src/components/processos/EtapasDoSetor.tsx`, `CaminhoDoProcesso.tsx`, `PainelDoProcesso.tsx` | usam o `CaminhoDeEtapas`; ações no painel só para quem pode |
| `src/App.andamentoDoProcesso.test.tsx` | novo: testes de tela do aplicativo inteiro |
| `.scratch/processos-etapas/desvios.md`, `supabase/AMBIENTES.md`, `supabase/migrations`-registro | desvios, registro da migração |

---

### Task 1: Banco — testes, migração e tipos

**Files:**
- Create: `supabase/tests/18_andamento_do_processo.test.sql`
- Modify: `supabase/tests/17_processos.test.sql`
- Create: `supabase/migrations/<data>_andamento_do_processo.sql`
- Modify: `supabase/AMBIENTES.md` (registro da migração aplicada à mão/workflow, no formato das anteriores), `src/types/database.ts` (só se `npm run db:types` mudar algo; nada público muda, esperado: sem diferença)

**Interfaces:**
- Consumes: `andamentos`, `etapas`, `processos`, `setores`, `eventos`, `processos_com_andamento`, `private.preparar_andamento()`, `private.conferir_anterior_resolvida(public.andamentos)`, `private.conferir_dispensa`, `private.pode_alterar_cadastros()`.
- Produces: exceções com estes textos (o módulo da Task 2 as traduz): `setor_nao_resolveu:<SIGLA>`, `ja_ha_etapa_em_andamento:<nome da etapa>`, `anterior_nao_resolvida:<nome>` (já existia), `etapa_obrigatoria:<nome>` (já existia), `transicao_nao_permitida:<de>:<para>`. Evento de andamento de processo: `entidade = 'andamento'`, `entidade_ref = '<processo_id>:<andamento_id>'`, `detalhes.antes/depois` com `processo_id`, `processo_nome`, `setor_sigla`, `etapa_codigo`, `etapa_nome`, `status`, `iniciada_em`, `resolvida_em`, e `detalhes.motivo` = nota.

- [ ] **Step 1: Conferir o alvo e criar branch e marco**

```bash
git switch -c processos-etapas-05
git tag marco/2026-10-14-inicio-ticket-05-processos-etapas
```
Conferir a linha "vínculo atual" de `supabase/AMBIENTES.md` (= `yclkzyoebpsxmgpbcbus`, o desenvolvimento).

- [ ] **Step 2: Escrever o teste novo (falha, porque a migração não existe)**

Criar `supabase/tests/18_andamento_do_processo.test.sql`:

```sql
-- Andamento das etapas do processo: sequência, setor resolvido antes da primeira etapa, uma em andamento,
-- dispensa, nota, concluído calculado, perfis e eventos (processos-etapas, ticket 05).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(25);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

-- Um setor (o gatilho dá a ele as 3 etapas do setor, pendentes), um macroprocesso e dois processos.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000001', 'TS5', 'Setor Andamento');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000001', null, 'Macro Andamento');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000001', 'af000000-0000-0000-0000-000000000001', 'Processo Andamento'),
  ('5f000000-0000-0000-0000-000000000001', 'af000000-0000-0000-0000-000000000001', 'Processo Perfis');

-- O andamento de uma etapa num processo (o id nasce pelo gatilho, então é buscado) e a ação sobre ele.
create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(codigo_da_etapa text, novo public.status_da_etapa, nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento('Processo Andamento', codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, public.status_da_etapa, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- A primeira etapa do processo só começa com as etapas do setor resolvidas.
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('modelagem', 'em_andamento')$sql$, 'P0001', 'setor_nao_resolveu:TS5',
  'iniciar a primeira etapa com o setor pendente é recusado');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-000000000001'
    and etapa_id = (select id from public.etapas where codigo = 'identificacao_responsaveis');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-000000000001'
    and etapa_id = (select id from public.etapas where codigo = 'sensibilizacao');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-000000000001'
    and etapa_id = (select id from public.etapas where codigo = 'identificacao_processos');
insert into _tap (linha) select ok(
  not (select aguardando_o_setor from public.processos_com_andamento where nome = 'Processo Andamento'),
  'com o setor resolvido o processo deixa de aguardá-lo');

-- Iniciar e concluir: a data do dia é gravada.
insert into _tap (linha) select lives_ok($sql$select pg_temp.agir('modelagem', 'em_andamento')$sql$,
  'iniciar a primeira etapa com o setor resolvido');
insert into _tap (linha) select is(
  (select iniciada_em from public.andamentos where id = pg_temp.andamento('Processo Andamento', 'modelagem')),
  current_date, 'iniciar grava a data de início de hoje');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'em_andamento')$sql$, 'P0001',
  'ja_ha_etapa_em_andamento:Reunião de modelagem', 'segunda etapa em andamento no processo é recusada');
insert into _tap (linha) select lives_ok($sql$select pg_temp.agir('modelagem', 'concluida')$sql$,
  'concluir a etapa em andamento');
insert into _tap (linha) select is(
  (select resolvida_em from public.andamentos where id = pg_temp.andamento('Processo Andamento', 'modelagem')),
  current_date, 'concluir grava a data de conclusão de hoje');

-- Sequência, dispensa, nota e transições.
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('revisao_interna', 'em_andamento')$sql$, 'P0001',
  'anterior_nao_resolvida:Relatório e modelagem técnica', 'iniciar a 6 com a 5 pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'dispensada', 'Não se aplica')$sql$, 'P0001',
  'etapa_obrigatoria:Relatório e modelagem técnica', 'dispensar etapa obrigatória é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'realizada_anteriormente')$sql$, '23514', null,
  'realizada anteriormente sem nota é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'concluida')$sql$, 'P0001',
  'transicao_nao_permitida:pendente:concluida', 'concluir uma etapa pendente é recusado');

-- Todas as obrigatórias resolvidas: concluído, com a 9 (opcional) ainda pendente.
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes')$sql$,
  'registrar a etapa como realizada anteriormente, com nota');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('revisao_interna', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a revisão interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('revisao_setor', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a revisão pelo setor');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('aprovacao_setor', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a aprovação');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Andamento'),
  'concluido', 'com as obrigatórias resolvidas o processo é concluído, mesmo com a 9 pendente');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where nome = 'Processo Andamento'),
  'publicacao', 'a etapa atual é a opcional que sobrou');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('publicacao', 'dispensada', 'Sem publicação neste caso')$sql$, 'dispensar etapa opcional, com nota');

-- Eventos: um por ação aceita, com o processo legível, a referência 'processo:andamento' e a nota em "motivo".
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos
    where entidade = 'andamento' and entidade_ref like (select id::text from public.processos where nome = 'Processo Andamento') || ':%'),
  7, 'cada ação aceita gera um evento do andamento do processo');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where acao = 'dispensar'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Andamento') || ':%'),
  'Sem publicação neste caso', 'o evento da dispensa traz a nota em motivo');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'processo_nome' from public.eventos where acao = 'dispensar'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Andamento') || ':%'),
  'Processo Andamento', 'o evento traz o nome do processo, legível depois de uma exclusão');

-- Perfis: Consulta e inativo não alteram (nenhuma linha muda); Administrador altera; visitante nem tenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
with alterados as (update public.andamentos set status = 'em_andamento'
  where id = pg_temp.andamento('Processo Perfis', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não anda com o processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
with alterados as (update public.andamentos set status = 'em_andamento'
  where id = pg_temp.andamento('Processo Perfis', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Inativo não anda com o processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('Processo Perfis', 'modelagem')$sql$, 'Administrador anda com o processo');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'concluida' where processo_id is not null$sql$, '42501', null,
  'visitante não anda com o processo');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Contagem: 25 asserções (1 setor recusado, 2 aguardando, 3 iniciar, 4 data, 5 segunda em andamento, 6 concluir, 7 data, 8 anterior, 9 dispensa, 10 nota, 11 transição, 12–15 quatro registros, 16 concluído, 17 etapa atual, 18 dispensa opcional, 19 eventos, 20 motivo, 21 nome do processo, 22 consulta, 23 inativo, 24 admin, 25 visitante). Se o `plan(25)` não bater, ajustar o número e nada mais.

- [ ] **Step 3: Ajustar o teste 17**

Em `supabase/tests/17_processos.test.sql`:
1. Trocar o comentário "ninguém cria, apaga nem muda direto neste ticket" por "ninguém cria nem apaga direto" e **apagar** o bloco `with alterados as (update public.andamentos set status = 'em_andamento' ... 'andamento de processo ainda não muda (ticket 05)')`.
2. Apagar o comentário sobre o gatilho de eventos "ainda é só do setor (ticket 05)" e a linha `alter table public.andamentos disable trigger registrar_evento_do_andamento;`.
3. Trocar o `update ... where processo_id = ... and etapa_id in (select id from public.etapas where obrigatoria and nivel = 'processo');` (um comando só, ordem de linhas não garantida) por cinco `update` em ordem, um por código: `modelagem`, `relatorio_modelagem_tecnica`, `revisao_interna`, `revisao_setor`, `aprovacao_setor`, cada um com `set status = 'realizada_anteriormente', nota = 'Feita antes'`.
4. Baixar `plan(80)` para `plan(79)`.
5. Se algum teste que conta eventos de **todo** o banco falhar por causa dos eventos de andamento que agora são gravados, restringir a contagem à entidade que ele quer (`entidade = 'processo'`).

- [ ] **Step 4: Escrever a migração**

`npx supabase migration new andamento_do_processo` e preencher o arquivo criado em `supabase/migrations/`:

```sql
-- Andamento das etapas do processo (processos-etapas, ticket 05): o banco impõe a sequência das etapas do processo,
-- o setor resolvido antes da primeira etapa e uma só etapa em andamento; o andamento do processo gera evento.

-- O andamento do processo volta a poder ser alterado por quem mantém os cadastros (o ticket 04 o travava).
drop policy "andamentos: administrador e integrante ativos alteram" on public.andamentos;
create policy "andamentos: administrador e integrante ativos alteram" on public.andamentos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- No máximo uma etapa em andamento por processo, com a frase pronta (o índice único fica de reserva).
create function private.conferir_uma_em_andamento(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  em_andamento text;
begin
  select e.nome into em_andamento
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id and a.status = 'em_andamento' and a.id <> andamento.id;
  if found then
    raise exception 'ja_ha_etapa_em_andamento:%', em_andamento;
  end if;
end $$;

-- A primeira etapa do processo pede as etapas do setor resolvidas (concluídas, dispensadas ou realizadas antes).
create function private.conferir_setor_resolvido(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  sigla_do_setor text;
begin
  select s.sigla into sigla_do_setor
  from public.processos p join public.setores s on s.id = p.setor_id
  where p.id = processo and exists (
    select 1 from public.andamentos a where a.setor_id = p.setor_id and a.status in ('pendente', 'em_andamento'));
  if found then
    raise exception 'setor_nao_resolveu:%', sigla_do_setor;
  end if;
end $$;

-- Sair de pendente pede a anterior do processo resolvida; sem anterior, é a primeira etapa e vale o setor.
create function private.conferir_sequencia_do_processo(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if not found then
    perform private.conferir_setor_resolvido(andamento.processo_id);
  elsif anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

-- A sequência de quem sai de pendente: a do setor (ticket 02) ou a do processo. Iniciar confere antes se já há outra
-- em andamento, que é o aviso mais útil quando a anterior é justamente a que está em andamento.
create function private.conferir_sequencia(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.processo_id is null then
    perform private.conferir_anterior_resolvida(andamento);
    return;
  end if;
  if andamento.status = 'em_andamento' then
    perform private.conferir_uma_em_andamento(andamento);
  end if;
  perform private.conferir_sequencia_do_processo(andamento);
end $$;

-- Igual ao do ticket 02, chamando a sequência que serve ao setor ou ao processo.
create or replace function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  if new.status = old.status then
    return new;
  end if;
  perform private.conferir_transicao(old.status, new.status);
  if old.status = 'pendente' then
    perform private.conferir_sequencia(new);
  end if;
  perform private.conferir_dispensa(new);
  if new.status = 'em_andamento' then
    new.iniciada_em := current_date;
  else
    new.resolvida_em := current_date;
  end if;
  return new;
end $$;

-- Os campos legíveis do evento: do setor (id e sigla) ou do processo (id, nome e sigla do setor), mais a etapa.
create function private.base_do_evento_do_andamento(andamento public.andamentos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when andamento.processo_id is null then
    (select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla, 'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
      from public.setores s, public.etapas e where s.id = andamento.setor_id and e.id = andamento.etapa_id)
  else
    (select jsonb_build_object('processo_id', p.id, 'processo_nome', p.nome, 'setor_sigla', s.sigla,
        'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
      from public.processos p join public.setores s on s.id = p.setor_id, public.etapas e
      where p.id = andamento.processo_id and e.id = andamento.etapa_id)
  end $$;

-- Igual ao do ticket 02, com a base acima; a referência 'dono:andamento' deixa o histórico filtrar pelo setor ou pelo processo.
create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  antes jsonb;
  depois jsonb;
begin
  antes := base || jsonb_build_object('status', old.status, 'iniciada_em', old.iniciada_em, 'resolvida_em', old.resolvida_em);
  depois := base || jsonb_build_object('status', new.status, 'iniciada_em', new.iniciada_em, 'resolvida_em', new.resolvida_em);
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old.status, new.status), 'andamento',
    coalesce(new.setor_id, new.processo_id)::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', new.nota));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- As conferências rodam com a permissão de quem altera; as funções de evento só o gatilho chama.
revoke execute on function private.conferir_uma_em_andamento(public.andamentos), private.conferir_setor_resolvido(uuid),
  private.conferir_sequencia_do_processo(public.andamentos), private.conferir_sequencia(public.andamentos)
  from public, anon;
grant execute on function private.conferir_uma_em_andamento(public.andamentos), private.conferir_setor_resolvido(uuid),
  private.conferir_sequencia_do_processo(public.andamentos), private.conferir_sequencia(public.andamentos)
  to authenticated;
revoke execute on function private.base_do_evento_do_andamento(public.andamentos) from public, anon, authenticated;
```

Observação para quem executa: `preparar_andamento` e `registrar_evento_do_andamento` continuam com os `revoke` do ticket 02 (`create or replace` preserva os privilégios). O `conferir_anterior_resolvida` do ticket 02 não muda.

- [ ] **Step 5: Rodar o teste e ver o resultado antes/depois da migração**

Primeiro, só os testes novos, para ver a falha esperada: `git add supabase/tests && git commit -m "Ticket 05 de processos-etapas: testes de banco do andamento do processo"`, `git push -u origin processos-etapas-05` e disparar "Testes de banco" na branch (Run workflow). Esperado: o teste 18 **falha** (o gatilho ainda não conhece o processo; a política ainda recusa). Depois de conferir a falha, passar para o Step 6.

- [ ] **Step 6: Aplicar a migração no desenvolvimento e rodar os testes**

Commitar a migração; push; disparar "Migrar banco de desenvolvimento" com o nome do arquivo novo; conferir que terminou; disparar "Testes de banco". Esperado: todos os testes passam (17 com 79, 18 com 25, `00_rls_ligada` e `10_privilegios_padrao` sem mudança). Falhou? Ler o resultado, corrigir o teste ou a **nova migração** (migração já aplicada não se edita: a correção vira migração nova).

- [ ] **Step 7: Tipos e registro**

`npm run db:types` (alvo conferido: desenvolvimento). Esperado: sem diferença em `src/types/database.ts` (nenhuma tabela, coluna ou view mudou). Registrar a migração em `supabase/AMBIENTES.md` na lista de "aplicadas fora do histórico da CLI", como as anteriores. Commit: teste, migração, registro (e tipos, se mudaram) — `Ticket 05 de processos-etapas: andamento do processo no banco`.

---

### Task 2: Módulo real — recusas novas e histórico com as etapas

**Files:**
- Modify: `src/processos/processosSupabase.ts`, `src/processos/processosSupabase.test.ts`
- Modify: `src/processos/lerProcessoSupabase.ts`, `src/processos/lerProcessoSupabase.test.ts`
- Modify: `src/testes/ClienteSupabaseFalso.ts`
- Modify: `src/cadastros/historicoDosCadastros.ts`, `src/cadastros/historicoDosCadastros.test.ts`

**Interfaces:**
- Consumes: as exceções da Task 1.
- Produces: `iniciarEtapa/concluirEtapa/dispensarEtapa/registrarRealizadaAnteriormente` lançam `TravaDoBanco` com as frases do ticket; `lerHistoricoDoProcesso(id)` devolve também os eventos `entidade = 'andamento'` cuja `entidade_ref` começa por `<id>:`.

- [ ] **Step 1: Testes das duas frases** — em `processosSupabase.test.ts`, depois do teste "dispensar etapa obrigatória vira a frase da spec":

```ts
test('iniciar a primeira etapa com o setor pendente vira a frase com a sigla', async () => {
  const cliente = clienteQueRecusa({ message: 'setor_nao_resolveu:TSA', code: 'P0001' })
  const falha = await criar(cliente).iniciarEtapa('a4').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('O setor TSA ainda não resolveu as etapas do setor.')
})

test('segunda etapa em andamento vira a frase com o nome da que está em andamento', async () => {
  const cliente = clienteQueRecusa({ message: 'ja_ha_etapa_em_andamento:Reunião de modelagem', code: 'P0001' })
  await expect(criar(cliente).iniciarEtapa('a5')).rejects
    .toThrow('Já há uma etapa em andamento neste processo: Reunião de modelagem.')
})
```
Rodar `npx vitest run src/processos/processosSupabase.test.ts`: os dois falham.

- [ ] **Step 2: Implementar** — em `processosSupabase.ts` trocar o padrão e o mapa:

```ts
// O banco recusa a sequência e a dispensa com "motivo:valor" (migrações etapas_do_setor e andamento_do_processo).
const PADRAO_DA_RECUSA = /\b(anterior_nao_resolvida|etapa_obrigatoria|setor_nao_resolveu|ja_ha_etapa_em_andamento):(.*)$/m

const FRASE_DA_RECUSA: Record<string, (valor: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
  setor_nao_resolveu: (sigla) => `O setor ${sigla} ainda não resolveu as etapas do setor.`,
  ja_ha_etapa_em_andamento: (etapa) => `Já há uma etapa em andamento neste processo: ${etapa}.`,
}
```
(o resto de `falhaDoAndamento` não muda). Rodar o arquivo: passa.

- [ ] **Step 3: Cliente falso com `like`** — em `ClienteSupabaseFalso.ts`, acrescentar ao tipo `Pedido` a linha `/** O filtro `like` (coluna e padrão). */ parecido?: [string, string]` e ao objeto `consulta`: `like: (coluna: string, padrao: string) => Object.assign(pedido, { parecido: [coluna, padrao] }) && consulta,`.

- [ ] **Step 4: Teste e implementação do histórico** — em `lerProcessoSupabase.test.ts`, trocar a asserção do pedido do teste "o histórico do processo vem do mais recente ao mais antigo, só dos eventos dele" por:

```ts
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'eventos', dentro: ['entidade', ['processo', 'andamento']], parecido: ['entidade_ref', 'p1%'],
    ordem: [['ocorrido_em', false], ['id', false]],
  })
```
Rodar: falha. Em `lerProcessoSupabase.ts`, em `lerHistoricoDoProcesso`, trocar `.eq('entidade', 'processo').eq('entidade_ref', id)` por:

```ts
    // A referência do processo é o id; a das etapas dele, 'id:andamento' (migração andamento_do_processo).
    .in('entidade', ['processo', 'andamento']).like('entidade_ref', `${id}%`)
```
Rodar: passa.

- [ ] **Step 5: Nome do item do evento de etapa de processo** — teste em `historicoDosCadastros.test.ts` (seguir o formato dos testes vizinhos de `nomeDoItem`):

```ts
test('o nome do item do evento de etapa de processo traz o processo, não o setor', () => {
  const evento: EventoDoCadastro = {
    id: 1, ocorridoEm: '2026-10-14T13:00:00Z', autor: null, acao: 'iniciar', entidade: 'andamento',
    entidadeRef: 'p1:a4', antes: null,
    depois: { processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', etapa_nome: 'Reunião de modelagem' },
  }
  expect(nomeDoItem(evento)).toBe('Reunião de modelagem — Emitir Ofício')
})
```
(importar `nomeDoItem` e `EventoDoCadastro` se faltarem.) Falha. Em `historicoDosCadastros.ts`, `nomeDoItemDoSetor` passa a se chamar `nomeDoItemComDono` e o `andamento` usa o processo quando há:

```ts
// Etapa e responsável pertencem a um setor (a etapa, também a um processo): o nome vem com o dono; null se não for deles.
function nomeDoItemComDono(entidade: string, estado: Record<string, unknown>): string | null {
  const nomes: Record<string, unknown> = { andamento: estado.etapa_nome, responsavel_do_setor: estado.nome }
  const nome = nomes[entidade]
  if (typeof nome !== 'string') return null
  return `${nome} — ${texto(estado.processo_nome ?? estado.setor_sigla)}`
}
```
e atualizar a chamada em `nomeDoItem`. Rodar `npx vitest run src/cadastros src/processos`: passa.

- [ ] **Step 6: Commit** — `git add src && git commit -m "Ticket 05 de processos-etapas: recusas e histórico do andamento no módulo"` (o pre-commit roda lint, tipos e testes).

---

### Task 3: Módulo falso — a ação anda com o processo

**Files:**
- Create: `src/processos/andamentoFalso.ts`, `src/processos/andamentoFalso.test.ts`
- Modify: `src/processos/ProcessosFalso.ts` (método `mudar`)

**Interfaces:**
- Produces: `mudarEtapaDoProcesso(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): ProcessoLido` (devolve o mesmo objeto se a etapa não é do processo; senão recalcula `etapaAtual` e `situacao`) e `atualizarSetorDoProcesso(processo: ProcessoLido, etapasDoSetor: EtapaDoSetor[]): ProcessoLido` (recalcula `etapasDoSetor` e `aguardandoOSetor`).

- [ ] **Step 1: Teste (falha)** — `andamentoFalso.test.ts`:

```ts
import { expect, test } from 'vitest'
import { atualizarSetorDoProcesso, mudarEtapaDoProcesso } from './andamentoFalso'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido } from './tipos'

function etapa(ordem: number, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo: `c${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria: true, status: 'pendente',
    nota: null, iniciadaEm: null, resolvidaEm: null, responsavelNome: null, ...mudancas,
  }
}

const PROCESSO: ProcessoLido = {
  id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
  macroprocessoNome: 'Macro', situacao: 'em_andamento', etapaAtual: { codigo: 'c4', nome: 'Etapa 4', ordem: 4 },
  aguardandoOSetor: false, responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null,
  etapasDoSetor: [], etapasDoProcesso: [etapa(4), etapa(5), etapa(9, { obrigatoria: false })],
}

test('concluir a etapa atual passa a atual para a seguinte', () => {
  const depois = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  expect(depois.etapaAtual).toEqual({ codigo: 'c5', nome: 'Etapa 5', ordem: 5 })
  expect(depois.situacao).toBe('em_andamento')
})

test('com as obrigatórias resolvidas o processo é concluído, mesmo com a opcional pendente', () => {
  const quase = mudarEtapaDoProcesso(PROCESSO, 'a4', { status: 'concluida' })
  const depois = mudarEtapaDoProcesso(quase, 'a5', { status: 'realizada_anteriormente' })
  expect(depois.situacao).toBe('concluido')
  expect(depois.etapaAtual?.codigo).toBe('c9')
})

test('etapa de outro processo não muda nada', () => {
  expect(mudarEtapaDoProcesso(PROCESSO, 'x', { status: 'concluida' })).toBe(PROCESSO)
})

test('o processo aguarda o setor enquanto uma etapa do setor está pendente ou em andamento', () => {
  const doSetor = (status: EtapaDoSetor['status']): EtapaDoSetor[] => [{
    id: 's1', codigo: 'c1', nome: 'Etapa do setor', ordem: 1, obrigatoria: true, status, nota: null, iniciadaEm: null, resolvidaEm: null,
  }]
  expect(atualizarSetorDoProcesso(PROCESSO, doSetor('em_andamento')).aguardandoOSetor).toBe(true)
  expect(atualizarSetorDoProcesso(PROCESSO, doSetor('concluida')).aguardandoOSetor).toBe(false)
})
```
Rodar `npx vitest run src/processos/andamentoFalso.test.ts`: falha (módulo não existe).

- [ ] **Step 2: Implementar** — `andamentoFalso.ts`:

```ts
import { indiceDaEtapaAtual } from './caminhoDeEtapas'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido, StatusDaEtapa } from './tipos'

const RESOLVIDOS: StatusDaEtapa[] = ['concluida', 'realizada_anteriormente', 'dispensada']

/** Aplica a mudança à etapa do processo e recalcula, como a view, a etapa atual e o "concluído". */
export function mudarEtapaDoProcesso(processo: ProcessoLido, id: string, mudancas: Partial<EtapaDoProcesso>): ProcessoLido {
  if (!processo.etapasDoProcesso.some((etapa) => etapa.id === id)) return processo
  const etapasDoProcesso = processo.etapasDoProcesso.map((etapa) => (etapa.id === id ? { ...etapa, ...mudancas } : etapa))
  const atual = etapasDoProcesso[indiceDaEtapaAtual(etapasDoProcesso)]
  const concluido = etapasDoProcesso.every((etapa) => !etapa.obrigatoria || RESOLVIDOS.includes(etapa.status))
  return {
    ...processo, etapasDoProcesso,
    etapaAtual: atual ? { codigo: atual.codigo, nome: atual.nome, ordem: atual.ordem } : null,
    situacao: concluido && processo.situacao === 'em_andamento' ? 'concluido' : processo.situacao,
  }
}

/** As etapas do setor mudaram: o processo aguarda o setor enquanto alguma delas não estiver resolvida. */
export function atualizarSetorDoProcesso(processo: ProcessoLido, etapasDoSetor: EtapaDoSetor[]): ProcessoLido {
  return { ...processo, etapasDoSetor, aguardandoOSetor: etapasDoSetor.some((etapa) => !RESOLVIDOS.includes(etapa.status)) }
}
```
Rodar: passa.

- [ ] **Step 3: Ligar no `ProcessosFalso.mudar`** — importar as duas funções e trocar o corpo do método `mudar` por:

```ts
  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoSetor>): void {
    this.conferirGravacao()
    this.chamadas.push(chamada)
    for (const [setorId, etapas] of Object.entries(this.etapasDoSetor)) {
      this.etapasDoSetor[setorId] = etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa))
    }
    // Só o setor que tem etapas cadastradas no falso recalcula "aguardando o setor"; o que o teste montou à mão fica como está.
    this.processos = this.processos.map((processo) => {
      const comEtapa = mudarEtapaDoProcesso(processo, chamada.id, mudancas)
      const doSetor = this.etapasDoSetor[processo.setorId]
      return doSetor ? atualizarSetorDoProcesso(comEtapa, doSetor) : comEtapa
    })
  }
```
Rodar `npx vitest run src`: tudo passa (os testes antigos não mudam). Commit: `Ticket 05 de processos-etapas: módulo falso anda com o processo`.

---

### Task 4: Tela — ações no painel e testes do aplicativo inteiro

**Files:**
- Rename: `src/components/processos/CaminhoDoSetor.tsx` → `CaminhoDeEtapas.tsx` (`git mv`)
- Modify: `EtapasDoSetor.tsx`, `CaminhoDoProcesso.tsx`, `PainelDoProcesso.tsx` (em `src/components/processos/`)
- Create: `src/App.andamentoDoProcesso.test.tsx`

**Interfaces:**
- Produces: `CaminhoDeEtapas({ processos, etapas, podeAlterar, aoMudar, aoSumir })` com `etapas: EtapaDoCaminho[]` (`EtapaDoSetor & { responsavelNome?: string | null }`); mostra "Responsável: …" quando `responsavelNome` está definido (etapas do processo).
  `CaminhoDoProcesso({ processo, processos, podeAlterar, aoMudar, aoSumir })`.

- [ ] **Step 1: Testes de tela (falham)** — `src/App.andamentoDoProcesso.test.tsx` (cabeçalho e fixtures no estilo de `App.painelDoProcesso.test.tsx` e `App.quadro.test.tsx`):

```tsx
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoProcesso, EtapaDoSetor, ProcessoLido } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/processos/p1'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function doProcesso(ordem: number, codigo: string, nome: string, mudancas: Partial<EtapaDoProcesso> = {}): EtapaDoProcesso {
  return {
    id: `a${ordem}`, codigo, nome, ordem, obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null,
    resolvidaEm: null, responsavelNome: null, ...mudancas,
  }
}

const SETOR_PENDENTE: EtapaDoSetor = {
  id: 's3', codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3, obrigatoria: true,
  status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null,
}

function processo(mudancas: Partial<ProcessoLido> = {}): ProcessoLido {
  return {
    id: 'p1', nome: 'Emitir Ofício', tipo: 'processo', setorId: 's1', setorSigla: 'TSA', macroprocessoId: 'm1',
    macroprocessoNome: 'Macro de Teste', situacao: 'em_andamento',
    etapaAtual: { codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4 }, aguardandoOSetor: false,
    responsavel: null, origem: 'novo', contexto: null, observacoes: null, motivoDaSituacao: null, etapasDoSetor: [],
    etapasDoProcesso: [
      doProcesso(4, 'modelagem', 'Reunião de modelagem'),
      doProcesso(5, 'relatorio', 'Relatório e modelagem técnica'),
      doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
    ],
    ...mudancas,
  }
}

type Montagem = { perfil?: Perfil; processos?: ProcessoLido[]; ajustar?: (falso: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', processos = [processo()], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const falso = new ProcessosFalso()
  falso.processos = processos
  falso.etapasDoCatalogo = [
    { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, ativa: true },
    { id: 'e5', codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5, ativa: true },
    { id: 'e9', codigo: 'publicacao', nome: 'Publicação', ordem: 9, ativa: true },
  ]
  ajustar?.(falso)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={falso} />)
  return falso
}

const painel = async () => within(await screen.findByRole('complementary', { name: 'Painel do processo' }))
async function etapa(nome: string) {
  const caminho = within(await (await painel()).findByRole('region', { name: 'Caminho de etapas' }))
  return within((await caminho.findByText(nome)).closest('li') as HTMLElement)
}

test('a etapa atual pendente tem Iniciar e Realizada anteriormente; a obrigatória não tem Dispensar; as outras não têm ação', async () => {
  montar()
  const atual = await etapa('Reunião de modelagem')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Iniciar', 'Realizada anteriormente'])
  expect((await etapa('Relatório e modelagem técnica')).queryAllByRole('button')).toEqual([])
})

test('a etapa atual opcional tem Dispensar', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  expect((await etapa('Publicação')).getByRole('button', { name: 'Dispensar' })).toBeTruthy()
})

test('Iniciar grava, a etapa passa a em andamento e ganha Concluir', async () => {
  const falso = montar()
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
  const atual = await etapa('Reunião de modelagem')
  expect(await atual.findByRole('button', { name: 'Concluir' })).toBeTruthy()
  expect(atual.getByText('Em andamento')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'iniciar', id: 'a4' }])
})

test('Concluir passa a etapa atual para a seguinte e o cartão muda de coluna no Quadro', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    doProcesso(5, 'relatorio', 'Relatório e modelagem técnica'),
  ] })] })
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Concluir' }))
  expect(await (await etapa('Relatório e modelagem técnica')).findByRole('button', { name: 'Iniciar' })).toBeTruthy()
  const coluna = within(screen.getByRole('region', { name: 'Relatório e modelagem técnica' }))
  expect(coluna.getByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})

test('Dispensar e Realizada anteriormente pedem nota: vazia não grava, com nota grava e mostra a nota', async () => {
  const falso = montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ] })] })
  fireEvent.click((await etapa('Publicação')).getByRole('button', { name: 'Dispensar' }))
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Publicação?' }))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Sem publicação' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(await (await etapa('Publicação')).findByText('Nota: Sem publicação')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'dispensar', id: 'a9', nota: 'Sem publicação' }])
})

test('Realizada anteriormente grava com a nota', async () => {
  const falso = montar()
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog', {
    name: 'Registrar a etapa Reunião de modelagem como realizada anteriormente?' }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  expect(await (await etapa('Reunião de modelagem')).findByText('Realizada anteriormente')).toBeTruthy()
  expect(falso.chamadas).toEqual([{ acao: 'realizada', id: 'a4', nota: 'Feita em 2025' }])
})

test('resolvidas as obrigatórias, a pílula Concluído aparece no painel e o cartão sai do Quadro', async () => {
  montar({ processos: [processo({ etapasDoProcesso: [
    doProcesso(4, 'modelagem', 'Reunião de modelagem', { status: 'concluida' }),
    doProcesso(5, 'relatorio', 'Relatório e modelagem técnica', { status: 'em_andamento', iniciadaEm: '2026-10-13' }),
    doProcesso(9, 'publicacao', 'Publicação', { obrigatoria: false }),
  ], etapaAtual: { codigo: 'relatorio', nome: 'Relatório e modelagem técnica', ordem: 5 } })] })
  fireEvent.click((await etapa('Relatório e modelagem técnica')).getByRole('button', { name: 'Concluir' }))
  expect(await (await painel()).findByText('Concluído')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Emitir Ofício/ })).toBeNull()
})

test('cada recusa do banco aparece como alerta, sem mudar a etapa', async () => {
  const recusas = [
    'O setor TSA ainda não resolveu as etapas do setor.',
    'Já há uma etapa em andamento neste processo: Reunião de modelagem.',
    'A etapa Reunião de modelagem ainda não foi resolvida.',
    'A etapa Publicação é obrigatória e não pode ser dispensada.',
  ]
  for (const frase of recusas) {
    const falso = montar({ ajustar: (f) => { f.falhaDeGravacao = new TravaDoBanco(frase) } })
    fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
    expect((await (await painel()).findByRole('alert')).textContent).toBe(frase)
    expect((await etapa('Reunião de modelagem')).getByText('Pendente')).toBeTruthy()
    expect(falso.chamadas).toEqual([])
    cleanup()
  }
})

test('falha comum de gravação mostra o motivo', async () => {
  montar({ ajustar: (f) => { f.falhaDeGravacao = 'sem conexão' } })
  fireEvent.click((await etapa('Reunião de modelagem')).getByRole('button', { name: 'Iniciar' }))
  expect((await (await painel()).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('a Consulta vê o caminho sem nenhuma ação', async () => {
  montar({ perfil: 'consulta' })
  expect((await etapa('Reunião de modelagem')).queryAllByRole('button')).toEqual([])
})

test('o processo sai de "Aguardando o setor" quando o setor resolve as etapas', async () => {
  window.location.hash = '#/setores'
  const falso = montar({ processos: [processo({ aguardandoOSetor: true, etapasDoSetor: [SETOR_PENDENTE] })], ajustar: (f) => {
    f.etapasDoSetor = { s1: [SETOR_PENDENTE] }
  } })
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  const secao = within(await screen.findByRole('region', { name: 'Etapas do setor' }))
  const linha = within((await secao.findByText('Identificação dos processos')).closest('li') as HTMLElement)
  fireEvent.click(linha.getByRole('button', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog'))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita antes' } })
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  await linha.findByText('Realizada anteriormente')
  expect(falso.processos[0].aguardandoOSetor).toBe(false)
  window.location.hash = '#/processos'
  const coluna = within(await screen.findByRole('region', { name: 'Reunião de modelagem' }))
  expect(coluna.getByRole('link', { name: /Emitir Ofício/ })).toBeTruthy()
})
```
Rodar `npx vitest run src/App.andamentoDoProcesso.test.tsx`: falham (o painel ainda não tem ações). Ajuste fino dos seletores permitido (por exemplo, o nome acessível do botão da janela de nota), sem mudar o que cada teste prova.

- [ ] **Step 2: Renomear e generalizar o caminho** — `git mv src/components/processos/CaminhoDoSetor.tsx src/components/processos/CaminhoDeEtapas.tsx`; dentro dele:
  - `export function CaminhoDoSetor` → `export function CaminhoDeEtapas`; `type CaminhoDoSetorProps` → `CaminhoDeEtapasProps`; comentário: "O caminho de etapas (do setor ou do processo): só a etapa atual tem ações; …";
  - acrescentar `type EtapaDoCaminho = EtapaDoSetor & { responsavelNome?: string | null }` e usar `etapas: EtapaDoCaminho[]` em `CaminhoDeEtapasProps`;
  - no `<LinhaDaEtapa ... />` do `map`, acrescentar `responsavelNome={etapa.responsavelNome}` (indefinido nas do setor: a linha não mostra "Responsável").
  Em `EtapasDoSetor.tsx`: importar `CaminhoDeEtapas` de `./CaminhoDeEtapas` e usá-lo no lugar de `CaminhoDoSetor`.

- [ ] **Step 3: Painel com as ações** — `CaminhoDoProcesso.tsx` passa a:

```tsx
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { CaminhoDeEtapas } from './CaminhoDeEtapas'
import { LinhaDaEtapa } from './LinhaDaEtapa'

const SEM_ACOES: never[] = []
const NADA_A_FAZER = () => undefined

type CaminhoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

/**
 * O caminho do processo no painel: as etapas do setor primeiro, só para leitura, com o caminho para a tela do setor;
 * depois as do processo, com as ações na etapa atual para quem pode alterar (a RLS é quem protege).
 */
export function CaminhoDoProcesso({ processo, processos, podeAlterar, aoMudar, aoSumir }: CaminhoDoProcessoProps) {
  return (
    <section className="painel-caminho" aria-label="Caminho de etapas">
      <div className="painel-caminho-titulo">
        <h3 className="painel-subtitulo">Etapas do setor</h3>
        <a className="painel-link" href={`#/setores/${processo.setorId}`}>Ver no setor</a>
      </div>
      <ol className="caminho-de-etapas">
        {processo.etapasDoSetor.map((etapa) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={false} acoes={SEM_ACOES} aoAgir={NADA_A_FAZER} />
        ))}
      </ol>
      <h3 className="painel-subtitulo">Etapas do processo</h3>
      <CaminhoDeEtapas processos={processos} etapas={processo.etapasDoProcesso} podeAlterar={podeAlterar}
        aoMudar={aoMudar} aoSumir={aoSumir} />
    </section>
  )
}
```
Em `PainelDoProcesso.tsx`, `DetalhesDoProcesso`: trocar `<CaminhoDoProcesso processo={processo} />` por

```tsx
      <CaminhoDoProcesso processo={processo} processos={processos} podeAlterar={podeAlterar} aoSumir={aoSumir}
        aoMudar={() => { aoAtualizar(); aoMudar() }} />
```
(`aoAtualizar` recarrega o painel, `aoMudar` recarrega o Quadro atrás). Rodar `npx vitest run src/App.andamentoDoProcesso.test.tsx src/App.painelDoProcesso.test.tsx src/App.etapasDoSetor.test.tsx`: passam. O teste do painel "o caminho mostra… e `caminho.queryAllByRole('button')` vazio" continua verdadeiro? Ele monta o processo com `etapa atual` em andamento e perfil integrante: agora o painel mostra Concluir/Realizada anteriormente. **Atualizar esse teste**: trocar a última asserção por `expect(caminho.getAllByRole('button').map((b) => b.textContent)).toEqual(['Concluir', 'Realizada anteriormente'])` (e ele deixa de dizer "só leitura" para o processo; o setor segue só leitura, como o próprio título do teste ajustado diz).

- [ ] **Step 4: Rodar tudo** — `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular`. Esperado: tudo verde. Commit: `Ticket 05 de processos-etapas: ações das etapas no painel do processo`.

---

### Task 5: Fechamento do ticket

**Files:**
- Modify: `.scratch/processos-etapas/desvios.md` (entrada nova, datada, sem editar as antigas), `.scratch/melhorias-protocolo.md` (itens de `.claude/regras/nao-testados.md` do `/executar-complexo` que aconteceram, sem concluir se funcionaram), `.scratch/processos-etapas/issues/05-...md` (linha `Concluído em`, depois do merge)

- [ ] **Step 1: Desvios** — registrar em `desvios.md`: (a) o desvio herdado do ticket 04 foi resolvido (política relaxada, gatilhos reescritos, teste 17 sem o desvio); (b) a ordem das conferências ao iniciar (já há outra em andamento antes de "anterior não resolvida"); (c) o histórico do processo agora lê `entidade = 'andamento'` por `entidade_ref like '<id>%'`; (d) o que mais surgir na execução.
- [ ] **Step 2: Conferência visual** — o app exige login no Supabase e o navegador de visualização não tem dados: registrar de novo que o critério `[visual]` (etapa atual destacada, ✓ nas resolvidas, futuras apagadas) fica para o `/polir`.
- [ ] **Step 3: Integrar** — com `npm test` verde: `git switch main`, merge da branch (opção de merge do `finishing-a-development-branch`), `git branch -d processos-etapas-05`; `git push` da `main` (autorizado no `CLAUDE.md`); conferir o "Testes de banco" que o push em `supabase/` dispara na `main`.
- [ ] **Step 4: Marca no ticket** — na `main`, acrescentar ao fim de `issues/05-andamento-das-etapas-do-processo.md` a linha `Concluído em 2026-10-14 (commit <hash do último commit do ticket>)`, marcar as caixas dos critérios que a execução provou, comitar e fazer push.

---

## Auto-revisão

- **Cobertura do ticket:** critério 1 (pgTAP) → Task 1, teste 18 (primeira com setor pendente; a 6 com a 5 pendente; segunda em andamento; dispensar obrigatória; nota; concluído com a 9 pendente). Critério 2 (módulo real e falso, frases) → Tasks 2 e 3. Critério 3 (painel, destaque, ✓, pílula) → Task 4 (ações; destaque e ✓ já vêm do ticket 04; pílula Concluído do cabeçalho do ticket 04, provada no teste de tela). Critério 4 (Quadro) → Task 4, testes "cartão muda de coluna" e "concluído sai". Critério 5 (Consulta) → Task 4. Critério 6 (testes de tela) → Task 4.
- **Placeholders:** nenhum; os nomes de arquivo da migração dependem da data de criação (`npx supabase migration new`).
- **Consistência:** as frases do módulo (Task 2) casam com as exceções da migração (Task 1); `mudarEtapaDoProcesso` e `atualizarSetorDoProcesso` têm a mesma assinatura na Task 3 e no uso em `ProcessosFalso.mudar`; `CaminhoDeEtapas` e `CaminhoDoProcesso` têm as props definidas na Task 4.
