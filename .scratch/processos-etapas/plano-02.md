# Ticket 02 de processos-etapas (Etapas do setor) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** catálogo de etapas no banco (as 9 da fase 1) e as 3 etapas de cada setor, com sequência, dispensa e eventos impostos pelo banco, registradas na tela do setor e vistas no Histórico da área Setores.

**Architecture:** uma migração cria `etapas` e `andamentos` (só a parte do setor), gatilhos de sequência, dispensa, datas e eventos, e a política de leitura dos eventos de `andamento`. A interface ganha o terceiro módulo injetado, `ModuloDeProcessos` (`src/processos/`, real e falso), a janela com campo obrigatório (`src/components/JanelaComCampo.tsx`) e a seção "Etapas do setor" (`src/components/processos/`), montada no `SetorAberto`. O Histórico continua no módulo de cadastros, que passa a ler também a entidade `andamento`.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 31, 33, 35 a 37, 45, 69, 79, 83 a 85; "Interface", "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe", "Regras de estado") · **Ticket:** `.scratch/processos-etapas/issues/02-etapas-do-setor.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; RLS ligada e políticas na mesma migração; funções `security definer` só em `private`, `search_path` vazio, execução tirada de `public`, `anon` e `authenticated`; cada célula de "quem pode o quê" de `etapas` e `andamentos` com teste (Administrador, Integrante, Consulta, inativo, visitante); `revoke all` de visitante e logado em cada tabela nova (senão `10_privilegios_padrao` reprova); interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes de `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Sem `gh`: disparo pelo navegador do app. Produção e `migration repair` só pelo `/ship`.
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso` e `ProcessosFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40; `.tsx` fora); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos.
- Mensagens da spec, literais: "A etapa {anterior} ainda não foi resolvida.", "A etapa {nome} é obrigatória e não pode ser dispensada.", "Seu perfil não permite alterar os processos.", "Carregando etapas do setor…", "Não foi possível carregar as etapas do setor. Verifique a conexão e tente de novo." + [Tentar de novo]; textos do histórico "Iniciou a etapa", "Concluiu a etapa", "Dispensou a etapa", "Registrou a etapa como realizada anteriormente".
- Dados de teste inventados. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Só o necessário deste ticket no banco:** `processo_id` e as regras de processo ficam para o ticket 04 (o ticket permite); `setor_id` nasce `not null` e o 04 o relaxa. Privilégio de alteração em `andamentos` só para `status` e `nota`; `responsavel_id`, `iniciada_em` e `resolvida_em` existem, mas a edição (com as regras de data) é do ticket 06. As regras de catálogo (ordem setor antes de processo, etapa nova, desativar) são do ticket 10.
- **Datas:** o gatilho grava `iniciada_em` = hoje ao iniciar e `resolvida_em` = hoje ao concluir, dispensar ou registrar como realizada anteriormente (o ticket diz "gravadas com o dia da ação").
- **Recusas do banco** em `P0001` com `motivo:valor`, como as de login: `anterior_nao_resolvida:<nome>`, `etapa_obrigatoria:<nome>`, `transicao_nao_permitida:<de>:<para>`. As duas primeiras viram as frases da spec; a terceira a tela nunca oferece e cai na mensagem genérica. Nota vazia em dispensada ou realizada anteriormente: restrição `andamentos_nota_obrigatoria` (23514); a tela já impede.
- **Perfil:** a política de alteração de `andamentos` reaproveita `private.pode_alterar_cadastros()` (administrador e integrante ativos, a mesma regra que a spec dá a processos).
- **Eventos só nas mudanças de status** (gatilho depois de alterar). Os andamentos nascem com o setor e somem com ele: o evento do setor já conta isso. `acao`: `iniciar`, `concluir`, `dispensar`, `registrar_realizada` (e `editar` se só a nota mudar). `entidade_ref = '<setor_id>:<andamento_id>'`, no molde do vínculo, para o filtro do histórico achar o setor. `detalhes = {antes, depois, motivo}`; antes e depois trazem `setor_id`, `setor_sigla`, `etapa_codigo`, `etapa_nome`, `status`, `iniciada_em`, `resolvida_em`; `motivo` é a nota.
- **Histórico:** o evento mostra "{ação} {etapa} — {SIGLA}", antes e depois sem o código e o nome da etapa (já estão no título), datas em DD/MM/AAAA, e a linha "Nota: …" quando há. `EventoDoCadastro` ganha `motivo?: string`.
- **Teste antigo afetado (critério 3):** `03_login_leitura` conta "todos os eventos menos os dos cadastros" para o Integrante; com a entidade `andamento` liberada, passa a contar só `usuario` e `autorizacao`. Os outros testes que contam tabelas inteiras (`setores`, `eventos`) não mudam: o andamento nasce sem evento.
- **Tela:** a seção "Etapas do setor" fica abaixo do setor aberto (edição e só leitura). Só a etapa atual (a primeira não resolvida) tem ações: [Iniciar] se pendente, [Concluir] se em andamento, [Dispensar] se opcional e [Realizada anteriormente]. Janelas: "Dispensar a etapa {nome}?" [Dispensar] e "Registrar a etapa {nome} como realizada anteriormente?" [Registrar], campo "Nota". Pílula de status: Pendente e Dispensada neutras, Em andamento informativa, Concluída e Realizada anteriormente aprovado.
- **Injeção:** `App` recebe `processos` como prop obrigatória; os testes de tela existentes ganham `processos={new ProcessosFalso()}` por substituição mecânica.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/15_etapas_do_setor.test.sql` (novo) | pgTAP: quem pode o quê, sequência, dispensa, datas, eventos |
| `supabase/tests/03_login_leitura.test.sql` | contagem de eventos do Integrante restrita a usuários e autorizações |
| `supabase/migrations/<data>_etapas_do_setor.sql` (novo) | tipos, tabelas, carga, RLS, gatilhos, política de eventos |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `src/processos/tipos.ts` (novo) | `StatusDaEtapa`, `EtapaDoSetor`, `ModuloDeProcessos` |
| `src/processos/processosSupabase.ts` (+ `.test.ts`) (novo) | leitura, ações e tradução das recusas |
| `src/processos/ProcessosFalso.ts` (novo) | módulo falso para os testes de tela |
| `src/processos/caminhoDeEtapas.ts` (+ `.test.ts`) (novo) | etapa atual, ações possíveis, rótulos de status, data |
| `src/components/JanelaComCampo.tsx` (+ `.test.tsx`) (novo), `JanelaDeConfirmacao.css` | janela com campo obrigatório |
| `src/components/processos/EtapasDoSetor.tsx`, `CaminhoDoSetor.tsx`, `LinhaDaEtapa.tsx`, `Etapas.css` (novos) | seção da tela do setor |
| `src/App.tsx`, `src/main.tsx`, `AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx` | injeção do módulo e montagem da seção |
| `src/App*.test.tsx` (existentes) | `processos={new ProcessosFalso()}` |
| `src/App.etapasDoSetor.test.tsx` (novo) | testes de tela das etapas do setor |
| `src/cadastros/historicoSupabase.ts`, `historicoDosCadastros.ts`, `tipos.ts`, `ListaDoHistorico.tsx` (+ testes) | eventos de `andamento` no Histórico |

---

### Task 1: Banco: catálogo, etapas do setor, regras e eventos (critérios 1 a 4)

**Files:**
- Create: `supabase/tests/15_etapas_do_setor.test.sql`, `supabase/migrations/<data>_etapas_do_setor.sql`
- Modify: `supabase/tests/03_login_leitura.test.sql:56`, `supabase/AMBIENTES.md`, `src/types/database.ts` (gerado)

**Interfaces:**
- Produces: `public.etapas (id, codigo, nome, ordem, nivel, obrigatoria, ativa, criado_em)`; `public.andamentos (id, etapa_id, setor_id, status, nota, responsavel_id, iniciada_em, resolvida_em)`; enums `nivel_da_etapa`, `status_da_etapa`; eventos `entidade = 'andamento'` como em "Decisões de execução"; recusas `anterior_nao_resolvida:<nome>` e `etapa_obrigatoria:<nome>` (P0001).
- Consumes: `private.usuario_ativo()`, `private.perfil_atual()`, `private.pode_alterar_cadastros()`.

- [x] **Step 1: pasta limpa, branch e marco.** `git status` sem mudanças; `git switch -c processos-etapas-02`; `git tag marco/2026-10-13-inicio-ticket-02-processos-etapas`.

- [x] **Step 2: teste de banco (vermelho).** Criar `supabase/tests/15_etapas_do_setor.test.sql`:

```sql
-- Etapas do setor: catálogo e andamentos, quem pode o quê, sequência, dispensa, datas e eventos
-- (processos-etapas, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(81);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
-- O inativo é administrador de propósito: a recusa dele só pode vir de estar inativo.
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

-- Setores inventados: TPA a TPC para os perfis, TRS para as regras. O gatilho dá a cada um as 3 etapas do setor.
insert into public.setores (id, sigla, nome) values
  ('5b000000-0000-0000-0000-000000000001', 'TPA', 'Setor Perfil A'),
  ('5b000000-0000-0000-0000-000000000002', 'TPB', 'Setor Perfil B'),
  ('5b000000-0000-0000-0000-000000000003', 'TPC', 'Setor Perfil C'),
  ('5b000000-0000-0000-0000-000000000004', 'TRS', 'Setor das Regras');

-- O andamento de uma etapa num setor (o id nasce pelo gatilho, então é buscado).
create function pg_temp.andamento(sigla_do_setor text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.setores s on s.id = a.setor_id
  join public.etapas e on e.id = a.etapa_id
  where s.sigla = sigla_do_setor and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

-- Catálogo: o administrador lê, cria, altera e apaga; os outros perfis ativos só leem; código e nível ninguém muda.
create function pg_temp.conferir_catalogo(id_usuario text, quem text, administrador boolean, le int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.etapas where codigo in ('identificacao_responsaveis', 'sensibilizacao',
      'identificacao_processos', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_setor',
      'aprovacao_setor', 'publicacao')), le,
    quem || case when le > 0 then ' lê o catálogo' else ' não lê o catálogo' end);
  if administrador then
    insert into _tap (linha) select lives_ok(
      $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
        values ('teste_quinze', 'Etapa Teste Quinze', 99, 'processo', false)$sql$, quem || ' cria etapa');
  else
    insert into _tap (linha) select throws_ok(
      $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
        values ('teste_dezesseis', 'Etapa Teste Dezesseis', 98, 'processo', false)$sql$,
      '42501', null, quem || ' não cria etapa');
  end if;
  with alteradas as (update public.etapas set obrigatoria = false where codigo = 'publicacao' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when administrador then 1 else 0 end,
    quem || case when administrador then ' altera a etapa' else ' não altera a etapa' end);
  insert into _tap (linha) select throws_ok(
    $sql$update public.etapas set codigo = 'outro_codigo' where codigo = 'publicacao'$sql$, '42501', null,
    quem || ' não altera o código');
  insert into _tap (linha) select throws_ok(
    $sql$update public.etapas set nivel = 'setor' where codigo = 'publicacao'$sql$, '42501', null,
    quem || ' não altera o nível');
  with apagadas as (delete from public.etapas
    where codigo = case when administrador then 'teste_quinze' else 'publicacao' end returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), case when administrador then 1 else 0 end,
    quem || case when administrador then ' apaga etapa nunca usada' else ' não apaga etapa' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_catalogo(text, text, boolean, int) to authenticated;

select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a1', 'Administrador', true, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a2', 'Integrante', false, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a3', 'Consulta', false, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a4', 'Inativo', false, 0);

