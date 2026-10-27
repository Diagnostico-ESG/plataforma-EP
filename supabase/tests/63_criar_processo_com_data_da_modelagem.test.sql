-- Bug de 2026-10-27: o cadastro de processo envia data_da_modelagem_piloto na criação (vazia ou preenchida), mas a coluna só tinha
-- permissão de alterar; o banco recusava toda criação com 42501. Aqui a criação com e sem a data, por perfil.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(11);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000e1', 'TC1', 'Setor Criar Um');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000e1', null, 'Macro Criar');

create function pg_temp.data(nome_do_processo text) returns date
language sql stable as $$ select data_da_modelagem_piloto from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.data(text) to authenticated;

create function pg_temp.existe(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.existe(text) to authenticated;

-- O que a tela envia: a data sempre vai no corpo, nula quando o campo está vazio.
create function pg_temp.criar(nome_do_processo text, data_enviada text) returns text
language sql as $$
  select format($sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, data_da_modelagem_piloto)
    values ('5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', %L, 'processo', %s)$sql$,
    nome_do_processo, data_enviada) $$;
grant execute on function pg_temp.criar(text, text) to authenticated;

-- Administrador cria, sem data e com data.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(pg_temp.criar('Criado Admin Sem', 'null'), 'administrador cria processo com a data vazia');
insert into _tap (linha) select lives_ok(pg_temp.criar('Criado Admin Com', $$'2026-10-14'$$), 'administrador cria processo com a data');
insert into _tap (linha) select is(pg_temp.data('Criado Admin Com'), '2026-10-14'::date, 'a data enviada na criação ficou gravada');
insert into _tap (linha) select is(pg_temp.data('Criado Admin Sem'), null::date, 'sem data enviada, a data fica vazia');

-- Integrante cria.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(pg_temp.criar('Criado Integrante', 'null'), 'integrante cria processo com a data vazia');

-- Consulta e administrador inativo não criam (a recusa continua sendo da RLS).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Consulta', 'null'), '42501', null, 'consulta não cria processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Inativo', 'null'), '42501', null, 'administrador inativo não cria processo');
reset role;
insert into _tap (linha) select is(pg_temp.existe('Criado Consulta') + pg_temp.existe('Criado Inativo'), 0::bigint, 'nenhum dos dois recusados deixou processo');

-- Visitante não cria.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Visitante', 'null'), '42501', null, 'visitante não cria processo');
reset role;
insert into _tap (linha) select is(pg_temp.existe('Criado Visitante'), 0::bigint, 'visitante não deixou processo');

-- A coluna continua fechada para a criação de outros campos de controle (a data da validação só entra pela função).
insert into _tap (linha) select col_privs_are('public', 'processos', 'data_da_validacao', 'authenticated', array['UPDATE'], 'data_da_validacao segue só com alterar');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
