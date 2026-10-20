-- Editar revisões e aprovação (revisoes-aprovacao, ticket 04, ADR 0015): quem pode alterar o quê em revisoes_internas
-- (escopo e comentário) e em aprovacoes (número, link e data), as regras que a edição confere de novo (perfil, processo
-- em andamento, escopo coerente com o resultado, link http(s), data nunca no futuro e no dia da última revisão interna
-- ou depois), as colunas que não mudam (privilégio por coluna) e um evento "editar" com o antes e o depois.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(49);

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

-- Um setor, um macroprocesso e os processos.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000041', 'T41', 'Setor Edicao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000041', null, 'Macro Edicao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000041', 'af000000-0000-0000-0000-000000000041', nome
from unnest(array['Corrigida', 'Sem Alteracao', 'Sem Numero', 'Parado', 'Cancelado']) as nome;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id
  where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo public.status_da_etapa,
  nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, text, public.status_da_etapa, text) to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpm + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T41_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    null, pg_temp.par()) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

-- A versão completa: o par .bpm + .png e o relatório acrescentado depois (registrar_versao só exige o par).
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := pg_temp.enviar(nome_do_processo);
begin
  perform public.acrescentar_relatorio(versao, (select numero from public.versoes where id = versao),
    pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- A V1 completa de a1 revisada "sem alteração" por a2, até a Aprovação em andamento (sem aprovar).
create function pg_temp.ate_a_aprovacao_revisando(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'em_andamento');
  perform public.concluir_revisao_interna(pg_temp.andamento(nome_do_processo, 'revisao_interna'), 'sem_alteracao', null, null, null);
  perform public.avancar_etapa(pg_temp.andamento(nome_do_processo, 'revisao_setor'), 'concluir', null, null);
end $$;
grant execute on function pg_temp.ate_a_aprovacao_revisando(text) to authenticated;

-- A V1 de a1 e a V2 completa de a2, que a corrige (revisão "corrigida", escopo fluxograma), até a Aprovação em andamento.
create function pg_temp.ate_a_aprovacao_corrigindo(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.claims('a1');
  perform pg_temp.enviar(nome_do_processo);
  perform pg_temp.claims('a2');
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'em_andamento');
  perform pg_temp.enviar_completa(nome_do_processo);
  perform public.concluir_revisao_interna(pg_temp.andamento(nome_do_processo, 'revisao_interna'), 'corrigida', 'fluxograma',
    'Ajustei o fluxo', null);
  perform public.avancar_etapa(pg_temp.andamento(nome_do_processo, 'revisao_setor'), 'concluir', null, null);
end $$;
grant execute on function pg_temp.ate_a_aprovacao_corrigindo(text) to authenticated;

create function pg_temp.aprovar(nome_do_processo text, numero text default null, link text default null,
  data date default null, responsavel uuid default null) returns void
language sql as $$
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), numero, link, data, responsavel) $$;
grant execute on function pg_temp.aprovar(text, text, text, date, uuid) to authenticated;

-- Quantos eventos "editar" o processo tem para a entidade.
create function pg_temp.edicoes(a_entidade text, nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos
  where entidade = a_entidade and acao = 'editar' and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.edicoes(text, text) to authenticated;

set local role authenticated;

-- ===== Preparação: cinco processos com revisão e aprovação =====
select pg_temp.ate_a_aprovacao_corrigindo('Corrigida');
select pg_temp.aprovar('Corrigida', 'PROT-1', 'https://eprotocolo.example/a', (now() at time zone 'America/Sao_Paulo')::date);
select pg_temp.ate_a_aprovacao_corrigindo('Sem Numero');
select pg_temp.aprovar('Sem Numero');
select pg_temp.ate_a_aprovacao_corrigindo('Parado');
select pg_temp.aprovar('Parado', 'PROT-P');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
select pg_temp.ate_a_aprovacao_corrigindo('Cancelado');
select pg_temp.aprovar('Cancelado', 'PROT-C');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistência do setor');
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Sem Alteracao');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao_revisando('Sem Alteracao');

-- ===== Revisão: edições aceitas (a2 integrante, com a Revisão interna já concluída) =====
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set escopo = 'relatorio', comentario = '  Texto novo  '
    where processo_id = pg_temp.processo('Corrigida')$sql$,
  'integrante edita o escopo e o comentário da revisão corrigida');
