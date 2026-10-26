-- Processos: quem pode o quê, regras, passagens do processo, view do Quadro, eventos e recusas de exclusão
-- (processos-etapas, ticket 04; passagens no lugar dos andamentos no ticket 24).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
-- O processo que a exclusão vai apagar, guardado antes para conferir as passagens depois.
create temp table _alvo (id uuid);
grant all on _alvo to authenticated;
insert into _tap (linha) select plan(77);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela. A
-- função desliga, só durante o movimento e com o dono do banco, as etapas com trava que ficam antes do destino.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid, p_data date default null, p_link text default null,
  p_explicacao text default null) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, p_data, p_link, p_explicacao);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid, date, text, text) to authenticated;

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

-- Setores inventados: TPA a TPC para os perfis, TRS e TRX para as regras.
insert into public.setores (id, sigla, nome) values
  ('5e000000-0000-0000-0000-000000000001', 'TPA', 'Setor Perfil A'),
  ('5e000000-0000-0000-0000-000000000002', 'TPB', 'Setor Perfil B'),
  ('5e000000-0000-0000-0000-000000000003', 'TPC', 'Setor Perfil C'),
  ('5e000000-0000-0000-0000-000000000004', 'TRS', 'Setor das Regras'),
  ('5e000000-0000-0000-0000-000000000005', 'TRX', 'Setor das Regras Dois');
insert into public.macroprocessos (id, codigo, nome) values
  ('ab000000-0000-0000-0000-000000000001', null, 'Macro Teste A'),
  ('ab000000-0000-0000-0000-000000000002', null, 'Macro Teste B'),
  ('ab000000-0000-0000-0000-000000000003', null, 'Macro Teste C');
insert into public.setores_envolvidos (macroprocesso_id, setor_id) values
  ('ab000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000001'),
  ('ab000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000002'),
  ('ab000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000003');

-- Um processo inventado em cada setor de perfil, incluído pelo dono do banco.
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5e000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000001', 'Processo Semente TPA'),
  ('5e000000-0000-0000-0000-000000000002', 'ab000000-0000-0000-0000-000000000001', 'Processo Semente TPB'),
  ('5e000000-0000-0000-0000-000000000003', 'ab000000-0000-0000-0000-000000000001', 'Processo Semente TPC');