-- Andamentos: Administrador e Integrante mudam o status; ninguém cria, apaga ou troca etapa e setor direto.
create function pg_temp.conferir_andamentos(id_usuario text, quem text, sigla_do_setor text, altera boolean, le int)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.andamentos a join public.setores s on s.id = a.setor_id
      where s.sigla = sigla_do_setor), le,
    quem || case when le > 0 then ' lê as etapas do setor' else ' não lê as etapas do setor' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.andamentos (etapa_id, setor_id)
      select id, '5b000000-0000-0000-0000-000000000003' from public.etapas where codigo = 'modelagem'$sql$,
    '42501', null, quem || ' não cria andamento direto');
  insert into _tap (linha) select throws_ok(
    $sql$delete from public.andamentos$sql$, '42501', null, quem || ' não apaga andamento direto');
  insert into _tap (linha) select throws_ok(
    $sql$update public.andamentos set etapa_id = etapa_id$sql$, '42501', null, quem || ' não troca a etapa');
  insert into _tap (linha) select throws_ok(
    $sql$update public.andamentos set setor_id = setor_id$sql$, '42501', null, quem || ' não troca o setor');
  with alteradas as (update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento(sigla_do_setor, 'identificacao_responsaveis') returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when altera then 1 else 0 end,
    quem || case when altera then ' inicia uma etapa do setor' else ' não inicia etapa do setor' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_andamentos(text, text, text, boolean, int) to authenticated;

select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'TPA', true, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'TPB', true, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a3', 'Consulta', 'TPC', false, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'TPC', false, 0);

-- Visitante: nem lê nem grava, no catálogo e nos andamentos.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.etapas', '42501', null, 'Visitante não lê o catálogo');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
    values ('teste_visitante', 'Etapa Visitante', 97, 'processo', false)$sql$, '42501', null, 'Visitante não cria etapa');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set nome = 'Trocado'$sql$, '42501', null, 'Visitante não altera etapa');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas$sql$, '42501', null, 'Visitante não apaga etapa');
insert into _tap (linha) select throws_ok('select 1 from public.andamentos', '42501', null,
  'Visitante não lê as etapas do setor');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.andamentos (etapa_id, setor_id) select id, '5b000000-0000-0000-0000-000000000003'
    from public.etapas where codigo = 'modelagem'$sql$, '42501', null, 'Visitante não cria andamento');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'$sql$, '42501', null, 'Visitante não altera andamento');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.andamentos$sql$, '42501', null, 'Visitante não apaga andamento');
reset role;

-- Etapa com andamento não se apaga, nem pelo dono do banco.
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'identificacao_responsaveis'$sql$, '23503', null,
  'etapa usada em algum setor não se apaga');

-- Regras, agindo como o Integrante no setor TRS.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where setor_id = '5b000000-0000-0000-0000-000000000004'
    and status = 'pendente'), 3, 'setor novo nasce com as 3 etapas do setor pendentes');
insert into _tap (linha) select is(
  (select count(*)::int from public.setores s
    where (select count(*) from public.andamentos a where a.setor_id = s.id) <> 3), 0,
  'todo setor, inclusive os que já existiam antes da migração, tem as 3 etapas do setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento' where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'P0001', 'anterior_nao_resolvida:Identificação dos responsáveis', 'iniciar a 2ª etapa com a 1ª pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
    where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'P0001', 'anterior_nao_resolvida:Identificação dos responsáveis',
  'registrar a 2ª como realizada anteriormente com a 1ª pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'concluida'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  'P0001', 'transicao_nao_permitida:pendente:concluida', 'concluir uma etapa pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'dispensada'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23514', null, 'dispensar sem nota é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = '   '
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23514', null, 'realizada anteriormente com nota em branco é recusada');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'dispensada', nota = '  Setor já conhecido  '
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  'dispensar a 1ª etapa (opcional) com nota');
insert into _tap (linha) select is(
  (select nota from public.andamentos where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')),
  'Setor já conhecido', 'a nota é guardada sem espaços nas pontas');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = 'Reunião feita em 2025'
    where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'registrar a 2ª como realizada anteriormente com a 1ª resolvida');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'dispensada', nota = 'Não se aplica'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'P0001', 'etapa_obrigatoria:Identificação dos processos', 'dispensar a etapa obrigatória é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'iniciar a 3ª com a 2ª resolvida');
reset role;

-- A trava de uma etapa em andamento por setor é do índice; o gatilho de sequência sai de cena para prová-la.
alter table public.andamentos disable trigger preparar_andamento;
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23505', null, 'uma segunda etapa em andamento no mesmo setor é recusada');
alter table public.andamentos enable trigger preparar_andamento;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'concluida'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'concluir a etapa em andamento');
insert into _tap (linha) select is(
  (select array[iniciada_em, resolvida_em] from public.andamentos
    where id = pg_temp.andamento('TRS', 'identificacao_processos')),
  array[current_date, current_date], 'iniciar e concluir gravam o dia da ação');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'P0001', 'transicao_nao_permitida:concluida:em_andamento', 'sair de uma etapa resolvida é recusado');

-- Eventos das etapas do TRS.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'andamento' and acao = 'dispensar'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  jsonb_build_object('motivo', 'Setor já conhecido',
    'antes', jsonb_build_object('setor_id', '5b000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
      'etapa_codigo', 'identificacao_responsaveis', 'etapa_nome', 'Identificação dos responsáveis',
      'status', 'pendente', 'iniciada_em', null::date, 'resolvida_em', null::date),
    'depois', jsonb_build_object('setor_id', '5b000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
      'etapa_codigo', 'identificacao_responsaveis', 'etapa_nome', 'Identificação dos responsáveis',
      'status', 'dispensada', 'iniciada_em', null::date, 'resolvida_em', current_date)),
  'dispensar gera o evento com setor, etapa, antes, depois e a nota em motivo');
insert into _tap (linha) select is(
  (select array_agg(acao order by id) from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  array['dispensar', 'registrar_realizada', 'iniciar', 'concluir'],
  'cada ação gera um evento; as recusadas, nenhum');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'
    and autor_id is distinct from '00000000-0000-0000-0000-0000000000a2'), 0,
  'o autor do evento é quem agiu');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref = '5b000000-0000-0000-0000-000000000004:' || pg_temp.andamento('TRS', 'identificacao_processos')),
  2, 'a referência do evento traz o setor e o andamento');
update public.andamentos set status = status where id = pg_temp.andamento('TRS', 'identificacao_processos');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  4, 'gravação sem mudança não gera evento');
reset role;

-- Quem lê os eventos das etapas: todo perfil ativo (o Integrante já leu acima).
create function pg_temp.eventos_das_etapas(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade = 'andamento' and entidade_ref like '5b000000-0000-0000-0000-000000000004:%';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_das_etapas(text) to authenticated;
insert into _tap (linha) select is(pg_temp.eventos_das_etapas('00000000-0000-0000-0000-0000000000a3'), 4,
  'Consulta lê os eventos das etapas do setor');
insert into _tap (linha) select is(pg_temp.eventos_das_etapas('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos das etapas do setor');

-- Excluir o setor leva as etapas dele.
delete from public.setores where sigla = 'TRS';
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where setor_id = '5b000000-0000-0000-0000-000000000004'), 0,
  'excluir o setor apaga as etapas dele');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Contagem do `plan(81)`: catálogo 4 × 6 = 24, andamentos 4 × 6 = 24, visitante 8, etapa usada 1, regras 16 (incluída a do índice), eventos 5, leitura 2, cascata 1. Se um item entrar ou sair, recontar.

Em `supabase/tests/03_login_leitura.test.sql`, linhas 53 a 57, trocar o filtro pela lista do que continua só do administrador:

```sql
insert into _tap (linha) select is(
  -- Cadastros (teste 14) e etapas do setor (teste 15) são lidos por todo perfil ativo; aqui contam só
  -- usuários e autorizações, que continuam só do administrador.
  (select count(*)::int from public.eventos where entidade in ('usuario', 'autorizacao')),
  0, 'Integrante não lê eventos de usuários nem de autorizações');
```

- [x] **Step 3: ver falhar.** `git add supabase/tests/15_etapas_do_setor.test.sql supabase/tests/03_login_leitura.test.sql`; commit "Ticket 02 de processos-etapas: teste de banco das etapas do setor"; `git push -u origin processos-etapas-02`; disparar "Testes de banco" na branch pelo navegador do app e ler o resultado. Esperado: `15_etapas_do_setor` vermelho (tabela `etapas` inexistente); os outros 15 arquivos verdes (o 03 passa com ou sem a migração).

- [x] **Step 4: migração.** `npx supabase migration new etapas_do_setor` e escrever no arquivo criado:

