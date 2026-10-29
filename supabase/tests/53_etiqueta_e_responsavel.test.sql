-- Andamento livre, etiqueta e responsável do processo (processos-etapas, ticket 24; ADR 0022): a etiqueta só muda na
-- passagem aberta, preenche e esvazia concluido_em e fica fixa em Concluídos; uma só passagem aberta por processo; o
-- responsável é usuário ativo Administrador ou Integrante, com evento próprio; suspenso e cancelado congelam
-- os dois.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(28);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela. A
-- função desliga, só durante o movimento e com o dono do banco, as etapas com trava que ficam antes do destino.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid, p_data date default null, p_link text default null,
  p_explicacao text default null) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, p_data, p_link, p_explicacao);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid, date, text, text) to authenticated;

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, a5 segundo administrador (sem ele,
-- desativar o a1 seria recusado como último administrador num banco recém-resetado).
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador'),
  ('admin2.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000053', 'T53', 'Setor Etiqueta');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000053', null, 'Macro Etiqueta');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000053', 'af000000-0000-0000-0000-000000000053', nome
from unnest(array['Etiqueta', 'Concluido', 'Responsavel', 'Suspenso', 'Cancelado', 'Arquivado']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000053' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.aberta(nome_do_processo text) returns public.passagens
language sql stable as $$
  select * from public.passagens where processo_id = pg_temp.processo(nome_do_processo) and saiu_em is null $$;
grant execute on function pg_temp.aberta(text) to authenticated;

create function pg_temp.etiquetar(nome_do_processo text, nova text) returns void
language sql as $$
  update public.passagens set etiqueta = nova::public.etiqueta_da_etapa
  where processo_id = pg_temp.processo(nome_do_processo) and saiu_em is null $$;
grant execute on function pg_temp.etiquetar(text, text) to authenticated;

create function pg_temp.responsavel(nome_do_processo text, usuario uuid) returns void
language sql as $$ update public.processos set responsavel_id = usuario where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.responsavel(text, uuid) to authenticated;

create function pg_temp.nome(usuario text) returns text
language sql stable as $$ select nome from public.usuarios where id = ('00000000-0000-0000-0000-0000000000' || usuario)::uuid $$;
grant execute on function pg_temp.nome(text) to authenticated;

set local role authenticated;
select pg_temp.claims('a2');
select pg_temp.mover_sem_trava(pg_temp.processo(nome), pg_temp.etapa('modelagem'))
from unnest(array['Etiqueta', 'Responsavel', 'Suspenso', 'Cancelado']) as nome;
select pg_temp.mover_sem_trava(pg_temp.processo(nome), pg_temp.etapa('concluidos'), null, null, 'Não será publicado')
from unnest(array['Concluido', 'Arquivado']) as nome;

-- ===== Etiqueta =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.etiquetar('Etiqueta', 'concluido')$sql$,
  'marcar Concluído na passagem aberta é aceito');
insert into _tap (linha) select ok((pg_temp.aberta('Etiqueta')).concluido_em is not null, 'Concluído preenche concluido_em');
insert into _tap (linha) select lives_ok($sql$select pg_temp.etiquetar('Etiqueta', 'em_andamento')$sql$,
  'voltar de Concluído para Em andamento é aceito');
insert into _tap (linha) select results_eq(
  $sql$select (pg_temp.aberta('Etiqueta')).etiqueta::text, (pg_temp.aberta('Etiqueta')).concluido_em$sql$,
  $sql$values ('em_andamento', null::timestamptz)$sql$, 'sair de Concluído esvazia concluido_em');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, responsavel_id::text, entrou_na_etapa_em = (pg_temp.aberta('Etiqueta')).entrou_em
    from public.processos_com_andamento where id = pg_temp.processo('Etiqueta')$sql$,
  $sql$values ('modelagem', '00000000-0000-0000-0000-0000000000a2', true)$sql$,
  'mudar a etiqueta não muda a etapa, o responsável nem a entrada na etapa');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'etiqueta', detalhes->'depois'->>'etiqueta', detalhes->'depois'->>'etapa_codigo', autor_id::text
    from public.eventos where entidade = 'passagem' and acao = 'mudar_etiqueta'
      and entidade_ref = pg_temp.processo('Etiqueta')::text order by id$sql$,
  $sql$values ('a_fazer', 'concluido', 'modelagem', '00000000-0000-0000-0000-0000000000a2'),
    ('concluido', 'em_andamento', 'modelagem', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'cada mudança de etiqueta vira um evento, com a etapa');
select pg_temp.etiquetar('Etiqueta', 'em_andamento');
insert into _tap (linha) select is((select count(*) from public.eventos where acao = 'mudar_etiqueta'
  and entidade_ref = pg_temp.processo('Etiqueta')::text), 2::bigint, 'gravar a mesma etiqueta não vira evento');
