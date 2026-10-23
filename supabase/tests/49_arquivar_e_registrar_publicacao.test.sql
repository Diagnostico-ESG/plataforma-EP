-- Desistir, registrar publicação e arquivar (publicacao-e-arquivamento, ticket 02; ADR 0020): a Publicação que não se
-- dispensa, "não vai mais para publicação" com motivo, o registro da publicação feita depois (data nem futura nem antes
-- da aprovação), arquivar e desarquivar só o concluído, a trava do arquivado (tudo recusado menos registrar publicação e
-- desarquivar), a coluna que só muda pelas funções, os eventos, o subprocesso e quem pode o quê.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(72);

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

-- Um setor, dois macroprocessos (o segundo para editar o pai) e os processos; o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000049', 'T49', 'Setor Arquivo');
insert into public.macroprocessos (id, codigo, nome) values
  ('af000000-0000-0000-0000-000000000049', null, 'Macro Arquivo'),
  ('af000000-0000-0000-0000-00000000049b', null, 'Macro Arquivo Outro');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000049', 'af000000-0000-0000-0000-000000000049', nome
from unnest(array['Dispensa', 'Desiste', 'Pendente', 'Andamento', 'Sem Data', 'Publicado', 'Suspenso', 'Cancelado',
  'Arquivado', 'Perfis', 'Perfis Sim', 'Perfis Arq']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000049', 'af000000-0000-0000-0000-000000000049', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000049', 'af000000-0000-0000-0000-000000000049', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai';

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000049' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo public.status_da_etapa,
  nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, text, public.status_da_etapa, text) to authenticated;

create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

create function pg_temp.escolha(nome_do_processo text) returns boolean
language sql stable as $$ select vai_para_publicacao from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.escolha(text) to authenticated;

create function pg_temp.arquivado(nome_do_processo text) returns boolean
language sql stable as $$ select arquivado_em is not null from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.arquivado(text) to authenticated;

-- O último evento do processo com a ação.
create function pg_temp.evento(nome_do_processo text, acao_do_evento text) returns public.eventos
language sql stable as $$
  select * from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo(nome_do_processo)::text
    and acao = acao_do_evento order by ocorrido_em desc limit 1 $$;
grant execute on function pg_temp.evento(text, text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T49_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1, null,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.acrescentar_relatorio(versao, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- As etapas 1 a 4 "realizadas anteriormente" e a Aprovação em andamento.
create function pg_temp.ate_a_aprovacao(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'aprovacao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_aprovacao(text) to authenticated;

-- A Aprovação concluída com a escolha e, quando vem, a data da aprovação.
create function pg_temp.aprovar(nome_do_processo text, vai boolean, data date default null) returns void
language sql as $$
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), null, null, data, null, vai) $$;
grant execute on function pg_temp.aprovar(text, boolean, date) to authenticated;

-- Todos com a versão completa (a1) e a Aprovação em andamento (a2); depois, cada um no estado do caso.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000049';
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000049';
select pg_temp.aprovar(nome, true) from unnest(array['Dispensa', 'Desiste', 'Publicado', 'Perfis Sim']) as nome;
select pg_temp.aprovar(nome, false, pg_temp.hoje() - 10) from unnest(array['Pendente', 'Arquivado', 'Perfis', 'Perfis Arq', 'Filho']) as nome;
select pg_temp.aprovar('Sem Data', false);
select public.avancar_etapa(pg_temp.andamento('Publicado', 'publicacao'), 'concluir', null, null);
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');

-- ===== A Publicação não se dispensa =====
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Dispensa', 'publicacao'), 'dispensar', 'Não vai', null)$sql$,
  'P0001', 'publicacao_nao_se_dispensa', 'dispensar a Publicação pelo avanço é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.agir('Dispensa', 'publicacao', 'dispensada', 'Não vai')$sql$,
  'P0001', 'publicacao_nao_se_dispensa', 'dispensar a Publicação direto é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Dispensa', 'publicacao'), 'realizada_anteriormente', 'Publicada antes', null)$sql$,
  '"realizada anteriormente" na Publicação continua aceita');

