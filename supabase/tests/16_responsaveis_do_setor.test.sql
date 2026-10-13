-- Responsáveis do setor: quem pode o quê, e-mail, eventos e exclusão junto com o setor (processos-etapas, ticket 03).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(49);

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

-- Setores inventados: TPA a TPC para os perfis, TRS para as regras.
insert into public.setores (id, sigla, nome) values
  ('5c000000-0000-0000-0000-000000000001', 'TPA', 'Setor Perfil A'),
  ('5c000000-0000-0000-0000-000000000002', 'TPB', 'Setor Perfil B'),
  ('5c000000-0000-0000-0000-000000000003', 'TPC', 'Setor Perfil C'),
  ('5c000000-0000-0000-0000-000000000004', 'TRS', 'Setor das Regras');

-- Um responsável inventado em cada setor de perfil, incluído pelo dono do banco.
insert into public.responsaveis_do_setor (setor_id, nome) values
  ('5c000000-0000-0000-0000-000000000001', 'Pessoa Semente TPA'),
  ('5c000000-0000-0000-0000-000000000002', 'Pessoa Semente TPB'),
  ('5c000000-0000-0000-0000-000000000003', 'Pessoa Semente TPC');

-- Administrador e Integrante criam, alteram e apagam; Consulta só lê; o inativo nada; id, setor e data ninguém muda.
create function pg_temp.conferir_responsaveis(id_usuario text, quem text, sigla_do_setor text, altera boolean, le int)
returns void language plpgsql as $$
declare
  id_do_setor uuid := (select id from public.setores where sigla = sigla_do_setor);
  inclusao text := format(
    $sql$insert into public.responsaveis_do_setor (setor_id, nome) values (%L, 'Pessoa Nova')$sql$, id_do_setor);
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.responsaveis_do_setor where setor_id = id_do_setor), le,
    quem || case when le > 0 then ' lê os responsáveis' else ' não lê os responsáveis' end);
  if altera then
    insert into _tap (linha) select lives_ok(inclusao, quem || ' cria responsável');
  else
    insert into _tap (linha) select throws_ok(inclusao, '42501', null, quem || ' não cria responsável');
  end if;
  with alteradas as (update public.responsaveis_do_setor set cargo = 'Cargo Novo'
    where nome = 'Pessoa Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when altera then 1 else 0 end,
    quem || case when altera then ' altera o responsável' else ' não altera o responsável' end);
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set setor_id = setor_id$sql$, '42501', null,
    quem || ' não troca o setor do responsável');
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set id = id$sql$, '42501', null, quem || ' não troca o id do responsável');
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set criado_em = criado_em$sql$, '42501', null,
    quem || ' não troca a data de criação do responsável');
  with apagadas as (delete from public.responsaveis_do_setor
    where nome = 'Pessoa Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), case when altera then 1 else 0 end,
    quem || case when altera then ' apaga o responsável' else ' não apaga o responsável' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_responsaveis(text, text, text, boolean, int) to authenticated;

select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'TPA', true, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'TPB', true, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a3', 'Consulta', 'TPC', false, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'TPC', false, 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.responsaveis_do_setor', '42501', null,
  'Visitante não lê os responsáveis');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome)
    values ('5c000000-0000-0000-0000-000000000003', 'Pessoa Visitante')$sql$, '42501', null,
  'Visitante não cria responsável');
insert into _tap (linha) select throws_ok(
  $sql$update public.responsaveis_do_setor set cargo = 'Trocado'$sql$, '42501', null, 'Visitante não altera responsável');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.responsaveis_do_setor$sql$, '42501', null, 'Visitante não apaga responsável');
reset role;

-- Regras, como Integrante: espaços nas pontas, e-mail em minúsculas, vazio vira nulo, mal formado recusado.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into public.responsaveis_do_setor (setor_id, nome, email, cargo)
  values ('5c000000-0000-0000-0000-000000000004', '  Fulano Teste  ', '  Fulano.Teste@Exemplo.com ', 'Chefe de Teste');
insert into _tap (linha) select is(
  (select email from public.responsaveis_do_setor where nome = 'Fulano Teste'), 'fulano.teste@exemplo.com',
  'e-mail guardado em minúsculas e sem espaços nas pontas');
insert into _tap (linha) select is(
  (select count(*)::int from public.responsaveis_do_setor where nome = 'Fulano Teste'), 1,
  'nome guardado sem espaços nas pontas');
insert into public.responsaveis_do_setor (setor_id, nome, email, cargo)
  values ('5c000000-0000-0000-0000-000000000004', 'Beltrana Teste', '   ', '');
