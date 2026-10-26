-- Trava de arquivos (documentos-versoes, ticket 11; ADR 0025): mover o processo para a frente da Modelagem piloto exige
-- uma versão piloto (ou, para não prender o processo antigo, uma versão em sequência); mover para a frente da Relatório e
-- modelagem técnica exige uma versão em sequência e um relatório numerado, sem importar a ligação entre os dois. Voltar,
-- a etiqueta, o processo que já estava adiante e a etapa desativada não travam. A view traz os três campos que a tela lê.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(25);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000059', 'T59', 'Setor Trava');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000059', null, 'Macro Trava');
-- t01 e t11: sem nada em Não iniciados; t02, t14: sem nada na Modelagem piloto; t03: só a piloto; t04: piloto e em sequência;
-- t05: piloto e relatório ligado a ela; t06: piloto, relatório e em sequência (ligados a versões diferentes); t07: só a em
-- sequência; t08: sem nada; t09 e t13: sem nada na técnica; t10: histórica com relatório .pdf; t12: sem nada na Validação.
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000059', 'af000000-0000-0000-0000-000000000059', nome
from unnest(array['t01', 't02', 't03', 't04', 't05', 't06', 't07', 't08', 't09', 't10', 't11', 't12', 't13', 't14']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000059' $$;
create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
create function pg_temp.passagens(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.passagens where processo_id = pg_temp.processo(nome_do_processo) $$;
create function pg_temp.arquivos_da_view(nome_do_processo text) returns text
language sql stable as $$
  select tem_versao_piloto::text || ',' || tem_versao_em_sequencia::text || ',' || tem_relatorio_numerado::text
  from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
-- Um arquivo inventado no formato que registrar_versao recebe.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T59_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.so_bpm() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')) $$;
-- Põe o processo numa etapa sem passar pela trava (como o dado antigo, de antes dela): só o dono do banco, sem gatilhos.
create function pg_temp.por_fora(nome_do_processo text, codigo_da_etapa text) returns void
language plpgsql as $$
begin
  set local session_replication_role = replica;
  update public.passagens set etapa_id = pg_temp.etapa(codigo_da_etapa)
  where processo_id = pg_temp.processo(nome_do_processo) and saiu_em is null;
  set local session_replication_role = origin;
end $$;
-- Liga ou desliga uma etapa do catálogo, sem passar pelas regras do catálogo (só o dono do banco, sem gatilhos).
create function pg_temp.ativar(codigo_da_etapa text, ligada boolean) returns void
language plpgsql as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = ligada where codigo = codigo_da_etapa;
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.processo(text), pg_temp.etapa(text), pg_temp.mover(text, text), pg_temp.passagens(text),
  pg_temp.arquivos_da_view(text), pg_temp.arquivo(text, text), pg_temp.so_bpm() to authenticated;

-- Preparação: o integrante envia os arquivos de cada processo (ainda em Não iniciados, onde tudo cabe) e o dono do banco
-- põe cada um na sua etapa.
set local role authenticated;
select pg_temp.claims('a2');
select public.registrar_versao(pg_temp.processo('t03'), 1, pg_temp.so_bpm(), true);
select public.registrar_versao(pg_temp.processo('t04'), 1, pg_temp.so_bpm(), true);
select public.registrar_versao(pg_temp.processo('t04'), 2, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('t05'), 1, pg_temp.so_bpm(), true);
select public.enviar_relatorio(pg_temp.processo('t05'), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
select public.registrar_versao(pg_temp.processo('t06'), 1, pg_temp.so_bpm(), true);
select public.enviar_relatorio(pg_temp.processo('t06'), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
select public.registrar_versao(pg_temp.processo('t06'), 2, pg_temp.so_bpm());
select public.registrar_versao(pg_temp.processo('t07'), 1, pg_temp.so_bpm());
select public.registrar_versao_historica(pg_temp.processo('t10'), 5,
  jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('relatorio', 'pdf')));
reset role;
select pg_temp.por_fora('t02', 'modelagem');
select pg_temp.por_fora('t03', 'modelagem');
select pg_temp.por_fora('t04', 'relatorio_modelagem_tecnica');
select pg_temp.por_fora('t05', 'relatorio_modelagem_tecnica');
select pg_temp.por_fora('t06', 'relatorio_modelagem_tecnica');
select pg_temp.por_fora('t07', 'modelagem');
select pg_temp.por_fora('t09', 'relatorio_modelagem_tecnica');
select pg_temp.por_fora('t12', 'revisao_setor');
select pg_temp.por_fora('t13', 'relatorio_modelagem_tecnica');
select pg_temp.por_fora('t14', 'modelagem');

-- ===== A Modelagem piloto exige a versão piloto =====
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t01', 'modelagem')$sql$,
  'chegar à Modelagem piloto sem arquivos é aceito (a trava é na saída)');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t01', 'relatorio_modelagem_tecnica')$sql$,
  'P0001', 'trava_piloto', 'sair da Modelagem piloto sem versão piloto é recusado');
insert into _tap (linha) select results_eq($sql$select (select etapa_atual_codigo from public.processos_com_andamento
  where id = pg_temp.processo('t01')), pg_temp.passagens('t01')$sql$, $sql$values ('modelagem', 2::bigint)$sql$,
  'a recusa deixa o processo onde estava, sem passagem nova');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t11', 'revisao_interna')$sql$,
  'P0001', 'trava_piloto', 'ir de Não iniciados à Revisão interna sem versão piloto é recusado (passa por cima da etapa)');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t11', 'concluidos')$sql$,
  'P0001', 'trava_piloto', 'a trava vem antes da regra da chegada a Concluídos');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t03', 'relatorio_modelagem_tecnica')$sql$,
  'com a versão piloto, sair da Modelagem piloto é aceito');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t07', 'relatorio_modelagem_tecnica')$sql$,
  'só com a versão em sequência, sair da Modelagem piloto também é aceito (a piloto já não pode entrar)');

