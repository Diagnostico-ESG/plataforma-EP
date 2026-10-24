-- Aprovação pelo setor (revisoes-aprovacao, ticket 03, ADRs 0011 e 0015; Andamento livre no ticket 24 de
-- processos-etapas): quem pode o quê em aprovacoes e nos eventos dela, e as regras do banco na inclusão (processo em
-- andamento e na Aprovação pelo setor, versão mais recente e completa, uma aprovação por processo, link http(s), data
-- nunca no futuro e no dia da última revisão interna ou depois, nada se apaga, mover não mexe na aprovação, arquivo de
-- versão aprovada não se substitui, processo com aprovação não se exclui, um evento por aprovação). A gravação entra
-- direto na tabela, como fará a função do ticket 05 de revisoes-aprovacao (o "concluir" e a volta saíram, ADR 0023).
-- A edição da aprovação é do teste 41.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(52);

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
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000040', 'T40', 'Setor Aprovacao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000040', null, 'Macro Aprovacao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', nome
from unnest(array['Aprovada', 'Etapa Errada', 'Parado', 'Sem Versao', 'Incompleta', 'Segunda', 'Link', 'Datas', 'Datas Antes',
  'Datas Futuro', 'Fuso', 'Move', 'Troca', 'Livre', 'Perfis', 'Excluir']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000040', 'af000000-0000-0000-0000-000000000040', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000040';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000040' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$
  select public.mover_processo(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

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

-- Passa pela Revisão interna com a revisão registrada hoje (a versão é de outra pessoa que quem chama) e vai à Aprovação.
create function pg_temp.ate_a_aprovacao_revisando(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.mover(nome_do_processo, 'revisao_interna');
  insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo(nome_do_processo), 'sem_alteracao');
  perform pg_temp.mover(nome_do_processo, 'aprovacao_setor');
end $$;
grant execute on function pg_temp.ate_a_aprovacao_revisando(text) to authenticated;

-- A aprovação gravada direto na tabela: o gatilho confere tudo e preenche a versão e quem registrou.
create function pg_temp.aprovar(nome_do_processo text, numero text default null, link text default null,
  data date default null) returns void
language sql as $$
  insert into public.aprovacoes (processo_id, numero_eprotocolo, link, aprovada_em)
  values (pg_temp.processo(nome_do_processo), numero, link, data) $$;
grant execute on function pg_temp.aprovar(text, text, text, date) to authenticated;

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
select pg_temp.mover('Aprovada', 'aprovacao_setor');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Aprovada')$sql$, 'registrar a aprovação sem número, link e data é aceito');
insert into _tap (linha) select results_eq(
  $sql$select numero_eprotocolo is null, link is null, aprovada_em is null, registrada_por::text,
    (versao_id = (select id from public.versoes where processo_id = pg_temp.processo('Aprovada') and numero = 1))
    from public.aprovacoes where processo_id = pg_temp.processo('Aprovada')$sql$,
  $sql$values (true, true, true, '00000000-0000-0000-0000-0000000000a2', true)$sql$,
  'a aprovação guarda a versão mais recente e quem a registrou, com os três campos vazios');
insert into _tap (linha) select is(
  (select etapa_atual_codigo from public.processos_com_andamento where id = pg_temp.processo('Aprovada')),
  'aprovacao_setor', 'registrar a aprovação não move o processo');
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
select pg_temp.mover('Link', 'aprovacao_setor');
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
select pg_temp.mover('Etapa Errada', 'revisao_setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Etapa Errada')$sql$,
  'P0001', 'aprovacao_fora_da_etapa', 'aprovação com o processo na Validação com o setor é recusada');
select pg_temp.mover('Parado', 'aprovacao_setor');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Parado')$sql$, 'P0001', 'processo_parado:suspenso', 'aprovação com o processo suspenso é recusada');
select pg_temp.mover('Sem Versao', 'aprovacao_setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Sem Versao')$sql$, 'P0001', 'sem_versao', 'aprovação de processo sem versão é recusada');
select pg_temp.mover('Incompleta', 'aprovacao_setor');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Incompleta')$sql$, 'P0001', 'versao_incompleta:1:relatorio',
  'aprovação com a versão sem relatório é recusada, com o que falta');
insert into _tap (linha) select is(pg_temp.aprovacoes('Incompleta'), 0::bigint, 'a recusa não deixa aprovação');

-- ===== Uma aprovação por processo =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Segunda');
select pg_temp.claims('a2');
select pg_temp.mover('Segunda', 'aprovacao_setor');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Segunda')$sql$, 'a primeira aprovação é aceita');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Segunda')$sql$,
  'P0001', 'processo_ja_aprovado', 'a segunda aprovação do processo é recusada');

