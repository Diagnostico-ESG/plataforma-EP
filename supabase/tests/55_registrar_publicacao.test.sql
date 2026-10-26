-- Registrar e corrigir a publicação (publicacao-e-arquivamento, ticket 04; ADR 0024): na Publicação e em Concluídos,
-- arquivado ou não, sem mover o processo; as recusas de etapa, data, link, situação e arquivado; os eventos; quem pode o
-- quê. Mover para Concluídos com a data ou a explicação é do teste 52.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(27);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000055', 'T55', 'Setor Publicação');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000055', null, 'Macro Publicação');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000055', 'af000000-0000-0000-0000-000000000055', nome
from unnest(array['Pub', 'Conc', 'Corrige', 'Nini', 'Susp', 'Arq', 'ArqPub', 'Aprov', 'Move', 'Perfis']) as nome;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000055' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

-- O último evento do processo com a ação.
create function pg_temp.evento(nome_do_processo text, acao_do_evento text) returns public.eventos
language sql stable as $$
  select * from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo(nome_do_processo)::text
    and acao = acao_do_evento order by ocorrido_em desc limit 1 $$;
grant execute on function pg_temp.evento(text, text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T55_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.enviar_relatorio(pg_temp.processo(nome_do_processo), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- A aprovação com a data, no meio do caminho (só se registra com o processo na Aprovação pelo setor).
create function pg_temp.aprovar(nome_do_processo text, dia date) returns void
language plpgsql as $$
begin
  perform pg_temp.mover(nome_do_processo, 'aprovacao_setor');
  insert into public.aprovacoes (processo_id, aprovada_em) values (pg_temp.processo(nome_do_processo), dia);
end $$;
grant execute on function pg_temp.aprovar(text, date) to authenticated;

-- Todos com a versão completa (a1); depois, cada um no estado do caso (a2).
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000055';
select pg_temp.claims('a2');
select pg_temp.mover('Pub', 'publicacao');
select pg_temp.mover('Perfis', 'publicacao');
select pg_temp.mover('Susp', 'publicacao');
select public.suspender_processo(pg_temp.processo('Susp'), 'Aguardando o setor');
select pg_temp.aprovar('Aprov', pg_temp.hoje() - 5);
select pg_temp.mover('Aprov', 'publicacao');
select public.mover_processo(pg_temp.processo('Conc'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
select public.mover_processo(pg_temp.processo('Corrige'), pg_temp.etapa('concluidos'), pg_temp.hoje() - 2, 'https://diario.exemplo/a');
select public.mover_processo(pg_temp.processo('Arq'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
select public.arquivar_processo(pg_temp.processo('Arq'));
select public.mover_processo(pg_temp.processo('ArqPub'), pg_temp.etapa('concluidos'), pg_temp.hoje() - 2);
select public.arquivar_processo(pg_temp.processo('ArqPub'));
select public.mover_processo(pg_temp.processo('Move'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');

-- ===== Registrar na Publicação =====
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pub'), pg_temp.hoje() - 1, 'https://diario.exemplo/p')$sql$,
  'integrante registra a publicação com o processo na Publicação');
insert into _tap (linha) select results_eq(
  $sql$select publicado_em, link_da_publicacao, etapa_atual_codigo from public.processos_com_andamento
    where id = pg_temp.processo('Pub')$sql$,
  $sql$values (pg_temp.hoje() - 1, 'https://diario.exemplo/p', 'publicacao')$sql$, 'a data e o link ficam no processo, que continua na Publicação');
insert into _tap (linha) select is((pg_temp.evento('Pub', 'registrar_publicacao')).autor_id::text,
  '00000000-0000-0000-0000-0000000000a2', 'registrar vira evento do processo, com o autor');
insert into _tap (linha) select is((pg_temp.evento('Pub', 'registrar_publicacao')).detalhes #>> '{depois,publicado_em}',
  (pg_temp.hoje() - 1)::text, 'o evento de registrar traz a data');

-- ===== Registrar em Concluídos sem publicação =====
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Conc'), pg_temp.hoje(), null)$sql$,
  'registrar em Concluídos sem publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select sem_publicacao, etapa_atual_codigo from public.processos_com_andamento where id = pg_temp.processo('Conc')$sql$,
  $sql$values (false, 'concluidos')$sql$, 'o processo deixa de ser "sem publicação" e continua em Concluídos');

-- ===== Corrigir =====
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Corrige'), pg_temp.hoje() - 1, 'https://novo.exemplo/b')$sql$,
  'corrigir a data e o link de uma publicação registrada é aceito');
insert into _tap (linha) select results_eq(
  $sql$select publicado_em, link_da_publicacao from public.processos_com_andamento where id = pg_temp.processo('Corrige')$sql$,
  $sql$values (pg_temp.hoje() - 1, 'https://novo.exemplo/b')$sql$, 'a correção troca a data e o link');
insert into _tap (linha) select is((pg_temp.evento('Corrige', 'corrigir_publicacao')).detalhes #>> '{antes,publicado_em}',
  (pg_temp.hoje() - 2)::text, 'corrigir vira evento com a data anterior no antes');

-- ===== Recusas =====
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Nini'), pg_temp.hoje(), null)$sql$,
  'P0001', 'publicacao_fora_da_etapa', 'em Não iniciados é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pub'), pg_temp.hoje() + 1, null)$sql$,
  'P0001', 'data_no_futuro:' || (pg_temp.hoje() + 1)::text, 'a data de amanhã é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Aprov'), pg_temp.hoje() - 6, null)$sql$,
  'P0001', 'publicacao_antes_da_aprovacao:' || (pg_temp.hoje() - 6)::text || ':' || (pg_temp.hoje() - 5)::text,
  'a data antes da aprovação é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pub'), null, null)$sql$,
  'P0001', 'data_da_publicacao_obrigatoria', 'sem data é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pub'), pg_temp.hoje(), 'ftp://diario.exemplo')$sql$,
  'P0001', 'link_invalido', 'o link fora de http(s) é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Pub'), pg_temp.hoje(), 'https://' || repeat('a', 493))$sql$,
  'P0001', 'link_invalido', 'o link de 501 caracteres é recusado');
