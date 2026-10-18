-- Data da reunião no processo (reunioes, ticket 05): marcar, trocar e remover por perfil, evento com antes e depois,
-- nenhuma etapa muda, processo com data se exclui e troca de setor, tabelas de reunião apagadas e eventos antigos
-- de reunião ainda legíveis.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(35);

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

insert into public.setores (id, sigla, nome) values
  ('5f000000-0000-0000-0000-0000000000d1', 'TD1', 'Setor Data Um'),
  ('5f000000-0000-0000-0000-0000000000d2', 'TD2', 'Setor Data Dois');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000d1', null, 'Macro Data');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-0000000000d1', 'af000000-0000-0000-0000-0000000000d1', 'Proc Data'),
  ('5f000000-0000-0000-0000-0000000000d1', 'af000000-0000-0000-0000-0000000000d1', 'Proc Cancelado'),
  ('5f000000-0000-0000-0000-0000000000d1', 'af000000-0000-0000-0000-0000000000d1', 'Proc Excluir');
-- Preparação como dono do banco: o "Proc Excluir" já tem data, e um evento antigo de reunião (o recurso saiu).
update public.processos set data_da_reuniao = '2026-10-01' where nome = 'Proc Excluir';
insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes) values
  (null, 'criar', 'reuniao', 'reuniao-antiga-d1', '{"antes": null, "depois": {"data": "2026-09-03"}}');

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.data(nome_do_processo text) returns date
language sql stable as $$ select data_da_reuniao from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.data(text) to authenticated;

create function pg_temp.edicoes(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.edicoes(text) to authenticated;

create function pg_temp.ultima_edicao(nome_do_processo text) returns jsonb
language sql stable as $$
  select detalhes from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text order by id desc limit 1 $$;
grant execute on function pg_temp.ultima_edicao(text) to authenticated;

create function pg_temp.eventos_antigos() returns bigint
language sql stable as $$ select count(*) from public.eventos where entidade_ref = 'reuniao-antiga-d1' $$;
grant execute on function pg_temp.eventos_antigos() to authenticated;

insert into _tap (linha) select has_column('public', 'processos', 'data_da_reuniao', 'processos tem a data da reunião');

-- Administrador marca.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set data_da_reuniao = '2026-10-14' where nome = 'Proc Data'$sql$, 'administrador marca a data');
insert into _tap (linha) select is(pg_temp.data('Proc Data'), '2026-10-14'::date, 'a data ficou marcada');
insert into _tap (linha) select is(pg_temp.edicoes('Proc Data'), 1::bigint, 'marcar gera um evento');
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'administrador lê o evento antigo de reunião');

-- Integrante troca, repete a mesma data e remove.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set data_da_reuniao = '2026-10-20' where nome = 'Proc Data'$sql$, 'integrante troca a data');
insert into _tap (linha) select is(pg_temp.data('Proc Data'), '2026-10-20'::date, 'a data foi trocada');
insert into _tap (linha) select is(pg_temp.edicoes('Proc Data'), 2::bigint, 'trocar gera um evento');
insert into _tap (linha) select is(pg_temp.ultima_edicao('Proc Data') -> 'antes' ->> 'data_da_reuniao', '2026-10-14',
  'o evento guarda a data de antes');
insert into _tap (linha) select is(pg_temp.ultima_edicao('Proc Data') -> 'depois' ->> 'data_da_reuniao', '2026-10-20',
  'o evento guarda a data de depois');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set data_da_reuniao = '2026-10-20' where nome = 'Proc Data'$sql$, 'gravar a mesma data');
insert into _tap (linha) select is(pg_temp.edicoes('Proc Data'), 2::bigint, 'gravar a mesma data não gera evento');
insert into _tap (linha) select is(
  (select a.status::text from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = pg_temp.processo('Proc Data') order by e.ordem limit 1),
  'pendente', 'marcar a data não mexe na primeira etapa');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set data_da_reuniao = null where nome = 'Proc Data'$sql$, 'integrante remove a data');
insert into _tap (linha) select is(pg_temp.data('Proc Data'), null::date, 'a data foi removida');
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'integrante lê o evento antigo de reunião');

-- Data futura em processo cancelado.
select public.cancelar_processo(pg_temp.processo('Proc Cancelado'), 'Cancelado no teste');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set data_da_reuniao = '2027-01-15' where nome = 'Proc Cancelado'$sql$,
  'data futura em processo cancelado é aceita');
insert into _tap (linha) select is(pg_temp.data('Proc Cancelado'), '2027-01-15'::date, 'o cancelado ficou com a data');

-- Processo com data se exclui e troca de setor.
insert into _tap (linha) select lives_ok(
  $sql$delete from public.processos where nome = 'Proc Excluir'$sql$, 'processo com data se exclui');
insert into _tap (linha) select is(pg_temp.processo('Proc Excluir'), null::uuid, 'o processo com data foi excluído');
update public.processos set data_da_reuniao = '2026-11-05' where nome = 'Proc Data';
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set setor_id = '5f000000-0000-0000-0000-0000000000d2' where nome = 'Proc Data'$sql$,
  'processo com data troca de setor');
insert into _tap (linha) select is(
  (select setor_id from public.processos where nome = 'Proc Data'), '5f000000-0000-0000-0000-0000000000d2'::uuid,
  'o processo passou ao outro setor');
insert into _tap (linha) select is(pg_temp.data('Proc Data'), '2026-11-05'::date, 'a data acompanha a troca de setor');

-- Consulta não muda a data, mas lê o processo e o evento antigo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
update public.processos set data_da_reuniao = '2030-01-01' where nome = 'Proc Data';
insert into _tap (linha) select is(pg_temp.data('Proc Data'), '2026-11-05'::date, 'Consulta não muda a data');
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'Consulta lê o evento antigo de reunião');

-- Inativo não muda nem lê.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
update public.processos set data_da_reuniao = '2030-01-01' where nome = 'Proc Data';
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 0::bigint, 'inativo não lê o evento antigo de reunião');
reset role;
insert into _tap (linha) select is(pg_temp.data('Proc Data'), '2026-11-05'::date, 'inativo não muda a data');

-- Visitante não chega à tabela nem aos eventos.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set data_da_reuniao = '2030-01-01'$sql$, '42501', null, 'visitante não muda a data');
insert into _tap (linha) select throws_ok(
  $sql$select 1 from public.eventos where entidade = 'reuniao'$sql$, '42501', null, 'visitante não lê os eventos de reunião');
reset role;

-- O que era da área Reuniões não existe mais.
insert into _tap (linha) select hasnt_table('public', 'reunioes', 'a tabela reunioes não existe');
insert into _tap (linha) select hasnt_table('public', 'reunioes_processos', 'a tabela reunioes_processos não existe');
insert into _tap (linha) select hasnt_table('public', 'reunioes_usuarios', 'a tabela reunioes_usuarios não existe');
insert into _tap (linha) select hasnt_table('public', 'reunioes_responsaveis', 'a tabela reunioes_responsaveis não existe');
insert into _tap (linha) select hasnt_type('public', 'tipo_de_reuniao', 'o tipo tipo_de_reuniao não existe');
insert into _tap (linha) select hasnt_function('public', 'salvar_reuniao', 'a função salvar_reuniao não existe');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
