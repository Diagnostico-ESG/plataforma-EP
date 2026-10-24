-- Etapas protegidas (revisoes-aprovacao, ticket 01; ADR 0015): a Revisão interna, a Validação com o setor e a Aprovação
-- pelo setor não se desativam nem se excluem, e continuam se renomeando e se movendo. A conferência da versão completa ao
-- concluir a Validação com o setor saiu com o "concluir" (Andamento livre, processos-etapas 24, ADR 0023).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(11);

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

-- ===== Etapas protegidas (administrador a1) =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'desativar a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Validação com o setor', 'desativar a Validação com o setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'desativar a Aprovação pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'excluir a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Validação com o setor', 'excluir a Validação com o setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'excluir a Aprovação pelo setor é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna (EP)' where codigo = 'revisao_interna'$sql$,
  'renomear a Revisão interna continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'subir')$sql$,
  'mover a Validação com o setor continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'descer')$sql$,
  'mover de volta');
insert into _tap (linha) select is(
  (select count(*)::int from public.etapas where codigo in ('revisao_interna', 'revisao_setor', 'aprovacao_setor') and ativa), 3,
  'as três etapas continuam ativas');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna' where codigo = 'revisao_interna'$sql$, 'devolve o nome');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
