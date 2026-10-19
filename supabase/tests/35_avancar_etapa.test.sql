-- Avanço da etapa (processos-etapas, ticket 13, ADR 0014): resolver a etapa atual já inicia a próxima, com o
-- responsável escolhido, numa transação só. Quem pode o quê, as recusas e os eventos.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(46);

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

-- Um setor, um macroprocesso e seis processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000013', 'T13', 'Setor Avanço');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000013', null, 'Macro Avanço');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000013', 'af000000-0000-0000-0000-000000000013', nome
from unnest(array['Processo Avanco', 'Processo Realizada', 'Processo Ultima', 'Processo Recusas',
  'Processo Congelado', 'Processo Pulo']) as nome;

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

create function pg_temp.avancar(nome_do_processo text, codigo_da_etapa text, acao text, nota text, responsavel uuid)
  returns void
language sql as $$
  select public.avancar_etapa(pg_temp.andamento(nome_do_processo, codigo_da_etapa), acao, nota, responsavel) $$;
grant execute on function pg_temp.avancar(text, text, text, text, uuid) to authenticated;

create function pg_temp.responsavel(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select responsavel_id from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.responsavel(text, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Processo Avanco: concluir a 2 inicia a 3 com o responsável escolhido.
select pg_temp.agir('Processo Avanco', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Avanco', 'modelagem', 'concluida');
select pg_temp.agir('Processo Avanco', 'relatorio_modelagem_tecnica', 'em_andamento');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Avanco', 'relatorio_modelagem_tecnica', 'concluir', null,
    '00000000-0000-0000-0000-0000000000a1')$sql$, 'concluir a 2 com a 3 pendente');
insert into _tap (linha) select is(pg_temp.status('Processo Avanco', 'relatorio_modelagem_tecnica'),
  'concluida'::public.status_da_etapa, 'a etapa resolvida fica concluída');
insert into _tap (linha) select is(pg_temp.status('Processo Avanco', 'revisao_interna'),
  'em_andamento'::public.status_da_etapa, 'a próxima entra em andamento');
insert into _tap (linha) select ok(
  (select iniciada_em = current_date from public.andamentos where id = pg_temp.andamento('Processo Avanco', 'revisao_interna')),
  'a próxima começa hoje');
insert into _tap (linha) select is(pg_temp.responsavel('Processo Avanco', 'revisao_interna'),
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'a próxima fica com o responsável escolhido');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'concluir'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Avanco', 'relatorio_modelagem_tecnica')::text),
  1, 'um evento de concluir na etapa resolvida');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'iniciar'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Avanco', 'revisao_interna')::text),
  1, 'um evento de iniciar na próxima');
insert into _tap (linha) select is(
  (select array_agg(distinct autor_id) from public.eventos where entidade = 'andamento'
    and ((acao = 'concluir' and entidade_ref like '%:' || pg_temp.andamento('Processo Avanco', 'relatorio_modelagem_tecnica')::text)
      or (acao = 'iniciar' and entidade_ref like '%:' || pg_temp.andamento('Processo Avanco', 'revisao_interna')::text))),
  array['00000000-0000-0000-0000-0000000000a2'::uuid], 'os dois eventos têm o mesmo autor');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'responsavel_nome' from public.eventos where acao = 'iniciar'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Avanco', 'revisao_interna')::text),
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a1'),
  'o evento de iniciar traz o responsável');

-- "Ninguém por enquanto": a próxima entra em andamento sem responsável.
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Avanco', 'revisao_interna', 'realizada_anteriormente', 'Feita antes', null)$sql$,
  'resolver a 3 sem responsável (a conclusão da Revisão interna passa pela função da revisão: teste 39)');
insert into _tap (linha) select is(pg_temp.status('Processo Avanco', 'revisao_setor'),
  'em_andamento'::public.status_da_etapa, 'a próxima entra em andamento mesmo sem responsável');
insert into _tap (linha) select is(pg_temp.responsavel('Processo Avanco', 'revisao_setor'), null::uuid,
  'a próxima fica sem responsável');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Avanco', 'relatorio_modelagem_tecnica', 'concluir', null, null)$sql$,
  'P0001', 'transicao_nao_permitida:concluida:concluida', 'resolver de novo uma etapa já concluída é recusado');

-- Processo Realizada: realizada anteriormente avança igual, com a nota.
select pg_temp.agir('Processo Realizada', 'modelagem', 'em_andamento');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Realizada', 'modelagem', 'realizada_anteriormente', 'Feita em 2025',
    '00000000-0000-0000-0000-0000000000a2')$sql$, 'registrar a 1 como realizada anteriormente');
insert into _tap (linha) select is(pg_temp.status('Processo Realizada', 'modelagem'),
  'realizada_anteriormente'::public.status_da_etapa, 'a etapa fica realizada anteriormente');
insert into _tap (linha) select is(
  (select nota from public.andamentos where id = pg_temp.andamento('Processo Realizada', 'modelagem')),
  'Feita em 2025', 'a nota fica na etapa');
insert into _tap (linha) select is(pg_temp.status('Processo Realizada', 'relatorio_modelagem_tecnica'),
  'em_andamento'::public.status_da_etapa, 'a próxima entra em andamento');
insert into _tap (linha) select is(pg_temp.responsavel('Processo Realizada', 'relatorio_modelagem_tecnica'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'a próxima fica com o responsável escolhido');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'registrar_realizada'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Realizada', 'modelagem')::text),
  1, 'um evento de realizada anteriormente');

