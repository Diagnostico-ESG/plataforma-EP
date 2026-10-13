-- Macroprocessos: quem pode o quê, regras do nome e do código, e eventos (cadastros-basicos, ticket 03).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(48);

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

-- Macroprocesso inventado que todos tentam ler, alterar e apagar.
insert into public.macroprocessos (nome) values ('Macroprocesso Fixo de Teste');

-- Administrador e integrante: leem, criam, alteram os campos editáveis e apagam; id e criado_em, ninguém.
create function pg_temp.conferir_quem_altera(id_usuario text, quem text, codigo_novo text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.macroprocessos where nome = 'Macroprocesso Fixo de Teste'), 1,
    quem || ' lê os macroprocessos');
  insert into _tap (linha) select lives_ok(
    format('insert into public.macroprocessos (nome, codigo) values (%L, %L)', 'Macro de ' || quem, codigo_novo),
    quem || ' cria macroprocesso');
  with alteradas as (
    update public.macroprocessos set nome = 'Macro alterado por ' || quem, codigo = codigo_novo || 'X',
      descricao = 'Descrição inventada', categoria = 'apoio', ativo = false
    where codigo = codigo_novo returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 1,
    quem || ' altera código, nome, descrição, categoria e ativo');
  insert into _tap (linha) select throws_ok(
    $sql$update public.macroprocessos set id = gen_random_uuid() where nome = 'Macroprocesso Fixo de Teste'$sql$,
    '42501', null, quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.macroprocessos set criado_em = now() - interval '1 day'
      where nome = 'Macroprocesso Fixo de Teste'$sql$, '42501', null, quem || ' não altera criado_em');
  with apagadas as (delete from public.macroprocessos where codigo = codigo_novo || 'X' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 1, quem || ' apaga macroprocesso');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_altera(text, text, text) to authenticated;

-- Consulta e inativo: não criam, não alteram, não apagam; o inativo também não lê.
create function pg_temp.conferir_quem_nao_altera(id_usuario text, quem text, visiveis int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.macroprocessos where nome = 'Macroprocesso Fixo de Teste'), visiveis,
    quem || case when visiveis = 1 then ' lê os macroprocessos' else ' não lê os macroprocessos' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.macroprocessos (nome) values ('Macro Proibido')$sql$, '42501', null,
    quem || ' não cria macroprocesso');
  with alteradas as (
    update public.macroprocessos set nome = 'Trocado' where nome = 'Macroprocesso Fixo de Teste' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera macroprocesso');
  insert into _tap (linha) select throws_ok(
    $sql$update public.macroprocessos set id = gen_random_uuid() where nome = 'Macroprocesso Fixo de Teste'$sql$,
    '42501', null, quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.macroprocessos set criado_em = now() - interval '1 day'
      where nome = 'Macroprocesso Fixo de Teste'$sql$, '42501', null, quem || ' não altera criado_em');
  with apagadas as (delete from public.macroprocessos where nome = 'Macroprocesso Fixo de Teste' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não apaga macroprocesso');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_altera(text, text, int) to authenticated;

select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'ADM');
select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'INT');
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a3', 'Consulta', 1);
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a4', 'Inativo', 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.macroprocessos', '42501', null,
  'Visitante não lê os macroprocessos');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.macroprocessos (nome) values ('Macro Proibido')$sql$, '42501', null,
  'Visitante não cria macroprocesso');
insert into _tap (linha) select throws_ok(
  $sql$update public.macroprocessos set nome = 'Trocado' where nome = 'Macroprocesso Fixo de Teste'$sql$,
  '42501', null, 'Visitante não altera macroprocesso');
insert into _tap (linha) select throws_ok(
  $sql$update public.macroprocessos set id = gen_random_uuid() where nome = 'Macroprocesso Fixo de Teste'$sql$,
  '42501', null, 'Visitante não altera o id');
insert into _tap (linha) select throws_ok(
  $sql$update public.macroprocessos set criado_em = now() where nome = 'Macroprocesso Fixo de Teste'$sql$,
  '42501', null, 'Visitante não altera criado_em');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.macroprocessos where nome = 'Macroprocesso Fixo de Teste'$sql$, '42501', null,
  'Visitante não apaga macroprocesso');
reset role;

