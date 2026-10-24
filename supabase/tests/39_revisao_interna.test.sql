-- Revisão interna (revisoes-aprovacao, ticket 02, ADR 0015; Andamento livre no ticket 24 de processos-etapas): quem pode
-- o quê em revisoes_internas e nos eventos dela, e as regras do banco na inclusão (processo em andamento e na Revisão
-- interna, revisor nunca o autor da versão revisada, "corrigida" com a versão mais recente do revisor e a anterior de
-- outra pessoa, escopo, nada se apaga, processo com revisão não se exclui, um evento por revisão). A gravação entra
-- direto na tabela, como fará a função do ticket 05 de revisoes-aprovacao (o "concluir" saiu, ADR 0023). A edição da
-- revisão é do teste 41.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(41);

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

-- Um setor, um macroprocesso e os processos; o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000039', 'T39', 'Setor Revisao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000039', null, 'Macro Revisao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', nome
from unnest(array['Sem Alteracao', 'Corrigida', 'Autor Unico', 'Autor Duplo', 'Assumiu', 'Sem Versao', 'Escopo', 'Parado',
  'Etapa Pendente', 'Nova Versao', 'Perfis']) as nome;
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
  select public.mover_processo(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpm + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T39_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
-- Quem envia é quem está nas claims (o gatilho põe auth.uid() como autor); a função recusa um número diferente do
-- próximo (maior + 1), então o auxiliar o calcula.
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    null, pg_temp.par()) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- A revisão gravada direto na tabela: o gatilho confere tudo e preenche revisor, dia e versões.
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

-- ===== Sem alteração (integrante a2 revisa a versão de a1) =====
select pg_temp.claims('a1');
select pg_temp.enviar('Sem Alteracao');
select pg_temp.claims('a2');
select pg_temp.mover('Sem Alteracao', 'revisao_interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Sem Alteracao', 'sem_alteracao', null, '  Segue  ')$sql$,
  'revisar "sem alteração" a versão de outra pessoa é aceito');
insert into _tap (linha) select results_eq(
  $sql$select resultado::text, escopo::text, comentario, revisor_id::text, revisada_em, (versao_corrigida_id is null),
    (versao_revisada_id = (select id from public.versoes where processo_id = pg_temp.processo('Sem Alteracao') and numero = 1))
    from public.revisoes_internas where processo_id = pg_temp.processo('Sem Alteracao')$sql$,
  $sql$values ('sem_alteracao', null::text, 'Segue', '00000000-0000-0000-0000-0000000000a2', (now() at time zone 'America/Sao_Paulo')::date, true, true)$sql$,
  'a revisão guarda o resultado, o comentário aparado, o revisor, o dia e a versão revisada (a mais recente)');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where id = pg_temp.processo('Sem Alteracao')),
  'revisao_interna', 'registrar a revisão não move o processo');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'revisao_interna' and acao = 'registrar'
    and entidade_ref = pg_temp.processo('Sem Alteracao')::text and detalhes -> 'antes' = 'null'::jsonb
    and detalhes -> 'depois' ->> 'resultado' = 'sem_alteracao' and detalhes -> 'depois' ->> 'versao_revisada' = 'V1'), 1::bigint,
  'a revisão gera um evento, ligado ao processo, com o depois');

-- ===== Corrigida (a1 envia a V1; a2 envia a V2 e a corrige) =====
select pg_temp.claims('a1');
select pg_temp.enviar('Corrigida');
select pg_temp.claims('a2');
select pg_temp.enviar('Corrigida');
select pg_temp.mover('Corrigida', 'revisao_interna');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Corrigida', 'corrigida', 'ambos')$sql$,
  '"corrigida" com a mais recente do revisor e a anterior de outra pessoa é aceito');
insert into _tap (linha) select results_eq(
  $sql$select resultado::text, escopo::text, comentario,
    (versao_revisada_id = (select id from public.versoes where processo_id = pg_temp.processo('Corrigida') and numero = 1)),
    (versao_corrigida_id = (select id from public.versoes where processo_id = pg_temp.processo('Corrigida') and numero = 2))
    from public.revisoes_internas where processo_id = pg_temp.processo('Corrigida')$sql$,
  $sql$values ('corrigida', 'ambos', null::text, true, true)$sql$,
  'a revisada é a V1, a corrigida é a V2, o escopo fica e o comentário vazio vira nulo');

