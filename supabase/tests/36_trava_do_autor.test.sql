-- Trava do autor na Revisão interna e voltar com responsável (processos-etapas, ticket 14, ADR 0014): quem enviou a
-- versão mais recente não histórica não pode passar a ser o responsável da Revisão interna (pelo seletor, pelo
-- avanço e pelo voltar), e voltar leva o responsável da etapa reaberta.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(33);

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

-- Um setor, um macroprocesso e seis processos (6 etapas cada).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000014', 'T14', 'Setor Trava');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000014', null, 'Macro Trava');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000014', 'af000000-0000-0000-0000-000000000014', nome
from unnest(array['Autor Seletor', 'Avanco Autor', 'Volta Autor', 'Volta Vazio', 'Historica', 'Sem Versao']) as nome;

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

create function pg_temp.nome(usuario uuid) returns text
language sql stable as $$ select nome from public.usuarios where id = usuario $$;
grant execute on function pg_temp.nome(uuid) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpmn + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T14_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn'), pg_temp.arquivo('png', 'png')) $$;
-- Quem envia é quem está nas claims (o gatilho põe auth.uid() como autor); a função recusa um número diferente do
-- próximo (maior + 1), então o auxiliar o calcula.
create function pg_temp.enviar(nome_do_processo text) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    null, pg_temp.par()) $$;
grant execute on function pg_temp.enviar(text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Autor Seletor: a2 envia a V1 e a V2; a1 envia a V3 (a mais recente).
select pg_temp.enviar('Autor Seletor');
select pg_temp.enviar('Autor Seletor');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select pg_temp.enviar('Autor Seletor');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.escolher('Autor Seletor', 'revisao_interna', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'P0001', 'autor_da_versao:3:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a1'),
  'o autor da V3 não pode ser o responsável da Revisão interna pelo seletor');
insert into _tap (linha) select is(pg_temp.responsavel('Autor Seletor', 'revisao_interna'), null::uuid,
  'a recusa deixa o responsável como estava');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.escolher('Autor Seletor', 'revisao_interna', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'quem enviou só a V1 e a V2 pode ser o responsável');
insert into _tap (linha) select is(pg_temp.responsavel('Autor Seletor', 'revisao_interna'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'o responsável da Revisão interna é o escolhido');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.escolher('Autor Seletor', 'modelagem', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'o autor pode ser o responsável de outra etapa');
insert into _tap (linha) select lives_ok($sql$select pg_temp.enviar('Autor Seletor')$sql$,
  'o responsável da Revisão interna envia a V4');
insert into _tap (linha) select is(pg_temp.responsavel('Autor Seletor', 'revisao_interna'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'o responsável que envia a V4 continua responsável');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.escolher('Autor Seletor', 'revisao_interna', null)$sql$, 'deixar a Revisão interna sem responsável');
insert into _tap (linha) select is(pg_temp.responsavel('Autor Seletor', 'revisao_interna'), null::uuid,
  'a Revisão interna fica sem responsável');

-- Avanco Autor: a1 envia a V1; a2 conclui a 2 com a 3 (Revisão interna) pendente.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select pg_temp.enviar('Avanco Autor');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select pg_temp.agir('Avanco Autor', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Avanco Autor', 'relatorio_modelagem_tecnica', 'em_andamento');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Avanco Autor', 'relatorio_modelagem_tecnica'), 'concluir', null,
    '00000000-0000-0000-0000-0000000000a1')$sql$,
  'P0001', 'autor_da_versao:1:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a1'),
  'o avanço não põe o autor da V1 como responsável da Revisão interna');
insert into _tap (linha) select is(pg_temp.status('Avanco Autor', 'relatorio_modelagem_tecnica'),
  'em_andamento'::public.status_da_etapa, 'a recusa desfaz a resolução da etapa');
insert into _tap (linha) select ok(
  pg_temp.status('Avanco Autor', 'revisao_interna') = 'pendente' and pg_temp.responsavel('Avanco Autor', 'revisao_interna') is null,
  'a Revisão interna continua pendente e sem responsável');
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Avanco Autor', 'relatorio_modelagem_tecnica'), 'concluir', null,
    '00000000-0000-0000-0000-0000000000a2')$sql$, 'o avanço com outro responsável passa');
insert into _tap (linha) select ok(
  pg_temp.status('Avanco Autor', 'revisao_interna') = 'em_andamento'
    and pg_temp.responsavel('Avanco Autor', 'revisao_interna') = '00000000-0000-0000-0000-0000000000a2',
  'a Revisão interna entra em andamento com o responsável escolhido');

