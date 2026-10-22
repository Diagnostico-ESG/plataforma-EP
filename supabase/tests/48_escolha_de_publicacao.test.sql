-- Escolha de publicação e regra nova do concluído (publicacao-e-arquivamento, ticket 01, ADR 0020): quem pode responder
-- "Vai para publicação?" e ler os campos novos, a escolha obrigatória ao resolver a Aprovação com a Publicação pendente
-- depois, "sim" iniciando a Publicação e "não" a pulando, o concluído sem etapa atual, a volta que apaga ou mantém a
-- escolha, a coluna que só muda pelas funções, o evento da escolha, o nome "Validação com o setor", o subprocesso e a
-- Publicação desativada. A conversão dos dados antigos foi ensaiada à parte, antes de aplicar a migração.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(45);

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

-- Uma etapa opcional inventada depois da Publicação, acrescentada pelo administrador antes dos processos (todos a
-- ganham): no "não", ela é a que entra em andamento.
set local role authenticated;
select pg_temp.claims('a1');
select public.acrescentar_etapa('teste_t48', 'Etapa Depois T48', false, 'IX', null);
reset role;

-- Um setor, um macroprocesso e os processos; o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000048', 'T48', 'Setor Publicacao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000048', null, 'Macro Publicacao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', nome
from unnest(array['Sem Escolha', 'Sim', 'Nao', 'Realizada', 'Publicado', 'Volta Aprovacao', 'Volta Publicacao', 'Perfis',
  'Admin', 'Desativada']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000048' $$;
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

create function pg_temp.status(nome_do_processo text, codigo_da_etapa text) returns public.status_da_etapa
language sql stable as $$ select status from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.status(text, text) to authenticated;

-- A linha da view do processo (situação, etapa atual, responsável e os campos novos).
create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

create function pg_temp.escolha(nome_do_processo text) returns boolean
language sql stable as $$ select vai_para_publicacao from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.escolha(text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T48_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1, null,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.acrescentar_relatorio(versao, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- As etapas 1 a 4 "realizadas anteriormente" (sem registro nem trava) e a Aprovação em andamento.
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

-- A chamada da tela: a aprovação, a escolha e a conclusão numa função só.
create function pg_temp.aprovar(nome_do_processo text, vai boolean default null, responsavel uuid default null) returns void
language sql as $$
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), null, null, null, responsavel, vai) $$;
grant execute on function pg_temp.aprovar(text, boolean, uuid) to authenticated;

-- Todos os processos com a versão completa de a1 e a Aprovação em andamento (por a2).
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000048';
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000048';

-- ===== Validação com o setor =====
insert into _tap (linha) select is((select nome from public.etapas where codigo = 'revisao_setor'), 'Validação com o setor',
  'a revisao_setor se chama Validação com o setor');

-- ===== A escolha é obrigatória =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Sem Escolha')$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', 'concluir a Aprovação sem escolha é recusado');
insert into _tap (linha) select is(pg_temp.status('Sem Escolha', 'aprovacao_setor'), 'em_andamento'::public.status_da_etapa,
  'a recusa deixa a Aprovação em andamento');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Realizada', 'aprovacao_setor'), 'realizada_anteriormente', 'Aprovada antes', null)$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', '"realizada anteriormente" na Aprovação sem escolha é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Realizada', 'aprovacao_setor'), 'realizada_anteriormente', 'Aprovada antes', null, false)$sql$,
  '"realizada anteriormente" na Aprovação com escolha é aceito');
insert into _tap (linha) select is((pg_temp.linha('Realizada')).situacao, 'concluido', 'e, com "não", o processo fica concluído');

-- ===== "Sim" =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Sim', true, '00000000-0000-0000-0000-0000000000a1')$sql$,
  'concluir a Aprovação com "sim" é aceito');
insert into _tap (linha) select is(pg_temp.escolha('Sim'), true, 'a escolha fica "sim"');
insert into _tap (linha) select results_eq(
  $sql$select status::text, responsavel_id::text from public.andamentos where id = pg_temp.andamento('Sim', 'publicacao')$sql$,
  $sql$values ('em_andamento', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'a Publicação entra em andamento com o responsável escolhido');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, vai_para_publicacao from public.processos_com_andamento where id = pg_temp.processo('Sim')$sql$,
  $sql$values ('em_andamento', 'publicacao', true)$sql$,
  'com a Publicação em andamento o processo não está concluído e segue na Publicação');
insert into _tap (linha) select results_eq(
  $sql$select acao, autor_id::text, detalhes->'antes'->>'vai_para_publicacao', detalhes->'depois'->>'vai_para_publicacao'
    from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Sim')::text and acao = 'escolher_publicacao'$sql$,
  $sql$values ('escolher_publicacao', '00000000-0000-0000-0000-0000000000a2', null::text, 'true')$sql$,
  'um evento "escolher_publicacao" guarda o antes vazio, o "sim" e o autor');

-- ===== "Não" =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Nao', false)$sql$, 'concluir a Aprovação com "não" é aceito');
insert into _tap (linha) select results_eq(
  $sql$select status::text, responsavel_id, iniciada_em from public.andamentos where id = pg_temp.andamento('Nao', 'publicacao')$sql$,
  $sql$values ('pendente', null::uuid, null::date)$sql$, 'com "não" a Publicação fica pendente, parada');
insert into _tap (linha) select is(pg_temp.status('Nao', 'teste_t48'), 'em_andamento'::public.status_da_etapa,
  'e a etapa depois dela entra em andamento');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, responsavel_id, vai_para_publicacao, publicado_em
    from public.processos_com_andamento where id = pg_temp.processo('Nao')$sql$,
  $sql$values ('concluido', null::text, null::uuid, false, null::date)$sql$,
  'o processo com "não" está concluído, sem etapa atual nem responsável');
