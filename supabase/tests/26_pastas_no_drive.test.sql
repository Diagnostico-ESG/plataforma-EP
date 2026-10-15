-- Pastas no Drive (documentos-versoes, ticket 01): quem pode o quê em pastas_no_drive e as regras da tabela
-- (um só dono, uma pasta por setor e por processo, drive_id não vazio, pasta some com o processo apagado).
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

insert into public.setores (id, sigla, nome) values
  ('5f000000-0000-0000-0000-0000000000c1', 'PD1', 'Setor Pasta Um'),
  ('5f000000-0000-0000-0000-0000000000c2', 'PD2', 'Setor Pasta Dois'),
  ('5f000000-0000-0000-0000-0000000000c3', 'PD3', 'Setor Pasta Tres');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000c1', null, 'Macro Pastas');
insert into public.processos (id, setor_id, macroprocesso_id, nome, tipo) values
  ('9f000000-0000-0000-0000-0000000000d1', '5f000000-0000-0000-0000-0000000000c1',
   'af000000-0000-0000-0000-0000000000c1', 'Processo Pasta Um', 'processo'),
  ('9f000000-0000-0000-0000-0000000000d2', '5f000000-0000-0000-0000-0000000000c1',
   'af000000-0000-0000-0000-0000000000c1', 'Processo Pasta Dois', 'processo');

-- Preparação como dono do banco: a pasta do setor PD1 e a do processo "Processo Pasta Um".
insert into public.pastas_no_drive (setor_id, processo_id, drive_id) values
  ('5f000000-0000-0000-0000-0000000000c1', null, 'pasta-setor-pd1'),
  (null, '9f000000-0000-0000-0000-0000000000d1', 'pasta-processo-um');
set constraints all immediate;
set constraints all deferred;

-- Troca o drive_id de todas as pastas que o usuário consegue alterar e diz quantas mudaram.
create function pg_temp.alterar_pastas(novo text) returns bigint
language plpgsql as $$
declare alteradas bigint;
begin
  with alterada as (update public.pastas_no_drive set drive_id = novo || '-' || id returning id)
  select count(*) into alteradas from alterada;
  return alteradas;
end $$;
grant execute on function pg_temp.alterar_pastas(text) to authenticated;

-- Administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.pastas_no_drive), 2::bigint, 'administrador lê as pastas');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c2', 'pasta-setor-pd2')$sql$,
  'administrador cria a pasta de um setor');
insert into _tap (linha) select is(pg_temp.alterar_pastas('a1'), 3::bigint, 'administrador altera o drive_id');
insert into _tap (linha) select throws_ok(
  $sql$update public.pastas_no_drive set setor_id = '5f000000-0000-0000-0000-0000000000c3'$sql$, '42501', null,
  'ninguém troca o setor da pasta');
insert into _tap (linha) select throws_ok(
  $sql$update public.pastas_no_drive set processo_id = '9f000000-0000-0000-0000-0000000000d2'$sql$, '42501', null,
  'ninguém troca o processo da pasta');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.pastas_no_drive$sql$, '42501', null, 'administrador não apaga pasta');

-- Regras da tabela, com o administrador.
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, processo_id, drive_id) values
    ('5f000000-0000-0000-0000-0000000000c3', '9f000000-0000-0000-0000-0000000000d2', 'dois-donos')$sql$,
  '23514', null, 'pasta com setor e processo ao mesmo tempo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (drive_id) values ('sem-dono')$sql$,
  '23514', null, 'pasta sem setor nem processo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c1', 'outra')$sql$,
  '23505', null, 'segunda pasta para o mesmo setor é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (processo_id, drive_id) values ('9f000000-0000-0000-0000-0000000000d1', 'outra')$sql$,
  '23505', null, 'segunda pasta para o mesmo processo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c3', '   ')$sql$,
  '23514', null, 'pasta com drive_id vazio é recusada');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.pastas_no_drive), 3::bigint, 'integrante lê as pastas');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.pastas_no_drive (processo_id, drive_id) values ('9f000000-0000-0000-0000-0000000000d2', 'pasta-processo-dois')$sql$,
  'integrante cria a pasta de um processo');
insert into _tap (linha) select is(pg_temp.alterar_pastas('a2'), 4::bigint, 'integrante altera o drive_id');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.pastas_no_drive$sql$, '42501', null, 'integrante não apaga pasta');

-- Consulta.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.pastas_no_drive), 4::bigint, 'consulta lê as pastas');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c3', 'pasta-consulta')$sql$,
  '42501', null, 'consulta não cria pasta');
insert into _tap (linha) select is(pg_temp.alterar_pastas('a3'), 0::bigint, 'consulta não altera o drive_id');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.pastas_no_drive$sql$, '42501', null, 'consulta não apaga pasta');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((select count(*) from public.pastas_no_drive), 0::bigint, 'inativo não lê as pastas');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c3', 'pasta-inativo')$sql$,
  '42501', null, 'inativo não cria pasta');
insert into _tap (linha) select is(pg_temp.alterar_pastas('a4'), 0::bigint, 'inativo não altera o drive_id');

-- Visitante.
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select count(*) from public.pastas_no_drive$sql$, '42501', null, 'visitante não lê as pastas');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values ('5f000000-0000-0000-0000-0000000000c3', 'pasta-visitante')$sql$,
  '42501', null, 'visitante não cria pasta');

-- Apagar o processo (como dono do banco) leva a linha da pasta junto; a pasta no Drive fica.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(
  $sql$delete from public.processos where id = '9f000000-0000-0000-0000-0000000000d2'$sql$,
  'processo com pasta pode ser apagado');
insert into _tap (linha) select is(
  (select count(*) from public.pastas_no_drive where processo_id = '9f000000-0000-0000-0000-0000000000d2'), 0::bigint,
  'a linha da pasta do processo apagado some junto');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
