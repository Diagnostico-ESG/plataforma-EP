-- Reuniões nos cadastros (reunioes, ticket 04): reclassificar um processo tratado numa reunião não mexe na reunião.
-- A recusa de excluir setor e processo com reunião já é provada no 23_reunioes; aqui também a de trocar o setor do processo.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(8);

-- Usuário inventado: a2 integrante.
insert into public.autorizacoes (email, perfil) values ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000b1', 'TN1', 'Setor Cadastros');
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000b2', 'TN2', 'Outro Setor Cadastros');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000b1', null, 'Macro Cadastros');
insert into public.processos (id, setor_id, macroprocesso_id, nome, tipo) values
  ('9f000000-0000-0000-0000-0000000000b1', '5f000000-0000-0000-0000-0000000000b1',
   'af000000-0000-0000-0000-0000000000b1', 'Solto N', 'a_classificar'),
  ('9f000000-0000-0000-0000-0000000000b2', '5f000000-0000-0000-0000-0000000000b1',
   'af000000-0000-0000-0000-0000000000b1', 'Sem reuniao N', 'a_classificar');

-- Preparação como dono do banco: uma reunião de modelagem que tratou o "Solto N". Os eventos pendentes
-- (restrições adiadas) saem aqui, antes dos testes.
insert into public.reunioes (id, setor_id, tipo, data) values
  ('ef000000-0000-0000-0000-0000000000c1', '5f000000-0000-0000-0000-0000000000b1', 'modelagem', '2026-09-03');
insert into public.reunioes_processos (reuniao_id, processo_id) values
  ('ef000000-0000-0000-0000-0000000000c1', '9f000000-0000-0000-0000-0000000000b1');
set constraints all immediate;
set constraints all deferred;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo('9f000000-0000-0000-0000-0000000000b1', 'processo', null, 'Classificado no teste')$sql$,
  'integrante reclassifica o processo tratado numa reunião');
insert into _tap (linha) select is(
  (select tipo::text from public.processos where id = '9f000000-0000-0000-0000-0000000000b1'), 'processo',
  'o processo passou a ser do tipo Processo');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes where id = 'ef000000-0000-0000-0000-0000000000c1'), 1::bigint,
  'a reunião continua existindo');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_processos where reuniao_id = 'ef000000-0000-0000-0000-0000000000c1'
    and processo_id = '9f000000-0000-0000-0000-0000000000b1'), 1::bigint,
  'a reunião continua ligada ao mesmo processo');

insert into _tap (linha) select throws_ok(
  $sql$update public.processos set setor_id = '5f000000-0000-0000-0000-0000000000b2'
    where id = '9f000000-0000-0000-0000-0000000000b1'$sql$,
  'P0001', 'processo_com_reunioes_muda_de_setor:1',
  'trocar o setor de um processo tratado em reunião é recusado, com a contagem');
insert into _tap (linha) select is(
  (select setor_id from public.processos where id = '9f000000-0000-0000-0000-0000000000b1'),
  '5f000000-0000-0000-0000-0000000000b1'::uuid, 'o processo tratado em reunião continua no setor de antes');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set setor_id = '5f000000-0000-0000-0000-0000000000b2'
    where id = '9f000000-0000-0000-0000-0000000000b2'$sql$,
  'processo sem reunião continua podendo trocar de setor');

set constraints all immediate;
set constraints all deferred;
reset role;
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'reuniao' and acao = 'editar'
    and entidade_ref = 'ef000000-0000-0000-0000-0000000000c1'), 0::bigint,
  'a reclassificação não gera evento de alteração na reunião');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