-- ===== Mover não mexe na aprovação, e ela não se apaga =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Move');
select pg_temp.claims('a2');
select pg_temp.mover('Move', 'aprovacao_setor');
select pg_temp.aprovar('Move');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Move', 'revisao_setor')$sql$,
  'mover o processo aprovado para trás é aceito');
insert into _tap (linha) select is(pg_temp.aprovacoes('Move'), 1::bigint, 'a aprovação fica');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.aprovacoes where processo_id = pg_temp.processo('Move')$sql$,
  'P0001', 'aprovacao_nao_se_apaga', 'apagar a aprovação é recusado');

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
select pg_temp.mover('Troca', 'aprovacao_setor');
select pg_temp.aprovar('Troca');
insert into _tap (linha) select throws_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da('Troca', 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'P0001', 'versao_aprovada:1', 'substituir o relatório da versão aprovada é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set tamanho = 5 where id = pg_temp.arquivo_da('Troca', 1, 'png')$sql$,
  'P0001', 'versao_aprovada:1', 'alterar um arquivo da versão aprovada direto também é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.substituir_arquivo(pg_temp.arquivo_da('Livre', 1, 'relatorio'), pg_temp.novo('docx'))$sql$,
  'substituir arquivo de versão não aprovada é aceito');

-- ===== Excluir processo com aprovação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Excluir');
select pg_temp.claims('a2');
select pg_temp.mover('Excluir', 'aprovacao_setor');
select pg_temp.aprovar('Excluir');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Excluir')$sql$, 'P0001', 'processo_com_aprovacao',
  'excluir processo com aprovação é recusado');

-- ===== Subprocesso e reclassificação =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Filho');
select pg_temp.claims('a2');
select pg_temp.mover('Filho', 'aprovacao_setor');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.aprovar('Filho')$sql$, 'o subprocesso registra a aprovação do mesmo jeito');
select public.reclassificar_processo(pg_temp.processo('Filho'), 'processo', null, 'Virou processo');
insert into _tap (linha) select is(pg_temp.aprovacoes('Filho'), 1::bigint, 'depois de reclassificar, a aprovação continua no item');

-- ===== Perfis: consulta, inativo, administrador e visitante =====
select pg_temp.claims('a1');
select pg_temp.enviar_completa('Perfis');
select pg_temp.claims('a2');
select pg_temp.mover('Perfis', 'aprovacao_setor');
select pg_temp.claims('a3');
insert into _tap (linha) select ok((select count(*) from public.aprovacoes) > 0, 'consulta lê as aprovações');
insert into _tap (linha) select ok((select count(*) from public.eventos where entidade = 'aprovacao') > 0,
  'consulta lê os eventos de aprovação');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.aprovar('Perfis')$sql$, '42501', null, 'consulta não registra aprovação');
insert into _tap (linha) select lives_ok($sql$delete from public.aprovacoes$sql$,
  'consulta tenta apagar sem erro: a política não deixa nenhuma linha à vista para apagar');
insert into _tap (linha) select ok((select count(*) from public.aprovacoes where processo_id = pg_temp.processo('Move')) = 1,
  'e a aprovação continua');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.aprovacoes), 0::bigint, 'inativo não lê as aprovações');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'aprovacao'), 0::bigint,
  'inativo não lê os eventos de aprovação');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.aprovacoes (processo_id) values (pg_temp.processo('Perfis'))$sql$, '42501', null,
  'inativo não registra aprovação');

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
  $sql$insert into public.aprovacoes (processo_id) values ('00000000-0000-0000-0000-000000000000')$sql$, '42501', null,
  'visitante não registra aprovação');
insert into _tap (linha) select throws_ok($sql$select count(*) from public.eventos$sql$, '42501', null,
  'visitante não lê os eventos');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'preparar_aprovacao' and tgrelid = 'public.aprovacoes'::regclass), 1,
  'existe o gatilho que prepara a aprovação');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_apagar_aprovacao' and tgrelid = 'public.aprovacoes'::regclass), 1,
  'existe o gatilho que não deixa apagar');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_troca_em_versao_aprovada'
    and tgrelid = 'public.arquivos_da_versao'::regclass), 1,
  'existe o gatilho que protege os arquivos da versão aprovada');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_processo_sem_aprovacao' and tgrelid = 'public.processos'::regclass), 1,
  'existe o gatilho de exclusão do processo com aprovação');
insert into _tap (linha) select hasnt_function('public', 'concluir_aprovacao', 'o "concluir" da aprovação saiu');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
