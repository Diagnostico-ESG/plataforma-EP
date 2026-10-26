-- Relatório com numeração própria (documentos-versoes, ticket 10; ADR 0026): o relatório sozinho, ligado à versão mais
-- recente que não é histórica, ou junto com a versão em sequência; o número do relatório (maior do processo + 1, só
-- .docx), onde cabe, a prévia conferida, um evento por relatório enviado depois da versão e quem pode. Complementa o 27
-- (versões), o 28 (históricas) e o 30 (substituir). "Outra chamada" é simulada recuando enviada_em como superusuário,
-- porque o pgTAP roda tudo numa transação só e o banco reconhece "a mesma chamada" por enviada_em = now().
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(34);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela. A
-- função desliga, só durante o movimento e com o dono do banco, as etapas com trava que ficam antes do destino.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid, p_data date default null, p_link text default null,
  p_explicacao text default null) returns void
language plpgsql security definer as $
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, p_data, p_link, p_explicacao);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid, date, text, text) to authenticated;

-- Isola o teste dos dados que já existem no banco (a prova do Drive deixa versões, arquivos, eventos e pastas de teste
-- no desenvolvimento): a limpeza vale só nesta transação, que é desfeita no fim. replica desliga os gatilhos que
-- impedem apagar; a volta a origin liga todos de novo antes das preparações do teste.
set local session_replication_role = replica;
delete from public.arquivos_da_versao;
delete from public.versoes;
delete from public.pastas_no_drive;
delete from public.eventos where entidade = 'versao';
set local session_replication_role = origin;

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000e1', 'RN1', 'Setor Relatório Numerado');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000e1', null, 'Macro Relatório Numerado');
-- e1: numeração (histórica, piloto, em sequência); e2 suspenso; e3 Publicação; e4 técnica e Revisão interna; e5 só a
-- histórica; e6 cancelado; e7 só a piloto; e8 concluído; e9 perfis.
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 1'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 2'),
  ('9f000000-0000-0000-0000-0000000000e3', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 3'),
  ('9f000000-0000-0000-0000-0000000000e4', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 4'),
  ('9f000000-0000-0000-0000-0000000000e5', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 5'),
  ('9f000000-0000-0000-0000-0000000000e6', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 6'),
  ('9f000000-0000-0000-0000-0000000000e7', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 7'),
  ('9f000000-0000-0000-0000-0000000000e8', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 8'),
  ('9f000000-0000-0000-0000-0000000000e9', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Numerado 9');

-- Um arquivo inventado no formato que registrar_versao recebe.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'RN1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.so_bpm() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')) $$;
create function pg_temp.relatorio(formato text default 'docx') returns jsonb
language sql immutable as $$ select pg_temp.arquivo('relatorio', formato) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.versao(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$ select id from public.versoes where processo_id = processo and numero = numero_da_versao $$;
-- Os números dos relatórios numerados de uma versão, em ordem (nulos fora).
create function pg_temp.numeros(processo uuid, numero_da_versao integer) returns integer[]
language sql stable as $$
  select coalesce(array_agg(numero_do_relatorio order by numero_do_relatorio), '{}')
  from public.arquivos_da_versao
  where papel = 'relatorio' and numero_do_relatorio is not null and versao_id = pg_temp.versao(processo, numero_da_versao) $$;
grant execute on function pg_temp.arquivo(text, text, bigint), pg_temp.so_bpm(), pg_temp.relatorio(text), pg_temp.processo(text),
  pg_temp.etapa(text), pg_temp.versao(uuid, integer), pg_temp.numeros(uuid, integer) to authenticated;

-- Preparação, como administrador: e1 com a histórica V5F (com relatório), a piloto V6P e a V7 com o relatório junto.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select public.registrar_versao_historica(pg_temp.processo('e1'), 5, pg_temp.so_bpm() || pg_temp.relatorio());
select public.registrar_versao(pg_temp.processo('e1'), 6, pg_temp.so_bpm(), true);
select public.registrar_versao(pg_temp.processo('e1'), 7, pg_temp.so_bpm() || pg_temp.relatorio(), false, 1);
select public.registrar_versao_historica(pg_temp.processo('e5'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e7'), 3, pg_temp.so_bpm(), true);
select public.registrar_versao(pg_temp.processo('e2'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e3'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e4'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e6'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e8'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e9'), 1, pg_temp.so_bpm());

-- Relatório junto com a versão em sequência (a histórica tem relatório sem número e não conta): o primeiro numerado é V1.
insert into _tap (linha) select is(pg_temp.numeros(pg_temp.processo('e1'), 7), array[1],
  'o relatório que entra junto com a V7 recebe o Relatório V1, mesmo com relatório na histórica');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao
    where versao_id = pg_temp.versao(pg_temp.processo('e1'), 5) and papel = 'relatorio' and numero_do_relatorio is null), 1::bigint,
  'o relatório da versão histórica fica sem número');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e9'), 2, pg_temp.so_bpm() || pg_temp.relatorio(), false, 5)$sql$,
  'P0001', 'numero_do_relatorio_mudou:1', 'o número do relatório da prévia precisa ser o que o banco daria');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e9'), 2, pg_temp.so_bpm() || pg_temp.relatorio('pdf'), false, 1)$sql$,
  'P0001', 'relatorio_so_docx', 'o relatório novo só vale em .docx');

-- Etapas: e4 vai à técnica, e3 à Publicação.
select pg_temp.mover_sem_trava(pg_temp.processo('e4'), pg_temp.etapa('relatorio_modelagem_tecnica'));
select pg_temp.mover_sem_trava(pg_temp.processo('e3'), pg_temp.etapa('publicacao'));
-- e2, e6 e e8 mudam de situação (as versões foram criadas antes).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select public.suspender_processo(pg_temp.processo('e2'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('e6'), 'Não segue');
select pg_temp.mover_sem_trava(pg_temp.processo('e8'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');

-- Outra chamada: as versões já existem há um dia.
reset role;
update public.versoes set enviada_em = now() - interval '1 day';

-- Administrador, no processo e1: o relatório sozinho fica ligado à V7, a mais recente que não é histórica.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e1'), 7, 2, pg_temp.relatorio())$sql$,
  'administrador envia o relatório sozinho');
insert into _tap (linha) select is(pg_temp.numeros(pg_temp.processo('e1'), 7), array[1, 2],
  'o relatório sozinho fica ligado à V7 com o próximo número, e a V7 passa a ter dois relatórios');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao
    where versao_id = pg_temp.versao(pg_temp.processo('e1'), 7) and numero_do_relatorio = 2
      and enviado_por = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o relatório novo guarda quem o enviou');
select public.registrar_versao(pg_temp.processo('e1'), 8, pg_temp.so_bpm());
reset role;
update public.versoes set enviada_em = now() - interval '1 day';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e1'), 8, 3, pg_temp.relatorio())$sql$,
  'com a V8 mais recente, o relatório vai para a V8');
insert into _tap (linha) select is(pg_temp.numeros(pg_temp.processo('e1'), 8), array[3],
  'a V8 recebe o Relatório V3 (o número é do processo)');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e1'), 8, 4, pg_temp.relatorio('pdf'))$sql$,
  'P0001', 'relatorio_so_docx', 'o relatório sozinho só vale em .docx');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e1'), 8, 9, pg_temp.relatorio())$sql$,
  'P0001', 'numero_do_relatorio_mudou:4', 'o número do relatório da prévia precisa ser o próximo do processo');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e1'), 3, 4, pg_temp.relatorio())$sql$,
  'P0001', 'numero_da_versao_mudou:8', 'a versão da prévia precisa ser a mais recente que não é histórica');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
    values (pg_temp.versao(pg_temp.processo('e1'), 7), 'relatorio', 'RN1_V7_P_Relatório V4.docx', 'docx', 100,
      '0123456789abcdef0123456789abcdef', 'x')$sql$,
  'P0001', 'relatorio_fora_da_versao_mais_recente', 'o relatório não entra numa versão que não é a mais recente');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, numero_do_relatorio)
    values (pg_temp.versao(pg_temp.processo('e1'), 8), 'relatorio', 'RN1_V8_P_Relatório V9.docx', 'docx', 100,
      '0123456789abcdef0123456789abcdef', 'x', 9)$sql$,
  '42501', null, 'ninguém escolhe o número do relatório: só o banco o preenche');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set numero_do_relatorio = 99 where versao_id = pg_temp.versao(pg_temp.processo('e1'), 8)
    and papel = 'relatorio'$sql$,
  '42501', null, 'o número do relatório não se altera');

