-- Setores: quem pode o quê, regras da sigla e do nome, e eventos (cadastros-basicos, ticket 01).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(47);

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

-- Setor inventado que todos tentam ler, alterar e apagar.
insert into public.setores (nome, sigla) values ('Setor Fixo de Teste', 'SFT');

-- Administrador e integrante: leem, criam, alteram os campos editáveis e apagam; id e criado_em, ninguém.
create function pg_temp.conferir_quem_altera(id_usuario text, quem text, sigla_nova text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is((select count(*)::int from public.setores where sigla = 'SFT'), 1,
    quem || ' lê os setores');
  insert into _tap (linha) select lives_ok(
    format('insert into public.setores (nome, sigla) values (%L, %L)', 'Setor de ' || quem, sigla_nova),
    quem || ' cria setor');
  with alteradas as (
    update public.setores set nome = 'Setor alterado por ' || quem, sigla = sigla_nova || 'X',
      observacoes = 'Observação inventada', ativo = false
    where sigla = sigla_nova returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 1,
    quem || ' altera nome, sigla, observações e ativo');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set criado_em = now() - interval '1 day' where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera criado_em');
  with apagadas as (delete from public.setores where sigla = sigla_nova || 'X' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 1, quem || ' apaga setor');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_altera(text, text, text) to authenticated;

-- Consulta e inativo: não criam, não alteram, não apagam; o inativo também não lê.
create function pg_temp.conferir_quem_nao_altera(id_usuario text, quem text, setores_visiveis int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is((select count(*)::int from public.setores where sigla = 'SFT'),
    setores_visiveis, quem || case when setores_visiveis = 1 then ' lê os setores' else ' não lê os setores' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.setores (nome, sigla) values ('Setor Proibido', 'PROIB')$sql$, '42501', null,
    quem || ' não cria setor');
  with alteradas as (update public.setores set nome = 'Trocado' where sigla = 'SFT' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera setor');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set criado_em = now() - interval '1 day' where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera criado_em');
  with apagadas as (delete from public.setores where sigla = 'SFT' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não apaga setor');
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
insert into _tap (linha) select throws_ok('select 1 from public.setores', '42501', null, 'Visitante não lê os setores');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Proibido', 'PROIB')$sql$, '42501', null,
  'Visitante não cria setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set nome = 'Trocado' where sigla = 'SFT'$sql$, '42501', null, 'Visitante não altera setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
  'Visitante não altera o id');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set criado_em = now() where sigla = 'SFT'$sql$, '42501', null,
  'Visitante não altera criado_em');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores where sigla = 'SFT'$sql$, '42501', null, 'Visitante não apaga setor');
reset role;

-- Regras da sigla e do nome (valem para qualquer um, inclusive o dono do banco).
insert into public.setores (nome, sigla) values ('Coordenação Inventada', ' cee ');
insert into _tap (linha) select is((select sigla from public.setores where nome = 'Coordenação Inventada'), 'CEE',
  'sigla " cee " é guardada como "CEE"');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Um', 'C E')$sql$, '23514', null,
  'sigla com espaço é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Dois', 'CEE_PR')$sql$, '23514', null,
  'sigla com sublinhado é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Três', 'CÊE')$sql$, '23514', null,
  'sigla com acento é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Quatro', 'C')$sql$, '23514', null,
  'sigla de 1 caractere é recusada');
insert into _tap (linha) select throws_ok(
  format('insert into public.setores (nome, sigla) values (%L, %L)', 'Setor Cinco', repeat('A', 16)), '23514', null,
  'sigla de 16 caracteres é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Seis', 'cee')$sql$, '23505', null,
  'sigla repetida, mesmo em minúsculas, é recusada');
insert into public.setores (nome, sigla) values ('Assessoria Jurídica', 'AJ');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Assessoria jurídica ', 'AJ2')$sql$, '23505', null,
  'nome repetido, com outras maiúsculas e espaço na ponta, é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('   ', 'VAZ')$sql$, '23514', null, 'nome vazio é recusado');
insert into _tap (linha) select throws_ok(
  format('insert into public.setores (nome, sigla, observacoes) values (%L, %L, %L)',
    'Setor Sete', 'SETE', repeat('a', 2001)), '23514', null, 'observações acima de 2000 caracteres são recusadas');

-- Eventos: o administrador cria, edita, desativa, reativa e exclui um setor; uma gravação sem mudança não conta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.setores (nome, sigla, observacoes) values ('Setor do Histórico', 'HIST', 'Nota inventada');
update public.setores set nome = 'Setor do Histórico Renomeado' where sigla = 'HIST';
update public.setores set ativo = false where sigla = 'HIST';
update public.setores set ativo = true where sigla = 'HIST';
delete from public.setores where sigla = 'HIST';
update public.setores set nome = nome where sigla = 'SFT';
reset role;

create function pg_temp.evento_do_hist(acao_procurada text) returns public.eventos
language sql as $$
  select * from public.eventos where entidade = 'setor' and acao = acao_procurada
    and coalesce(detalhes -> 'depois' ->> 'sigla', detalhes -> 'antes' ->> 'sigla') = 'HIST'
$$;

insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).detalhes,
  '{"antes": null, "depois": {"sigla": "HIST", "nome": "Setor do Histórico", "observacoes": "Nota inventada", "ativo": true}}'::jsonb,
  'criar grava o depois com os campos legíveis');
insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).autor_id,
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'o evento grava quem fez');
insert into _tap (linha) select is(
  (pg_temp.evento_do_hist('editar')).detalhes -> 'antes' ->> 'nome', 'Setor do Histórico',
  'editar grava o antes');
insert into _tap (linha) select is((pg_temp.evento_do_hist('desativar')).detalhes -> 'depois' ->> 'ativo', 'false',
  'desativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('reativar')).detalhes -> 'depois' ->> 'ativo', 'true',
  'reativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('excluir')).detalhes,
  '{"antes": {"sigla": "HIST", "nome": "Setor do Histórico Renomeado", "observacoes": "Nota inventada", "ativo": true}, "depois": null}'::jsonb,
  'excluir grava no antes todos os campos');
insert into _tap (linha) select is((select count(*)::int from public.eventos e join public.setores s
    on e.entidade_ref = s.id::text where s.sigla = 'SFT' and e.acao = 'editar'), 0,
  'gravação sem mudança não gera evento');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
