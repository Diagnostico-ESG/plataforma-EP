-- Versão piloto e onde cada envio cabe (documentos-versoes, ticket 09; ADR 0025): a piloto (V6P) tem número digitado,
-- maior que o de todas as versões do processo, e só entra antes da primeira em sequência; a em sequência continua do
-- maior número de qualquer tipo; as duas exigem só o .bpm; histórica só em Não iniciados, piloto até a Modelagem piloto
-- e em sequência até a Revisão interna (pela ordem do catálogo); e o evento próprio da piloto. A histórica fora de Não
-- iniciados fica no 28; acrescentar .png e .bpmn, no 57.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(31);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000056', 'VP1', 'Setor Piloto');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000056', null, 'Macro Piloto');
-- e1: histórica, piloto e em sequência na Modelagem piloto; e2: piloto e histórica em Não iniciados; e3: em sequência
-- sem versão; e4: piloto a partir de 1; e5: técnica; e6: Revisão interna; e7: Validação com o setor; e8: etapa nova.
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 1'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 2'),
  ('9f000000-0000-0000-0000-0000000000e3', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 3'),
  ('9f000000-0000-0000-0000-0000000000e4', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 4'),
  ('9f000000-0000-0000-0000-0000000000e5', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 5'),
  ('9f000000-0000-0000-0000-0000000000e6', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 6'),
  ('9f000000-0000-0000-0000-0000000000e7', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 7'),
  ('9f000000-0000-0000-0000-0000000000e8', '5f000000-0000-0000-0000-000000000056', 'af000000-0000-0000-0000-000000000056', 'Processo Piloto 8');

-- Um arquivo inventado no formato que registrar_versao recebe.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'VP1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.so_bpm() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')) $$;
create function pg_temp.tudo() returns jsonb
language sql immutable as $$
  select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png'), pg_temp.arquivo('bpmn', 'bpmn')) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.versao(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$ select id from public.versoes where processo_id = processo and numero = numero_da_versao $$;
grant execute on function pg_temp.arquivo(text, text, bigint), pg_temp.so_bpm(), pg_temp.tudo(), pg_temp.processo(text),
  pg_temp.etapa(text), pg_temp.versao(uuid, integer) to authenticated;

-- Preparação: o administrador cria a etapa nova (depois da Revisão interna); o integrante registra a V5F do e1, ainda em
-- Não iniciados, e põe cada processo na sua etapa.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select public.acrescentar_etapa('etapa_t56', 'Etapa T56', 'V', null);
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select public.registrar_versao_historica(pg_temp.processo('e1'), 5, pg_temp.so_bpm());
select pg_temp.mover_sem_trava(pg_temp.processo('e1'), pg_temp.etapa('modelagem'));
select pg_temp.mover_sem_trava(pg_temp.processo('e5'), pg_temp.etapa('relatorio_modelagem_tecnica'));
select pg_temp.mover_sem_trava(pg_temp.processo('e6'), pg_temp.etapa('revisao_interna'));
select pg_temp.mover_sem_trava(pg_temp.processo('e7'), pg_temp.etapa('revisao_setor'));
select pg_temp.mover_sem_trava(pg_temp.processo('e8'), pg_temp.etapa('etapa_t56'));

-- Administrador: a numeração da piloto e da versão em sequência, no e1 (V5F → V6P → V7P → V8P → V9).
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 6, pg_temp.so_bpm(), true)$sql$,
  'piloto V6P depois da V5F, só com o .bpm, é aceita');
insert into _tap (linha) select is(
  (select count(*) from public.versoes where processo_id = pg_temp.processo('e1') and numero = 6 and piloto and not historica), 1::bigint,
  'a V6P é piloto e não é histórica');
insert into _tap (linha) select is(
  (select e.codigo from public.versoes v join public.etapas e on e.id = v.etapa_id where v.processo_id = pg_temp.processo('e1') and v.numero = 6),
  'modelagem', 'a piloto guarda a etapa atual do processo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 5, pg_temp.so_bpm(), true)$sql$,
  'P0001', 'numero_da_piloto_nao_maior:6', 'piloto V5P, menor que a maior, é recusada com o mínimo na frase');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 6, pg_temp.so_bpm(), true)$sql$,
  'P0001', 'numero_da_piloto_nao_maior:6', 'piloto com o mesmo número da maior é recusada');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 7, pg_temp.so_bpm(), true)$sql$,
  'mais de uma piloto: a V7P é aceita');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 8, pg_temp.tudo(), true)$sql$,
  'a piloto aceita o .png e o .bpmn junto');
