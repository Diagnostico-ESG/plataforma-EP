-- Responsáveis do setor saem (processos-etapas, ticket 11; ADR 0013): a tabela e as funções dos gatilhos dela não
-- existem mais, e os eventos antigos de responsável continuam legíveis por todo perfil ativo.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(8);

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

-- Preparação como dono do banco: um evento antigo de responsável do setor (o recurso saiu).
insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes) values
  (null, 'criar', 'responsavel_do_setor', 'setor-antigo-r1:responsavel-antigo-r1',
   '{"antes": null, "depois": {"setor_sigla": "TRA", "nome": "Pessoa Fictícia"}}');

create function pg_temp.eventos_antigos() returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade_ref = 'setor-antigo-r1:responsavel-antigo-r1'
$$;
grant execute on function pg_temp.eventos_antigos() to authenticated;

-- O que era dos responsáveis do setor não existe mais.
insert into _tap (linha) select hasnt_table('public', 'responsaveis_do_setor', 'a tabela responsaveis_do_setor não existe');
insert into _tap (linha) select hasnt_function('private', 'preparar_responsavel_do_setor',
  'a função preparar_responsavel_do_setor não existe');
insert into _tap (linha) select hasnt_function('private', 'registrar_evento_do_responsavel_do_setor',
  'a função registrar_evento_do_responsavel_do_setor não existe');

-- Todo perfil ativo lê o evento antigo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'administrador lê o evento antigo de responsável');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'integrante lê o evento antigo de responsável');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 1::bigint, 'Consulta lê o evento antigo de responsável');
reset role;

-- Inativo não lê.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.eventos_antigos(), 0::bigint, 'inativo não lê o evento antigo de responsável');
reset role;

-- Visitante não chega aos eventos.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select 1 from public.eventos where entidade = 'responsavel_do_setor'$sql$, '42501', null,
  'visitante não lê os eventos de responsável');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
