-- ENSAIO TEMPORÁRIO (ticket 12): a migração dentro da transação desfeita no fim; apagar depois.
-- Catálogo de etapas (processos-etapas, ticket 10; ADR 0004): etapa nova, ordem, desativar, reativar e excluir,
-- com os andamentos que cada mudança inclui ou apaga, os eventos e os perfis.
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
insert into _tap (linha) select plan(46);

-- Os eventos anteriores ao teste não contam (o banco de desenvolvimento pode já ter eventos do catálogo).
create temp table _inicio as select coalesce(max(id), 0) as ultimo_evento from public.eventos;
grant select on _inicio to authenticated;

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
-- O inativo é administrador de propósito: a recusa dele só pode vir de estar inativo.
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

-- TC1, com os processos.
insert into public.setores (id, sigla, nome, ativo) values
  ('5c000000-0000-0000-0000-000000000001', 'TC1', 'Setor Catálogo Um', true);
insert into public.macroprocessos (id, codigo, nome) values
  ('ac000000-0000-0000-0000-000000000001', null, 'Macro Catálogo');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5c000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'Andando'),
  ('5c000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'Parado'),
  ('5c000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'Cancelado'),
  ('5c000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'Pronto');

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos
  where nome = nome_do_processo and setor_id = '5c000000-0000-0000-0000-000000000001' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.ordem(codigo_da_etapa text) returns int
language sql stable as $$ select ordem from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.ordem(text) to authenticated;

-- Quantos andamentos da etapa há no processo, em qualquer status ou só pendentes.
create function pg_temp.no_processo(nome_do_processo text, codigo_da_etapa text, so_pendentes boolean) returns int
language sql stable as $$ select count(*)::int from public.andamentos
  where processo_id = pg_temp.processo(nome_do_processo) and etapa_id = pg_temp.etapa(codigo_da_etapa)
    and (not so_pendentes or status = 'pendente') $$;
grant execute on function pg_temp.no_processo(text, text, boolean) to authenticated;

-- Eventos do catálogo gravados neste teste.
create function pg_temp.eventos(acao_do_evento text) returns int
language sql stable as $$ select count(*)::int from public.eventos
  where entidade = 'etapa' and acao = acao_do_evento and id > (select ultimo_evento from _inicio) $$;
grant execute on function pg_temp.eventos(text) to authenticated;

create function pg_temp.entrar(id_usuario text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
end $$;
grant execute on function pg_temp.entrar(text) to authenticated;

-- Preparação, como integrante: "Pronto" com as etapas obrigatórias resolvidas
-- (situação calculada "concluido"); "Parado" suspenso e "Cancelado" cancelado.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a2');
set local role authenticated;
do $$
declare
  etapa record;
begin
  for etapa in select id from public.etapas where ativa and obrigatoria order by ordem loop
    update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
      where processo_id = pg_temp.processo('Pronto') and etapa_id = etapa.id;
  end loop;
end $$;
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Não será mapeado');
reset role;

-- Ordens antes das mudanças.
create temp table _ordens as select codigo, ordem from public.etapas;
grant select on _ordens to authenticated;
create function pg_temp.ordem_antes(codigo_da_etapa text) returns int
language sql stable as $$ select ordem from _ordens where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.ordem_antes(text) to authenticated;

-- Daqui em diante, o administrador.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;

-- Etapa nova no fim: entra pendente nos processos em andamento e suspensos, não nos concluídos e cancelados.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_nova', 'Etapa Nova', true, null)$sql$,
  'o administrador acrescenta uma etapa no fim');
insert into _tap (linha) select is(pg_temp.ordem('teste_nova'), (select max(ordem) from _ordens) + 1,
  'a etapa nova fica no fim da ordem');
insert into _tap (linha) select is(pg_temp.no_processo('Andando', 'teste_nova', true), 1,
  'a etapa nova entra pendente no processo em andamento');
insert into _tap (linha) select is(pg_temp.no_processo('Parado', 'teste_nova', true), 1,
  'a etapa nova entra pendente no processo suspenso');
insert into _tap (linha) select is(pg_temp.no_processo('Pronto', 'teste_nova', false), 0,
  'a etapa nova não entra no processo concluído');
insert into _tap (linha) select is(pg_temp.no_processo('Cancelado', 'teste_nova', false), 0,
  'a etapa nova não entra no processo cancelado');

-- Etapa nova antes da Modelagem piloto: abre espaço na ordem e entra pendente nos processos.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_antes', 'Etapa Nova Antes', false, pg_temp.etapa('modelagem'))$sql$,
  'o administrador acrescenta uma etapa antes da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('teste_antes'), pg_temp.ordem_antes('modelagem'),
  'a etapa nova fica na posição da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('modelagem'), pg_temp.ordem_antes('modelagem') + 1,
  'a Modelagem piloto desce uma posição');
insert into _tap (linha) select is(pg_temp.no_processo('Andando', 'teste_antes', true), 1,
  'a etapa nova entra pendente no processo em andamento');

-- Subir troca com a vizinha; na ponta nada muda; sentido inválido é recusado.
select public.mover_etapa(pg_temp.etapa('revisao_setor'), 'subir');
insert into _tap (linha) select is(pg_temp.ordem('revisao_setor'), pg_temp.ordem_antes('revisao_interna') + 1,
  'subir leva a etapa à posição da vizinha de cima');
insert into _tap (linha) select is(pg_temp.ordem('revisao_interna'), pg_temp.ordem_antes('revisao_setor') + 1,
  'a vizinha de cima desce');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas order by ordem limit 1), 'subir')$sql$,
  'subir a primeira etapa não muda nada');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_etapa(pg_temp.etapa('revisao_setor'), 'pular')$sql$,
  'P0001', 'sentido_invalido:pular', 'sentido inválido é recusado');

