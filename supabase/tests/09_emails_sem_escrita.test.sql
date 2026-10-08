-- Ninguém cria, altera ou apaga e-mail em usuarios_emails pela API; só o gatilho do primeiro acesso inclui
-- (login-perfis, tabela "quem pode o quê" da spec; lacuna achada na revisão do /ship, 2026-10-08).
-- Sem política de escrita, a RLS recusa a inclusão (42501) e faz alterar e apagar não tocarem em linha nenhuma.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(16);

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

-- Sem as linhas, "nenhuma linha alterada" passaria sem provar nada: o gatilho precisa tê-las criado.
insert into _tap (linha) select is(
  (select count(*)::int from public.usuarios_emails where usuario_id in (
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a4')), 4,
  'o primeiro acesso criou os 4 e-mails de teste');

-- Cada um tenta no próprio e-mail, o caso mais permissivo; o visitante tenta no e-mail do administrador.
create function pg_temp.conferir_que_nao_escreve(claims text, papel text, id_alvo uuid, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', claims, true);
  execute format('set local role %I', papel);
  insert into _tap (linha) select throws_ok(
    format($sql$insert into public.usuarios_emails (usuario_id, email) values (%L, 'outro.teste@ccivil.pr.gov.br')$sql$, id_alvo),
    '42501', null, quem || ' não cria e-mail');
  with alteradas as (
    update public.usuarios_emails set email = 'trocado.teste@ccivil.pr.gov.br' where usuario_id = id_alvo returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera e-mail');
  with apagadas as (delete from public.usuarios_emails where usuario_id = id_alvo returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não apaga e-mail');
  reset role;
end $$;
grant execute on function pg_temp.conferir_que_nao_escreve(text, text, uuid, text) to anon, authenticated;

select pg_temp.conferir_que_nao_escreve('{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',
  'authenticated', '00000000-0000-0000-0000-0000000000a1', 'Administrador');
select pg_temp.conferir_que_nao_escreve('{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}',
  'authenticated', '00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_que_nao_escreve('{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}',
  'authenticated', '00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_que_nao_escreve('{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}',
  'authenticated', '00000000-0000-0000-0000-0000000000a4', 'Inativo');
select pg_temp.conferir_que_nao_escreve('{"role":"anon"}', 'anon', '00000000-0000-0000-0000-0000000000a1', 'Visitante');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
