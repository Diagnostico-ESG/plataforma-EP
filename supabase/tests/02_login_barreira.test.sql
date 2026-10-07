-- Barreira antes de criar a conta e primeiro acesso (login-perfis, ticket 01).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(10);

-- Gancho "antes de criar usuário"
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":"pessoa@gmail.com"}}') -> 'error' ->> 'message',
  'fora_do_dominio:pessoa@gmail.com', 'conta fora do domínio é recusada com o motivo');
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":"sem.autorizacao@ccivil.pr.gov.br"}}') -> 'error' ->> 'message',
  'sem_autorizacao:sem.autorizacao@ccivil.pr.gov.br', 'conta do domínio sem autorização é recusada com o motivo');
insert into public.autorizacoes (email, perfil) values ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":" Integrante.Teste@CCivil.pr.gov.br "}}'),
  '{}'::jsonb, 'conta autorizada passa, sem diferença de maiúsculas e espaços');
insert into _tap (linha) select ok(
  has_function_privilege('supabase_auth_admin', 'private.antes_de_criar_usuario(jsonb)', 'execute'),
  'o Auth pode chamar o gancho');
insert into _tap (linha) select ok(
  not has_function_privilege('authenticated', 'private.antes_de_criar_usuario(jsonb)', 'execute'),
  'usuário logado não chama o gancho');

-- Primeiro acesso
insert into auth.users (id, email, raw_user_meta_data, aud, role) values (
  '00000000-0000-0000-0000-0000000000b1', 'Integrante.Teste@ccivil.pr.gov.br',
  '{"full_name":"Integrante de Teste","avatar_url":"https://exemplo.invalid/foto.png"}',
  'authenticated', 'authenticated');
insert into _tap (linha) select results_eq(
  $$select nome, foto_url, perfil::text, ativo from public.usuarios where id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('Integrante de Teste', 'https://exemplo.invalid/foto.png', 'integrante_ep', true)$$,
  'primeiro acesso cria o usuário com o perfil da autorização, nome e foto do Google');
insert into _tap (linha) select is(
  (select email from public.usuarios_emails where usuario_id = '00000000-0000-0000-0000-0000000000b1'),
  'integrante.teste@ccivil.pr.gov.br', 'o e-mail do usuário é guardado em minúsculas');
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'integrante.teste@ccivil.pr.gov.br'),
  0, 'a autorização sai no primeiro acesso');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, acao, entidade, entidade_ref from public.eventos
    where entidade_ref = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('00000000-0000-0000-0000-0000000000b1', 'primeiro_acesso', 'usuario', '00000000-0000-0000-0000-0000000000b1')$$,
  'o evento primeiro_acesso tem a própria pessoa como autora');
insert into _tap (linha) select throws_ok(
  $$insert into auth.users (id, email, aud, role)
    values ('00000000-0000-0000-0000-0000000000b9', 'intruso@ccivil.pr.gov.br', 'authenticated', 'authenticated')$$,
  'P0001', 'sem_autorizacao:intruso@ccivil.pr.gov.br',
  'sem o gancho, o gatilho também recusa a conta sem autorização');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
