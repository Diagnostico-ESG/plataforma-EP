-- Editar número da versão (travas-em-avisos, ticket 03; ADR 0028): Administrador e Integrante ativos trocam o número de qualquer
-- versão (histórica, piloto, em sequência, a aprovada), só com o processo em andamento e não arquivado. Muda só o número, nunca o
-- tipo; o nome guardado dos arquivos da versão (fluxogramas, relatórios ligados a ela e o .pdf da aprovação) acompanha o rótulo; um
-- evento por edição, com o antes e o depois. Consulta, inativo e visitante não editam. O número só muda pela função: a escrita
-- direta em versoes.numero e nos nomes é recusada.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(53);

-- Isola o teste dos dados que já existem no banco: a limpeza vale só nesta transação, que é desfeita no fim.
set local session_replication_role = replica;
delete from public.eventos where entidade in ('versao', 'aprovacao');
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

-- Um setor e os processos: Andamento (histórica, piloto e em sequência, cada uma com seus arquivos), Aprovado (a versão aprovada
-- com o .pdf), Suspenso, Cancelado, Concluido e Arquivado (cada um com uma versão enviada enquanto andava).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000065', 'T65', 'Setor Renumerar');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000065', null, 'Macro Renumerar');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000065', 'af000000-0000-0000-0000-000000000065', nome
from unnest(array['Andamento', 'Aprovado', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000065' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

-- Um arquivo no formato que as funções de registro recebem (o que a função arquivos-no-drive lê do Drive).
create function pg_temp.arquivo(papel text, formato text, nome text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', nome, 'formato', formato, 'tamanho', 100,
    'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'd' || md5(nome)) $$;
grant execute on function pg_temp.arquivo(text, text, text) to authenticated;

-- A versão completa de número 1 (.bpm, .png e relatório numerado) deixa o processo andar até a Validação com o setor.
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.registrar_versao(pg_temp.processo(nome_do_processo), 1, jsonb_build_array(
    pg_temp.arquivo('bpm', 'bpm', 'T65_V1_' || nome_do_processo || '.bpm'),
    pg_temp.arquivo('png', 'png', 'T65_V1_' || nome_do_processo || '.png')));
  perform public.enviar_relatorio(pg_temp.processo(nome_do_processo), 1, 1,
    pg_temp.arquivo('relatorio', 'docx', 'T65_V1_' || nome_do_processo || '_Relatório V1.docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- O id da versão de número dado; os rótulos do processo em ordem; os nomes dos arquivos de uma versão; os eventos de edição.
create function pg_temp.versao(nome_do_processo text, numero_da_versao integer) returns uuid
language sql stable as $$
  select id from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and numero = numero_da_versao $$;
grant execute on function pg_temp.versao(text, integer) to authenticated;

create function pg_temp.rotulos(nome_do_processo text) returns text
language sql stable as $$
  select string_agg('V' || numero || case when historica then 'F' when piloto then 'P' else '' end, ',' order by numero)
  from public.versoes where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.rotulos(text) to authenticated;

create function pg_temp.nomes(nome_do_processo text, numero_da_versao integer) returns text
language sql stable as $$
  select string_agg(nome, '|' order by nome collate "C") from public.arquivos_da_versao where versao_id = pg_temp.versao(nome_do_processo, numero_da_versao) $$;
grant execute on function pg_temp.nomes(text, integer) to authenticated;

create function pg_temp.edicoes(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos
  where entidade = 'versao' and acao = 'alterar_numero' and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.edicoes(text) to authenticated;

-- Preparação. a1 envia as versões. Andamento: histórica V3F, piloto V4P (com o Relatório V1) e em sequência V5 (com o Relatório V2).
set local role authenticated;
select pg_temp.claims('a1');
select public.registrar_versao_historica(pg_temp.processo('Andamento'), 3,
  jsonb_build_array(pg_temp.arquivo('bpm', 'bpm', 'T65_V3F_Andamento.bpm')));
select public.registrar_versao(pg_temp.processo('Andamento'), 4,
  jsonb_build_array(pg_temp.arquivo('bpm', 'bpm', 'T65_V4P_Andamento.bpm')), true);
select public.enviar_relatorio(pg_temp.processo('Andamento'), 4, 1,
  pg_temp.arquivo('relatorio', 'docx', 'T65_V4P_Andamento_Relatório V1.docx'));
select public.registrar_versao(pg_temp.processo('Andamento'), 5, jsonb_build_array(
  pg_temp.arquivo('bpm', 'bpm', 'T65_V5_Andamento.bpm'), pg_temp.arquivo('png', 'png', 'T65_V5_Andamento.png')));
select public.enviar_relatorio(pg_temp.processo('Andamento'), 5, 2,
  pg_temp.arquivo('relatorio', 'docx', 'T65_V5_Andamento_Relatório V2.docx'));
select pg_temp.enviar_completa(nome) from unnest(array['Aprovado', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado']) as nome;
-- Aprovado: aprovada na Aprovação pelo setor, com o .pdf protocolado.
select public.mover_processo(pg_temp.processo('Aprovado'), pg_temp.etapa('aprovacao_setor'));
select public.registrar_aprovacao(pg_temp.processo('Aprovado'), null, null, null);
select public.registrar_pdf_da_aprovacao(pg_temp.processo('Aprovado'),
  pg_temp.arquivo('pdf_da_aprovacao', 'pdf', 'T65_V1_Aprovado_Aprovação.pdf'));
-- Concluido e Arquivado chegam a Concluídos; Suspenso e Cancelado param.
select public.mover_processo(pg_temp.processo(nome), pg_temp.etapa('aprovacao_setor')) from unnest(array['Concluido', 'Arquivado']) as nome;
select pg_temp.claims('a2');
insert into public.aprovacoes (processo_id) select pg_temp.processo(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select public.mover_processo(pg_temp.processo(nome), pg_temp.etapa('concluidos'), null, null, 'Não será publicado')
from unnest(array['Concluido', 'Arquivado']) as nome;
select public.arquivar_processo(pg_temp.processo('Arquivado'));
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');
select set_config('ep.t65_enviado_em', (select enviado_em::text from public.arquivos_da_versao
  where nome = 'T65_V5_Andamento.bpm'), true);

insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V3F,V4P,V5', 'preparação: histórica, piloto e em sequência');

-- ===== A função existe, sem security definer =====
insert into _tap (linha) select has_function('public', 'editar_numero_da_versao', array['uuid', 'integer', 'integer'],
  'existe editar_numero_da_versao(uuid, integer, integer)');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'editar_numero_da_versao' and pronamespace = 'public'::regnamespace), false,
  'a função não é security definer: a RLS decide');

-- ===== Quem pode: Consulta, inativo e visitante não editam =====
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 6)$sql$, '42501', null, 'consulta não edita o número');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 6)$sql$, '42501', null, 'usuário inativo não edita o número');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao('00000000-0000-0000-0000-000000000000', 5, 6)$sql$, '42501', null,
  'visitante sem login não edita o número');
reset role;
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao('00000000-0000-0000-0000-000000000000', 5, 6)$sql$, '42501', null,
  'versão que não existe é falta de permissão, como no download');
insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V3F,V4P,V5', 'nenhuma tentativa recusada mudou um número');

-- ===== Situação do processo: suspenso, cancelado, concluído e arquivado não editam =====
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Suspenso', 1), 1, 2)$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'processo suspenso não edita o número');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Cancelado', 1), 1, 2)$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'processo cancelado não edita o número');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Concluido', 1), 1, 2)$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'processo concluído não edita o número');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Arquivado', 1), 1, 2)$sql$,
  'P0001', 'processo_arquivado', 'processo arquivado não edita o número');
