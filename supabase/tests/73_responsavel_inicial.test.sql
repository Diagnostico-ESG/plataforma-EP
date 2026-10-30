-- Responsável inicial por etapa (funcionalidade 17 de processos-etapas; ADR 0036): só o Administrador ativo define o
-- responsável inicial de cada etapa (recusa Consulta, inativo, inexistente e qualquer valor em Concluídos; aceita em Não
-- iniciados); mover, cadastrar e retomar põem o responsável inicial válido da etapa, ou ninguém; quem move não vira
-- responsável; mover para a própria etapa não muda nada; trocar o responsável inicial não mexe nos processos; a troca
-- entra no histórico da etapa com os nomes.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(34);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, a5 segundo administrador
-- (desativado no meio do teste), a6 integrante (passa a Consulta no meio do teste).
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador'),
  ('admin2.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante2.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a6', 'integrante2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000073', 'T73', 'Setor Responsável Inicial');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000073', null, 'Macro Responsável Inicial');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', nome
from unnest(array['Anda', 'Sem', 'Inativo', 'Perfil', 'Conc', 'Mesma', 'RetS', 'RetC', 'RetSem', 'RetIgual']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000073' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.nome(usuario text) returns text
language sql stable as $$ select nome from public.usuarios where id = ('00000000-0000-0000-0000-0000000000' || usuario)::uuid $$;
grant execute on function pg_temp.nome(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.responsavel(nome_do_processo text) returns text
language sql stable as $$ select responsavel_id::text from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.responsavel(text) to authenticated;

create function pg_temp.assumir(nome_do_processo text, usuario text) returns void
language sql as $$
  update public.processos set responsavel_id = ('00000000-0000-0000-0000-0000000000' || usuario)::uuid
  where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.assumir(text, text) to authenticated;

-- Grava o responsável inicial; devolve quantas linhas a RLS deixou mudar.
create function pg_temp.inicial(codigo_da_etapa text, usuario uuid) returns integer
language plpgsql as $$
declare
  linhas integer;
begin
  update public.etapas set responsavel_inicial_id = usuario where codigo = codigo_da_etapa;
  get diagnostics linhas = row_count;
  return linhas;
end $$;
grant execute on function pg_temp.inicial(text, uuid) to authenticated;

create function pg_temp.eventos_de_responsavel(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'mudar_responsavel'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.eventos_de_responsavel(text) to authenticated;

-- ===== Quem altera =====
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is(pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a2'), 1,
  'o administrador ativo define o responsável inicial de uma etapa');
insert into _tap (linha) select is((select responsavel_inicial_id::text from public.etapas where codigo = 'modelagem'),
  '00000000-0000-0000-0000-0000000000a2', 'e a escolha fica gravada');
select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'o integrante do EP não altera o responsável inicial');
select pg_temp.claims('a3');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'a Consulta não altera o responsável inicial');
select pg_temp.claims('a4');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'o administrador inativo não altera o responsável inicial');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set responsavel_inicial_id = '00000000-0000-0000-0000-0000000000a1' where codigo = 'publicacao'$sql$,
  '42501', null, 'o visitante sem login não altera o responsável inicial');
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is((select responsavel_inicial_id from public.etapas where codigo = 'publicacao'), null::uuid,
  'nenhuma dessas tentativas gravou');

-- ===== O que o banco recusa e aceita =====
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a3')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a3'), 'usuário Consulta como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a4')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a4'), 'usuário inativo como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000ff')$sql$,
  'P0001', 'responsavel_invalido:00000000-0000-0000-0000-0000000000ff', 'usuário inexistente como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('concluidos', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'P0001', 'responsavel_inicial_em_concluidos', 'qualquer valor em Concluídos é recusado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.inicial('concluidos', null)$sql$, 'Concluídos aceita ficar sem ninguém');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.inicial('nao_iniciados', '00000000-0000-0000-0000-0000000000a2')$sql$, 'Não iniciados aceita o responsável inicial');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a2')$sql$, 'gravar o mesmo valor é aceito');
-- As etapas do restante do teste: Revisão interna com a5 e Revisão do setor com a6 (válidos agora; deixam de ser adiante).
select pg_temp.inicial('revisao_interna', '00000000-0000-0000-0000-0000000000a5');
select pg_temp.inicial('revisao_setor', '00000000-0000-0000-0000-0000000000a6');
select pg_temp.inicial('nao_iniciados', null);

-- ===== Mover =====
select pg_temp.mover('Anda', 'modelagem');
insert into _tap (linha) select is(pg_temp.responsavel('Anda'), '00000000-0000-0000-0000-0000000000a2',
  'mover põe o responsável inicial da etapa de destino, e quem moveu (a1) não vira responsável');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'responsavel_id', detalhes->'depois'->>'responsavel_id', autor_id::text from public.eventos
    where entidade = 'passagem' and acao = 'mover' and entidade_ref = pg_temp.processo('Anda')::text$sql$,
  $sql$values (null::text, '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'o evento do movimento guarda o responsável de antes e o de depois, e quem moveu como autor');
select pg_temp.mover('Anda', 'publicacao');
insert into _tap (linha) select is(pg_temp.responsavel('Anda'), null,
  'mover para etapa sem responsável inicial deixa o processo sem responsável');

reset role;
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a5';
update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a6';
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Inativo', 'revisao_interna')$sql$,
  'mover nunca falha porque o responsável inicial ficou inativo');
