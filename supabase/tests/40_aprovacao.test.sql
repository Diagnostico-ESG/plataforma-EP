-- Aprovação na janela de concluir (revisoes-aprovacao, ticket 03, ADRs 0011 e 0015): quem pode o quê em aprovacoes e
-- nos eventos dela, as regras do banco (processo e etapa em andamento, versão mais recente e completa, uma aprovação por
-- processo, link http(s), data nunca no futuro e no dia da última revisão interna ou depois, conclusão que exige a
-- aprovação, aprovação e conclusão juntas, apagar só na volta de etapa, arquivo de versão aprovada não se substitui,
-- processo com aprovação não se exclui, um evento por mudança). A edição da aprovação é do ticket 04.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(69);

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

-- Um setor, um macroprocesso e os processos (6 etapas cada, a Publicação depois da Aprovação); o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000040', 'T40', 'Setor Aprovacao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000040', null, 'Macro Aprovacao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', nome
from unnest(array['Aprovada', 'Etapa Errada', 'Parado', 'Sem Versao', 'Incompleta', 'Segunda', 'Link', 'Datas', 'Datas Antes',
  'Datas Futuro', 'Fuso', 'Direta', 'Realizada', 'Volta Setor', 'Volta Propria', 'Volta Publicacao', 'Troca', 'Livre', 'Perfis',
  'Excluir']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', 'Filho', 'subprocesso', id
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

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe, e o par .bpm + .png de uma versão nova.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T40_V1_Processo.' || formato, 'formato', formato,
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

-- Leva o processo até a Aprovação em andamento: as etapas 1 a 4 "realizadas anteriormente" (sem registro nem trava).
create function pg_temp.ate_a_aprovacao(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'aprovacao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_aprovacao(text) to authenticated;

-- O mesmo caminho pela tela, com a revisão interna registrada hoje (a versão é de outra pessoa que quem chama).
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

-- A chamada da tela: a aprovação e a conclusão numa função só.
create function pg_temp.aprovar(nome_do_processo text, numero text default null, link text default null,
  data date default null, responsavel uuid default null) returns void
language sql as $$
  -- Responde "sim" à escolha de publicação (ADR 0020): a Publicação entra em andamento, como antes da escolha existir.
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), numero, link, data, responsavel, true) $$;
grant execute on function pg_temp.aprovar(text, text, text, date, uuid) to authenticated;

create function pg_temp.aprovacoes(nome_do_processo text) returns bigint
language sql stable as $$ select count(*) from public.aprovacoes where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.aprovacoes(text) to authenticated;

create function pg_temp.arquivo_da(nome_do_processo text, numero_da_versao integer, qual public.papel_do_arquivo) returns uuid
language sql stable as $$
  select a.id from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id
  where v.processo_id = pg_temp.processo(nome_do_processo) and v.numero = numero_da_versao and a.papel = qual $$;
grant execute on function pg_temp.arquivo_da(text, integer, public.papel_do_arquivo) to authenticated;

create function pg_temp.novo(formato text, hash text default 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb') returns jsonb
language sql immutable as $$ select jsonb_build_object('formato', formato, 'tamanho', 555, 'hash_md5', hash) $$;
grant execute on function pg_temp.novo(text, text) to authenticated;

set local role authenticated;

-- ===== Aprovação sem número, link e data (integrante a2 aprova a versão de a1) =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Aprovada');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Aprovada');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Aprovada')$sql$, 'concluir a Aprovação sem número, link e data é aceito');
insert into _tap (linha) select results_eq(
  $sql$select numero_eprotocolo is null, link is null, aprovada_em is null, registrada_por::text,
    (versao_id = (select id from public.versoes where processo_id = pg_temp.processo('Aprovada') and numero = 1))
    from public.aprovacoes where processo_id = pg_temp.processo('Aprovada')$sql$,
  $sql$values (true, true, true, '00000000-0000-0000-0000-0000000000a2', true)$sql$,
  'a aprovação guarda a versão mais recente e quem a registrou, com os três campos vazios');
insert into _tap (linha) select is(pg_temp.status('Aprovada', 'aprovacao_setor'), 'concluida'::public.status_da_etapa,
  'a Aprovação fica concluída');
insert into _tap (linha) select is(pg_temp.status('Aprovada', 'publicacao'), 'em_andamento'::public.status_da_etapa,
  'a Publicação é iniciada');
