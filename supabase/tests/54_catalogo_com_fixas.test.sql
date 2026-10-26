-- Andamento livre, catálogo (processos-etapas, ticket 24; ADR 0022): Não iniciados e Concluídos fixas nas pontas, sem
-- renomear, mudar a fase, desativar nem apagar; etapa com processo dentro não se desativa nem se apaga; etapa com
-- passagem não se apaga; as seis com campos próprios não saem; fase vazia só nas fixas; etapa nova não cria nada nos
-- processos; sem obrigatória.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(30);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela. A
-- função desliga, só durante o movimento e com o dono do banco, as etapas com trava que ficam antes do destino.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid, p_data date default null, p_link text default null,
  p_explicacao text default null) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, p_data, p_link, p_explicacao);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid, date, text, text) to authenticated;

-- Usuário inventado: a1 administrador.
insert into public.autorizacoes (email, perfil) values ('admin.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000054', 'T54', 'Setor Catálogo');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000054', null, 'Macro Catálogo');
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000054', 'af000000-0000-0000-0000-000000000054', 'Dentro');

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.dentro() returns uuid
language sql stable as $$ select id from public.processos where setor_id = '5f000000-0000-0000-0000-000000000054' $$;
grant execute on function pg_temp.dentro() to authenticated;

-- ===== As fixas nas pontas =====
insert into _tap (linha) select results_eq(
  $sql$select codigo, nome, fase from public.etapas where ordem in ((select min(ordem) from public.etapas),
    (select max(ordem) from public.etapas)) order by ordem$sql$,
  $sql$values ('nao_iniciados', 'Não iniciados', null::public.fase_do_regimento), ('concluidos', 'Concluídos', null)$sql$,
  'o catálogo começa em Não iniciados e termina em Concluídos, as duas sem fase');
insert into _tap (linha) select results_eq(
  $sql$select codigo from public.etapas where codigo in ('modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna',
    'revisao_setor', 'aprovacao_setor', 'publicacao') order by ordem$sql$,
  $sql$values ('modelagem'), ('relatorio_modelagem_tecnica'), ('revisao_interna'), ('revisao_setor'), ('aprovacao_setor'),
    ('publicacao')$sql$, 'as etapas de trabalho mantêm a ordem entre si');
insert into _tap (linha) select hasnt_column('public', 'etapas', 'obrigatoria', 'o catálogo não tem mais obrigatória');

set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok($sql$update public.etapas set nome = 'Entrada' where codigo = 'nao_iniciados'$sql$,
  'P0001', 'etapa_fixa', 'renomear Não iniciados é recusado');
insert into _tap (linha) select throws_ok($sql$update public.etapas set nome = 'Fim' where codigo = 'concluidos'$sql$,
  'P0001', 'etapa_fixa', 'renomear Concluídos é recusado');
insert into _tap (linha) select throws_ok($sql$update public.etapas set fase = 'IV' where codigo = 'nao_iniciados'$sql$,
  'P0001', 'etapa_fixa', 'dar fase a Não iniciados é recusado');
insert into _tap (linha) select throws_ok($sql$update public.etapas set ativa = false where codigo = 'nao_iniciados'$sql$,
  'P0001', 'etapa_fixa', 'desativar Não iniciados é recusado');
insert into _tap (linha) select throws_ok($sql$update public.etapas set ativa = false where codigo = 'concluidos'$sql$,
  'P0001', 'etapa_fixa', 'desativar Concluídos é recusado');
insert into _tap (linha) select throws_ok($sql$delete from public.etapas where codigo = 'nao_iniciados'$sql$,
  'P0001', 'etapa_fixa', 'apagar Não iniciados é recusado');
insert into _tap (linha) select throws_ok($sql$delete from public.etapas where codigo = 'concluidos'$sql$,
  'P0001', 'etapa_fixa', 'apagar Concluídos é recusado');
insert into _tap (linha) select throws_ok($sql$select public.mover_etapa(pg_temp.etapa('nao_iniciados'), 'descer')$sql$,
  'P0001', 'etapas_fixas_nas_pontas', 'descer Não iniciados é recusado');
insert into _tap (linha) select throws_ok($sql$select public.mover_etapa((select id from public.etapas where codigo <> 'concluidos' order by ordem desc limit 1), 'descer')$sql$,
  'P0001', 'etapas_fixas_nas_pontas', 'passar uma etapa para depois de Concluídos é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('antes_de_tudo', 'Antes de tudo', 'IV', pg_temp.etapa('nao_iniciados'))$sql$,
  'P0001', 'etapas_fixas_nas_pontas', 'acrescentar etapa antes de Não iniciados é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.etapas (codigo, nome, ordem, fase) values ('depois_de_tudo', 'Depois de tudo',
    (select max(ordem) + 1 from public.etapas), 'IX')$sql$,
  'P0001', 'etapas_fixas_nas_pontas', 'incluir etapa depois de Concluídos é recusado');