```sql
-- Processos e etapas, ticket 02: catálogo de etapas (carga da fase 1) e etapas do setor, com sequência, dispensa,
-- datas do dia da ação e eventos no histórico. Recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/processosSupabase.ts) ou pelo código do Postgres.
-- Ficam para depois: processo_id e regras de processo (ticket 04), edição de datas e responsável (ticket 06),
-- manutenção do catálogo (ticket 10).

create type public.nivel_da_etapa as enum ('setor', 'processo');
create type public.status_da_etapa as enum
  ('pendente', 'em_andamento', 'concluida', 'realizada_anteriormente', 'dispensada');

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null constraint etapas_codigo_formato check (codigo ~ '^[a-z0-9_]{2,40}$'),
  nome text not null constraint etapas_nome_tamanho check (char_length(nome) between 1 and 120 and nome = btrim(nome)),
  ordem integer not null constraint etapas_ordem_positiva check (ordem > 0),
  nivel public.nivel_da_etapa not null,
  obrigatoria boolean not null,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint etapas_codigo_key unique (codigo),
  constraint etapas_ordem_key unique (ordem)
);

create unique index etapas_nome_unico on public.etapas (lower(nome));

insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria) values
  ('identificacao_responsaveis', 'Identificação dos responsáveis', 1, 'setor', false),
  ('sensibilizacao', 'Reunião de sensibilização', 2, 'setor', false),
  ('identificacao_processos', 'Identificação dos processos', 3, 'setor', true),
  ('modelagem', 'Reunião de modelagem', 4, 'processo', true),
  ('relatorio_modelagem_tecnica', 'Relatório e modelagem técnica', 5, 'processo', true),
  ('revisao_interna', 'Revisão interna', 6, 'processo', true),
  ('revisao_setor', 'Revisão pelo setor', 7, 'processo', true),
  ('aprovacao_setor', 'Aprovação pelo setor', 8, 'processo', true),
  ('publicacao', 'Publicação', 9, 'processo', false);

alter table public.etapas enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, e inclui e altera só os campos editáveis (código e nível não mudam).
revoke all on public.etapas from anon, authenticated;
grant select, delete on public.etapas to authenticated;
grant insert (codigo, nome, ordem, nivel, obrigatoria, ativa) on public.etapas to authenticated;
grant update (nome, ordem, obrigatoria, ativa) on public.etapas to authenticated;

create policy "etapas: ativo lê" on public.etapas
  for select to authenticated using ((select private.usuario_ativo()));

create policy "etapas: administrador ativo cria" on public.etapas
  for insert to authenticated
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "etapas: administrador ativo altera" on public.etapas
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "etapas: administrador ativo apaga" on public.etapas
  for delete to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Uma etapa do catálogo num setor. A etapa usada não se apaga; o setor excluído leva as etapas dele.
create table public.andamentos (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references public.etapas (id) on delete restrict,
  setor_id uuid not null references public.setores (id) on delete cascade,
  status public.status_da_etapa not null default 'pendente',
  nota text constraint andamentos_nota_tamanho check (char_length(nota) <= 2000),
  responsavel_id uuid references public.usuarios (id),
  iniciada_em date,
  resolvida_em date,
  constraint andamentos_nota_obrigatoria
    check (status not in ('dispensada', 'realizada_anteriormente') or nota is not null),
  constraint andamentos_etapa_setor_key unique (etapa_id, setor_id)
);

create index andamentos_setor on public.andamentos (setor_id);
create unique index andamentos_um_em_andamento_por_setor on public.andamentos (setor_id) where status = 'em_andamento';

alter table public.andamentos enable row level security;

-- Privilégios: visitante nada; logado lê e muda só status e nota. Criar e apagar é dos gatilhos.
revoke all on public.andamentos from anon, authenticated;
grant select on public.andamentos to authenticated;
grant update (status, nota) on public.andamentos to authenticated;

create policy "andamentos: ativo lê" on public.andamentos
  for select to authenticated using ((select private.usuario_ativo()));

-- Quem registra o andamento é quem mantém os cadastros: administrador e integrante ativos (a regra da spec).
create policy "andamentos: administrador e integrante ativos alteram" on public.andamentos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Transições permitidas; voltar (sair de uma resolvida) é a função do ticket 06.
create function private.conferir_transicao(de public.status_da_etapa, para public.status_da_etapa) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if (de = 'pendente' and para = 'em_andamento') or (de = 'em_andamento' and para = 'concluida')
    or (de in ('pendente', 'em_andamento') and para in ('dispensada', 'realizada_anteriormente')) then
    return;
  end if;
  raise exception 'transicao_nao_permitida:%:%', de, para;
end $$;

-- Sair de pendente pede a anterior resolvida: a anterior é a etapa do mesmo setor com a maior ordem abaixo desta.
create function private.conferir_anterior_resolvida(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.setor_id = andamento.setor_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if found and anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

-- Só a etapa opcional se dispensa.
create function private.conferir_dispensa(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  etapa record;
begin
  select nome, obrigatoria into etapa from public.etapas where id = andamento.etapa_id;
  if andamento.status = 'dispensada' and etapa.obrigatoria then
    raise exception 'etapa_obrigatoria:%', etapa.nome;
  end if;
end $$;

-- Antes de gravar: nota sem espaços nas pontas (vazia vira nula e a restrição a exige onde é obrigatória);
-- na mudança de status, transição, sequência e dispensa conferidas e a data do dia da ação gravada.
create function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  if new.status = old.status then
    return new;
  end if;
  perform private.conferir_transicao(old.status, new.status);
  if old.status = 'pendente' then
    perform private.conferir_anterior_resolvida(new);
  end if;
  perform private.conferir_dispensa(new);
  if new.status = 'em_andamento' then
    new.iniciada_em := current_date;
  else
    new.resolvida_em := current_date;
  end if;
  return new;
end $$;

-- As conferências rodam com a permissão de quem altera (o gatilho não é security definer).
revoke execute on function private.conferir_transicao(public.status_da_etapa, public.status_da_etapa),
  private.conferir_anterior_resolvida(public.andamentos), private.conferir_dispensa(public.andamentos)
  from public, anon;
grant execute on function private.conferir_transicao(public.status_da_etapa, public.status_da_etapa),
  private.conferir_anterior_resolvida(public.andamentos), private.conferir_dispensa(public.andamentos)
  to authenticated;

create trigger preparar_andamento before update on public.andamentos
  for each row execute function private.preparar_andamento();

-- Setor novo nasce com uma etapa pendente por etapa ativa do nível setor (ninguém inclui andamentos pela API).
create function private.criar_andamentos_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.andamentos (etapa_id, setor_id)
  select id, new.id from public.etapas where nivel = 'setor' and ativa;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger criar_andamentos_do_setor after insert on public.setores
  for each row execute function private.criar_andamentos_do_setor();

-- Os setores que já existem ganham as etapas do setor agora.
insert into public.andamentos (etapa_id, setor_id)
select e.id, s.id from public.etapas e cross join public.setores s where e.nivel = 'setor' and e.ativa;

-- Ação do evento pelo status novo; sem mudança de status (só a nota), é editar.
create function private.acao_do_andamento(antes public.status_da_etapa, depois public.status_da_etapa) returns text
language sql immutable set search_path = ''
as $$ select case
  when antes = depois then 'editar'
  when depois = 'em_andamento' then 'iniciar'
  when depois = 'concluida' then 'concluir'
  when depois = 'dispensada' then 'dispensar'
  when depois = 'realizada_anteriormente' then 'registrar_realizada'
  else 'editar' end $$;

-- Evento com setor e etapa legíveis; a referência 'setor:andamento' deixa o histórico filtrar pelo setor.
create function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla, 'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
    into base
  from public.setores s, public.etapas e where s.id = new.setor_id and e.id = new.etapa_id;
  antes := base || jsonb_build_object('status', old.status, 'iniciada_em', old.iniciada_em, 'resolvida_em', old.resolvida_em);
  depois := base || jsonb_build_object('status', new.status, 'iniciada_em', new.iniciada_em, 'resolvida_em', new.resolvida_em);
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old.status, new.status), 'andamento',
    new.setor_id::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', new.nota));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_andamento(), private.criar_andamentos_do_setor(),
  private.acao_do_andamento(public.status_da_etapa, public.status_da_etapa), private.registrar_evento_do_andamento()
  from public, anon, authenticated;

create trigger registrar_evento_do_andamento after update on public.andamentos
  for each row execute function private.registrar_evento_do_andamento();

-- Todo perfil ativo lê os eventos das etapas (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê as etapas" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'andamento');
```

Atenção: `private.acao_do_andamento` é chamada dentro de uma função `security definer` (roda como dono), por isso a execução pode ficar tirada de `authenticated`. As três `conferir_*` são chamadas por `preparar_andamento`, que roda como quem altera: precisam de execução para `authenticated`.

- [ ] **Step 5: aplicar e ver passar.** Commit "Ticket 02 de processos-etapas: migração das etapas do setor"; `git push`; disparar "Migrar banco de desenvolvimento" com o nome do arquivo criado no passo 4; depois "Testes de banco" na branch. Esperado: os 16 arquivos verdes, `15_etapas_do_setor` com todos os itens passando. Se algum item falhar, corrigir com **migração nova** (a já aplicada não se edita) ou o teste, se o erro for dele.

- [ ] **Step 6: registro e tipos.** Acrescentar em `supabase/AMBIENTES.md`, na lista das migrações aplicadas à mão, a linha `- <arquivo sem .sql> (2026-10-13; processos-etapas, ticket 02; teste 15 falhou antes, tabela inexistente, e passou depois, com os 16 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento")`. Conferir o vínculo (`AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`), `npm run db:types`, `npx tsc -b` limpo (`etapas`, `andamentos` e os dois enums aparecem em `src/types/database.ts`). Commit "Ticket 02 de processos-etapas: tipos e registro da migração"; `git push`.

---

### Task 2: Módulo de processos, real e falso (critério 5)

**Files:**
- Create: `src/processos/tipos.ts`, `src/processos/processosSupabase.ts`, `src/processos/processosSupabase.test.ts`, `src/processos/ProcessosFalso.ts`

**Interfaces:**
- Consumes: `TravaDoBanco`, `ErroDoBanco`, `RecusasDoModulo`, `recusaPorPerfil`, `porQueNadaMudou` (`src/acesso/falhasDeGravacao.ts`); `CadastroInexistente` (`src/cadastros/cadastroInexistente.ts`); `ClienteSupabase` (`src/lib/supabase.ts`); `ClienteSupabaseFalso` (`src/testes/`).
- Produces:
  - `export type StatusDaEtapa = 'pendente' | 'em_andamento' | 'concluida' | 'realizada_anteriormente' | 'dispensada'`
  - `export type EtapaDoSetor = { id: string; codigo: string; nome: string; ordem: number; obrigatoria: boolean; status: StatusDaEtapa; nota: string | null; iniciadaEm: string | null; resolvidaEm: string | null }`
  - `export type ModuloDeProcessos = { lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]>; iniciarEtapa(andamentoId: string): Promise<void>; concluirEtapa(andamentoId: string): Promise<void>; dispensarEtapa(andamentoId: string, nota: string): Promise<void>; registrarRealizadaAnteriormente(andamentoId: string, nota: string): Promise<void> }`
  - `export function criarProcessosSupabase(cliente: ClienteSupabase): ModuloDeProcessos`
  - `export const RECUSAS_DOS_PROCESSOS: RecusasDoModulo`
  - `export class ProcessosFalso implements ModuloDeProcessos` com `etapasDoSetor: Record<string, EtapaDoSetor[]>`, `falharLeitura`, `segurarLeitura`, `falhaDeGravacao: string | Error | null`, `chamadas: { acao: string; id: string; nota?: string }[]`

