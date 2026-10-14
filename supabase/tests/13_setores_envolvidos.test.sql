-- Setores envolvidos: quem pode o quê, chave composta, cascata e eventos (cadastros-basicos, ticket 04).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(56);

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

-- Setores TSA..TSG (ids 5a…01 a 5a…07) e macroprocessos (ids aa…01 a aa…04), todos inventados.
-- M1 sem código; M2 com código (a ordem de código vem antes na lista do evento de exclusão); M3 fica sem setor.
insert into public.setores (id, sigla, nome) values
  ('5a000000-0000-0000-0000-000000000001', 'TSA', 'Setor Teste A'),
  ('5a000000-0000-0000-0000-000000000002', 'TSB', 'Setor Teste B'),
  ('5a000000-0000-0000-0000-000000000003', 'TSC', 'Setor Teste C'),
  ('5a000000-0000-0000-0000-000000000004', 'TSD', 'Setor Teste D'),
  ('5a000000-0000-0000-0000-000000000005', 'TSE', 'Setor Teste E'),
  ('5a000000-0000-0000-0000-000000000006', 'TSF', 'Setor Teste F'),
  ('5a000000-0000-0000-0000-000000000007', 'TSG', 'Setor Teste G');
insert into public.macroprocessos (id, codigo, nome) values
  ('aa000000-0000-0000-0000-000000000001', null, 'Macro de Teste Um'),
  ('aa000000-0000-0000-0000-000000000002', 'MT02', 'Macro de Teste Dois'),
  ('aa000000-0000-0000-0000-000000000003', null, 'Macro Sem Setor'),
  ('aa000000-0000-0000-0000-000000000004', 'MT04', 'Macro Cascata');

-- Vínculo fixo que todos tentam ler, alterar e apagar: TSA em M1. Os outros alimentam a cascata.
insert into public.setores_envolvidos (macroprocesso_id, setor_id, observacao) values
  ('aa000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000001', 'Papel fictício'),
  ('aa000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000004', 'Nota um'),
  ('aa000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000004', null),
  ('aa000000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000001', null),
  ('aa000000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000006', 'Outro');

-- Administrador e integrante: leem, põem, alteram a observação e tiram; as colunas fixas, ninguém.
create function pg_temp.conferir_quem_altera(id_usuario text, quem text, id_setor_novo text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.setores_envolvidos where observacao = 'Papel fictício'), 1,
    quem || ' lê os setores envolvidos');
  insert into _tap (linha) select lives_ok(
    format($f$insert into public.setores_envolvidos (macroprocesso_id, setor_id)
      values ('aa000000-0000-0000-0000-000000000001', %L)$f$, id_setor_novo),
    quem || ' põe um setor no macroprocesso');
  with alteradas as (
    update public.setores_envolvidos set observacao = 'Papel de ' || quem
    where setor_id = id_setor_novo::uuid returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 1, quem || ' altera a observação');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set macroprocesso_id = 'aa000000-0000-0000-0000-000000000003'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera o macroprocesso_id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set setor_id = '5a000000-0000-0000-0000-000000000007'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera o setor_id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set criado_em = now() - interval '1 day'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera criado_em');
  with apagadas as (delete from public.setores_envolvidos where setor_id = id_setor_novo::uuid returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 1, quem || ' tira o setor do macroprocesso');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_altera(text, text, text) to authenticated;

-- Consulta e inativo: não põem, não alteram, não tiram; o inativo também não lê.
create function pg_temp.conferir_quem_nao_altera(id_usuario text, quem text, visiveis int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.setores_envolvidos where observacao = 'Papel fictício'), visiveis,
    quem || case when visiveis = 1 then ' lê os setores envolvidos' else ' não lê os setores envolvidos' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.setores_envolvidos (macroprocesso_id, setor_id)
      values ('aa000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000002')$sql$,
    '42501', null, quem || ' não põe setor no macroprocesso');
  with alteradas as (
    update public.setores_envolvidos set observacao = 'Trocado' where setor_id = '5a000000-0000-0000-0000-000000000001'
      and macroprocesso_id = 'aa000000-0000-0000-0000-000000000001' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera a observação');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set macroprocesso_id = 'aa000000-0000-0000-0000-000000000003'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera o macroprocesso_id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set setor_id = '5a000000-0000-0000-0000-000000000007'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera o setor_id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores_envolvidos set criado_em = now() - interval '1 day'
      where observacao = 'Papel fictício'$sql$, '42501', null, quem || ' não altera criado_em');
  with apagadas as (
    delete from public.setores_envolvidos where setor_id = '5a000000-0000-0000-0000-000000000001'
      and macroprocesso_id = 'aa000000-0000-0000-0000-000000000001' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não tira setor do macroprocesso');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_altera(text, text, int) to authenticated;

select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a1', 'Administrador', '5a000000-0000-0000-0000-000000000002');
select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a2', 'Integrante', '5a000000-0000-0000-0000-000000000003');
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a3', 'Consulta', 1);
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a4', 'Inativo', 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.setores_envolvidos', '42501', null,
  'Visitante não lê os setores envolvidos');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores_envolvidos (macroprocesso_id, setor_id)
    values ('aa000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000002')$sql$,
  '42501', null, 'Visitante não põe setor no macroprocesso');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores_envolvidos set observacao = 'Trocado'$sql$, '42501', null,
  'Visitante não altera a observação');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores_envolvidos set macroprocesso_id = 'aa000000-0000-0000-0000-000000000003'$sql$,
  '42501', null, 'Visitante não altera o macroprocesso_id');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores_envolvidos set setor_id = '5a000000-0000-0000-0000-000000000007'$sql$,
  '42501', null, 'Visitante não altera o setor_id');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores_envolvidos set criado_em = now()$sql$, '42501', null, 'Visitante não altera criado_em');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores_envolvidos$sql$, '42501', null, 'Visitante não tira setor do macroprocesso');
