-- Andamento livre, mover o processo (processos-etapas, ticket 24; ADRs 0022 e 0024): o cadastro em Não iniciados, mover
-- para qualquer etapa ativa, a própria etapa sem nada novo, a passagem fechada e a aberta, quem move vira responsável,
-- um evento só, suspenso, cancelado e arquivado recusados, a chegada a Concluídos (sem nada, com data, com explicação,
-- com a data já registrada) e a saída de lá.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(39);

-- Usuários inventados: a1 administrador, a2 integrante.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000052', 'T52', 'Setor Mover');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000052', null, 'Macro Mover');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000052', 'af000000-0000-0000-0000-000000000052', nome
from unnest(array['Cadastro', 'Anda', 'Mesma', 'Suspenso', 'Cancelado', 'Arquivado', 'Chega', 'Publicado', 'Sai']) as nome;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000052' $$;
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

create function pg_temp.passagens(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.passagens where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.passagens(text) to authenticated;

create function pg_temp.movimentos(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'passagem' and acao = 'mover'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.movimentos(text) to authenticated;

-- Trava de arquivos (ticket 11): quem atravessa a Modelagem piloto e a técnica precisa de versão piloto, versão em sequência
-- e relatório numerado. Os processos que o teste leva adiante recebem os três antes (arquivos inventados).
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T52_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.com_arquivos(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.registrar_versao(pg_temp.processo(nome_do_processo), 1, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')), true);
  perform public.registrar_versao(pg_temp.processo(nome_do_processo), 2,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('relatorio', 'docx')), false, 1);
end $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.com_arquivos(text) to authenticated;

-- ===== Cadastro =====
set local role authenticated;
select pg_temp.claims('a2');
select pg_temp.com_arquivos(nome) from unnest(array['Anda', 'Arquivado', 'Chega', 'Publicado', 'Sai']) as nome;
insert into _tap (linha) select results_eq(
  $sql$select p.etapa_id = pg_temp.etapa('nao_iniciados'), p.etiqueta::text, p.saiu_em, p.movido_por, p.concluido_em,
    (select responsavel_id from public.processos where id = p.processo_id)
    from public.passagens p where p.processo_id = pg_temp.processo('Cadastro')$sql$,
  $sql$values (true, 'a_fazer', null::timestamptz, null::uuid, null::timestamptz, null::uuid)$sql$,
  'o processo cadastrado tem uma passagem aberta em Não iniciados, A fazer, sem responsável');
insert into _tap (linha) select is(pg_temp.movimentos('Cadastro'), 0::bigint, 'o cadastro não gera evento de movimento');

-- ===== Mover para a frente, para trás e para etapa inativa =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Anda', 'revisao_interna')$sql$,
  'de Não iniciados à Revisão interna é aceito');
update public.passagens set etiqueta = 'em_andamento' where processo_id = pg_temp.processo('Anda') and saiu_em is null;
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Anda', 'aprovacao_setor')$sql$,
  'da Revisão interna à Aprovação é aceito');
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Anda', 'modelagem')$sql$,
  'da Aprovação de volta à Modelagem piloto é aceito');
insert into _tap (linha) select is(pg_temp.passagens('Anda'), 4::bigint, 'cada movimento abriu uma passagem nova');
insert into _tap (linha) select is((select count(*) from public.passagens where processo_id = pg_temp.processo('Anda')
  and saiu_em is null), 1::bigint, 'uma só passagem continua aberta');
insert into _tap (linha) select results_eq(
  $sql$select e.codigo, p.saiu_em is not null, p.movido_por::text from public.passagens p join public.etapas e on e.id = p.etapa_id
    where p.processo_id = pg_temp.processo('Anda') and e.codigo = 'aprovacao_setor'$sql$,
  $sql$values ('aprovacao_setor', true, '00000000-0000-0000-0000-0000000000a2')$sql$,
  'a passagem anterior ficou fechada, com quem a abriu');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, etiqueta::text, responsavel_id::text from public.processos_com_andamento
    where id = pg_temp.processo('Anda')$sql$,
  $sql$values ('modelagem', 'a_fazer', null::text)$sql$,
  'a passagem nova começa em A fazer, e quem moveu não vira o responsável (sem responsável inicial, fica sem)');