- [ ] **Step 1: tipos.** `src/processos/tipos.ts`:

```ts
export type StatusDaEtapa = 'pendente' | 'em_andamento' | 'concluida' | 'realizada_anteriormente' | 'dispensada'

/** Uma etapa do catálogo num setor (o andamento): o id é o do andamento, que as ações recebem. */
export type EtapaDoSetor = {
  id: string
  codigo: string
  nome: string
  ordem: number
  obrigatoria: boolean
  status: StatusDaEtapa
  nota: string | null
  iniciadaEm: string | null
  resolvidaEm: string | null
}

/**
 * Único ponto por onde a interface fala com o banco em processos e etapas. Recusa do banco chega como TravaDoBanco,
 * com a frase pronta; outra falha, como Error cuja mensagem é o motivo em português;
 * etapa de um setor que já não existe, como CadastroInexistente.
 */
export type ModuloDeProcessos = {
  /** Na ordem do catálogo. */
  lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]>
  iniciarEtapa(andamentoId: string): Promise<void>
  concluirEtapa(andamentoId: string): Promise<void>
  dispensarEtapa(andamentoId: string, nota: string): Promise<void>
  registrarRealizadaAnteriormente(andamentoId: string, nota: string): Promise<void>
}
```

- [ ] **Step 2: testes do módulo real (vermelho).** `src/processos/processosSupabase.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const RESPONSAVEIS = {
  id: 'a1', status: 'dispensada', nota: 'Nota inventada', iniciada_em: null, resolvida_em: '2026-10-13',
  etapas: { codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis', ordem: 1, obrigatoria: false },
}
const IDENTIFICACAO = {
  id: 'a3', status: 'pendente', nota: null, iniciada_em: null, resolvida_em: null,
  etapas: { codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3, obrigatoria: true },
}

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

function clienteQueRecusa(erro: { message: string; code?: string }) {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: null, error: erro }
  return cliente
}

test('lê as etapas do setor na ordem do catálogo, com status, nota e datas', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.select'] = { data: [IDENTIFICACAO, RESPONSAVEIS], error: null }
  expect(await criar(cliente).lerEtapasDoSetor('s1')).toEqual([
    { id: 'a1', codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis', ordem: 1,
      obrigatoria: false, status: 'dispensada', nota: 'Nota inventada', iniciadaEm: null, resolvidaEm: '2026-10-13' },
    { id: 'a3', codigo: 'identificacao_processos', nome: 'Identificação dos processos', ordem: 3,
      obrigatoria: true, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null },
  ])
  expect(cliente.pedidos[0]).toMatchObject({ tabela: 'andamentos', filtro: ['setor_id', 's1'] })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerEtapasDoSetor('s1')).rejects.toThrow('Falha ao ler as etapas do setor: sem conexão')
})

test('cada ação grava o status, e a nota quando há, no andamento escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [{ id: 'a1' }], error: null }
  const modulo = criar(cliente)
  await modulo.iniciarEtapa('a1')
  await modulo.concluirEtapa('a1')
  await modulo.dispensarEtapa('a1', 'Setor já conhecido')
  await modulo.registrarRealizadaAnteriormente('a1', 'Feita em 2025')
  expect(cliente.pedidos.map(({ operacao, valores, filtro }) => [operacao, valores, filtro])).toEqual([
    ['update', { status: 'em_andamento' }, ['id', 'a1']],
    ['update', { status: 'concluida' }, ['id', 'a1']],
    ['update', { status: 'dispensada', nota: 'Setor já conhecido' }, ['id', 'a1']],
    ['update', { status: 'realizada_anteriormente', nota: 'Feita em 2025' }, ['id', 'a1']],
  ])
})

test('a recusa de sequência vira a frase com o nome da etapa anterior', async () => {
  const cliente = clienteQueRecusa({ message: 'anterior_nao_resolvida:Identificação dos responsáveis', code: 'P0001' })
  const falha = await criar(cliente).iniciarEtapa('a2').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('A etapa Identificação dos responsáveis ainda não foi resolvida.')
})

test('dispensar etapa obrigatória vira a frase da spec', async () => {
  const cliente = clienteQueRecusa({ message: 'etapa_obrigatoria:Identificação dos processos', code: 'P0001' })
  await expect(criar(cliente).dispensarEtapa('a3', 'Não se aplica')).rejects
    .toThrow('A etapa Identificação dos processos é obrigatória e não pode ser dispensada.')
})

test('recusa por perfil (42501) vira "Seu perfil não permite alterar os processos."', async () => {
  const cliente = clienteQueRecusa({ message: 'permission denied for table andamentos', code: '42501' })
  await expect(criar(cliente).iniciarEtapa('a1')).rejects.toThrow('Seu perfil não permite alterar os processos.')
})

test('nada mudou com a etapa ainda legível: a RLS recusou pelo perfil', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  cliente.respostas['andamentos.select'] = { data: [{ id: 'a1' }], error: null }
  const falha = await criar(cliente).concluirEtapa('a1').catch((erro: unknown) => erro)
  expect(falha).toBeInstanceOf(TravaDoBanco)
  expect((falha as Error).message).toBe('Seu perfil não permite alterar os processos.')
})

test('nada mudou e a etapa sumiu (o setor foi excluído): aviso de cadastro inexistente', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['andamentos.update'] = { data: [], error: null }
  await expect(criar(cliente).concluirEtapa('a1')).rejects.toBeInstanceOf(CadastroInexistente)
})
```

Rodar `npx vitest run src/processos/processosSupabase.test.ts`. Esperado: falha (módulo inexistente).

- [ ] **Step 3: módulo real.** `src/processos/processosSupabase.ts`:

```ts
import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import type { ClienteSupabase } from '../lib/supabase'
import type { EtapaDoSetor, ModuloDeProcessos, StatusDaEtapa } from './tipos'

// A etapa do setor só some junto com o setor: o aviso é o do cadastro excluído.
export const RECUSAS_DOS_PROCESSOS: RecusasDoModulo = {
  semPermissao: 'Seu perfil não permite alterar os processos.',
  registroInexistente: () => new CadastroInexistente(),
}

type MudancaDoAndamento = { status: StatusDaEtapa; nota?: string }

export function criarProcessosSupabase(cliente: ClienteSupabase): ModuloDeProcessos {
  return {
    lerEtapasDoSetor: (setorId) => lerEtapasDoSetor(cliente, setorId),
    iniciarEtapa: (id) => mudarAndamento(cliente, id, { status: 'em_andamento' }),
    concluirEtapa: (id) => mudarAndamento(cliente, id, { status: 'concluida' }),
    dispensarEtapa: (id, nota) => mudarAndamento(cliente, id, { status: 'dispensada', nota }),
    registrarRealizadaAnteriormente: (id, nota) => mudarAndamento(cliente, id, { status: 'realizada_anteriormente', nota }),
  }
}

type AndamentoLido = {
  id: string
  status: StatusDaEtapa
  nota: string | null
  iniciada_em: string | null
  resolvida_em: string | null
  etapas: { codigo: string; nome: string; ordem: number; obrigatoria: boolean } | null
}

// O banco não ordena o que vem embutido: a ordem do catálogo é aplicada aqui.
async function lerEtapasDoSetor(cliente: ClienteSupabase, setorId: string): Promise<EtapaDoSetor[]> {
  const { data, error } = await cliente.from('andamentos')
    .select('id, status, nota, iniciada_em, resolvida_em, etapas(codigo, nome, ordem, obrigatoria)')
    .eq('setor_id', setorId)
  if (error) throw new Error(`Falha ao ler as etapas do setor: ${error.message}`)
  return (data as AndamentoLido[]).flatMap(etapaDoSetor).sort((a, b) => a.ordem - b.ordem)
}

function etapaDoSetor({ etapas, iniciada_em, resolvida_em, ...andamento }: AndamentoLido): EtapaDoSetor[] {
  if (!etapas) return []
  return [{ ...andamento, ...etapas, iniciadaEm: iniciada_em, resolvidaEm: resolvida_em }]
}

async function mudarAndamento(cliente: ClienteSupabase, id: string, mudanca: MudancaDoAndamento): Promise<void> {
  const { data, error } = await cliente.from('andamentos').update(mudanca).eq('id', id).select('id')
  if (error) throw falhaDoAndamento(error)
  if (!data.length) throw porQueNadaMudou(await andamentoExiste(cliente, id), RECUSAS_DOS_PROCESSOS)
}

async function andamentoExiste(cliente: ClienteSupabase, id: string): Promise<boolean> {
  const { data } = await cliente.from('andamentos').select('id').eq('id', id)
  return Boolean(data?.length)
}

// O banco recusa a sequência e a dispensa com "motivo:nome da etapa" (migração etapas_do_setor).
const PADRAO_DA_RECUSA = /\b(anterior_nao_resolvida|etapa_obrigatoria):(.*)$/m

const FRASE_DA_RECUSA: Record<string, (etapa: string) => string> = {
  anterior_nao_resolvida: (etapa) => `A etapa ${etapa} ainda não foi resolvida.`,
  etapa_obrigatoria: (etapa) => `A etapa ${etapa} é obrigatória e não pode ser dispensada.`,
}

function falhaDoAndamento(erro: ErroDoBanco): Error {
  const recusa = erro.message.match(PADRAO_DA_RECUSA)
  if (recusa) return new TravaDoBanco(FRASE_DA_RECUSA[recusa[1]](recusa[2].trim()))
  return recusaPorPerfil(erro, RECUSAS_DOS_PROCESSOS.semPermissao)
}
```

Se o `tsc` reclamar do `data as AndamentoLido[]` (tipo inferido pelo supabase-js diferente), trocar por `data as unknown as AndamentoLido[]`, como em `historicoSupabase.ts`.

- [ ] **Step 4: ver passar.** `npx vitest run src/processos/processosSupabase.test.ts` verde; `npx tsc -b` limpo.

- [ ] **Step 5: módulo falso.** `src/processos/ProcessosFalso.ts`:

