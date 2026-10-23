-- Andamento das etapas do processo: sequência (a Modelagem piloto sem depender do setor), uma em andamento,
-- dispensa, nota, concluído calculado, perfis e eventos (processos-etapas, ticket 05).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(24);

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

-- Um setor, um macroprocesso e dois processos.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000001', 'TS5', 'Setor Andamento');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000001', null, 'Macro Andamento');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000001', 'af000000-0000-0000-0000-000000000001', 'Processo Andamento'),
  ('5f000000-0000-0000-0000-000000000001', 'af000000-0000-0000-0000-000000000001', 'Processo Perfis');

-- O andamento de uma etapa num processo (o id nasce pelo gatilho, então é buscado) e a ação sobre ele.
create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(codigo_da_etapa text, novo public.status_da_etapa, nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento('Processo Andamento', codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, public.status_da_etapa, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Iniciar e concluir: a data do dia é gravada. A primeira etapa (Modelagem piloto) não depende do setor.
insert into _tap (linha) select lives_ok($sql$select pg_temp.agir('modelagem', 'em_andamento')$sql$,
  'iniciar a Modelagem piloto sem depender do setor');
insert into _tap (linha) select is(
  (select iniciada_em from public.andamentos where id = pg_temp.andamento('Processo Andamento', 'modelagem')),
  private.hoje(), 'iniciar grava a data de início de hoje');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'em_andamento')$sql$, 'P0001',
  'ja_ha_etapa_em_andamento:Modelagem piloto', 'segunda etapa em andamento no processo é recusada');
insert into _tap (linha) select lives_ok($sql$select pg_temp.agir('modelagem', 'concluida')$sql$,
  'concluir a etapa em andamento');
insert into _tap (linha) select is(
  (select resolvida_em from public.andamentos where id = pg_temp.andamento('Processo Andamento', 'modelagem')),
  private.hoje(), 'concluir grava a data de conclusão de hoje');

-- Sequência, dispensa, nota e transições.
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('revisao_interna', 'em_andamento')$sql$, 'P0001',
  'anterior_nao_resolvida:Relatório e modelagem técnica', 'iniciar a 6 com a 5 pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'dispensada', 'Não se aplica')$sql$, 'P0001',
  'etapa_obrigatoria:Relatório e modelagem técnica', 'dispensar etapa obrigatória é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'realizada_anteriormente')$sql$, '23514', null,
  'realizada anteriormente sem nota é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'concluida')$sql$, 'P0001',
  'transicao_nao_permitida:pendente:concluida', 'concluir uma etapa pendente é recusado');

-- Todas as obrigatórias resolvidas: concluído, com a 9 (opcional) ainda pendente.
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes')$sql$,
  'registrar a etapa como realizada anteriormente, com nota');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('revisao_interna', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a revisão interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('revisao_setor', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a Validação com o setor');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('aprovacao_setor', 'realizada_anteriormente', 'Feita antes')$sql$, 'registrar a aprovação');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Andamento'),
  'em_andamento', 'com as obrigatórias resolvidas e a Publicação pendente sem escolha, o processo segue em andamento (ADR 0020)');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where nome = 'Processo Andamento'),
  'publicacao', 'a etapa atual é a opcional que sobrou');
-- A Publicação, a única opcional do catálogo, não se dispensa (publicacao-e-arquivamento, ticket 02): a nota fica com a
-- "realizada anteriormente".
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('publicacao', 'dispensada', 'Sem publicação neste caso')$sql$,
  'P0001', 'publicacao_nao_se_dispensa', 'dispensar a Publicação é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('publicacao', 'realizada_anteriormente', 'Sem publicação neste caso')$sql$,
  'registrar a Publicação como realizada anteriormente, com nota');

-- Eventos: um por ação aceita, com o processo legível, a referência 'processo:andamento' e a nota em "motivo".
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos
    where entidade = 'andamento' and entidade_ref like (select id::text from public.processos where nome = 'Processo Andamento') || ':%'),
  7, 'cada ação aceita gera um evento do andamento do processo');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where acao = 'registrar_realizada'
    and entidade_ref = (select id::text from public.processos where nome = 'Processo Andamento') || ':'
      || pg_temp.andamento('Processo Andamento', 'publicacao')::text),
  'Sem publicação neste caso', 'o evento da realizada anteriormente traz a nota em motivo');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'processo_nome' from public.eventos where acao = 'registrar_realizada'
    and entidade_ref = (select id::text from public.processos where nome = 'Processo Andamento') || ':'
      || pg_temp.andamento('Processo Andamento', 'publicacao')::text),
  'Processo Andamento', 'o evento traz o nome do processo, legível depois de uma exclusão');

-- Perfis: Consulta e inativo não alteram (nenhuma linha muda); Administrador altera; visitante nem tenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
with alterados as (update public.andamentos set status = 'em_andamento'
  where id = pg_temp.andamento('Processo Perfis', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não anda com o processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
with alterados as (update public.andamentos set status = 'em_andamento'
  where id = pg_temp.andamento('Processo Perfis', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Inativo não anda com o processo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('Processo Perfis', 'modelagem')$sql$, 'Administrador anda com o processo');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'concluida' where processo_id is not null$sql$, '42501', null,
  'visitante não anda com o processo');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
