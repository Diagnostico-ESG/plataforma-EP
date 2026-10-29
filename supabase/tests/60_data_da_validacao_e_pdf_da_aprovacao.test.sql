-- Data da validação e .pdf da aprovação (revisoes-aprovacao, ticket 06; ADRs 0007, 0011 e 0023): a data da validação só se
-- grava pela função, com o processo na Validação com o setor e em andamento, nunca no futuro, e se apaga (vira vazia); o
-- .pdf protocolado é de uma aprovação que existe, um atual por aprovação, com a versão aprovada no nome, com a regra do
-- editar a aprovação (em andamento ou concluído); a aprovação nova guarda o .pdf da anterior; o .pdf só tem
-- o conteúdo substituído e nada se apaga; toda mudança vira evento. Cada célula da tabela "quem pode o quê" da spec.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(72);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela.
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

-- Um setor, um macroprocesso e os processos; o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000060', 'T60', 'Setor Validacao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000060', null, 'Macro Validacao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000060', 'af000000-0000-0000-0000-000000000060', nome
from unnest(array['Val', 'Val Futuro', 'Val Parado', 'Arquivado', 'Aprov', 'Sem Etapa', 'Val Perfis',
  'Pdf', 'Pdf Sem', 'Pdf Segunda', 'Pdf Edita', 'Pdf Conc', 'Pdf Parado', 'Pdf Cancelado', 'Pdf Arq', 'Pdf Perfis']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000060', 'af000000-0000-0000-0000-000000000060', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000060', 'af000000-0000-0000-0000-000000000060', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000060';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000060' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$
  select pg_temp.mover_sem_trava(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.concluir(nome_do_processo text) returns void
language sql as $$
  select pg_temp.mover_sem_trava(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = 'concluidos'),
    null, null, 'Sem divulgação') $$;
grant execute on function pg_temp.concluir(text) to authenticated;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpm + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T60_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png'))) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Um processo na Aprovação pelo setor com a versão 1 aprovada, como a tela deixa.
create function pg_temp.aprovado(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.enviar(nome_do_processo);
  perform pg_temp.mover(nome_do_processo, 'aprovacao_setor');
  perform public.registrar_aprovacao(pg_temp.processo(nome_do_processo), null, null, null);
end $$;
grant execute on function pg_temp.aprovado(text) to authenticated;

-- O .pdf como a função do servidor o entrega ao banco: nome padrão com a versão aprovada, tamanho e MD5 lidos do Drive.
create function pg_temp.pdf(nome text default 'T60_V1_Pdf_Aprovação.pdf', drive text default 'drive-pdf', tamanho bigint default 100)
returns jsonb language sql immutable as $$
  select jsonb_build_object('papel', 'pdf_da_aprovacao', 'nome', nome, 'formato', 'pdf', 'tamanho', tamanho,
    'hash_md5', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'drive_id', drive) $$;
grant execute on function pg_temp.pdf(text, text, bigint) to authenticated;

create function pg_temp.enviar_pdf(nome_do_processo text, pdf jsonb default pg_temp.pdf()) returns uuid
language sql as $$ select public.registrar_pdf_da_aprovacao(pg_temp.processo(nome_do_processo), pdf) $$;
grant execute on function pg_temp.enviar_pdf(text, jsonb) to authenticated;

create function pg_temp.pdf_de(nome_do_processo text) returns uuid
language sql stable as $$
  select p.id from public.pdfs_da_aprovacao p join public.aprovacoes a on a.id = p.aprovacao_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and p.guardado_em is null $$;
grant execute on function pg_temp.pdf_de(text) to authenticated;

create function pg_temp.pdfs(nome_do_processo text, so_atuais boolean default false) returns bigint
language sql stable as $$
  select count(*) from public.pdfs_da_aprovacao p join public.aprovacoes a on a.id = p.aprovacao_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and (not so_atuais or p.guardado_em is null) $$;
grant execute on function pg_temp.pdfs(text, boolean) to authenticated;

create function pg_temp.eventos(nome_do_processo text, qual_entidade text, qual_acao text) returns bigint
language sql stable as $$
  select count(*) from public.eventos
  where entidade = qual_entidade and acao = qual_acao and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.eventos(text, text, text) to authenticated;

create function pg_temp.data_da(nome_do_processo text) returns date
language sql stable as $$ select data_da_validacao from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.data_da(text) to authenticated;

create function pg_temp.validar(nome_do_processo text, quando date) returns void
language sql as $$ select public.registrar_data_da_validacao(pg_temp.processo(nome_do_processo), quando) $$;
grant execute on function pg_temp.validar(text, date) to authenticated;

set local role authenticated;

-- ===== Data da validação: registrar, alterar, apagar (integrante a2) =====
select pg_temp.claims('a2');
select pg_temp.mover('Val', 'revisao_setor');
insert into _tap (linha) select is(pg_temp.data_da('Val'), null, 'a data da validação nasce vazia');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val', pg_temp.hoje() - 3)$sql$,
  'registrar a data da validação na Validação com o setor é aceito');
insert into _tap (linha) select is(pg_temp.data_da('Val'), pg_temp.hoje() - 3, 'a view lê a data registrada');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'depois'->>'data_da_validacao', jsonb_typeof(detalhes->'antes'->'data_da_validacao'), detalhes->'depois'->>'nome'
    from public.eventos where entidade = 'processo' and acao = 'registrar_data_da_validacao'
      and entidade_ref = pg_temp.processo('Val')::text$sql$,
  $sql$select (pg_temp.hoje() - 3)::text, 'null', 'Val'$sql$,
  'o evento "registrar_data_da_validacao" traz a data nova, o antes vazio e o nome do processo');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val', pg_temp.hoje())$sql$, 'alterar a data da validação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'data_da_validacao', detalhes->'depois'->>'data_da_validacao'
    from public.eventos where entidade = 'processo' and acao = 'alterar_data_da_validacao' and entidade_ref = pg_temp.processo('Val')::text$sql$,
  $sql$select (pg_temp.hoje() - 3)::text, pg_temp.hoje()::text$sql$,
  'o evento "alterar_data_da_validacao" traz a data de antes e a de depois');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val', pg_temp.hoje())$sql$, 'gravar a mesma data de novo é aceito');