select public.registrar_publicacao(pg_temp.processo('Aprov'), pg_temp.hoje() - 4, '   ');
insert into _tap (linha) select is((pg_temp.linha('Aprov')).link_da_publicacao, null, 'o link só com espaços vira nulo');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Aprov'), pg_temp.hoje() - 6, null)$sql$,
  'P0001', 'publicacao_antes_da_aprovacao:' || (pg_temp.hoje() - 6)::text || ':' || (pg_temp.hoje() - 5)::text,
  'corrigir para antes da aprovação também é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Susp'), pg_temp.hoje(), null)$sql$,
  'P0001', 'processo_parado:suspenso', 'o suspenso não registra a publicação');

-- ===== Arquivado =====
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('ArqPub'), pg_temp.hoje(), null)$sql$,
  'P0001', 'arquivado_ja_publicado', 'o arquivado com data não corrige a publicação');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Arq'), pg_temp.hoje() - 1, null)$sql$,
  'o arquivado sem data registra a publicação');
insert into _tap (linha) select results_eq(
  $sql$select arquivado_em is not null, sem_publicacao from public.processos_com_andamento where id = pg_temp.processo('Arq')$sql$,
  $sql$values (true, false)$sql$, 'e continua arquivado');

-- ===== O evento é o do movimento quando a data chega por mover_processo =====
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Move')::text
    and acao in ('registrar_publicacao', 'corrigir_publicacao')),
  0::bigint, 'mover para Concluídos com a explicação não gera evento de publicação');

-- ===== Perfis =====
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$, '42501', null, 'consulta não registra');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$,
  'P0001', 'registro_inexistente', 'inativo não registra');
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_publicacao(pg_temp.processo('Perfis'), pg_temp.hoje(), null)$sql$, 'administrador registra');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_publicacao('00000000-0000-0000-0000-000000000000', current_date, null)$sql$, '42501', null,
  'visitante não registra');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef and proname = 'registrar_publicacao'),
  0::bigint, 'registrar_publicacao não usa security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
