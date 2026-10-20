-- Fase do Regimento no catálogo (exportacao-e-manutencao, ticket 01; spec, histórias 1 a 8): cada etapa tem uma fase
-- de IV a IX, obrigatória; as seis etapas atuais já vêm com a fase; a mudança de fase vira evento do catálogo; só o
-- administrador ativo muda a fase (inclusive a de uma etapa protegida).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(23);

-- Os eventos anteriores ao teste não contam (o banco de desenvolvimento pode já ter eventos do catálogo).
create temp table _inicio as select coalesce(max(id), 0) as ultimo_evento from public.eventos;
grant select on _inicio to authenticated;

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

create function pg_temp.entrar(id_usuario text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
end $$;
grant execute on function pg_temp.entrar(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.fase(codigo_da_etapa text) returns text
language sql stable as $$ select fase::text from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.fase(text) to authenticated;

-- A coluna e a carga das seis etapas atuais (história 5), lidas como administrador.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select col_not_null('public', 'etapas', 'fase', 'a fase da etapa é obrigatória');
insert into _tap (linha) select is(pg_temp.fase('modelagem'), 'IV', 'Modelagem piloto está na fase IV');
insert into _tap (linha) select is(pg_temp.fase('relatorio_modelagem_tecnica'), 'V',
  'Relatório e modelagem técnica está na fase V');
insert into _tap (linha) select is(pg_temp.fase('revisao_interna'), 'VI', 'Revisão interna está na fase VI');
insert into _tap (linha) select is(pg_temp.fase('revisao_setor'), 'VI', 'Revisão pelo setor está na fase VI');
insert into _tap (linha) select is(pg_temp.fase('aprovacao_setor'), 'VI', 'Aprovação pelo setor está na fase VI');
insert into _tap (linha) select is(pg_temp.fase('publicacao'), 'VII', 'Publicação está na fase VII');

-- Etapa sem fase e fase fora de IV a IX são recusadas (histórias 1 e 2).
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('teste_sem_fase', 'Etapa Sem Fase', true, null, null)$sql$,
  '23502', null, 'etapa sem fase é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('teste_fase_3', 'Etapa Fase Tres', true, 'III', null)$sql$,
  '22P02', null, 'fase fora de IV a IX é recusada');

-- Acrescentar grava a fase, e o evento do catálogo a leva no depois.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_fase', 'Etapa da Fase', false, 'VIII', null)$sql$,
  'o administrador acrescenta uma etapa com fase');
insert into _tap (linha) select is(pg_temp.fase('teste_fase'), 'VIII', 'a etapa nova guarda a fase escolhida');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'fase' from public.eventos where entidade = 'etapa' and acao = 'acrescentar'
    and entidade_ref = pg_temp.etapa('teste_fase')::text and id > (select ultimo_evento from _inicio)),
  'VIII', 'o evento de acrescentar traz a fase');

-- Mudar a fase: evento com o antes e o depois (história 6); a de etapa protegida também muda (história 8).
with alteradas as (update public.etapas set fase = 'IX' where codigo = 'teste_fase' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'o administrador troca a fase da etapa');
insert into _tap (linha) select is(
  (select (detalhes -> 'antes' ->> 'fase') || '>' || (detalhes -> 'depois' ->> 'fase') from public.eventos
    where entidade = 'etapa' and acao = 'editar' and entidade_ref = pg_temp.etapa('teste_fase')::text
      and id > (select ultimo_evento from _inicio)),
  'VIII>IX', 'mudar a fase gera evento de edição com o antes e o depois');
with alteradas as (update public.etapas set fase = 'V' where codigo = 'revisao_interna' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1,
  'o administrador troca a fase de uma etapa protegida');
insert into _tap (linha) select is(pg_temp.fase('revisao_interna'), 'V', 'a etapa protegida guarda a fase nova');
reset role;

-- Os outros perfis não acrescentam etapa nem mudam a fase (história 7).
create function pg_temp.conferir_perfil(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  insert into _tap (linha) select throws_ok(
    $sql$select public.acrescentar_etapa('teste_outro', 'Etapa de Outro', false, 'VI', null)$sql$,
    '42501', null, quem || ' não acrescenta etapa com fase');
  with alteradas as (update public.etapas set fase = 'IX' where codigo = 'publicacao' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não muda a fase');
  reset role;
end $$;
grant execute on function pg_temp.conferir_perfil(text, text) to authenticated;

select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a4', 'Inativo');

-- Visitante.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set fase = 'IX' where codigo = 'publicacao'$sql$,
  '42501', null, 'Visitante não muda a fase');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