insert into _tap (linha) select is(pg_temp.eventos('Val', 'processo', 'alterar_data_da_validacao'), 1::bigint,
  'gravar a mesma data não gera evento');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val', null)$sql$, 'apagar a data da validação é aceito');
insert into _tap (linha) select is(pg_temp.data_da('Val'), null, 'a data apagada volta a ser vazia');
insert into _tap (linha) select results_eq(
  $sql$select jsonb_typeof(detalhes->'depois'->'data_da_validacao') from public.eventos
    where entidade = 'processo' and acao = 'alterar_data_da_validacao' and entidade_ref = pg_temp.processo('Val')::text
    order by ocorrido_em desc, id desc limit 1$sql$,
  $sql$values ('null')$sql$, 'apagar a data é um evento "alterar" com o depois vazio');
insert into _tap (linha) select is(pg_temp.eventos('Val', 'processo', 'alterar_data_da_validacao'), 2::bigint,
  'a data teve uma alteração e uma remoção, dois eventos de alterar');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set data_da_validacao = current_date where id = pg_temp.processo('Val')$sql$,
  'P0001', 'data_da_validacao_so_pela_funcao', 'a coluna não se grava fora da função');

-- ===== Data da validação: não futura =====
select pg_temp.mover('Val Futuro', 'revisao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Val Futuro', pg_temp.hoje() + 1)$sql$,
  'P0001', 'data_no_futuro:' || (pg_temp.hoje() + 1)::text, 'data amanhã é recusada');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val Futuro', pg_temp.hoje())$sql$, 'a data de hoje é aceita');

-- ===== Data da validação: só na Validação com o setor, em andamento =====
select pg_temp.mover('Aprov', 'aprovacao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Aprov', pg_temp.hoje())$sql$,
  'P0001', 'data_so_na_validacao', 'na Aprovação pelo setor a data é recusada');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Sem Etapa', pg_temp.hoje())$sql$,
  'P0001', 'data_so_na_validacao', 'em Não iniciados a data é recusada');
select pg_temp.mover('Val Parado', 'revisao_setor');
select public.suspender_processo(pg_temp.processo('Val Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Val Parado', pg_temp.hoje())$sql$,
  'P0001', 'processo_parado:suspenso', 'processo suspenso recusa a data');
select pg_temp.concluir('Arquivado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Arquivado', pg_temp.hoje())$sql$,
  'P0001', 'data_so_na_validacao', 'processo concluído, que estava arquivado, recusa a data: ela é só da Validação com o setor');

