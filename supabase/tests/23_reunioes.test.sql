-- Reuniões (reunioes, ticket 01): registro por função, regras do tipo/setor/processo, textos, exclusão com contagem,
-- eventos com o estado completo e quem pode o quê.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(53);

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

-- TR1 e TR2 ativos, TR3 inativo, TR4 só com reuniões (para a exclusão do setor).
insert into public.setores (id, sigla, nome, ativo) values
  ('5f000000-0000-0000-0000-0000000000a1', 'TR1', 'Setor Reunião Um', true),
  ('5f000000-0000-0000-0000-0000000000a2', 'TR2', 'Setor Reunião Dois', true),
  ('5f000000-0000-0000-0000-0000000000a3', 'TR3', 'Setor Reunião Três', false),
  ('5f000000-0000-0000-0000-0000000000a4', 'TR4', 'Setor Reunião Quatro', true);
insert into public.macroprocessos (id, codigo, nome) values
  ('af000000-0000-0000-0000-0000000000a1', null, 'Macro Reunião');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo) values
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc A', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc B', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a2', 'af000000-0000-0000-0000-0000000000a1', 'Proc C', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc D', 'processo');

create temp table _r (nome text primary key, id uuid);
grant all on _r to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.reuniao(nome_da_reuniao text) returns uuid
language sql stable as $$ select id from _r where nome = nome_da_reuniao $$;
grant execute on function pg_temp.reuniao(text) to authenticated;

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

create function pg_temp.apagar_reunioes() returns bigint
language plpgsql as $$
declare apagadas bigint;
begin
  with apagada as (delete from public.reunioes returning id) select count(*) into apagadas from apagada;
  return apagadas;
end $$;
grant execute on function pg_temp.apagar_reunioes() to authenticated;

-- Preparação como dono do banco: duas reuniões em TR4 e uma de modelagem com o "Proc D". Os eventos pendentes
-- (restrições adiadas) saem aqui, antes dos testes.
insert into public.reunioes (id, setor_id, tipo, data) values
  ('ef000000-0000-0000-0000-0000000000b1', '5f000000-0000-0000-0000-0000000000a4', 'sensibilizacao', '2026-09-01'),
  ('ef000000-0000-0000-0000-0000000000b2', '5f000000-0000-0000-0000-0000000000a4', 'sensibilizacao', '2026-09-02'),
  ('ef000000-0000-0000-0000-0000000000b3', '5f000000-0000-0000-0000-0000000000a1', 'modelagem', '2026-09-03');
insert into public.reunioes_processos (reuniao_id, processo_id) values
  ('ef000000-0000-0000-0000-0000000000b3', pg_temp.processo('Proc D'));
set constraints all immediate;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Registrar: sensibilização sem processo e modelagem com dois processos.
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'sens1', public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', '09:30', 'Sala 1', 'Primeira conversa', '{}', '{}')$sql$,
  'integrante registra reunião de sensibilização sem processos');
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'mod1', public.salvar_reuniao(null, 'modelagem', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-11', null, null, null, '{}', array[pg_temp.processo('Proc A'), pg_temp.processo('Proc B')])$sql$,
  'integrante registra reunião de modelagem com dois processos');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_processos where reuniao_id = pg_temp.reuniao('mod1')), 2::bigint,
  'os dois processos ficam ligados à reunião de modelagem');

-- Regras do tipo, do setor e do processo.
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a3',
    '2026-11-10', null, null, null, '{}', '{}')$sql$,
  'P0001', 'setor_inativo:TR3', 'reunião nova em setor inativo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'modelagem', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', '{}')$sql$,
  'P0001', 'modelagem_sem_processo', 'modelagem sem processo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', array[pg_temp.processo('Proc A')])$sql$,
  'P0001', 'sensibilizacao_com_processo', 'sensibilização com processo é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'modelagem', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', array[pg_temp.processo('Proc C')])$sql$,
  'P0001', 'processo_de_outro_setor:Proc C', 'processo de outro setor é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.cancelar_processo(pg_temp.processo('Proc B'), 'Cancelado para o teste')$sql$,
  'integrante cancela o Proc B');
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'mod2', public.salvar_reuniao(null, 'modelagem', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-12', null, null, null, '{}', array[pg_temp.processo('Proc B')])$sql$,
  'processo cancelado pode ser tratado numa reunião');
