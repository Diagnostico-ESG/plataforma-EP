-- Data da modelagem piloto só como realização (enxugar-cartao-e-cadastro, ticket 03; ADR 0035): o banco recusa data depois de hoje
-- (Brasília) ao alterar e ao inserir, com a data recebida e o limite na mensagem; a de hoje é aceita; o cadastro não grava a data.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(15);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000f1', 'TF1', 'Setor Realizada Um');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000f1', null, 'Macro Realizada');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Proc Realizada');

create function pg_temp.data() returns date
language sql stable as $$ select data_da_modelagem_piloto from public.processos where nome = 'Proc Realizada' $$;
grant execute on function pg_temp.data() to authenticated;

create function pg_temp.edicoes() returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = (select id::text from public.processos where nome = 'Proc Realizada') $$;
grant execute on function pg_temp.edicoes() to authenticated;

create function pg_temp.gravar(nova text) returns text
language sql as $$ select format('update public.processos set data_da_modelagem_piloto = %L where nome = %L', nova, 'Proc Realizada') $$;
grant execute on function pg_temp.gravar(text) to authenticated;

create function pg_temp.mensagem(recebida text) returns text
language sql as $$ select format('modelagem_no_futuro:%s:%s', recebida, private.hoje()) $$;
grant execute on function pg_temp.mensagem(text) to authenticated;

-- Administrador: data futura recusada com o valor e o limite; hoje e passado aceitos.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(pg_temp.gravar('2999-01-01'), 'P0001', pg_temp.mensagem('2999-01-01'),
  'administrador: data futura recusada, com a data recebida e o limite');
insert into _tap (linha) select throws_ok(pg_temp.gravar((private.hoje() + 1)::text), 'P0001', pg_temp.mensagem((private.hoje() + 1)::text),
  'administrador: amanhã (em Brasília) recusado');
insert into _tap (linha) select is(pg_temp.data(), null::date, 'a recusa não deixou data');
insert into _tap (linha) select is(pg_temp.edicoes(), 0::bigint, 'a recusa não gerou evento');
insert into _tap (linha) select lives_ok(pg_temp.gravar(private.hoje()::text), 'administrador: a data de hoje é aceita');
insert into _tap (linha) select is(pg_temp.data(), private.hoje(), 'a data de hoje ficou gravada');

-- Integrante: futura recusada, passada aceita.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(pg_temp.gravar('2999-12-31'), 'P0001', pg_temp.mensagem('2999-12-31'),
  'integrante: data futura recusada, com a data recebida e o limite');
insert into _tap (linha) select lives_ok(pg_temp.gravar('2026-10-01'), 'integrante: data passada aceita');
insert into _tap (linha) select is(pg_temp.data(), '2026-10-01'::date, 'a data passada ficou gravada');

-- Consulta e administrador desativado não chegam à linha: nada muda.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
update public.processos set data_da_modelagem_piloto = '2026-10-02' where nome = 'Proc Realizada';
reset role;
insert into _tap (linha) select is(pg_temp.data(), '2026-10-01'::date, 'Consulta não muda a data');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
update public.processos set data_da_modelagem_piloto = '2026-10-02' where nome = 'Proc Realizada';
reset role;
insert into _tap (linha) select is(pg_temp.data(), '2026-10-01'::date, 'administrador desativado não muda a data');

-- Visitante: barrado antes, pela tabela.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(pg_temp.gravar('2026-10-02'), '42501', null, 'visitante não muda a data');
reset role;

-- Inserir com data futura (o dono do banco passa pelas permissões, mas não pelo gatilho).
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, data_da_modelagem_piloto)
    values ('5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Proc Inserida Futura', '2999-01-01')$sql$,
  'P0001', pg_temp.mensagem('2999-01-01'), 'inserir com data futura é recusado pelo gatilho');

-- O cadastro não grava a data; o update continua permitido.
insert into _tap (linha) select is(has_column_privilege('authenticated', 'public.processos', 'data_da_modelagem_piloto', 'INSERT'), false,
  'o cadastro não tem permissão de gravar a data');
insert into _tap (linha) select is(has_column_privilege('authenticated', 'public.processos', 'data_da_modelagem_piloto', 'UPDATE'), true,
  'a data continua gravável por update');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