-- ===== Data da validação: subprocesso com a sua data =====
select pg_temp.mover('Filho', 'revisao_setor');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Filho', pg_temp.hoje() - 1)$sql$, 'o subprocesso registra a sua data');
insert into _tap (linha) select results_eq($sql$select pg_temp.data_da('Filho'), pg_temp.data_da('Pai')$sql$,
  $sql$select pg_temp.hoje() - 1, null::date$sql$, 'a data do subprocesso não vai para o pai');

-- ===== .pdf: o caminho feliz, o nome com a versão, um atual por aprovação =====
select pg_temp.aprovado('Pdf');
select pg_temp.enviar('Pdf Sem');
select pg_temp.mover('Pdf Sem', 'revisao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Sem')$sql$, 'P0001', 'sem_aprovacao_para_o_pdf',
  'o .pdf de processo sem aprovação é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf', pg_temp.pdf('T60_V9_Pdf_Aprovação.pdf'))$sql$,
  'P0001', 'pdf_nome_sem_versao:T60_V9_Pdf_Aprovação.pdf', 'o nome sem a versão aprovada é recusado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar_pdf('Pdf')$sql$, 'enviar o .pdf da aprovação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select p.nome, p.guardado_em is null, p.enviado_por::text,
    (p.versao_id = (select id from public.versoes where processo_id = pg_temp.processo('Pdf') and numero = 1))
    from public.pdfs_da_aprovacao p where p.id = pg_temp.pdf_de('Pdf')$sql$,
  $sql$values ('T60_V1_Pdf_Aprovação.pdf', true, '00000000-0000-0000-0000-0000000000a2', true)$sql$,
  'o .pdf guarda a versão aprovada e quem o enviou, sem data de guardado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf', pg_temp.pdf(drive => 'drive-pdf-outro'))$sql$,
  'P0001', 'pdf_ja_enviado', 'um segundo .pdf atual da mesma aprovação é recusado');
insert into _tap (linha) select is(pg_temp.eventos('Pdf', 'aprovacao', 'enviar_pdf'), 1::bigint, 'enviar o .pdf gera um evento');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.enviar_pdf('Pdf Sem', pg_temp.pdf(tamanho => 20971521))$sql$, 'P0001', 'sem_aprovacao_para_o_pdf',
  'a conferência da aprovação vem antes da do tamanho');
select pg_temp.mover('Pdf Sem', 'aprovacao_setor');
select public.registrar_aprovacao(pg_temp.processo('Pdf Sem'), null, null, null);
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Sem', pg_temp.pdf(tamanho => 20971521))$sql$,
  '23514', null, '.pdf acima de 20 MB é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Sem', pg_temp.pdf(tamanho => 0))$sql$,
  '23514', null, '.pdf vazio é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Sem', pg_temp.pdf(drive => 'com espaço'))$sql$,
  '23514', null, 'identificador do Drive fora do formato é recusado');