reset role;

-- Regras da chave e da observação (valem para qualquer um, inclusive o dono do banco).
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores_envolvidos (macroprocesso_id, setor_id)
    values ('aa000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000001')$sql$,
  '23505', null, 'o mesmo setor duas vezes no mesmo macroprocesso é recusado');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.setores_envolvidos (macroprocesso_id, setor_id)
    values ('aa000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000001')$sql$,
  'o mesmo setor em dois macroprocessos é aceito');
insert into _tap (linha) select is(
  (select count(*)::int from public.setores_envolvidos where macroprocesso_id = 'aa000000-0000-0000-0000-000000000003'), 0,
  'um macroprocesso pode ficar sem nenhum setor');
insert into _tap (linha) select throws_ok(
  format($f$insert into public.setores_envolvidos (macroprocesso_id, setor_id, observacao)
    values ('aa000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000005', %L)$f$, repeat('a', 501)),
  '23514', null, 'observação acima de 500 caracteres é recusada');
insert into public.setores_envolvidos (macroprocesso_id, setor_id, observacao)
  values ('aa000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000005', '');
insert into _tap (linha) select is(
  (select observacao from public.setores_envolvidos where setor_id = '5a000000-0000-0000-0000-000000000005'), null,
  'observação "" é guardada como nulo');
insert into public.setores_envolvidos (macroprocesso_id, setor_id, observacao)
  values ('aa000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000006', ' texto ');
insert into _tap (linha) select is(
  (select observacao from public.setores_envolvidos where setor_id = '5a000000-0000-0000-0000-000000000006'
    and macroprocesso_id = 'aa000000-0000-0000-0000-000000000001'), 'texto',
  'observação " texto " é guardada sem espaços nas pontas');

-- Eventos e cascata: o administrador põe TSG em M1, muda a observação, grava a mesma de novo e tira;
-- depois exclui o setor TSD (dois vínculos) e o macroprocesso M4 (dois vínculos).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.setores_envolvidos (macroprocesso_id, setor_id, observacao)
  values ('aa000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000007', 'Papel A');
update public.setores_envolvidos set observacao = 'Papel B'
  where macroprocesso_id = 'aa000000-0000-0000-0000-000000000001' and setor_id = '5a000000-0000-0000-0000-000000000007';
update public.setores_envolvidos set observacao = 'Papel B'
  where macroprocesso_id = 'aa000000-0000-0000-0000-000000000001' and setor_id = '5a000000-0000-0000-0000-000000000007';
delete from public.setores_envolvidos
  where macroprocesso_id = 'aa000000-0000-0000-0000-000000000001' and setor_id = '5a000000-0000-0000-0000-000000000007';
delete from public.setores where id = '5a000000-0000-0000-0000-000000000004';
delete from public.macroprocessos where id = 'aa000000-0000-0000-0000-000000000004';
reset role;

-- Cascata: excluir o setor ou o macroprocesso apaga só as linhas dele.
insert into _tap (linha) select is(
  (select count(*)::int from public.setores_envolvidos where setor_id = '5a000000-0000-0000-0000-000000000004'), 0,
  'excluir o setor apaga as linhas dele em setores_envolvidos');
insert into _tap (linha) select is(
  (select count(*)::int from public.macroprocessos where id in ('aa000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002')), 2,
  'excluir o setor deixa os macroprocessos');
insert into _tap (linha) select is(
  (select count(*)::int from public.setores_envolvidos where macroprocesso_id = 'aa000000-0000-0000-0000-000000000004'), 0,
  'excluir o macroprocesso apaga as linhas dele em setores_envolvidos');
insert into _tap (linha) select is(
  (select count(*)::int from public.setores where id in ('5a000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000006')), 2,
  'excluir o macroprocesso deixa os setores');

