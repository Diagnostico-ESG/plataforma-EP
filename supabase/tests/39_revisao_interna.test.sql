-- Revisão interna na janela de concluir (revisoes-aprovacao, ticket 02, ADRs 0014 e 0015): quem pode o quê em
-- revisoes_internas e nos eventos dela, as regras do banco (processo e etapa em andamento, revisor nunca o autor da
-- versão revisada, "corrigida" com a versão mais recente do revisor e a anterior de outra pessoa, escopo, conclusão que
-- exige revisão da versão mais recente, revisão e conclusão juntas, nada se altera nem se apaga, processo com revisão
-- não se exclui, um evento por revisão). A edição da revisão é do teste 41 (ticket 04).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(55);

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

-- Um setor, um macroprocesso e os processos (6 etapas cada); o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000039', 'T39', 'Setor Revisao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000039', null, 'Macro Revisao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', nome
from unnest(array['Sem Alteracao', 'Corrigida', 'Autor Unico', 'Autor Duplo', 'Assumiu', 'Sem Versao', 'Escopo', 'Parado',
  'Etapa Pendente', 'Direta', 'Nova Versao', 'Atomica', 'Perfis']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000039', 'af000000-0000-0000-0000-000000000039', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai';

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

create function pg_temp.status(nome_do_processo text, codigo_da_etapa text) returns public.status_da_etapa
language sql stable as $$ select status from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.status(text, text) to authenticated;

create function pg_temp.responsavel(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select responsavel_id from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.responsavel(text, text) to authenticated;

create function pg_temp.escolher(nome_do_processo text, codigo_da_etapa text, usuario uuid) returns void
language sql as $$
  update public.andamentos set responsavel_id = usuario where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.escolher(text, text, uuid) to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

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

-- Leva o processo até a Revisão interna em andamento (as etapas 1 e 2 resolvidas).
create function pg_temp.ate_a_revisao_interna(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_revisao_interna(text) to authenticated;

-- A chamada da tela: a revisão e a conclusão numa função só.
create function pg_temp.revisar(nome_do_processo text, resultado public.resultado_da_revisao,
  escopo public.escopo_da_correcao default null, responsavel uuid default null, comentario text default null) returns void
language sql as $$
  select public.concluir_revisao_interna(pg_temp.andamento(nome_do_processo, 'revisao_interna'), resultado, escopo, comentario,
    responsavel) $$;
grant execute on function pg_temp.revisar(text, public.resultado_da_revisao, public.escopo_da_correcao, uuid, text) to authenticated;

create function pg_temp.revisoes(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.revisoes_internas where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.revisoes(text) to authenticated;

select pg_temp.claims('a2');
set local role authenticated;

-- ===== Sem alteração (integrante a2 revisa a versão de a1) =====
select pg_temp.claims('a1');
select pg_temp.enviar('Sem Alteracao');
select pg_temp.claims('a2');
select pg_temp.ate_a_revisao_interna('Sem Alteracao');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Sem Alteracao', 'sem_alteracao', null, '00000000-0000-0000-0000-0000000000a1', '  Segue  ')$sql$,
  'revisar "sem alteração" a versão de outra pessoa é aceito');
insert into _tap (linha) select results_eq(
  $sql$select resultado::text, escopo::text, comentario, revisor_id::text, revisada_em, (versao_corrigida_id is null),
    (versao_revisada_id = (select id from public.versoes where processo_id = pg_temp.processo('Sem Alteracao') and numero = 1))
    from public.revisoes_internas where processo_id = pg_temp.processo('Sem Alteracao')$sql$,
  $sql$values ('sem_alteracao', null::text, 'Segue', '00000000-0000-0000-0000-0000000000a2', (now() at time zone 'America/Sao_Paulo')::date, true, true)$sql$,
  'a revisão guarda o resultado, o comentário aparado, o revisor, o dia e a versão revisada (a mais recente)');
insert into _tap (linha) select is(pg_temp.status('Sem Alteracao', 'revisao_interna'), 'concluida'::public.status_da_etapa,
  'a Revisão interna fica concluída');
insert into _tap (linha) select is(pg_temp.status('Sem Alteracao', 'revisao_setor'), 'em_andamento'::public.status_da_etapa,
  'a Validação com o setor é iniciada');
insert into _tap (linha) select is(pg_temp.responsavel('Sem Alteracao', 'revisao_setor'), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'com o responsável escolhido');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'revisao_interna' and acao = 'registrar'
    and entidade_ref = pg_temp.processo('Sem Alteracao')::text and detalhes -> 'antes' = 'null'::jsonb
    and detalhes -> 'depois' ->> 'resultado' = 'sem_alteracao' and detalhes -> 'depois' ->> 'versao_revisada' = 'V1'), 1::bigint,
  'a revisão gera um evento, ligado ao processo, com o depois');
-- A trava da Validação com o setor do ticket 01 segue valendo (a V1 não tem relatório).
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Alteracao', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:1:relatorio', 'a Validação com o setor continua exigindo a versão completa');

