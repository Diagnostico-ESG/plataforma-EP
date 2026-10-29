-- Tirar do Quadro (repositorio-de-processos, ticket 03; ADR 0034): tirar_do_quadro e voltar_ao_quadro (o Desfazer) gravam
-- tirado_do_quadro_em só pelas funções, sem evento no histórico; só Administrador e Integrante do EP; as recusas de regra
-- (só concluído, já fora do Quadro); sair de Concluídos e voltar devolve ao Quadro; as funções não usam security definer.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(32);

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

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000069', 'T69', 'Setor Tirar do Quadro');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000069', null, 'Macro Tirar do Quadro');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000069', 'af000000-0000-0000-0000-000000000069', nome
from unnest(array['Recente', 'Antigo', 'Andamento', 'Parado', 'Volta', 'Perfis', 'Evento', 'Dois']) as nome;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000069' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

-- O último evento do processo com a ação.
create function pg_temp.evento(nome_do_processo text, acao_do_evento text) returns public.eventos
language sql stable as $$
  select * from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo(nome_do_processo)::text
    and acao = acao_do_evento order by ocorrido_em desc limit 1 $$;
grant execute on function pg_temp.evento(text, text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T69_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.enviar_relatorio(pg_temp.processo(nome_do_processo), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;




-- Todos com a versão completa (a1); depois, cada um no estado do caso (a2).
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000069';
select pg_temp.claims('a2');
select public.mover_processo(pg_temp.processo(nome), pg_temp.etapa('concluidos'), null, null, 'Não será publicado')
from unnest(array['Recente', 'Antigo', 'Volta', 'Perfis', 'Evento', 'Dois']) as nome;
select pg_temp.mover('Andamento', 'publicacao');
select pg_temp.mover('Parado', 'publicacao');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
-- A data de entrada em Concluídos: 29 dias (dentro dos 30) e 31 (fora).
reset role;
update public.passagens set entrou_em = now() - interval '29 days'
where processo_id = pg_temp.processo('Recente') and saiu_em is null;
update public.passagens set entrou_em = now() - interval '31 days'
where processo_id = pg_temp.processo('Antigo') and saiu_em is null;
-- Os eventos de um processo (lidos pelo administrador).
create function pg_temp.eventos_de(nome_do_processo text) returns bigint language sql stable as $$
  select count(*) from public.eventos where entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.eventos_de(text) to authenticated;

-- ===== Tirar do Quadro =====
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Recente'))$sql$,
  'administrador tira do Quadro o concluído recente');
insert into _tap (linha) select is((pg_temp.linha('Recente')).no_quadro, false, 'e ele sai do Quadro');
insert into _tap (linha) select isnt((pg_temp.linha('Recente')).tirado_do_quadro_em, null::timestamptz, 'a view traz quando foi tirado');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Dois'))$sql$,
  'integrante do EP tira do Quadro');
insert into _tap (linha) select is((pg_temp.linha('Dois')).no_quadro, false, 'e ele sai do Quadro');

-- ===== Recusas de regra =====
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Recente'))$sql$,
  'P0001', 'ja_fora_do_quadro', 'não se tira duas vezes');
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Antigo'))$sql$,
  'P0001', 'ja_fora_do_quadro', 'o concluído com mais de 30 dias já está fora do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Andamento'))$sql$,
  'P0001', 'tirar_do_quadro_so_concluido', 'processo em andamento não se tira do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Parado'))$sql$,
  'P0001', 'tirar_do_quadro_so_concluido', 'processo suspenso não se tira do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Andamento'))$sql$,
  'P0001', 'voltar_ao_quadro_so_concluido', 'processo em andamento não volta ao Quadro');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Parado'))$sql$,
  'P0001', 'voltar_ao_quadro_so_concluido', 'processo suspenso não volta ao Quadro');

-- ===== Desfazer =====
insert into _tap (linha) select lives_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Recente'))$sql$,
  'o Desfazer devolve o cartão ao Quadro');
insert into _tap (linha) select is((pg_temp.linha('Recente')).no_quadro, true, 'e o processo volta a estar no Quadro');
insert into _tap (linha) select is((pg_temp.linha('Recente')).tirado_do_quadro_em, null::timestamptz, 'sem a marca de tirado');
insert into _tap (linha) select lives_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Perfis'))$sql$,
  'desfazer no que já está no Quadro não recusa');
insert into _tap (linha) select is((pg_temp.linha('Perfis')).no_quadro, true, 'e nada muda');

-- ===== Sair de Concluídos e voltar devolve ao Quadro =====
select public.tirar_do_quadro(pg_temp.processo('Volta'));
select pg_temp.mover('Volta', 'publicacao');
select public.mover_processo(pg_temp.processo('Volta'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
insert into _tap (linha) select is((pg_temp.linha('Volta')).no_quadro, true, 'mover para trás e voltar a Concluídos devolve ao Quadro');
insert into _tap (linha) select lives_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Volta'))$sql$,
  'e dá para tirar de novo');

-- ===== Sem evento no histórico =====
select pg_temp.claims('a1');
create temp table antes_dos_eventos as select pg_temp.eventos_de('Evento') as total;
select public.tirar_do_quadro(pg_temp.processo('Evento'));
insert into _tap (linha) select is(pg_temp.eventos_de('Evento'), (select total from antes_dos_eventos), 'tirar do Quadro não cria evento');
select public.voltar_ao_quadro(pg_temp.processo('Evento'));
insert into _tap (linha) select is(pg_temp.eventos_de('Evento'), (select total from antes_dos_eventos), 'desfazer não cria evento');

-- ===== Quem pode =====
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro('00000000-0000-0000-0000-000000000000')$sql$,
  'P0001', 'registro_inexistente', 'processo inexistente em tirar');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro('00000000-0000-0000-0000-000000000000')$sql$,
  'P0001', 'registro_inexistente', 'processo inexistente em desfazer');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$,
  'P0001', 'tirado_do_quadro_so_pela_funcao', 'a gravação direta continua recusada, mesmo para o administrador');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Perfis'))$sql$,
  '42501', null, 'consulta não tira do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Perfis'))$sql$,
  '42501', null, 'consulta não desfaz');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro(pg_temp.processo('Perfis'))$sql$,
  'P0001', 'registro_inexistente', 'usuário desativado não tira do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro(pg_temp.processo('Perfis'))$sql$,
  'P0001', 'registro_inexistente', 'usuário desativado não desfaz');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select public.tirar_do_quadro('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não tira do Quadro');
insert into _tap (linha) select throws_ok($sql$select public.voltar_ao_quadro('00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'visitante não desfaz');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
    and proname in ('tirar_do_quadro', 'voltar_ao_quadro')),
  0::bigint, 'as duas funções não usam security definer');
insert into _tap (linha) select is(has_function_privilege('anon', 'public.tirar_do_quadro(uuid)', 'execute'), false,
  'visitante não tem execute em tirar_do_quadro');
insert into _tap (linha) select is(has_function_privilege('authenticated', 'public.voltar_ao_quadro(uuid)', 'execute'), true,
  'usuário logado tem execute em voltar_ao_quadro');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