-- ===== Não vai mais para publicação =====
insert into _tap (linha) select throws_ok($sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Desiste'), '  ')$sql$,
  'P0001', 'motivo_obrigatorio', 'desistir sem motivo é recusado');
insert into _tap (linha) select throws_ok($sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Pendente'), 'Mudou')$sql$,
  'P0001', 'publicacao_fora_de_andamento', 'desistir com a Publicação pendente é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Desiste'), 'O setor desistiu de publicar')$sql$,
  'desistir com a Publicação em andamento e motivo é aceito');
insert into _tap (linha) select results_eq(
  $sql$select status::text, responsavel_id, iniciada_em, resolvida_em, nota from public.andamentos
    where id = pg_temp.andamento('Desiste', 'publicacao')$sql$,
  $sql$values ('pendente', null::uuid, null::date, null::date, null::text)$sql$,
  'a Publicação volta a pendente, sem responsável, datas nem nota');
insert into _tap (linha) select results_eq(
  $sql$select situacao, vai_para_publicacao from public.processos_com_andamento where id = pg_temp.processo('Desiste')$sql$,
  $sql$values ('concluido', false)$sql$, 'o processo fica concluído, não publicado');
insert into _tap (linha) select results_eq(
  $sql$select (e).autor_id::text, (e).detalhes->>'motivo', (e).detalhes->'antes'->>'vai_para_publicacao',
    (e).detalhes->'depois'->>'vai_para_publicacao' from (select pg_temp.evento('Desiste', 'nao_vai_mais_para_publicacao') as e) x$sql$,
  $sql$values ('00000000-0000-0000-0000-0000000000a2', 'O setor desistiu de publicar', 'true', 'false')$sql$,
  'o evento da desistência guarda o motivo, a escolha antes e depois e o autor');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'andamento'
    and entidade_ref = pg_temp.processo('Desiste')::text || ':' || pg_temp.andamento('Desiste', 'publicacao')::text
    and detalhes->'depois'->>'status' = 'pendente'),
  0::bigint, 'a volta da Publicação a pendente não vira evento de andamento');

-- ===== Registrar publicação =====
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Andamento'), pg_temp.hoje(), null)$sql$,
  'P0001', 'publicacao_so_no_concluido:em_andamento', 'registrar publicação em processo em andamento é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Publicado'), pg_temp.hoje(), null)$sql$,
  'P0001', 'publicacao_ja_registrada', 'registrar publicação em processo já publicado é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pendente'), null, null)$sql$,
  'P0001', 'data_da_publicacao_obrigatoria', 'registrar publicação sem data é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pendente'), pg_temp.hoje() + 1, null)$sql$,
  'P0001', 'data_no_futuro:' || (pg_temp.hoje() + 1)::text, 'registrar publicação com data de amanhã é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pendente'), pg_temp.hoje() - 20, null)$sql$,
  'P0001', 'publicacao_antes_da_aprovacao:' || (pg_temp.hoje() - 20)::text || ':' || (pg_temp.hoje() - 10)::text,
  'registrar publicação antes da data da aprovação é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pendente'), pg_temp.hoje() - 5, '  Diário Oficial nº 1  ')$sql$,
  'registrar publicação depois da aprovação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select status::text, iniciada_em, resolvida_em from public.andamentos where id = pg_temp.andamento('Pendente', 'publicacao')$sql$,
  $sql$values ('concluida', pg_temp.hoje() - 5, pg_temp.hoje() - 5)$sql$, 'a Publicação fica concluída com início e fim na data');
insert into _tap (linha) select results_eq(
  $sql$select situacao, vai_para_publicacao, publicado_em from public.processos_com_andamento where id = pg_temp.processo('Pendente')$sql$,
  $sql$values ('concluido', true, pg_temp.hoje() - 5)$sql$, 'o processo continua concluído, agora publicado na data');
