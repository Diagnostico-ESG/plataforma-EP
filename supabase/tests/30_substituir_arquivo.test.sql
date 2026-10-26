-- Substituir arquivo (documentos-versoes, ticket 06): o arquivo novo, do mesmo papel e formato, troca só o conteúdo
-- (tamanho, hash, autor e data) no mesmo registro do arquivo, sem versão nova; a histórica é somente leitura; o processo
-- precisa estar em andamento; um evento por troca, com o nome e o hash do que saiu; e quem pode. Complementa o 27 a 29.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(25);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000f1', 'SB1', 'Setor Substituição');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000f1', null, 'Macro Substituição');
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000f1', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Substituicao'),
  ('9f000000-0000-0000-0000-0000000000f2', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Parado S'),
  ('9f000000-0000-0000-0000-0000000000f3', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Cancelado S'),
  ('9f000000-0000-0000-0000-0000000000f4', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Concluido S'),
  ('9f000000-0000-0000-0000-0000000000f5', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Historico S'),
  ('9f000000-0000-0000-0000-0000000000f6', '5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo Perfis S');

-- Um arquivo inventado no formato que registrar_versao recebe; o nome é o padrão da versão.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'SB1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
create function pg_temp.relatorio() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('relatorio', 'pdf')) $$;
-- O que a função do servidor entrega à substituição: o que o Drive informou do arquivo novo.
create function pg_temp.novo(formato text, hash text default 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb') returns jsonb
language sql immutable as $$
  select jsonb_build_object('formato', formato, 'tamanho', 555, 'hash_md5', hash) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.arquivo_da(processo uuid, numero_da_versao integer, qual public.papel_do_arquivo) returns uuid
language sql stable as $$
  select a.id from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id
  where v.processo_id = processo and v.numero = numero_da_versao and a.papel = qual $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.par(), pg_temp.relatorio(), pg_temp.novo(text, text),
  pg_temp.processo(text), pg_temp.arquivo_da(uuid, integer, public.papel_do_arquivo) to authenticated;

-- Versões, como administrador (os processos ainda estão em andamento): V1 com .bpm, .png, .bpmn e relatório em cada um;
-- em f5, a histórica V1F com o mesmo conteúdo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select public.registrar_versao(pg_temp.processo(sufixo), 1, null, pg_temp.par() || pg_temp.arquivo('bpmn', 'bpmn') || pg_temp.relatorio())
  from (values ('f1'), ('f2'), ('f3'), ('f4'), ('f6')) as processos (sufixo);
select public.registrar_versao_historica(pg_temp.processo('f5'), 1, pg_temp.par() || pg_temp.arquivo('bpmn', 'bpmn') || pg_temp.relatorio());

-- Administrador, no processo f1.
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png'), pg_temp.novo('png'))$sql$,
  'administrador substitui o .png da V1');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao
    where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png') and tamanho = 555
      and hash_md5 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' and nome = 'SB1_V1_Processo.png' and drive_id = 'drive-png'
      and enviado_por = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o arquivo troca tamanho e hash e continua com o mesmo nome e o mesmo identificador do Drive');
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'relatorio'), pg_temp.novo('pdf', 'cccccccccccccccccccccccccccccccc'))$sql$,
  'administrador substitui o relatório da V1');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao v
    where v.versao_id in (select id from public.versoes where processo_id = pg_temp.processo('f1'))), 4::bigint,
  'a substituição não cria arquivo: a V1 continua com os quatro');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'P0001', 'tipo_de_arquivo_diferente:pdf', 'o relatório .pdf não é trocado por um .docx');

-- Histórica: somente leitura.
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f5'), 1, 'bpmn'), pg_temp.novo('bpmn'))$sql$,
  'P0001', 'versao_historica_somente_leitura', 'arquivo de versão histórica não se substitui');

-- Processo fora de andamento (as versões foram criadas antes de a situação mudar; a mudança vem agora, como integrante).
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select public.mover_processo(pg_temp.processo('f4'), (select id from public.etapas where codigo = 'concluidos'),
  null, null, 'Não será publicado');
select public.suspender_processo(pg_temp.processo('f2'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('f3'), 'Não segue');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f2'), 1, 'png'), pg_temp.novo('png'))$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'arquivo de processo suspenso não se substitui');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f3'), 1, 'png'), pg_temp.novo('png'))$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'arquivo de processo cancelado não se substitui');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f4'), 1, 'png'), pg_temp.novo('png'))$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'arquivo de processo concluído não se substitui');

-- Só o conteúdo muda: nome, papel, drive_id e versão ficam; nada se apaga; o hash tem o formato certo.
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set nome = 'outro.png' where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png')$sql$,
  '42501', null, 'alterar o nome do arquivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set papel = 'bpm' where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png')$sql$,
  '42501', null, 'alterar o papel do arquivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set drive_id = 'outro' where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png')$sql$,
  '42501', null, 'alterar o identificador do Drive é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set versao_id = null where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png')$sql$,
  '42501', null, 'mudar o arquivo de versão é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.arquivos_da_versao where id = pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png')$sql$,
  '42501', null, 'apagar o arquivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f1'), 1, 'png'), pg_temp.novo('png', 'zz'))$sql$,
  '23514', null, 'o hash precisa ter 32 caracteres hexadecimais');

-- Eventos: um por troca, com o nome e o hash do que saiu no "antes".
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'substituir'
    and entidade_ref = pg_temp.processo('f1')::text), 2::bigint, 'cada troca gera um evento ligado ao processo');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'substituir'
    and detalhes -> 'antes' ->> 'nome' = 'SB1_V1_Processo.png'
    and detalhes -> 'antes' ->> 'hash_md5' = '0123456789abcdef0123456789abcdef'
    and detalhes -> 'depois' ->> 'hash_md5' = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    and detalhes -> 'depois' ->> 'rotulo' = 'V1' and detalhes -> 'depois' ->> 'processo_nome' = 'Processo Substituicao'
    and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o evento traz o nome e o hash do que saiu, o hash novo, a versão e o autor');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f6'), 1, 'png'), pg_temp.novo('png'))$sql$,
  'integrante substitui um arquivo');
insert into _tap (linha) select is((select enviado_por from public.arquivos_da_versao
    where id = pg_temp.arquivo_da(pg_temp.processo('f6'), 1, 'png')), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'o arquivo passa a ser de quem trocou');

-- Consulta.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f6'), 1, 'bpmn'), pg_temp.novo('bpmn'))$sql$,
  '42501', null, 'consulta não substitui arquivo');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao
    where id = pg_temp.arquivo_da(pg_temp.processo('f6'), 1, 'bpmn') and tamanho = 100), 1::bigint,
  'o arquivo recusado à consulta continua como estava');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'substituir'),
  3::bigint, 'consulta lê os eventos de substituição');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da(pg_temp.processo('f6'), 1, 'bpmn'), pg_temp.novo('bpmn'))$sql$,
  '42501', null, 'inativo não substitui arquivo');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'substituir'),
  0::bigint, 'inativo não lê os eventos de substituição');

-- Visitante.
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo('00000000-0000-0000-0000-000000000001', '{}'::jsonb)$sql$, '42501', null,
  'visitante não substitui arquivo');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
