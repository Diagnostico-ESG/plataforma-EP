-- Autorizações: quem pode o quê, regras do e-mail e eventos (login-perfis, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(29);

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
insert into public.autorizacoes (email) values ('aguardando.teste@ccivil.pr.gov.br');

-- Quem não pode: integrante, consulta e inativo (as mesmas quatro conferências para cada um).
create function pg_temp.conferir_quem_nao_pode(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.autorizacoes), 0, quem || ' não lê autorizações');
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.autorizacoes (email) values ('outra.pessoa@ccivil.pr.gov.br')$sql$,
    '42501', null, quem || ' não autoriza e-mail');
  with alteradas as (
    update public.autorizacoes set perfil = 'administrador'
    where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não muda o perfil da autorização');
  with apagadas as (
    delete from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não exclui autorização');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_pode(text, text) to authenticated;

select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a4', 'Inativo');

-- Visitante (sem login): nenhum privilégio na tabela.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.autorizacoes', '42501', null, 'Visitante não lê autorizações');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('outra.pessoa@ccivil.pr.gov.br')$$, '42501', null, 'Visitante não autoriza');
insert into _tap (linha) select throws_ok(
  $$update public.autorizacoes set perfil = 'administrador'$$, '42501', null, 'Visitante não muda perfil');
insert into _tap (linha) select throws_ok('delete from public.autorizacoes', '42501', null, 'Visitante não exclui');
reset role;

-- Administrador
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br'), 1,
  'Administrador lê autorizações');
insert into _tap (linha) select lives_ok(
  $$insert into public.autorizacoes (email, perfil) values (' Nova.Pessoa@CCivil.pr.gov.br ', 'integrante_ep')$$,
  'Administrador autoriza e-mail');
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'nova.pessoa@ccivil.pr.gov.br'), 1,
  'e-mail guardado em minúsculas e sem espaços');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('pessoa@gmail.com')$$,
  'P0001', 'email_fora_do_dominio:pessoa@gmail.com', 'e-mail fora do domínio é recusado com o motivo');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('Aguardando.Teste@ccivil.pr.gov.br')$$,
  'P0001', 'email_ja_autorizado:aguardando.teste@ccivil.pr.gov.br', 'e-mail já autorizado é recusado com o motivo');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('consulta.teste@ccivil.pr.gov.br')$$,
  'P0001', 'email_ja_e_usuario:consulta.teste@ccivil.pr.gov.br', 'e-mail de usuário existente é recusado com o motivo');
with alteradas as (
  update public.autorizacoes set perfil = 'integrante_ep'
  where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador muda o perfil da autorização');
insert into _tap (linha) select throws_ok(
  $$update public.autorizacoes set email = 'trocado.teste@ccivil.pr.gov.br' where email = 'nova.pessoa@ccivil.pr.gov.br'$$,
  '42501', null, 'o e-mail da autorização não se altera');
with apagadas as (
  delete from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 1, 'Administrador exclui autorização');
reset role;

-- Eventos (lidos como dono do banco; a leitura pela interface é do ticket 04)
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'autorizar' and entidade = 'autorizacao' and entidade_ref = 'nova.pessoa@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": null, "depois": {"email": "nova.pessoa@ccivil.pr.gov.br", "perfil": "integrante_ep"}}'::jsonb)$$,
  'autorizar grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'mudar_perfil' and entidade = 'autorizacao' and entidade_ref = 'aguardando.teste@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"email": "aguardando.teste@ccivil.pr.gov.br",
    "perfil": "consulta"}, "depois": {"email": "aguardando.teste@ccivil.pr.gov.br", "perfil": "integrante_ep"}}'::jsonb)$$,
  'mudar perfil grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'excluir_autorizacao' and entidade_ref = 'aguardando.teste@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"email": "aguardando.teste@ccivil.pr.gov.br", "perfil": "integrante_ep"}, "depois": null}'::jsonb)$$,
  'excluir grava evento com autor, antes e depois');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'excluir_autorizacao'
    and entidade_ref in ('admin.teste@ccivil.pr.gov.br', 'integrante.teste@ccivil.pr.gov.br',
      'consulta.teste@ccivil.pr.gov.br', 'inativo.teste@ccivil.pr.gov.br')), 0,
  'o primeiro acesso não registra exclusão de autorização');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
