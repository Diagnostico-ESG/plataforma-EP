-- ENSAIO TEMPORÁRIO (ticket 12): a migração dentro da transação desfeita no fim; apagar depois.
-- Voltar a uma etapa, corrigir datas e mudar o responsável da etapa (processos-etapas, ticket 06):
-- função de voltar (processo e setor), datas, responsável, perfis e eventos.
begin;
-- Processos e etapas, ticket 12 (Simplificação, ADR 0013): saem as etapas do setor, a coluna "aguardando o setor" e o
-- nível do catálogo; a primeira etapa vira Modelagem piloto. Destrutiva: apaga os andamentos de setor e as três etapas
-- de nível setor (só dados inventados do desenvolvimento). Os eventos antigos de andamento de setor ficam, legíveis
-- pela política "eventos: perfil ativo lê as etapas", que esta migração não toca.

-- A view lê o que sai; ela volta no fim, sem "aguardando o setor" (create or replace view não tira coluna).
drop view public.processos_com_andamento;

-- Apagar, renumerar e renomear é mudança de estrutura, não ação de alguém: com os gatilhos desligados só neste trecho,
-- nenhum evento de catálogo nasce (os andamentos das etapas apagadas saem antes, então a trava de etapa usada não falta).
set local session_replication_role = replica;
delete from public.andamentos where processo_id is null;
delete from public.etapas where nivel = 'setor';
update public.etapas e set ordem = n.nova
from (select id, row_number() over (order by ordem)::int as nova from public.etapas) n
where n.id = e.id and e.ordem <> n.nova;
update public.etapas set nome = 'Modelagem piloto' where codigo = 'modelagem';
set local session_replication_role = origin;

-- Setor novo não ganha mais andamentos.
drop trigger criar_andamentos_do_setor on public.setores;
drop function private.criar_andamentos_do_setor();

-- Todo andamento é de um processo. Apagar setor_id leva a referência, a chave (etapa, setor), os dois índices do setor
-- e o privilégio de coluna.
alter table public.andamentos drop constraint andamentos_um_dono;
alter table public.andamentos alter column processo_id set not null;
alter table public.andamentos drop column setor_id;

-- Sem nível, a ordem entre níveis não existe mais.
drop trigger conferir_ordem_dos_niveis on public.etapas;
drop function private.conferir_ordem_dos_niveis();

-- Processo novo nasce com todas as etapas ativas (versão anterior: 20261014130147_processos).
create or replace function private.criar_andamentos_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.andamentos (etapa_id, processo_id)
  select id, new.id from public.etapas where ativa;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- A primeira etapa (Modelagem piloto) sai de pendente sem conferir nada; as outras pedem a anterior resolvida
-- (versões anteriores: 20261014135657_andamento_do_processo).
create or replace function private.conferir_sequencia_do_processo(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if found and anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

create or replace function private.conferir_sequencia(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.status = 'em_andamento' then
    perform private.conferir_uma_em_andamento(andamento);
  end if;
  perform private.conferir_sequencia_do_processo(andamento);
end $$;

drop function private.conferir_setor_resolvido(uuid), private.conferir_anterior_resolvida(public.andamentos);

-- O evento do andamento é sempre do processo (versões anteriores: andamento_do_processo e voltar_datas_responsavel).
create or replace function private.base_do_evento_do_andamento(andamento public.andamentos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_id', p.id, 'processo_nome', p.nome, 'setor_sigla', s.sigla,
    'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
  from public.processos p join public.setores s on s.id = p.setor_id, public.etapas e
  where p.id = andamento.processo_id and e.id = andamento.etapa_id $$;

create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  com_responsavel boolean := old.responsavel_id is not null or new.responsavel_id is not null;
  antes jsonb := base || private.estado_do_andamento(old, com_responsavel);
  depois jsonb := base || private.estado_do_andamento(new, com_responsavel);
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') else new.nota end;
begin
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old, new), 'andamento',
    new.processo_id::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', motivo));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Voltar: as seguintes do mesmo processo (versão anterior: voltar_datas_responsavel).
create or replace function private.devolver_etapas_seguintes(escolhido public.andamentos) returns void
language sql set search_path = ''
as $$
  update public.andamentos a set status = 'pendente', nota = null, iniciada_em = null, resolvida_em = null
  from public.etapas e, public.etapas da_escolhida
  where e.id = a.etapa_id and da_escolhida.id = escolhido.etapa_id
    and a.processo_id = escolhido.processo_id
    and e.ordem > da_escolhida.ordem and a.status <> 'pendente' $$;

-- A etapa nova (ou reativada) entra só nos processos em andamento e suspensos não concluídos (versão anterior:
-- catalogo_de_etapas).
create or replace function private.incluir_andamentos_pendentes(etapa public.etapas) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  insert into public.andamentos (etapa_id, processo_id)
  select etapa.id, p.id from public.processos_com_andamento p
  where p.situacao in ('em_andamento', 'suspenso')
    and not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.processo_id = p.id);
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

-- O evento da etapa sem o nível; os eventos antigos ficam com ele.
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome,
  'obrigatoria', etapa.obrigatoria, 'ativa', etapa.ativa, 'ordem', etapa.ordem) $$;