insert into _tap (linha) select results_eq(
  $sql$select acao, (entidade_ref = pg_temp.processo('Aprovada')::text), detalhes->'depois'->>'versao',
    (jsonb_typeof(detalhes->'antes') = 'null')
    from public.eventos where entidade = 'aprovacao' and entidade_ref = pg_temp.processo('Aprovada')::text$sql$,
  $sql$values ('registrar', true, 'V1', true)$sql$,
  'um evento "registrar" liga a aprovação ao processo, com o antes vazio');

-- ===== Número, link e data; data contra a última revisão interna =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Datas');
select pg_temp.enviar_completa('Datas Antes');
select pg_temp.enviar_completa('Datas Futuro');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao_revisando('Datas');
select pg_temp.ate_a_aprovacao_revisando('Datas Antes');
select pg_temp.ate_a_aprovacao_revisando('Datas Futuro');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Datas', '  PROT-2026-0001  ', '  https://eprotocolo.example/abc  ', (now() at time zone 'America/Sao_Paulo')::date)$sql$,
  'número, link e a data de hoje (a da revisão) são aceitos');
insert into _tap (linha) select results_eq(
  $sql$select numero_eprotocolo, link, aprovada_em from public.aprovacoes where processo_id = pg_temp.processo('Datas')$sql$,
  $sql$values ('PROT-2026-0001', 'https://eprotocolo.example/abc', (now() at time zone 'America/Sao_Paulo')::date)$sql$,
  'número e link vêm aparados');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Datas Antes', null, null, (now() at time zone 'America/Sao_Paulo')::date - 1)$sql$,
  'P0001', 'aprovacao_antes_da_revisao:' || ((now() at time zone 'America/Sao_Paulo')::date - 1)::text || ':' || (now() at time zone 'America/Sao_Paulo')::date::text,
  'data antes da última revisão interna é recusada, com as duas datas');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Datas Antes', null, null, (now() at time zone 'America/Sao_Paulo')::date)$sql$, 'a data do dia da revisão é aceita');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Datas Futuro', null, null, (now() at time zone 'America/Sao_Paulo')::date + 1)$sql$,
  'P0001', 'data_no_futuro:' || ((now() at time zone 'America/Sao_Paulo')::date + 1)::text, 'data no futuro é recusada');

-- ===== Fuso do escritório: o dia da revisão e o "hoje" da aprovação são os de Brasília, não os do relógio do banco =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Fuso');
select pg_temp.claims('a2');
-- Escolhe, entre um fuso à frente e um atrás de Brasília, o que está em outro dia agora (sempre há um): com current_date
-- do banco a revisão gravaria o dia errado ou a data de hoje seria recusada como futura.
select set_config('timezone', case when (now() at time zone 'Pacific/Kiritimati')::date <> (now() at time zone 'America/Sao_Paulo')::date
  then 'Pacific/Kiritimati' else 'Etc/GMT+12' end, true);
select pg_temp.ate_a_aprovacao_revisando('Fuso');
insert into _tap (linha) select is(
  (select max(revisada_em) from public.revisoes_internas where processo_id = pg_temp.processo('Fuso')),
  (now() at time zone 'America/Sao_Paulo')::date, 'a revisão grava o dia de Brasília, qualquer que seja o fuso da conexão');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Fuso', null, null, (now() at time zone 'America/Sao_Paulo')::date)$sql$,
  'a data de hoje em Brasília é aceita na aprovação, qualquer que seja o fuso da conexão');
reset timezone;

-- ===== Link =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Link');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Link');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Link', null, 'ftp://x.example/a')$sql$, 'P0001', 'link_invalido', 'link ftp:// é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Link', null, 'x.example/a')$sql$, 'P0001', 'link_invalido', 'link sem esquema é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Link', null, 'http://x.example/a')$sql$, 'link http:// é aceito');
insert into _tap (linha) select is(
  (select link from public.aprovacoes where processo_id = pg_temp.processo('Link')), 'http://x.example/a', 'o link fica guardado');

-- ===== Etapa errada, processo parado, sem versão e versão incompleta =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Etapa Errada');
select pg_temp.enviar_completa('Parado');
select pg_temp.enviar('Incompleta');
select pg_temp.claims('a2');
select pg_temp.agir('Etapa Errada', 'modelagem', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Etapa Errada', 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Etapa Errada', 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
select pg_temp.agir('Etapa Errada', 'revisao_setor', 'em_andamento');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Etapa Errada'))$sql$,
  'P0001', 'aprovacao_fora_da_etapa', 'aprovação com a Validação com o setor em andamento é recusada');
