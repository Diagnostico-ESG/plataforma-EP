-- Situação do processo (processos-etapas, ticket 07): suspender, cancelar e retomar com motivo, congelamento dos
-- andamentos, eventos e perfis.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(31);

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

-- Um setor, um macroprocesso e três processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000007', 'TS7', 'Setor Situação');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000007', null, 'Macro Situação');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000007', 'af000000-0000-0000-0000-000000000007', 'Processo Parado'),
  ('5f000000-0000-0000-0000-000000000007', 'af000000-0000-0000-0000-000000000007', 'Processo Cancelado'),
  ('5f000000-0000-0000-0000-000000000007', 'af000000-0000-0000-0000-000000000007', 'Processo Direto');

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo public.status_da_etapa,
  nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, text, public.status_da_etapa, text) to authenticated;

create function pg_temp.situacao(nome_do_processo text) returns text
language sql stable as $$ select situacao from public.processos_com_andamento where nome = nome_do_processo $$;
grant execute on function pg_temp.situacao(text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Preparação: no "Processo Parado", a modelagem concluída.
select pg_temp.agir('Processo Parado', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Parado', 'modelagem', 'concluida');

-- Suspender.
insert into _tap (linha) select lives_ok(
  $sql$select public.suspender_processo(pg_temp.processo('Processo Parado'), 'Aguardando decisão')$sql$,
  'suspender com motivo');
insert into _tap (linha) select is(pg_temp.situacao('Processo Parado'), 'suspenso', 'a situação passa a suspenso');
insert into _tap (linha) select is(
  (select motivo_da_situacao from public.processos where nome = 'Processo Parado'), 'Aguardando decisão',
  'o motivo fica no processo');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'processo' and acao = 'suspender'
    and entidade_ref = pg_temp.processo('Processo Parado')::text),
  1, 'suspender gera um evento');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where entidade = 'processo' and acao = 'suspender'
    and entidade_ref = pg_temp.processo('Processo Parado')::text),
  'Aguardando decisão', 'o evento traz o motivo');
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo(pg_temp.processo('Processo Parado'), 'De novo')$sql$,
  'P0001', 'situacao_invalida:suspenso:suspenso', 'suspender um processo suspenso é recusado');

-- Congelamento: nenhuma etapa do processo suspenso muda.
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Processo Parado', 'relatorio_modelagem_tecnica', 'em_andamento')$sql$,
  'P0001', 'processo_parado:suspenso', 'iniciar etapa de processo suspenso é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
    where id = pg_temp.andamento('Processo Parado', 'modelagem')$sql$,
  'P0001', 'processo_parado:suspenso', 'mudar o responsável de etapa de processo suspenso é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Parado', 'modelagem'), 'Tentativa', null)$sql$,
  'P0001', 'processo_parado:suspenso', 'voltar a etapa de processo suspenso é recusado');

-- Retomar.
insert into _tap (linha) select throws_ok(
  $sql$select public.retomar_processo(pg_temp.processo('Processo Parado'), null)$sql$,
  'P0001', 'motivo_obrigatorio', 'retomar sem motivo é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.retomar_processo(pg_temp.processo('Processo Parado'), 'Decisão tomada')$sql$, 'retomar com motivo');
insert into _tap (linha) select is(pg_temp.situacao('Processo Parado'), 'em_andamento', 'a situação volta a em andamento');
insert into _tap (linha) select is(
  (select motivo_da_situacao from public.processos where nome = 'Processo Parado'), null,
  'retomar limpa o motivo do processo');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where entidade = 'processo' and acao = 'retomar'
    and entidade_ref = pg_temp.processo('Processo Parado')::text),
  'Decisão tomada', 'o evento de retomar traz o motivo');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Processo Parado', 'relatorio_modelagem_tecnica', 'em_andamento')$sql$,
  'retomado, a etapa volta a andar');

-- Cancelar.
insert into _tap (linha) select lives_ok(
  $sql$select public.cancelar_processo(pg_temp.processo('Processo Parado'), 'Não será mapeado')$sql$,
  'cancelar um processo em andamento');
insert into _tap (linha) select is(pg_temp.situacao('Processo Parado'), 'cancelado', 'a situação passa a cancelado');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'processo' and acao = 'cancelar'
    and entidade_ref = pg_temp.processo('Processo Parado')::text),
  1, 'cancelar gera um evento');
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo(pg_temp.processo('Processo Parado'), 'Tentativa')$sql$,
  'P0001', 'situacao_invalida:cancelado:suspenso', 'suspender um processo cancelado é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Processo Parado', 'relatorio_modelagem_tecnica', 'concluida')$sql$,
  'P0001', 'processo_parado:cancelado', 'concluir etapa de processo cancelado é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.retomar_processo(pg_temp.processo('Processo Parado'), 'Voltou a valer')$sql$,
  'retomar um processo cancelado');

-- De suspenso a cancelado.
select public.suspender_processo(pg_temp.processo('Processo Cancelado'), 'Parado');
insert into _tap (linha) select lives_ok(
  $sql$select public.cancelar_processo(pg_temp.processo('Processo Cancelado'), 'Desistiram')$sql$,
  'cancelar um processo suspenso');
insert into _tap (linha) select is(pg_temp.situacao('Processo Cancelado'), 'cancelado', 'o suspenso cancelado aparece como cancelado');

-- A situação não muda direto, e o processo precisa existir.
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set situacao = 'suspenso', motivo_da_situacao = 'Direto' where nome = 'Processo Direto'$sql$,
  'P0001', 'situacao_so_pela_funcao', 'a situação não muda direto');
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo('00000000-0000-0000-0000-000000000000', 'Motivo')$sql$,
  'P0001', 'registro_inexistente', 'suspender processo que não existe é recusado');

reset role;
-- As funções não são security definer: a RLS de quem chama decide.
insert into _tap (linha) select is(
  (select bool_or(prosecdef) from pg_proc where pronamespace = 'public'::regnamespace
    and proname in ('suspender_processo', 'cancelar_processo', 'retomar_processo')),
  false, 'suspender, cancelar e retomar não são security definer');

-- Perfis: Consulta recusada nas três; inativo não enxerga o processo; visitante sem permissão de executar.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo(pg_temp.processo('Processo Direto'), 'Tentativa')$sql$, '42501', null,
  'Consulta não suspende');
insert into _tap (linha) select throws_ok(
  $sql$select public.cancelar_processo(pg_temp.processo('Processo Direto'), 'Tentativa')$sql$, '42501', null,
  'Consulta não cancela');
insert into _tap (linha) select throws_ok(
  $sql$select public.retomar_processo(pg_temp.processo('Processo Cancelado'), 'Tentativa')$sql$, '42501', null,
  'Consulta não retoma');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo(pg_temp.processo('Processo Direto'), 'Tentativa')$sql$,
  'P0001', 'registro_inexistente', 'Inativo não suspende (não lê nada, o processo "não existe" para ele)');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.suspender_processo('00000000-0000-0000-0000-000000000000', 'Tentativa')$sql$, '42501', null,
  'visitante não suspende');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