```ts
import type { EtapaDoSetor, ModuloDeProcessos } from './tipos'

type ChamadaDeEtapa = { acao: string; id: string; nota?: string }

// Dia fixo: os testes de tela não dependem da data em que rodam.
const HOJE = '2026-10-13'

/** Implementação falsa de processos para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class ProcessosFalso implements ModuloDeProcessos {
  /** As etapas de cada setor (pelo id do setor), na ordem do catálogo. */
  etapasDoSetor: Record<string, EtapaDoSetor[]> = {}
  falharLeitura = false
  segurarLeitura = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null
  /** As ações gravadas, na ordem. */
  chamadas: ChamadaDeEtapa[] = []

  async lerEtapasDoSetor(setorId: string): Promise<EtapaDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.etapasDoSetor[setorId] ?? [])]
  }

  async iniciarEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'iniciar', id }, { status: 'em_andamento', iniciadaEm: HOJE })
  }

  async concluirEtapa(id: string): Promise<void> {
    this.mudar({ acao: 'concluir', id }, { status: 'concluida', resolvidaEm: HOJE })
  }

  async dispensarEtapa(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'dispensar', id, nota }, { status: 'dispensada', nota, resolvidaEm: HOJE })
  }

  async registrarRealizadaAnteriormente(id: string, nota: string): Promise<void> {
    this.mudar({ acao: 'realizada', id, nota }, { status: 'realizada_anteriormente', nota, resolvidaEm: HOJE })
  }

  private mudar(chamada: ChamadaDeEtapa, mudancas: Partial<EtapaDoSetor>): void {
    if (this.falhaDeGravacao !== null) {
      throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
    }
    this.chamadas.push(chamada)
    for (const [setorId, etapas] of Object.entries(this.etapasDoSetor)) {
      this.etapasDoSetor[setorId] = etapas.map((etapa) => (etapa.id === chamada.id ? { ...etapa, ...mudancas } : etapa))
    }
  }
}
```

- [ ] **Step 6: conferir e comitar.** `npx tsc -b`, `npx eslint src/processos`; commit "Ticket 02 de processos-etapas: módulo de processos (real e falso)".

---

### Task 3: Caminho de etapas: etapa atual, ações e rótulos (critérios 5 e 7)

**Files:**
- Create: `src/processos/caminhoDeEtapas.ts`, `src/processos/caminhoDeEtapas.test.ts`

**Interfaces:**
- Consumes: `EtapaDoSetor`, `StatusDaEtapa` (Task 2).
- Produces:
  - `export type AcaoDaEtapa = 'iniciar' | 'concluir' | 'dispensar' | 'realizada'`
  - `export const ROTULO_DO_STATUS: Record<StatusDaEtapa, string>`
  - `export function indiceDaEtapaAtual(etapas: EtapaDoSetor[]): number` (−1 se todas resolvidas)
  - `export function acoesDaEtapa(etapas: EtapaDoSetor[], indice: number): AcaoDaEtapa[]`
  - `export function formatarData(data: string | null): string`

- [ ] **Step 1: testes (vermelho).** `src/processos/caminhoDeEtapas.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { ROTULO_DO_STATUS, acoesDaEtapa, formatarData, indiceDaEtapaAtual } from './caminhoDeEtapas'
import type { EtapaDoSetor, StatusDaEtapa } from './tipos'

function etapa(ordem: number, status: StatusDaEtapa, obrigatoria = false): EtapaDoSetor {
  return {
    id: `a${ordem}`, codigo: `etapa_${ordem}`, nome: `Etapa ${ordem}`, ordem, obrigatoria, status,
    nota: null, iniciadaEm: null, resolvidaEm: null,
  }
}

describe('etapa atual', () => {
  test('é a primeira não resolvida', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'dispensada'), etapa(2, 'pendente'), etapa(3, 'pendente')])).toBe(1)
    expect(indiceDaEtapaAtual([etapa(1, 'concluida'), etapa(2, 'em_andamento'), etapa(3, 'pendente')])).toBe(1)
  })

  test('com todas resolvidas, não há etapa atual', () => {
    expect(indiceDaEtapaAtual([etapa(1, 'realizada_anteriormente'), etapa(2, 'concluida')])).toBe(-1)
  })
})

describe('ações da etapa', () => {
  test('a atual pendente e opcional: iniciar, dispensar e realizada anteriormente', () => {
    expect(acoesDaEtapa([etapa(1, 'pendente'), etapa(2, 'pendente')], 0)).toEqual(['iniciar', 'dispensar', 'realizada'])
  })

  test('a atual em andamento e obrigatória: concluir e realizada anteriormente, sem dispensar', () => {
    expect(acoesDaEtapa([etapa(1, 'concluida'), etapa(2, 'em_andamento', true)], 1)).toEqual(['concluir', 'realizada'])
  })

  test('as outras etapas não têm ação', () => {
    const etapas = [etapa(1, 'concluida'), etapa(2, 'pendente'), etapa(3, 'pendente')]
    expect(acoesDaEtapa(etapas, 0)).toEqual([])
    expect(acoesDaEtapa(etapas, 2)).toEqual([])
  })
})

test('rótulos de status com o texto da tela', () => {
  expect(ROTULO_DO_STATUS).toEqual({
    pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída',
    realizada_anteriormente: 'Realizada anteriormente', dispensada: 'Dispensada',
  })
})

test('a data do banco (AAAA-MM-DD) aparece como DD/MM/AAAA; sem data, um traço', () => {
  expect(formatarData('2026-10-13')).toBe('13/10/2026')
  expect(formatarData(null)).toBe('—')
})
```

Rodar `npx vitest run src/processos/caminhoDeEtapas.test.ts`. Esperado: falha (módulo inexistente).

- [ ] **Step 2: implementar.** `src/processos/caminhoDeEtapas.ts`:

```ts
import type { EtapaDoSetor, StatusDaEtapa } from './tipos'

export type AcaoDaEtapa = 'iniciar' | 'concluir' | 'dispensar' | 'realizada'

export const ROTULO_DO_STATUS: Record<StatusDaEtapa, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  realizada_anteriormente: 'Realizada anteriormente',
  dispensada: 'Dispensada',
}

const RESOLVIDOS = new Set<StatusDaEtapa>(['concluida', 'realizada_anteriormente', 'dispensada'])

/** A etapa atual é a primeira não resolvida: a em andamento ou, sem ela, a pendente cuja anterior já se resolveu. */
export function indiceDaEtapaAtual(etapas: EtapaDoSetor[]): number {
  return etapas.findIndex((etapa) => !RESOLVIDOS.has(etapa.status))
}

/** Só a etapa atual anda; dispensar só a opcional. O banco confere tudo de novo. */
export function acoesDaEtapa(etapas: EtapaDoSetor[], indice: number): AcaoDaEtapa[] {
  if (indice !== indiceDaEtapaAtual(etapas)) return []
  const etapa = etapas[indice]
  const avancar: AcaoDaEtapa = etapa.status === 'pendente' ? 'iniciar' : 'concluir'
  return etapa.obrigatoria ? [avancar, 'realizada'] : [avancar, 'dispensar', 'realizada']
}

// O banco guarda a data como AAAA-MM-DD; a tela mostra DD/MM/AAAA.
export function formatarData(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
```

- [ ] **Step 3: ver passar e comitar.** `npx vitest run src/processos` verde; commit "Ticket 02 de processos-etapas: etapa atual, ações e rótulos".

---

### Task 4: Janela com campo obrigatório (critério 6)

**Files:**
- Create: `src/components/JanelaComCampo.tsx`, `src/components/JanelaComCampo.test.tsx`
- Modify: `src/components/JanelaDeConfirmacao.css` (estilo do campo)

**Interfaces:**
- Produces: `export function JanelaComCampo(props: { aberta: boolean; titulo: string; rotuloDoCampo: string; rotuloDaAcao: string; aoConfirmar: (texto: string) => void; aoFechar: () => void })`. `aoConfirmar` recebe o texto sem espaços nas pontas.

- [ ] **Step 1: testes (vermelho).** `src/components/JanelaComCampo.test.tsx`:

```tsx
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JanelaComCampo } from './JanelaComCampo'

afterEach(cleanup)

function montar() {
  const aoConfirmar = vi.fn()
  const aoFechar = vi.fn()
  render(
    <JanelaComCampo aberta titulo="Dispensar a etapa Etapa Teste?" rotuloDoCampo="Nota" rotuloDaAcao="Dispensar"
      aoConfirmar={aoConfirmar} aoFechar={aoFechar} />,
  )
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Etapa Teste?' }))
  return { aoConfirmar, aoFechar, janela }
}

test('abre com o foco no campo e o botão da ação desabilitado', () => {
  const { janela } = montar()
  expect(document.activeElement).toBe(janela.getByLabelText('Nota'))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
})

test('só espaços não habilitam o botão; texto habilita', () => {
  const { janela } = montar()
  const botao = janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: '   ' } })
  expect(botao.disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Setor já conhecido' } })
  expect(botao.disabled).toBe(false)
})

test('confirmar entrega o texto sem espaços nas pontas e pede para fechar', () => {
  const { aoConfirmar, aoFechar, janela } = montar()
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: '  Setor já conhecido  ' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(aoConfirmar).toHaveBeenCalledWith('Setor já conhecido')
  expect(aoFechar).toHaveBeenCalled()
})

test('Cancelar e Esc fecham sem confirmar', () => {
  const { aoConfirmar, aoFechar, janela } = montar()
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Texto' } })
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(aoFechar).toHaveBeenCalled()
  expect(aoConfirmar).not.toHaveBeenCalled()
})
```

Rodar `npx vitest run src/components/JanelaComCampo.test.tsx`. Esperado: falha (componente inexistente).

- [ ] **Step 2: implementar.** `src/components/JanelaComCampo.tsx`:

```tsx
import './JanelaDeConfirmacao.css'
import { useEffect, useId, useRef, useState } from 'react'

type JanelaComCampoProps = {
  aberta: boolean
  titulo: string
  rotuloDoCampo: string
  rotuloDaAcao: string
  /** Recebe o texto sem espaços nas pontas. */
  aoConfirmar: (texto: string) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaDeConfirmacao (ADR 0003), com um campo obrigatório: o foco abre no campo,
// o botão da ação só se habilita com texto e Esc fecha sem gravar. Fechar limpa o campo para a próxima vez.
export function JanelaComCampo({ aberta, titulo, rotuloDoCampo, rotuloDaAcao, aoConfirmar, aoFechar }: JanelaComCampoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const [texto, setTexto] = useState('')
  const idDoTitulo = useId()
  const idDoCampo = useId()

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    if (aberta && !dialogo.open) {
      dialogo.showModal()
      campo.current?.focus()
    }
    if (!aberta && dialogo.open) dialogo.close()
  }, [aberta])

  const fechar = () => {
    setTexto('')
    aoFechar()
  }
  const confirmar = () => {
    const valor = texto.trim()
    fechar()
    aoConfirmar(valor)
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={fechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      <label htmlFor={idDoCampo}>{rotuloDoCampo}</label>
      <textarea ref={campo} id={idDoCampo} className="janela-campo" rows={3} maxLength={2000} value={texto}
        onChange={(mudanca) => setTexto(mudanca.target.value)} />
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={texto.trim() === ''} onClick={confirmar}>
          {rotuloDaAcao}
        </button>
        <button type="button" className="botao botao-secundario" onClick={fechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
```