insert into _tap (linha) select is(
  pg_temp.rotulos('Suspenso') || pg_temp.rotulos('Cancelado') || pg_temp.rotulos('Concluido') || pg_temp.rotulos('Arquivado'),
  'V1V1V1V1', 'os números dos processos parados continuam V1');

-- ===== Entrada: número inválido, igual ao atual, esperado que mudou e número de outra versão =====
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 0)$sql$,
  'P0001', 'numero_invalido:0', 'zero não é número de versão');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, -2)$sql$,
  'P0001', 'numero_invalido:-2', 'número negativo não vale');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 5)$sql$,
  'P0001', 'numero_invalido:5', 'o mesmo número do atual não vale');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 4, 6)$sql$,
  'P0001', 'numero_da_versao_alterado:5', 'número esperado errado (outra pessoa editou) é recusado, com o atual');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 3)$sql$,
  'P0001', 'numero_ja_usado:V3F', 'número da histórica V3F, já usado por outra versão, é recusado com o rótulo dela');
insert into _tap (linha) select throws_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 3), 3, 4)$sql$,
  'P0001', 'numero_ja_usado:V4P', 'número da piloto V4P, já usado, é recusado também para a histórica');
insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V3F,V4P,V5', 'nenhuma recusa mudou um número');
insert into _tap (linha) select is(pg_temp.edicoes('Andamento'), 0::bigint, 'nenhuma recusa deixou evento');