insert into _tap (linha) select is(pg_temp.responsavel('Inativo'), null, 'e o processo fica sem responsável');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Perfil', 'revisao_setor')$sql$,
  'mover nunca falha porque o responsável inicial passou a Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Perfil'), null, 'e o processo fica sem responsável');

select pg_temp.mover('Conc', 'modelagem');
select public.mover_processo(pg_temp.processo('Conc'), pg_temp.etapa('concluidos'), null, null, 'Sem publicação');
insert into _tap (linha) select is(pg_temp.responsavel('Conc'), null, 'mover para Concluídos deixa o processo sem responsável');

select pg_temp.mover('Mesma', 'modelagem');
select pg_temp.assumir('Mesma', 'a1');
select pg_temp.mover('Mesma', 'modelagem');
insert into _tap (linha) select is(pg_temp.responsavel('Mesma'), '00000000-0000-0000-0000-0000000000a1',
  'mover para a própria etapa não muda o responsável');
insert into _tap (linha) select is((select count(*) from public.passagens where processo_id = pg_temp.processo('Mesma')), 2::bigint,
  'nem abre passagem');
insert into _tap (linha) select lives_ok($sql$select pg_temp.assumir('Mesma', 'a2')$sql$, 'assumir e a troca manual continuam aceitos');

-- ===== Cadastrar =====
select pg_temp.inicial('nao_iniciados', '00000000-0000-0000-0000-0000000000a2');
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', 'Novo');
insert into _tap (linha) select is(pg_temp.responsavel('Novo'), '00000000-0000-0000-0000-0000000000a2',
  'o processo cadastrado entra com o responsável inicial de Não iniciados');
select pg_temp.inicial('nao_iniciados', null);
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', 'Novo sem');
insert into _tap (linha) select is(pg_temp.responsavel('Novo sem'), null, 'sem responsável inicial em Não iniciados, o cadastrado fica sem');

-- ===== Retomar =====
select pg_temp.mover(nome, 'modelagem') from unnest(array['RetS', 'RetC', 'RetIgual']) as nome;
select pg_temp.mover('RetSem', 'publicacao');
select pg_temp.assumir(nome, 'a1') from unnest(array['RetS', 'RetC', 'RetSem']) as nome;
select public.suspender_processo(pg_temp.processo(nome), 'Aguardando') from unnest(array['RetS', 'RetSem', 'RetIgual']) as nome;
select public.cancelar_processo(pg_temp.processo('RetC'), 'Desistiu');
create temp table _antes as select pg_temp.eventos_de_responsavel('RetIgual') as eventos;
select public.retomar_processo(pg_temp.processo(nome), 'Voltou') from unnest(array['RetS', 'RetC', 'RetSem', 'RetIgual']) as nome;
insert into _tap (linha) select is(pg_temp.responsavel('RetS'), '00000000-0000-0000-0000-0000000000a2',
  'retomar o suspenso põe o responsável inicial da etapa atual');
insert into _tap (linha) select is(pg_temp.responsavel('RetC'), '00000000-0000-0000-0000-0000000000a2',
  'retomar o cancelado também');
insert into _tap (linha) select is(pg_temp.responsavel('RetSem'), null, 'retomar em etapa sem responsável inicial deixa o processo sem responsável');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.responsavel('RetIgual'), pg_temp.eventos_de_responsavel('RetIgual')$sql$,
  $sql$select '00000000-0000-0000-0000-0000000000a2', (select eventos from _antes)$sql$,
  'retomar sem mudança de responsável não registra nada a mais');
insert into _tap (linha) select results_eq(
  $sql$select autor_id::text, detalhes->'antes'->>'responsavel_nome', detalhes->'depois'->>'responsavel_nome' from public.eventos
    where entidade = 'processo' and acao = 'mudar_responsavel' and entidade_ref = pg_temp.processo('RetS')::text
    order by id desc limit 1$sql$,
  $sql$values ('00000000-0000-0000-0000-0000000000a1', pg_temp.nome('a1'), pg_temp.nome('a2'))$sql$,
  'a troca do retomar entra no histórico do processo, com quem retomou como autor');

-- ===== Trocar o responsável inicial não mexe nos processos, e o histórico da etapa guarda os nomes =====
select pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a1');
insert into _tap (linha) select is(pg_temp.responsavel('RetS'), '00000000-0000-0000-0000-0000000000a2',
  'trocar o responsável inicial não muda os processos que já estão na etapa');
insert into _tap (linha) select results_eq(
  $sql$select acao, detalhes->'antes'->>'responsavel_inicial_nome', detalhes->'depois'->>'responsavel_inicial_nome'
    from public.eventos where entidade = 'etapa' and entidade_ref = pg_temp.etapa('modelagem')::text order by id desc limit 1$sql$,
  $sql$values ('editar', pg_temp.nome('a2'), pg_temp.nome('a1'))$sql$,
  'a troca entra no histórico da etapa como edição, com o nome de antes e o de depois');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