-- (Desde o ticket 03 de revisoes-aprovacao, concluir a Aprovação exige aprovação: aqui ela entra como "realizada anteriormente".)
-- Processo Ultima: a opcional depois da última obrigatória também inicia; concluir a última não inicia nada.
select pg_temp.agir('Processo Ultima', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Ultima', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Ultima', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Ultima', 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Ultima', 'aprovacao_setor', 'em_andamento');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Ultima', 'aprovacao_setor', 'realizada_anteriormente', 'Aprovada antes da plataforma',
    '00000000-0000-0000-0000-0000000000a1')$sql$, 'resolver a 5 com a opcional pendente');
insert into _tap (linha) select is(pg_temp.status('Processo Ultima', 'publicacao'),
  'em_andamento'::public.status_da_etapa, 'a opcional entra em andamento como qualquer outra');
insert into _tap (linha) select is(pg_temp.responsavel('Processo Ultima', 'publicacao'),
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'a opcional fica com o responsável escolhido');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Ultima', 'publicacao', 'concluir', null, null)$sql$, 'concluir a última etapa');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos a join public.processos p on p.id = a.processo_id
    where p.nome = 'Processo Ultima' and a.status = 'em_andamento'), 0, 'concluir a última não inicia nada');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Ultima'), 'concluido',
  'resolvidas as etapas, o processo fica concluído');

-- Processo Recusas: nenhuma etapa muda quando o avanço é recusado.
select pg_temp.agir('Processo Recusas', 'modelagem', 'em_andamento');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'dispensar', 'Motivo', null)$sql$,
  'P0001', 'etapa_obrigatoria:Modelagem piloto', 'dispensar etapa obrigatória é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'realizada_anteriormente', '   ', null)$sql$,
  'P0001', 'nota_obrigatoria', 'realizada anteriormente sem nota é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'concluir', null, '00000000-0000-0000-0000-0000000000a3')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a3'),
  'responsável de perfil Consulta é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'concluir', null, '00000000-0000-0000-0000-0000000000a4')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a4'),
  'responsável inativo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'iniciar', null, null)$sql$,
  'P0001', 'acao_invalida:iniciar', 'ação fora das três é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'relatorio_modelagem_tecnica', 'concluir', null, null)$sql$,
  'P0001', 'transicao_nao_permitida:pendente:concluida', 'concluir uma etapa pendente é recusado');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos a join public.processos p on p.id = a.processo_id
    where p.nome = 'Processo Recusas' and a.status = 'pendente'), 5, 'nenhuma etapa pendente mudou');
insert into _tap (linha) select is(pg_temp.status('Processo Recusas', 'modelagem'),
  'em_andamento'::public.status_da_etapa, 'a etapa atual continua em andamento');

-- Processo Congelado: suspenso, nenhuma etapa muda.
select pg_temp.agir('Processo Congelado', 'modelagem', 'em_andamento');
select public.suspender_processo((select id from public.processos where nome = 'Processo Congelado'), 'Parado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Congelado', 'modelagem', 'concluir', null, null)$sql$,
  'P0001', 'processo_parado:suspenso', 'processo suspenso não avança');
insert into _tap (linha) select is(pg_temp.status('Processo Congelado', 'modelagem'),
  'em_andamento'::public.status_da_etapa, 'a etapa do processo suspenso continua como estava');

-- Processo Pulo: a etapa opcional nova entra antes de uma já resolvida; o avanço pula a resolvida.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select pg_temp.agir('Processo Pulo', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Pulo', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Pulo', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
select public.acrescentar_etapa('opcional_teste', 'Opcional de teste', false,
  (select id from public.etapas where codigo = 'revisao_interna'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Pulo', 'opcional_teste', 'dispensar', null, '00000000-0000-0000-0000-0000000000a2')$sql$,
  'P0001', 'nota_obrigatoria', 'dispensar sem nota é recusado');
insert into _tap (linha) select is(pg_temp.status('Processo Pulo', 'opcional_teste'),
  'pendente'::public.status_da_etapa, 'a opcional recusada continua pendente');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.avancar('Processo Pulo', 'opcional_teste', 'dispensar', 'Não se aplica',
    '00000000-0000-0000-0000-0000000000a2')$sql$, 'dispensar a opcional com nota');
insert into _tap (linha) select is(pg_temp.status('Processo Pulo', 'opcional_teste'),
  'dispensada'::public.status_da_etapa, 'a opcional fica dispensada');
insert into _tap (linha) select is(pg_temp.status('Processo Pulo', 'revisao_interna'),
  'realizada_anteriormente'::public.status_da_etapa, 'a etapa já resolvida não é reaberta');
insert into _tap (linha) select is(pg_temp.status('Processo Pulo', 'revisao_setor'),
  'em_andamento'::public.status_da_etapa, 'inicia a primeira pendente depois da resolvida');
insert into _tap (linha) select is(pg_temp.responsavel('Processo Pulo', 'revisao_setor'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'a etapa iniciada fica com o responsável escolhido');

-- Perfis: Consulta e inativo não avançam; visitante nem tenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'concluir', null, null)$sql$, '42501', null,
  'Consulta não avança a etapa');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.avancar('Processo Recusas', 'modelagem', 'concluir', null, null)$sql$,
  'P0001', 'registro_inexistente', 'Inativo não avança a etapa (não lê nada, a etapa "não existe" para ele)');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa('00000000-0000-0000-0000-000000000000', 'concluir', null, null)$sql$, '42501', null,
  'visitante não avança a etapa');

reset role;
-- A função não é security definer: a RLS de quem chama decide.
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'avancar_etapa' and pronamespace = 'public'::regnamespace), false,
  'avancar_etapa não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