insert into _tap (linha) select results_eq(
  $sql$select escopo::text, comentario from public.revisoes_internas where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values ('relatorio', 'Texto novo')$sql$, 'o escopo novo fica e o comentário vem aparado');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'escopo', detalhes->'depois'->>'escopo', detalhes->'antes'->>'comentario',
    detalhes->'depois'->>'comentario'
    from public.eventos where entidade = 'revisao_interna' and acao = 'editar'
      and entidade_ref = pg_temp.processo('Corrigida')::text$sql$,
  $sql$values ('fluxograma', 'relatorio', 'Ajustei o fluxo', 'Texto novo')$sql$,
  'um evento "editar" liga a revisão ao processo, com o escopo e o comentário de antes e de depois');
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set comentario = '   ' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'comentário só com espaços é aceito');
insert into _tap (linha) select results_eq(
  $sql$select comentario is null from public.revisoes_internas where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values (true)$sql$, 'comentário vazio vira nulo');
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set comentario = 'Pelo admin' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'administrador também edita a revisão');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set comentario = 'Pelo admin' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'salvar a revisão sem mudar nada é aceito');
insert into _tap (linha) select is(pg_temp.edicoes('revisao_interna', 'Corrigida'), 3::bigint,
  'e não gera evento: só as três edições que mudaram algo');

-- ===== Revisão: edições recusadas =====
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set escopo = null where processo_id = pg_temp.processo('Corrigida')$sql$,
  'P0001', 'escopo_obrigatorio', 'tirar o escopo da revisão corrigida é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set escopo = 'ambos' where processo_id = pg_temp.processo('Sem Alteracao')$sql$,
  'P0001', 'escopo_so_na_corrigida', 'pôr escopo na revisão sem alteração é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set resultado = 'sem_alteracao' where processo_id = pg_temp.processo('Corrigida')$sql$,
  '42501', null, 'o resultado da revisão não muda');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set versao_revisada_id = gen_random_uuid()$sql$,
  '42501', null, 'a versão revisada não muda');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set revisor_id = '00000000-0000-0000-0000-0000000000a1'$sql$,
  '42501', null, 'o revisor não muda');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set revisada_em = (now() at time zone 'America/Sao_Paulo')::date$sql$,
  '42501', null, 'a data da revisão não muda');

-- ===== Aprovação: edições aceitas =====
insert into _tap (linha) select lives_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = '  PROT-9  ', link = '  http://novo.example/b  ',
    aprovada_em = (now() at time zone 'America/Sao_Paulo')::date where processo_id = pg_temp.processo('Corrigida')$sql$,
  'integrante edita o número, o link e a data da aprovação');
insert into _tap (linha) select results_eq(
  $sql$select numero_eprotocolo, link, aprovada_em from public.aprovacoes where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values ('PROT-9', 'http://novo.example/b', (now() at time zone 'America/Sao_Paulo')::date)$sql$, 'número e link ficam aparados');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'numero_eprotocolo', detalhes->'depois'->>'numero_eprotocolo',
    detalhes->'antes'->>'link', detalhes->'depois'->>'link'
    from public.eventos where entidade = 'aprovacao' and acao = 'editar'
      and entidade_ref = pg_temp.processo('Corrigida')::text$sql$,
  $sql$values ('PROT-1', 'PROT-9', 'https://eprotocolo.example/a', 'http://novo.example/b')$sql$,
  'um evento "editar" liga a aprovação ao processo, com o número e o link de antes e de depois');
insert into _tap (linha) select lives_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'PROT-2' where processo_id = pg_temp.processo('Sem Numero')$sql$,
  'acrescentar o número a uma aprovação concluída sem ele é aceito');
insert into _tap (linha) select results_eq(
  $sql$select a.numero_eprotocolo, jsonb_typeof(e.detalhes->'antes'->'numero_eprotocolo')
    from public.aprovacoes a, public.eventos e
    where a.processo_id = pg_temp.processo('Sem Numero') and e.entidade = 'aprovacao' and e.acao = 'editar'
      and e.entidade_ref = pg_temp.processo('Sem Numero')::text$sql$,
  $sql$values ('PROT-2', 'null')$sql$, 'o número fica e o evento guarda o antes vazio');
insert into _tap (linha) select lives_ok(
  $sql$update public.aprovacoes set link = '', aprovada_em = null where processo_id = pg_temp.processo('Corrigida')$sql$,
  'limpar o link e a data é aceito');
insert into _tap (linha) select results_eq(
  $sql$select link is null, aprovada_em is null from public.aprovacoes where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values (true, true)$sql$, 'link vazio e data vazia voltam a nulo');
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'PROT-ADM' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'administrador também edita a aprovação');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'PROT-ADM' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'salvar a aprovação sem mudar nada é aceito');
insert into _tap (linha) select is(pg_temp.edicoes('aprovacao', 'Corrigida'), 3::bigint,
  'e não gera evento: só as três edições que mudaram algo');

