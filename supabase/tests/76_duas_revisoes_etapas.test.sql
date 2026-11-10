-- Duas revisões, a etapa (revisoes-aprovacao, ticket 07; ADR 0046): a Revisão interna passa a se chamar Revisão do
-- fluxograma; a Revisão do relatório entra logo depois dela, na fase VI, sem responsável inicial, de campos próprios (não
-- se desativa nem se exclui; o Administrador renomeia e reordena); versão em sequência e relatório se enviam até ela e são
-- recusados da Validação com o setor em diante. O registro da revisão é do teste 77.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(19);

-- Trava de arquivos (ticket 11): este teste não prova a trava (ela é do 59), então move sem ela.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, null, null, null);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid) to authenticated;

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000076', 'T76', 'Setor Duas Revisoes');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000076', null, 'Macro Duas Revisoes');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000076', 'af000000-0000-0000-0000-000000000076', nome
from unnest(array['No Relatorio', 'Na Validacao']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000076' $$;
create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.ordem(codigo_da_etapa text) returns int
language sql stable as $$ select ordem from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select pg_temp.mover_sem_trava(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T76_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
-- A versão seguinte (maior + 1), só com o .bpm.
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'))) $$;
-- O relatório sozinho, na versão mais recente, com o próximo número do processo.
create function pg_temp.enviar_relatorio(nome_do_processo text) returns uuid
language sql as $$
  select public.enviar_relatorio(pg_temp.processo(nome_do_processo),
    (select max(numero) from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and not historica),
    (select coalesce(max(a.numero_do_relatorio), 0) + 1 from public.arquivos_da_versao a
      join public.versoes v on v.id = a.versao_id where v.processo_id = pg_temp.processo(nome_do_processo)),
    pg_temp.arquivo('relatorio', 'docx')) $$;
create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.processo(text), pg_temp.etapa(text), pg_temp.ordem(text), pg_temp.mover(text, text),
  pg_temp.arquivo(text, text), pg_temp.enviar(text), pg_temp.enviar_relatorio(text), pg_temp.claims(text) to authenticated;

-- ===== O catálogo =====
insert into _tap (linha) select is((select nome from public.etapas where codigo = 'revisao_interna'), 'Revisão do fluxograma',
  'a Revisão interna passa a se chamar Revisão do fluxograma');
insert into _tap (linha) select results_eq(
  $sql$select nome, fase::text, ativa, responsavel_inicial_id is null from public.etapas where codigo = 'revisao_relatorio'$sql$,
  $sql$values ('Revisão do relatório', 'VI', true, true)$sql$,
  'a Revisão do relatório existe, ativa, na fase VI e sem responsável inicial');
insert into _tap (linha) select is(pg_temp.ordem('revisao_relatorio'), pg_temp.ordem('revisao_interna') + 1,
  'a Revisão do relatório vem logo depois da Revisão do fluxograma');
insert into _tap (linha) select ok(pg_temp.ordem('revisao_relatorio') < pg_temp.ordem('revisao_setor'),
  'a Revisão do relatório vem antes da Validação com o setor');

-- ===== Administrador: renomeia e reordena; não desativa nem exclui =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão do relatório (teste)' where codigo = 'revisao_relatorio'$sql$,
  'o administrador renomeia a Revisão do relatório');
update public.etapas set nome = 'Revisão do relatório' where codigo = 'revisao_relatorio';
insert into _tap (linha) select lives_ok($sql$select public.mover_etapa(pg_temp.etapa('revisao_relatorio'), 'descer')$sql$,
  'o administrador reordena a Revisão do relatório');
select public.mover_etapa(pg_temp.etapa('revisao_relatorio'), 'subir');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_relatorio'$sql$,
  'P0001', 'etapa_protegida:Revisão do relatório', 'desativar a Revisão do relatório é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_relatorio'$sql$,
  'P0001', 'etapa_protegida:Revisão do relatório', 'excluir a Revisão do relatório é recusado');
reset role;

-- ===== Os outros perfis não renomeiam nem reordenam =====
create function pg_temp.conferir_perfil(usuario text, quem text, recusa text) returns void
language plpgsql as $$
begin
  perform pg_temp.claims(usuario);
  set local role authenticated;
  with alteradas as (update public.etapas set nome = 'Outro nome' where codigo = 'revisao_relatorio' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não renomeia a Revisão do relatório');
  insert into _tap (linha) select throws_ok(
    $sql$select public.mover_etapa(pg_temp.etapa('revisao_relatorio'), 'descer')$sql$, recusa, null,
    quem || ' não reordena a Revisão do relatório');
  reset role;
end $$;
grant execute on function pg_temp.conferir_perfil(text, text, text) to authenticated;
select pg_temp.conferir_perfil('a2', 'Integrante', '42501');
select pg_temp.conferir_perfil('a3', 'Consulta', '42501');
-- O inativo nem lê o catálogo: para ele, a etapa não existe.
select pg_temp.conferir_perfil('a4', 'Inativo', 'P0001');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_etapa('00000000-0000-0000-0000-000000000000', 'descer')$sql$,
  '42501', null, 'Visitante não reordena etapa');
reset role;

-- ===== Até onde se envia =====
select pg_temp.claims('a2');
set local role authenticated;
select pg_temp.mover('No Relatorio', 'revisao_relatorio');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar('No Relatorio')$sql$,
  'a versão em sequência se envia na Revisão do relatório');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar_relatorio('No Relatorio')$sql$,
  'o relatório se envia na Revisão do relatório');
select pg_temp.mover('Na Validacao', 'revisao_relatorio');
select pg_temp.enviar('Na Validacao');
select pg_temp.mover('Na Validacao', 'revisao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar('Na Validacao')$sql$,
  'P0001', 'versao_fora_da_etapa', 'a versão em sequência é recusada na Validação com o setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.enviar_relatorio('Na Validacao')$sql$,
  'P0001', 'relatorio_fora_da_etapa', 'o relatório é recusado na Validação com o setor');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
