-- ENSAIO TEMPORÁRIO (apagar depois): a migração versoes_historicas dentro do teste, desfeita no fim.
-- Versões históricas (documentos-versoes, ticket 04): o número digitado, só antes da versão nova, os arquivos que
-- existirem (.bpm, ou .bpmn e .png), somente leitura depois de criada, o evento próprio e quem pode registrar.
-- Complementa o 27 (versões novas). "Outra chamada" é simulada recuando enviada_em como superusuário, porque o
-- pgTAP roda tudo numa transação só e o banco reconhece "a mesma chamada" por enviada_em = now().
begin;
-- Versões históricas (documentos-versoes, ticket 04): as versões da primeira etapa do trabalho (V5F), registradas à
-- mão com o número digitado e os arquivos que existirem. Acrescenta o ramo "historica" aos gatilhos da migração
-- versoes e a função que grava a histórica. Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts).
-- Regras: só enquanto o processo não tem versão nova; número único; sem etapa; .bpm ou .bpmn e .png (relatório
-- opcional, só na criação); depois de criada é somente leitura; um evento próprio ("registrar_historica").

-- A coluna "historica" nasceu sem privilégio de inclusão (ticket 02): agora a inclusão é permitida; as regras abaixo
-- e a RLS (administrador e integrante ativos) decidem o resto.
grant insert (historica) on public.versoes to authenticated;

-- A histórica só entra enquanto o processo não tem versão nova, e o número digitado não pode já existir nele
-- (a restrição versoes_numero_unico continua como rede de segurança). Roda com a permissão de quem grava.
create function private.conferir_versao_historica(processo uuid, numero_digitado integer) returns void
language plpgsql stable set search_path = ''
as $
begin
  if exists (select 1 from public.versoes where processo_id = processo and not historica) then
    raise exception 'historica_depois_de_versao_nova';
  end if;
  if exists (select 1 from public.versoes where processo_id = processo and numero = numero_digitado) then
    raise exception 'numero_historico_repetido:%', numero_digitado;
  end if;
end $;

-- Antes de incluir a versão: a nova recebe o número (maior do processo + 1, o que vier é ignorado) e a etapa atual; a
-- histórica mantém o número digitado e não tem etapa. Autor, data e observação aparada valem para as duas.
create or replace function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  if new.historica then
    perform private.conferir_versao_historica(new.processo_id, new.numero);
    new.etapa_id := null;
  else
    new.numero := coalesce((select max(numero) from public.versoes where processo_id = new.processo_id), 0) + 1;
    new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  end if;
  new.observacao := nullif(btrim(new.observacao), '');
  new.enviada_por := (select auth.uid());
  new.enviada_em := now();
  return new;
end $;

-- A nova tem .bpmn e .png; a histórica, o .bpm ou o par .bpmn e .png (o relatório é opcional nas duas). Conferido no
-- fim da gravação (restrição adiada), porque a versão entra antes dos arquivos.
create or replace function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $
declare
  papeis public.papel_do_arquivo[] := array(select papel from public.arquivos_da_versao where versao_id = new.id);
begin
  if new.historica then
    if not (papeis @> array['bpm']::public.papel_do_arquivo[] or papeis @> array['bpmn', 'png']::public.papel_do_arquivo[]) then
      raise exception 'historica_sem_arquivo_de_fluxograma';
    end if;
  elsif not papeis @> array['bpmn', 'png']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpmn_e_png';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, autor e data de quem grava. A histórica é
-- somente leitura: nenhum arquivo muda, e só entra arquivo na chamada que criou a versão (enviada_em = now() é o
-- início da transação; outra chamada tem outro instante).
create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $
declare
  da_versao record;
begin
  select processo_id, historica, enviada_em into da_versao from public.versoes where id = new.versao_id;
  perform private.conferir_processo_que_recebe_versao(da_versao.processo_id);
  if da_versao.historica and (tg_op = 'UPDATE' or da_versao.enviada_em <> now()) then
    raise exception 'versao_historica_somente_leitura';
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $;

-- Um evento por registro: "registrar_historica" na histórica, "enviar" na nova.
create or replace function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.historica then 'registrar_historica' else 'enviar' end, 'versao',
    new.processo_id::text, jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $;

-- Os arquivos que a função de registro recebeu (papel, nome, formato, tamanho, hash_md5, drive_id), gravados com a
-- permissão de quem chamou: a RLS e os gatilhos decidem. Compartilhada pelas duas funções de registro.
create function private.gravar_arquivos_da_versao(versao uuid, arquivos jsonb) returns void
language sql set search_path = ''
as $
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
  select versao, (a ->> 'papel')::public.papel_do_arquivo, a ->> 'nome', a ->> 'formato', (a ->> 'tamanho')::bigint,
    a ->> 'hash_md5', a ->> 'drive_id'
  from jsonb_array_elements(arquivos) as a $;

-- No fim da gravação, cobra as conferências adiadas e o evento; nomes qualificados (lição da migração
-- reunioes_salvar_com_nomes_qualificados).
create function private.cobrar_conferencias_da_versao() returns void
language plpgsql set search_path = ''
as $
begin
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao immediate;
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao deferred;
end $;

-- Mesma assinatura e mesmo comportamento da migração versoes; só passa a usar as funções compartilhadas.
create or replace function public.registrar_versao(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $
declare
  versao uuid;
  numero_dado integer;
begin
  insert into public.versoes (processo_id, observacao) values (p_processo, p_observacao)
  returning id, numero into versao, numero_dado;
  if numero_dado <> p_numero then
    raise exception 'numero_da_versao_mudou:%', numero_dado;
  end if;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $;

-- Grava a versão histórica e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou.
-- Sem security definer: a RLS decide. p_numero é o número digitado.
create function public.registrar_versao_historica(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $
declare
  versao uuid;
begin
  insert into public.versoes (processo_id, numero, observacao, historica)
  values (p_processo, p_numero, p_observacao, true) returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $;

revoke execute on function public.registrar_versao_historica(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.registrar_versao_historica(uuid, integer, text, jsonb) to authenticated;
-- Chamadas de dentro das funções de registro, que rodam com a permissão de quem grava.
revoke execute on function private.conferir_versao_historica(uuid, integer), private.gravar_arquivos_da_versao(uuid, jsonb),
  private.cobrar_conferencias_da_versao() from public, anon;
grant execute on function private.conferir_versao_historica(uuid, integer), private.gravar_arquivos_da_versao(uuid, jsonb),
  private.cobrar_conferencias_da_versao() to authenticated;

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
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e5'), 8, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, '42501', null, 'consulta não registra histórica');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'registrar_historica'), 6::bigint, 'consulta lê os eventos de histórica');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok($sql$select public.registrar_versao_historica(pg_temp.processo('e5'), 8, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')))$sql$, '42501', null, 'inativo não registra histórica');
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