-- Eventos do vínculo TSG em M1.
create function pg_temp.evento_do_tsg(acao_procurada text) returns public.eventos
language sql as $$
  select * from public.eventos where entidade = 'setor_envolvido' and acao = acao_procurada
    and coalesce(detalhes -> 'depois' ->> 'setor_sigla', detalhes -> 'antes' ->> 'setor_sigla') = 'TSG'
$$;

insert into _tap (linha) select is((pg_temp.evento_do_tsg('criar')).detalhes,
  jsonb_build_object('antes', null, 'depois', jsonb_build_object(
    'setor_id', '5a000000-0000-0000-0000-000000000007', 'setor_sigla', 'TSG',
    'macroprocesso_id', 'aa000000-0000-0000-0000-000000000001', 'macroprocesso_nome', 'Macro de Teste Um',
    'observacao', 'Papel A')),
  'pôr o setor grava o depois com a sigla e o nome legíveis');
insert into _tap (linha) select is((pg_temp.evento_do_tsg('criar')).autor_id,
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'o evento de pôr grava quem fez');
insert into _tap (linha) select is((pg_temp.evento_do_tsg('criar')).entidade_ref,
  'aa000000-0000-0000-0000-000000000001:5a000000-0000-0000-0000-000000000007',
  'o evento guarda os dois ids em entidade_ref');
insert into _tap (linha) select is(
  ((pg_temp.evento_do_tsg('editar')).detalhes -> 'antes' ->> 'observacao') || '>'
    || ((pg_temp.evento_do_tsg('editar')).detalhes -> 'depois' ->> 'observacao'),
  'Papel A>Papel B', 'mudar a observação grava antes e depois');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'setor_envolvido' and acao = 'editar'
    and detalhes -> 'depois' ->> 'setor_sigla' = 'TSG'), 1,
  'gravar a mesma observação não gera evento');
insert into _tap (linha) select is((pg_temp.evento_do_tsg('excluir')).detalhes,
  jsonb_build_object('depois', null, 'antes', jsonb_build_object(
    'setor_id', '5a000000-0000-0000-0000-000000000007', 'setor_sigla', 'TSG',
    'macroprocesso_id', 'aa000000-0000-0000-0000-000000000001', 'macroprocesso_nome', 'Macro de Teste Um',
    'observacao', 'Papel B')),
  'tirar o setor grava o antes legível');

-- Exclusão do setor TSD: eventos de tirar com sigla e nome legíveis e o antes com a lista de macroprocessos.
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'setor_envolvido' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'setor_sigla' = 'TSD'), 2,
  'excluir o setor também gera os eventos de tirar, um por macroprocesso');
insert into _tap (linha) select is(
  (select array_agg(detalhes -> 'antes' ->> 'macroprocesso_nome' order by detalhes -> 'antes' ->> 'macroprocesso_nome')
    from public.eventos where entidade = 'setor_envolvido' and acao = 'excluir'
      and detalhes -> 'antes' ->> 'setor_sigla' = 'TSD'),
  array['Macro de Teste Dois', 'Macro de Teste Um'], 'os eventos de tirar trazem o nome do macroprocesso');
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'setor' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'sigla' = 'TSD'),
  jsonb_build_object('depois', null, 'antes', jsonb_build_object(
    'sigla', 'TSD', 'nome', 'Setor Teste D', 'observacoes', null, 'ativo', true,
    'macroprocessos', jsonb_build_array(
      jsonb_build_object('macroprocesso_id', 'aa000000-0000-0000-0000-000000000002', 'codigo', 'MT02',
        'nome', 'Macro de Teste Dois', 'observacao', null),
      jsonb_build_object('macroprocesso_id', 'aa000000-0000-0000-0000-000000000001', 'codigo', null,
        'nome', 'Macro de Teste Um', 'observacao', 'Nota um')),
    'responsaveis', jsonb_build_array())),
  'excluir o setor grava no antes a lista dos macroprocessos');

-- Exclusão do macroprocesso M4.
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'setor_envolvido' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'macroprocesso_nome' = 'Macro Cascata'), 2,
  'excluir o macroprocesso também gera os eventos de tirar, um por setor');
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'macroprocesso' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'codigo' = 'MT04'),
  jsonb_build_object('depois', null, 'antes', jsonb_build_object(
    'codigo', 'MT04', 'nome', 'Macro Cascata', 'descricao', null, 'categoria', null, 'ativo', true,
    'setores', jsonb_build_array(
      jsonb_build_object('setor_id', '5a000000-0000-0000-0000-000000000001', 'sigla', 'TSA',
        'nome', 'Setor Teste A', 'observacao', null),
      jsonb_build_object('setor_id', '5a000000-0000-0000-0000-000000000006', 'sigla', 'TSF',
        'nome', 'Setor Teste F', 'observacao', 'Outro')))),
  'excluir o macroprocesso grava no antes a lista dos setores');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