insert into _tap (linha) select lives_ok(
  $sql$select public.salvar_reuniao(pg_temp.reuniao('mod2'), 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-12', null, null, null, '{}', '{}')$sql$,
  'trocar o tipo para sensibilização tirando os processos na mesma gravação é aceito');
insert into _tap (linha) select is(
  (select count(*) from public.reunioes_processos where reuniao_id = pg_temp.reuniao('mod2')), 0::bigint,
  'a reunião que virou sensibilização ficou sem processos');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(pg_temp.reuniao('mod1'), 'modelagem', '5f000000-0000-0000-0000-0000000000a2',
    '2026-11-11', null, null, null, '{}', array[pg_temp.processo('Proc A'), pg_temp.processo('Proc B')])$sql$,
  'P0001', 'processo_de_outro_setor:Proc A', 'trocar o setor mantendo processos do setor antigo é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.salvar_reuniao(pg_temp.reuniao('sens1'), 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a2',
    '2026-11-10', '09:30', 'Sala 1', 'Primeira conversa', '{}', '{}')$sql$,
  'trocar o setor de uma sensibilização é aceito');

-- Textos.
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, repeat('x', 10001), '{}', '{}')$sql$,
  '23514', null, 'anotações com 10.001 caracteres são recusadas');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, repeat('x', 301), null, '{}', '{}')$sql$,
  '23514', null, 'local com 301 caracteres é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, array[repeat('x', 201)], '{}')$sql$,
  'P0001', 'outro_participante_longo:201', 'outro participante com 201 caracteres é recusado');
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'txt', public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-13', null, '  ', '  nota  ', array[' Ana ', '', '  '], '{}')$sql$,
  'reunião com textos sujos é gravada');
insert into _tap (linha) select is((select local from public.reunioes where id = pg_temp.reuniao('txt')), null,
  'local só com espaços vira nulo');
insert into _tap (linha) select is((select anotacoes from public.reunioes where id = pg_temp.reuniao('txt')), 'nota',
  'anotações perdem os espaços das pontas');
insert into _tap (linha) select is(
  (select outros_participantes from public.reunioes where id = pg_temp.reuniao('txt')), array['Ana'],
  'outros participantes: espaços aparados e itens vazios descartados');

-- Setor desativado continua com a reunião; exclusão recusada com a contagem.
insert into _tap (linha) select lives_ok(
  $sql$update public.setores set ativo = false where sigla = 'TR1'$sql$, 'integrante desativa o setor com reuniões');
insert into _tap (linha) select ok(
  exists (select 1 from public.reunioes where id = pg_temp.reuniao('mod1')),
  'a reunião continua válida depois que o setor foi desativado');
insert into _tap (linha) select lives_ok(
  $sql$update public.setores set ativo = true where sigla = 'TR1'$sql$, 'integrante reativa o setor');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores where sigla = 'TR4'$sql$, 'P0001', 'setor_com_reunioes:2',
  'excluir setor com 2 reuniões é recusado com a contagem');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where nome = 'Proc D'$sql$, 'P0001', 'processo_com_reunioes:1',
  'excluir processo tratado em 1 reunião é recusado com a contagem');

-- Eventos: um por gravação, com o estado completo.
insert into _tap (linha) select is(pg_temp.eventos('sens1', 'criar'), 1::bigint, 'criar gera um evento');
insert into _tap (linha) select is(pg_temp.evento('sens1', 'criar') -> 'depois' ->> 'setor_sigla', 'TR1',
  'o evento de criação traz a sigla do setor');
insert into _tap (linha) select is(jsonb_array_length(pg_temp.evento('mod1', 'criar') -> 'depois' -> 'processos'), 2,
  'o evento de criação da modelagem traz os dois processos');