-- ===== Aprovação: edições recusadas =====
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set link = 'ftp://x.example/a' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'P0001', 'link_invalido', 'link ftp:// é recusado na edição');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set link = 'x.example/a' where processo_id = pg_temp.processo('Corrigida')$sql$,
  'P0001', 'link_invalido', 'link sem esquema é recusado na edição');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set aprovada_em = (now() at time zone 'America/Sao_Paulo')::date + 1 where processo_id = pg_temp.processo('Corrigida')$sql$,
  'P0001', 'data_no_futuro:' || ((now() at time zone 'America/Sao_Paulo')::date + 1)::text, 'data no futuro é recusada na edição');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set aprovada_em = (now() at time zone 'America/Sao_Paulo')::date - 1 where processo_id = pg_temp.processo('Corrigida')$sql$,
  'P0001', 'aprovacao_antes_da_revisao:' || ((now() at time zone 'America/Sao_Paulo')::date - 1)::text || ':' || (now() at time zone 'America/Sao_Paulo')::date::text,
  'data antes da última revisão interna é recusada na edição, com as duas datas');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set versao_id = gen_random_uuid()$sql$, '42501', null, 'a versão aprovada não muda');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set processo_id = gen_random_uuid()$sql$, '42501', null, 'a aprovação não muda de processo');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set registrada_por = '00000000-0000-0000-0000-0000000000a1'$sql$,
  '42501', null, 'quem registrou não muda');

-- ===== Processo suspenso e cancelado: tudo congelado =====
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set comentario = 'x' where processo_id = pg_temp.processo('Parado')$sql$,
  'P0001', 'processo_parado:suspenso', 'revisão de processo suspenso não se edita');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'X' where processo_id = pg_temp.processo('Parado')$sql$,
  'P0001', 'processo_parado:suspenso', 'aprovação de processo suspenso não se edita');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set comentario = 'x' where processo_id = pg_temp.processo('Cancelado')$sql$,
  'P0001', 'processo_parado:cancelado', 'revisão de processo cancelado não se edita');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'X' where processo_id = pg_temp.processo('Cancelado')$sql$,
  'P0001', 'processo_parado:cancelado', 'aprovação de processo cancelado não se edita');

-- ===== Perfis: consulta, inativo e visitante =====
select pg_temp.claims('a3');
insert into _tap (linha) select results_eq(
  $sql$with u as (update public.revisoes_internas set comentario = 'x' returning 1) select count(*)::int from u$sql$,
  $sql$values (0)$sql$, 'consulta não altera nenhuma revisão: a política não deixa linha à vista');
insert into _tap (linha) select results_eq(
  $sql$with u as (update public.aprovacoes set numero_eprotocolo = 'X' returning 1) select count(*)::int from u$sql$,
  $sql$values (0)$sql$, 'consulta não altera nenhuma aprovação');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where acao = 'editar' and entidade in ('revisao_interna', 'aprovacao')) > 0,
  'consulta lê os eventos de edição');
select pg_temp.claims('a4');
insert into _tap (linha) select results_eq(
  $sql$with u as (update public.revisoes_internas set comentario = 'x' returning 1) select count(*)::int from u$sql$,
  $sql$values (0)$sql$, 'inativo não altera nenhuma revisão');
insert into _tap (linha) select results_eq(
  $sql$with u as (update public.aprovacoes set numero_eprotocolo = 'X' returning 1) select count(*)::int from u$sql$,
  $sql$values (0)$sql$, 'inativo não altera nenhuma aprovação');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where acao = 'editar' and entidade in ('revisao_interna', 'aprovacao')), 0::bigint,
  'inativo não lê os eventos de edição');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set comentario = 'x'$sql$, '42501', null, 'visitante não altera revisão');
insert into _tap (linha) select throws_ok(
  $sql$update public.aprovacoes set numero_eprotocolo = 'X'$sql$, '42501', null, 'visitante não altera aprovação');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'preparar_edicao_da_revisao'
    and tgrelid = 'public.revisoes_internas'::regclass), 1, 'existe o gatilho que prepara a edição da revisão');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'registrar_evento_da_revisao_editada'
    and tgrelid = 'public.revisoes_internas'::regclass), 1, 'existe o gatilho do evento da revisão editada');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'preparar_edicao_da_aprovacao'
    and tgrelid = 'public.aprovacoes'::regclass), 1, 'existe o gatilho que prepara a edição da aprovação');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'registrar_evento_da_aprovacao_editada'
    and tgrelid = 'public.aprovacoes'::regclass), 1, 'existe o gatilho do evento da aprovação editada');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'registrar_evento_da_revisao_editada'
    and pronamespace = 'private'::regnamespace), true, 'o evento da revisão editada grava como definidor');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'preparar_edicao_da_revisao'
    and pronamespace = 'private'::regnamespace), false, 'preparar a edição da revisão não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