-- ===== .pdf: substituir troca só o conteúdo =====
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_pdf_da_aprovacao(pg_temp.pdf_de('Pdf'),
    jsonb_build_object('formato', 'pdf', 'tamanho', 555, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$,
  'substituir o .pdf é aceito');
insert into _tap (linha) select results_eq(
  $sql$select tamanho, hash_md5, nome, drive_id from public.pdfs_da_aprovacao where id = pg_temp.pdf_de('Pdf')$sql$,
  $sql$values (555::bigint, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'T60_V1_Pdf_Aprovação.pdf', 'drive-pdf')$sql$,
  'a troca muda o tamanho e o hash e deixa o nome e o arquivo do Drive');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'hash_md5', detalhes->'depois'->>'hash_md5' from public.eventos
    where entidade = 'aprovacao' and acao = 'substituir_pdf' and entidade_ref = pg_temp.processo('Pdf')::text$sql$,
  $sql$values ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')$sql$,
  'substituir gera um evento com o hash de antes e o de depois');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_pdf_da_aprovacao(pg_temp.pdf_de('Pdf'), jsonb_build_object('formato', 'docx', 'tamanho', 5, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$,
  'P0001', 'tipo_de_arquivo_diferente:pdf', 'o .pdf só se substitui por .pdf');
insert into _tap (linha) select throws_ok(
  $sql$update public.pdfs_da_aprovacao set nome = 'outro.pdf' where id = pg_temp.pdf_de('Pdf')$sql$, '42501', null,
  'o nome do .pdf não se altera');
insert into _tap (linha) select throws_ok(
  $sql$update public.pdfs_da_aprovacao set versao_id = (select id from public.versoes limit 1) where id = pg_temp.pdf_de('Pdf')$sql$,
  '42501', null, 'a versão do .pdf não se altera');
insert into _tap (linha) select throws_ok(
  $sql$update public.pdfs_da_aprovacao set drive_id = 'outro' where id = pg_temp.pdf_de('Pdf')$sql$, '42501', null,
  'o arquivo do Drive do .pdf não se altera');
insert into _tap (linha) select throws_ok(
  $sql$update public.pdfs_da_aprovacao set guardado_em = now() where id = pg_temp.pdf_de('Pdf')$sql$, '42501', null,
  'a data de guardado não se altera à mão');
insert into _tap (linha) select throws_ok($sql$delete from public.pdfs_da_aprovacao where id = pg_temp.pdf_de('Pdf')$sql$,
  '42501', null, 'o .pdf não se apaga');

-- ===== Aprovação nova guarda o .pdf da anterior =====
select pg_temp.aprovado('Pdf Segunda');
select pg_temp.enviar_pdf('Pdf Segunda');
select public.registrar_aprovacao(pg_temp.processo('Pdf Segunda'), 'PROT-2', null, null);
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.pdfs('Pdf Segunda'), pg_temp.pdfs('Pdf Segunda', true)$sql$, $sql$values (1::bigint, 0::bigint)$sql$,
  'a segunda aprovação deixa o .pdf antigo guardado e sem .pdf atual');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'pdf_nome' from public.eventos
    where entidade = 'aprovacao' and acao = 'substituir' and entidade_ref = pg_temp.processo('Pdf Segunda')::text$sql$,
  $sql$values ('T60_V1_Pdf_Aprovação.pdf')$sql$, 'o evento "substituir" a aprovação leva o nome do .pdf que ficou guardado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar_pdf('Pdf Segunda', pg_temp.pdf(drive => 'drive-pdf-2'))$sql$,
  'a aprovação nova recebe o seu .pdf');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.pdfs('Pdf Segunda'), pg_temp.pdfs('Pdf Segunda', true)$sql$, $sql$values (2::bigint, 1::bigint)$sql$,
  'o guardado continua e o novo é o atual');
-- A versão nova só entra até a Revisão interna (ADR 0025): o processo volta a ela, recebe a V2 e segue à Aprovação.
select pg_temp.mover('Pdf Segunda', 'revisao_interna');
select pg_temp.enviar('Pdf Segunda');
select pg_temp.mover('Pdf Segunda', 'aprovacao_setor');
select public.registrar_aprovacao(pg_temp.processo('Pdf Segunda'), 'PROT-3', null, null);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.enviar_pdf('Pdf Segunda', pg_temp.pdf(drive => 'drive-pdf-3'))$sql$, 'P0001',
  'pdf_nome_sem_versao:T60_V1_Pdf_Aprovação.pdf', 'depois de aprovar a V2, o .pdf com o nome da V1 é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.enviar_pdf('Pdf Segunda', pg_temp.pdf('T60_V2_Pdf_Aprovação.pdf', 'drive-pdf-3'))$sql$,
  'o .pdf com o nome da V2 é aceito');

-- ===== Editar a aprovação não guarda o .pdf =====
select pg_temp.aprovado('Pdf Edita');
select pg_temp.enviar_pdf('Pdf Edita');
update public.aprovacoes set numero_eprotocolo = 'PROT-EDITADO' where processo_id = pg_temp.processo('Pdf Edita');
insert into _tap (linha) select is(pg_temp.pdfs('Pdf Edita', true), 1::bigint, 'editar o número da aprovação não guarda o .pdf');

-- ===== .pdf: a regra do editar a aprovação (em andamento ou concluído) =====
select pg_temp.aprovado('Pdf Conc');
select pg_temp.concluir('Pdf Conc');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar_pdf('Pdf Conc')$sql$, 'processo concluído recebe o .pdf');
select pg_temp.aprovado('Pdf Parado');
select pg_temp.enviar_pdf('Pdf Parado');
select public.suspender_processo(pg_temp.processo('Pdf Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_pdf_da_aprovacao(pg_temp.pdf_de('Pdf Parado'),
    jsonb_build_object('formato', 'pdf', 'tamanho', 5, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$,
  'P0001', 'processo_parado:suspenso', 'processo suspenso não tem o .pdf substituído');
select pg_temp.aprovado('Pdf Cancelado');
select public.cancelar_processo(pg_temp.processo('Pdf Cancelado'), 'Desistência do setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Cancelado')$sql$, 'P0001', 'processo_parado:cancelado',
  'processo cancelado não recebe o .pdf');

-- ===== Perfis: consulta (a3), inativo (a4), administrador (a1) e visitante =====
select pg_temp.aprovado('Pdf Perfis');
select pg_temp.enviar_pdf('Pdf Perfis');
select pg_temp.mover('Val Perfis', 'revisao_setor');

select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Val Perfis', pg_temp.hoje())$sql$, '42501', null,
  'consulta não registra a data da validação');
