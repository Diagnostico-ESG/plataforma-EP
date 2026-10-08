-- Gerir usuários: quem altera, travas, nome que fica e eventos (login-perfis, ticket 03).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(40);

-- Usuários inventados: a1 e a5 administradores, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador'),
  ('admin2.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Admin Teste"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Integrante Teste"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Consulta Teste"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Inativo Teste"}'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Admin Dois Teste"}');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';
-- O banco dev tem a conta real do usuário: dentro deste teste (desfeito no fim) ela fica inativa,
-- para a1 e a5 serem os únicos administradores ativos.
update public.usuarios set ativo = false where id not in (
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a4',
  '00000000-0000-0000-0000-0000000000a5');

-- Quem não pode: integrante, consulta e inativo (as mesmas cinco conferências, sempre sobre a3).
create function pg_temp.conferir_quem_nao_pode(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  with alteradas as (
    update public.usuarios set nome = 'Trocado' where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não corrige nome');
  with alteradas as (
    update public.usuarios set perfil = 'administrador' where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não muda perfil');
  with alteradas as (
    update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não desativa');
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$sql$,
    '42501', null, quem || ' não cria usuário');
  insert into _tap (linha) select throws_ok(
    $sql$delete from public.usuarios where id = '00000000-0000-0000-0000-0000000000a3'$sql$,
    '42501', null, quem || ' não apaga usuário');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_pode(text, text) to authenticated;

select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a4', 'Inativo');

-- Visitante (sem login): nenhum privilégio de escrita.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set nome = 'Trocado'$$, '42501', null, 'Visitante não altera usuário');
insert into _tap (linha) select throws_ok(
  $$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$$,
  '42501', null, 'Visitante não cria usuário');
insert into _tap (linha) select throws_ok('delete from public.usuarios', '42501', null, 'Visitante não apaga usuário');
reset role;

-- Administrador ativo, sobre a2
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
with alteradas as (
  update public.usuarios set nome = '  Integrante Corrigido ' where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador corrige nome');
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'), 'Integrante Corrigido',
  'nome guardado sem espaços nas pontas');
with alteradas as (
  update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador muda perfil');
with alteradas as (
  update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador desativa');
with alteradas as (
  update public.usuarios set ativo = true where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador reativa');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set foto_url = 'https://exemplo.invalido/f.png' where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'a foto não se altera');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set id = gen_random_uuid() where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'o id não se altera');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set primeiro_acesso_em = now() where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'a data do primeiro acesso não se altera');
insert into _tap (linha) select throws_ok(
  $$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$$,
  '42501', null, 'Administrador não cria usuário');
insert into _tap (linha) select throws_ok(
  $$delete from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'Administrador não apaga usuário');

-- Travas: a si mesmo
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'nao_desativa_a_si_mesmo:00000000-0000-0000-0000-0000000000a1', 'ninguém desativa a si mesmo');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'nao_muda_o_proprio_perfil:00000000-0000-0000-0000-0000000000a1', 'ninguém muda o próprio perfil');

-- Travas: com dois administradores ativos (a1 e a5), rebaixar ou desativar um passa
with alteradas as (
  update public.usuarios set perfil = 'integrante_ep' where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'com dois administradores, rebaixar um passa');
with alteradas as (
  update public.usuarios set perfil = 'administrador' where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador promove a administrador');
with alteradas as (
  update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'com dois administradores, desativar um passa');
reset role;

-- Travas: agora a1 é o último administrador ativo; pelo painel (sem login) também não se tira.
select set_config('request.jwt.claims', '', true);
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'ultimo_administrador:Admin Teste', 'desativar o último administrador ativo é recusado');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'ultimo_administrador:Admin Teste', 'rebaixar o último administrador ativo é recusado');

-- Nome corrigido não é desfeito no acesso seguinte (o Auth só atualiza auth.users).
update auth.users set raw_user_meta_data = '{"full_name": "Nome do Google"}', last_sign_in_at = now()
  where id = '00000000-0000-0000-0000-0000000000a2';
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'), 'Integrante Corrigido',
  'o acesso seguinte não desfaz o nome corrigido');

-- Eventos das alterações em a2 (lidos como dono do banco; a leitura pela interface é do ticket 04)
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'corrigir_nome'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"nome": "Integrante Teste"}, "depois": {"nome": "Integrante Corrigido"}}'::jsonb)$$,
  'corrigir nome grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'mudar_perfil'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"perfil": "integrante_ep"}, "depois": {"perfil": "consulta"}}'::jsonb)$$,
  'mudar perfil grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'desativar'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"ativo": true}, "depois": {"ativo": false}}'::jsonb)$$,
  'desativar grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'reativar'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"ativo": false}, "depois": {"ativo": true}}'::jsonb)$$,
  'reativar grava evento com autor, antes e depois');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