-- ===== Corrigida (a1 envia a V1; a2 envia a V2 e a corrige) =====
select pg_temp.claims('a1');
select pg_temp.enviar('Corrigida');
select pg_temp.claims('a2');
select pg_temp.enviar('Corrigida');
select pg_temp.ate_a_revisao_interna('Corrigida');
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
insert into _tap (linha) select is(pg_temp.status('Corrigida', 'revisao_interna'), 'concluida'::public.status_da_etapa,
  'a Revisão interna da corrigida fica concluída');

-- ===== O autor não revisa a própria versão =====
select pg_temp.enviar('Autor Unico');
select pg_temp.ate_a_revisao_interna('Autor Unico');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Unico', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:1',
  'o autor da versão não a revisa "sem alteração"');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Unico', 'corrigida', 'fluxograma')$sql$, 'P0001', 'corrigida_sem_versao_anterior',
  '"corrigida" com uma versão só é recusada');
insert into _tap (linha) select is(pg_temp.revisoes('Autor Unico'), 0::bigint, 'as recusas não deixam revisão');
insert into _tap (linha) select is(pg_temp.status('Autor Unico', 'revisao_interna'), 'em_andamento'::public.status_da_etapa,
  'a etapa segue em andamento');

select pg_temp.enviar('Autor Duplo');
select pg_temp.enviar('Autor Duplo');
select pg_temp.ate_a_revisao_interna('Autor Duplo');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Duplo', 'corrigida', 'relatorio')$sql$, 'P0001', 'revisor_e_autor:1',
  '"corrigida" com a anterior também do revisor é recusada');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Autor Duplo', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:2',
  'o autor da mais recente não a revisa "sem alteração"');

-- Quem assumiu a etapa e depois enviou a versão mais recente não conclui.
select pg_temp.ate_a_revisao_interna('Assumiu');
select pg_temp.escolher('Assumiu', 'revisao_interna', '00000000-0000-0000-0000-0000000000a2');
select pg_temp.enviar('Assumiu');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Assumiu', 'sem_alteracao')$sql$, 'P0001', 'revisor_e_autor:1',
  'quem assumiu a etapa e depois enviou a versão não a conclui');

-- ===== Versão e escopo =====
select pg_temp.ate_a_revisao_interna('Sem Versao');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Sem Versao', 'sem_alteracao')$sql$, 'P0001', 'sem_versao', 'processo sem versão é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Sem Versao', 'revisao_interna'), 'concluir', null, null)$sql$,
  'P0001', 'sem_versao', 'concluir direto sem versão também é recusado');

select pg_temp.claims('a1');
select pg_temp.enviar('Escopo');
select pg_temp.claims('a2');
select pg_temp.enviar('Escopo');
select pg_temp.ate_a_revisao_interna('Escopo');
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

-- ===== Processo e etapa em andamento =====
select pg_temp.ate_a_revisao_interna('Parado');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Parado', 'sem_alteracao')$sql$, 'P0001', 'processo_parado:suspenso',
  'processo suspenso recusa a revisão');
select pg_temp.agir('Etapa Pendente', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Etapa Pendente', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo('Etapa Pendente'), 'sem_alteracao')$sql$,
  'P0001', 'revisao_fora_da_etapa', 'revisão com a Revisão interna ainda pendente é recusada');

-- ===== Concluir direto exige a revisão da versão mais recente =====
select pg_temp.claims('a1');
select pg_temp.enviar('Direta');
select pg_temp.claims('a2');
select pg_temp.ate_a_revisao_interna('Direta');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Direta', 'revisao_interna', 'concluida')$sql$, 'P0001', 'sem_revisao_da_versao:1',
  'concluir a etapa direto, sem revisão, é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Direta', 'revisao_interna'), 'concluir', null, null)$sql$,
  'P0001', 'sem_revisao_da_versao:1', 'avancar_etapa direto, sem revisão, é recusado');

