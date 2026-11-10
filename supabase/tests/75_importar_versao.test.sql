-- Importação dos dados atuais, ticket 02: importar_versao grava a versão da pasta com o número do nome do arquivo, só para o
-- Administrador ativo, sem as travas de etapa do envio (ADR 0025 e 0028), mantendo o número único por processo e o .bpm
-- obrigatório; pula a versão que já existe. importar_anexo leva o .pdf do relatório aos anexos, e anotar_subpasta_da_importacao
-- acrescenta a linha da subpasta às Anotações, sem repetir. A marca da importação não vaza para o envio comum. Só dados inventados.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(40);

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

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'IMP_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel || '-' || formato) $$;
create function pg_temp.bpm() returns jsonb language sql immutable as $$ select pg_temp.arquivo('bpm', 'bpm') $$;
create function pg_temp.relatorio() returns jsonb language sql immutable as $$ select pg_temp.arquivo('relatorio', 'docx') $$;
create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select p.id from public.processos p join public.setores s on s.id = p.setor_id where s.sigla = 'IMP' and p.nome = nome_do_processo $$;
create function pg_temp.versao(nome_do_processo text, numero_da_versao integer) returns public.versoes
language sql stable as $$ select * from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and numero = numero_da_versao $$;
create function pg_temp.pdf() returns jsonb
language sql immutable as $$
  select jsonb_build_object('nome', 'IMP_V2_Processo_Relatório.pdf', 'formato', 'pdf', 'tamanho', 100,
    'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-anexo-pdf') $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.bpm(), pg_temp.relatorio(), pg_temp.processo(text),
  pg_temp.versao(text, integer), pg_temp.pdf() to authenticated;

-- Processos em várias etapas, criados pela importação da planilha (ticket 01).
set local role authenticated;
select pg_temp.claims('a1');
select public.importar_processo('IMP', 'A definir', 'Em Revisão', 'revisao_interna', null, date '2026-09-01', null);
select public.importar_processo('IMP', 'A definir', 'Em Aprovação', 'aprovacao_setor', null, date '2026-09-01', null);
select public.importar_processo('IMP', 'A definir', 'Concluído', 'concluidos', date '2026-10-16', date '2026-09-01', 'Texto antigo');

-- ===== O administrador importa as versões, fora das etapas do envio comum =====
insert into _tap (linha) select is(
  public.importar_versao(pg_temp.processo('Em Revisão'), 2, 'sequencia', jsonb_build_array(pg_temp.bpm(), pg_temp.relatorio()), 1),
  'criada', 'a V2 em sequência entra na Revisão interna');
insert into _tap (linha) select is((pg_temp.versao('Em Revisão', 2)).numero, 2, 'com o número do nome do arquivo, não o maior + 1');
insert into _tap (linha) select is((pg_temp.versao('Em Revisão', 2)).etapa_id,
  (select id from public.etapas where codigo = 'revisao_interna'), 'marcada com a etapa do processo no momento');
insert into _tap (linha) select is((select numero_do_relatorio from public.arquivos_da_versao
  where versao_id = (pg_temp.versao('Em Revisão', 2)).id and papel = 'relatorio'), 1, 'o relatório recebe o número pedido');
insert into _tap (linha) select ok(not (pg_temp.versao('Em Revisão', 2)).historica and not (pg_temp.versao('Em Revisão', 2)).piloto,
  'nem histórica nem piloto');

insert into _tap (linha) select is(
  public.importar_versao(pg_temp.processo('Em Aprovação'), 1, 'historica', jsonb_build_array(pg_temp.bpm())),
  'criada', 'a V1F histórica entra fora de Não iniciados');
insert into _tap (linha) select ok((pg_temp.versao('Em Aprovação', 1)).historica, 'como histórica');
insert into _tap (linha) select is((pg_temp.versao('Em Aprovação', 1)).etapa_id, null::uuid, 'sem etapa, como toda histórica');

insert into _tap (linha) select is(
  public.importar_versao(pg_temp.processo('Em Revisão'), 1, 'piloto', jsonb_build_array(pg_temp.bpm())),
  'criada', 'a V1P piloto entra depois de uma em sequência e com número menor');
insert into _tap (linha) select ok((pg_temp.versao('Em Revisão', 1)).piloto, 'como piloto');

insert into _tap (linha) select is(
  public.importar_versao(pg_temp.processo('Concluído'), 3, 'sequencia', jsonb_build_array(pg_temp.bpm(), pg_temp.arquivo('png', 'png'))),
  'criada', 'o processo em Concluídos também recebe a versão');

insert into _tap (linha) select is(
  public.importar_versao(pg_temp.processo('Em Revisão'), 2, 'sequencia', jsonb_build_array(pg_temp.bpm())),
  'ja_existia', 'a versão que já existe é pulada');
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('Em Revisão')), 2::bigint,
  'sem versão nova');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao where versao_id = (pg_temp.versao('Em Revisão', 2)).id),
  2::bigint, 'e sem arquivo trocado nem acrescentado');

insert into _tap (linha) select throws_ok(
  $$ select public.importar_versao(pg_temp.processo('Em Revisão'), 5, 'sequencia', jsonb_build_array(pg_temp.arquivo('png', 'png'))) $$,
  'P0001', 'versao_sem_bpm', 'a versão sem .bpm é recusada');
