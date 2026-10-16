-- ENSAIO TEMPORÁRIO (apagar depois): a migração versoes_historicas dentro do teste, desfeita no fim.
-- Versões (documentos-versoes, ticket 02): quem pode o quê em versoes, arquivos_da_versao e nos eventos de versão,
-- e as regras do banco (número, etapa, processo em andamento, par .bpmn e .png, um arquivo por papel, formato e
-- tamanho, nada se apaga, processo com versão não se exclui, um evento por envio). O caso "processo com versão não
-- se exclui" fica aqui, ao lado das versões, como o 23 tem o caso das reuniões.
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
as $$
begin
  if exists (select 1 from public.versoes where processo_id = processo and not historica) then
    raise exception 'historica_depois_de_versao_nova';
  end if;
  if exists (select 1 from public.versoes where processo_id = processo and numero = numero_digitado) then
    raise exception 'numero_historico_repetido:%', numero_digitado;
  end if;
end $$;

-- Antes de incluir a versão: a nova recebe o número (maior do processo + 1, o que vier é ignorado) e a etapa atual; a
-- histórica mantém o número digitado e não tem etapa. Autor, data e observação aparada valem para as duas.
create or replace function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $$
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
end $$;

-- A nova tem .bpmn e .png; a histórica, o .bpm ou o par .bpmn e .png (o relatório é opcional nas duas). Conferido no
-- fim da gravação (restrição adiada), porque a versão entra antes dos arquivos.
create or replace function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
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
end $$;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, autor e data de quem grava. A histórica é
-- somente leitura: nenhum arquivo muda, e só entra arquivo na chamada que criou a versão (enviada_em = now() é o
-- início da transação; outra chamada tem outro instante).
create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
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
end $$;

-- Um evento por registro: "registrar_historica" na histórica, "enviar" na nova.
create or replace function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.historica then 'registrar_historica' else 'enviar' end, 'versao',
    new.processo_id::text, jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Os arquivos que a função de registro recebeu (papel, nome, formato, tamanho, hash_md5, drive_id), gravados com a
-- permissão de quem chamou: a RLS e os gatilhos decidem. Compartilhada pelas duas funções de registro.
create function private.gravar_arquivos_da_versao(versao uuid, arquivos jsonb) returns void
language sql set search_path = ''
as $$
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
  select versao, (a ->> 'papel')::public.papel_do_arquivo, a ->> 'nome', a ->> 'formato', (a ->> 'tamanho')::bigint,
    a ->> 'hash_md5', a ->> 'drive_id'
  from jsonb_array_elements(arquivos) as a $$;

-- No fim da gravação, cobra as conferências adiadas e o evento; nomes qualificados (lição da migração
-- reunioes_salvar_com_nomes_qualificados).
create function private.cobrar_conferencias_da_versao() returns void
language plpgsql set search_path = ''
as $$
begin
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao immediate;
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao deferred;
end $$;