-- ===== A técnica exige a versão em sequência e o relatório =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t03', 'revisao_interna')$sql$,
  'P0001', 'trava_tecnica:versao_e_relatorio', 'sair da técnica só com a piloto é recusado, faltando a versão e o relatório');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t04', 'revisao_interna')$sql$,
  'P0001', 'trava_tecnica:relatorio', 'sair da técnica sem relatório é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t05', 'revisao_interna')$sql$,
  'P0001', 'trava_tecnica:versao', 'sair da técnica sem versão em sequência (só a piloto e o relatório) é recusado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t06', 'revisao_interna')$sql$,
  'com versão em sequência e relatório ligados a versões diferentes, sair da técnica é aceito');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t09', 'concluidos')$sql$,
  'P0001', 'trava_tecnica:versao_e_relatorio', 'ir da técnica a Concluídos sem arquivos é recusado, antes da regra da chegada');

-- ===== O que não trava =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t12', 'publicacao')$sql$,
  'o processo que já estava adiante das duas etapas anda sem arquivos');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t12', 'modelagem')$sql$, 'voltar sem arquivos é aceito');
insert into _tap (linha) select lives_ok(
  $sql$update public.passagens set etiqueta = 'em_andamento'
    where processo_id = pg_temp.processo('t13') and saiu_em is null$sql$, 'mudar a etiqueta sem arquivos é aceito');
reset role;
select pg_temp.ativar('modelagem', false);
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t02', 'relatorio_modelagem_tecnica')$sql$,
  'a Modelagem piloto desativada no catálogo não trava');
reset role;
select pg_temp.ativar('modelagem', true);
select pg_temp.ativar('relatorio_modelagem_tecnica', false);
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('t09', 'revisao_interna')$sql$,
  'a técnica desativada no catálogo não trava');
reset role;
select pg_temp.ativar('relatorio_modelagem_tecnica', true);

-- ===== Quem pode =====
set local role authenticated;
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('t14', 'relatorio_modelagem_tecnica')$sql$,
  '42501', null, 'a Consulta continua recusada pelo perfil, antes da trava');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')$sql$,
  '42501', null, 'o visitante sem login não move processo');
reset role;

-- ===== A view traz o que a tela lê =====
set local role authenticated;
select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t08'), 'false,false,false', 'sem arquivos: nada');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t03'), 'true,false,false', 'só a piloto');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t07'), 'false,true,false', 'só a em sequência');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t05'), 'true,false,true',
  'o relatório numerado conta ligado à piloto, sem versão em sequência');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t06'), 'true,true,true', 'piloto, em sequência e relatório numerado');
insert into _tap (linha) select is(pg_temp.arquivos_da_view('t10'), 'false,false,false',
  'a histórica e o relatório .pdf sem número não contam');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
