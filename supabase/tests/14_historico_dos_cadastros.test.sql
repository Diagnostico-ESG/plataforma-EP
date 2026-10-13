-- Cadastros básicos, ticket 05: todo perfil ativo lê os eventos dos cadastros; os de usuários e autorizações
-- (que trazem e-mails) continuam só do administrador; ninguém grava em eventos pela API.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(25);

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

-- Um evento de cada entidade, gravado pelo dono do teste (a API não grava). A referência marca os do teste.
insert into public.eventos (acao, entidade, entidade_ref, detalhes) values
  ('criar', 'setor', 'teste14-setor', '{"antes": null, "depois": {"sigla": "TST"}}'),
  ('criar', 'macroprocesso', 'teste14-macro', '{"antes": null, "depois": {"nome": "Teste"}}'),
  ('criar', 'setor_envolvido', 'teste14-vinculo', '{"antes": null, "depois": {"setor_sigla": "TST"}}'),
  ('mudar_perfil', 'usuario', 'teste14-usuario', '{"antes": null, "depois": null}'),
  ('autorizar', 'autorizacao', 'teste14-autorizacao', '{"antes": null, "depois": null}');

-- Quantos eventos do teste o usuário vê, entre os dos cadastros ou entre os de usuários e autorizações.
create function pg_temp.eventos_visiveis(id_usuario text, dos_cadastros boolean) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade_ref like 'teste14-%'
      and (entidade in ('setor', 'macroprocesso', 'setor_envolvido')) = dos_cadastros;
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_visiveis(text, boolean) to authenticated;

insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a1', true), 3,
  'Administrador lê os eventos dos cadastros');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a1', false), 2,
  'Administrador continua lendo os eventos de usuários e autorizações');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a2', true), 3,
  'Integrante lê os eventos dos cadastros');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a2', false), 0,
  'Integrante não lê os eventos de usuários nem de autorizações');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a3', true), 3,
  'Consulta lê os eventos dos cadastros');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a3', false), 0,
  'Consulta não lê os eventos de usuários nem de autorizações');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a4', true), 0,
  'Inativo não lê os eventos dos cadastros');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a4', false), 0,
  'Inativo não lê os eventos de usuários nem de autorizações');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.eventos', '42501', null, 'Visitante não lê o histórico');
reset role;

-- Ninguém grava: as mesmas quatro conferências para cada perfil ativo e para o visitante, com evento de cadastro.
create function pg_temp.conferir_que_nao_grava(papel text, id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', case when id_usuario is null then format('{"role":"%s"}', papel)
    else format('{"sub":"%s","role":"%s"}', id_usuario, papel) end, true);
  execute format('set local role %I', papel);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.eventos (acao, entidade, entidade_ref, detalhes) values ('x', 'setor', 'x', '{}')$sql$,
    '42501', null, quem || ' não inclui evento de cadastro');
  insert into _tap (linha) select throws_ok(
    $sql$update public.eventos set acao = 'x' where entidade = 'setor'$sql$, '42501', null,
    quem || ' não altera evento de cadastro');
  insert into _tap (linha) select throws_ok(
    $sql$delete from public.eventos where entidade = 'setor'$sql$, '42501', null,
    quem || ' não apaga evento de cadastro');
  insert into _tap (linha) select throws_ok(
    $sql$truncate public.eventos$sql$, '42501', null, quem || ' não esvazia o histórico');
  reset role;
end $$;
grant execute on function pg_temp.conferir_que_nao_grava(text, text, text) to anon, authenticated;

select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a1', 'Administrador');
select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_que_nao_grava('anon', null, 'Visitante');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
