-- Sem etapas do setor (processos-etapas, ticket 12; ADR 0013): saem os andamentos de setor, o nível do catálogo e
-- "aguardando o setor"; o catálogo fica com 6 etapas, a primeira chamada Modelagem piloto, que inicia sem depender
-- do setor; os eventos antigos de andamento de setor continuam legíveis por todo perfil ativo.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(18);

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

-- Preparação como dono do banco: um setor e um macroprocesso novos, e um evento antigo de andamento de setor.
create temp table _antes as select count(*) as andamentos from public.andamentos;
insert into public.setores (id, sigla, nome) values ('5d000000-0000-0000-0000-000000000001', 'TSP', 'Setor Piloto');
insert into public.macroprocessos (id, codigo, nome) values ('ad000000-0000-0000-0000-000000000001', null, 'Macro Piloto');
insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes) values
  (null, 'iniciar', 'andamento', 'setor-antigo-e1:andamento-antigo-e1',
   '{"antes": {"setor_id": "setor-antigo-e1", "setor_sigla": "TRA", "etapa_nome": "Reunião de sensibilização",
     "status": "pendente"}, "depois": {"setor_id": "setor-antigo-e1", "setor_sigla": "TRA",
     "etapa_nome": "Reunião de sensibilização", "status": "em_andamento"}}');

create function pg_temp.eventos_antigos() returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade_ref = 'setor-antigo-e1:andamento-antigo-e1'
$$;
grant execute on function pg_temp.eventos_antigos() to authenticated;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

-- O que saiu do banco.
insert into _tap (linha) select hasnt_column('public', 'andamentos', 'setor_id', 'andamentos não tem setor_id');
insert into _tap (linha) select col_not_null('public', 'andamentos', 'processo_id', 'todo andamento é de um processo');
insert into _tap (linha) select hasnt_column('public', 'etapas', 'nivel', 'etapas não tem nivel');
insert into _tap (linha) select hasnt_type('public', 'nivel_da_etapa', 'o tipo nivel_da_etapa não existe');
insert into _tap (linha) select hasnt_column('public', 'processos_com_andamento', 'aguardando_o_setor',
  'a view não tem aguardando_o_setor');
insert into _tap (linha) select hasnt_trigger('public', 'setores', 'criar_andamentos_do_setor',
  'setor novo não tem gatilho de andamentos');
insert into _tap (linha) select hasnt_function('private', 'criar_andamentos_do_setor',
  'a função criar_andamentos_do_setor não existe');
insert into _tap (linha) select has_function('public', 'acrescentar_etapa', array['text', 'text', 'boolean', 'fase_do_regimento', 'uuid'],
  'acrescentar_etapa sem o nível');

-- O catálogo renumerado e renomeado.
insert into _tap (linha) select results_eq(
  $sql$select ordem, codigo, nome, obrigatoria from public.etapas order by ordem$sql$,
  $sql$values (1, 'modelagem', 'Modelagem piloto', true),
    (2, 'relatorio_modelagem_tecnica', 'Relatório e modelagem técnica', true),
    (3, 'revisao_interna', 'Revisão interna', true), (4, 'revisao_setor', 'Validação com o setor', true),
    (5, 'aprovacao_setor', 'Aprovação pelo setor', true), (6, 'publicacao', 'Publicação', false)$sql$,
  'o catálogo tem as 6 etapas, de 1 a 6, com a Modelagem piloto em primeiro');

-- Setor novo sem andamento; processo novo com 6 pendentes.
insert into _tap (linha) select is((select count(*) from public.andamentos), (select andamentos from _antes),
  'setor novo não ganha andamentos');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5d000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 'Piloto Um'),
  ('5d000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 'Piloto Dois');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos a join public.processos p on p.id = a.processo_id
    where p.nome = 'Piloto Um' and a.status = 'pendente'),
  6, 'processo novo nasce com 6 andamentos pendentes');

-- A Modelagem piloto começa sem o setor; a 2 com a 1 pendente é recusada.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento' where id = pg_temp.andamento('Piloto Um', 'modelagem')$sql$,
  'a Modelagem piloto de um processo novo inicia sem depender do setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('Piloto Dois', 'relatorio_modelagem_tecnica')$sql$,
  'P0001', 'anterior_nao_resolvida:Modelagem piloto', 'iniciar a 2 com a 1 pendente é recusado');
reset role;

-- Todo perfil ativo lê o evento antigo de andamento de setor.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'administrador lê o evento antigo de etapa do setor');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'integrante lê o evento antigo de etapa do setor');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'Consulta lê o evento antigo de etapa do setor');
reset role;

-- Inativo não lê.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 0::bigint, 'inativo não lê o evento antigo de etapa do setor');
reset role;

-- Visitante não chega aos eventos.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select 1 from public.eventos where entidade = 'andamento'$sql$, '42501', null,
  'visitante não lê os eventos de etapa');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