select pg_temp.ate_a_aprovacao('Parado');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Parado')$sql$, 'P0001', 'processo_parado:suspenso', 'aprovação com o processo suspenso é recusada');
select pg_temp.ate_a_aprovacao('Sem Versao');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Sem Versao')$sql$, 'P0001', 'sem_versao', 'aprovação de processo sem versão é recusada');
select pg_temp.ate_a_aprovacao('Incompleta');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Incompleta')$sql$, 'P0001', 'versao_incompleta:1:relatorio',
  'aprovação com a versão sem relatório é recusada, com o que falta');
insert into _tap (linha) select is(pg_temp.aprovacoes('Incompleta'), 0::bigint, 'a recusa não deixa aprovação');
insert into _tap (linha) select is(pg_temp.status('Incompleta', 'aprovacao_setor'), 'em_andamento'::public.status_da_etapa,
  'a Aprovação segue em andamento');

-- ===== Uma aprovação por processo =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Segunda');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Segunda');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Segunda'))$sql$,
  'a aprovação direta, com a etapa em andamento, é aceita');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Segunda'))$sql$,
  'P0001', 'processo_ja_aprovado', 'a segunda aprovação do processo é recusada');

-- ===== Concluir exige a aprovação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Direta');
select pg_temp.enviar_completa('Realizada');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Direta');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Direta', 'aprovacao_setor'), 'concluir', null, null)$sql$,
  'P0001', 'sem_aprovacao:1', 'o avanço direto, sem aprovação, é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Direta', 'aprovacao_setor', 'concluida')$sql$,
  'P0001', 'sem_aprovacao:1', 'concluir a etapa direto, sem aprovação, é recusado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Direta')$sql$, 'concluir_aprovacao é aceito');
insert into _tap (linha) select is(pg_temp.status('Direta', 'aprovacao_setor'), 'concluida'::public.status_da_etapa,
  'a Aprovação fica concluída');
select pg_temp.ate_a_aprovacao('Realizada');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Realizada', 'aprovacao_setor', 'realizada_anteriormente', 'Aprovada antes da plataforma')$sql$,
  '"realizada anteriormente" na Aprovação segue aceita, sem registro');
insert into _tap (linha) select is(pg_temp.aprovacoes('Realizada'), 0::bigint, 'e não deixa aprovação');

-- ===== Voltar desfaz a aprovação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Volta Setor');
select pg_temp.enviar_completa('Volta Propria');
select pg_temp.enviar_completa('Volta Publicacao');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Volta Setor');
select pg_temp.aprovar('Volta Setor');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Setor', 'revisao_setor'), 'Ajustar', null)$sql$,
  'voltar à Validação com o setor, com aprovação, é aceito');
insert into _tap (linha) select is(pg_temp.aprovacoes('Volta Setor'), 0::bigint, 'a aprovação sai');
insert into _tap (linha) select is(
  (select count(*) from public.eventos where entidade = 'aprovacao' and acao = 'desfazer'
    and entidade_ref = pg_temp.processo('Volta Setor')::text and detalhes->'antes'->>'versao' = 'V1'
    and jsonb_typeof(detalhes->'depois') = 'null'), 1::bigint,
  'um evento "desfazer" guarda o que a aprovação era');
select pg_temp.ate_a_aprovacao('Volta Propria');
select pg_temp.aprovar('Volta Propria');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Propria', 'aprovacao_setor'), 'Rever', null)$sql$,
  'voltar à própria Aprovação é aceito');
insert into _tap (linha) select is(pg_temp.aprovacoes('Volta Propria'), 0::bigint, 'a aprovação sai');
select pg_temp.ate_a_aprovacao('Volta Publicacao');
select pg_temp.aprovar('Volta Publicacao');
select pg_temp.agir('Volta Publicacao', 'publicacao', 'concluida');
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Publicacao', 'publicacao'), 'Rever', null)$sql$,
  'voltar à Publicação (depois da Aprovação) é aceito');
insert into _tap (linha) select is(pg_temp.aprovacoes('Volta Publicacao'), 1::bigint, 'a aprovação fica');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.aprovacoes where processo_id = pg_temp.processo('Volta Publicacao')$sql$,
  'P0001', 'aprovacao_so_se_desfaz_na_volta', 'apagar a aprovação direto é recusado');

-- ===== Quem registra e a versão não são escolhidos (a edição de número, link e data é provada no teste 41) =====
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id, versao_id) values (pg_temp.processo('Segunda'), gen_random_uuid())$sql$,
  '42501', null, 'a versão não é escolhida por quem inclui');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id, registrada_por)
    values (pg_temp.processo('Segunda'), '00000000-0000-0000-0000-0000000000a1')$sql$,
  '42501', null, 'quem registrou não é escolhido por quem inclui');

