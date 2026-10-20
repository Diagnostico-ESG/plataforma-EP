-- Atualização das planilhas (exportacao-e-manutencao, ticket 02; spec, histórias 28, 29 e 31 a 43; ADR 0018):
-- o Administrador ativo pede a atualização; a tentativa é registrada com uma ficha de uso único (só o hash fica);
-- um pedido por vez; o cofre incompleto recusa; só as 10 mais recentes ficam; o resultado é calculado; o resultado
-- volta por uma função chamável sem login que só aceita a ficha certa, uma vez; o pg_cron agenda as 6h de Brasília.
-- O teste confere o registro e a ficha, não a chegada do pacote à função (o pg_net só envia depois do commit).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(46);

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

-- O banco de desenvolvimento pode já ter tentativas e segredos reais: dentro da transação o teste parte do zero (tudo desfeito no fim).
delete from public.atualizacoes_das_planilhas;

-- Ficha e hash como o banco calcula; o teste só conhece a ficha das linhas que ele mesmo grava.
create function pg_temp.hash(ficha text) returns text language sql immutable as $$
  select encode(sha256(convert_to(ficha, 'utf8')), 'hex') $$;

create function pg_temp.entrar(id_usuario text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
end $$;
grant execute on function pg_temp.entrar(text) to authenticated;

create function pg_temp.vazio_o_cofre() returns void language sql as $$
  delete from vault.secrets where name like 'planilhas\_%' $$;

create function pg_temp.configurar_cofre() returns void language plpgsql as $$
begin
  perform pg_temp.vazio_o_cofre();
  perform vault.create_secret('https://funcao.exemplo.test/planilhas', 'planilhas_endereco_da_funcao');
  perform vault.create_secret('senha-interna-de-teste', 'planilhas_senha_interna');
  perform vault.create_secret('id-interna-teste', 'planilhas_id_interna');
  perform vault.create_secret('id-publica-teste', 'planilhas_id_publica');
end $$;

create function pg_temp.tentativas() returns int language sql as $$
  select count(*)::int from public.atualizacoes_das_planilhas $$;

-- Recusa a atualização, os links e a leitura das tentativas a quem não é Administrador ativo (3 provas).
create function pg_temp.conferir_perfil(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform pg_temp.entrar(id_usuario);
  set local role authenticated;
  insert into _tap (linha) select throws_ok(
    $sql$select public.pedir_atualizacao_das_planilhas()$sql$, '42501', null, quem || ' não pede a atualização');
  insert into _tap (linha) select throws_ok(
    $sql$select * from public.links_das_planilhas()$sql$, '42501', null, quem || ' não vê os links');
  insert into _tap (linha) select is(
    (select count(*)::int from public.resultado_das_atualizacoes_das_planilhas), 0, quem || ' não lê as tentativas');
  reset role;
end $$;
grant execute on function pg_temp.conferir_perfil(text, text) to authenticated;

-- 1 a 3: cofre vazio, Administrador (a1).
select pg_temp.vazio_o_cofre();
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.pedir_atualizacao_das_planilhas()$sql$, 'P0001', 'planilhas_nao_configuradas',
  'cofre incompleto: o pedido é recusado com planilhas_nao_configuradas');
insert into _tap (linha) select is(
  (select planilha_interna is null and planilha_publica is null from public.links_das_planilhas()), true,
  'sem cofre, links_das_planilhas devolve os dois endereços nulos');
reset role;
insert into _tap (linha) select is(pg_temp.tentativas(), 0, 'o pedido recusado não registra tentativa');

-- Cofre configurado e uma tentativa antiga já concluída, para provar que a RLS esconde o que existe.
select pg_temp.configurar_cofre();
insert into public.atualizacoes_das_planilhas (id, origem, iniciada_em, concluida_em, deu_certo, ficha_hash)
values ('00000000-0000-0000-0000-000000000c01', 'automatica', now() - interval '1 hour', now() - interval '59 minutes',
  true, pg_temp.hash('semente'));

-- 4 a 12: perfis sem poder.
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_perfil('00000000-0000-0000-0000-0000000000a4', 'Administrador desativado');

-- 13 a 15: visitante.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.pedir_atualizacao_das_planilhas()$sql$, '42501', null, 'Visitante não pede a atualização');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.links_das_planilhas()$sql$, '42501', null, 'Visitante não vê os links');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.resultado_das_atualizacoes_das_planilhas$sql$, '42501', null, 'Visitante não lê as tentativas');
reset role;

