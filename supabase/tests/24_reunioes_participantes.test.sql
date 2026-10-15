-- Reuniões (reunioes, ticket 03): participantes. Responsável do setor da reunião, trocar o setor, eventos com os
-- participantes, responsável excluído que vira outro participante e quem pode o quê nas tabelas de ligação.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(54);

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

-- PA1 e PA2 ativos; responsáveis inventados (Olga é do outro setor).
insert into public.setores (id, sigla, nome, ativo) values
  ('5f000000-0000-0000-0000-0000000000b1', 'PA1', 'Setor Participantes Um', true),
  ('5f000000-0000-0000-0000-0000000000b2', 'PA2', 'Setor Participantes Dois', true);
insert into public.responsaveis_do_setor (setor_id, nome) values
  ('5f000000-0000-0000-0000-0000000000b1', 'Ana Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Bia Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Caio Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Dani Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Edu Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Fabi Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Gil Teste'),
  ('5f000000-0000-0000-0000-0000000000b1', 'Zeca Teste'),
  ('5f000000-0000-0000-0000-0000000000b2', 'Olga Teste');

-- Os ids por nome, legíveis por todos os perfis (a1 a 4 são os usuários, os demais os responsáveis).
create temp table _pessoas (nome text primary key, id uuid not null);
grant all on _pessoas to anon, authenticated;
insert into _pessoas (nome, id)
  select nome, id from public.responsaveis_do_setor;
insert into _pessoas (nome, id) values
  ('a1', '00000000-0000-0000-0000-0000000000a1'), ('a2', '00000000-0000-0000-0000-0000000000a2'),
  ('a3', '00000000-0000-0000-0000-0000000000a3'), ('a4', '00000000-0000-0000-0000-0000000000a4');

create temp table _r (nome text primary key, id uuid);
grant all on _r to authenticated;

create function pg_temp.ids(nomes text[]) returns uuid[]
language sql stable as $$ select coalesce(array_agg(id order by nome), '{}') from _pessoas where nome = any (nomes) $$;
grant execute on function pg_temp.ids(text[]) to authenticated;

create function pg_temp.reuniao(nome_da_reuniao text) returns uuid
language sql stable as $$ select id from _r where nome = nome_da_reuniao $$;
grant execute on function pg_temp.reuniao(text) to authenticated;

-- Salva uma sensibilização (sem processos) com os participantes dados por nome.
create function pg_temp.salvar(p_id uuid, p_setor uuid, p_outros text[], p_usuarios text[], p_responsaveis text[])
returns uuid language sql as $$
  select public.salvar_reuniao(p_id, 'sensibilizacao', p_setor, '2026-11-10', null, null, null, p_outros, '{}',
    pg_temp.ids(p_usuarios), pg_temp.ids(p_responsaveis)) $$;
grant execute on function pg_temp.salvar(uuid, uuid, text[], text[], text[]) to authenticated;

