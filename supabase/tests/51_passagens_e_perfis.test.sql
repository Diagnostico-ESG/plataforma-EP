-- Andamento livre, quem pode o quê (processos-etapas, ticket 24; ADR 0022): uma célula da tabela da spec por teste,
-- com Administrador (a1), Integrante (a2), Consulta (a3), inativo (a4) e visitante. Passagens, mover, etiqueta,
-- responsável do processo, catálogo, a view com os campos novos e os eventos novos.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(48);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000051', 'T51', 'Setor Passagens');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000051', null, 'Macro Passagens');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000051', 'af000000-0000-0000-0000-000000000051', nome
from unnest(array['Admin', 'Integrante', 'Consulta', 'Inativo', 'Etiqueta']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000051' $$;
grant execute on function pg_temp.processo(text) to authenticated, anon;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated, anon;

create function pg_temp.aberta(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.passagens where processo_id = pg_temp.processo(nome_do_processo) and saiu_em is null $$;
grant execute on function pg_temp.aberta(text) to authenticated;

-- Os números lidos como dono do banco, fora da RLS de quem está sendo testado.
create function pg_temp.etiqueta(nome_do_processo text) returns text
language sql stable security definer as $$
  select etiqueta::text from public.passagens where processo_id = pg_temp.processo(nome_do_processo) and saiu_em is null $$;
grant execute on function pg_temp.etiqueta(text) to authenticated;
create function pg_temp.responsavel(nome_do_processo text) returns uuid
language sql stable security definer as $$ select responsavel_id from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.responsavel(text) to authenticated;
create function pg_temp.passagens_do_setor() returns bigint
language sql stable security definer as $$
  select count(*) from public.passagens where processo_id in (
    select id from public.processos where setor_id = '5f000000-0000-0000-0000-000000000051') $$;
grant execute on function pg_temp.passagens_do_setor() to authenticated;

-- Um movimento e uma troca de responsável feitos pelo administrador, para os eventos existirem.
set local role authenticated;
select pg_temp.claims('a1');
select public.mover_processo(pg_temp.processo('Etiqueta'), pg_temp.etapa('modelagem'));
update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Etiqueta');

-- ===== passagens: ler =====
insert into _tap (linha) select ok((select count(*) from public.passagens where processo_id = pg_temp.processo('Admin')) = 1,
  'administrador lê as passagens');
select pg_temp.claims('a2');
insert into _tap (linha) select ok((select count(*) from public.passagens where processo_id = pg_temp.processo('Admin')) = 1,
  'integrante lê as passagens');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.passagens where processo_id = pg_temp.processo('Admin')) = 1,
  'consulta lê as passagens');
select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.passagens), 0::bigint, 'inativo não lê as passagens');

-- ===== mover (pela função) =====
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_processo(pg_temp.processo('Admin'), pg_temp.etapa('revisao_interna'))$sql$, 'administrador move');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_processo(pg_temp.processo('Integrante'), pg_temp.etapa('revisao_interna'))$sql$, 'integrante move');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Consulta'), pg_temp.etapa('revisao_interna'))$sql$, '42501', null,
  'consulta não move');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Inativo'), pg_temp.etapa('revisao_interna'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não move (não enxerga o processo)');
insert into _tap (linha) select is(pg_temp.passagens_do_setor(), 8::bigint,
  'só os movimentos do administrador e do integrante abriram passagem (5 do cadastro + 3 movimentos)');

-- ===== passagens: alterar a etiqueta da passagem aberta =====
select pg_temp.claims('a1');
update public.passagens set etiqueta = 'em_andamento' where id = pg_temp.aberta('Etiqueta');
insert into _tap (linha) select is(pg_temp.etiqueta('Etiqueta'), 'em_andamento', 'administrador muda a etiqueta');
select pg_temp.claims('a2');
update public.passagens set etiqueta = 'concluido' where id = pg_temp.aberta('Etiqueta');
insert into _tap (linha) select is(pg_temp.etiqueta('Etiqueta'), 'concluido', 'integrante muda a etiqueta');
select pg_temp.claims('a3');
update public.passagens set etiqueta = 'a_fazer' where id = pg_temp.aberta('Etiqueta');
insert into _tap (linha) select is(pg_temp.etiqueta('Etiqueta'), 'concluido', 'consulta não muda a etiqueta');
select pg_temp.claims('a4');
update public.passagens set etiqueta = 'a_fazer' where processo_id = pg_temp.processo('Etiqueta');
insert into _tap (linha) select is(pg_temp.etiqueta('Etiqueta'), 'concluido', 'inativo não muda a etiqueta');

