-- Fim do Arquivado (repositorio-de-processos, ticket 01; ADR 0034): a coluna arquivado_em e as funções arquivar_processo
-- e desarquivar_processo saem; a view traz tirado_do_quadro_em e no_quadro (30 dias da entrada em Concluídos, ou até
-- alguém tirar do Quadro); tirado_do_quadro_em só se grava pelas funções do ticket 03 (aqui, pela liberação de sessão
-- do teste); o concluído que estava arquivado é um concluído comum; quem lê o quê, por perfil.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(27);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000068', 'T68', 'Setor Fim do Arquivado');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000068', null, 'Macro Fim do Arquivado');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000068', 'af000000-0000-0000-0000-000000000068', nome
from unnest(array['Recente', 'Antigo', 'Andamento', 'Tirado', 'Volta', 'Perfis']) as nome;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000068' $$;
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
  select jsonb_build_object('papel', papel, 'nome', 'T68_V1_Processo.' || formato, 'formato', formato,
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
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000068';
select pg_temp.claims('a2');
select public.mover_processo(pg_temp.processo(nome), pg_temp.etapa('concluidos'), null, null, 'Não será publicado')
from unnest(array['Recente', 'Antigo', 'Tirado', 'Volta', 'Perfis']) as nome;
select pg_temp.mover('Andamento', 'publicacao');
-- A data de entrada em Concluídos: 29 dias (dentro dos 30) e 31 (fora).
reset role;
update public.passagens set entrou_em = now() - interval '29 days'
where processo_id = pg_temp.processo('Recente') and saiu_em is null;
update public.passagens set entrou_em = now() - interval '31 days'
where processo_id = pg_temp.processo('Antigo') and saiu_em is null;
-- Quem tira do Quadro são as funções do ticket 03; aqui o dono do banco liga a liberação da sessão, como elas farão.
create function pg_temp.tirar_do_quadro(nome_do_processo text) returns void language plpgsql as $$
begin
  perform set_config('ep.liberando_tirada', 'on', true);
  update public.processos set tirado_do_quadro_em = clock_timestamp() where id = pg_temp.processo(nome_do_processo);
  perform set_config('ep.liberando_tirada', 'off', true);
end $$;
select pg_temp.tirar_do_quadro('Tirado');
select pg_temp.tirar_do_quadro('Volta');

-- ===== O Arquivado não existe mais =====
insert into _tap (linha) select hasnt_column('public', 'processos', 'arquivado_em', 'a coluna arquivado_em não existe mais');
insert into _tap (linha) select has_column('public', 'processos', 'tirado_do_quadro_em', 'a coluna tirado_do_quadro_em existe');
insert into _tap (linha) select hasnt_column('public', 'processos_com_andamento', 'arquivado_em', 'a view não traz mais arquivado_em');
insert into _tap (linha) select hasnt_function('public', 'arquivar_processo', 'arquivar_processo não existe mais');
insert into _tap (linha) select hasnt_function('public', 'desarquivar_processo', 'desarquivar_processo não existe mais');

-- ===== no_quadro =====
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is((pg_temp.linha('Recente')).no_quadro, true, 'concluído há 29 dias está no Quadro');
insert into _tap (linha) select is((pg_temp.linha('Antigo')).no_quadro, false, 'concluído há 31 dias está fora do Quadro');
insert into _tap (linha) select is((pg_temp.linha('Andamento')).no_quadro, true, 'fora de Concluídos está sempre no Quadro');
insert into _tap (linha) select is((pg_temp.linha('Tirado')).no_quadro, false, 'concluído tirado depois de entrar está fora do Quadro');
insert into _tap (linha) select isnt((pg_temp.linha('Tirado')).tirado_do_quadro_em, null::timestamptz, 'a view traz quando foi tirado');
select pg_temp.claims('a2');
select pg_temp.mover('Volta', 'publicacao');
select public.mover_processo(pg_temp.processo('Volta'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
insert into _tap (linha) select is((pg_temp.linha('Volta')).no_quadro, true,
  'sair de Concluídos e voltar devolve ao Quadro: a passagem nova é mais recente que a marca');

-- ===== A marca não se grava direto, nem pelo Administrador =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$,
  'P0001', 'tirado_do_quadro_so_pela_funcao', 'integrante não grava tirado_do_quadro_em direto');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$,
  'P0001', 'tirado_do_quadro_so_pela_funcao', 'administrador não grava tirado_do_quadro_em direto');
select pg_temp.claims('a3');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$,
  'consulta: a gravação não passa pela RLS e nada muda');
select pg_temp.claims('a4');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = pg_temp.processo('Perfis')$sql$,
  'inativo: a gravação não passa pela RLS e nada muda');
select pg_temp.claims('a1');
insert into _tap (linha) select is((select tirado_do_quadro_em from public.processos where id = pg_temp.processo('Perfis')),
  null::timestamptz, 'e o processo segue sem marca');

-- ===== Quem lê =====
insert into _tap (linha) select is((pg_temp.linha('Perfis')).no_quadro, true, 'administrador lê no_quadro');
select pg_temp.claims('a2');
insert into _tap (linha) select is((pg_temp.linha('Perfis')).no_quadro, true, 'integrante lê no_quadro');
select pg_temp.claims('a3');
insert into _tap (linha) select is((pg_temp.linha('Perfis')).no_quadro, true, 'consulta lê no_quadro');
select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento
  where id = pg_temp.processo('Perfis')), 0::bigint, 'inativo não vê a linha');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select no_quadro from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a view');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set tirado_do_quadro_em = now() where id = '00000000-0000-0000-0000-000000000000'$sql$,
  '42501', null, 'visitante não grava tirado_do_quadro_em');

-- ===== O concluído que estava arquivado é um concluído comum =====
reset role;
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Tirado')$sql$,
  'o concluído tirado do Quadro muda o responsável');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Tirado'), null, 'Anotação depois de tirado')$sql$,
  'o concluído tirado do Quadro grava Anotações');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Tirado', 'publicacao')$sql$,
  'o concluído tirado do Quadro volta a outra etapa');
reset role;
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Tirado')::text
    and acao in ('arquivar', 'desarquivar')), 0::bigint, 'nada disso gera evento de arquivar ou desarquivar');

-- ===== Estrutura =====
insert into _tap (linha) select is(
  (select count(*) from pg_proc where pronamespace = 'private'::regnamespace
    and proname in ('liberando_arquivado', 'gravar_arquivamento', 'conferir_arquivamento', 'conferir_processo_arquivado')),
  0::bigint, 'as funções privadas do arquivado não existem mais');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