-- Mesma assinatura e mesmo comportamento da migração versoes; só passa a usar as funções compartilhadas.
create or replace function public.registrar_versao(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
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
end $$;

-- Grava a versão histórica e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou.
-- Sem security definer: a RLS decide. p_numero é o número digitado.
create function public.registrar_versao_historica(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
begin
  insert into public.versoes (processo_id, numero, observacao, historica)
  values (p_processo, p_numero, p_observacao, true) returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

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
insert into _tap (linha) select plan(52);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000e1', 'VS1', 'Setor Versões');
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
  select jsonb_build_object('papel', papel, 'nome', 'VS1_V1_Processo.' || formato, 'formato', formato,
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
select public.registrar_versao(pg_temp.processo('e2'), 1, null, pg_temp.par());
select public.suspender_processo(pg_temp.processo('e2'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('e3'), 'Não segue');

-- Administrador: grava, lê e as regras.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 1, '  Primeira versão  ', pg_temp.par())$sql$,
  'administrador registra uma versão com .bpmn e .png');
insert into _tap (linha) select is(
  (select numero from public.versoes where processo_id = pg_temp.processo('e1')), 1, 'processo sem versão recebe V1');
insert into _tap (linha) select is(
  (select e.codigo from public.versoes v join public.etapas e on e.id = v.etapa_id where v.processo_id = pg_temp.processo('e1')),
  'modelagem', 'a versão guarda a etapa atual do processo');
insert into _tap (linha) select is(
  (select observacao from public.versoes where processo_id = pg_temp.processo('e1')), 'Primeira versão',
  'a observação é gravada sem espaços nas pontas');
insert into _tap (linha) select is(
  (select enviada_por::text from public.versoes where processo_id = pg_temp.processo('e1')),
  '00000000-0000-0000-0000-0000000000a1', 'quem enviou é quem chamou');
insert into _tap (linha) select is(
  (select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 1)), 2::bigint,
  'a versão tem os dois arquivos');
insert into _tap (linha) select is(
  (select enviado_por::text from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 1) limit 1),
  '00000000-0000-0000-0000-0000000000a1', 'quem enviou o arquivo é quem chamou');

-- O número que vier é ignorado: a inclusão direta com 99 recebe V2 (conferências adiadas cobradas na hora).
insert into _tap (linha) select lives_ok(
  $sql$with nova as (insert into public.versoes (processo_id, numero) values (pg_temp.processo('e1'), 99) returning id)
    insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
    select nova.id, (a ->> 'papel')::public.papel_do_arquivo, a ->> 'nome', a ->> 'formato', (a ->> 'tamanho')::bigint,
      a ->> 'hash_md5', a ->> 'drive_id'
    from nova, jsonb_array_elements(pg_temp.par()) a$sql$,
  'inclusão direta de versão com os arquivos');
insert into _tap (linha) select lives_ok($sql$set constraints all immediate$sql$, 'a inclusão direta passa nas conferências');
set constraints all deferred;
insert into _tap (linha) select is(
  (select max(numero) from public.versoes where processo_id = pg_temp.processo('e1')), 2, 'o número enviado é ignorado: V2');

insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null, jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn')))$sql$,
  'P0001', 'versao_sem_bpmn_e_png', 'versão sem .png é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null, jsonb_build_array(pg_temp.arquivo('png', 'png')))$sql$,
  'P0001', 'versao_sem_bpmn_e_png', 'versão sem .bpmn é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null, pg_temp.par() || pg_temp.arquivo('bpmn', 'bpmn'))$sql$,
  '23505', null, 'segundo arquivo do mesmo papel é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null, pg_temp.par() || pg_temp.arquivo('relatorio', 'png'))$sql$,
  '23514', null, 'relatório .png é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null,
    jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn', 20971521), pg_temp.arquivo('png', 'png')))$sql$,
  '23514', null, 'arquivo de 20 MB + 1 byte é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 7, null, pg_temp.par())$sql$,
  'P0001', 'numero_da_versao_mudou:3', 'número esperado diferente do que o banco dá é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 3, null,
    pg_temp.par() || pg_temp.arquivo('bpm', 'bpm') || pg_temp.arquivo('relatorio', 'pdf'))$sql$,
  'versão com .bpm e relatório é aceita');
insert into _tap (linha) select is(
  (select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 3)), 4::bigint,
  'a V3 tem os quatro arquivos');

insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('e1')), 3::bigint,
  'administrador lê as versões');
insert into _tap (linha) select is(pg_temp.alterar_tamanhos(200), 8::bigint, 'administrador altera o tamanho dos arquivos');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set nome = 'outro.bpmn'$sql$, '42501', null, 'ninguém altera o nome do arquivo');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set drive_id = 'outro'$sql$, '42501', null, 'ninguém altera o drive_id do arquivo');
insert into _tap (linha) select throws_ok(
  $sql$update public.versoes set observacao = 'Outra'$sql$, '42501', null, 'administrador não altera versão');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.versoes$sql$, '42501', null, 'administrador não apaga versão');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.arquivos_da_versao$sql$, '42501', null, 'administrador não apaga arquivo');