-- ===== passagens: incluir, apagar ou alterar outra coluna direto =====
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (processo_id, etapa_id) values (pg_temp.processo('Admin'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'passagem_so_pela_funcao', 'administrador não inclui passagem direto');
insert into _tap (linha) select throws_ok($sql$delete from public.passagens where id = pg_temp.aberta('Admin')$sql$,
  '42501', null, 'administrador não apaga passagem');
insert into _tap (linha) select throws_ok(
  $sql$update public.passagens set etapa_id = pg_temp.etapa('publicacao') where id = pg_temp.aberta('Admin')$sql$,
  '42501', null, 'administrador não muda a etapa da passagem direto');
insert into _tap (linha) select throws_ok($sql$update public.passagens set saiu_em = now() where id = pg_temp.aberta('Admin')$sql$,
  'P0001', 'passagem_so_pela_funcao', 'administrador não fecha a passagem direto');
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (processo_id, etapa_id) values (pg_temp.processo('Admin'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'passagem_so_pela_funcao', 'integrante não inclui passagem direto');
insert into _tap (linha) select throws_ok($sql$delete from public.passagens where id = pg_temp.aberta('Admin')$sql$,
  '42501', null, 'integrante não apaga passagem');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (processo_id, etapa_id) values (pg_temp.processo('Admin'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'passagem_so_pela_funcao', 'consulta não inclui passagem (o gatilho recusa antes da RLS)');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (processo_id, etapa_id) values (pg_temp.processo('Admin'), pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'passagem_so_pela_funcao', 'inativo não inclui passagem (o gatilho recusa antes da RLS)');

-- ===== processos: alterar responsavel_id =====
select pg_temp.claims('a1');
update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a1' where id = pg_temp.processo('Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Consulta'), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'administrador troca o responsável');
select pg_temp.claims('a2');
update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Consulta'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'integrante troca o responsável');
select pg_temp.claims('a3');
update public.processos set responsavel_id = null where id = pg_temp.processo('Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Consulta'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'consulta não troca o responsável');
select pg_temp.claims('a4');
update public.processos set responsavel_id = null where id = pg_temp.processo('Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Consulta'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'inativo não troca o responsável');

-- ===== etapas: criar, renomear, reordenar, desativar e apagar =====
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('etapa_t51', 'Etapa T51', 'V', pg_temp.etapa('publicacao'))$sql$,
  'administrador acrescenta etapa');
insert into _tap (linha) select lives_ok($sql$update public.etapas set nome = 'Etapa T51 nova' where codigo = 'etapa_t51'$sql$,
  'administrador renomeia');
insert into _tap (linha) select lives_ok($sql$select public.mover_etapa(pg_temp.etapa('etapa_t51'), 'subir')$sql$,
  'administrador reordena');
insert into _tap (linha) select lives_ok($sql$update public.etapas set ativa = false where codigo = 'etapa_t51'$sql$,
  'administrador desativa');
insert into _tap (linha) select lives_ok($sql$delete from public.etapas where codigo = 'etapa_t51'$sql$, 'administrador apaga');
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('etapa_t51b', 'Etapa T51b', 'V', pg_temp.etapa('publicacao'))$sql$, '42501', null,
  'integrante não acrescenta etapa');
update public.etapas set nome = 'Tentativa' where codigo = 'publicacao';
insert into _tap (linha) select isnt((select nome from public.etapas where codigo = 'publicacao'), 'Tentativa',
  'integrante não renomeia');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('etapa_t51c', 'Etapa T51c', 'V', pg_temp.etapa('publicacao'))$sql$, '42501', null,
  'consulta não acrescenta etapa');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_etapa('etapa_t51d', 'Etapa T51d', 'V', pg_temp.etapa('publicacao'))$sql$,
  'P0001', 'registro_inexistente', 'inativo não acrescenta etapa (não enxerga o catálogo)');

-- ===== processos_com_andamento: ler os campos novos =====
select pg_temp.claims('a1');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, etiqueta::text, entrou_na_etapa_em is not null, etapa_atual_posicao > 1, sem_publicacao
    from public.processos_com_andamento where id = pg_temp.processo('Admin')$sql$,
  $sql$values ('revisao_interna', 'a_fazer', true, true, false)$sql$, 'administrador lê os campos novos da view');
select pg_temp.claims('a2');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, etiqueta::text from public.processos_com_andamento where id = pg_temp.processo('Inativo')$sql$,
  $sql$values ('nao_iniciados', 'a_fazer')$sql$, 'integrante lê os campos novos da view');
select pg_temp.claims('a3');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, etiqueta::text, publicado_em, link_da_publicacao
    from public.processos_com_andamento where id = pg_temp.processo('Etiqueta')$sql$,
  $sql$values ('modelagem', 'concluido', null::date, null::text)$sql$, 'consulta lê os campos novos da view');
select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento), 0::bigint, 'inativo não lê a view');

-- ===== eventos de passagem e de responsável: ler =====
select pg_temp.claims('a1');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'passagem'
  and entidade_ref = pg_temp.processo('Etiqueta')::text) >= 1, 'administrador lê os eventos de passagem');
select pg_temp.claims('a2');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'processo' and acao = 'mudar_responsavel'
  and entidade_ref = pg_temp.processo('Etiqueta')::text) = 1, 'integrante lê o evento de responsável');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'passagem'
  and entidade_ref = pg_temp.processo('Etiqueta')::text) >= 1, 'consulta lê os eventos de passagem');
select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade in ('passagem', 'processo')), 0::bigint,
  'inativo não lê os eventos novos');

-- ===== visitante =====
reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.passagens$sql$, '42501', null,
  'visitante não lê as passagens');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não move');
insert into _tap (linha) select throws_ok($sql$update public.passagens set etiqueta = 'concluido'$sql$, '42501', null,
  'visitante não muda a etiqueta');
insert into _tap (linha) select throws_ok($sql$update public.processos set responsavel_id = null$sql$, '42501', null,
  'visitante não troca o responsável');
insert into _tap (linha) select throws_ok($sql$select etiqueta from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a view');

-- ===== estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef and proname = 'mover_processo'),
  0::bigint, 'mover_processo não usa security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