-- 16 a 27: o Administrador (a1) pede e acompanha.
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.pedir_atualizacao_das_planilhas()$sql$, 'o Administrador pede a atualização');
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from public.atualizacoes_das_planilhas
   where origem = 'botao' and pedida_por = '00000000-0000-0000-0000-0000000000a1'
     and concluida_em is null and deu_certo is null and ficha_hash ~ '^[0-9a-f]{64}$'),
  1, 'a tentativa fica registrada, sem fim, com a ficha guardada como hash');
set local role authenticated;
insert into _tap (linha) select is(
  (select resultado from public.resultado_das_atualizacoes_das_planilhas where origem = 'botao'), 'em_andamento',
  'a tentativa nova aparece como em andamento');
insert into _tap (linha) select throws_ok(
  $sql$select public.pedir_atualizacao_das_planilhas()$sql$, 'P0001', 'atualizacao_em_andamento',
  'com uma em andamento, o segundo pedido é recusado com atualizacao_em_andamento');
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from public.atualizacoes_das_planilhas where origem = 'botao'), 1,
  'o pedido recusado não registra outra tentativa');
select private.atualizar_planilhas_automaticamente();
insert into _tap (linha) select is(pg_temp.tentativas(), 2,
  'a atualização automática não começa com uma tentativa em andamento');
set local role authenticated;
insert into _tap (linha) select is((select planilha_interna from public.links_das_planilhas()),
  'https://docs.google.com/spreadsheets/d/id-interna-teste/edit', 'o link da planilha interna sai do cofre');
insert into _tap (linha) select is((select planilha_publica from public.links_das_planilhas()),
  'https://docs.google.com/spreadsheets/d/id-publica-teste/edit', 'o link da planilha pública sai do cofre');
insert into _tap (linha) select throws_ok(
  $sql$select ficha_hash from public.atualizacoes_das_planilhas$sql$, '42501', null, 'nem o Administrador lê a ficha');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.atualizacoes_das_planilhas (origem, ficha_hash) values ('automatica', repeat('a', 64))$sql$,
  '42501', null, 'ninguém grava tentativa direto na tabela');
insert into _tap (linha) select throws_ok(
  $sql$update public.atualizacoes_das_planilhas set deu_certo = true$sql$, '42501', null,
  'ninguém altera tentativa direto na tabela');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.atualizacoes_das_planilhas$sql$, '42501', null, 'ninguém apaga tentativa direto na tabela');
reset role;

-- 28 a 31: o resultado calculado (a semente c01 é a concluída).
insert into public.atualizacoes_das_planilhas (id, origem, iniciada_em, ficha_hash)
values ('00000000-0000-0000-0000-000000000c02', 'automatica', now() - interval '11 minutes', pg_temp.hash('antiga'));
insert into public.atualizacoes_das_planilhas (id, origem, iniciada_em, concluida_em, deu_certo, motivo, ficha_hash)
values ('00000000-0000-0000-0000-000000000c03', 'automatica', now() - interval '30 minutes', now() - interval '29 minutes',
  false, 'planilha_publica_recusada', pg_temp.hash('falhou'));
