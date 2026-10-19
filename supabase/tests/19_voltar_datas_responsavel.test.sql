-- Voltar a uma etapa, corrigir datas e mudar o responsável da etapa (processos-etapas, ticket 06):
-- função de voltar (processo e setor), datas, responsável, perfis e eventos.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(35);

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

-- Um setor, um macroprocesso e três processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000006', 'TS6', 'Setor Volta');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000006', null, 'Macro Volta');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Volta'),
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Datas'),
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Concluido');

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

create function pg_temp.status(nome_do_processo text, codigo_da_etapa text) returns public.status_da_etapa
language sql stable as $$ select status from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.status(text, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Preparação: "Processo Volta" com a 1 e a 2 concluídas.
select pg_temp.agir('Processo Volta', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Volta', 'modelagem', 'concluida');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'em_andamento');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'concluida');
select pg_temp.agir('Processo Volta', 'revisao_interna', 'em_andamento');
-- A Revisão interna só conclui com a revisão da versão mais recente (ticket 02 de revisoes-aprovacao): aqui só importa estar resolvida.
select pg_temp.agir('Processo Volta', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');

-- Voltar à 4 com a 5 e a 6 concluídas.
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), 'Mudou o escopo', null)$sql$,
  'voltar à etapa 4 com a 5 e a 6 concluídas');
insert into _tap (linha) select is(pg_temp.status('Processo Volta', 'modelagem'), 'em_andamento'::public.status_da_etapa,
  'a etapa escolhida volta a em andamento');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where id in (
    pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), pg_temp.andamento('Processo Volta', 'revisao_interna'))
    and status = 'pendente'), 2, 'as seguintes resolvidas voltam a pendente');
insert into _tap (linha) select ok(
  (select iniciada_em = current_date and resolvida_em is null from public.andamentos
    where id = pg_temp.andamento('Processo Volta', 'modelagem')),
  'a escolhida mantém o início e perde a conclusão');
insert into _tap (linha) select ok(
  (select bool_and(iniciada_em is null and resolvida_em is null) from public.andamentos
    where id in (pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), pg_temp.andamento('Processo Volta', 'revisao_interna'))),
  'as seguintes ficam sem datas');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'voltar' and entidade = 'andamento'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Volta') || ':%'),
  3, 'um evento de voltar por andamento alterado');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where acao = 'voltar' and entidade = 'andamento'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Volta') || ':%' limit 1),
  'Mudou o escopo', 'o evento traz o motivo');

-- Voltar com a etapa seguinte em andamento: só uma fica em andamento.
select pg_temp.agir('Processo Volta', 'modelagem', 'concluida');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'em_andamento');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), 'Refazer', null)$sql$,
  'voltar à 4 com a 5 em andamento');
insert into _tap (linha) select is(pg_temp.status('Processo Volta', 'relatorio_modelagem_tecnica'), 'pendente'::public.status_da_etapa,
  'a seguinte em andamento volta a pendente');

-- Recusas.
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), '  ', null)$sql$, 'P0001', 'motivo_obrigatorio',
  'voltar sem motivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), null, null)$sql$, 'P0001', 'motivo_obrigatorio',
  'voltar com motivo nulo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), 'Motivo', null)$sql$,
  'P0001', 'etapa_nao_resolvida:Relatório e modelagem técnica', 'voltar a uma etapa que não está resolvida é recusado');

-- O processo concluído deixa de ser concluído ao voltar.
select pg_temp.agir('Processo Concluido', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'aprovacao_setor', 'realizada_anteriormente', 'Feita antes');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Concluido'), 'concluido',
  'com as obrigatórias resolvidas o processo é concluído');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Concluido', 'revisao_interna'), 'Faltou revisar', null)$sql$,
  'voltar numa etapa do processo concluído');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Concluido'), 'em_andamento',
  'voltar tira o processo de concluído');

-- Datas: nunca no futuro; conclusão nunca antes do início.
select pg_temp.agir('Processo Datas', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Datas', 'modelagem', 'concluida');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set iniciada_em = %L where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
    current_date + 1), 'P0001', 'data_no_futuro:' || (current_date + 1)::text, 'início no futuro é recusado');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set resolvida_em = %L where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
    current_date + 1), 'P0001', 'data_no_futuro:' || (current_date + 1)::text, 'conclusão no futuro é recusada');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set iniciada_em = %L, resolvida_em = %L
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, current_date, current_date - 1),
  'P0001', 'resolvida_antes_do_inicio:' || (current_date - 1)::text || ':' || current_date::text,
  'conclusão antes do início é recusada');
insert into _tap (linha) select lives_ok(
  format($sql$update public.andamentos set iniciada_em = %L, resolvida_em = %L
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, current_date - 3, current_date - 1),
  'corrigir início e conclusão');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  1, 'corrigir as datas gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'resolvida_em' from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  (current_date - 1)::text, 'o evento traz a data nova');
update public.andamentos set iniciada_em = iniciada_em where id = pg_temp.andamento('Processo Datas', 'modelagem');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  1, 'gravar sem mudar nada não gera evento');

-- Responsável: só usuário ativo Administrador ou Integrante.
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a3'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a3'),
  'responsável de perfil Consulta é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a4'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a4'),
  'responsável inativo é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, 'responsável Integrante aceito');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a1'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, 'responsável Administrador aceito');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'mudar_responsavel'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  2, 'cada troca de responsável gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'responsavel_nome' from public.eventos where acao = 'mudar_responsavel'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text order by id desc limit 1),
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a1'),
  'o evento traz o nome do responsável');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = null where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'tirar o responsável é aceito');

-- Perfis: Consulta e inativo não alteram; visitante nem tenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
with alterados as (update public.andamentos set iniciada_em = current_date - 5
  where id = pg_temp.andamento('Processo Datas', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não corrige datas');
with alterados as (update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
  where id = pg_temp.andamento('Processo Datas', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não muda o responsável');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Datas', 'modelagem'), 'Tentativa', null)$sql$, '42501', null,
  'Consulta não volta a etapa');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Datas', 'modelagem'), 'Tentativa', null)$sql$,
  'P0001', 'registro_inexistente', 'Inativo não volta a etapa (não lê nada, a etapa "não existe" para ele)');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa('00000000-0000-0000-0000-000000000000', 'Tentativa', null)$sql$, '42501', null,
  'visitante não volta a etapa');

reset role;
-- A função não é security definer: a RLS de quem chama decide.
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'voltar_a_etapa' and pronamespace = 'public'::regnamespace), false,
  'voltar_a_etapa não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
