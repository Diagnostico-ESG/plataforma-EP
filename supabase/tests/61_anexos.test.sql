-- Anexos (documentos-versoes, ticket 12; ADR 0027): o arquivo avulso do processo, enviado em qualquer etapa com o
-- processo em andamento. Quem pode o quê (ler, criar, alterar, apagar), a situação do processo, as restrições de formato,
-- tamanho e nome, o que o banco preenche (etapa, autor, data), o evento, a exclusão do processo e a coluna da subpasta
-- "Anexos". A retirada (apagar) é do ticket 13 e tem o teste 62.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(42);

-- Isola o teste dos dados que já existem no banco (a prova do Drive deixa versões, arquivos, eventos e pastas de teste
-- no desenvolvimento): a limpeza vale só nesta transação, que é desfeita no fim.
set local session_replication_role = replica;
delete from public.eventos where entidade in ('versao', 'anexo');
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

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Um setor e os processos: Andamento (a que mais recebe anexos, com a versão completa para poder andar), Suspenso,
-- Cancelado, Concluido, Arquivado (os dois com a versão completa), Solto (anexo e nenhuma versão), Livre (nada: a exclusão) e Vazio.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000061', 'T61', 'Setor Anexos');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000061', null, 'Macro Anexos');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000061', 'af000000-0000-0000-0000-000000000061', nome
from unnest(array['Andamento', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado', 'Solto', 'Livre', 'Vazio']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000061' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

-- Um anexo inventado no formato que registrar_anexo recebe (o que a função arquivos-no-drive lê do Drive).
create function pg_temp.anexo(nome text default 'resposta.eml', formato text default 'eml', tamanho bigint default 100,
  drive_id text default 'drive-anexo') returns jsonb
language sql immutable as $$
  select jsonb_build_object('nome', nome, 'formato', formato, 'tamanho', tamanho,
    'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', drive_id) $$;
grant execute on function pg_temp.anexo(text, text, bigint, text) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T61_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;

-- A versão completa (.bpm, .png e relatório numerado) deixa o processo andar até a Validação com o setor.
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.registrar_versao(pg_temp.processo(nome_do_processo), 1,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
  perform public.enviar_relatorio(pg_temp.processo(nome_do_processo), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

create function pg_temp.concluir(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('aprovacao_setor'));
  insert into public.aprovacoes (processo_id) values (pg_temp.processo(nome_do_processo));
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
end $$;
grant execute on function pg_temp.concluir(text) to authenticated;

-- Quantos anexos o processo tem na etapa de código dado.
create function pg_temp.anexos_em(nome_do_processo text, codigo_da_etapa text) returns bigint
language sql stable as $$
  select count(*) from public.anexos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.anexos_em(text, text) to authenticated;

-- Preparação. a1: versão completa dos que andam ou concluem; a2: conclui, arquiva, suspende e cancela.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from unnest(array['Andamento', 'Concluido', 'Arquivado']) as nome;
select pg_temp.claims('a2');
select pg_temp.concluir(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');

-- ===== Administrador cria; o banco preenche etapa, autor e data =====
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo())$sql$,
  'administrador anexa em Não iniciados, com o processo em andamento');
insert into _tap (linha) select is(
  (select count(*) from public.anexos where processo_id = pg_temp.processo('Andamento')), 1::bigint,
  'o anexo fica ligado ao processo');
insert into _tap (linha) select is(
  (select a.etapa_id from public.anexos a where a.processo_id = pg_temp.processo('Andamento')),
  (select etapa_atual_id from public.processos_com_andamento where id = pg_temp.processo('Andamento')),
  'o anexo guarda a etapa atual do processo no envio');
insert into _tap (linha) select is(
  (select enviado_por::text from public.anexos where processo_id = pg_temp.processo('Andamento')),
  '00000000-0000-0000-0000-0000000000a1', 'o autor é quem enviou, preenchido pelo banco');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Andamento'),
    pg_temp.anexo() || jsonb_build_object('etapa_id', pg_temp.etapa('concluidos'), 'enviado_por', gen_random_uuid(), 'drive_id', 'drive-anexo-2'))$sql$,
  'dois anexos com o mesmo nome convivem, e a etapa e o autor enviados são ignorados');
insert into _tap (linha) select is(
  pg_temp.anexos_em('Andamento', 'concluidos'), 0::bigint, 'a etapa enviada pela tela é ignorada: vale a etapa atual');
insert into _tap (linha) select is(
  (select count(*) from public.anexos where processo_id = pg_temp.processo('Andamento') and nome = 'resposta.eml'), 2::bigint,
  'os dois anexos de mesmo nome estão na lista');

-- ===== Integrante: a etapa do anexo fica quando o processo anda =====
select pg_temp.claims('a2');
select public.mover_processo(pg_temp.processo('Andamento'), pg_temp.etapa('modelagem'));
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo('planilha.xlsx', 'xlsx', 2000, 'drive-planilha'))$sql$,
  'integrante anexa na Modelagem piloto');