insert into _tap (linha) select results_eq(
  $sql$select (e).autor_id::text, (e).detalhes->>'motivo', (e).detalhes->'antes'->>'publicado_em', (e).detalhes->'depois'->>'publicado_em',
    (e).detalhes->'depois'->>'vai_para_publicacao' from (select pg_temp.evento('Pendente', 'registrar_publicacao') as e) x$sql$,
  $sql$values ('00000000-0000-0000-0000-0000000000a2', 'Diário Oficial nº 1', null::text, (pg_temp.hoje() - 5)::text, 'true')$sql$,
  'o evento do registro guarda a nota aparada, a data e o autor');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Sem Data'), pg_temp.hoje() - 400, null)$sql$,
  'sem data na aprovação, qualquer data passada é aceita');
insert into _tap (linha) select throws_ok(
  $sql$select public.desarquivar_processo(pg_temp.processo('Pendente'))$sql$,
  'P0001', 'nao_arquivado', 'desarquivar processo não arquivado é recusado');

-- ===== Arquivar =====
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Andamento'))$sql$,
  'P0001', 'arquivar_so_concluido:em_andamento', 'arquivar processo em andamento é recusado');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Suspenso'))$sql$,
  'P0001', 'arquivar_so_concluido:suspenso', 'arquivar processo suspenso é recusado');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Cancelado'))$sql$,
  'P0001', 'arquivar_so_concluido:cancelado', 'arquivar processo cancelado é recusado');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'arquivar processo concluído é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, arquivado_em is not null from public.processos_com_andamento where id = pg_temp.processo('Arquivado')$sql$,
  $sql$values ('concluido', true)$sql$, 'o arquivado continua concluído, com a marca');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'P0001', 'ja_arquivado', 'arquivar duas vezes é recusado');
insert into _tap (linha) select is((pg_temp.evento('Arquivado', 'arquivar')).autor_id::text, '00000000-0000-0000-0000-0000000000a2',
  'arquivar vira evento do processo, com o autor');

-- ===== A trava do arquivado =====
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Arquivado', 'aprovacao_setor'), 'Rever', null)$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, voltar etapa é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set resolvida_em = pg_temp.hoje() - 1 where id = pg_temp.andamento('Arquivado', 'modelagem')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, corrigir datas é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a1'
    where id = pg_temp.andamento('Arquivado', 'modelagem')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, trocar responsável é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'PROT-49' where processo_id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, editar a aprovação é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set observacoes = 'Nova' where id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, editar o processo é recusado');
insert into _tap (linha) select throws_ok($sql$select public.suspender_processo(pg_temp.processo('Arquivado'), 'Parar')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, suspender é recusado');
insert into _tap (linha) select throws_ok($sql$select public.cancelar_processo(pg_temp.processo('Arquivado'), 'Parar')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, cancelar é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Arquivado'), 'processo', null, 'Classificar')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, reclassificar é recusado');
insert into _tap (linha) select throws_ok($sql$delete from public.processos where id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, excluir é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_versao(pg_temp.processo('Arquivado'), 2, null,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')))$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'no arquivado, enviar versão é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo((select f.id from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = pg_temp.processo('Arquivado') and f.papel = 'png'),
    jsonb_build_object('formato', 'png', 'tamanho', 555, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$,
  'P0001', 'versao_aprovada:1', 'no arquivado, substituir arquivo é recusado (a versão aprovada já trava)');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Arquivado'), pg_temp.hoje(), null)$sql$,
  'no arquivado, registrar publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, arquivado_em is not null, publicado_em from public.processos_com_andamento where id = pg_temp.processo('Arquivado')$sql$,
  $sql$values ('concluido', true, pg_temp.hoje())$sql$, 'e o processo continua arquivado, agora publicado');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'desarquivar o arquivado é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, arquivado_em from public.processos_com_andamento where id = pg_temp.processo('Arquivado')$sql$,
  $sql$values ('concluido', null::timestamptz)$sql$, 'o desarquivado volta a concluído sem a marca');
insert into _tap (linha) select is((pg_temp.evento('Arquivado', 'desarquivar')).autor_id::text, '00000000-0000-0000-0000-0000000000a2',
  'desarquivar vira evento do processo, com o autor');

-- ===== A coluna só muda pelas funções =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set arquivado_em = now() where id = pg_temp.processo('Desiste')$sql$,
  'P0001', 'arquivamento_so_pela_funcao', 'integrante não arquiva direto');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set arquivado_em = now() where id = pg_temp.processo('Desiste')$sql$,
  'P0001', 'arquivamento_so_pela_funcao', 'administrador também não arquiva direto');