insert into _tap (linha) select is(pg_temp.eventos('sens1', 'alterar'), 1::bigint, 'alterar gera um evento');
insert into _tap (linha) select ok(
  pg_temp.evento('sens1', 'alterar') -> 'antes' ->> 'setor_sigla' = 'TR1'
  and pg_temp.evento('sens1', 'alterar') -> 'depois' ->> 'setor_sigla' = 'TR2',
  'o evento de alteração traz antes e depois');
insert into _tap (linha) select lives_ok(
  $sql$select public.salvar_reuniao(pg_temp.reuniao('txt'), 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-13', null, null, 'nota', array['Ana'], '{}')$sql$,
  'salvar sem mudar nada é aceito');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'reuniao' and entidade_ref = pg_temp.reuniao('txt')::text),
  1::bigint, 'salvar sem mudar nada não gera evento');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.reunioes where id = pg_temp.reuniao('mod1')$sql$, 'integrante exclui a reunião de modelagem');
set constraints all immediate;
insert into _tap (linha) select is(pg_temp.eventos('mod1', 'excluir'), 1::bigint, 'excluir gera um evento');
insert into _tap (linha) select is(jsonb_array_length(pg_temp.evento('mod1', 'excluir') -> 'antes' -> 'processos'), 2,
  'o evento de exclusão traz tudo o que a reunião tinha');

-- Quem pode o quê.
insert into _tap (linha) select throws_ok(
  $sql$update public.reunioes set criado_em = now()$sql$, '42501', null, 'ninguém altera criado_em');
insert into _tap (linha) select throws_ok(
  $sql$update public.reunioes_processos set processo_id = pg_temp.processo('Proc A')$sql$, '42501', null,
  'a ligação de processo não se altera, só se apaga e inclui');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.eventos (acao, entidade, entidade_ref, detalhes) values ('criar', 'reuniao', 'x', '{}')$sql$,
  '42501', null, 'ninguém inclui evento pela API');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select lives_ok(
  $sql$insert into _r select 'adm1', public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a2',
    '2026-12-01', null, null, null, '{}', '{}')$sql$,
  'administrador registra reunião');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.reunioes where id = pg_temp.reuniao('adm1')$sql$, 'administrador exclui reunião');
insert into _tap (linha) select is((select count(*) from public.reunioes where id = pg_temp.reuniao('adm1')), 0::bigint,
  'a reunião excluída pelo administrador sumiu');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select ok((select count(*) from public.reunioes) > 0, 'consulta lê as reuniões');
insert into _tap (linha) select ok((select count(*) from public.reunioes_processos) > 0, 'consulta lê os processos das reuniões');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where entidade = 'reuniao') > 0, 'consulta lê os eventos de reunião');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', '{}')$sql$, '42501', null, 'consulta não registra reunião');
insert into _tap (linha) select is(pg_temp.apagar_reunioes(), 0::bigint, 'consulta não apaga reunião');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.reunioes_processos (reuniao_id, processo_id)
    values (pg_temp.reuniao('sens1'), pg_temp.processo('Proc A'))$sql$, '42501', null,
  'consulta não liga processo a reunião');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is((select count(*) from public.reunioes), 0::bigint, 'inativo não lê reuniões');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'reuniao'), 0::bigint, 'inativo não lê eventos de reunião');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', '{}')$sql$, '42501', null, 'inativo não registra reunião');

set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.reunioes$sql$, '42501', null,
  'visitante não lê reuniões');
insert into _tap (linha) select throws_ok(
  $sql$select public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1',
    '2026-11-10', null, null, null, '{}', '{}')$sql$, '42501', null, 'visitante não registra reunião');

reset role;
insert into _tap (linha) select ok(
  not (select prosecdef from pg_proc where proname = 'salvar_reuniao' and pronamespace = 'public'::regnamespace),
  'a função de salvar roda com a permissão de quem chama (sem security definer)');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
