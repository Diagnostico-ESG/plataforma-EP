-- Bug de 2026-10-27 (data no cadastro) revisto pelo ticket 03 de enxugar-cartao-e-cadastro (ADR 0035): o cadastro não grava mais
-- a data da modelagem piloto; ela só se registra depois, por update. Aqui a criação sem a data, por perfil, e a recusa de citá-la.
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

-- O que a tela envia: a data não vai no corpo.
create function pg_temp.criar(nome_do_processo text) returns text
language sql as $$
  select format($sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
    values ('5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', %L, 'processo')$sql$,
    nome_do_processo) $$;
grant execute on function pg_temp.criar(text) to authenticated;

-- Citar a coluna na criação (até com null) é recusado: o cadastro não grava a data.
create function pg_temp.criar_citando_a_data(nome_do_processo text) returns text
language sql as $$
  select format($sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, data_da_modelagem_piloto)
    values ('5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', %L, 'processo', null)$sql$,
    nome_do_processo) $$;
grant execute on function pg_temp.criar_citando_a_data(text) to authenticated;

-- Administrador cria sem data e não consegue citá-la.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(pg_temp.criar('Criado Admin Sem'), 'administrador cria processo sem a data');
insert into _tap (linha) select throws_ok(pg_temp.criar_citando_a_data('Criado Admin Com'), '42501', null,
  'administrador não grava a data na criação');
insert into _tap (linha) select is(pg_temp.data('Criado Admin Sem'), null::date, 'sem data enviada, a data fica vazia');

-- Integrante cria.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(pg_temp.criar('Criado Integrante'), 'integrante cria processo com a data vazia');

-- Consulta e administrador inativo não criam (a recusa é da RLS, agora que a coluna tem permissão); o visitante é barrado antes, pela tabela.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Consulta'), '42501', null, 'consulta não cria processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Inativo'), '42501', null, 'administrador inativo não cria processo');
reset role;
insert into _tap (linha) select is(pg_temp.existe('Criado Consulta') + pg_temp.existe('Criado Inativo'), 0::bigint, 'nenhum dos dois recusados deixou processo');

-- Visitante não cria.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(pg_temp.criar('Criado Visitante'), '42501', null, 'visitante não cria processo');
reset role;
insert into _tap (linha) select is(pg_temp.existe('Criado Visitante'), 0::bigint, 'visitante não deixou processo');

-- Nenhuma das duas datas entra pela criação: a da validação só pela função, a da modelagem piloto por update depois.
insert into _tap (linha) select is(has_column_privilege('authenticated', 'public.processos', 'data_da_validacao', 'INSERT'), false,
  'data_da_validacao segue sem permissão de inserir');
insert into _tap (linha) select is(has_column_privilege('authenticated', 'public.processos', 'data_da_modelagem_piloto', 'INSERT'), false,
  'data_da_modelagem_piloto não tem permissão de inserir');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