-- Administrador e Integrante criam, alteram e apagam; Consulta só lê; o inativo nada;
-- id, data, tipo, pai e situação ninguém muda direto.
create function pg_temp.conferir_processos(id_usuario text, quem text, sigla_do_setor text, altera boolean, le int)
returns void language plpgsql as $$
declare
  id_do_setor uuid := (select id from public.setores where sigla = sigla_do_setor);
  recusada boolean := false;
  inclusao text := format(
    $sql$insert into public.processos (setor_id, macroprocesso_id, nome)
      values (%L, 'ab000000-0000-0000-0000-000000000001', 'Processo Novo')$sql$, id_do_setor);
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.processos where setor_id = id_do_setor), le,
    quem || case when le > 0 then ' lê os processos' else ' não lê os processos' end);
  insert into _tap (linha) select is(
    (select count(*)::int from public.processos_com_andamento where setor_id = id_do_setor), le,
    quem || case when le > 0 then ' lê a view dos processos' else ' não lê a view dos processos' end);
  if altera then
    insert into _tap (linha) select lives_ok(inclusao, quem || ' cria processo');
  else
    insert into _tap (linha) select throws_ok(inclusao, '42501', null, quem || ' não cria processo');
  end if;
  with alteradas as (update public.processos set contexto = 'Contexto Novo'
    where nome = 'Processo Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when altera then 1 else 0 end,
    quem || case when altera then ' altera o processo' else ' não altera o processo' end);
  insert into _tap (linha) select throws_ok(
    $sql$update public.processos set id = id$sql$, '42501', null, quem || ' não troca o id do processo');
  insert into _tap (linha) select throws_ok(
    $sql$update public.processos set criado_em = criado_em$sql$, '42501', null,
    quem || ' não troca a data de criação do processo');
  -- Tipo e pai têm privilégio de coluna desde o ticket 08, mas só mudam pela reclassificação, como a situação.
  begin
    update public.processos set tipo = 'processo' where nome = 'Processo Semente ' || sigla_do_setor;
  exception when others then
    recusada := sqlerrm like 'tipo_so_pela_funcao%';
  end;
  insert into _tap (linha) select is(recusada, altera, quem || ' não troca o tipo do processo direto');
  recusada := false;
  begin
    update public.processos set processo_pai_id = id where nome = 'Processo Semente ' || sigla_do_setor;
  exception when others then
    recusada := sqlerrm like 'tipo_so_pela_funcao%';
  end;
  insert into _tap (linha) select is(recusada, altera, quem || ' não troca o pai do processo direto');
  recusada := false;
  -- A situação tem privilégio de coluna desde o ticket 07, mas só muda pelas funções: o gatilho recusa a mudança
  -- direta de quem altera (quem só lê não enxerga linha para alterar, e nada acontece).
  begin
    update public.processos set situacao = 'suspenso', motivo_da_situacao = 'Direto'
      where nome = 'Processo Semente ' || sigla_do_setor;
  exception when others then
    recusada := sqlerrm like 'situacao_so_pela_funcao%';
  end;
  insert into _tap (linha) select is(recusada, altera, quem || ' não troca a situação do processo direto');
  with apagadas as (delete from public.processos where nome = 'Processo Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), case when altera then 1 else 0 end,
    quem || case when altera then ' apaga o processo' else ' não apaga o processo' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_processos(text, text, text, boolean, int) to authenticated;

select pg_temp.conferir_processos('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'TPA', true, 1);
select pg_temp.conferir_processos('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'TPB', true, 1);
select pg_temp.conferir_processos('00000000-0000-0000-0000-0000000000a3', 'Consulta', 'TPC', false, 1);
select pg_temp.conferir_processos('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'TPC', false, 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.processos', '42501', null, 'Visitante não lê os processos');
insert into _tap (linha) select throws_ok('select 1 from public.processos_com_andamento', '42501', null,
  'Visitante não lê a view dos processos');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome)
    values ('5e000000-0000-0000-0000-000000000003', 'ab000000-0000-0000-0000-000000000001', 'Processo Visitante')$sql$,
  '42501', null, 'Visitante não cria processo');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set contexto = 'Trocado'$sql$, '42501', null, 'Visitante não altera processo');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos$sql$, '42501', null, 'Visitante não apaga processo');
reset role;

-- Regras, como Integrante. O nome com espaços nas pontas é guardado sem eles; o mesmo nome (sem diferenciar
-- maiúsculas) é recusado no mesmo setor e aceito em outro; cadastrar com setor fora do macroprocesso inclui o vínculo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into public.processos (setor_id, macroprocesso_id, nome)
  values ('5e000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', 'Emitir Oficio ');
insert into _tap (linha) select is(
  (select nome from public.processos
    where setor_id = '5e000000-0000-0000-0000-000000000004' and lower(nome) = 'emitir oficio'),
  'Emitir Oficio', 'nome guardado sem espaços nas pontas');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome)
    values ('5e000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', 'emitir OFICIO')$sql$,
  '23505', null, 'nome repetido no mesmo setor, sem diferenciar maiúsculas, é recusado');
insert into _tap (linha) select ok(
  exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'processos_nome_unico'),
  'a recusa do nome repetido vem do índice processos_nome_unico');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome)
    values ('5e000000-0000-0000-0000-000000000005', 'ab000000-0000-0000-0000-000000000002', 'Emitir Oficio')$sql$,
  'o mesmo nome é aceito em outro setor');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome)
    values ('5e000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', '   ')$sql$,
  '23514', null, 'nome em branco é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
    values ('5e000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', 'Sub Teste', 'subprocesso')$sql$,
  '23514', null, 'subprocesso sem pai é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, processo_pai_id)
    values ('5e000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', 'Filho Teste',
      (select id from public.processos limit 1))$sql$,
  '23514', null, '"a classificar" com pai é recusado (o pai só vale no subprocesso)');