insert into _tap (linha) select is(pg_temp.data_da('Val'), null, 'consulta lê a data da validação (vazia aqui)');
insert into _tap (linha) select is(pg_temp.data_da('Val Futuro'), pg_temp.hoje(), 'consulta lê a data da validação registrada');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Perfis', pg_temp.pdf(drive => 'drive-x'))$sql$, '42501', null,
  'consulta não envia o .pdf');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_pdf_da_aprovacao(pg_temp.pdf_de('Pdf Perfis'),
    jsonb_build_object('formato', 'pdf', 'tamanho', 5, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$, '42501', null,
  'consulta não substitui o .pdf');
insert into _tap (linha) select ok((select count(*) from public.pdfs_da_aprovacao) > 0, 'consulta lê os .pdfs');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pdfs_da_aprovacao (aprovacao_id, nome, tamanho, hash_md5, drive_id)
    select id, 'x.pdf', 1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'x' from public.aprovacoes limit 1$sql$, '42501', null,
  'consulta não inclui .pdf direto na tabela');

select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok($sql$select pg_temp.validar('Val Perfis', pg_temp.hoje())$sql$, '42501', null,
  'inativo não registra a data da validação');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento where data_da_validacao is not null), 0::bigint,
  'inativo não lê a data da validação');
insert into _tap (linha) select is((select count(*) from public.pdfs_da_aprovacao), 0::bigint, 'inativo não lê os .pdfs');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_pdf('Pdf Perfis', pg_temp.pdf(drive => 'drive-y'))$sql$, '42501', null,
  'inativo não envia o .pdf');

select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.validar('Val Perfis', pg_temp.hoje())$sql$,
  'administrador registra a data da validação');
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_pdf_da_aprovacao(pg_temp.pdf_de('Pdf Perfis'),
    jsonb_build_object('formato', 'pdf', 'tamanho', 7, 'hash_md5', 'cccccccccccccccccccccccccccccccc'))$sql$,
  'administrador substitui o .pdf');
insert into _tap (linha) select results_eq($sql$select enviado_por::text from public.pdfs_da_aprovacao where id = pg_temp.pdf_de('Pdf Perfis')$sql$,
  $sql$values ('00000000-0000-0000-0000-0000000000a1')$sql$, 'a substituição renova quem enviou');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.pdfs_da_aprovacao$sql$, '42501', null, 'visitante não lê os .pdfs');
insert into _tap (linha) select throws_ok($sql$select public.registrar_data_da_validacao('00000000-0000-0000-0000-000000000000', null)$sql$,
  '42501', null, 'visitante não registra a data da validação');
insert into _tap (linha) select throws_ok($sql$select public.registrar_pdf_da_aprovacao('00000000-0000-0000-0000-000000000000', '{}'::jsonb)$sql$,
  '42501', null, 'visitante não envia o .pdf');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select has_function('public', 'registrar_data_da_validacao', array['uuid', 'date'], 'existe registrar_data_da_validacao');
insert into _tap (linha) select has_function('public', 'registrar_pdf_da_aprovacao', array['uuid', 'jsonb'], 'existe registrar_pdf_da_aprovacao');
insert into _tap (linha) select has_function('public', 'substituir_pdf_da_aprovacao', array['uuid', 'jsonb'], 'existe substituir_pdf_da_aprovacao');
insert into _tap (linha) select is(
  (select bool_or(prosecdef) from pg_proc where pronamespace = 'public'::regnamespace
    and proname in ('registrar_data_da_validacao', 'registrar_pdf_da_aprovacao', 'substituir_pdf_da_aprovacao')), false,
  'as funções novas não são security definer');
insert into _tap (linha) select is(has_table_privilege('authenticated', 'public.pdfs_da_aprovacao', 'DELETE'), false,
  'ninguém apaga .pdf da aprovação');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
