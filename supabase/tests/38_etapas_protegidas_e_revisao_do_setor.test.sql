-- Etapas protegidas e Revisão pelo setor com versão completa (revisoes-aprovacao, ticket 01, ADR 0015): as três etapas
-- de revisão e aprovação não se desativam nem se excluem, e concluir a Revisão pelo setor exige a versão mais recente
-- completa (.bpmn, .png e relatório).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(26);

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

-- Um setor, um macroprocesso e seis processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000038', 'T38', 'Setor Trava');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000038', null, 'Macro Trava');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000038', 'af000000-0000-0000-0000-000000000038', nome
from unnest(array['Sem Versao', 'Sem Relatorio', 'Sem Png', 'Completa', 'Nova Na Etapa', 'Realizada']) as nome;

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

create function pg_temp.responsavel(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select responsavel_id from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.responsavel(text, text) to authenticated;

create function pg_temp.escolher(nome_do_processo text, codigo_da_etapa text, usuario uuid) returns void
language sql as $$
  update public.andamentos set responsavel_id = usuario where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.escolher(text, text, uuid) to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.nome(usuario uuid) returns text
language sql stable as $$ select nome from public.usuarios where id = usuario $$;
grant execute on function pg_temp.nome(uuid) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpmn + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T38_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn'), pg_temp.arquivo('png', 'png')) $$;
-- Quem envia é quem está nas claims (o gatilho põe auth.uid() como autor); a função recusa um número diferente do
-- próximo (maior + 1), então o auxiliar o calcula.
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    null, pg_temp.par()) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

-- Leva o processo até a Revisão pelo setor em andamento (as etapas 1 a 3 resolvidas, como a2).
create function pg_temp.ate_a_revisao_do_setor(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_revisao_do_setor(text) to authenticated;

-- ===== Etapas protegidas (administrador a1) =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'desativar a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Revisão pelo setor', 'desativar a Revisão pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'desativar a Aprovação pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'excluir a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Revisão pelo setor', 'excluir a Revisão pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'excluir a Aprovação pelo setor é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna (EP)' where codigo = 'revisao_interna'$sql$,
  'renomear a Revisão interna continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'subir')$sql$,
  'mover a Revisão pelo setor continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'descer')$sql$,
  'mover de volta');
insert into _tap (linha) select is(
  (select count(*)::int from public.etapas where codigo in ('revisao_interna', 'revisao_setor', 'aprovacao_setor') and ativa), 3,
  'as três etapas continuam ativas');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna' where codigo = 'revisao_interna'$sql$, 'devolve o nome');

-- ===== Concluir a Revisão pelo setor (integrante a2) =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

-- Sem Versao: nenhuma versão.
select pg_temp.ate_a_revisao_do_setor('Sem Versao');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Versao', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'sem_versao', 'concluir a Revisão pelo setor sem versão é recusado');
insert into _tap (linha) select is(pg_temp.status('Sem Versao', 'revisao_setor'), 'em_andamento'::public.status_da_etapa,
  'a recusa deixa a etapa em andamento');

-- Sem Relatorio: a V1 tem .bpmn e .png, sem relatório.
select pg_temp.enviar('Sem Relatorio');
select pg_temp.ate_a_revisao_do_setor('Sem Relatorio');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Relatorio', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:1:relatorio', 'concluir com a versão sem relatório é recusado, com o que falta');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Sem Relatorio', 'revisao_setor'), 'concluir', null, null)$sql$,
  'P0001', 'versao_incompleta:1:relatorio', 'o avanço direto também é recusado');

-- Sem Png: a V1 perde o .png (apagado pelo dono do banco; a função de envio não deixa criar versão sem ele).
select pg_temp.enviar('Sem Png');
select pg_temp.ate_a_revisao_do_setor('Sem Png');
reset role;
delete from public.arquivos_da_versao
where papel = 'png' and versao_id = (select id from public.versoes where processo_id = pg_temp.processo('Sem Png'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Png', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:1:png,relatorio', 'concluir com a versão sem .png e sem relatório é recusado, com os dois');

-- Completa: a V1 recebe o relatório.
select pg_temp.enviar('Completa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Completa')), 1, pg_temp.arquivo('relatorio', 'docx'));
select pg_temp.ate_a_revisao_do_setor('Completa');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Completa', 'revisao_setor', 'concluida')$sql$, 'concluir com a versão completa é aceito');
insert into _tap (linha) select is(pg_temp.status('Completa', 'revisao_setor'), 'concluida'::public.status_da_etapa,
  'a Revisão pelo setor fica concluída');

-- Nova Na Etapa: a V1 completa, a V2 (enviada na própria etapa) sem relatório, depois com relatório.
select pg_temp.enviar('Nova Na Etapa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Nova Na Etapa') and numero = 1), 1,
  pg_temp.arquivo('relatorio', 'docx'));
select pg_temp.ate_a_revisao_do_setor('Nova Na Etapa');
select pg_temp.enviar('Nova Na Etapa');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Nova Na Etapa', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:2:relatorio', 'a V2 sem relatório barra, mesmo com a V1 completa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Nova Na Etapa') and numero = 2), 2,
  pg_temp.arquivo('relatorio', 'docx'));
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Nova Na Etapa', 'revisao_setor', 'concluida')$sql$,
  'com a V2 completa, enviada na própria etapa, concluir é aceito');

-- Realizada: "realizada anteriormente" não depende de versão.
select pg_temp.ate_a_revisao_do_setor('Realizada');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Realizada', 'revisao_setor', 'realizada_anteriormente', 'Feita antes')$sql$,
  'registrar como realizada anteriormente é aceito sem versão');
insert into _tap (linha) select is(pg_temp.status('Realizada', 'revisao_setor'), 'realizada_anteriormente'::public.status_da_etapa,
  'a etapa fica realizada anteriormente');

reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_conclusao_da_etapa' and tgrelid = 'public.andamentos'::regclass), 1,
  'existe o gatilho de conclusão em andamentos');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_etapa_protegida' and tgrelid = 'public.etapas'::regclass), 1,
  'existe o gatilho de etapa protegida em etapas');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'conferir_conclusao_da_etapa' and pronamespace = 'private'::regnamespace), false,
  'o gatilho de conclusão não é security definer');
insert into _tap (linha) select is(
  has_function_privilege('anon', 'private.papeis_que_faltam(uuid)', 'execute'), false,
  'o visitante não executa a função de papéis que faltam');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