-- Processo fora de andamento.
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e2'), 2, null, pg_temp.par())$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'versão em processo suspenso é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e3'), 1, null, pg_temp.par())$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'versão em processo cancelado é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e4'), 1, null, pg_temp.par())$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'versão em processo concluído é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
    values (pg_temp.versao(pg_temp.processo('e2'), 1), 'bpm', 'VS1_V1_P.bpm', 'bpm', 10, '0123456789abcdef0123456789abcdef', 'x')$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'arquivo em versão de processo suspenso é recusado');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('e1')), 3::bigint,
  'integrante lê as versões');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e5'), 1, null, pg_temp.par())$sql$, 'integrante registra uma versão');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e5'), 2, null, pg_temp.par())$sql$, 'integrante registra a segunda');
insert into _tap (linha) select is(pg_temp.alterar_tamanhos(300), 12::bigint, 'integrante altera o tamanho dos arquivos');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.versoes$sql$, '42501', null, 'integrante não apaga versão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.eventos (acao, entidade, entidade_ref) values ('enviar', 'versao', 'x')$sql$, '42501', null,
  'integrante não cria evento');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where id = pg_temp.processo('e5')$sql$, 'P0001', 'processo_com_versoes:2',
  'excluir processo com 2 versões é recusado com a contagem');

-- Consulta.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('e1')), 3::bigint,
  'consulta lê as versões');
insert into _tap (linha) select is(
  (select count(*) from public.arquivos_da_versao where versao_id = pg_temp.versao(pg_temp.processo('e1'), 3)), 4::bigint,
  'consulta lê os arquivos');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 4, null, pg_temp.par())$sql$, '42501', null,
  'consulta não registra versão');
insert into _tap (linha) select is(pg_temp.alterar_tamanhos(400), 0::bigint, 'consulta não altera arquivo');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.arquivos_da_versao$sql$, '42501', null, 'consulta não apaga arquivo');

-- Eventos: um por envio, com o autor e o processo como referência; todo perfil ativo lê.
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar' and entidade_ref = pg_temp.processo('e1')::text),
  3::bigint, 'cada envio gera um evento ligado ao processo, que a consulta lê');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'rotulo' from public.eventos
    where entidade = 'versao' and entidade_ref = pg_temp.processo('e1')::text and autor_id = '00000000-0000-0000-0000-0000000000a1'
    order by id limit 1),
  'V1', 'o evento traz o rótulo da versão e o autor');
insert into _tap (linha) select is(
  (select jsonb_array_length(detalhes -> 'depois' -> 'arquivos') from public.eventos
    where entidade = 'versao' and entidade_ref = pg_temp.processo('e1')::text and detalhes -> 'depois' ->> 'rotulo' = 'V3'),
  4, 'o evento traz os arquivos da versão');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.versoes), 0::bigint, 'inativo não lê versões');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao), 0::bigint, 'inativo não lê arquivos');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao'), 0::bigint,
  'inativo não lê os eventos de versão');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('e1'), 4, null, pg_temp.par())$sql$, '42501', null,
  'inativo não registra versão');
insert into _tap (linha) select is(pg_temp.alterar_tamanhos(500), 0::bigint, 'inativo não altera arquivo');

-- Visitante.
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select count(*) from public.versoes$sql$, '42501', null, 'visitante não lê versões');
insert into _tap (linha) select throws_ok(
  $sql$select count(*) from public.arquivos_da_versao$sql$, '42501', null, 'visitante não lê arquivos');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao('9f000000-0000-0000-0000-0000000000e1', 4, null, '[]'::jsonb)$sql$, '42501', null,
  'visitante não registra versão');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