-- Desativar apaga os pendentes e mantém os resolvidos; reativar recria onde falta.
update public.etapas set ativa = false where codigo = 'modelagem';
insert into _tap (linha) select is(pg_temp.no_processo('Andando', 'modelagem', false), 0,
  'desativar apaga o andamento pendente');
insert into _tap (linha) select is(pg_temp.no_processo('Pronto', 'modelagem', false), 1,
  'desativar mantém o andamento resolvido');
update public.etapas set ativa = true where codigo = 'modelagem';
insert into _tap (linha) select is(pg_temp.no_processo('Andando', 'modelagem', true), 1,
  'reativar recria o pendente no processo em andamento');
insert into _tap (linha) select is(pg_temp.no_processo('Pronto', 'modelagem', false), 1,
  'reativar não duplica onde a etapa já foi usada');
insert into _tap (linha) select is(pg_temp.no_processo('Cancelado', 'modelagem', false), 0,
  'reativar não recria no processo cancelado');

-- Excluir: a usada é recusada; a nunca usada leva os pendentes junto (o id é guardado antes).
reset role;
create temp table _teste_antes as select id from public.etapas where codigo = 'teste_antes';
grant select on _teste_antes to authenticated;
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'modelagem'$sql$,
  'P0001', 'etapa_usada:Modelagem piloto', 'excluir etapa usada é recusado');
with apagadas as (delete from public.etapas where codigo = 'teste_antes' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 1, 'excluir etapa nunca usada a apaga');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where etapa_id = (select id from _teste_antes)),
  0, 'os pendentes da etapa excluída somem com ela');

-- Andamento não se cria direto, nem pelo administrador.
insert into _tap (linha) select throws_ok(
  $sql$insert into public.andamentos (etapa_id, processo_id) values (pg_temp.etapa('publicacao'), pg_temp.processo('Pronto'))$sql$,
  '42501', null, 'o administrador não cria andamento direto');

