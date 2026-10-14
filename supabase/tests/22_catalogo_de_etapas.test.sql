-- Catálogo de etapas (processos-etapas, ticket 10; ADR 0004): etapa nova, ordem, desativar, reativar e excluir,
-- com os andamentos que cada mudança inclui ou apaga, os eventos e os perfis.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(49);

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

-- TC1 (ativo, com os processos) e TC2 (inativo: recebe as etapas do setor mesmo assim).
insert into public.setores (id, sigla, nome, ativo) values
  ('5c000000-0000-0000-0000-000000000001', 'TC1', 'Setor Catálogo Um', true),
  ('5c000000-0000-0000-0000-000000000002', 'TC2', 'Setor Catálogo Dois', false);
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

-- Quantos andamentos da etapa há no processo (ou no setor), em qualquer status ou só pendentes.
create function pg_temp.no_processo(nome_do_processo text, codigo_da_etapa text, so_pendentes boolean) returns int
language sql stable as $$ select count(*)::int from public.andamentos
  where processo_id = pg_temp.processo(nome_do_processo) and etapa_id = pg_temp.etapa(codigo_da_etapa)
    and (not so_pendentes or status = 'pendente') $$;
grant execute on function pg_temp.no_processo(text, text, boolean) to authenticated;

create function pg_temp.no_setor(sigla_do_setor text, codigo_da_etapa text) returns int
language sql stable as $$ select count(*)::int from public.andamentos a join public.setores s on s.id = a.setor_id
  where s.sigla = sigla_do_setor and a.etapa_id = pg_temp.etapa(codigo_da_etapa) and a.status = 'pendente' $$;
grant execute on function pg_temp.no_setor(text, text) to authenticated;

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

-- Preparação, como integrante: as etapas do setor resolvidas; "Pronto" com as etapas obrigatórias resolvidas
-- (situação calculada "concluido"); "Parado" suspenso e "Cancelado" cancelado.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a2');
set local role authenticated;
do $$
declare
  etapa record;
begin
  for etapa in select id from public.etapas where nivel = 'setor' and ativa order by ordem loop
    update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
      where setor_id = '5c000000-0000-0000-0000-000000000001' and etapa_id = etapa.id;
  end loop;
  for etapa in select id from public.etapas where nivel = 'processo' and ativa and obrigatoria order by ordem loop
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
  $sql$select public.acrescentar_etapa('teste_nova', 'Etapa Nova', 'processo', true, null)$sql$,
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

-- Etapa do setor antes da modelagem: abre espaço na ordem e entra em todos os setores, inclusive inativos.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_setor', 'Etapa Nova do Setor', 'setor', false, pg_temp.etapa('modelagem'))$sql$,
  'o administrador acrescenta uma etapa do setor antes da modelagem');
insert into _tap (linha) select is(pg_temp.ordem('teste_setor'), pg_temp.ordem_antes('modelagem'),
  'a etapa nova fica na posição da modelagem');
insert into _tap (linha) select is(pg_temp.ordem('modelagem'), pg_temp.ordem_antes('modelagem') + 1,
  'a modelagem desce uma posição');
insert into _tap (linha) select is(pg_temp.no_setor('TC1', 'teste_setor'), 1,
  'a etapa nova do setor entra pendente no setor ativo');
insert into _tap (linha) select is(pg_temp.no_setor('TC2', 'teste_setor'), 1,
  'a etapa nova do setor entra pendente no setor inativo');

-- Etapas do setor sempre antes das do processo.
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('teste_setor_fim', 'Etapa do Setor no Fim', 'setor', false, null)$sql$,
  'P0001', 'etapas_do_setor_primeiro', 'etapa do setor depois de uma do processo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_etapa(pg_temp.etapa('modelagem'), 'subir')$sql$,
  'P0001', 'etapas_do_setor_primeiro', 'subir uma etapa do processo acima de uma do setor é recusado');

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
create temp table _teste_setor as select id from public.etapas where codigo = 'teste_setor';
grant select on _teste_setor to authenticated;
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'modelagem'$sql$,
  'P0001', 'etapa_usada:Reunião de modelagem', 'excluir etapa usada é recusado');
with apagadas as (delete from public.etapas where codigo = 'teste_setor' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 1, 'excluir etapa nunca usada a apaga');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where etapa_id = (select id from _teste_setor)),
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
  'teste_setor', 'o evento da exclusão guarda a etapa excluída');
reset role;

-- Os outros perfis não mexem no catálogo.
create function pg_temp.conferir_perfil(id_usuario text, quem text, recusa_ao_mover text) returns void
language plpgsql as $$
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  insert into _tap (linha) select throws_ok(
    $sql$select public.acrescentar_etapa('teste_outro', 'Etapa de Outro', 'processo', false, null)$sql$,
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