select pg_temp.claims('a2');

-- ===== Subprocesso =====
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Filho'))$sql$,
  'o subprocesso concluído se arquiva');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.arquivado('Filho'), pg_temp.arquivado('Pai'), (pg_temp.linha('Pai')).situacao$sql$,
  $sql$values (true, false, 'em_andamento')$sql$, 'arquivar o subprocesso não mexe no pai');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set macroprocesso_id = 'af000000-0000-0000-0000-00000000049b' where id = pg_temp.processo('Pai')$sql$,
  'mudar o macroprocesso do pai com o subprocesso arquivado é aceito');
insert into _tap (linha) select is((select macroprocesso_id::text from public.processos where id = pg_temp.processo('Filho')),
  'af000000-0000-0000-0000-00000000049b', 'e o subprocesso arquivado acompanha o pai');

-- ===== Perfis =====
select public.arquivar_processo(pg_temp.processo('Perfis Arq'));
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Perfis Sim'), 'Mudou')$sql$, '42501', null,
  'consulta não desiste da publicação');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$, '42501', null,
  'consulta não registra publicação');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$, '42501', null,
  'consulta não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$, '42501', null,
  'consulta não desarquiva');
insert into _tap (linha) select is((pg_temp.linha('Perfis Arq')).arquivado_em is not null, true, 'consulta lê a marca de arquivado');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where entidade = 'processo'
    and acao in ('nao_vai_mais_para_publicacao', 'registrar_publicacao', 'arquivar', 'desarquivar')) >= 4,
  'consulta lê os eventos novos');

select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Perfis Sim'), 'Mudou')$sql$, 'P0001', 'registro_inexistente',
  'inativo não desiste da publicação (não enxerga o processo)');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$, 'P0001', 'registro_inexistente',
  'inativo não registra publicação');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não desarquiva');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento where setor_id = '5f000000-0000-0000-0000-000000000049'),
  0::bigint, 'inativo não lê a marca de arquivado');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo'
    and acao in ('nao_vai_mais_para_publicacao', 'registrar_publicacao', 'arquivar', 'desarquivar')),
  0::bigint, 'inativo não lê os eventos novos');

select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.nao_vai_mais_para_publicacao(pg_temp.processo('Perfis Sim'), 'Mudou')$sql$, 'administrador desiste da publicação');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$, 'administrador registra publicação');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$, 'administrador arquiva');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$,
  'administrador desarquiva');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select arquivado_em from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a marca de arquivado');
insert into _tap (linha) select throws_ok(
  $sql$select public.nao_vai_mais_para_publicacao('00000000-0000-0000-0000-000000000000', 'Mudou')$sql$, '42501', null,
  'visitante não desiste da publicação');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao('00000000-0000-0000-0000-000000000000', current_date, null)$sql$, '42501', null,
  'visitante não registra publicação');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não desarquiva');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
    and proname in ('nao_vai_mais_para_publicacao', 'registrar_publicacao', 'arquivar_processo', 'desarquivar_processo')),
  0::bigint, 'as funções novas não usam security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