insert into _tap (linha) select throws_ok(
  $$ select public.importar_versao(pg_temp.processo('Em Revisão'), 6, 'historica', jsonb_build_array(pg_temp.relatorio())) $$,
  'P0001', 'historica_sem_arquivo_de_fluxograma', 'a histórica sem fluxograma é recusada');
insert into _tap (linha) select throws_ok(
  $$ select public.importar_versao(pg_temp.processo('Em Revisão'), 7, 'sequencia', jsonb_build_array(pg_temp.bpm(), pg_temp.relatorio()), 9) $$,
  'P0001', 'numero_do_relatorio_mudou:2', 'o número do relatório diferente do que o banco dá é recusado');
insert into _tap (linha) select is((select count(*) from public.versoes where processo_id = pg_temp.processo('Em Revisão')), 2::bigint,
  'as recusas não deixam versão');

insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'importar'
  and entidade_ref = pg_temp.processo('Em Revisão')::text), 2::bigint, 'um evento "importar" por versão importada');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'importar'
  and entidade_ref = pg_temp.processo('Em Revisão')::text and autor_id <> '00000000-0000-0000-0000-0000000000a1'), 0::bigint,
  'com quem importou');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao'
  and acao in ('enviar', 'enviar_piloto', 'registrar_historica')), 0::bigint, 'e nenhum evento de envio comum');

-- A marca não vaza: o envio comum, na mesma transação, continua com as travas.
insert into _tap (linha) select throws_ok(
  $$ select public.registrar_versao_historica(pg_temp.processo('Em Aprovação'), 9, jsonb_build_array(pg_temp.bpm())) $$,
  'P0001', 'historica_fora_de_nao_iniciados', 'depois da importação, a histórica comum fora de Não iniciados segue recusada');
insert into _tap (linha) select throws_ok(
  $$ select public.registrar_anexo(pg_temp.processo('Concluído'), pg_temp.pdf()) $$,
  'P0001', 'processo_fora_de_andamento:concluido', 'e o anexo comum em processo concluído também');

-- ===== O .pdf do relatório e a subpasta =====
insert into _tap (linha) select is(public.importar_anexo(pg_temp.processo('Concluído'), pg_temp.pdf()), 'criado',
  'o .pdf do relatório entra nos anexos do processo concluído');
insert into _tap (linha) select is(public.importar_anexo(pg_temp.processo('Concluído'), pg_temp.pdf()), 'ja_existia',
  'o mesmo .pdf de novo é pulado');
insert into _tap (linha) select is((select count(*) from public.anexos where processo_id = pg_temp.processo('Concluído')), 1::bigint,
  'um anexo só');

select public.anotar_subpasta_da_importacao(pg_temp.processo('Concluído'), 'Grupo X');
select public.anotar_subpasta_da_importacao(pg_temp.processo('Concluído'), 'Grupo X');
insert into _tap (linha) select is((select anotacoes from public.processos where id = pg_temp.processo('Concluído')),
  E'Texto antigo\nArquivos da subpasta Grupo X.', 'a linha da subpasta vai para o fim das Anotações, uma vez só');
select public.anotar_subpasta_da_importacao(pg_temp.processo('Em Revisão'), 'Grupo Y');
insert into _tap (linha) select is((select anotacoes from public.processos where id = pg_temp.processo('Em Revisão')),
  'Arquivos da subpasta Grupo Y.', 'sem Anotações, a linha é o texto todo');

-- ===== Os outros perfis, o desativado e o visitante =====
create function pg_temp.recusas(usuario text) returns setof text language plpgsql as $$
begin
  perform pg_temp.claims(usuario);
  return next throws_ok(format($q$ select public.importar_versao(%L, 8, 'sequencia', %L) $q$,
    pg_temp.processo('Em Revisão'), jsonb_build_array(pg_temp.bpm())), '42501', null, usuario || ' não importa versão');
  return next throws_ok(format($q$ select public.importar_anexo(%L, %L) $q$, pg_temp.processo('Concluído'), pg_temp.pdf()),
    '42501', null, usuario || ' não importa anexo');
  return next throws_ok(format($q$ select public.anotar_subpasta_da_importacao(%L, 'Grupo Z') $q$, pg_temp.processo('Concluído')),
    '42501', null, usuario || ' não anota a subpasta');
end $$;
grant execute on function pg_temp.recusas(text) to authenticated;
insert into _tap (linha) select pg_temp.recusas('a2');
insert into _tap (linha) select pg_temp.recusas('a3');
insert into _tap (linha) select pg_temp.recusas('a4');

reset role;
create temp table _alvos as select pg_temp.processo('Concluído') as processo;
grant select on _alvos to anon;
set local role anon;
insert into _tap (linha) select throws_ok(
  $$ select public.importar_versao((select processo from _alvos), 8, 'sequencia', '[]'::jsonb) $$, '42501', null,
  'o visitante não importa versão');
insert into _tap (linha) select throws_ok($$ select public.importar_anexo((select processo from _alvos), '{}'::jsonb) $$, '42501', null,
  'nem anexo');
insert into _tap (linha) select throws_ok($$ select public.anotar_subpasta_da_importacao((select processo from _alvos), 'Z') $$,
  '42501', null, 'nem anota a subpasta');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
