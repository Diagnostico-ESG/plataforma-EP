-- ENSAIO TEMPORÁRIO (processos-etapas, ticket 24): monta processos no modelo antigo, recebe as migrações do Andamento
-- livre no ponto marcado (scripts/migracoesPendentes.mjs) e confere a conversão. Só faz sentido enquanto as migrações
-- não estão aplicadas no desenvolvimento; é apagado ao fim do ticket.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(14);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000099', 'T99', 'Setor Conversão');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000099', null, 'Macro Conversão');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000099', 'af000000-0000-0000-0000-000000000099', nome
from unnest(array['Piloto Pendente', 'Em Andamento', 'Concluido Sim', 'Concluido Nao', 'Publicacao Andamento', 'Arquivado',
  'Suspenso']) as nome;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000099' $$;
grant execute on function pg_temp.processo(text) to authenticated;

-- ===== O modelo antigo (só ele existe até a marca) =====
-- As funções do modelo antigo são chamadas por texto: depois da marca, elas não existem mais.
create function pg_temp.antigo(comando text) returns void language plpgsql as $$ begin execute comando; end $$;
grant execute on function pg_temp.antigo(text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo text, nota text default null,
  responsavel uuid default null) returns void
language plpgsql as $$
begin
  execute format('update public.andamentos set status = %L, nota = %L, responsavel_id = coalesce(%L::uuid, responsavel_id)
    where processo_id = %L and etapa_id = (select id from public.etapas where codigo = %L)',
    novo, nota, responsavel, pg_temp.processo(nome_do_processo), codigo_da_etapa);
end $$;
grant execute on function pg_temp.agir(text, text, text, text, uuid) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T99_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;

create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1, null,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.acrescentar_relatorio(versao, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- As etapas 1 a 4 realizadas antes, a Aprovação em andamento e concluída com a escolha.
create function pg_temp.aprovar(nome_do_processo text, vai boolean) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'aprovacao_setor', 'em_andamento');
  execute format('select public.concluir_aprovacao(
      (select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
        where a.processo_id = %L and e.codigo = %L), null, null, null, null, %L)',
    pg_temp.processo(nome_do_processo), 'aprovacao_setor', vai);
end $$;
grant execute on function pg_temp.aprovar(text, boolean) to authenticated;

set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from unnest(array['Concluido Sim', 'Concluido Nao', 'Publicacao Andamento', 'Arquivado']) as nome;
select pg_temp.claims('a2');
select pg_temp.aprovar(nome, true) from unnest(array['Concluido Sim', 'Publicacao Andamento']) as nome;
select pg_temp.aprovar(nome, false) from unnest(array['Concluido Nao', 'Arquivado']) as nome;
select pg_temp.agir('Concluido Sim', 'publicacao', 'concluida');
select pg_temp.antigo(format('select public.arquivar_processo(%L)', pg_temp.processo('Arquivado')));
select pg_temp.agir('Em Andamento', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Em Andamento', 'relatorio_modelagem_tecnica', 'em_andamento', null, '00000000-0000-0000-0000-0000000000a2');
select pg_temp.agir('Suspenso', 'modelagem', 'em_andamento', null, '00000000-0000-0000-0000-0000000000a1');
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
reset role;

-- ===== As migrações =====
-- ensaio: migrações pendentes aqui

-- ===== Depois da conversão =====
create function pg_temp.estado(nome_do_processo text) returns table (etapa text, etiqueta text, responsavel text,
  situacao text, publicado_em date, explicacao text, arquivado boolean)
language sql stable as $$
  select v.etapa_atual_codigo, v.etiqueta::text, v.responsavel_id::text, v.situacao, p.publicado_em,
    p.explicacao_sem_publicacao, p.arquivado_em is not null
  from public.processos_com_andamento v join public.processos p on p.id = v.id where v.id = pg_temp.processo(nome_do_processo) $$;

insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Piloto Pendente')$sql$,
  $sql$values ('nao_iniciados', 'a_fazer', null::text, 'em_andamento', null::date, null::text, false)$sql$,
  'a Modelagem piloto pendente vai para Não iniciados, A fazer, sem responsável');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Em Andamento')$sql$,
  $sql$values ('relatorio_modelagem_tecnica', 'em_andamento', '00000000-0000-0000-0000-0000000000a2', 'em_andamento',
    null::date, null::text, false)$sql$, 'a etapa em andamento fica, Em andamento, com o responsável dela');
insert into _tap (linha) select is(
  (select entrou_na_etapa_em from public.processos_com_andamento where id = pg_temp.processo('Em Andamento')),
  pg_temp.hoje()::timestamp at time zone 'America/Sao_Paulo', 'a entrada é o início da etapa, à meia-noite de Brasília');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Concluido Sim')$sql$,
  $sql$values ('concluidos', 'concluido', null::text, 'concluido', pg_temp.hoje(), null::text, false)$sql$,
  'o concluído com escolha "sim" vai a Concluídos com a data da Publicação');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Concluido Nao')$sql$,
  $sql$values ('concluidos', 'concluido', null::text, 'concluido', null::date,
    'Concluído sem publicação no modelo anterior da plataforma.', false)$sql$,
  'o concluído com escolha "não" vai a Concluídos com a explicação fixa');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Publicacao Andamento')$sql$,
  $sql$values ('publicacao', 'em_andamento', null::text, 'em_andamento', null::date, null::text, false)$sql$,
  'a escolha "sim" com a Publicação em andamento fica na Publicação, sem data');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Arquivado')$sql$,
  $sql$values ('concluidos', 'concluido', null::text, 'concluido', null::date,
    'Concluído sem publicação no modelo anterior da plataforma.', true)$sql$,
  'o arquivado continua arquivado, em Concluídos');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.estado('Suspenso')$sql$,
  $sql$values ('modelagem', 'em_andamento', '00000000-0000-0000-0000-0000000000a1', 'suspenso', null::date, null::text, false)$sql$,
  'o suspenso fica na etapa dele, com a etiqueta e o responsável');
insert into _tap (linha) select is(
  (select count(*) from public.passagens pa join public.processos p on p.id = pa.processo_id
    where p.setor_id = '5f000000-0000-0000-0000-000000000099' and pa.saiu_em is null and pa.movido_por is null),
  7::bigint, 'cada processo ganhou uma passagem aberta, sem quem moveu');
insert into _tap (linha) select is((select count(*) from public.passagens where saiu_em is null and concluido_em is null
  and etiqueta = 'concluido'), 0::bigint, 'toda passagem convertida com Concluído tem a data do Concluído');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'andamento'), 0::bigint,
  'os eventos de andamento sumiram');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo'
  and acao in ('escolher_publicacao', 'apagar_escolha_de_publicacao', 'nao_vai_mais_para_publicacao', 'registrar_publicacao')),
  0::bigint, 'os eventos da escolha de publicação sumiram');
insert into _tap (linha) select results_eq(
  $sql$select (select count(*) from public.eventos where entidade = 'processo' and acao = 'criar'
      and entidade_ref in (select id::text from public.processos where setor_id = '5f000000-0000-0000-0000-000000000099')),
    (select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar'
      and entidade_ref in (select id::text from public.processos where setor_id = '5f000000-0000-0000-0000-000000000099')),
    (select count(*) from public.eventos where entidade = 'processo' and acao = 'suspender'
      and entidade_ref = pg_temp.processo('Suspenso')::text)$sql$,
  $sql$values (7::bigint, 4::bigint, 1::bigint)$sql$, 'os eventos de cadastro, versão e situação ficaram');
insert into _tap (linha) select hasnt_table('public', 'andamentos', 'a tabela de andamentos saiu');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