-- ===== O autor não revisa a própria versão (até o ticket 05, que troca a recusa por aviso) =====
select pg_temp.enviar('Autor Unico');
select pg_temp.mover('Autor Unico', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Unico', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:1',
  'o autor da versão não a revisa "sem alteração"');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Unico', 'corrigida', 'fluxograma')$sql$, 'P0001', 'corrigida_sem_versao_anterior',
  '"corrigida" com uma versão só é recusada');
insert into _tap (linha) select is(pg_temp.revisoes('Autor Unico'), 0::bigint, 'as recusas não deixam revisão');

select pg_temp.enviar('Autor Duplo');
select pg_temp.enviar('Autor Duplo');
select pg_temp.mover('Autor Duplo', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Duplo', 'corrigida', 'relatorio')$sql$, 'P0001', 'revisor_e_autor:1',
  '"corrigida" com a anterior também do revisor é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Duplo', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:2',
  'o autor da mais recente não a revisa "sem alteração"');

-- Quem move o processo para a Revisão interna e depois envia a versão mais recente não a revisa.
select pg_temp.mover('Assumiu', 'revisao_interna');
select pg_temp.enviar('Assumiu');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Assumiu', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:1',
  'quem está com o processo e enviou a versão não a revisa');

-- ===== Versão e escopo =====
select pg_temp.mover('Sem Versao', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Sem Versao', 'sem_alteracao')$sql$, 'P0001', 'sem_versao', 'processo sem versão é recusado');

select pg_temp.claims('a1');
select pg_temp.enviar('Escopo');
select pg_temp.claims('a2');
select pg_temp.enviar('Escopo');
select pg_temp.mover('Escopo', 'revisao_interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Escopo', 'sem_alteracao', 'ambos')$sql$, 'P0001', 'escopo_so_na_corrigida',
  '"sem alteração" com escopo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Escopo', 'corrigida')$sql$, 'P0001', 'escopo_obrigatorio', '"corrigida" sem escopo é recusado');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Escopo', 'corrigida', 'fluxograma')$sql$, 'P0001', 'corrigida_sem_versao_do_revisor',
  '"corrigida" com a mais recente de outra pessoa é recusada');
select pg_temp.claims('a2');

-- ===== Processo em andamento e na Revisão interna =====
select pg_temp.mover('Parado', 'revisao_interna');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Parado', 'sem_alteracao')$sql$, 'P0001', 'processo_parado:suspenso',
  'processo suspenso recusa a revisão');
select pg_temp.mover('Etapa Pendente', 'relatorio_modelagem_tecnica');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Etapa Pendente', 'sem_alteracao')$sql$,
  'P0001', 'revisao_fora_da_etapa', 'revisão com o processo fora da Revisão interna é recusada');

-- Revisão da V1, versão nova e outra revisão: as duas ficam.
select pg_temp.claims('a1');
select pg_temp.enviar('Nova Versao');
select pg_temp.claims('a2');
select pg_temp.mover('Nova Versao', 'revisao_interna');
select pg_temp.revisar('Nova Versao', 'sem_alteracao');
select pg_temp.claims('a1');
select pg_temp.enviar('Nova Versao');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Nova Versao', 'sem_alteracao')$sql$, 'a revisão da versão nova é aceita');
insert into _tap (linha) select is(pg_temp.revisoes('Nova Versao'), 2::bigint, 'as duas revisões ficam registradas');

-- ===== Nada se apaga (a edição de escopo e comentário é provada no teste 41) =====
insert into _tap (linha) select throws_ok(
  $sql$delete from public.revisoes_internas$sql$, '42501', null, 'integrante não apaga revisão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado, revisor_id)
    values (pg_temp.processo('Nova Versao'), 'sem_alteracao', '00000000-0000-0000-0000-0000000000a1')$sql$, '42501', null,
  'o revisor não se escolhe: coluna sem privilégio de inclusão');
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

-- ===== Perfis: administrador, consulta, inativo e visitante =====
-- A V1 é de a2: o administrador a1 revisa (o autor não revisa a própria versão).
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
insert into _tap (linha) select hasnt_function('public', 'concluir_revisao_interna', 'o "concluir" da revisão saiu');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
