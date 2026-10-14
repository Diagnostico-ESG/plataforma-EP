-- Etapas do setor: catálogo e andamentos, quem pode o quê, sequência, dispensa, datas e eventos
-- (processos-etapas, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(81);

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

-- Setores inventados: TPA a TPC para os perfis, TRS para as regras. O gatilho dá a cada um as 3 etapas do setor.
insert into public.setores (id, sigla, nome) values
  ('5b000000-0000-0000-0000-000000000001', 'TPA', 'Setor Perfil A'),
  ('5b000000-0000-0000-0000-000000000002', 'TPB', 'Setor Perfil B'),
  ('5b000000-0000-0000-0000-000000000003', 'TPC', 'Setor Perfil C'),
  ('5b000000-0000-0000-0000-000000000004', 'TRS', 'Setor das Regras');

-- O andamento de uma etapa num setor (o id nasce pelo gatilho, então é buscado).
create function pg_temp.andamento(sigla_do_setor text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.setores s on s.id = a.setor_id
  join public.etapas e on e.id = a.etapa_id
  where s.sigla = sigla_do_setor and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

-- Catálogo: o administrador lê, cria, altera e apaga; os outros perfis ativos só leem; código e nível ninguém muda.
create function pg_temp.conferir_catalogo(id_usuario text, quem text, administrador boolean, le int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.etapas where codigo in ('identificacao_responsaveis', 'sensibilizacao',
      'identificacao_processos', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_setor',
      'aprovacao_setor', 'publicacao')), le,
    quem || case when le > 0 then ' lê o catálogo' else ' não lê o catálogo' end);
  if administrador then
    insert into _tap (linha) select lives_ok(
      $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
        values ('teste_quinze', 'Etapa Teste Quinze', 99, 'processo', false)$sql$, quem || ' cria etapa');
  else
    insert into _tap (linha) select throws_ok(
      $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
        values ('teste_dezesseis', 'Etapa Teste Dezesseis', 98, 'processo', false)$sql$,
      '42501', null, quem || ' não cria etapa');
  end if;
  with alteradas as (update public.etapas set obrigatoria = false where codigo = 'publicacao' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when administrador then 1 else 0 end,
    quem || case when administrador then ' altera a etapa' else ' não altera a etapa' end);
  insert into _tap (linha) select throws_ok(
    $sql$update public.etapas set codigo = 'outro_codigo' where codigo = 'publicacao'$sql$, '42501', null,
    quem || ' não altera o código');
  insert into _tap (linha) select throws_ok(
    $sql$update public.etapas set nivel = 'setor' where codigo = 'publicacao'$sql$, '42501', null,
    quem || ' não altera o nível');
  with apagadas as (delete from public.etapas
    where codigo = case when administrador then 'teste_quinze' else 'publicacao' end returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), case when administrador then 1 else 0 end,
    quem || case when administrador then ' apaga etapa nunca usada' else ' não apaga etapa' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_catalogo(text, text, boolean, int) to authenticated;

select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a1', 'Administrador', true, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a2', 'Integrante', false, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a3', 'Consulta', false, 9);
select pg_temp.conferir_catalogo('00000000-0000-0000-0000-0000000000a4', 'Inativo', false, 0);

-- Andamentos: Administrador e Integrante mudam o status; ninguém cria, apaga ou troca etapa e setor direto.
create function pg_temp.conferir_andamentos(id_usuario text, quem text, sigla_do_setor text, altera boolean, le int)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.andamentos a join public.setores s on s.id = a.setor_id
      where s.sigla = sigla_do_setor), le,
    quem || case when le > 0 then ' lê as etapas do setor' else ' não lê as etapas do setor' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.andamentos (etapa_id, setor_id)
      select id, '5b000000-0000-0000-0000-000000000003' from public.etapas where codigo = 'modelagem'$sql$,
    '42501', null, quem || ' não cria andamento direto');
  -- Desde o ticket 10 o logado tem o privilégio de apagar (o catálogo usa), e a RLS filtra sem erro: nada é apagado.
  with apagados as (delete from public.andamentos returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagados), 0, quem || ' não apaga andamento direto');
  insert into _tap (linha) select throws_ok(
    $sql$update public.andamentos set etapa_id = etapa_id$sql$, '42501', null, quem || ' não troca a etapa');
  insert into _tap (linha) select throws_ok(
    $sql$update public.andamentos set setor_id = setor_id$sql$, '42501', null, quem || ' não troca o setor');
  with alteradas as (update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento(sigla_do_setor, 'identificacao_responsaveis') returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when altera then 1 else 0 end,
    quem || case when altera then ' inicia uma etapa do setor' else ' não inicia etapa do setor' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_andamentos(text, text, text, boolean, int) to authenticated;

select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'TPA', true, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'TPB', true, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a3', 'Consulta', 'TPC', false, 3);
select pg_temp.conferir_andamentos('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'TPC', false, 0);

-- Visitante: nem lê nem grava, no catálogo e nos andamentos.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.etapas', '42501', null, 'Visitante não lê o catálogo');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
    values ('teste_visitante', 'Etapa Visitante', 97, 'processo', false)$sql$, '42501', null, 'Visitante não cria etapa');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set nome = 'Trocado'$sql$, '42501', null, 'Visitante não altera etapa');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas$sql$, '42501', null, 'Visitante não apaga etapa');
