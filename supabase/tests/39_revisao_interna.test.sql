-- Registrar a revisão interna sem trava (revisoes-aprovacao, ticket 05, ADR 0023): quem pode o quê em revisoes_internas e
-- nos eventos dela e as regras do banco na inclusão (processo em andamento e na Revisão interna, versão, uma revisão por
-- passagem, "sem alteração" na mais recente, "corrigida" na versão enviada pela Revisão interna nesta passagem, o autor
-- aceito, nada se apaga, mover não mexe, processo com revisão não se exclui, um evento por revisão). A gravação entra
-- direto na tabela; os gatilhos decidem. A edição da revisão é do teste 41.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(47);

-- Trava de arquivos (ticket 11): este teste monta o cenário e não prova a trava (ela é do 59), então move sem ela. A
-- função desliga, só durante o movimento e com o dono do banco, as etapas com trava que ficam antes do destino.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid, p_data date default null, p_link text default null,
  p_explicacao text default null) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, p_data, p_link, p_explicacao);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid, date, text, text) to authenticated;

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000039', 'T39', 'Setor Revisao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000039', null, 'Macro Revisao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', nome
from unnest(array['Sem Alteracao', 'Corrigida', 'Autor', 'Sem Versao', 'Volta', 'Antiga', 'Parado', 'Cancelado',
  'Concluido', 'Etapa Errada', 'Perfis', 'Move', 'Arquivado']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000039';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000039' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$
  select pg_temp.mover_sem_trava(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T39_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
-- Quem envia é quem está nas claims; a função recusa um número diferente do próximo (maior + 1).
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    pg_temp.par()) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

-- Numa transação só, `enviada_em` é o início dela (now()) e a entrada da passagem é clock_timestamp(): uma versão enviada
-- depois do movimento pareceria anterior. Em produção cada pedido é uma transação. O auxiliar (definidor, dono do teste)
-- carimba a versão mais recente do processo com o relógio de agora, como se tivesse sido enviada num pedido posterior.
create function pg_temp.enviar_na_passagem(nome_do_processo text) returns void
language plpgsql security definer as $$
declare
  versao uuid := pg_temp.enviar(nome_do_processo);
begin
  update public.versoes set enviada_em = clock_timestamp() where id = versao;
end $$;
grant execute on function pg_temp.enviar_na_passagem(text) to authenticated;

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

create function pg_temp.revisar(nome_do_processo text, resultado public.resultado_da_revisao,
  escopo public.escopo_da_correcao default null, comentario text default null) returns void
language sql as $$
  insert into public.revisoes_internas (processo_id, resultado, escopo, comentario)
  values (pg_temp.processo(nome_do_processo), resultado, escopo, comentario) $$;
grant execute on function pg_temp.revisar(text, public.resultado_da_revisao, public.escopo_da_correcao, text) to authenticated;

create function pg_temp.revisoes(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.revisoes_internas where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.revisoes(text) to authenticated;

select pg_temp.claims('a2');
set local role authenticated;

-- ===== Sem alteração (a2 revisa a versão de a1) =====
select pg_temp.claims('a1');
select pg_temp.enviar('Sem Alteracao');
select pg_temp.claims('a2');
select pg_temp.mover('Sem Alteracao', 'revisao_interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Sem Alteracao', 'sem_alteracao', null, '  Segue  ')$sql$,
  'revisar "sem alteração" a versão de outra pessoa é aceito');
insert into _tap (linha) select results_eq(
  $sql$select resultado::text, escopo::text, comentario, revisor_id::text, revisada_em, (versao_corrigida_id is null),
    (versao_revisada_id = (select id from public.versoes where processo_id = pg_temp.processo('Sem Alteracao') and numero = 1)),
    (passagem_id = (select id from public.passagens where processo_id = pg_temp.processo('Sem Alteracao') and saiu_em is null))
    from public.revisoes_internas where processo_id = pg_temp.processo('Sem Alteracao')$sql$,
  $sql$values ('sem_alteracao', null::text, 'Segue', '00000000-0000-0000-0000-0000000000a2', (now() at time zone 'America/Sao_Paulo')::date, true, true, true)$sql$,
  'a revisão guarda o resultado, o comentário aparado, o revisor, o dia, a versão revisada e a passagem aberta');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where id = pg_temp.processo('Sem Alteracao')),
  'revisao_interna', 'registrar a revisão não move o processo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'revisao_interna' and acao = 'registrar'
    and entidade_ref = pg_temp.processo('Sem Alteracao')::text and detalhes -> 'antes' = 'null'::jsonb
    and detalhes -> 'depois' ->> 'resultado' = 'sem_alteracao' and detalhes -> 'depois' ->> 'versao_revisada' = 'V1'), 1::bigint,
  'a revisão gera um evento, ligado ao processo, com o depois');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Sem Alteracao', 'sem_alteracao')$sql$, 'P0001', 'revisao_ja_registrada',
  'a segunda revisão na mesma passagem é recusada');

