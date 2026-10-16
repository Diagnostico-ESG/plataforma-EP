-- Versões históricas (documentos-versoes, ticket 04): o número digitado, só antes da versão nova, os arquivos que
-- existirem (.bpm, ou .bpmn e .png), somente leitura depois de criada, o evento próprio e quem pode registrar.
-- Complementa o 27 (versões novas). "Outra chamada" é simulada recuando enviada_em como superusuário, porque o
-- pgTAP roda tudo numa transação só e o banco reconhece "a mesma chamada" por enviada_em = now().
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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000e1', 'VH1', 'Setor Versões');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000e1', null, 'Macro Versões');
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Versao'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Parado V'),
  ('9f000000-0000-0000-0000-0000000000e3', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Cancelado V'),
  ('9f000000-0000-0000-0000-0000000000e4', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Concluido V'),
  ('9f000000-0000-0000-0000-0000000000e5', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Excluir V');

-- Um arquivo inventado no formato que registrar_versao recebe.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'VH1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn'), pg_temp.arquivo('png', 'png')) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.versao(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$ select id from public.versoes where processo_id = processo and numero = numero_da_versao $$;
-- Troca o tamanho dos arquivos que o usuário consegue alterar (fora do processo suspenso) e diz quantos mudaram.
create function pg_temp.alterar_tamanhos(novo bigint) returns bigint
language plpgsql as $$
declare alterados bigint;
begin
  with alterado as (update public.arquivos_da_versao set tamanho = novo
    where versao_id not in (select id from public.versoes where processo_id = pg_temp.processo('e2')) returning id) select count(*) into alterados from alterado;
  return alterados;
end $$;
grant execute on function pg_temp.arquivo(text, text, bigint), pg_temp.par(), pg_temp.processo(text),
  pg_temp.versao(uuid, integer), pg_temp.alterar_tamanhos(bigint) to authenticated;

-- Preparação, como integrante: as etapas do setor resolvidas e o "Processo Concluido V" com as obrigatórias resolvidas.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-0000000000e1' and status = 'pendente';
-- Na ordem do caminho, uma por vez (a sequência das etapas é conferida a cada mudança).
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'modelagem';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'relatorio_modelagem_tecnica';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'revisao_interna';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'revisao_setor';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'aprovacao_setor';
select public.suspender_processo(pg_temp.processo('e2'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('e3'), 'Não segue');

-- Administrador, no processo e1.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 5, '  Da primeira etapa  ', jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'administrador registra a V5F só com o .bpm');
insert into _tap (linha) select is((select numero from public.versoes where processo_id = pg_temp.processo('e1') and historica), 5, 'a histórica guarda o número digitado');
insert into _tap (linha) select ok((select etapa_id is null from public.versoes where processo_id = pg_temp.processo('e1') and numero = 5), 'a histórica não tem etapa');
insert into _tap (linha) select is((select enviada_por::text from public.versoes where processo_id = pg_temp.processo('e1') and numero = 5),
  '00000000-0000-0000-0000-0000000000a1', 'quem registrou é quem chamou');
insert into _tap (linha) select is((select observacao from public.versoes where processo_id = pg_temp.processo('e1') and numero = 5), 'Da primeira etapa',
  'a observação é gravada sem espaços nas pontas');
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 3, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, 'registra também a V3F');
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 4, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, 'registra também a V4F');
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('e1') and historica), 3::bigint, 'o processo tem três históricas');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 5, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'P0001', 'numero_historico_repetido:5', 'número de histórica repetido é recusado');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 9, null, jsonb_build_array(pg_temp.arquivo('png', 'png')))$sql$,
  'P0001', 'historica_sem_arquivo_de_fluxograma', 'histórica só com .png é recusada');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 9, null, jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn')))$sql$,
  'P0001', 'historica_sem_arquivo_de_fluxograma', 'histórica só com .bpmn é recusada');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 9, null, jsonb_build_array(pg_temp.arquivo('relatorio', 'pdf')))$sql$,
  'P0001', 'historica_sem_arquivo_de_fluxograma', 'histórica só com relatório é recusada');
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 2, null, pg_temp.par())$sql$, 'histórica com .bpmn e .png é aceita (V2F)');
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 1, null, pg_temp.par() || pg_temp.arquivo('relatorio', 'pdf'))$sql$,
  'o relatório opcional entra na criação da histórica (V1F)');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 1)), 3::bigint, 'a V1F tem os três arquivos');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 0, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, '23514', null, 'número zero é recusado');

-- Somente leitura: depois da criação (outra chamada), nada entra nem muda na histórica.
reset role;
update public.versoes set enviada_em = now() - interval '1 day' where historica;
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
    values (pg_temp.versao(pg_temp.processo('e1'), 2), 'relatorio', 'VH1_V2F_P_Relatório.pdf', 'pdf', 10, '0123456789abcdef0123456789abcdef', 'x')$sql$,
  'P0001', 'versao_historica_somente_leitura', 'relatório acrescentado depois em histórica é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set tamanho = 5 where versao_id = pg_temp.versao(pg_temp.processo('e1'), 3)$sql$,
  'P0001', 'versao_historica_somente_leitura', 'arquivo de histórica não é substituído');

-- Numeração: a primeira versão nova continua depois da histórica; depois dela, histórica não entra mais.
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao(pg_temp.processo('e1'), 6, null, pg_temp.par())$sql$, 'versão nova depois da V5F é aceita');
insert into _tap (linha) select is((select max(numero) from public.versoes where processo_id = pg_temp.processo('e1') and not historica), 6, 'a versão nova depois de V5F recebe V6');
insert into _tap (linha) select is((select e.codigo from public.versoes v join public.etapas e on e.id = v.etapa_id
    where v.processo_id = pg_temp.processo('e1') and v.numero = 6), 'modelagem', 'a versão nova guarda a etapa atual');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 7, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'P0001', 'historica_depois_de_versao_nova', 'histórica depois de versão nova é recusada');

-- Processo fora de andamento.
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e2'), 1, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'histórica em processo suspenso é recusada');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e3'), 1, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'histórica em processo cancelado é recusada');
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e4'), 1, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'histórica em processo concluído é recusada');

-- Eventos: um por registro, com evento próprio; a nova continua com "enviar".
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'registrar_historica' and entidade_ref = pg_temp.processo('e1')::text),
  5::bigint, 'cada histórica gera um evento ligado ao processo');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'registrar_historica'
    and entidade_ref = pg_temp.processo('e1')::text and detalhes -> 'depois' ->> 'rotulo' = 'V5F'
    and detalhes -> 'depois' ->> 'etapa' is null and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o evento traz o rótulo V5F, sem etapa, e o autor');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar' and entidade_ref = pg_temp.processo('e1')::text),
  1::bigint, 'a versão nova continua gerando o evento enviar');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e5'), 2, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, 'integrante registra uma histórica');
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('e1') and historica), 5::bigint, 'integrante lê as históricas');

-- Consulta.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 8, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, '42501', null, 'consulta não registra histórica');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'registrar_historica'), 6::bigint, 'consulta lê os eventos de histórica');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e1'), 8, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, '42501', null, 'inativo não registra histórica');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'registrar_historica'), 0::bigint, 'inativo não lê os eventos de histórica');

-- Visitante.
reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica('9f000000-0000-0000-0000-0000000000e1', 8, null, '[]'::jsonb)$sql$, '42501', null,
  'visitante não registra histórica');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
