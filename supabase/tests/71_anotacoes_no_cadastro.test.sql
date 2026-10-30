-- Anotações no cadastro (enxugar-cartao-e-cadastro, ticket 04): o cadastro grava as Anotações, o banco registra quem e quando,
-- o limite é de 8.000 caracteres, e cada perfil (inclusive desativado e visitante) cadastra e lê como a spec manda.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(17);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000071', 'T71', 'Setor Cadastro Anotações');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000071', null, 'Macro Cadastro Anotações');

-- O que a tela envia: o cadastro com Anotações.
create function pg_temp.criar(nome_do_processo text, texto text) returns text
language sql as $$
  select format($sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, anotacoes)
    values ('5f000000-0000-0000-0000-000000000071', 'af000000-0000-0000-0000-000000000071', %L, 'processo', %L)$sql$,
    nome_do_processo, texto) $$;
grant execute on function pg_temp.criar(text, text) to authenticated;

-- O cadastro sem Anotações (a coluna nem é citada).
create function pg_temp.sem_anotacoes(nome_do_processo text) returns text
language sql as $$
  select format($sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
    values ('5f000000-0000-0000-0000-000000000071', 'af000000-0000-0000-0000-000000000071', %L, 'processo')$sql$,
    nome_do_processo) $$;
grant execute on function pg_temp.sem_anotacoes(text) to authenticated;

create function pg_temp.texto(nome_do_processo text) returns text
language sql stable as $$ select anotacoes from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.texto(text) to authenticated;

create function pg_temp.autor(nome_do_processo text) returns uuid
language sql stable as $$ select anotacoes_alteradas_por from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.autor(text) to authenticated;

create function pg_temp.momento(nome_do_processo text) returns timestamptz
language sql stable as $$ select anotacoes_alteradas_em from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.momento(text) to authenticated;

create function pg_temp.existe(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.existe(text) to authenticated;

-- Administrador cadastra com Anotações: o banco registra quem e quando.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(pg_temp.criar('Admin Com', 'Combinado no cadastro'), 'administrador cadastra com Anotações');
insert into _tap (linha) select is(pg_temp.texto('Admin Com'), 'Combinado no cadastro', 'o texto ficou no processo');
insert into _tap (linha) select is(pg_temp.autor('Admin Com'), '00000000-0000-0000-0000-0000000000a1'::uuid, 'o banco registrou o administrador como autor');
insert into _tap (linha) select ok(pg_temp.momento('Admin Com') is not null, 'o banco registrou a hora');

-- Sem Anotações, o cadastro funciona e autor e hora ficam vazios.
insert into _tap (linha) select lives_ok(pg_temp.sem_anotacoes('Admin Sem'), 'administrador cadastra sem Anotações');
insert into _tap (linha) select ok(pg_temp.autor('Admin Sem') is null and pg_temp.momento('Admin Sem') is null,
  'sem texto, não há autor nem hora');

-- Limite de 8.000 caracteres.
insert into _tap (linha) select lives_ok(pg_temp.criar('Limite Exato', repeat('a', 8000)), '8.000 caracteres são aceitos no cadastro');
insert into _tap (linha) select throws_ok(pg_temp.criar('Limite Passado', repeat('a', 8001)), '23514', null,
  '8.001 caracteres são recusados no cadastro');

-- Integrante cadastra e fica como autor.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(pg_temp.criar('Integrante Com', 'Texto do integrante'), 'integrante cadastra com Anotações');
insert into _tap (linha) select is(pg_temp.autor('Integrante Com'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'o autor é o integrante');

-- Consulta lê, mas não cadastra.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Consulta Com', 'Da consulta'), '42501', null, 'consulta não cadastra');
insert into _tap (linha) select is(pg_temp.texto('Admin Com'), 'Combinado no cadastro', 'consulta lê as Anotações do cadastro');

-- Administrador desativado não cadastra nem lê.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(pg_temp.criar('Inativo Com', 'Do inativo'), '42501', null, 'desativado não cadastra');
insert into _tap (linha) select is(pg_temp.texto('Admin Com'), null::text, 'desativado não lê as Anotações');
reset role;
insert into _tap (linha) select is(pg_temp.existe('Consulta Com') + pg_temp.existe('Inativo Com'), 0::bigint,
  'nenhum dos dois recusados deixou processo');

-- Visitante não cadastra nem lê.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(pg_temp.criar('Visitante Com', 'Do visitante'), '42501', null, 'visitante não cadastra');
insert into _tap (linha) select throws_ok($sql$select anotacoes from public.processos$sql$, '42501', null, 'visitante não lê as Anotações');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