create function pg_temp.eventos(nome_da_reuniao text, acao_do_evento text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'reuniao' and acao = acao_do_evento
    and entidade_ref = pg_temp.reuniao(nome_da_reuniao)::text $$;
grant execute on function pg_temp.eventos(text, text) to authenticated;

create function pg_temp.evento(nome_da_reuniao text, acao_do_evento text) returns jsonb
language sql stable as $$
  select detalhes from public.eventos where entidade = 'reuniao' and acao = acao_do_evento
    and entidade_ref = pg_temp.reuniao(nome_da_reuniao)::text order by id desc limit 1 $$;
grant execute on function pg_temp.evento(text, text) to authenticated;

-- Apaga a ligação de uma pessoa com a reunião base (c1) e devolve quantas linhas saíram.
create function pg_temp.apagar_usuario(nome_da_pessoa text) returns bigint
language plpgsql as $$
declare apagadas bigint;
begin
  with apagada as (delete from public.reunioes_usuarios
    where reuniao_id = 'ef000000-0000-0000-0000-0000000000c1'
      and usuario_id = (select id from _pessoas where nome = nome_da_pessoa) returning 1)
  select count(*) into apagadas from apagada;
  return apagadas;
end $$;
grant execute on function pg_temp.apagar_usuario(text) to authenticated;

create function pg_temp.apagar_responsavel(nome_da_pessoa text) returns bigint
language plpgsql as $$
declare apagadas bigint;
begin
  with apagada as (delete from public.reunioes_responsaveis
    where reuniao_id = 'ef000000-0000-0000-0000-0000000000c1'
      and responsavel_id = (select id from _pessoas where nome = nome_da_pessoa) returning 1)
  select count(*) into apagadas from apagada;
  return apagadas;
end $$;
grant execute on function pg_temp.apagar_responsavel(text) to authenticated;

-- Preparação como dono do banco: base (c1) com os usuários a1 a a4 e os responsáveis Ana a Edu ligados (leituras e
-- alvos de apagar); base2 (c2) sem ligações (alvo das inclusões). Os eventos adiados saem aqui, antes dos testes.
insert into public.reunioes (id, setor_id, tipo, data) values
  ('ef000000-0000-0000-0000-0000000000c1', '5f000000-0000-0000-0000-0000000000b1', 'sensibilizacao', '2026-09-01'),
  ('ef000000-0000-0000-0000-0000000000c2', '5f000000-0000-0000-0000-0000000000b1', 'sensibilizacao', '2026-09-02');
insert into public.reunioes_usuarios (reuniao_id, usuario_id)
  select 'ef000000-0000-0000-0000-0000000000c1', id from _pessoas where nome in ('a1', 'a2', 'a3', 'a4');
insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
  select 'ef000000-0000-0000-0000-0000000000c1', id from _pessoas
  where nome in ('Ana Teste', 'Bia Teste', 'Caio Teste', 'Dani Teste', 'Edu Teste');
set constraints all immediate;
set constraints all deferred;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Registrar com os três tipos de participante.
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'p1', pg_temp.salvar(null, '5f000000-0000-0000-0000-0000000000b1',
    array['Gil Externo', 'Hilda Externa'], array['a1', 'a2'], array['Ana Teste'])$sql$,
  'integrante registra reunião com usuários, responsável e outros participantes');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_usuarios where reuniao_id = pg_temp.reuniao('p1')), 2::bigint,
  'os dois usuários ficam ligados à reunião');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_responsaveis where reuniao_id = pg_temp.reuniao('p1')), 1::bigint,
  'o responsável do setor fica ligado à reunião');
insert into _tap (linha) select is(
  (select outros_participantes from public.reunioes where id = pg_temp.reuniao('p1')),
  array['Gil Externo', 'Hilda Externa'], 'os outros participantes ficam na ordem escrita');
insert into _tap (linha) select ok(
  jsonb_array_length(pg_temp.evento('p1', 'criar') -> 'depois' -> 'usuarios') = 2
  and jsonb_array_length(pg_temp.evento('p1', 'criar') -> 'depois' -> 'responsaveis') = 1,
  'o evento de criação traz os usuários e os responsáveis');

-- Responsável do setor da reunião.
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.salvar(null, '5f000000-0000-0000-0000-0000000000b1', '{}', '{}', array['Olga Teste'])$sql$,
  'P0001', 'responsavel_de_outro_setor:Olga Teste', 'responsável de outro setor é recusado');
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'troca', pg_temp.salvar(null, '5f000000-0000-0000-0000-0000000000b1', '{}', '{}',
    array['Ana Teste'])$sql$,
  'integrante registra uma reunião com a Ana');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.salvar(pg_temp.reuniao('troca'), '5f000000-0000-0000-0000-0000000000b2', '{}', '{}',
    array['Ana Teste'])$sql$,
  'P0001', 'responsavel_de_outro_setor:Ana Teste', 'trocar o setor mantendo responsável do setor antigo é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.salvar(pg_temp.reuniao('troca'), '5f000000-0000-0000-0000-0000000000b2', '{}', '{}', '{}')$sql$,
  'trocar o setor tirando o responsável na mesma gravação é aceito');