-- ===== Arquivo de versão aprovada não se substitui =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Troca');
select pg_temp.enviar_completa('Livre');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Troca');
select pg_temp.aprovar('Troca');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da('Troca', 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'P0001', 'versao_aprovada:1', 'substituir o relatório da versão aprovada é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set tamanho = 5 where id = pg_temp.arquivo_da('Troca', 1, 'png')$sql$,
  'P0001', 'versao_aprovada:1', 'alterar um arquivo da versão aprovada direto também é recusado');
select public.voltar_a_etapa(pg_temp.andamento('Troca', 'revisao_setor'), 'Ajustar', null);
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da('Troca', 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'depois da volta que desfaz a aprovação, substituir é aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da('Livre', 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'substituir arquivo de versão não aprovada é aceito');

-- ===== Excluir processo com aprovação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Excluir');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Excluir');
select pg_temp.aprovar('Excluir');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where nome = 'Excluir'$sql$, 'P0001', 'processo_com_aprovacao',
  'excluir processo com aprovação é recusado');

-- ===== Subprocesso e reclassificação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Filho');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Filho');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Filho')$sql$, 'o subprocesso registra a aprovação do mesmo jeito');
select public.reclassificar_processo(pg_temp.processo('Filho'), 'processo', null, 'Virou processo');
insert into _tap (linha) select is(pg_temp.aprovacoes('Filho'), 1::bigint, 'depois de reclassificar, a aprovação continua no item');

-- ===== Perfis: consulta, inativo, administrador e visitante =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Perfis');
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao('Perfis');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.aprovacoes) > 0, 'consulta lê as aprovações');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'aprovacao') > 0,
  'consulta lê os eventos de aprovação');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Perfis')$sql$, '42501', null, 'consulta não registra aprovação');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Perfis'))$sql$, '42501', null,
  'consulta não inclui aprovação direto');
insert into _tap (linha) select lives_ok($sql$delete from public.aprovacoes$sql$,
  'consulta tenta apagar sem erro: a política não deixa nenhuma linha à vista para apagar');
insert into _tap (linha) select ok((select count(*) from public.aprovacoes where processo_id = pg_temp.processo('Volta Publicacao')) = 1,
  'e a aprovação continua');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.aprovacoes), 0::bigint, 'inativo não lê as aprovações');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'aprovacao'), 0::bigint,
  'inativo não lê os eventos de aprovação');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Perfis')$sql$, 'P0001', 'registro_inexistente', 'inativo não registra aprovação (não enxerga a etapa)');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Perfis'))$sql$, '42501', null,
  'inativo não inclui aprovação direto');

select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.eventos (acao, entidade, entidade_ref) values ('registrar', 'aprovacao', 'x')$sql$, '42501', null,
  'integrante não cria evento de aprovação');

select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Perfis')$sql$, 'administrador registra a aprovação');
insert into _tap (linha) select ok((select count(*) from public.aprovacoes) > 0, 'administrador lê as aprovações');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.aprovacoes$sql$, '42501', null,
  'visitante não lê as aprovações');
insert into _tap (linha) select throws_ok(
  $sql$select public.concluir_aprovacao('00000000-0000-0000-0000-000000000000', null, null, null, null)$sql$, '42501', null,
  'visitante não executa a conclusão da aprovação');
insert into _tap (linha) select throws_ok($sql$select count(*) from public.eventos$sql$, '42501', null,
  'visitante não lê os eventos');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_conclusao_da_etapa' and tgrelid = 'public.andamentos'::regclass), 1,
  'o gatilho de conclusão continua em andamentos');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'preparar_aprovacao' and tgrelid = 'public.aprovacoes'::regclass), 1,
  'existe o gatilho que prepara a aprovação');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_apagar_aprovacao' and tgrelid = 'public.aprovacoes'::regclass), 1,
  'existe o gatilho que só deixa apagar na volta');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_troca_em_versao_aprovada'
    and tgrelid = 'public.arquivos_da_versao'::regclass), 1,
  'existe o gatilho que protege os arquivos da versão aprovada');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_processo_sem_aprovacao' and tgrelid = 'public.processos'::regclass), 1,
  'existe o gatilho de exclusão do processo com aprovação');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'concluir_aprovacao' and pronamespace = 'public'::regnamespace), false,
  'a conclusão da aprovação não é security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