insert into _tap (linha) select is(
  (select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 8)), 3::bigint,
  'a V8P tem os três arquivos');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 9, jsonb_build_array(pg_temp.arquivo('png', 'png')), true)$sql$,
  'P0001', 'versao_sem_bpm', 'piloto sem .bpm é recusada');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 9, pg_temp.so_bpm())$sql$,
  'a versão em sequência continua do maior número, de qualquer tipo (V8P → V9), só com o .bpm');
insert into _tap (linha) select is(
  (select count(*) from public.versoes where processo_id = pg_temp.processo('e1') and numero = 9 and not piloto and not historica), 1::bigint,
  'a V9 não é piloto nem histórica');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 10, pg_temp.so_bpm(), true)$sql$,
  'P0001', 'piloto_depois_de_versao_em_sequencia', 'piloto depois da versão em sequência é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.versoes (processo_id, numero, historica, piloto) values (pg_temp.processo('e4'), 50, true, true)$sql$,
  '23514', null, 'versão histórica e piloto ao mesmo tempo é recusada');

-- Em Não iniciados, a piloto cabe (a janela da trava envia ali) e abre a numeração a partir do digitado (e2).
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e2'), 3, pg_temp.so_bpm(), true)$sql$,
  'sem versão nenhuma, a piloto começa de qualquer número (V3P), mesmo em Não iniciados');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e2'), 1, pg_temp.so_bpm(), true)$sql$,
  'P0001', 'numero_da_piloto_nao_maior:3', 'depois da V3P, a V1P é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao_historica(pg_temp.processo('e2'), 1, pg_temp.so_bpm())$sql$,
  'P0001', 'historica_depois_de_versao_nova', 'histórica depois da piloto é recusada');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e2'), 4, pg_temp.so_bpm())$sql$, 'a em sequência depois da V3P é a V4');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e3'), 1, pg_temp.so_bpm())$sql$, 'sem versão nenhuma, a em sequência é a V1');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e4'), 1, pg_temp.so_bpm(), true)$sql$, 'sem histórica, a piloto pode ser a V1P');

-- Onde cabe, pela ordem do catálogo.
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e5'), 1, pg_temp.so_bpm(), true)$sql$,
  'P0001', 'piloto_fora_da_etapa', 'piloto na Relatório e modelagem técnica é recusada');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e5'), 1, pg_temp.so_bpm())$sql$, 'versão em sequência na técnica é aceita');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e6'), 1, pg_temp.so_bpm())$sql$, 'versão em sequência na Revisão interna é aceita');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e7'), 1, pg_temp.so_bpm())$sql$,
  'P0001', 'versao_fora_da_etapa', 'versão em sequência na Validação com o setor é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e8'), 1, pg_temp.so_bpm())$sql$,
  'P0001', 'versao_fora_da_etapa', 'versão em sequência numa etapa nova depois da Revisão interna é recusada');

-- Eventos: um por piloto, com o rótulo V6P; a em sequência continua com "enviar".
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar_piloto' and entidade_ref = pg_temp.processo('e1')::text),
  3::bigint, 'cada versão piloto gera um evento enviar_piloto ligado ao processo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar_piloto' and entidade_ref = pg_temp.processo('e1')::text
    and detalhes -> 'depois' ->> 'rotulo' = 'V6P' and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o evento da piloto traz o rótulo V6P e o autor');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar' and entidade_ref = pg_temp.processo('e1')::text),
  1::bigint, 'a versão em sequência continua gerando o evento enviar');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e4'), 2, pg_temp.so_bpm(), true)$sql$, 'integrante envia uma versão piloto');

-- Consulta, inativo e visitante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e4'), 3, pg_temp.so_bpm(), true)$sql$, '42501', null, 'consulta não envia piloto');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e4'), 3, pg_temp.so_bpm(), true)$sql$, '42501', null, 'inativo não envia piloto');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao('9f000000-0000-0000-0000-0000000000e4', 3, '[]'::jsonb, true)$sql$, '42501', null,
  'visitante não envia piloto');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