-- Regras do nome e do código (valem para qualquer um, inclusive o dono do banco).
insert into public.macroprocessos (nome, codigo) values (' Planejamento Inventado ', ' MP01 ');
insert into _tap (linha) select is(
  (select nome from public.macroprocessos where codigo = 'MP01'), 'Planejamento Inventado',
  'nome " Planejamento Inventado " é guardado sem espaços nas pontas');
insert into _tap (linha) select is(
  (select count(*)::int from public.macroprocessos where codigo = 'MP01'), 1,
  'código " MP01 " é guardado como "MP01"');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.macroprocessos (nome) values ('planejamento inventado ')$sql$, '23505', null,
  'nome repetido, com outras maiúsculas e espaço na ponta, é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.macroprocessos (nome) values ('   ')$sql$, '23514', null, 'nome vazio é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.macroprocessos (nome, codigo) values ('Outro Macro', 'MP01')$sql$, '23505', null,
  'código repetido é recusado');
insert into public.macroprocessos (nome, codigo) values ('Macro Sem Código Um', '');
insert into _tap (linha) select is(
  (select codigo from public.macroprocessos where nome = 'Macro Sem Código Um'), null,
  'código "" é guardado como nulo');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.macroprocessos (nome) values ('Macro Sem Código Dois')$sql$,
  'vários macroprocessos sem código são aceitos');
insert into _tap (linha) select throws_ok(
  format('insert into public.macroprocessos (nome, codigo) values (%L, %L)', 'Macro Código Longo', repeat('C', 21)),
  '23514', null, 'código de 21 caracteres é recusado');
insert into _tap (linha) select throws_ok(
  format('insert into public.macroprocessos (nome, descricao) values (%L, %L)', 'Macro Descrição Longa',
    repeat('a', 2001)), '23514', null, 'descrição acima de 2000 caracteres é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.macroprocessos (nome, categoria) values ('Macro Categoria Torta', 'inventada')$sql$,
  '22P02', null, 'categoria fora da lista é recusada');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.macroprocessos (nome, categoria) values ('Macro Sem Categoria', null)$sql$,
  'categoria vazia é aceita');

-- Eventos: o administrador cria, edita, desativa, reativa e exclui um macroprocesso;
-- uma gravação sem mudança não conta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.macroprocessos (nome, codigo, descricao, categoria)
  values ('Macro do Histórico', 'HIST', 'Nota inventada', 'apoio');
update public.macroprocessos set nome = 'Macro do Histórico Renomeado' where codigo = 'HIST';
update public.macroprocessos set ativo = false where codigo = 'HIST';
update public.macroprocessos set ativo = true where codigo = 'HIST';
delete from public.macroprocessos where codigo = 'HIST';
update public.macroprocessos set nome = nome where nome = 'Macroprocesso Fixo de Teste';
reset role;

create function pg_temp.evento_do_hist(acao_procurada text) returns public.eventos
language sql as $$
  select * from public.eventos where entidade = 'macroprocesso' and acao = acao_procurada
    and coalesce(detalhes -> 'depois' ->> 'codigo', detalhes -> 'antes' ->> 'codigo') = 'HIST'
$$;

insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).detalhes,
  '{"antes": null, "depois": {"codigo": "HIST", "nome": "Macro do Histórico", "descricao": "Nota inventada", "categoria": "apoio", "ativo": true}}'::jsonb,
  'criar grava o depois com os campos legíveis');
insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).autor_id,
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'o evento grava quem fez');
insert into _tap (linha) select is(
  (pg_temp.evento_do_hist('editar')).detalhes -> 'antes' ->> 'nome', 'Macro do Histórico',
  'editar grava o antes');
insert into _tap (linha) select is((pg_temp.evento_do_hist('desativar')).detalhes -> 'depois' ->> 'ativo', 'false',
  'desativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('reativar')).detalhes -> 'depois' ->> 'ativo', 'true',
  'reativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('excluir')).detalhes,
  '{"antes": {"codigo": "HIST", "nome": "Macro do Histórico Renomeado", "descricao": "Nota inventada", "categoria": "apoio", "ativo": true}, "depois": null}'::jsonb,
  'excluir grava no antes todos os campos');
insert into _tap (linha) select is((select count(*)::int from public.eventos e join public.macroprocessos m
    on e.entidade_ref = m.id::text where m.nome = 'Macroprocesso Fixo de Teste' and e.entidade = 'macroprocesso'
    and e.acao = 'editar'), 0,
  'gravação sem mudança não gera evento');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