insert into _tap (linha) select is((select movido_por::text from public.passagens where processo_id = pg_temp.processo('Anda')
  and saiu_em is null), '00000000-0000-0000-0000-0000000000a1', 'a passagem aberta guarda quem moveu');
insert into _tap (linha) select is(pg_temp.movimentos('Anda'), 3::bigint, 'cada movimento gera um evento');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade_ref = pg_temp.processo('Anda')::text
  and acao in ('mudar_responsavel', 'mudar_etiqueta')), 1::bigint,
  'mover não gera evento de responsável nem de etiqueta (só a etiqueta mudada à mão)');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'etapa_codigo', detalhes->'depois'->>'etapa_codigo', detalhes->'antes'->>'responsavel_id',
    detalhes->'depois'->>'responsavel_id', autor_id::text
    from public.eventos where entidade = 'passagem' and acao = 'mover' and entidade_ref = pg_temp.processo('Anda')::text
    order by id desc limit 1$sql$,
  $sql$values ('aprovacao_setor', 'modelagem', null::text, null::text,
    '00000000-0000-0000-0000-0000000000a1')$sql$,
  'o evento do movimento leva a etapa e o responsável de antes e de depois');

reset role;
select public.acrescentar_etapa('etapa_t52', 'Etapa T52', 'V', (select id from public.etapas where codigo = 'publicacao'));
update public.etapas set ativa = false where codigo = 'etapa_t52';
set local role authenticated;
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('Anda', 'etapa_t52')$sql$,
  'P0001', 'etapa_inativa:Etapa T52', 'etapa inativa é recusada');

-- ===== Mover para a própria etapa =====
select pg_temp.mover('Mesma', 'modelagem');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Mesma', 'modelagem')$sql$, 'mover para a própria etapa é aceito');
insert into _tap (linha) select results_eq($sql$select pg_temp.passagens('Mesma'), pg_temp.movimentos('Mesma')$sql$,
  $sql$values (2::bigint, 1::bigint)$sql$, 'mas não abre passagem nem gera evento');

-- ===== Suspenso, cancelado e o concluído que estava arquivado =====
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');
select public.mover_processo(pg_temp.processo('Arquivado'), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('Suspenso', 'modelagem')$sql$,
  'P0001', 'processo_parado:suspenso', 'o suspenso não se move');
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('Cancelado', 'modelagem')$sql$,
  'P0001', 'processo_parado:cancelado', 'o cancelado não se move');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Arquivado', 'modelagem')$sql$,
  'o concluído que estava arquivado se move como qualquer concluído');
insert into _tap (linha) select lives_ok($sql$select public.retomar_processo(pg_temp.processo('Suspenso'), 'Voltou')$sql$,
  'retomar o suspenso é aceito');
insert into _tap (linha) select results_eq(
  $sql$select etapa_atual_codigo, pg_temp.passagens('Suspenso') from public.processos_com_andamento where id = pg_temp.processo('Suspenso')$sql$,
  $sql$values ('nao_iniciados', 1::bigint)$sql$, 'e ele continua na mesma etapa, na mesma passagem');

-- ===== Chegada a Concluídos =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.mover('Chega', 'concluidos')$sql$,
  'P0001', 'publicacao_ou_explicacao_obrigatoria', 'chegar a Concluídos sem data nem explicação é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Chega'), pg_temp.etapa('concluidos'), null, null, '   ')$sql$,
  'P0001', 'explicacao_obrigatoria', 'chegar com a explicação em branco é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Chega'), pg_temp.etapa('concluidos'), null, null, repeat('a', 2001))$sql$,
  'P0001', 'explicacao_longa:2001', 'chegar com explicação de 2.001 caracteres é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Chega'), pg_temp.etapa('concluidos'), pg_temp.hoje() + 1)$sql$,
  'P0001', 'data_no_futuro:' || (pg_temp.hoje() + 1)::text, 'chegar com a data de amanhã é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.mover_processo(pg_temp.processo('Chega'), pg_temp.etapa('concluidos'), pg_temp.hoje(), 'ftp://diario.exemplo')$sql$,
  'P0001', 'link_invalido', 'chegar com link fora de http(s) é recusado');