-- Revisão da V1, volta e versão nova: a revisão antiga não basta.
select pg_temp.claims('a1');
select pg_temp.enviar('Nova Versao');
select pg_temp.claims('a2');
select pg_temp.ate_a_revisao_interna('Nova Versao');
select pg_temp.revisar('Nova Versao', 'sem_alteracao');
select public.voltar_a_etapa(pg_temp.andamento('Nova Versao', 'revisao_interna'), 'Ajustar', null);
select pg_temp.claims('a1');
select pg_temp.enviar('Nova Versao');
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Nova Versao', 'revisao_interna', 'concluida')$sql$, 'P0001', 'sem_revisao_da_versao:2',
  'a revisão da V1 não basta depois que a V2 foi enviada');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Nova Versao', 'sem_alteracao')$sql$, 'concluir de novo registra a revisão da versão nova');
insert into _tap (linha) select is(pg_temp.revisoes('Nova Versao'), 2::bigint, 'as duas revisões ficam registradas');

-- ===== Revisão e conclusão juntas =====
select pg_temp.claims('a1');
select pg_temp.enviar('Atomica');
select pg_temp.claims('a2');
select pg_temp.ate_a_revisao_interna('Atomica');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Atomica', 'sem_alteracao', null, '00000000-0000-0000-0000-0000000000a4')$sql$, 'P0001', null,
  'responsável inativo na próxima etapa recusa a conclusão');
insert into _tap (linha) select is(pg_temp.revisoes('Atomica'), 0::bigint, 'a conclusão que falha não deixa a revisão gravada');
insert into _tap (linha) select is(pg_temp.status('Atomica', 'revisao_interna'), 'em_andamento'::public.status_da_etapa,
  'a etapa segue em andamento');

-- ===== Nada se apaga (a edição de escopo e comentário é provada no teste 41) =====
insert into _tap (linha) select throws_ok(
  $sql$delete from public.revisoes_internas$sql$, '42501', null, 'integrante não apaga revisão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado, revisor_id)
    values (pg_temp.processo('Atomica'), 'sem_alteracao', '00000000-0000-0000-0000-0000000000a1')$sql$, '42501', null,
  'o revisor não se escolhe: coluna sem privilégio de inclusão');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.revisoes_internas$sql$, '42501', null, 'administrador não apaga revisão');
select pg_temp.claims('a2');

-- ===== Processo com revisão não se exclui =====
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where nome = 'Sem Alteracao'$sql$, 'P0001', 'processo_com_revisoes:1',
  'excluir processo com 1 revisão é recusado com a contagem');

-- ===== Subprocesso: as mesmas regras, e a revisão fica com o item na reclassificação =====
select pg_temp.claims('a1');
select pg_temp.enviar('Filho');
select pg_temp.claims('a2');
select pg_temp.ate_a_revisao_interna('Filho');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.revisar('Filho', 'sem_alteracao')$sql$, 'o subprocesso registra a revisão do mesmo jeito');
select public.reclassificar_processo(pg_temp.processo('Filho'), 'processo', null, 'Virou processo');
insert into _tap (linha) select is(pg_temp.revisoes('Filho'), 1::bigint, 'depois de reclassificar, a revisão continua no item');

-- ===== Perfis: administrador, consulta, inativo e visitante =====
-- A V1 é de a2: o administrador a1 revisa (o autor não revisa a própria versão).
select pg_temp.enviar('Perfis');
select pg_temp.ate_a_revisao_interna('Perfis');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.revisoes_internas) > 0, 'consulta lê as revisões');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'revisao_interna') > 0,
  'consulta lê os eventos de revisão');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Perfis', 'sem_alteracao')$sql$, '42501', null, 'consulta não registra revisão');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo('Perfis'), 'sem_alteracao')$sql$,
  '42501', null, 'consulta não inclui revisão direto');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.revisoes_internas), 0::bigint, 'inativo não lê as revisões');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'revisao_interna'), 0::bigint,
  'inativo não lê os eventos de revisão');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.revisar('Perfis', 'sem_alteracao')$sql$, 'P0001', 'registro_inexistente',
  'inativo não registra revisão (não enxerga a etapa)');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo('Perfis'), 'sem_alteracao')$sql$,
  '42501', null, 'inativo não inclui revisão direto');

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
  $sql$select public.concluir_revisao_interna('00000000-0000-0000-0000-000000000000', 'sem_alteracao', null, null, null)$sql$,
  '42501', null, 'visitante não executa a conclusão da revisão');
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
  (select prosecdef from pg_proc where proname = 'concluir_revisao_interna' and pronamespace = 'public'::regnamespace), false,
  'a conclusão da revisão não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