-- Acrescentar etapa sem o nível: apagada e recriada com a assinatura nova e os mesmos privilégios.
drop function public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid);
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_obrigatoria boolean, p_antes_de uuid)
  returns uuid
language plpgsql set search_path = ''
as $$
declare
  posicao integer := (select ordem from public.etapas where id = p_antes_de);
  nova uuid;
begin
  if p_antes_de is not null and posicao is null then
    raise exception 'registro_inexistente';
  end if;
  posicao := coalesce(posicao, (select coalesce(max(ordem), 0) + 1 from public.etapas));
  perform set_config('ep.etapa_movida', 'nenhuma', true);
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, obrigatoria)
  values (p_codigo, btrim(p_nome), posicao, p_obrigatoria) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

revoke execute on function public.acrescentar_etapa(text, text, boolean, uuid) from public, anon;
grant execute on function public.acrescentar_etapa(text, text, boolean, uuid) to authenticated;

alter table public.etapas drop column nivel;
drop type public.nivel_da_etapa;

-- A view do Quadro e do painel, sem "aguardando o setor". Fora isso, igual à da migração data_da_reuniao.
create view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.obrigatoria and a.status in ('pendente', 'em_andamento')
  ) then 'concluido' else p.situacao::text end as situacao,
  atual.etapa_id as etapa_atual_id, atual.codigo as etapa_atual_codigo, atual.nome as etapa_atual_nome,
  atual.ordem as etapa_atual_ordem,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento')
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(35);

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

-- Um setor, um macroprocesso e três processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000006', 'TS6', 'Setor Volta');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000006', null, 'Macro Volta');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Volta'),
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Datas'),
  ('5f000000-0000-0000-0000-000000000006', 'af000000-0000-0000-0000-000000000006', 'Processo Concluido');

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
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

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Preparação: "Processo Volta" com a 1 e a 2 concluídas.
select pg_temp.agir('Processo Volta', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Volta', 'modelagem', 'concluida');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'em_andamento');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'concluida');
select pg_temp.agir('Processo Volta', 'revisao_interna', 'em_andamento');
select pg_temp.agir('Processo Volta', 'revisao_interna', 'concluida');

-- Voltar à 4 com a 5 e a 6 concluídas.
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), 'Mudou o escopo')$sql$,
  'voltar à etapa 4 com a 5 e a 6 concluídas');
insert into _tap (linha) select is(pg_temp.status('Processo Volta', 'modelagem'), 'em_andamento'::public.status_da_etapa,
  'a etapa escolhida volta a em andamento');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where id in (
    pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), pg_temp.andamento('Processo Volta', 'revisao_interna'))
    and status = 'pendente'), 2, 'as seguintes resolvidas voltam a pendente');
insert into _tap (linha) select ok(
  (select iniciada_em = current_date and resolvida_em is null from public.andamentos
    where id = pg_temp.andamento('Processo Volta', 'modelagem')),
  'a escolhida mantém o início e perde a conclusão');
insert into _tap (linha) select ok(
  (select bool_and(iniciada_em is null and resolvida_em is null) from public.andamentos
    where id in (pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), pg_temp.andamento('Processo Volta', 'revisao_interna'))),
  'as seguintes ficam sem datas');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'voltar' and entidade = 'andamento'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Volta') || ':%'),
  3, 'um evento de voltar por andamento alterado');
insert into _tap (linha) select is(
  (select detalhes ->> 'motivo' from public.eventos where acao = 'voltar' and entidade = 'andamento'
    and entidade_ref like (select id::text from public.processos where nome = 'Processo Volta') || ':%' limit 1),
  'Mudou o escopo', 'o evento traz o motivo');

-- Voltar com a etapa seguinte em andamento: só uma fica em andamento.
select pg_temp.agir('Processo Volta', 'modelagem', 'concluida');
select pg_temp.agir('Processo Volta', 'relatorio_modelagem_tecnica', 'em_andamento');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), 'Refazer')$sql$,
  'voltar à 4 com a 5 em andamento');