-- Sem versão que receba: só a histórica; a piloto recebe.
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e5'), 1, 1, pg_temp.relatorio())$sql$,
  'P0001', 'relatorio_sem_versao', 'o processo só com a histórica não recebe relatório sozinho');
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e7'), 3, 1, pg_temp.relatorio())$sql$,
  'o relatório pode acompanhar a versão piloto');
insert into _tap (linha) select is(pg_temp.numeros(pg_temp.processo('e7'), 3), array[1], 'e fica ligado à V3P com o Relatório V1');

-- Onde cabe e numeração por processo: e4 na técnica (V1) e depois na Revisão interna (V2); e3 na Publicação é recusado.
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e4'), 1, 1, pg_temp.relatorio())$sql$,
  'o relatório sozinho vale na técnica');
insert into _tap (linha) select is(pg_temp.numeros(pg_temp.processo('e4'), 1), array[1],
  'cada processo tem a sua numeração: o e4 começa no Relatório V1');
select pg_temp.mover_sem_trava(pg_temp.processo('e4'), pg_temp.etapa('revisao_interna'));
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e4'), 1, 2, pg_temp.relatorio())$sql$,
  'o relatório sozinho vale na Revisão interna');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e3'), 1, 1, pg_temp.relatorio())$sql$,
  'P0001', 'relatorio_fora_da_etapa', 'depois da Revisão interna o relatório é recusado');