Acrescentar ao fim de `src/components/JanelaDeConfirmacao.css`:

```css
/* Campo obrigatório da JanelaComCampo (nota ou motivo). */
.janela-campo {
  display: block;
  width: 100%;
  margin-top: var(--esp-2);
  padding: var(--esp-2) var(--esp-3);
  border: 1px solid var(--linha);
  border-radius: var(--canto);
  font: inherit;
  resize: vertical;
}
```

(Se `--esp-2` não existir em `src/styles/tokens.css`, usar o menor `--esp-*` que existir.)

- [ ] **Step 3: ver passar e comitar.** `npx vitest run src/components/JanelaComCampo.test.tsx` verde; commit "Ticket 02 de processos-etapas: janela com campo obrigatório".

---

### Task 5: Etapas do setor na tela do setor (critérios 5, 7 e 9)

**Files:**
- Create: `src/components/processos/EtapasDoSetor.tsx`, `CaminhoDoSetor.tsx`, `LinhaDaEtapa.tsx`, `Etapas.css`, `src/App.etapasDoSetor.test.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`, `src/components/cadastros/AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx`, todos os `src/App*.test.tsx` que montam o `App`

**Interfaces:**
- Consumes: `ModuloDeProcessos`, `EtapaDoSetor`, `ProcessosFalso` (Task 2); `acoesDaEtapa`, `indiceDaEtapaAtual`, `ROTULO_DO_STATUS`, `formatarData`, `AcaoDaEtapa` (Task 3); `JanelaComCampo` (Task 4); `useCarregamento`, `useGravacaoComFalha`, `ErroAoCarregar`, `Pilula`.
- Produces: `App` com a prop `processos: ModuloDeProcessos`; `EtapasDoSetor({ processos, setorId, podeAlterar, aoSumir })`.

- [ ] **Step 1: injeção (sem mudar comportamento).** Em `src/App.tsx`: importar `import type { ModuloDeProcessos } from './processos/tipos'`; `type AppProps = { acesso: ModuloDeAcesso; cadastros: ModuloDeCadastros; processos: ModuloDeProcessos }`; desestruturar `processos` e passar `<AreaDeCadastros usuario={estado.usuario} cadastros={cadastros} processos={processos} />`. Em `src/main.tsx`: `import { criarProcessosSupabase } from './processos/processosSupabase'`, `const processos = criarProcessosSupabase(supabase)` e `<App acesso={acesso} cadastros={cadastros} processos={processos} />`. Em `AreaDeCadastros.tsx`: a prop `processos: ModuloDeProcessos` entra em `AreaDeCadastrosProps` e em `SecaoAtualProps`, e vai para `<AreaDeSetores cadastros={cadastros} processos={processos} podeAlterar={podeAlterar} />`. Em `AreaDeSetores.tsx`: prop `processos` em `AreaDeSetoresProps`, repassada a `<SetorAberto cadastros={cadastros} processos={processos} ... />`. Em `SetorAberto.tsx`: acrescentar `processos: ModuloDeProcessos` só ao tipo `SetorAbertoProps` (sem desestruturar ainda, para o ESLint não reclamar de variável sem uso); o passo 4 passa a usá-la.

  Nos testes de tela existentes, substituição mecânica (todas as montagens passam `cadastros={...}` sem `}` dentro):

```bash
sed -i -E '/<App /s#(cadastros=\{[^}]*\}) />#\1 processos={new ProcessosFalso()} />#' src/App*.test.tsx
sed -i "/^import { CadastrosFalso } from '.\/cadastros\/CadastrosFalso'/a import { ProcessosFalso } from './processos/ProcessosFalso'" src/App*.test.tsx
```

  Conferir com `grep -c "processos={new ProcessosFalso()}" src/App*.test.tsx` (43 montagens no total) e `npx tsc -b` limpo; `npm test` verde, com os mesmos testes de antes mais os das Tasks 2 a 4.

- [ ] **Step 2: testes de tela (vermelho).** `src/App.etapasDoSetor.test.tsx`:

```tsx
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { EtapaDoSetor } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function etapa(ordem: number, parcial: Partial<EtapaDoSetor> & Pick<EtapaDoSetor, 'codigo' | 'nome'>): EtapaDoSetor {
  return {
    id: `a${ordem}`, ordem, obrigatoria: false, status: 'pendente', nota: null, iniciadaEm: null, resolvidaEm: null,
    ...parcial,
  }
}

const RESPONSAVEIS = etapa(1, { codigo: 'identificacao_responsaveis', nome: 'Identificação dos responsáveis' })
const SENSIBILIZACAO = etapa(2, { codigo: 'sensibilizacao', nome: 'Reunião de sensibilização' })
const IDENTIFICACAO = etapa(3, { codigo: 'identificacao_processos', nome: 'Identificação dos processos', obrigatoria: true })

type Montagem = { perfil?: Perfil; etapas?: EtapaDoSetor[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', etapas = [RESPONSAVEIS, SENSIBILIZACAO, IDENTIFICACAO], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const processos = new ProcessosFalso()
  processos.etapasDoSetor = { s1: etapas }
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos} />)
  return processos
}

// Abre o setor TSA e devolve a seção "Etapas do setor".
async function abrirEtapas() {
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  return within(await screen.findByRole('region', { name: 'Etapas do setor' }))
}

async function linhaDa(secao: ReturnType<typeof within>, nome: string) {
  return within((await secao.findByText(nome)).closest('li') as HTMLElement)
}

test('a tela do setor mostra as etapas do setor na ordem, com status, datas e nota', async () => {
  montar({ etapas: [
    { ...RESPONSAVEIS, status: 'dispensada', nota: 'Setor já conhecido', resolvidaEm: '2026-10-10' },
    { ...SENSIBILIZACAO, status: 'em_andamento', iniciadaEm: '2026-10-11' },
    IDENTIFICACAO,
  ] })
  const secao = await abrirEtapas()
  const itens = await secao.findAllByRole('listitem')
  expect(itens.map((item) => item.textContent)).toEqual([
    expect.stringContaining('Identificação dos responsáveis'),
    expect.stringContaining('Reunião de sensibilização'),
    expect.stringContaining('Identificação dos processos'),
  ])
  expect(itens[0].textContent).toContain('Dispensada')
  expect(itens[0].textContent).toContain('Conclusão: 10/10/2026')
  expect(itens[0].textContent).toContain('Nota: Setor já conhecido')
  expect(itens[1].textContent).toContain('Em andamento')
  expect(itens[1].textContent).toContain('Início: 11/10/2026')
  expect(itens[1].getAttribute('aria-current')).toBe('step')
  expect(itens[2].textContent).toContain('Pendente')
})

test('só a etapa atual tem ações; sendo opcional, inclui Dispensar', async () => {
  montar()
  const secao = await abrirEtapas()
  const atual = await linhaDa(secao, 'Identificação dos responsáveis')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent))
    .toEqual(['Iniciar', 'Dispensar', 'Realizada anteriormente'])
  expect((await linhaDa(secao, 'Reunião de sensibilização')).queryAllByRole('button')).toHaveLength(0)
})

test('a etapa obrigatória não tem Dispensar', async () => {
  montar({ etapas: [{ ...RESPONSAVEIS, status: 'concluida' }, { ...SENSIBILIZACAO, status: 'concluida' }, IDENTIFICACAO] })
  const secao = await abrirEtapas()
  const atual = await linhaDa(secao, 'Identificação dos processos')
  expect(atual.getAllByRole('button').map((botao) => botao.textContent)).toEqual(['Iniciar', 'Realizada anteriormente'])
})

test('Iniciar grava e a etapa passa a em andamento, com Concluir', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  const atual = await linhaDa(secao, 'Identificação dos responsáveis')
  expect(await atual.findByRole('button', { name: 'Concluir' })).toBeTruthy()
  expect(atual.getByText('Em andamento')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'iniciar', id: 'a1' }])
})

test('Concluir grava e a próxima etapa passa a ter as ações', async () => {
  const processos = montar({ etapas: [{ ...RESPONSAVEIS, status: 'em_andamento' }, SENSIBILIZACAO, IDENTIFICACAO] })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Concluir' }))
  expect(await (await linhaDa(secao, 'Reunião de sensibilização')).findByRole('button', { name: 'Iniciar' })).toBeTruthy()
  expect((await linhaDa(secao, 'Identificação dos responsáveis')).getByText('Concluída')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'concluir', id: 'a1' }])
})

test('Dispensar abre a janela de nota: vazia não grava; com nota, grava e mostra a nota', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Dispensar' }))
  const janela = within(screen.getByRole('dialog', { name: 'Dispensar a etapa Identificação dos responsáveis?' }))
  expect(document.activeElement).toBe(janela.getByLabelText('Nota'))
  expect((janela.getByRole('button', { name: 'Dispensar' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Setor já conhecido' } })
  fireEvent.click(janela.getByRole('button', { name: 'Dispensar' }))
  expect(await secao.findByText('Nota: Setor já conhecido')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'dispensar', id: 'a1', nota: 'Setor já conhecido' }])
})

test('Esc fecha a janela de nota sem gravar', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Dispensar' }))
  const janela = screen.getByRole('dialog', { name: 'Dispensar a etapa Identificação dos responsáveis?' })
  fireEvent.change(within(janela).getByLabelText('Nota'), { target: { value: 'Rascunho' } })
  act(() => (janela as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(processos.chamadas).toEqual([])
})

test('Realizada anteriormente pede nota e grava', async () => {
  const processos = montar()
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis'))
    .getByRole('button', { name: 'Realizada anteriormente' }))
  const janela = within(screen.getByRole('dialog', {
    name: 'Registrar a etapa Identificação dos responsáveis como realizada anteriormente?' }))
  fireEvent.change(janela.getByLabelText('Nota'), { target: { value: 'Feita em 2025' } })
  fireEvent.click(janela.getByRole('button', { name: 'Registrar' }))
  expect(await (await linhaDa(secao, 'Identificação dos responsáveis')).findByText('Realizada anteriormente')).toBeTruthy()
  expect(processos.chamadas).toEqual([{ acao: 'realizada', id: 'a1', nota: 'Feita em 2025' }])
})

test('a recusa de sequência do banco aparece como alerta, sem mudar a etapa', async () => {
  montar({ ajustar: (processos) => {
    processos.falhaDeGravacao = new TravaDoBanco('A etapa Identificação dos responsáveis ainda não foi resolvida.')
  } })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A etapa Identificação dos responsáveis ainda não foi resolvida.')
  expect((await linhaDa(secao, 'Identificação dos responsáveis')).getByText('Pendente')).toBeTruthy()
})

test('falha comum de gravação mostra o motivo', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirEtapas()
  fireEvent.click((await linhaDa(secao, 'Identificação dos responsáveis')).getByRole('button', { name: 'Iniciar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('a Consulta vê as etapas do setor sem nenhuma ação', async () => {
  montar({ perfil: 'consulta' })
  const secao = await abrirEtapas()
  expect(await secao.findAllByRole('listitem')).toHaveLength(3)
  expect(secao.queryAllByRole('button')).toHaveLength(0)
})

test('enquanto carrega, mostra "Carregando etapas do setor…"', async () => {
  montar({ ajustar: (processos) => { processos.segurarLeitura = true } })
  const secao = await abrirEtapas()
  expect(secao.getByRole('status').textContent).toBe('Carregando etapas do setor…')
})

test('falha ao carregar mostra o erro e Tentar de novo carrega as etapas', async () => {
  const processos = montar({ ajustar: (falso) => { falso.falharLeitura = true } })
  const secao = await abrirEtapas()
  expect((await secao.findByRole('alert')).textContent)
    .toContain('Não foi possível carregar as etapas do setor. Verifique a conexão e tente de novo.')
  processos.falharLeitura = false
  fireEvent.click(secao.getByRole('button', { name: 'Tentar de novo' }))
  expect(await secao.findAllByRole('listitem')).toHaveLength(3)
})
```

