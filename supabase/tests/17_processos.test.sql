-- Processos: quem pode o quê, regras, andamentos do processo, view do Quadro, eventos e recusas de exclusão
-- (processos-etapas, ticket 04).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
-- O processo que a exclusão vai apagar, guardado antes para conferir os andamentos depois.
create temp table _alvo (id uuid);
grant all on _alvo to authenticated;
insert into _tap (linha) select plan(77);

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

-- Andamentos do processo: nascem pendentes; ninguém cria nem apaga direto.
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = (select id from public.processos
      where setor_id = '5e000000-0000-0000-0000-000000000004' and nome = 'Emitir Oficio')
      and a.status = 'pendente'),
  6, 'processo novo nasce com 6 andamentos pendentes');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.andamentos (etapa_id, processo_id)
    values ((select id from public.etapas where codigo = 'modelagem'),
      (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004'))$sql$,
  '42501', null, 'andamento de processo não se cria direto');
-- Desde o ticket 10 o logado tem o privilégio de apagar (o catálogo usa), e a RLS filtra sem erro: nada é apagado.
with apagados as (delete from public.andamentos where processo_id is not null returning 1)
insert into _tap (linha) select is((select count(*)::int from apagados), 0,
  'andamento de processo não se apaga direto');

-- Eventos do cadastro: o criar traz os campos legíveis (com a data da reunião, vazia: reunioes, ticket 05), o vínculo
-- do setor incluído também.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'processo' and acao = 'criar'
    and detalhes -> 'depois' ->> 'setor_sigla' = 'TRS'),
  jsonb_build_object('antes', null, 'depois', jsonb_build_object(
    'nome', 'Emitir Oficio', 'setor_id', '5e000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS',
    'macroprocesso_id', 'ab000000-0000-0000-0000-000000000002', 'macroprocesso_nome', 'Macro Teste B',
    'tipo', 'a_classificar', 'origem', 'novo', 'situacao', 'em_andamento', 'contexto', null, 'observacoes', null,
    'data_da_reuniao', null)),
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
  'modelagem', 'a etapa atual é a primeira pendente');
update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'modelagem');
insert into _tap (linha) select is(
  (select responsavel_id from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'a view traz o responsável da etapa atual');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'em_andamento', 'com etapas obrigatórias pendentes o processo está em andamento');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'modelagem');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'relatorio_modelagem_tecnica');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'revisao_interna');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'revisao_setor');
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
    and etapa_id = (select id from public.etapas where codigo = 'aprovacao_setor');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'concluido', 'com as obrigatórias resolvidas o processo aparece como concluído');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where setor_id = '5e000000-0000-0000-0000-000000000004'),
  'publicacao', 'a etapa atual passa a ser a opcional que sobrou');
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

-- Excluir o processo, como Integrante: o evento guarda os andamentos e eles vão junto.
insert into _alvo select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000005';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
delete from public.processos where setor_id = '5e000000-0000-0000-0000-000000000005';
insert into _tap (linha) select is(
  (select jsonb_array_length(detalhes -> 'antes' -> 'andamentos') from public.eventos
    where entidade = 'processo' and acao = 'excluir'
      and detalhes -> 'antes' ->> 'setor_sigla' = 'TRX'),
  6, 'excluir o processo grava no antes os 6 andamentos');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' -> 'andamentos' -> 0 ->> 'etapa_codigo' from public.eventos
    where entidade = 'processo' and acao = 'excluir'
      and detalhes -> 'antes' ->> 'setor_sigla' = 'TRX'),
  'modelagem', 'os andamentos do antes vêm na ordem do catálogo');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where processo_id = (select id from _alvo)),
  0, 'excluir o processo apaga os andamentos dele');
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

-- Restrições do dono: todo andamento é de um processo, e a etapa não se repete no processo.
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set processo_id = null
    where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004')
      and etapa_id = (select id from public.etapas where codigo = 'modelagem')$sql$,
  '23502', null, 'andamento sem processo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.andamentos (etapa_id, processo_id)
    values ((select id from public.etapas where codigo = 'modelagem'),
      (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004'))$sql$,
  '23505', null, 'a mesma etapa duas vezes no processo é recusada');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
