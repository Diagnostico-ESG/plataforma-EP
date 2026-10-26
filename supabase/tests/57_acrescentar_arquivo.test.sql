-- Acrescentar .png e .bpmn depois (documentos-versoes, ticket 09; ADR 0025): só na versão piloto ou em sequência que
-- ainda não tem o arquivo, fora da versão aprovada (ADR 0011) e da histórica, com o processo em andamento e em qualquer
-- etapa; o evento próprio, que o relatório acrescentado depois não confunde; quem pode.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(19);

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

-- Isola o teste dos dados que já existem no banco (a prova do Drive deixa versões, arquivos, eventos e pastas de teste
-- no desenvolvimento): a limpeza vale só nesta transação, que é desfeita no fim.
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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000057', 'AA1', 'Setor Acrescentar');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000057', null, 'Macro Acrescentar');
-- e1: piloto; e2: histórica; e3: versão aprovada; e4: suspenso; e5: em sequência na Publicação.
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-000000000057', 'af000000-0000-0000-0000-000000000057', 'Processo Acrescentar 1'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-000000000057', 'af000000-0000-0000-0000-000000000057', 'Processo Acrescentar 2'),
  ('9f000000-0000-0000-0000-0000000000e3', '5f000000-0000-0000-0000-000000000057', 'af000000-0000-0000-0000-000000000057', 'Processo Acrescentar 3'),
  ('9f000000-0000-0000-0000-0000000000e4', '5f000000-0000-0000-0000-000000000057', 'af000000-0000-0000-0000-000000000057', 'Processo Acrescentar 4'),
  ('9f000000-0000-0000-0000-0000000000e5', '5f000000-0000-0000-0000-000000000057', 'af000000-0000-0000-0000-000000000057', 'Processo Acrescentar 5');

-- Um arquivo inventado no formato que registrar_versao e acrescentar_arquivo recebem.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'AA1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.so_bpm() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.versao(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$ select id from public.versoes where processo_id = processo and numero = numero_da_versao $$;
grant execute on function pg_temp.arquivo(text, text, bigint), pg_temp.so_bpm(), pg_temp.processo(text),
  pg_temp.etapa(text), pg_temp.versao(uuid, integer) to authenticated;

-- Preparação, como integrante: cada processo com a sua versão, só com o .bpm, e na sua situação.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select public.registrar_versao(pg_temp.processo('e1'), 6, pg_temp.so_bpm(), true);
select public.registrar_versao_historica(pg_temp.processo('e2'), 5, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e3'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e4'), 1, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('e5'), 1, pg_temp.so_bpm());
select pg_temp.mover_sem_trava(pg_temp.processo('e3'), pg_temp.etapa('aprovacao_setor'));
select public.registrar_aprovacao(pg_temp.processo('e3'), null, null, null);
select public.suspender_processo(pg_temp.processo('e4'), 'Aguardando o setor');
select pg_temp.mover_sem_trava(pg_temp.processo('e5'), pg_temp.etapa('publicacao'));

-- Os arquivos entram numa chamada posterior à da versão (o banco reconhece "a mesma chamada" por enviada_em = now(), e o
-- pgTAP roda tudo numa transação só): recua enviada_em como superusuário, como o 28 faz.
reset role;
update public.versoes set enviada_em = now() - interval '1 day';

-- Administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e1'), 6), pg_temp.arquivo('png', 'png'))$sql$,
  'acrescentar o .png à versão piloto que não o tem é aceito');
insert into _tap (linha) select is(
  (select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 6)), 2::bigint,
  'a V6P passa a ter o .bpm e o .png');
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e1'), 6), pg_temp.arquivo('bpmn', 'bpmn'))$sql$,
  'acrescentar o .bpmn também é aceito');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e1'), 6), pg_temp.arquivo('png', 'png'))$sql$,
  'P0001', 'arquivo_ja_existe', 'acrescentar um arquivo que a versão já tem é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e5'), 1), pg_temp.arquivo('bpm', 'bpm'))$sql$,
  'P0001', 'papel_nao_acrescentavel', 'o .bpm não se acrescenta depois');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e5'), 1), pg_temp.arquivo('relatorio', 'pdf'))$sql$,
  'P0001', 'papel_nao_acrescentavel', 'o relatório não se acrescenta por esta função');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e2'), 5), pg_temp.arquivo('png', 'png'))$sql$,
  'P0001', 'versao_historica_somente_leitura', 'acrescentar à versão histórica é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e3'), 1), pg_temp.arquivo('png', 'png'))$sql$,
  'P0001', 'versao_aprovada:1', 'acrescentar à versão aprovada é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e4'), 1), pg_temp.arquivo('png', 'png'))$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'acrescentar num processo suspenso é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e5'), 1), pg_temp.arquivo('png', 'png'))$sql$,
  'acrescentar vale em qualquer etapa com o processo em andamento (aqui, a Publicação)');

-- Eventos: um por arquivo acrescentado, com o papel e o rótulo; o relatório acrescentado depois tem o evento dele.
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'acrescentar_arquivo' and entidade_ref = pg_temp.processo('e1')::text),
  2::bigint, 'cada arquivo acrescentado gera um evento ligado ao processo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'acrescentar_arquivo' and entidade_ref = pg_temp.processo('e1')::text
    and detalhes -> 'depois' ->> 'rotulo' = 'V6P' and detalhes -> 'depois' ->> 'papel' = 'png'
    and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o evento traz o rótulo da versão, o papel e o autor');
insert into _tap (linha) select throws_ok(
  $sql$select public.enviar_relatorio(pg_temp.processo('e5'), 1, 1, pg_temp.arquivo('relatorio', 'docx'))$sql$,
  'P0001', 'relatorio_fora_da_etapa', 'o relatório tem a sua própria função (e a Publicação não o recebe)');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao in ('acrescentar_relatorio', 'enviar_relatorio') and entidade_ref = pg_temp.processo('e5')::text),
  0::bigint, 'nenhum evento de relatório nasce de acrescentar arquivo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'acrescentar_arquivo' and entidade_ref = pg_temp.processo('e5')::text),
  1::bigint, 'e só o .png gerou acrescentar_arquivo, não o relatório');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e5'), 1), pg_temp.arquivo('bpmn', 'bpmn'))$sql$,
  'integrante acrescenta o .bpmn');

-- Consulta, inativo e visitante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(pg_temp.versao(pg_temp.processo('e1'), 6), pg_temp.arquivo('png', 'png'))$sql$,
  '42501', null, 'consulta não acrescenta arquivo');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(gen_random_uuid(), pg_temp.arquivo('png', 'png'))$sql$,
  '42501', null, 'inativo não acrescenta arquivo');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_arquivo(gen_random_uuid(), '{}'::jsonb)$sql$, '42501', null,
  'visitante não acrescenta arquivo');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