Rodar `npx vitest run src/App.etapasDoSetor.test.tsx`. Esperado: falha (a seção "Etapas do setor" não existe).

- [ ] **Step 3: componentes.** `src/components/processos/LinhaDaEtapa.tsx`:

```tsx
import { type AcaoDaEtapa, ROTULO_DO_STATUS, formatarData } from '../../processos/caminhoDeEtapas'
import type { EtapaDoSetor, StatusDaEtapa } from '../../processos/tipos'
import { Pilula, type SituacaoPilula } from '../Pilula'

const SITUACAO_DO_STATUS: Record<StatusDaEtapa, SituacaoPilula> = {
  pendente: 'neutra',
  em_andamento: 'informativa',
  concluida: 'aprovado',
  realizada_anteriormente: 'aprovado',
  dispensada: 'neutra',
}

const ROTULO_DA_ACAO: Record<AcaoDaEtapa, string> = {
  iniciar: 'Iniciar', concluir: 'Concluir', dispensar: 'Dispensar', realizada: 'Realizada anteriormente',
}

type LinhaDaEtapaProps = { etapa: EtapaDoSetor; atual: boolean; acoes: AcaoDaEtapa[]; aoAgir: (acao: AcaoDaEtapa) => void }

/** Uma etapa do caminho: nome, status (pílula com texto), datas, nota e as ações que cabem a ela. */
export function LinhaDaEtapa({ etapa, atual, acoes, aoAgir }: LinhaDaEtapaProps) {
  return (
    <li className="etapa" aria-current={atual ? 'step' : undefined}>
      <span className="etapa-nome">{etapa.nome}</span>
      <Pilula situacao={SITUACAO_DO_STATUS[etapa.status]}>{ROTULO_DO_STATUS[etapa.status]}</Pilula>
      <span className="etapa-datas">
        Início: {formatarData(etapa.iniciadaEm)} · Conclusão: {formatarData(etapa.resolvidaEm)}
      </span>
      {etapa.nota && <p className="etapa-nota">Nota: {etapa.nota}</p>}
      {acoes.length > 0 && (
        <div className="etapa-acoes">
          {acoes.map((acao) => (
            <button key={acao} type="button" className="botao botao-secundario" onClick={() => aoAgir(acao)}>
              {ROTULO_DA_ACAO[acao]}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
```

`src/components/processos/CaminhoDoSetor.tsx`:

```tsx
import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import { type AcaoDaEtapa, acoesDaEtapa, indiceDaEtapaAtual } from '../../processos/caminhoDeEtapas'
import type { EtapaDoSetor, ModuloDeProcessos } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'
import { LinhaDaEtapa } from './LinhaDaEtapa'

type AcaoComNota = Extract<AcaoDaEtapa, 'dispensar' | 'realizada'>
type PedidoDeNota = { acao: AcaoComNota; etapa: EtapaDoSetor }

const JANELA_DA_NOTA: Record<AcaoComNota, { titulo: (nome: string) => string; rotuloDaAcao: string }> = {
  dispensar: { titulo: (nome) => `Dispensar a etapa ${nome}?`, rotuloDaAcao: 'Dispensar' },
  realizada: { titulo: (nome) => `Registrar a etapa ${nome} como realizada anteriormente?`, rotuloDaAcao: 'Registrar' },
}

type CaminhoDoSetorProps = {
  processos: ModuloDeProcessos
  etapas: EtapaDoSetor[]
  podeAlterar: boolean
  aoMudar: () => void
  aoSumir: () => void
}

/** O caminho das etapas do setor: só a etapa atual tem ações; Dispensar e Realizada anteriormente pedem nota. */
export function CaminhoDoSetor({ processos, etapas, podeAlterar, aoMudar, aoSumir }: CaminhoDoSetorProps) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [pedido, setPedido] = useState<PedidoDeNota | null>(null)
  const atual = indiceDaEtapaAtual(etapas)

  function agir(acao: AcaoDaEtapa, etapa: EtapaDoSetor) {
    if (acao === 'dispensar' || acao === 'realizada') return setPedido({ acao, etapa })
    const gravar = acao === 'iniciar' ? () => processos.iniciarEtapa(etapa.id) : () => processos.concluirEtapa(etapa.id)
    executar(gravar, aoMudar)
  }

  // A janela fecha antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  function gravarComNota(nota: string) {
    if (!pedido) return
    const { acao, etapa } = pedido
    const gravar = acao === 'dispensar'
      ? () => processos.dispensarEtapa(etapa.id, nota)
      : () => processos.registrarRealizadaAnteriormente(etapa.id, nota)
    executar(gravar, aoMudar)
  }

  const janela = pedido ? JANELA_DA_NOTA[pedido.acao] : null
  return (
    <>
      <ol className="caminho-de-etapas">
        {etapas.map((etapa, indice) => (
          <LinhaDaEtapa key={etapa.id} etapa={etapa} atual={indice === atual}
            acoes={podeAlterar ? acoesDaEtapa(etapas, indice) : []} aoAgir={(acao) => agir(acao, etapa)} />
        ))}
      </ol>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaComCampo aberta={pedido !== null} titulo={janela && pedido ? janela.titulo(pedido.etapa.nome) : ''}
        rotuloDoCampo="Nota" rotuloDaAcao={janela?.rotuloDaAcao ?? ''}
        aoConfirmar={gravarComNota} aoFechar={() => setPedido(null)} />
    </>
  )
}
```

`src/components/processos/EtapasDoSetor.tsx`:

```tsx
import { useCallback } from 'react'
import { type EstadoDoCarregamento, useCarregamento } from '../../hooks/useCarregamento'
import type { EtapaDoSetor, ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { CaminhoDoSetor } from './CaminhoDoSetor'
import './Etapas.css'

type EtapasDoSetorProps = { processos: ModuloDeProcessos; setorId: string; podeAlterar: boolean; aoSumir: () => void }

/** Seção "Etapas do setor" da tela do setor. Esconder as ações da Consulta é conveniência: quem protege é a RLS. */
export function EtapasDoSetor({ processos, setorId, podeAlterar, aoSumir }: EtapasDoSetorProps) {
  const ler = useCallback(() => processos.lerEtapasDoSetor(setorId), [processos, setorId])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  return (
    <section className="etapas-do-setor" aria-label="Etapas do setor">
      <h3 className="form-setor-titulo">Etapas do setor</h3>
      <ConteudoDasEtapas estado={estado} aoTentarDeNovo={tentarDeNovo} processos={processos}
        podeAlterar={podeAlterar} aoMudar={recarregar} aoSumir={aoSumir} />
    </section>
  )
}

type ConteudoProps = Omit<EtapasDoSetorProps, 'setorId'> & {
  estado: EstadoDoCarregamento<EtapaDoSetor[]>
  aoTentarDeNovo: () => void
  aoMudar: () => void
}

function ConteudoDasEtapas({ estado, aoTentarDeNovo, ...caminho }: ConteudoProps) {
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando etapas do setor…</p>
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="as etapas do setor" aoTentarDeNovo={aoTentarDeNovo} />
  return <CaminhoDoSetor etapas={estado.valor} {...caminho} />
}
```

`src/components/processos/Etapas.css`:

```css
.etapas-do-setor {
  margin-top: var(--esp-5);
}

.caminho-de-etapas {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--linha);
}

.etapa {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-2) var(--esp-3);
  padding: var(--esp-3) 0;
  border-bottom: 1px solid var(--linha);
  color: var(--texto-2);
}

/* A etapa atual em azul, como no caminho da identidade visual. */
.etapa[aria-current='step'] {
  color: var(--texto);
  box-shadow: inset 3px 0 0 var(--azul);
  padding-left: var(--esp-3);
}

.etapa-nome {
  font-weight: 600;
}

.etapa-datas,
.etapa-nota {
  flex-basis: 100%;
  margin: 0;
}

.etapa-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2);
  flex-basis: 100%;
}
```

(Mesma ressalva dos tokens `--esp-*` da Task 4.)

- [ ] **Step 4: montar a seção no setor aberto.** `src/components/cadastros/SetorAberto.tsx` passa a ser:

```tsx
import { useCallback, useState } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { EtapasDoSetor } from '../processos/EtapasDoSetor'
import { ErroAoCarregar } from './ErroAoCarregar'
import { SetorEditavel } from './SetorEditavel'
import { ItemInexistente } from './ItemInexistente'
import { SetorSomenteLeitura } from './SetorSomenteLeitura'

type SetorAbertoProps = {
  cadastros: ModuloDeCadastros
  processos: ModuloDeProcessos
  podeAlterar: boolean
  id: string
  aoVoltar: () => void
}

export function SetorAberto({ cadastros, processos, podeAlterar, id, aoVoltar }: SetorAbertoProps) {
  const ler = useCallback(() => cadastros.lerSetor(id), [cadastros, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio" role="status">Carregando setor…</p>
  if (sumiu || estado.valor === null) return <ItemInexistente aoVoltar={aoVoltar} />
  // As etapas do setor ficam abaixo do que o setor já mostrava, para os dois modos.
  const etapas = <EtapasDoSetor processos={processos} setorId={id} podeAlterar={podeAlterar} aoSumir={() => setSumiu(true)} />
  if (!podeAlterar) return <><SetorSomenteLeitura setor={estado.valor} aoVoltar={aoVoltar} />{etapas}</>
  return (
    <>
      <SetorEditavel cadastros={cadastros} setor={estado.valor} aoVoltar={aoVoltar}
        aoSumir={() => setSumiu(true)} aoMudar={recarregar} />
      {etapas}
    </>
  )
}
```

  Atenção a testes de tela antigos que procuram `getByRole('status')` ou `getByRole('alert')` sem escopo depois de abrir um setor: com a seção nova pode haver mais de um. Se algum falhar, restringir a busca à região do setor (`within(...)`) no próprio teste; não mudar o comportamento.