select public.mover_processo(pg_temp.processo('Andamento'), pg_temp.etapa('aprovacao_setor'));
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo('foto.png', 'png', 3000, 'drive-foto'))$sql$,
  'integrante anexa na Validação com o setor');
insert into _tap (linha) select is(
  (select ARRAY[pg_temp.anexos_em('Andamento', 'modelagem'), pg_temp.anexos_em('Andamento', 'aprovacao_setor')]),
  ARRAY[1::bigint, 1::bigint], 'cada anexo guarda a etapa do envio, que não muda quando o processo anda');
insert into _tap (linha) select is(
  (select count(*) from public.anexos where processo_id = pg_temp.processo('Andamento')
    and etapa_id not in (select id from public.etapas where codigo in ('modelagem', 'aprovacao_setor'))), 2::bigint,
  'os dois primeiros anexos continuam na etapa em que foram enviados');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.anexos (processo_id, nome, formato, tamanho, hash_md5, drive_id)
    values (pg_temp.processo('Vazio'), 'direto.pdf', 'pdf', 10, '0123456789abcdef0123456789abcdef', 'drive-direto')$sql$,
  'a inclusão direta na tabela vale pelos mesmos gatilhos (etapa, autor e data do banco)');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.anexos (processo_id, etapa_id, nome, formato, tamanho, hash_md5, drive_id)
    values (pg_temp.processo('Vazio'), pg_temp.etapa('concluidos'), 'x.pdf', 'pdf', 10, '0123456789abcdef0123456789abcdef', 'drive-x')$sql$,
  '42501', null, 'a etapa não tem privilégio de inclusão: não se escolhe pela API');

-- ===== Situação do processo: só em andamento =====
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Suspenso'), pg_temp.anexo())$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'processo suspenso não recebe anexo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Cancelado'), pg_temp.anexo())$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'processo cancelado não recebe anexo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Concluido'), pg_temp.anexo())$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'processo concluído não recebe anexo');

-- ===== Restrições: formato, tamanho, nome e identificador do Drive =====
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('programa.exe', 'exe'))$sql$,
  '23514', null, '.exe é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('vazio.pdf', 'pdf', 0))$sql$,
  '23514', null, 'arquivo de 0 byte é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('grande.pdf', 'pdf', 20971521))$sql$,
  '23514', null, 'arquivo de 20 MB + 1 byte é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('limite.pdf', 'pdf', 20971520, 'drive-limite'))$sql$,
  'arquivo de exatamente 20 MB é aceito');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo(repeat('a', 297) || '.pdf', 'pdf'))$sql$,
  '23514', null, 'nome com 301 caracteres é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('a.pdf', 'pdf', 100, 'id com espaço!'))$sql$,
  '23514', null, 'identificador do Drive fora do formato é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('a.' || formato, formato, 100, 'drive-' || formato))
    from unnest(array['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'eml']) as formato$sql$,
  'os sete formatos da lista são aceitos');

-- ===== Quem pode o quê =====
select pg_temp.claims('a3');
insert into _tap (linha) select is(
  (select count(*) > 0 from public.anexos), true, 'consulta lê os anexos');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('consulta.pdf', 'pdf', 100, 'drive-consulta'))$sql$,
  '42501', null, 'consulta não anexa');