-- Processo fora de andamento.
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e2'), 1, 1, pg_temp.relatorio())$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'relatório em processo suspenso é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e6'), 1, 1, pg_temp.relatorio())$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'relatório em processo cancelado é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e8'), 1, 1, pg_temp.relatorio())$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'relatório em processo concluído é recusado');

-- Eventos: um por relatório enviado depois da versão, com o rótulo da versão e o número; o junto não tem evento próprio.
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar_relatorio'
    and entidade_ref = pg_temp.processo('e1')::text), 2::bigint, 'cada relatório enviado depois da versão gera um evento');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar_relatorio'
    and detalhes -> 'depois' ->> 'rotulo' = 'V8' and detalhes -> 'depois' ->> 'numero_do_relatorio' = '3'
    and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o evento traz a versão que o relatório acompanha, o número e o autor');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar_relatorio'
    and detalhes -> 'depois' ->> 'numero_do_relatorio' = '1' and entidade_ref = pg_temp.processo('e1')::text), 0::bigint,
  'o relatório que entrou junto com a versão não gera evento próprio');

-- O que saiu com o modelo antigo.
insert into _tap (linha) select is((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('acrescentar_relatorio', 'registrar_sem_alteracao', 'origem_do_relatorio')), 0::bigint,
  'as funções de relatório depois, sem alteração e origem do relatório saíram');
insert into _tap (linha) select is((select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'arquivos_da_versao' and column_name = 'copiado_de'), 0::bigint,
  'a coluna copiado_de saiu');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e9'), 1, 1, pg_temp.relatorio())$sql$,
  'integrante envia o relatório');

-- Consulta, inativo e visitante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e9'), 1, 2, pg_temp.relatorio())$sql$,
  '42501', null, 'consulta não envia relatório');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e9'), 1, 2, pg_temp.relatorio())$sql$,
  '42501', null, 'inativo não envia relatório');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio('00000000-0000-0000-0000-000000000001', 1, 1, '{}'::jsonb)$sql$, '42501', null,
  'visitante não envia relatório');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