-- ===== Etapa nova =====
insert into _tap (linha) select lives_ok($sql$select public.acrescentar_etapa('etapa_t54', 'Etapa T54', 'V', null)$sql$,
  'acrescentar sem posição é aceito');
insert into _tap (linha) select results_eq(
  $sql$select codigo from public.etapas where ordem >= (select ordem from public.etapas where codigo = 'etapa_t54') order by ordem$sql$,
  $sql$values ('etapa_t54'), ('concluidos')$sql$, 'sem posição, a etapa nova entra logo antes de Concluídos');
insert into _tap (linha) select is((select count(*) from public.passagens where etapa_id = pg_temp.etapa('etapa_t54')), 0::bigint,
  'a etapa nova não cria passagem em nenhum processo');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'depois'->>'codigo', detalhes->'depois' ? 'obrigatoria' from public.eventos
    where entidade = 'etapa' and acao = 'acrescentar' and entidade_ref = pg_temp.etapa('etapa_t54')::text$sql$,
  $sql$values ('etapa_t54', false)$sql$, 'o evento do catálogo não traz mais obrigatória');
insert into _tap (linha) select throws_ok($sql$select public.acrescentar_etapa('sem_fase', 'Sem fase', null, null)$sql$,
  '23514', null, 'etapa de trabalho sem fase é recusada');

-- ===== Etapa com processo dentro e etapa com passagem =====
select pg_temp.mover_sem_trava(pg_temp.dentro(), pg_temp.etapa('etapa_t54'));
insert into _tap (linha) select throws_ok($sql$update public.etapas set ativa = false where codigo = 'etapa_t54'$sql$,
  'P0001', 'etapa_com_processos:Etapa T54:1', 'desativar a etapa com um processo dentro é recusado, com a contagem');
insert into _tap (linha) select throws_ok($sql$delete from public.etapas where codigo = 'etapa_t54'$sql$,
  'P0001', 'etapa_com_processos:Etapa T54:1', 'apagar a etapa com um processo dentro é recusado, com a contagem');
select pg_temp.mover_sem_trava(pg_temp.dentro(), pg_temp.etapa('modelagem'));
insert into _tap (linha) select throws_ok($sql$delete from public.etapas where codigo = 'etapa_t54'$sql$,
  'P0001', 'etapa_usada:Etapa T54', 'apagar a etapa por onde um processo passou é recusado');
insert into _tap (linha) select lives_ok($sql$update public.etapas set ativa = false where codigo = 'etapa_t54'$sql$,
  'desativar a etapa por onde um processo passou, sem ninguém dentro, é aceito');
insert into _tap (linha) select lives_ok($sql$update public.etapas set ativa = true where codigo = 'etapa_t54'$sql$,
  'reativar a etapa é aceito');
insert into _tap (linha) select results_eq(
  $sql$select count(*), (select etapa_atual_codigo from public.processos_com_andamento where id = pg_temp.dentro())
    from public.passagens where processo_id = pg_temp.dentro()$sql$,
  $sql$values (3::bigint, 'modelagem')$sql$, 'reativar não mexe em nenhum processo');

-- ===== As seis etapas com campos próprios =====
insert into _tap (linha) select throws_ok($sql$update public.etapas set ativa = false where codigo = 'modelagem'$sql$,
  'P0001', 'etapa_protegida:' || (select nome from public.etapas where codigo = 'modelagem'),
  'desativar a Modelagem piloto é recusado');
insert into _tap (linha) select throws_ok($sql$update public.etapas set ativa = false where codigo = 'relatorio_modelagem_tecnica'$sql$,
  'P0001', 'etapa_protegida:' || (select nome from public.etapas where codigo = 'relatorio_modelagem_tecnica'),
  'desativar o Relatório e modelagem técnica é recusado');
insert into _tap (linha) select throws_ok($sql$delete from public.etapas where codigo = 'publicacao'$sql$,
  'P0001', 'etapa_protegida:' || (select nome from public.etapas where codigo = 'publicacao'), 'apagar a Publicação é recusado');
insert into _tap (linha) select lives_ok($sql$update public.etapas set nome = 'Modelagem do piloto' where codigo = 'modelagem'$sql$,
  'renomear a Modelagem piloto é aceito');
insert into _tap (linha) select lives_ok($sql$select public.mover_etapa(pg_temp.etapa('revisao_interna'), 'descer')$sql$,
  'reordenar etapas de trabalho entre si é aceito');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