select pg_temp.claims('a1');
insert into _tap (linha) select is(
  (select count(*) > 0 from public.anexos), true, 'administrador lê os anexos');
insert into _tap (linha) select throws_ok(
  $sql$update public.anexos set nome = 'outro.eml' where processo_id = pg_temp.processo('Andamento')$sql$,
  '42501', null, 'o anexo não se altera (nome), nem pelo administrador');
select pg_temp.claims('a4');
insert into _tap (linha) select is(
  (select count(*) from public.anexos), 0::bigint, 'usuário inativo não lê anexo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(pg_temp.processo('Vazio'), pg_temp.anexo('inativo.pdf', 'pdf', 100, 'drive-inativo'))$sql$,
  '42501', null, 'usuário inativo não anexa');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select count(*) from public.anexos$sql$, '42501', null, 'visitante sem login não lê anexo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_anexo(gen_random_uuid(), '{}'::jsonb)$sql$, '42501', null, 'visitante sem login não anexa');

-- ===== Histórico: um evento por envio, com o nome e a etapa =====
reset role;
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'anexo' and acao = 'enviar'
    and entidade_ref = pg_temp.processo('Andamento')::text), 4::bigint,
  'cada anexo enviado gera um evento ligado ao processo');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'etapa' from public.eventos where entidade = 'anexo'
    and entidade_ref = pg_temp.processo('Andamento')::text and detalhes -> 'depois' ->> 'nome' = 'planilha.xlsx'),
  (select nome from public.etapas where codigo = 'modelagem'), 'o evento traz o nome e a etapa do envio');
insert into _tap (linha) select is(
  (select autor_id::text from public.eventos where entidade = 'anexo'
    and entidade_ref = pg_temp.processo('Andamento')::text and detalhes -> 'depois' ->> 'nome' = 'foto.png'),
  '00000000-0000-0000-0000-0000000000a2', 'o evento traz o autor');
select pg_temp.claims('a3');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'anexo' and entidade_ref = pg_temp.processo('Andamento')::text),
  4::bigint, 'consulta lê os eventos de anexo');

-- ===== Exclusão do processo =====
select pg_temp.claims('a1');
select public.registrar_anexo(pg_temp.processo('Solto'), pg_temp.anexo('solto.eml', 'eml', 100, 'drive-solto'));
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Solto')$sql$,
  'P0001', 'processo_com_anexos:1', 'processo com anexo não se exclui, e a recusa diz quantos há');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Livre')$sql$,
  'processo sem anexo continua excluível');

-- ===== A coluna da subpasta "Anexos" no processo =====
select pg_temp.claims('a2');
select set_config('ep.t61_eventos', (select count(*)::text from public.eventos
  where entidade = 'processo' and entidade_ref = pg_temp.processo('Andamento')::text), true);
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set drive_pasta_dos_anexos = 'pasta-anexos-1' where id = pg_temp.processo('Andamento')$sql$,
  'o integrante grava o identificador da subpasta Anexos');
insert into _tap (linha) select is(
  (select drive_pasta_dos_anexos from public.processos where id = pg_temp.processo('Andamento')), 'pasta-anexos-1',
  'o identificador fica guardado no processo');
insert into _tap (linha) select is(
  (select count(*)::text from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Andamento')::text),
  current_setting('ep.t61_eventos'), 'gravar a subpasta não vira evento do processo');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set drive_pasta_dos_anexos = 'pasta com espaço!' where id = pg_temp.processo('Andamento')$sql$,
  '23514', null, 'identificador da subpasta fora do formato é recusado');
select pg_temp.claims('a3');
update public.processos set drive_pasta_dos_anexos = 'pasta-da-consulta' where id = pg_temp.processo('Andamento');
insert into _tap (linha) select is(
  (select drive_pasta_dos_anexos from public.processos where id = pg_temp.processo('Andamento')), 'pasta-anexos-1',
  'consulta não grava a subpasta (a política de alterar não deixa nenhuma linha)');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
