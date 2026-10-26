-- Retirar anexo (documentos-versoes, ticket 13; ADR 0027): Administrador e Integrante ativos apagam o anexo, só com o processo
-- em andamento e não arquivado; Consulta, usuário inativo e visitante não apagam nada. A retirada deixa um evento com o nome
-- guardado, não mexe em outros anexos nem em versões, e libera a exclusão do processo depois do último anexo. Para Consulta
-- e inativo o apagar não dá erro: a política de apagar não lhes mostra nenhuma linha, e o anexo continua lá.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(33);

-- Isola o teste dos dados que já existem no banco: a limpeza vale só nesta transação, que é desfeita no fim.
set local session_replication_role = replica;
delete from public.eventos where entidade in ('versao', 'anexo');
set local session_replication_role = origin;

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

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Um setor e os processos: Andamento (o que anda e recebe vários anexos), Suspenso, Cancelado, Concluido, Arquivado (cada um
-- com um anexo enviado enquanto estava em andamento), Outro (o anexo que não pode ser tocado) e Livre (a exclusão).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000062', 'T62', 'Setor Retirada');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000062', null, 'Macro Retirada');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000062', 'af000000-0000-0000-0000-000000000062', nome
from unnest(array['Andamento', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado', 'Outro', 'Livre']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000062' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

-- Um anexo inventado no formato que registrar_anexo recebe (o que a função arquivos-no-drive lê do Drive).
create function pg_temp.anexo(nome text, drive_id text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('nome', nome, 'formato', 'eml', 'tamanho', 100,
    'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', drive_id) $$;
grant execute on function pg_temp.anexo(text, text) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T62_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
grant execute on function pg_temp.arquivo(text, text) to authenticated;

-- A versão completa (.bpm, .png e relatório numerado) deixa o processo andar até a Validação com o setor.
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.registrar_versao(pg_temp.processo(nome_do_processo), 1,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
  perform public.enviar_relatorio(pg_temp.processo(nome_do_processo), 1, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

create function pg_temp.concluir(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('aprovacao_setor'));
  insert into public.aprovacoes (processo_id) values (pg_temp.processo(nome_do_processo));
  perform public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa('concluidos'), null, null, 'Não será publicado');
end $$;
grant execute on function pg_temp.concluir(text) to authenticated;

-- Quantos anexos de nome dado o processo tem; quantos eventos de retirada ele tem.
create function pg_temp.anexos_de(nome_do_processo text, nome_do_anexo text) returns bigint
language sql stable as $$
  select count(*) from public.anexos where processo_id = pg_temp.processo(nome_do_processo) and nome = nome_do_anexo $$;
grant execute on function pg_temp.anexos_de(text, text) to authenticated;

create function pg_temp.retiradas(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos
  where entidade = 'anexo' and acao = 'retirar' and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.retiradas(text) to authenticated;

-- Preparação. a1 envia a versão completa dos que andam ou concluem e os anexos; a2 anda, conclui, arquiva, suspende e cancela.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from unnest(array['Andamento', 'Concluido', 'Arquivado']) as nome;
select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo(nome, 'drive-' || replace(nome, '.', '-') || '-1'))
from unnest(array['admin.eml', 'protegido.eml', 'nao-iniciados.eml']) as nome;
select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo('igual.eml', 'drive-igual-' || n)) from generate_series(1, 2) as n;
select public.registrar_anexo(pg_temp.processo(processo), pg_temp.anexo(nome, 'drive-' || replace(nome, '.', '-')))
from (values ('Suspenso', 's.eml'), ('Cancelado', 'c.eml'), ('Concluido', 'k.eml'), ('Arquivado', 'a.eml'),
  ('Outro', 'outro.eml'), ('Livre', 'livre.eml')) as v (processo, nome);
select set_config('ep.t62_etapa0', (select e.nome from public.etapas e
  join public.processos_com_andamento p on p.etapa_atual_id = e.id where p.id = pg_temp.processo('Andamento')), true);
select set_config('ep.t62_arquivos', (select count(*)::text from public.arquivos_da_versao), true);
select pg_temp.claims('a2');
select pg_temp.concluir(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select public.arquivar_processo(pg_temp.processo('Arquivado'));
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistiu');
select public.mover_processo(pg_temp.processo('Andamento'), pg_temp.etapa('modelagem'));
select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo('modelagem.eml', 'drive-modelagem'));
select public.mover_processo(pg_temp.processo('Andamento'), pg_temp.etapa('aprovacao_setor'));
select public.registrar_anexo(pg_temp.processo('Andamento'), pg_temp.anexo('validacao.eml', 'drive-validacao'));

-- ===== Situação do processo: suspenso, cancelado, concluído e arquivado não retiram =====
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Suspenso')$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'processo suspenso não retira anexo');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Cancelado')$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'processo cancelado não retira anexo');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Concluido')$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'processo concluído não retira anexo');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Arquivado')$sql$,
  'P0001', 'processo_arquivado', 'processo arquivado não retira anexo');
insert into _tap (linha) select is(
  (select count(*) from public.anexos where nome in ('s.eml', 'c.eml', 'k.eml', 'a.eml')), 4::bigint,
  'os quatro anexos dos processos fora de andamento continuam na lista');