-- Passagens do processo (Andamento livre, ticket 24): nasce uma, aberta em Não iniciados; ninguém cria nem apaga direto.
insert into _tap (linha) select is(
  (select count(*)::int from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = (select id from public.processos
      where setor_id = '5e000000-0000-0000-0000-000000000004' and nome = 'Emitir Oficio')
      and pa.saiu_em is null and e.codigo = 'nao_iniciados'),
  1, 'processo novo nasce com uma passagem aberta em Não iniciados');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (etapa_id, processo_id)
    values ((select id from public.etapas where codigo = 'modelagem'),
      (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004'))$sql$,
  'P0001', 'passagem_so_pela_funcao', 'passagem não se cria direto');
insert into _tap (linha) select throws_ok($sql$delete from public.passagens$sql$, '42501', null,
  'passagem não se apaga direto');

-- Eventos do cadastro: o criar traz os campos legíveis (com a data da reunião, vazia: reunioes, ticket 05), o vínculo
-- do setor incluído também.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'processo' and acao = 'criar'
    and detalhes -> 'depois' ->> 'setor_sigla' = 'TRS'),
  jsonb_build_object('antes', null, 'depois', jsonb_build_object(
    'nome', 'Emitir Oficio', 'setor_id', '5e000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
    'macroprocesso_id', 'ab000000-0000-0000-0000-000000000002', 'macroprocesso_nome', 'Macro Teste B',
    'tipo', 'a_classificar', 'origem', 'novo', 'situacao', 'em_andamento', 'contexto', null, 'observacoes', null,
    'data_da_modelagem_piloto', null)),
  'criar gera o evento com os campos legíveis');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'setor_envolvido' and acao = 'criar'
    and entidade_ref = 'ab000000-0000-0000-0000-000000000002:5e000000-0000-0000-0000-000000000004'),
  1, 'o setor fora do macroprocesso é incluído como envolvido, com o evento');

-- Mover de macroprocesso: o setor é incluído no novo e o evento traz o macroprocesso de antes e de depois.
update public.processos set macroprocesso_id = 'ab000000-0000-0000-0000-000000000003'
  where setor_id = '5e000000-0000-0000-0000-000000000004';
insert into _tap (linha) select ok(
  exists (select 1 from public.setores_envolvidos
    where macroprocesso_id = 'ab000000-0000-0000-0000-000000000003' and setor_id = '5e000000-0000-0000-0000-000000000004'),
  'mover para outro macroprocesso inclui o setor como envolvido nele');
insert into _tap (linha) select is(
  (select (detalhes -> 'antes' ->> 'macroprocesso_nome') || ' > ' || (detalhes -> 'depois' ->> 'macroprocesso_nome')
    from public.eventos where entidade = 'processo' and acao = 'editar'
      and detalhes -> 'depois' ->> 'setor_sigla' = 'TRS'),
  'Macro Teste B > Macro Teste C', 'editar gera o evento com o macroprocesso de antes e de depois');
update public.processos set contexto = contexto where setor_id = '5e000000-0000-0000-0000-000000000004';
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'processo'
    and detalhes -> 'depois' ->> 'setor_sigla' = 'TRS'),
  2, 'gravação sem mudança não gera evento');

-- Recusas de exclusão, com a contagem.
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores_envolvidos
    where macroprocesso_id = 'ab000000-0000-0000-0000-000000000003' and setor_id = '5e000000-0000-0000-0000-000000000004'$sql$,
  'P0001', 'setor_com_processos_no_macroprocesso:TRS:1', 'tirar setor envolvido com processos é recusado');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.setores_envolvidos
    where macroprocesso_id = 'ab000000-0000-0000-0000-000000000002' and setor_id = '5e000000-0000-0000-0000-000000000004'$sql$,
  'tirar setor envolvido sem processos funciona');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores where sigla = 'TRS'$sql$,
  'P0001', 'setor_com_processos:1', 'excluir setor com processo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.macroprocessos where id = 'ab000000-0000-0000-0000-000000000003'$sql$,
  'P0001', 'macroprocesso_com_processos:1', 'excluir macroprocesso com processo é recusado');