-- ===== O autor revisa a própria versão (aceito, sem trava) =====
select pg_temp.enviar('Autor');
select pg_temp.mover('Autor', 'revisao_interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Autor', 'sem_alteracao')$sql$, 'o autor da versão a revisa "sem alteração"');

-- ===== Corrigida: a versão enviada pela Revisão interna nesta passagem corrige a anterior =====
select pg_temp.claims('a1');
select pg_temp.enviar('Corrigida');
select pg_temp.claims('a2');
select pg_temp.mover('Corrigida', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Corrigida', 'corrigida', 'ambos')$sql$, 'P0001', 'corrigida_sem_versao_na_passagem',
  '"corrigida" sem versão enviada desde a entrada é recusada');
select pg_temp.enviar_na_passagem('Corrigida');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Corrigida', 'corrigida', 'ambos')$sql$,
  '"corrigida" com a versão enviada nesta passagem é aceito, mesmo sendo do revisor');
insert into _tap (linha) select results_eq(
  $sql$select resultado::text, escopo::text, comentario,
    (versao_revisada_id = (select id from public.versoes where processo_id = pg_temp.processo('Corrigida') and numero = 1)),
    (versao_corrigida_id = (select id from public.versoes where processo_id = pg_temp.processo('Corrigida') and numero = 2))
    from public.revisoes_internas where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values ('corrigida', 'ambos', null::text, true, true)$sql$,
  'a revisada é a V1, a corrigida é a V2, o escopo fica e o comentário vazio vira nulo');

-- Uma versão só, enviada na passagem, não tem anterior a corrigir.
select pg_temp.mover('Volta', 'revisao_interna');
select pg_temp.enviar_na_passagem('Volta');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Volta', 'corrigida', 'fluxograma')$sql$, 'P0001', 'corrigida_sem_versao_na_passagem',
  '"corrigida" sem versão anterior é recusada');

-- ===== Escopo e versão =====
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Volta', 'sem_alteracao', 'ambos')$sql$, 'P0001', 'escopo_so_na_corrigida',
  '"sem alteração" com escopo é recusado');
select pg_temp.claims('a1');
select pg_temp.enviar_na_passagem('Volta');
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Volta', 'corrigida')$sql$, 'P0001', 'escopo_obrigatorio', '"corrigida" sem escopo é recusado');
select pg_temp.mover('Sem Versao', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Sem Versao', 'sem_alteracao')$sql$, 'P0001', 'sem_versao', 'processo sem versão é recusado');

-- ===== Uma revisão por passagem: sair e voltar abre a passagem para outra =====
select pg_temp.revisar('Volta', 'sem_alteracao');
select pg_temp.mover('Volta', 'aprovacao_setor');
insert into _tap (linha) select is(pg_temp.revisoes('Volta'), 1::bigint, 'mover para a frente mantém a revisão');
select pg_temp.mover('Volta', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Volta', 'corrigida', 'relatorio')$sql$, 'P0001', 'corrigida_sem_versao_na_passagem',
  'na passagem nova, a versão enviada na anterior não vale para "corrigida"');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Volta', 'sem_alteracao')$sql$, 'na passagem nova a revisão é aceita');
insert into _tap (linha) select is(pg_temp.revisoes('Volta'), 2::bigint, 'as duas revisões ficam registradas');

-- ===== Processo em andamento e na Revisão interna =====
select pg_temp.claims('a1');
select pg_temp.enviar('Parado');
select pg_temp.enviar('Cancelado');
select pg_temp.enviar('Concluido');
select pg_temp.enviar('Etapa Errada');
select pg_temp.claims('a2');
select pg_temp.mover('Parado', 'revisao_interna');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Parado', 'sem_alteracao')$sql$, 'P0001', 'processo_parado:suspenso',
  'processo suspenso recusa a revisão');
select pg_temp.mover('Cancelado', 'revisao_interna');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistência do setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Cancelado', 'sem_alteracao')$sql$, 'P0001', 'processo_parado:cancelado',
  'processo cancelado recusa a revisão');
select pg_temp.mover_sem_trava(pg_temp.processo('Concluido'), (select id from public.etapas where codigo = 'concluidos'), null, null, 'Sem divulgação');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Concluido', 'sem_alteracao')$sql$, 'P0001', 'revisao_fora_da_etapa',
  'processo concluído recusa a revisão');
