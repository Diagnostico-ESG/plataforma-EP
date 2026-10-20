-- Datas de início e fim das etapas no fuso do escritório (bug do backlog, 2026-10-20): o gatilho de andamentos, a
-- conferência de datas e a reabertura da etapa usavam current_date (dia do relógio do banco, UTC) e, depois das 21h em
-- Brasília, gravavam ou recusavam o dia seguinte. O dia certo é o de private.hoje().
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(5);

-- Usuário inventado: a2 integrante.
insert into public.autorizacoes (email, perfil) values ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000045', 'T45', 'Setor Fuso');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000045', null, 'Macro Fuso');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000045', 'af000000-0000-0000-0000-000000000045', 'Processo Datas'),
  ('5f000000-0000-0000-0000-000000000045', 'af000000-0000-0000-0000-000000000045', 'Processo Sem Inicio');

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo public.status_da_etapa,
  nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, text, public.status_da_etapa, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
-- Escolhe, entre um fuso à frente e um atrás de Brasília, o que está em outro dia agora (sempre há um): com current_date
-- do banco a data gravada seria a do dia errado.
select set_config('timezone', case when (now() at time zone 'Pacific/Kiritimati')::date <> (now() at time zone 'America/Sao_Paulo')::date
  then 'Pacific/Kiritimati' else 'Etc/GMT+12' end, true);

select pg_temp.agir('Processo Datas', 'modelagem', 'em_andamento');
insert into _tap (linha) select is(
  (select iniciada_em from public.andamentos where id = pg_temp.andamento('Processo Datas', 'modelagem')),
  (now() at time zone 'America/Sao_Paulo')::date, 'iniciar grava o dia de Brasília, qualquer que seja o fuso da conexão');
select pg_temp.agir('Processo Datas', 'modelagem', 'concluida');
insert into _tap (linha) select is(
  (select resolvida_em from public.andamentos where id = pg_temp.andamento('Processo Datas', 'modelagem')),
  (now() at time zone 'America/Sao_Paulo')::date, 'concluir grava o dia de Brasília, qualquer que seja o fuso da conexão');

-- O dia de Brasília nunca é "futuro", mesmo com o relógio do banco num dia anterior.
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set iniciada_em = (now() at time zone 'America/Sao_Paulo')::date,
    resolvida_em = (now() at time zone 'America/Sao_Paulo')::date
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'a data de hoje em Brasília é aceita na correção das datas, qualquer que seja o fuso da conexão');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set resolvida_em = (now() at time zone 'America/Sao_Paulo')::date + 1
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'P0001', 'data_no_futuro:' || ((now() at time zone 'America/Sao_Paulo')::date + 1)::text,
  'o dia seguinte ao de Brasília continua sendo futuro');

-- Etapa resolvida sem início ("realizada anteriormente") que volta recebe o dia de Brasília como início.
select pg_temp.agir('Processo Sem Inicio', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select public.voltar_a_etapa(pg_temp.andamento('Processo Sem Inicio', 'modelagem'), 'Refazer', null);
insert into _tap (linha) select is(
  (select iniciada_em from public.andamentos where id = pg_temp.andamento('Processo Sem Inicio', 'modelagem')),
  (now() at time zone 'America/Sao_Paulo')::date, 'voltar a uma etapa sem início grava o dia de Brasília');

reset timezone;
reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