-- Eventos: um por gravação, com os participantes no antes e no depois.
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.salvar(pg_temp.reuniao('p1'), '5f000000-0000-0000-0000-0000000000b1',
    array['Gil Externo', 'Hilda Externa'], array['a1'], array['Ana Teste'])$sql$,
  'integrante tira um usuário da reunião');
insert into _tap (linha) select is(pg_temp.eventos('p1', 'editar'), 1::bigint,
  'trocar só os participantes gera um evento de alteração');
insert into _tap (linha) select ok(
  jsonb_array_length(pg_temp.evento('p1', 'editar') -> 'antes' -> 'usuarios') = 2
  and jsonb_array_length(pg_temp.evento('p1', 'editar') -> 'depois' -> 'usuarios') = 1,
  'o evento traz os usuários de antes e de depois');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.salvar(pg_temp.reuniao('p1'), '5f000000-0000-0000-0000-0000000000b1',
    array['Gil Externo', 'Hilda Externa'], array['a1'], array['Ana Teste'])$sql$,
  'salvar os mesmos participantes é aceito');
insert into _tap (linha) select is(pg_temp.eventos('p1', 'editar'), 1::bigint,
  'salvar os mesmos participantes não gera evento');

-- Responsável excluído: o nome fica nas reuniões em que esteve, como outro participante.
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'ex1', pg_temp.salvar(null, '5f000000-0000-0000-0000-0000000000b1', '{}', '{}',
    array['Zeca Teste', 'Ana Teste'])$sql$,
  'integrante registra a primeira reunião com o Zeca');
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'ex2', pg_temp.salvar(null, '5f000000-0000-0000-0000-0000000000b1', '{}', '{}',
    array['Zeca Teste'])$sql$,
  'integrante registra a segunda reunião com o Zeca');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.responsaveis_do_setor where nome = 'Zeca Teste'$sql$,
  'integrante exclui o responsável presente em duas reuniões');
set constraints all immediate;
set constraints all deferred;
insert into _tap (linha) select is(
  (select count(*) from public.reunioes where id in (pg_temp.reuniao('ex1'), pg_temp.reuniao('ex2'))
    and 'Zeca Teste' = any (outros_participantes)), 2::bigint,
  'o nome do responsável excluído ficou nas duas reuniões, como outro participante');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_responsaveis where reuniao_id in (pg_temp.reuniao('ex1'), pg_temp.reuniao('ex2'))),
  1::bigint, 'a ligação do responsável excluído saiu das duas; sobrou só a da Ana');
insert into _tap (linha) select is(pg_temp.eventos('ex1', 'editar'), 1::bigint,
  'a primeira reunião ganha um evento de alteração');
insert into _tap (linha) select is(pg_temp.eventos('ex2', 'editar'), 1::bigint,
  'a segunda reunião ganha um evento de alteração');
insert into _tap (linha) select ok(
  jsonb_array_length(pg_temp.evento('ex1', 'editar') -> 'antes' -> 'responsaveis') = 2
  and pg_temp.evento('ex1', 'editar') -> 'depois' -> 'outros_participantes' @> '["Zeca Teste"]'::jsonb,
  'o evento mostra o responsável no antes e o nome como outro participante no depois');

-- Quem pode o quê. Administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select ok((select count(*) from public.reunioes_usuarios) > 0,
  'administrador lê os usuários das reuniões');
insert into _tap (linha) select ok((select count(*) from public.reunioes_responsaveis) > 0,
  'administrador lê os responsáveis das reuniões');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.reunioes_usuarios (reuniao_id, usuario_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'a1'))$sql$,
  'administrador liga um usuário à reunião');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'Fabi Teste'))$sql$,
  'administrador liga um responsável à reunião');
insert into _tap (linha) select is(pg_temp.apagar_usuario('a1'), 1::bigint, 'administrador desliga um usuário da reunião');
insert into _tap (linha) select is(pg_temp.apagar_responsavel('Bia Teste'), 1::bigint,
  'administrador desliga um responsável da reunião');

