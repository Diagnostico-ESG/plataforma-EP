-- Quem lê usuários e e-mails, por perfil (login-perfis, ticket 01; tabela "quem pode o quê" da spec).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(12);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'consulta');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';
insert into public.autorizacoes (email) values ('aguardando.teste@ccivil.pr.gov.br');

-- As contagens filtram pelos ids de teste: o banco dev também tem a conta real do usuário.
create temp view _ids_de_teste as select unnest(array[
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a4']::uuid[]) as id;
grant select on _ids_de_teste to anon, authenticated;

-- Administrador
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios where id in (select id from _ids_de_teste)), 4,
  'Administrador lê todos os usuários');
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios_emails where usuario_id in (select id from _ids_de_teste)), 4,
  'Administrador lê todos os e-mails');
reset role;

-- Integrante do EP
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios where id in (select id from _ids_de_teste)), 4,
  'Integrante lê todos os usuários');
insert into _tap (linha) select results_eq(
  'select usuario_id::text from public.usuarios_emails',
  $$values ('00000000-0000-0000-0000-0000000000a2')$$,
  'Integrante lê só o próprio e-mail');
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes), 0, 'Integrante não lê autorizações');
insert into _tap (linha) select is(
  -- Os eventos dos cadastros são lidos por todo perfil ativo desde cadastros-basicos (teste 14); aqui
  -- conta só o resto, que continua só do administrador.
  (select count(*)::int from public.eventos where entidade not in ('setor', 'macroprocesso', 'setor_envolvido')),
  0, 'Integrante não lê eventos de usuários nem de autorizações');
reset role;

-- Consulta
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios where id in (select id from _ids_de_teste)), 4,
  'Consulta lê todos os usuários');
insert into _tap (linha) select results_eq(
  'select usuario_id::text from public.usuarios_emails',
  $$values ('00000000-0000-0000-0000-0000000000a3')$$,
  'Consulta lê só o próprio e-mail');
reset role;

-- Inativo
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select results_eq(
  'select id::text from public.usuarios',
  $$values ('00000000-0000-0000-0000-0000000000a4')$$,
  'Inativo lê só a própria linha de usuário');
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios_emails), 0, 'Inativo não lê e-mails, nem o próprio');
reset role;

-- Visitante (sem login)
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios), 0, 'Visitante não lê usuários');
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios_emails), 0, 'Visitante não lê e-mails');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
