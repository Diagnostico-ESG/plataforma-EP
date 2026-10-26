-- Arquivar (publicacao-e-arquivamento, ticket 02; Andamento livre no ticket 24 de processos-etapas): arquivar e
-- desarquivar o concluído, a trava do arquivado (mover, etiqueta, responsável, aprovação, edição, situação,
-- reclassificação, exclusão e versões recusados), a coluna que só muda pelas funções, os eventos, o subprocesso e quem
-- pode o quê. "Não vai mais para publicação" e a registrar_publicacao antiga saíram (ADR 0024); a nova chega no ticket
-- 04 de publicacao-e-arquivamento, com o arquivamento do suspenso e do cancelado.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(51);

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
from unnest(array['Andamento', 'Suspenso', 'Cancelado', 'Arquivado', 'Perfis', 'Perfis Arq', 'Direto']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000049', 'af000000-0000-0000-0000-000000000049', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000049', 'af000000-0000-0000-0000-000000000049', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000049';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000049' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

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
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.acrescentar_relatorio(versao, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- Aprovado e levado a Concluídos sem publicação.
create function pg_temp.concluir(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('aprovacao_setor'));
  insert into public.aprovacoes (processo_id) values (pg_temp.processo(nome_do_processo));
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
end $$;
grant execute on function pg_temp.concluir(text) to authenticated;

-- Todos com a versão completa (a1); os concluídos por a2; depois, cada um no estado do caso.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000049';
select pg_temp.claims('a2');
select pg_temp.concluir(nome) from unnest(array['Arquivado', 'Perfis', 'Perfis Arq', 'Filho', 'Direto']) as nome;
select public.mover_processo(pg_temp.processo('Andamento'), pg_temp.etapa('modelagem'));
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');

-- ===== Arquivar =====
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Andamento'))$sql$,
  'P0001', 'arquivar_so_concluido:em_andamento', 'arquivar processo em andamento fora de Concluídos é recusado');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Suspenso'))$sql$,
  'arquivar processo suspenso é aceito');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Cancelado'))$sql$,
  'arquivar processo cancelado é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, arquivado_em is not null from public.processos_com_andamento
    where id = pg_temp.processo('Suspenso')$sql$,
  $sql$values ('suspenso', 'nao_iniciados', true)$sql$, 'o suspenso arquivado guarda a situação e a etapa');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Suspenso'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'processo_arquivado', 'no suspenso arquivado, mover é recusado');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'arquivar processo em Concluídos é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, arquivado_em is not null from public.processos_com_andamento
    where id = pg_temp.processo('Arquivado')$sql$,
  $sql$values ('concluido', 'concluidos', true)$sql$, 'o arquivado continua concluído, em Concluídos, com a marca');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'P0001', 'ja_arquivado', 'arquivar duas vezes é recusado');
insert into _tap (linha) select is((pg_temp.evento('Arquivado', 'arquivar')).autor_id::text, '00000000-0000-0000-0000-0000000000a2',
  'arquivar vira evento do processo, com o autor');
insert into _tap (linha) select throws_ok(
  $sql$select public.desarquivar_processo(pg_temp.processo('Andamento'))$sql$,
  'P0001', 'nao_arquivado', 'desarquivar processo não arquivado é recusado');

-- ===== A trava do arquivado =====
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Arquivado'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, mover é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.passagens set etiqueta = 'a_fazer' where processo_id = pg_temp.processo('Arquivado') and saiu_em is null$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, mudar a etiqueta é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a1' where id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, trocar o responsável é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'PROT-49' where processo_id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, editar a aprovação é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set observacoes = 'Nova' where id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, editar o processo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.gravar_anotacoes_do_processo(pg_temp.processo('Arquivado'), null, 'Nota')$sql$,
  'P0001', 'processo_arquivado', 'no arquivado, gravar as Anotações é recusado');
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
  $sql$select public.registrar_versao(pg_temp.processo('Arquivado'), 2,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')))$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'no arquivado, enviar versão é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo((select f.id from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = pg_temp.processo('Arquivado') and f.papel = 'png'),
    jsonb_build_object('formato', 'png', 'tamanho', 555, 'hash_md5', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))$sql$,
  'P0001', 'versao_aprovada:1', 'no arquivado, substituir arquivo é recusado (a versão aprovada já trava)');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Suspenso'))$sql$,
  'desarquivar o suspenso é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, arquivado_em from public.processos_com_andamento where id = pg_temp.processo('Suspenso')$sql$,
  $sql$values ('suspenso', 'nao_iniciados', null::timestamptz)$sql$, 'o suspenso desarquivado continua suspenso na mesma etapa');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Cancelado'))$sql$,
  'desarquivar o cancelado é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, arquivado_em from public.processos_com_andamento where id = pg_temp.processo('Cancelado')$sql$,
  $sql$values ('cancelado', 'nao_iniciados', null::timestamptz)$sql$, 'o cancelado desarquivado continua cancelado na mesma etapa');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Arquivado'))$sql$,
  'desarquivar o arquivado é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, arquivado_em from public.processos_com_andamento where id = pg_temp.processo('Arquivado')$sql$,
  $sql$values ('concluido', 'concluidos', null::timestamptz)$sql$, 'o desarquivado volta a Concluídos sem a marca');
insert into _tap (linha) select is((pg_temp.evento('Arquivado', 'desarquivar')).autor_id::text, '00000000-0000-0000-0000-0000000000a2',
  'desarquivar vira evento do processo, com o autor');

-- ===== A coluna só muda pelas funções =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set arquivado_em = now() where id = pg_temp.processo('Direto')$sql$,
  'P0001', 'arquivamento_so_pela_funcao', 'integrante não arquiva direto');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set arquivado_em = now() where id = pg_temp.processo('Direto')$sql$,
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
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$, '42501', null,
  'consulta não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$, '42501', null,
  'consulta não desarquiva');
insert into _tap (linha) select is((pg_temp.linha('Perfis Arq')).arquivado_em is not null, true, 'consulta lê a marca de arquivado');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where entidade = 'processo' and acao in ('arquivar', 'desarquivar')) >= 2,
  'consulta lê os eventos de arquivamento');

select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não desarquiva');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento where setor_id = '5f000000-0000-0000-0000-000000000049'),
  0::bigint, 'inativo não lê a marca de arquivado');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo'
    and acao in ('arquivar', 'desarquivar')), 0::bigint, 'inativo não lê os eventos de arquivamento');

select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select public.arquivar_processo(pg_temp.processo('Perfis'))$sql$, 'administrador arquiva');
insert into _tap (linha) select lives_ok($sql$select public.desarquivar_processo(pg_temp.processo('Perfis Arq'))$sql$,
  'administrador desarquiva');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select arquivado_em from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a marca de arquivado');
insert into _tap (linha) select throws_ok($sql$select public.arquivar_processo('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não arquiva');
insert into _tap (linha) select throws_ok($sql$select public.desarquivar_processo('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não desarquiva');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
    and proname in ('arquivar_processo', 'desarquivar_processo')),
  0::bigint, 'as funções de arquivar não usam security definer');
insert into _tap (linha) select hasnt_function('public', 'nao_vai_mais_para_publicacao', '"não vai mais para publicação" saiu');
insert into _tap (linha) select has_function('public', 'registrar_publicacao', array['uuid', 'date', 'text'],
  'a registrar_publicacao nova existe');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