reset role;

-- A view, com o estado montado pelo dono do banco.
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento
    where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'nao_iniciados', 'a etapa atual é a da passagem aberta (Não iniciados, no cadastro)');
update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
  where setor_id = '5e000000-0000-0000-0000-000000000004';
insert into _tap (linha) select is(
  (select responsavel_id from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'a view traz o responsável do processo');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'em_andamento', 'fora de Concluídos o processo está em andamento');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select pg_temp.mover_sem_trava((select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004'),
  (select id from public.etapas where codigo = 'concluidos'), null, null, 'Não será publicado');
reset role;
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'concluido', 'em Concluídos o processo está concluído');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'concluidos', 'a etapa atual passa a ser Concluídos');
-- A suspensão direta só passa com a chave que as funções do ticket 07 ligam; aqui o dono do banco a liga à mão.
select set_config('ep.mudando_situacao', 'on', true);
update public.processos set situacao = 'suspenso', motivo_da_situacao = 'Parado para teste'
  where setor_id = '5e000000-0000-0000-0000-000000000004';
select set_config('ep.mudando_situacao', 'off', true);
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'suspenso', 'a situação guardada suspensa aparece na view');
-- O processo volta a andar para as restrições mais adiante (as etapas de processo suspenso ficam congeladas desde o ticket 07).
select set_config('ep.mudando_situacao', 'on', true);
update public.processos set situacao = 'em_andamento', motivo_da_situacao = null
  where setor_id = '5e000000-0000-0000-0000-000000000004';
select set_config('ep.mudando_situacao', 'off', true);

-- Excluir o processo, como Integrante: o evento guarda a etapa atual e a etiqueta, e as passagens vão junto.
insert into _alvo select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000005';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
delete from public.processos where setor_id = '5e000000-0000-0000-0000-000000000005';
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'etapa_codigo' from public.eventos
    where entidade = 'processo' and acao = 'excluir'
      and detalhes -> 'antes' ->> 'setor_sigla' = 'TRX'),
  'nao_iniciados', 'excluir o processo grava no antes a etapa atual');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'etiqueta' from public.eventos
    where entidade = 'processo' and acao = 'excluir'
      and detalhes -> 'antes' ->> 'setor_sigla' = 'TRX'),
  'a_fazer', 'e a etiqueta');
insert into _tap (linha) select is(
  (select count(*)::int from public.passagens where processo_id = (select id from _alvo)),
  0, 'excluir o processo apaga as passagens dele');
reset role;

-- Quem lê os eventos dos processos: todo perfil ativo.
create function pg_temp.eventos_dos_processos(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade = 'processo' and acao = 'criar' and detalhes -> 'depois' ->> 'nome' = 'Processo Semente TPC';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_dos_processos(text) to authenticated;
insert into _tap (linha) select is(pg_temp.eventos_dos_processos('00000000-0000-0000-0000-0000000000a3'), 1,
  'Consulta lê os eventos dos processos');
insert into _tap (linha) select is(pg_temp.eventos_dos_processos('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos dos processos');

-- Restrições do dono: toda passagem é de um processo, e só uma fica aberta por processo.
insert into _tap (linha) select throws_ok(
  $sql$update public.passagens set processo_id = null
    where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
      and saiu_em is null$sql$,
  '23502', null, 'passagem sem processo é recusada');
select set_config('ep.movendo_processo', 'mover', true);
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (etapa_id, processo_id)
    values ((select id from public.etapas where codigo = 'modelagem'),
      (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004'))$sql$,
  '23505', null, 'uma segunda passagem aberta no processo é recusada');
select set_config('ep.movendo_processo', '', true);

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