- [ ] **Step 5: ver passar.** `npx vitest run src/App.etapasDoSetor.test.tsx` verde; `npm test` inteiro verde; `npx tsc -b`, `npm run lint`, `npm run check:circular` limpos.

- [ ] **Step 6: comitar.** Commit "Ticket 02 de processos-etapas: etapas do setor na tela do setor".

---

### Task 6: Eventos das etapas no Histórico da área Setores (critérios 4, 8 e 9)

**Files:**
- Modify: `src/cadastros/tipos.ts` (`EventoDoCadastro.motivo?`), `src/cadastros/historicoSupabase.ts` (+ `.test.ts`), `src/cadastros/historicoDosCadastros.ts` (+ `.test.ts`), `src/components/cadastros/ListaDoHistorico.tsx`, `src/App.historicoDosCadastros.test.tsx`

**Interfaces:**
- Consumes: `ROTULO_DO_STATUS`, `formatarData` (Task 3); `StatusDaEtapa` (Task 2); eventos `andamento` da Task 1.
- Produces: `EventoDoCadastro` com `motivo?: string`; `textoDaAcaoDoCadastro(acao, 'andamento')`, `nomeDoItem` e `descreverEstadoDoCadastro` para etapas do setor.

- [ ] **Step 1: testes (vermelho).** Acrescentar ao fim de `src/cadastros/historicoDosCadastros.test.ts` (ajustar o import do topo para trazer `descreverEstadoDoCadastro, eventosDoItem, itensDoFiltro, nomeDoItem, textoDaAcaoDoCadastro` e o tipo `EventoDoCadastro`, se ainda não vierem):

```ts
const ETAPA_PENDENTE = {
  setor_id: 's1', setor_sigla: 'TSA', etapa_codigo: 'sensibilizacao', etapa_nome: 'Reunião de sensibilização',
  status: 'pendente', iniciada_em: null, resolvida_em: null,
}
const ETAPA_DISPENSADA: EventoDoCadastro = {
  id: 20, ocorridoEm: '2026-10-13T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'dispensar', entidade: 'andamento',
  entidadeRef: 's1:a2', antes: ETAPA_PENDENTE,
  depois: { ...ETAPA_PENDENTE, status: 'dispensada', resolvida_em: '2026-10-13' }, motivo: 'Setor já conhecido',
}

describe('etapas do setor no histórico', () => {
  test('texto de cada ação', () => {
    expect(['iniciar', 'concluir', 'dispensar', 'registrar_realizada'].map((acao) => textoDaAcaoDoCadastro(acao, 'andamento')))
      .toEqual(['Iniciou a etapa', 'Concluiu a etapa', 'Dispensou a etapa', 'Registrou a etapa como realizada anteriormente'])
  })

  test('o item é a etapa e o setor; antes e depois sem código e nome da etapa, com status e datas legíveis', () => {
    expect(nomeDoItem(ETAPA_DISPENSADA)).toBe('Reunião de sensibilização — TSA')
    expect(descreverEstadoDoCadastro(ETAPA_DISPENSADA.depois))
      .toBe('Setor: TSA; Situação da etapa: Dispensada; Início: —; Conclusão: 13/10/2026')
  })

  test('o evento entra no filtro pelo setor', () => {
    expect(itensDoFiltro([ETAPA_DISPENSADA])).toEqual([{ id: 's1', nome: 'TSA' }])
    expect(eventosDoItem([ETAPA_DISPENSADA], 's1')).toEqual([ETAPA_DISPENSADA])
  })
})
```

Em `src/App.historicoDosCadastros.test.tsx`, acrescentar:

```tsx
test('as etapas do setor aparecem no Histórico com o texto da ação e a nota, e entram no filtro pelo setor', async () => {
  const ETAPA = {
    setor_id: 's1', setor_sigla: 'TSA', etapa_codigo: 'sensibilizacao', etapa_nome: 'Reunião de sensibilização',
    status: 'pendente', iniciada_em: null, resolvida_em: null,
  }
  montar('consulta', [
    evento(9, { acao: 'dispensar', entidade: 'andamento', entidadeRef: 's1:a2', antes: ETAPA,
      depois: { ...ETAPA, status: 'dispensada', resolvida_em: '2026-10-13' }, motivo: 'Setor já conhecido' }),
    ...EVENTOS,
  ])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Dispensou a etapa Reunião de sensibilização — TSA')
  expect(itens[0].textContent).toContain('Nota: Setor já conhecido')
  fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')[0].textContent).toContain('Dispensou a etapa')
})
```

Em `src/cadastros/historicoSupabase.test.ts`, ajustar a expectativa do filtro de entidades para `['setor', 'macroprocesso', 'setor_envolvido', 'andamento']` e acrescentar uma linha com `detalhes.motivo` que vira `motivo` no evento (no molde dos testes que já existem no arquivo).

Rodar `npx vitest run src/cadastros src/App.historicoDosCadastros.test.tsx`. Esperado: falhas nos testes novos e no filtro de entidades.

- [ ] **Step 2: implementar.**

`src/cadastros/tipos.ts`, em `EventoDoCadastro`, acrescentar depois de `depois`:

```ts
  /** A nota ou o motivo que acompanhou a ação (etapas do setor), quando houve. */
  motivo?: string
```

`src/cadastros/historicoSupabase.ts`: `detalhes: { antes: EstadoDoCadastro; depois: EstadoDoCadastro; motivo?: string | null }` em `EventoDoBanco`; a lista passa a `const ENTIDADES_DOS_CADASTROS = ['setor', 'macroprocesso', 'setor_envolvido', 'andamento']` (comentário: "Cadastros e etapas do setor"); em `eventoDoCadastro`, acrescentar `motivo: linha.detalhes.motivo ?? undefined`.

`src/cadastros/historicoDosCadastros.ts`:

```ts
import { ROTULO_DO_STATUS, formatarData } from '../processos/caminhoDeEtapas'
import type { StatusDaEtapa } from '../processos/tipos'

const TEXTO_DA_ACAO_DO_ANDAMENTO: Record<string, string> = {
  iniciar: 'Iniciou a etapa',
  concluir: 'Concluiu a etapa',
  dispensar: 'Dispensou a etapa',
  registrar_realizada: 'Registrou a etapa como realizada anteriormente',
}

const TEXTOS_DA_ENTIDADE: Record<string, Record<string, string>> = {
  setor_envolvido: TEXTO_DA_ACAO_DO_VINCULO, andamento: TEXTO_DA_ACAO_DO_ANDAMENTO,
}

// Vínculos e etapas do setor têm a referência 'idA:idB': o item do filtro sai dos ids gravados no evento.
const ENTIDADES_QUE_LIGAM = new Set(['setor_envolvido', 'andamento'])
```

  e trocar:
  - `textoDaAcaoDoCadastro`: `const textos = TEXTOS_DA_ENTIDADE[entidade] ?? TEXTO_DA_ACAO`;
  - `ROTULO_DO_CAMPO` ganha `status: 'Situação da etapa', iniciada_em: 'Início', resolvida_em: 'Conclusão'`;
  - `CAMPOS_ESCONDIDOS` ganha `'etapa_codigo', 'etapa_nome'` (o nome da etapa já está no título do evento);
  - `valorLegivel`, antes do `if (!Array.isArray(valor))`:

```ts
  if (campo === 'status') return ROTULO_DO_STATUS[valor as StatusDaEtapa] ?? texto(valor)
  if (campo === 'iniciada_em' || campo === 'resolvida_em') return formatarData(typeof valor === 'string' ? valor : null)
```

  - `nomeDoItem`, antes do `if` do vínculo:

```ts
  if (evento.entidade === 'andamento' && typeof estado.etapa_nome === 'string') {
    return `${estado.etapa_nome} — ${texto(estado.setor_sigla)}`
  }
```

  - em `itensDoFiltro` e `itensDoVinculo`, `evento.entidade !== 'setor_envolvido'` vira `!ENTIDADES_QUE_LIGAM.has(evento.entidade)` e `evento.entidade === 'setor_envolvido'` (o `!==` do `itensDoVinculo`) vira `ENTIDADES_QUE_LIGAM.has(evento.entidade)`, na forma equivalente.

`src/components/cadastros/ListaDoHistorico.tsx`, dentro de `<span className="historico-mudanca">`, depois do "Depois":

```tsx
        {evento.motivo && <span>Nota: {evento.motivo}</span>}
```

Se `valorLegivel` ou `nomeDoItem` passar de complexidade 10 no ESLint, extrair o trecho novo numa função com nome próprio (`valorDaEtapa(campo, valor): string | null`, por exemplo), sem juntar instruções.

- [ ] **Step 3: ver passar e comitar.** `npm test` inteiro verde; `npx tsc -b`, `npm run lint`, `npm run check:circular` limpos. Commit "Ticket 02 de processos-etapas: etapas do setor no Histórico".

---

### Task 7: Fechamento do ticket

- [ ] **Step 1: verificação completa.** Na branch: `npm test` (anotar a quantidade de testes), `npm run typecheck`, `npm run lint`, `npm run check:circular`. Último "Testes de banco" da branch verde (Task 1).
- [ ] **Step 2: conferência visual.** Tentar abrir a tela do setor no navegador do app (`#/setores`, abrir um setor); se o login institucional do Google barrar a sessão, como nos tickets anteriores, registrar que a conferência visual (caminho, pílulas com texto, janela de nota, alerta vermelho) fica com o usuário.
- [ ] **Step 3: integrar.** `git switch main`, `git merge --no-ff processos-etapas-02` (mensagem "Integra o ticket 02 de processos-etapas"), `npm test` verde na `main`, `git push` (autorizado; o envio mexe em `supabase/` e dispara o "Testes de banco" na `main`: conferir o resultado), `git branch -d processos-etapas-02`. Se o `-d` recusar, parar e perguntar.
- [ ] **Step 4: marcas.** Seguir o fim do `/executar-complexo`: linha `Concluído em` no ticket, commit, apontar o próximo ticket (03, Responsáveis do setor), notas do protocolo e o `/cost`.