-- Volta Autor: a1 envia a V1; as etapas 1 a 3 são concluídas e a 4 está em andamento; a2 volta à 3.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select pg_temp.enviar('Volta Autor');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select pg_temp.agir('Volta Autor', 'modelagem', 'em_andamento');
select pg_temp.agir('Volta Autor', 'modelagem', 'concluida');
select pg_temp.agir('Volta Autor', 'relatorio_modelagem_tecnica', 'em_andamento');
select pg_temp.agir('Volta Autor', 'relatorio_modelagem_tecnica', 'concluida');
select pg_temp.agir('Volta Autor', 'revisao_interna', 'em_andamento');
-- A revisão da V1 (de a1) por a2 conclui a Revisão interna e já inicia a Revisão pelo setor (ticket 02 de revisoes-aprovacao).
select public.concluir_revisao_interna(pg_temp.andamento('Volta Autor', 'revisao_interna'), 'sem_alteracao', null, null, null);
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Autor', 'revisao_interna'), 'Refazer',
    '00000000-0000-0000-0000-0000000000a1')$sql$,
  'P0001', 'autor_da_versao:1:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a1'),
  'voltar não põe o autor da V1 como responsável da Revisão interna');
insert into _tap (linha) select is(pg_temp.status('Volta Autor', 'revisao_interna'),
  'concluida'::public.status_da_etapa, 'a recusa deixa a etapa resolvida');
insert into _tap (linha) select is(pg_temp.status('Volta Autor', 'revisao_setor'),
  'em_andamento'::public.status_da_etapa, 'a recusa não devolve as seguintes');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Autor', 'revisao_interna'), 'Refazer',
    '00000000-0000-0000-0000-0000000000a2')$sql$, 'voltar com outro responsável');
insert into _tap (linha) select is(pg_temp.status('Volta Autor', 'revisao_interna'),
  'em_andamento'::public.status_da_etapa, 'a etapa reaberta volta a em andamento');
insert into _tap (linha) select is(pg_temp.responsavel('Volta Autor', 'revisao_interna'),
  '00000000-0000-0000-0000-0000000000a2'::uuid, 'a etapa reaberta fica com o responsável recebido');
insert into _tap (linha) select is(pg_temp.status('Volta Autor', 'revisao_setor'),
  'pendente'::public.status_da_etapa, 'a seguinte volta a pendente');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'responsavel_nome' from public.eventos
    where acao = 'voltar' and entidade = 'andamento'
      and entidade_ref like '%:' || pg_temp.andamento('Volta Autor', 'revisao_interna')::text
    order by ocorrido_em desc, id desc limit 1),
  pg_temp.nome('00000000-0000-0000-0000-0000000000a2'), 'o evento de voltar traz o responsável da etapa reaberta');

-- Volta Vazio: a 2 tem o responsável a2 e é concluída; voltar com responsável inválido é recusado e com null limpa.
select pg_temp.agir('Volta Vazio', 'modelagem', 'em_andamento');
select pg_temp.agir('Volta Vazio', 'modelagem', 'concluida');
select pg_temp.agir('Volta Vazio', 'relatorio_modelagem_tecnica', 'em_andamento');
select pg_temp.escolher('Volta Vazio', 'relatorio_modelagem_tecnica', '00000000-0000-0000-0000-0000000000a2');
select pg_temp.agir('Volta Vazio', 'relatorio_modelagem_tecnica', 'concluida');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Vazio', 'relatorio_modelagem_tecnica'), 'Motivo',
    '00000000-0000-0000-0000-0000000000a3')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a3'),
  'voltar com um usuário de perfil Consulta como responsável é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Vazio', 'relatorio_modelagem_tecnica'), 'Motivo',
    '00000000-0000-0000-0000-0000000000a4')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a4'),
  'voltar com um usuário inativo como responsável é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Vazio', 'relatorio_modelagem_tecnica'), 'Motivo', null)$sql$,
  'voltar sem responsável');
insert into _tap (linha) select is(pg_temp.responsavel('Volta Vazio', 'relatorio_modelagem_tecnica'), null::uuid,
  'voltar sem responsável limpa o que a etapa tinha');

-- Historica: a1 registra a V1F (histórica) e a2 envia a V2; o autor da histórica não é barrado.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.registrar_versao_historica(pg_temp.processo('Historica'), 1, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select pg_temp.enviar('Historica');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.escolher('Historica', 'revisao_interna', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'quem enviou só uma versão histórica pode ser o responsável da Revisão interna');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.escolher('Historica', 'revisao_interna', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'P0001', 'autor_da_versao:2:' || pg_temp.nome('00000000-0000-0000-0000-0000000000a2'),
  'quem enviou a versão mais recente não histórica é recusado');

-- Sem Versao: ninguém é barrado.
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.escolher('Sem Versao', 'revisao_interna', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'sem versão não histórica ninguém é barrado da Revisão interna');

reset role;
-- Só existe a assinatura nova de voltar; sem security definer, a RLS de quem chama decide.
insert into _tap (linha) select is(
  (select count(*)::int from pg_proc where proname = 'voltar_a_etapa' and pronamespace = 'public'::regnamespace), 1,
  'só existe a assinatura nova de voltar_a_etapa');
insert into _tap (linha) select is(
  has_function_privilege('anon', 'public.voltar_a_etapa(uuid, text, uuid)', 'execute'), false,
  'o visitante não executa voltar_a_etapa');
insert into _tap (linha) select is(
  has_function_privilege('authenticated', 'public.voltar_a_etapa(uuid, text, uuid)', 'execute'), true,
  'o usuário logado executa voltar_a_etapa');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'voltar_a_etapa' and pronamespace = 'public'::regnamespace), false,
  'voltar_a_etapa não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