-- Eventos.
update public.etapas set nome = 'Etapa Nova Renomeada' where codigo = 'teste_nova';
update public.etapas set nome = 'Etapa Nova Renomeada' where codigo = 'teste_nova';
insert into _tap (linha) select is(pg_temp.eventos('acrescentar'), 2, 'cada etapa acrescentada gera um evento');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'nome' from public.eventos where entidade = 'etapa' and acao = 'acrescentar'
    and entidade_ref = pg_temp.etapa('teste_nova')::text),
  'Etapa Nova', 'o evento de acrescentar traz o nome da etapa');
insert into _tap (linha) select is(pg_temp.eventos('mudar_ordem'), 1,
  'só a etapa movida gera evento de ordem (nem a vizinha nem o espaço aberto)');
insert into _tap (linha) select is(pg_temp.eventos('desativar'), 1, 'desativar gera um evento');
insert into _tap (linha) select is(pg_temp.eventos('reativar'), 1, 'reativar gera um evento');
insert into _tap (linha) select is(pg_temp.eventos('editar'), 1, 'editar gera um evento, e salvar sem mudar não');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'codigo' from public.eventos where entidade = 'etapa' and acao = 'excluir'
    and id > (select ultimo_evento from _inicio)),
  'teste_antes', 'o evento da exclusão guarda a etapa excluída');
reset role;

-- Os outros perfis não mexem no catálogo.
create function pg_temp.conferir_perfil(id_usuario text, quem text, recusa_ao_mover text) returns void
language plpgsql as $$
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  insert into _tap (linha) select throws_ok(
    $sql$select public.acrescentar_etapa('teste_outro', 'Etapa de Outro', false, null)$sql$,
    '42501', null, quem || ' não acrescenta etapa');
  insert into _tap (linha) select throws_ok(
    $sql$select public.mover_etapa(pg_temp.etapa('publicacao'), 'subir')$sql$, recusa_ao_mover, null,
    quem || ' não move etapa');
  with alteradas as (update public.etapas set ativa = false where codigo = 'publicacao' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não desativa etapa');
  reset role;
end $$;
grant execute on function pg_temp.conferir_perfil(text, text, text) to authenticated;

select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a2', 'Integrante', '42501');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a3', 'Consulta', '42501');
-- O inativo nem lê o catálogo: para ele, a etapa a mover não existe.
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'P0001');

-- Integrante não exclui etapa (nem a nunca usada).
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a2');
set local role authenticated;
with apagadas as (delete from public.etapas where codigo = 'teste_nova' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 0, 'Integrante não exclui etapa');
reset role;

-- Quem lê os eventos do catálogo: todo perfil ativo.
create function pg_temp.eventos_lidos(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  select count(*)::int into total from public.eventos where entidade = 'etapa';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_lidos(text) to authenticated;
insert into _tap (linha) select ok(pg_temp.eventos_lidos('00000000-0000-0000-0000-0000000000a3') > 0,
  'Consulta lê os eventos do catálogo');
insert into _tap (linha) select is(pg_temp.eventos_lidos('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos do catálogo');

-- Visitante.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('teste_visitante', 'Etapa do Visitante', 'processo', false, null)$sql$,
  '42501', null, 'Visitante não acrescenta etapa');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_etapa('00000000-0000-0000-0000-000000000000', 'subir')$sql$,
  '42501', null, 'Visitante não move etapa');
reset role;

-- As funções do catálogo rodam com a permissão de quem chama (critério 2).
insert into _tap (linha) select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef and (n.nspname, p.proname) in (('public', 'acrescentar_etapa'), ('public', 'mover_etapa'),
      ('private', 'sincronizar_andamentos_da_etapa'), ('private', 'conferir_etapa_nunca_usada'),
      ('private', 'incluir_andamentos_pendentes'), ('private', 'apagar_andamentos_pendentes'))),
  0, 'as funções do catálogo não são security definer');
insert into _tap (linha) select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (('public', 'acrescentar_etapa'), ('public', 'mover_etapa'),
      ('private', 'sincronizar_andamentos_da_etapa'), ('private', 'conferir_etapa_nunca_usada'),
      ('private', 'incluir_andamentos_pendentes'), ('private', 'apagar_andamentos_pendentes'))),
  6, 'as seis funções do catálogo existem');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