insert into _tap (linha) select throws_ok('select 1 from public.andamentos', '42501', null,
  'Visitante não lê as etapas do setor');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.andamentos (etapa_id, setor_id) select id, '5b000000-0000-0000-0000-000000000003'
    from public.etapas where codigo = 'modelagem'$sql$, '42501', null, 'Visitante não cria andamento');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'$sql$, '42501', null, 'Visitante não altera andamento');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.andamentos$sql$, '42501', null, 'Visitante não apaga andamento');
reset role;

-- Etapa usada não se apaga, nem pelo dono do banco (desde o ticket 10, o gatilho recusa antes da referência).
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'identificacao_responsaveis'$sql$, 'P0001',
  'etapa_usada:Identificação dos responsáveis', 'etapa usada em algum setor não se apaga');

-- Regras, agindo como o Integrante no setor TRS.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where setor_id = '5b000000-0000-0000-0000-000000000004'
    and status = 'pendente'), 3, 'setor novo nasce com as 3 etapas do setor pendentes');
insert into _tap (linha) select is(
  (select count(*)::int from public.setores s
    where (select count(*) from public.andamentos a where a.setor_id = s.id) <> 3), 0,
  'todo setor, inclusive os que já existiam antes da migração, tem as 3 etapas do setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento' where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'P0001', 'anterior_nao_resolvida:Identificação dos responsáveis', 'iniciar a 2ª etapa com a 1ª pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
    where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'P0001', 'anterior_nao_resolvida:Identificação dos responsáveis',
  'registrar a 2ª como realizada anteriormente com a 1ª pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'concluida'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  'P0001', 'transicao_nao_permitida:pendente:concluida', 'concluir uma etapa pendente é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'dispensada'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23514', null, 'dispensar sem nota é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = '   '
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23514', null, 'realizada anteriormente com nota em branco é recusada');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'dispensada', nota = '  Setor já conhecido  '
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  'dispensar a 1ª etapa (opcional) com nota');
insert into _tap (linha) select is(
  (select nota from public.andamentos where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')),
  'Setor já conhecido', 'a nota é guardada sem espaços nas pontas');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'realizada_anteriormente', nota = 'Reunião feita em 2025'
    where id = pg_temp.andamento('TRS', 'sensibilizacao')$sql$,
  'registrar a 2ª como realizada anteriormente com a 1ª resolvida');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'dispensada', nota = 'Não se aplica'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'P0001', 'etapa_obrigatoria:Identificação dos processos', 'dispensar a etapa obrigatória é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'iniciar a 3ª com a 2ª resolvida');
reset role;

-- A trava de uma etapa em andamento por setor é do índice; o gatilho de sequência sai de cena para prová-la.
alter table public.andamentos disable trigger preparar_andamento;
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_responsaveis')$sql$,
  '23505', null, 'uma segunda etapa em andamento no mesmo setor é recusada');
alter table public.andamentos enable trigger preparar_andamento;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'concluida'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'concluir a etapa em andamento');
insert into _tap (linha) select is(
  (select array[iniciada_em, resolvida_em] from public.andamentos
    where id = pg_temp.andamento('TRS', 'identificacao_processos')),
  array[current_date, current_date], 'iniciar e concluir gravam o dia da ação');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('TRS', 'identificacao_processos')$sql$,
  'P0001', 'transicao_nao_permitida:concluida:em_andamento', 'sair de uma etapa resolvida é recusado');

-- Eventos das etapas do TRS.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'andamento' and acao = 'dispensar'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  jsonb_build_object('motivo', 'Setor já conhecido',
    'antes', jsonb_build_object('setor_id', '5b000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
      'etapa_codigo', 'identificacao_responsaveis', 'etapa_nome', 'Identificação dos responsáveis',
      'status', 'pendente', 'iniciada_em', null::date, 'resolvida_em', null::date),
    'depois', jsonb_build_object('setor_id', '5b000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
      'etapa_codigo', 'identificacao_responsaveis', 'etapa_nome', 'Identificação dos responsáveis',
      'status', 'dispensada', 'iniciada_em', null::date, 'resolvida_em', current_date)),
  'dispensar gera o evento com setor, etapa, antes, depois e a nota em motivo');
insert into _tap (linha) select is(
  (select array_agg(acao order by id) from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  array['dispensar', 'registrar_realizada', 'iniciar', 'concluir'],
  'cada ação gera um evento; as recusadas, nenhum');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'
    and autor_id is distinct from '00000000-0000-0000-0000-0000000000a2'), 0,
  'o autor do evento é quem agiu');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref = '5b000000-0000-0000-0000-000000000004:' || pg_temp.andamento('TRS', 'identificacao_processos')),
  2, 'a referência do evento traz o setor e o andamento');
update public.andamentos set status = status where id = pg_temp.andamento('TRS', 'identificacao_processos');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'andamento'
    and entidade_ref like '5b000000-0000-0000-0000-000000000004:%'),
  4, 'gravação sem mudança não gera evento');
reset role;

-- Quem lê os eventos das etapas: todo perfil ativo (o Integrante já leu acima).
create function pg_temp.eventos_das_etapas(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade = 'andamento' and entidade_ref like '5b000000-0000-0000-0000-000000000004:%';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_das_etapas(text) to authenticated;
insert into _tap (linha) select is(pg_temp.eventos_das_etapas('00000000-0000-0000-0000-0000000000a3'), 4,
  'Consulta lê os eventos das etapas do setor');
insert into _tap (linha) select is(pg_temp.eventos_das_etapas('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos das etapas do setor');

-- Excluir o setor leva as etapas dele.
delete from public.setores where sigla = 'TRS';
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where setor_id = '5b000000-0000-0000-0000-000000000004'), 0,
  'excluir o setor apaga as etapas dele');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