-- ===== Integrante edita a em sequência (V5 vira V7): arquivos acompanham, o tipo fica, um evento =====
insert into _tap (linha) select lives_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 5), 5, 7)$sql$, 'integrante edita o número da versão em sequência');
insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V3F,V4P,V7', 'a V5 virou V7');
insert into _tap (linha) select is(
  (select historica or piloto from public.versoes where id = pg_temp.versao('Andamento', 7)), false, 'o tipo não muda: continua em sequência');
insert into _tap (linha) select is(pg_temp.nomes('Andamento', 7),
  'T65_V7_Andamento.bpm|T65_V7_Andamento.png|T65_V7_Andamento_Relatório V2.docx',
  'o nome guardado do .bpm, do .png e do relatório ligado acompanha o rótulo; o Relatório V2 continua V2');
insert into _tap (linha) select is(pg_temp.nomes('Andamento', 4), 'T65_V4P_Andamento.bpm|T65_V4P_Andamento_Relatório V1.docx',
  'o relatório ligado a outra versão não muda');
insert into _tap (linha) select is(pg_temp.edicoes('Andamento'), 1::bigint, 'a edição gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'rotulo' || '>' || (detalhes -> 'depois' ->> 'rotulo') from public.eventos
    where entidade = 'versao' and acao = 'alterar_numero' and entidade_ref = pg_temp.processo('Andamento')::text),
  'V5>V7', 'o evento guarda o rótulo de antes e o de depois');
insert into _tap (linha) select is(
  (select autor_id::text from public.eventos where entidade = 'versao' and acao = 'alterar_numero'
    and entidade_ref = pg_temp.processo('Andamento')::text), '00000000-0000-0000-0000-0000000000a2', 'o evento traz quem editou');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'versao' and acao = 'substituir'
    and entidade_ref = pg_temp.processo('Andamento')::text), 0::bigint, 'trocar o nome não vira evento de substituição');
insert into _tap (linha) select is(
  (select enviado_em::text || enviado_por::text from public.arquivos_da_versao where nome = 'T65_V7_Andamento.bpm'),
  current_setting('ep.t65_enviado_em') || '00000000-0000-0000-0000-0000000000a1',
  'quem enviou o arquivo e quando continuam os mesmos');

-- ===== Administrador edita a histórica (V3F vira V2F), mesmo ela sendo somente leitura para arquivos =====
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 3), 3, 2)$sql$, 'administrador edita o número da histórica');
insert into _tap (linha) select is(pg_temp.nomes('Andamento', 2), 'T65_V2F_Andamento.bpm', 'o nome da histórica leva a letra F e o número novo');
insert into _tap (linha) select is(
  (select historica from public.versoes where id = pg_temp.versao('Andamento', 2)), true, 'a histórica continua histórica');

-- ===== Piloto vira V9P e passa a ser a versão mais recente; a próxima em sequência segue o maior número =====
insert into _tap (linha) select lives_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Andamento', 4), 4, 9)$sql$, 'edita o número da piloto');
insert into _tap (linha) select is(pg_temp.nomes('Andamento', 9), 'T65_V9P_Andamento.bpm|T65_V9P_Andamento_Relatório V1.docx',
  'a piloto e o relatório ligado a ela levam V9P');
insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V2F,V7,V9P', 'a ordem passa a ser pelo número novo');
insert into _tap (linha) select is(
  (select ultima_versao_numero from public.processos_com_andamento where id = pg_temp.processo('Andamento')), 9,
  'a versão mais recente é a de maior número');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_versao(pg_temp.processo('Andamento'), 10,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm', 'T65_V10_Andamento.bpm')))$sql$,
  'a próxima versão em sequência é o maior número + 1');
insert into _tap (linha) select is(pg_temp.edicoes('Andamento'), 3::bigint, 'um evento por edição');

-- ===== A versão aprovada aceita o número novo e continua sem substituição de arquivo =====
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$select public.editar_numero_da_versao(pg_temp.versao('Aprovado', 1), 1, 3)$sql$, 'a versão aprovada aceita o número novo');
insert into _tap (linha) select is(pg_temp.nomes('Aprovado', 3),
  'T65_V3_Aprovado.bpm|T65_V3_Aprovado.png|T65_V3_Aprovado_Relatório V1.docx', 'os arquivos da aprovada levam o número novo');
insert into _tap (linha) select is(
  (select p.nome from public.pdfs_da_aprovacao p join public.aprovacoes a on a.id = p.aprovacao_id
    where a.processo_id = pg_temp.processo('Aprovado') and p.guardado_em is null), 'T65_V3_Aprovado_Aprovação.pdf',
  'o nome do .pdf da aprovação acompanha');
insert into _tap (linha) select is(
  (select p.enviado_por::text from public.pdfs_da_aprovacao p join public.aprovacoes a on a.id = p.aprovacao_id
    where a.processo_id = pg_temp.processo('Aprovado') and p.guardado_em is null), '00000000-0000-0000-0000-0000000000a1',
  'quem enviou o .pdf continua o mesmo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'aprovacao' and acao in ('substituir_pdf', 'enviar_pdf')
    and entidade_ref = pg_temp.processo('Aprovado')::text), 1::bigint, 'o .pdf não ganha evento de substituição: só o de quando foi enviado');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo((select id from public.arquivos_da_versao where nome = 'T65_V3_Aprovado.bpm'),
    pg_temp.arquivo('bpm', 'bpm', 'x'))$sql$, 'P0001', 'versao_aprovada:3', 'a versão aprovada continua sem substituição de arquivo');

-- ===== O número e o nome só mudam pela função =====
insert into _tap (linha) select throws_ok(
  $sql$update public.versoes set numero = 50 where id = pg_temp.versao('Andamento', 7)$sql$,
  '42501', 'numero_so_pela_funcao', 'a escrita direta no número é recusada');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set nome = 'outro.bpm' where nome = 'T65_V7_Andamento.bpm'$sql$,
  '42501', 'nome_so_pela_funcao', 'a escrita direta no nome do arquivo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$update public.pdfs_da_aprovacao set nome = 'outro.pdf' where nome = 'T65_V3_Aprovado_Aprovação.pdf'$sql$,
  '42501', 'nome_so_pela_funcao', 'a escrita direta no nome do .pdf é recusada');
insert into _tap (linha) select throws_ok(
  $sql$update public.versoes set historica = true where id = pg_temp.versao('Andamento', 7)$sql$,
  '42501', null, 'o tipo da versão não se escreve: sem privilégio');
select pg_temp.claims('a3');
insert into _tap (linha) select lives_ok(
  $sql$update public.versoes set numero = 50 where id = pg_temp.versao('Andamento', 7)$sql$,
  'consulta não vê a linha para alterar: não dá erro e nada muda');
insert into _tap (linha) select is(pg_temp.rotulos('Andamento'), 'V2F,V7,V9P,V10', 'e os números continuam os da edição');

-- ===== Quem lê o evento =====
insert into _tap (linha) select is(
  (select count(*) > 0 from public.eventos where entidade = 'versao' and acao = 'alterar_numero'), true, 'consulta lê os eventos de edição');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