-- ===== Consulta, usuário inativo e visitante não apagam nada =====
select pg_temp.claims('a3');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento') and nome = 'protegido.eml'$sql$,
  'consulta não apaga: a política não lhe mostra a linha para apagar, e não dá erro');
select pg_temp.claims('a4');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento') and nome = 'protegido.eml'$sql$,
  'usuário inativo não apaga: não vê nenhuma linha');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$delete from public.anexos$sql$, '42501', null, 'visitante sem login não apaga anexo');
reset role;
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is(
  pg_temp.anexos_de('Andamento', 'protegido.eml'), 1::bigint, 'o anexo continua lá depois das três tentativas');
insert into _tap (linha) select is(
  pg_temp.retiradas('Andamento') + pg_temp.retiradas('Suspenso') + pg_temp.retiradas('Arquivado'), 0::bigint,
  'nenhuma tentativa recusada deixa evento de retirada');

-- ===== Administrador retira; o evento guarda o nome e a etapa do envio =====
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento') and nome = 'admin.eml'$sql$,
  'administrador retira o anexo, com o processo em andamento');
insert into _tap (linha) select is(
  pg_temp.anexos_de('Andamento', 'admin.eml'), 0::bigint, 'o anexo sai da lista');
insert into _tap (linha) select is(
  pg_temp.retiradas('Andamento'), 1::bigint, 'a retirada gera um evento ligado ao processo');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'nome' from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and entidade_ref = pg_temp.processo('Andamento')::text), 'admin.eml', 'o evento guarda o nome, mesmo apagada a linha');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'etapa' from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and entidade_ref = pg_temp.processo('Andamento')::text), current_setting('ep.t62_etapa0'),
  'o evento guarda a etapa em que o anexo foi enviado, não a de agora');
insert into _tap (linha) select is(
  (select jsonb_typeof(detalhes -> 'depois') from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and entidade_ref = pg_temp.processo('Andamento')::text), 'null', 'o estado depois da retirada é vazio');
insert into _tap (linha) select is(
  (select autor_id::text from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and entidade_ref = pg_temp.processo('Andamento')::text), '00000000-0000-0000-0000-0000000000a1',
  'o evento traz quem retirou');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento') and nome = 'admin.eml'$sql$,
  'apagar um anexo já retirado não dá erro e não afeta nenhuma linha');
insert into _tap (linha) select is(
  pg_temp.retiradas('Andamento'), 1::bigint, 'e não gera um segundo evento');

-- ===== Integrante retira anexos enviados em etapas diferentes, com o processo já adiante =====
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento')
    and nome in ('nao-iniciados.eml', 'modelagem.eml', 'validacao.eml')$sql$,
  'integrante retira os anexos enviados em Não iniciados, na Modelagem piloto e na Validação com o setor');
insert into _tap (linha) select is(
  (select count(*) from public.anexos where processo_id = pg_temp.processo('Andamento')
    and nome in ('nao-iniciados.eml', 'modelagem.eml', 'validacao.eml')), 0::bigint, 'os três saem da lista');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'etapa' from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and detalhes -> 'antes' ->> 'nome' = 'modelagem.eml'),
  (select nome from public.etapas where codigo = 'modelagem'), 'o evento do anexo da Modelagem piloto guarda a etapa do envio');
insert into _tap (linha) select is(
  (select autor_id::text from public.eventos where entidade = 'anexo' and acao = 'retirar'
    and detalhes -> 'antes' ->> 'nome' = 'validacao.eml'), '00000000-0000-0000-0000-0000000000a2',
  'o evento do integrante traz o integrante');

-- ===== Dois anexos de mesmo nome: retira só o escolhido =====
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Andamento') and drive_id = 'drive-igual-1'$sql$,
  'retira um dos dois anexos de mesmo nome, pelo identificador');
insert into _tap (linha) select is(
  pg_temp.anexos_de('Andamento', 'igual.eml'), 1::bigint, 'o outro de mesmo nome continua na lista');

-- ===== Exclusão do processo =====
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Livre')$sql$,
  'P0001', 'processo_com_anexos:1', 'processo com anexo não se exclui');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.anexos where processo_id = pg_temp.processo('Livre')$sql$,
  'retira o último anexo do processo');
insert into _tap (linha) select lives_ok(
  $sql$delete from public.processos where id = pg_temp.processo('Livre')$sql$,
  'sem anexo, o processo se exclui');
insert into _tap (linha) select is(
  (select count(*) from public.processos where nome = 'Livre' and setor_id = '5f000000-0000-0000-0000-000000000062'), 0::bigint,
  'o processo excluído não existe mais');

-- ===== O que não é o anexo retirado fica =====
insert into _tap (linha) select is(
  pg_temp.anexos_de('Outro', 'outro.eml'), 1::bigint, 'o anexo de outro processo não é tocado');
insert into _tap (linha) select is(
  (select count(*)::text from public.arquivos_da_versao), current_setting('ep.t62_arquivos'),
  'os arquivos das versões continuam todos lá');

-- ===== Quem lê o evento =====
select pg_temp.claims('a3');
insert into _tap (linha) select is(
  (select count(*) > 0 from public.eventos where entidade = 'anexo' and acao = 'retirar'), true, 'consulta lê os eventos de retirada');
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select count(*) from public.eventos$sql$, '42501', null, 'visitante sem login não lê os eventos');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