select public.arquivar_processo(pg_temp.processo('Concluido'));
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Concluido', 'sem_alteracao')$sql$, 'P0001', 'processo_arquivado',
  'processo arquivado recusa a revisão');
select pg_temp.mover('Etapa Errada', 'revisao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Etapa Errada', 'sem_alteracao')$sql$, 'P0001', 'revisao_fora_da_etapa',
  'revisão com o processo fora da Revisão interna é recusada');
insert into _tap (linha) select is(pg_temp.revisoes('Etapa Errada') + pg_temp.revisoes('Parado'), 0::bigint, 'as recusas não deixam revisão');

-- ===== Mover não mexe na revisão =====
select pg_temp.enviar('Move');
select pg_temp.mover('Move', 'revisao_interna');
select pg_temp.revisar('Move', 'sem_alteracao');
select pg_temp.mover('Move', 'modelagem');
insert into _tap (linha) select is(pg_temp.revisoes('Move'), 1::bigint, 'mover para trás mantém a revisão');

-- ===== Nada se apaga =====
insert into _tap (linha) select throws_ok(
  $sql$delete from public.revisoes_internas$sql$, '42501', null, 'integrante não apaga revisão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado, revisor_id)
    values (pg_temp.processo('Move'), 'sem_alteracao', '00000000-0000-0000-0000-0000000000a1')$sql$, '42501', null,
  'o revisor não se escolhe: coluna sem privilégio de inclusão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado, passagem_id)
    values (pg_temp.processo('Move'), 'sem_alteracao', gen_random_uuid())$sql$, '42501', null,
  'a passagem não se escolhe: coluna sem privilégio de inclusão');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.revisoes_internas$sql$, '42501', null, 'administrador não apaga revisão');
select pg_temp.claims('a2');

-- ===== Processo com revisão não se exclui =====
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Sem Alteracao')$sql$, 'P0001', 'processo_com_revisoes:1',
  'excluir processo com 1 revisão é recusado com a contagem');

-- ===== Subprocesso: as mesmas regras, e a revisão fica com o item na reclassificação =====
select pg_temp.claims('a1');
select pg_temp.enviar('Filho');
select pg_temp.claims('a2');
select pg_temp.mover('Filho', 'revisao_interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Filho', 'sem_alteracao')$sql$, 'o subprocesso registra a revisão do mesmo jeito');
select public.reclassificar_processo(pg_temp.processo('Filho'), 'processo', null, 'Virou processo');
insert into _tap (linha) select is(pg_temp.revisoes('Filho'), 1::bigint, 'depois de reclassificar, a revisão continua no item');

-- ===== Perfis: consulta, inativo, administrador e visitante =====
select pg_temp.enviar('Perfis');
select pg_temp.mover('Perfis', 'revisao_interna');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.revisoes_internas) > 0, 'consulta lê as revisões');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'revisao_interna') > 0,
  'consulta lê os eventos de revisão');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Perfis', 'sem_alteracao')$sql$, '42501', null, 'consulta não registra revisão');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.revisoes_internas), 0::bigint, 'inativo não lê as revisões');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'revisao_interna'), 0::bigint,
  'inativo não lê os eventos de revisão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo('Perfis'), 'sem_alteracao')$sql$,
  '42501', null, 'inativo não registra revisão');

select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.eventos (acao, entidade, entidade_ref) values ('registrar', 'revisao_interna', 'x')$sql$, '42501', null,
  'integrante não cria evento de revisão');

select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Perfis', 'sem_alteracao')$sql$, 'administrador registra a revisão');
insert into _tap (linha) select ok((select count(*) from public.revisoes_internas) > 0, 'administrador lê as revisões');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.revisoes_internas$sql$, '42501', null,
  'visitante não lê as revisões');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values ('00000000-0000-0000-0000-000000000000', 'sem_alteracao')$sql$,
  '42501', null, 'visitante não registra revisão');
insert into _tap (linha) select throws_ok($sql$select count(*) from public.eventos$sql$, '42501', null,
  'visitante não lê os eventos');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'preparar_revisao_interna' and tgrelid = 'public.revisoes_internas'::regclass), 1,
  'existe o gatilho que prepara a revisão');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_processo_sem_revisoes' and tgrelid = 'public.processos'::regclass), 1,
  'existe o gatilho de exclusão do processo com revisão');
insert into _tap (linha) select is(
  (select count(*)::int from pg_indexes where indexname = 'revisoes_internas_uma_por_passagem'), 1,
  'existe o índice de uma revisão por passagem');
insert into _tap (linha) select hasnt_function('public', 'concluir_revisao_interna', 'o "concluir" da revisão saiu');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
