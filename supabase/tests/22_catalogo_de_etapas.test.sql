-- Catálogo de etapas (processos-etapas, ticket 10; Andamento livre no ticket 24, ADR 0022): etapa nova, ordem,
-- desativar, reativar e excluir, os eventos e os perfis. A etapa nova não mexe em nenhum processo, e as recusas com
-- processo dentro e das etapas fixas estão no teste 54.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(37);

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

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.ordem(codigo_da_etapa text) returns int
language sql stable as $$ select ordem from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.ordem(text) to authenticated;

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

-- Ordens antes das mudanças.
create temp table _ordens as select codigo, ordem from public.etapas;
grant select on _ordens to authenticated;
create function pg_temp.ordem_antes(codigo_da_etapa text) returns int
language sql stable as $$ select ordem from _ordens where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.ordem_antes(text) to authenticated;

-- Daqui em diante, o administrador.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;

-- Etapa nova sem posição: entra logo antes de Concluídos.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_nova', 'Etapa Nova', 'VI', null)$sql$,
  'o administrador acrescenta uma etapa sem escolher a posição');
insert into _tap (linha) select is(pg_temp.ordem('teste_nova'), pg_temp.ordem_antes('concluidos'),
  'a etapa nova fica na posição de Concluídos');
insert into _tap (linha) select is(pg_temp.ordem('concluidos'), pg_temp.ordem_antes('concluidos') + 1,
  'Concluídos desce uma posição e continua a última');

-- Etapa nova antes da Modelagem piloto: abre espaço na ordem.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_antes', 'Etapa Nova Antes', 'VI', pg_temp.etapa('modelagem'))$sql$,
  'o administrador acrescenta uma etapa antes da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('teste_antes'), pg_temp.ordem_antes('modelagem'),
  'a etapa nova fica na posição da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('modelagem'), pg_temp.ordem_antes('modelagem') + 1,
  'a Modelagem piloto desce uma posição');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('teste_sem_lugar', 'Etapa Sem Lugar', 'VI', '00000000-0000-0000-0000-000000000000')$sql$,
  'P0001', 'registro_inexistente', 'acrescentar antes de uma etapa que não existe é recusado');

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

-- Desativar e reativar a etapa sem processo dentro.
insert into _tap (linha) select lives_ok($sql$update public.etapas set ativa = false where codigo = 'teste_nova'$sql$,
  'desativar etapa sem processo é aceito');
insert into _tap (linha) select lives_ok($sql$update public.etapas set ativa = true where codigo = 'teste_nova'$sql$,
  'reativar etapa é aceito');

-- Excluir a etapa por onde nenhum processo passou.
with apagadas as (delete from public.etapas where codigo = 'teste_antes' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 1, 'excluir etapa nunca usada a apaga');

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

-- Os outros perfis não mexem no catálogo. O inativo nem lê o catálogo: para ele, a etapa de referência não existe.
create function pg_temp.conferir_perfil(id_usuario text, quem text, recusa text) returns void
language plpgsql as $$
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  insert into _tap (linha) select throws_ok(
    $sql$select public.acrescentar_etapa('teste_outro', 'Etapa de Outro', 'VI', null)$sql$, recusa, null,
    quem || ' não acrescenta etapa');
  insert into _tap (linha) select throws_ok(
    $sql$select public.mover_etapa(pg_temp.etapa('publicacao'), 'subir')$sql$, recusa, null,
    quem || ' não move etapa');
  with alteradas as (update public.etapas set ativa = false where codigo = 'teste_nova' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não desativa etapa');
  reset role;
end $$;
grant execute on function pg_temp.conferir_perfil(text, text, text) to authenticated;

select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a2', 'Integrante', '42501');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a3', 'Consulta', '42501');
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
  $sql$select public.acrescentar_etapa('teste_visitante', 'Etapa do Visitante', 'VI', null)$sql$,
  '42501', null, 'Visitante não acrescenta etapa');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_etapa('00000000-0000-0000-0000-000000000000', 'subir')$sql$,
  '42501', null, 'Visitante não move etapa');
reset role;

-- As funções do catálogo rodam com a permissão de quem chama.
insert into _tap (linha) select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef and (n.nspname, p.proname) in (('public', 'acrescentar_etapa'), ('public', 'mover_etapa'),
      ('private', 'conferir_etapa_nunca_usada'), ('private', 'conferir_etapa_sem_processos'),
      ('private', 'bloquear_etapa_protegida'), ('private', 'conferir_fixas_nas_pontas'))),
  0, 'as funções do catálogo não são security definer');
insert into _tap (linha) select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (('public', 'acrescentar_etapa'), ('public', 'mover_etapa'),
      ('private', 'conferir_etapa_nunca_usada'), ('private', 'conferir_etapa_sem_processos'),
      ('private', 'bloquear_etapa_protegida'), ('private', 'conferir_fixas_nas_pontas'))),
  6, 'as seis funções do catálogo existem');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