-- Integrante do EP.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select ok((select count(*) from public.reunioes_usuarios) > 0,
  'integrante lê os usuários das reuniões');
insert into _tap (linha) select ok((select count(*) from public.reunioes_responsaveis) > 0,
  'integrante lê os responsáveis das reuniões');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.reunioes_usuarios (reuniao_id, usuario_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'a2'))$sql$,
  'integrante liga um usuário à reunião');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'Gil Teste'))$sql$,
  'integrante liga um responsável à reunião');
insert into _tap (linha) select is(pg_temp.apagar_usuario('a2'), 1::bigint, 'integrante desliga um usuário da reunião');
insert into _tap (linha) select is(pg_temp.apagar_responsavel('Caio Teste'), 1::bigint,
  'integrante desliga um responsável da reunião');
insert into _tap (linha) select throws_ok(
  $sql$update public.reunioes_usuarios set usuario_id = usuario_id$sql$, '42501', null,
  'a ligação de usuário não se altera, só se apaga e inclui');
insert into _tap (linha) select throws_ok(
  $sql$update public.reunioes_responsaveis set responsavel_id = responsavel_id$sql$, '42501', null,
  'a ligação de responsável não se altera, só se apaga e inclui');

-- Consulta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select ok((select count(*) from public.reunioes_usuarios) > 0,
  'consulta lê os usuários das reuniões');
insert into _tap (linha) select ok((select count(*) from public.reunioes_responsaveis) > 0,
  'consulta lê os responsáveis das reuniões');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_usuarios (reuniao_id, usuario_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'a3'))$sql$,
  '42501', null, 'consulta não liga usuário a reunião');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'Fabi Teste'))$sql$,
  '42501', null, 'consulta não liga responsável a reunião');
insert into _tap (linha) select is(pg_temp.apagar_usuario('a3'), 0::bigint, 'consulta não desliga usuário da reunião');
insert into _tap (linha) select is(pg_temp.apagar_responsavel('Dani Teste'), 0::bigint,
  'consulta não desliga responsável da reunião');

-- Inativo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is((select count(*) from public.reunioes_usuarios), 0::bigint,
  'inativo não lê os usuários das reuniões');
insert into _tap (linha) select is((select count(*) from public.reunioes_responsaveis), 0::bigint,
  'inativo não lê os responsáveis das reuniões');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_usuarios (reuniao_id, usuario_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'a4'))$sql$,
  '42501', null, 'inativo não liga usuário a reunião');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
    values ('ef000000-0000-0000-0000-0000000000c2', (select id from _pessoas where nome = 'Fabi Teste'))$sql$,
  '42501', null, 'inativo não liga responsável a reunião');
insert into _tap (linha) select is(pg_temp.apagar_usuario('a4'), 0::bigint, 'inativo não desliga usuário da reunião');
insert into _tap (linha) select is(pg_temp.apagar_responsavel('Edu Teste'), 0::bigint,
  'inativo não desliga responsável da reunião');

-- Visitante.
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.reunioes_usuarios$sql$, '42501', null,
  'visitante não lê os usuários das reuniões');
insert into _tap (linha) select throws_ok($sql$select count(*) from public.reunioes_responsaveis$sql$, '42501', null,
  'visitante não lê os responsáveis das reuniões');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_usuarios (reuniao_id, usuario_id) values
    ('ef000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a3')$sql$,
  '42501', null, 'visitante não liga usuário a reunião');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
    select 'ef000000-0000-0000-0000-0000000000c2', id from _pessoas where nome = 'Fabi Teste'$sql$,
  '42501', null, 'visitante não liga responsável a reunião');
insert into _tap (linha) select throws_ok($sql$delete from public.reunioes_usuarios$sql$, '42501', null,
  'visitante não desliga usuário da reunião');
insert into _tap (linha) select throws_ok($sql$delete from public.reunioes_responsaveis$sql$, '42501', null,
  'visitante não desliga responsável da reunião');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