select pg_temp.mover_sem_trava(pg_temp.processo('Etiqueta'), pg_temp.etapa('revisao_interna'));
insert into _tap (linha) select throws_ok(
  $sql$update public.passagens set etiqueta = 'concluido'
    where processo_id = pg_temp.processo('Etiqueta') and saiu_em is not null$sql$,
  'P0001', 'passagem_fechada', 'mudar a etiqueta de uma passagem fechada é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.etiquetar('Concluido', 'em_andamento')$sql$,
  'P0001', 'etiqueta_fixa_em_concluidos', 'mudar a etiqueta em Concluídos é recusado');
insert into _tap (linha) select results_eq(
  $sql$select (pg_temp.aberta('Concluido')).etiqueta::text, (pg_temp.aberta('Concluido')).concluido_em is not null$sql$,
  $sql$values ('concluido', true)$sql$, 'em Concluídos a etiqueta é Concluído, com a data');
insert into _tap (linha) select throws_ok($sql$select pg_temp.etiquetar('Etiqueta', 'pronto')$sql$,
  '22P02', null, 'etiqueta que não existe é recusada');

-- ===== Uma só passagem aberta =====
reset role;
select set_config('ep.movendo_processo', 'mover', true);
insert into _tap (linha) select throws_ok(
  $sql$insert into public.passagens (processo_id, etapa_id) values (pg_temp.processo('Etiqueta'), pg_temp.etapa('publicacao'))$sql$,
  '23505', null, 'uma segunda passagem aberta no mesmo processo é recusada');
select set_config('ep.movendo_processo', '', true);
set local role authenticated;

-- ===== Responsável =====
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.responsavel('Responsavel', '00000000-0000-0000-0000-0000000000a3')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a3'), 'um usuário Consulta como responsável é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.responsavel('Responsavel', '00000000-0000-0000-0000-0000000000a4')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a4'), 'um usuário inativo como responsável é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.responsavel('Responsavel', '00000000-0000-0000-0000-0000000000a1')$sql$, 'um administrador ativo é aceito');
insert into _tap (linha) select lives_ok($sql$select pg_temp.responsavel('Responsavel', null)$sql$, 'ficar sem responsável é aceito');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'responsavel_nome', detalhes->'depois'->>'responsavel_nome', autor_id::text
    from public.eventos where entidade = 'processo' and acao = 'mudar_responsavel'
      and entidade_ref = pg_temp.processo('Responsavel')::text order by id$sql$,
  $sql$values (pg_temp.nome('a2'), pg_temp.nome('a1'), '00000000-0000-0000-0000-0000000000a2'),
    (pg_temp.nome('a1'), null, '00000000-0000-0000-0000-0000000000a2')$sql$,
  'cada troca de responsável vira um evento do processo, com o nome de antes e de depois');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo' and acao = 'editar'
  and entidade_ref = pg_temp.processo('Responsavel')::text), 0::bigint, 'a troca não gera também um evento de edição');
select pg_temp.responsavel('Responsavel', '00000000-0000-0000-0000-0000000000a1');
reset role;
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a1';
set local role authenticated;
insert into _tap (linha) select lives_ok($sql$update public.processos set nome = 'Outra' where id = pg_temp.processo('Responsavel')$sql$,
  'o responsável desativado depois continua no processo, e a edição é aceita');

-- ===== Suspenso e cancelado congelam; o concluído segue as regras de Concluídos =====
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');
insert into _tap (linha) select throws_ok($sql$select pg_temp.etiquetar('Suspenso', 'em_andamento')$sql$,
  'P0001', 'processo_parado:suspenso', 'o suspenso não muda a etiqueta');
insert into _tap (linha) select throws_ok($sql$select pg_temp.responsavel('Suspenso', null)$sql$,
  'P0001', 'processo_parado:suspenso', 'o suspenso não muda o responsável');
insert into _tap (linha) select throws_ok($sql$select pg_temp.etiquetar('Cancelado', 'em_andamento')$sql$,
  'P0001', 'processo_parado:cancelado', 'o cancelado não muda a etiqueta');
insert into _tap (linha) select throws_ok($sql$select pg_temp.responsavel('Cancelado', null)$sql$,
  'P0001', 'processo_parado:cancelado', 'o cancelado não muda o responsável');
insert into _tap (linha) select throws_ok($sql$select pg_temp.etiquetar('Arquivado', 'em_andamento')$sql$,
  'P0001', 'etiqueta_fixa_em_concluidos', 'o concluído que estava arquivado tem a etiqueta fixa, como qualquer concluído');
insert into _tap (linha) select lives_ok($sql$select pg_temp.responsavel('Arquivado', null)$sql$,
  'o concluído que estava arquivado muda o responsável');
insert into _tap (linha) select lives_ok($sql$select public.retomar_processo(pg_temp.processo('Suspenso'), 'Voltou')$sql$,
  'retomar o suspenso é aceito');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, etiqueta::text, responsavel_id::text from public.processos_com_andamento
    where id = pg_temp.processo('Suspenso')$sql$,
  $sql$values ('modelagem', 'a_fazer', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'o processo retomado continua com a etapa, a etiqueta e o responsável de antes');
insert into _tap (linha) select lives_ok($sql$select pg_temp.etiquetar('Suspenso', 'em_andamento')$sql$,
  'e volta a mudar a etiqueta');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