select pg_temp.entrar('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
insert into _tap (linha) select is((select resultado from public.resultado_das_atualizacoes_das_planilhas
  where id = '00000000-0000-0000-0000-000000000c02'), 'sem_resposta', 'sem fim e com mais de 10 minutos é sem resposta');
insert into _tap (linha) select is((select resultado from public.resultado_das_atualizacoes_das_planilhas
  where id = '00000000-0000-0000-0000-000000000c01'), 'concluida', 'terminada com sucesso é concluída');
insert into _tap (linha) select is((select resultado from public.resultado_das_atualizacoes_das_planilhas
  where id = '00000000-0000-0000-0000-000000000c03'), 'falhou', 'terminada sem sucesso é falhou');
insert into _tap (linha) select is((select motivo from public.resultado_das_atualizacoes_das_planilhas
  where id = '00000000-0000-0000-0000-000000000c03'), 'planilha_publica_recusada', 'a falha traz o código do motivo');
reset role;

-- 32 a 40: o resultado volta pela função chamável sem login (R1 e R2 abertas, fichas conhecidas).
insert into public.atualizacoes_das_planilhas (id, origem, iniciada_em, ficha_hash) values
  ('00000000-0000-0000-0000-000000000d01', 'automatica', now(), pg_temp.hash('ficha-r1')),
  ('00000000-0000-0000-0000-000000000d02', 'automatica', now(), pg_temp.hash('ficha-r2'));
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d01', 'ficha-errada', true, null)$sql$,
  'P0001', 'resultado_recusado', 'ficha errada é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d99', 'ficha-r1', true, null)$sql$,
  'P0001', 'resultado_recusado', 'tentativa inexistente é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d01', 'ficha-r2', true, null)$sql$,
  'P0001', 'resultado_recusado', 'a ficha de outra tentativa é recusada');
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from public.atualizacoes_das_planilhas
   where id = '00000000-0000-0000-0000-000000000d01' and concluida_em is null), 1,
  'as recusas não terminaram a tentativa');
set local role anon;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d01', 'ficha-r1', true, null)$sql$,
  'a ficha certa é aceita sem login');
reset role;
insert into _tap (linha) select is(
  (select deu_certo is true and concluida_em is not null from public.atualizacoes_das_planilhas
   where id = '00000000-0000-0000-0000-000000000d01'), true, 'a tentativa terminou como concluída');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d01', 'ficha-r1', true, null)$sql$,
  'P0001', 'resultado_recusado', 'a ficha só vale uma vez');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_resultado_das_planilhas('00000000-0000-0000-0000-000000000d02', 'ficha-r2', false, 'planilha_interna_recusada')$sql$,
  'a falha com motivo é aceita');
reset role;
insert into _tap (linha) select is(
  (select deu_certo::text || ':' || motivo from public.atualizacoes_das_planilhas
   where id = '00000000-0000-0000-0000-000000000d02'), 'false:planilha_interna_recusada',
  'a falha e o motivo ficaram gravados');

-- 41: o agendamento das 9h UTC (6h de Brasília, sem horário de verão).
insert into _tap (linha) select is(
  (select count(*)::int from cron.job
   where jobname = 'atualizar-planilhas-dos-dashboards' and schedule = '0 9 * * *'), 1,
  'o pg_cron agenda a atualização às 9h UTC');

-- 42 a 44: a automática (sem tentativa e com o cofre completo cria uma; não repete; sem cofre não cria).
delete from public.atualizacoes_das_planilhas;
select pg_temp.configurar_cofre();
select private.atualizar_planilhas_automaticamente();
insert into _tap (linha) select is(
  (select count(*)::int from public.atualizacoes_das_planilhas where origem = 'automatica' and pedida_por is null), 1,
  'a atualização automática registra uma tentativa sem autor');
select private.atualizar_planilhas_automaticamente();
insert into _tap (linha) select is(pg_temp.tentativas(), 1, 'a automática não repete com uma em andamento');
delete from public.atualizacoes_das_planilhas;
select pg_temp.vazio_o_cofre();
select private.atualizar_planilhas_automaticamente();
insert into _tap (linha) select is(pg_temp.tentativas(), 0, 'sem cofre a automática não registra tentativa');

-- 45 e 46: só as 10 mais recentes ficam.
insert into public.atualizacoes_das_planilhas (origem, iniciada_em, concluida_em, deu_certo, ficha_hash)
select 'automatica', now() - (n || ' days')::interval, now() - (n || ' days')::interval + interval '1 minute', true,
  pg_temp.hash('x' || n)
from generate_series(1, 12) n;
insert into _tap (linha) select is(pg_temp.tentativas(), 10, 'ficam só as 10 tentativas mais recentes');
insert into _tap (linha) select is(
  (select count(*)::int from public.atualizacoes_das_planilhas where iniciada_em < now() - interval '10 days 12 hours'), 0,
  'as mais antigas saem');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