insert into _tap (linha) select is(pg_temp.status('Processo Volta', 'relatorio_modelagem_tecnica'), 'pendente'::public.status_da_etapa,
  'a seguinte em andamento volta a pendente');

-- Recusas.
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), '  ')$sql$, 'P0001', 'motivo_obrigatorio',
  'voltar sem motivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'modelagem'), null)$sql$, 'P0001', 'motivo_obrigatorio',
  'voltar com motivo nulo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Volta', 'relatorio_modelagem_tecnica'), 'Motivo')$sql$,
  'P0001', 'etapa_nao_resolvida:Relatório e modelagem técnica', 'voltar a uma etapa que não está resolvida é recusado');

-- O processo concluído deixa de ser concluído ao voltar.
select pg_temp.agir('Processo Concluido', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Processo Concluido', 'aprovacao_setor', 'realizada_anteriormente', 'Feita antes');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Concluido'), 'concluido',
  'com as obrigatórias resolvidas o processo é concluído');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Concluido', 'revisao_interna'), 'Faltou revisar')$sql$,
  'voltar numa etapa do processo concluído');
insert into _tap (linha) select is(
  (select situacao from public.processos_com_andamento where nome = 'Processo Concluido'), 'em_andamento',
  'voltar tira o processo de concluído');

-- Datas: nunca no futuro; conclusão nunca antes do início.
select pg_temp.agir('Processo Datas', 'modelagem', 'em_andamento');
select pg_temp.agir('Processo Datas', 'modelagem', 'concluida');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set iniciada_em = %L where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
    current_date + 1), 'P0001', 'data_no_futuro:' || (current_date + 1)::text, 'início no futuro é recusado');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set resolvida_em = %L where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
    current_date + 1), 'P0001', 'data_no_futuro:' || (current_date + 1)::text, 'conclusão no futuro é recusada');
insert into _tap (linha) select throws_ok(
  format($sql$update public.andamentos set iniciada_em = %L, resolvida_em = %L
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, current_date, current_date - 1),
  'P0001', 'resolvida_antes_do_inicio:' || (current_date - 1)::text || ':' || current_date::text,
  'conclusão antes do início é recusada');
insert into _tap (linha) select lives_ok(
  format($sql$update public.andamentos set iniciada_em = %L, resolvida_em = %L
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, current_date - 3, current_date - 1),
  'corrigir início e conclusão');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  1, 'corrigir as datas gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'resolvida_em' from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  (current_date - 1)::text, 'o evento traz a data nova');
update public.andamentos set iniciada_em = iniciada_em where id = pg_temp.andamento('Processo Datas', 'modelagem');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'corrigir_datas'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  1, 'gravar sem mudar nada não gera evento');

-- Responsável: só usuário ativo Administrador ou Integrante.
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a3'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a3'),
  'responsável de perfil Consulta é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a4'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'P0001', 'responsavel_invalido:' || (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a4'),
  'responsável inativo é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, 'responsável Integrante aceito');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a1'
    where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$, 'responsável Administrador aceito');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'mudar_responsavel'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text),
  2, 'cada troca de responsável gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'responsavel_nome' from public.eventos where acao = 'mudar_responsavel'
    and entidade_ref like '%:' || pg_temp.andamento('Processo Datas', 'modelagem')::text order by id desc limit 1),
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a1'),
  'o evento traz o nome do responsável');
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set responsavel_id = null where id = pg_temp.andamento('Processo Datas', 'modelagem')$sql$,
  'tirar o responsável é aceito');

-- Perfis: Consulta e inativo não alteram; visitante nem tenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
with alterados as (update public.andamentos set iniciada_em = current_date - 5
  where id = pg_temp.andamento('Processo Datas', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não corrige datas');
with alterados as (update public.andamentos set responsavel_id = '00000000-0000-0000-0000-0000000000a2'
  where id = pg_temp.andamento('Processo Datas', 'modelagem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alterados), 0, 'Consulta não muda o responsável');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Datas', 'modelagem'), 'Tentativa')$sql$, '42501', null,
  'Consulta não volta a etapa');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Processo Datas', 'modelagem'), 'Tentativa')$sql$,
  'P0001', 'registro_inexistente', 'Inativo não volta a etapa (não lê nada, a etapa "não existe" para ele)');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa('00000000-0000-0000-0000-000000000000', 'Tentativa')$sql$, '42501', null,
  'visitante não volta a etapa');

reset role;
-- A função não é security definer: a RLS de quem chama decide.
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'voltar_a_etapa' and pronamespace = 'public'::regnamespace), false,
  'voltar_a_etapa não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