insert into _tap (linha) select is(
  (select detalhes->'depois'->>'vai_para_publicacao' from public.eventos
    where entidade = 'processo' and entidade_ref = pg_temp.processo('Nao')::text and acao = 'escolher_publicacao'),
  'false', 'o evento guarda o "não"');

-- ===== Publicação resolvida =====
select pg_temp.aprovar('Publicado', true);
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Publicado', 'publicacao'), 'concluir', null, null)$sql$,
  'concluir a Publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, publicado_em from public.processos_com_andamento where id = pg_temp.processo('Publicado')$sql$,
  $sql$values ('concluido', (now() at time zone 'America/Sao_Paulo')::date)$sql$,
  'com a Publicação concluída o processo está concluído e publicado na data dela');

-- ===== A coluna só muda pelas funções =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Nao')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'integrante não muda a escolha direto');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = null where id = pg_temp.processo('Sim')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'administrador também não muda a escolha direto');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Admin', false)$sql$, 'administrador responde a escolha');
select pg_temp.claims('a2');

-- ===== Voltar =====
select pg_temp.aprovar('Volta Aprovacao', true);
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Aprovacao', 'aprovacao_setor'), 'Rever a aprovação', null)$sql$,
  'voltar à Aprovação é aceito');
insert into _tap (linha) select is(pg_temp.escolha('Volta Aprovacao'), null, 'voltar à Aprovação apaga a escolha');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'vai_para_publicacao', jsonb_typeof(detalhes->'depois'->'vai_para_publicacao'), detalhes->>'motivo'
    from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Volta Aprovacao')::text
      and acao = 'apagar_escolha_de_publicacao'$sql$,
  $sql$values ('true', 'null', 'Rever a aprovação')$sql$,
  'um evento "apagar_escolha_de_publicacao" guarda o antes e o motivo da volta');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Volta Aprovacao')$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', 'a escolha é perguntada de novo na próxima conclusão');
select pg_temp.aprovar('Volta Publicacao', true);
select public.avancar_etapa(pg_temp.andamento('Volta Publicacao', 'publicacao'), 'concluir', null, null);
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Publicacao', 'publicacao'), 'Republicar', null)$sql$,
  'voltar à Publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, vai_para_publicacao from public.processos_com_andamento
    where id = pg_temp.processo('Volta Publicacao')$sql$,
  $sql$values ('em_andamento', 'publicacao', true)$sql$,
  'voltar à Publicação reabre só ela, mantém o "sim" e tira o processo de concluído');

-- ===== Subprocesso =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Filho', false)$sql$, 'o subprocesso responde a escolha');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.escolha('Filho'), pg_temp.escolha('Pai'), (pg_temp.linha('Filho')).situacao, (pg_temp.linha('Pai')).situacao$sql$,
  $sql$values (false, null::boolean, 'concluido', 'em_andamento')$sql$,
  'a escolha e o concluído são do subprocesso, sem mexer no pai');

-- ===== Perfis =====
select pg_temp.claims('a3');
insert into _tap (linha) select results_eq(
  $sql$select vai_para_publicacao, publicado_em is not null from public.processos_com_andamento
    where id in (pg_temp.processo('Nao'), pg_temp.processo('Publicado')) order by nome$sql$,
  $sql$values (false, false), (true, true)$sql$, 'consulta lê a escolha e a data da publicação');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where entidade = 'processo' and acao = 'escolher_publicacao') > 0,
  'consulta lê os eventos da escolha');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, '42501', null,
  'consulta não responde a escolha');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Perfis', 'aprovacao_setor'), 'realizada_anteriormente', 'Antes', null, true)$sql$,
  '42501', null, 'consulta não responde a escolha na "realizada anteriormente"');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Perfis')$sql$,
  '42501', null, 'consulta não muda a escolha direto');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento where setor_id = '5f000000-0000-0000-0000-000000000048'),
  0::bigint, 'inativo não lê a escolha nem a data da publicação');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo' and acao = 'escolher_publicacao'),
  0::bigint, 'inativo não lê os eventos da escolha');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, 'P0001', 'registro_inexistente',
  'inativo não responde a escolha (não enxerga a etapa)');
insert into _tap (linha) select is(
  (with mudadas as (update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Perfis') returning 1)
    select count(*) from mudadas), 0::bigint, 'inativo não muda a escolha direto (não enxerga o processo)');

select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.escolha('Perfis'), null, 'as tentativas recusadas não deixam escolha');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, 'integrante responde a escolha');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select vai_para_publicacao from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a escolha');
insert into _tap (linha) select throws_ok(
  $sql$select public.concluir_aprovacao('00000000-0000-0000-0000-000000000000', null, null, null, null, true)$sql$, '42501', null,
  'visitante não responde a escolha');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = true$sql$, '42501', null, 'visitante não muda a escolha direto');

-- ===== Publicação desativada (por último: muda o catálogo para os casos seguintes) =====
reset role;
set local role authenticated;
select pg_temp.claims('a1');
update public.etapas set ativa = false where codigo = 'publicacao';
select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.andamento('Desativada', 'publicacao'), null,
  'a Publicação desativada sai do processo em que estava pendente');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Desativada')$sql$,
  'sem a Publicação, a Aprovação conclui sem escolha');
insert into _tap (linha) select results_eq(
  $sql$select situacao, vai_para_publicacao from public.processos_com_andamento where id = pg_temp.processo('Desativada')$sql$,
  $sql$values ('concluido', null::boolean)$sql$, 'e o processo fica concluído, sem resposta');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'avancar_etapa' and pronamespace = 'public'::regnamespace), false,
  'o avanço continua sem security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