insert into _tap (linha) select is((pg_temp.linha('Chega')).etapa_atual_codigo, 'nao_iniciados', 'as recusas deixam o processo onde estava');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_processo(pg_temp.processo('Chega'), pg_temp.etapa('concluidos'), null, null, '  Processo interno  ')$sql$,
  'chegar com a explicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select l.situacao, l.etiqueta::text, l.sem_publicacao, p.explicacao_sem_publicacao,
    (select concluido_em is not null from public.passagens where processo_id = l.id and saiu_em is null)
    from public.processos_com_andamento l join public.processos p on p.id = l.id where l.id = pg_temp.processo('Chega')$sql$,
  $sql$values ('concluido', 'concluido', true, 'Processo interno', true)$sql$,
  'em Concluídos: situação concluído, etiqueta Concluído com a data, sem publicação, explicação aparada');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_processo(pg_temp.processo('Publicado'), pg_temp.etapa('concluidos'), pg_temp.hoje() - 3,
    'https://diario.exemplo/1')$sql$, 'chegar com a data e o link é aceito');
insert into _tap (linha) select results_eq(
  $sql$select publicado_em, link_da_publicacao, sem_publicacao from public.processos_com_andamento where id = pg_temp.processo('Publicado')$sql$,
  $sql$values (pg_temp.hoje() - 3, 'https://diario.exemplo/1', false)$sql$, 'a data e o link ficam no processo');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'depois'->>'publicado_em', detalhes->'depois'->>'link_da_publicacao' from public.eventos
    where entidade = 'passagem' and acao = 'mover' and entidade_ref = pg_temp.processo('Publicado')::text$sql$,
  $sql$values ((pg_temp.hoje() - 3)::text, 'https://diario.exemplo/1')$sql$, 'o evento da chegada leva a data e o link');

-- ===== Saída de Concluídos =====
select public.mover_processo(pg_temp.processo('Sai'), pg_temp.etapa('concluidos'), null, null, 'Sem divulgação');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Sai', 'publicacao')$sql$, 'sair de Concluídos é aceito');
insert into _tap (linha) select results_eq(
  $sql$select l.situacao, p.explicacao_sem_publicacao from public.processos_com_andamento l join public.processos p on p.id = l.id
    where l.id = pg_temp.processo('Sai')$sql$,
  $sql$values ('em_andamento', null::text)$sql$, 'a saída apaga a explicação, e o processo volta a em andamento');
insert into _tap (linha) select is((select detalhes->'antes'->>'explicacao_sem_publicacao' from public.eventos
  where entidade = 'passagem' and acao = 'mover' and entidade_ref = pg_temp.processo('Sai')::text order by id desc limit 1),
  'Sem divulgação', 'a explicação apagada vai no antes do evento do movimento');
select pg_temp.mover('Publicado', 'publicacao');
insert into _tap (linha) select is((pg_temp.linha('Publicado')).publicado_em, pg_temp.hoje() - 3, 'a saída mantém a data da publicação');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Publicado', 'concluidos')$sql$,
  'com a data já registrada, a volta a Concluídos não pede nada');

-- ===== As colunas de publicação mudam só pelas funções =====
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set publicado_em = pg_temp.hoje() where id = pg_temp.processo('Cadastro')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'administrador não grava a data da publicação direto');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set explicacao_sem_publicacao = 'Direto' where id = pg_temp.processo('Cadastro')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'administrador não grava a explicação direto');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