insert into _tap (linha) select ok(
  (select email is null and cargo is null from public.responsaveis_do_setor where nome = 'Beltrana Teste'),
  'e-mail e cargo vazios viram nulos');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome, email)
    values ('5c000000-0000-0000-0000-000000000004', 'Ciclano Teste', 'fulano@')$sql$,
  'P0001', 'email_mal_formado:fulano@', 'e-mail mal formado recusado com o valor recebido');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome, email)
    values ('5c000000-0000-0000-0000-000000000004', 'Ciclano Teste', ' Fulano@Exemplo ')$sql$,
  'P0001', 'email_mal_formado:Fulano@Exemplo', 'e-mail sem domínio completo recusado como foi digitado');
insert into _tap (linha) select throws_ok(
  $sql$update public.responsaveis_do_setor set email = 'sem-arroba' where nome = 'Fulano Teste'$sql$,
  'P0001', 'email_mal_formado:sem-arroba', 'e-mail mal formado recusado também ao editar');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome)
    values ('5c000000-0000-0000-0000-000000000004', '   ')$sql$, '23514', null, 'nome vazio recusado');

-- Eventos: criar, editar e excluir com o setor e o nome legíveis; gravação sem mudança não gera evento.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'responsavel_do_setor' and acao = 'criar'
    and detalhes -> 'depois' ->> 'nome' = 'Fulano Teste'),
  jsonb_build_object('antes', null, 'depois', jsonb_build_object(
    'setor_id', '5c000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS', 'nome', 'Fulano Teste',
    'email', 'fulano.teste@exemplo.com', 'cargo', 'Chefe de Teste')),
  'criar gera o evento com o setor e o nome legíveis');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor'
    and entidade_ref = '5c000000-0000-0000-0000-000000000004:'
      || (select id from public.responsaveis_do_setor where nome = 'Fulano Teste')),
  1, 'a referência do evento traz o setor e o responsável');
update public.responsaveis_do_setor set cargo = 'Chefe Novo' where nome = 'Fulano Teste';
insert into _tap (linha) select is(
  (select (detalhes -> 'antes' ->> 'cargo') || ' > ' || (detalhes -> 'depois' ->> 'cargo')
    from public.eventos where entidade = 'responsavel_do_setor' and acao = 'editar'),
  'Chefe de Teste > Chefe Novo', 'editar gera o evento com o antes e o depois');
update public.responsaveis_do_setor set cargo = cargo where nome = 'Fulano Teste';
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor'
    and entidade_ref like '5c000000-0000-0000-0000-000000000004:%'),
  3, 'gravação sem mudança não gera evento');
delete from public.responsaveis_do_setor where nome = 'Beltrana Teste';
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'nome' from public.eventos
    where entidade = 'responsavel_do_setor' and acao = 'excluir'),
  'Beltrana Teste', 'excluir gera o evento com o que o responsável tinha');
reset role;

-- Quem lê os eventos dos responsáveis: todo perfil ativo (o Integrante já leu acima).
create function pg_temp.eventos_dos_responsaveis(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade = 'responsavel_do_setor' and entidade_ref like '5c000000-0000-0000-0000-000000000004:%';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_dos_responsaveis(text) to authenticated;
insert into _tap (linha) select is(pg_temp.eventos_dos_responsaveis('00000000-0000-0000-0000-0000000000a3'), 4,
  'Consulta lê os eventos dos responsáveis');
insert into _tap (linha) select is(pg_temp.eventos_dos_responsaveis('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos dos responsáveis');

-- Excluir o setor, como Integrante: os responsáveis vão junto, com a lista no "antes" e um evento por responsável.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into public.responsaveis_do_setor (setor_id, nome) values ('5c000000-0000-0000-0000-000000000004', 'Ana Teste');
delete from public.setores where sigla = 'TRS';
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from public.responsaveis_do_setor where setor_id = '5c000000-0000-0000-0000-000000000004'), 0,
  'excluir o setor apaga os responsáveis dele');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' -> 'responsaveis' from public.eventos
    where entidade = 'setor' and acao = 'excluir' and detalhes -> 'antes' ->> 'sigla' = 'TRS'),
  jsonb_build_array(
    jsonb_build_object('nome', 'Ana Teste', 'email', null, 'cargo', null),
    jsonb_build_object('nome', 'Fulano Teste', 'email', 'fulano.teste@exemplo.com', 'cargo', 'Chefe Novo')),
  'excluir o setor grava no antes a lista dos responsáveis');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'setor_sigla' = 'TRS'),
  3, 'cada responsável do setor excluído tem o seu evento de exclusão, com a sigla');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
