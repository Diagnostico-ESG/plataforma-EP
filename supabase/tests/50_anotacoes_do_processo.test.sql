-- Anotações do processo (processos-etapas, ticket 23; ADR 0021): gravar só se o texto no banco é o que a pessoa tinha,
-- autor e hora preenchidos pelo banco, sem evento, limite de 2.000 caracteres, só espaços grava nulo, arquivado recusa,
-- subprocesso e pai separados, reclassificação mantém, perfis (inclusive inativo e visitante) e ausência da view e do pacote.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(57);

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

-- Um setor e os processos; o Filho é subprocesso do Pai; Concluido e Arquivado chegam ao fim do caminho.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000050', 'T50', 'Setor Anotações');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000050', null, 'Macro Anotações');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', nome
from unnest(array['Notas', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000050';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000050' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.texto(nome_do_processo text) returns text
language sql stable as $$ select anotacoes from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.texto(text) to authenticated;

create function pg_temp.autor(nome_do_processo text) returns uuid
language sql stable as $$ select anotacoes_alteradas_por from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.autor(text) to authenticated;

create function pg_temp.momento(nome_do_processo text) returns timestamptz
language sql stable as $$ select anotacoes_alteradas_em from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.momento(text) to authenticated;

create function pg_temp.edicoes(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.edicoes(text) to authenticated;

create function pg_temp.ultima_edicao(nome_do_processo text) returns jsonb
language sql stable as $$
  select detalhes from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text order by id desc limit 1 $$;
grant execute on function pg_temp.ultima_edicao(text) to authenticated;

create function pg_temp.hoje() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
grant execute on function pg_temp.hoje() to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T49_V1_Processo.' || formato, 'formato', formato,
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

-- Levado a Concluídos sem publicação (Andamento livre, processos-etapas 24).
create function pg_temp.concluir(nome_do_processo text) returns void
language sql as $$
  select public.mover_processo(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = 'concluidos'),
    null, null, 'Não será publicado') $$;
grant execute on function pg_temp.concluir(text) to authenticated;

-- Concluido e Arquivado em Concluídos, com a versão completa; depois, cada processo vai ao estado do caso.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select pg_temp.claims('a2');
select pg_temp.concluir(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select public.arquivar_processo(pg_temp.processo('Arquivado'));
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Cancelado no teste');
reset role;

-- ===== A estrutura =====
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes', 'processos tem as Anotações');
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes_alteradas_em', 'processos tem a hora da última alteração');
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes_alteradas_por', 'processos tem o autor da última alteração');
insert into _tap (linha) select has_function('public', 'gravar_anotacoes_do_processo', array['uuid', 'text', 'text'],
  'existe a função de gravar as Anotações');

-- ===== Administrador grava a primeira vez (esperado nulo) =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select is(
  (select texto from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, 'Combinado com o setor')),
  'Combinado com o setor', 'administrador grava e a função devolve o texto');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Combinado com o setor', 'o texto ficou no processo');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'o banco registrou o administrador como autor');
insert into _tap (linha) select ok(pg_temp.momento('Notas') is not null, 'o banco registrou a hora');

-- ===== Integrante grava sobre o texto do administrador, que é o que ele tinha =====
reset role;
select pg_temp.claims('a2');
set local role authenticated;
insert into _tap (linha) select is(
  (select texto from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Combinado com o setor', 'Segundo texto')),
  'Segundo texto', 'integrante grava quando o texto é o que ele tinha');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'o autor passou a ser o integrante');

-- ===== Conflito: quem escreveu por cima do que já mudou é recusado e nada muda =====
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Combinado com o setor', 'Texto do atrasado')$sql$,
  'P0001', 'anotacoes_em_conflito', 'gravar com o texto antigo é recusado');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Segundo texto', 'a recusa não alterou o texto');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, 'Outro texto')$sql$,
  'P0001', 'anotacoes_em_conflito', 'esperar nulo quando já há texto também é conflito');

-- ===== Gravar o mesmo texto não muda autor nem hora; texto novo muda os dois =====
reset role;
create temp table _antes as select pg_temp.momento('Notas') as momento, pg_temp.autor('Notas') as autor;
grant all on _antes to authenticated;
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Segundo texto', 'Segundo texto')$sql$,
  'gravar o mesmo texto é aceito');
insert into _tap (linha) select is(pg_temp.autor('Notas'), (select autor from _antes), 'gravar o mesmo texto não muda o autor');
insert into _tap (linha) select is(pg_temp.momento('Notas'), (select momento from _antes), 'nem a hora');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Segundo texto', 'Terceiro texto')$sql$,
  'gravar um texto novo é aceito');
insert into _tap (linha) select ok(pg_temp.momento('Notas') > (select momento from _antes), 'a hora avançou com o texto novo');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a1'::uuid, 'e o autor mudou');

-- ===== Sem evento no processo; editar outro campo continua gerando, sem as Anotações =====
insert into _tap (linha) select is(pg_temp.edicoes('Notas'), 0::bigint, 'gravar as Anotações não gera evento do processo');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set contexto = 'Contexto novo' where id = pg_temp.processo('Notas')$sql$,
  'editar o contexto continua permitido');
insert into _tap (linha) select is(pg_temp.edicoes('Notas'), 1::bigint, 'editar o contexto gera um evento');
insert into _tap (linha) select is(jsonb_exists(pg_temp.ultima_edicao('Notas') -> 'depois', 'anotacoes'), false,
  'o evento não traz as Anotações');

-- ===== Limite de 2.000 caracteres =====
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Terceiro texto', repeat('a', 2001))$sql$,
  'P0001', 'anotacoes_longas:2001', '2.001 caracteres são recusados');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Terceiro texto', repeat('a', 2000))$sql$,
  '2.000 caracteres são aceitos');
insert into _tap (linha) select is(char_length(pg_temp.texto('Notas')), 2000, 'o texto de 2.000 caracteres ficou inteiro');

-- ===== Só espaços e quebras de linha gravam nulo, e o rastro de quem alterou fica =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), repeat('a', 2000), E'  \n ')$sql$,
  'só espaços e quebras de linha são aceitos');
insert into _tap (linha) select is(pg_temp.texto('Notas'), null::text, 'e gravam nulo');
insert into _tap (linha) select ok(pg_temp.momento('Notas') is not null, 'a hora da última alteração continua registrada');

-- ===== O texto vale como foi digitado (espaços das pontas ficam) =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, '  com margem  ')$sql$,
  'texto com espaços nas pontas é aceito');
insert into _tap (linha) select is(pg_temp.texto('Notas'), '  com margem  ', 'e fica como foi digitado');

-- ===== Fora da função: o limite vale, e autor e hora não se mudam =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes = repeat('a', 2001) where id = pg_temp.processo('Notas')$sql$,
  '23514', null, 'o limite vale também no update direto');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set anotacoes = 'Direto' where id = pg_temp.processo('Notas')$sql$,
  'o update direto do texto é aceito para quem pode alterar');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_por = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Notas')$sql$,
  '42501', null, 'ninguém muda o autor pela API');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_em = now() where id = pg_temp.processo('Notas')$sql$,
  '42501', null, 'ninguém muda a hora pela API');
reset role;
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_por = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Notas')$sql$,
  'P0001', 'anotacoes_alteradas_so_pelo_banco', 'nem o dono do banco muda o autor sem mudar o texto');

-- ===== Pai e subprocesso têm textos separados; a reclassificação mantém =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Pai'), null, 'Texto do pai')$sql$, 'grava no pai');
insert into _tap (linha) select is(pg_temp.texto('Filho'), null::text, 'o subprocesso não herda o texto do pai');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Filho'), null, 'Texto do filho')$sql$, 'grava no subprocesso');
insert into _tap (linha) select is(pg_temp.texto('Pai'), 'Texto do pai', 'e o texto do subprocesso não muda o do pai');
insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Notas'), 'processo', null, 'Reclassificado no teste')$sql$,
  'reclassificar o processo com Anotações é aceito');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'a reclassificação mantém as Anotações');

-- ===== Situações: suspenso, cancelado e concluído aceitam; arquivado recusa =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Suspenso'), null, 'Anotado no suspenso')$sql$, 'suspenso aceita');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Cancelado'), null, 'Anotado no cancelado')$sql$, 'cancelado aceita');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Concluido'), null, 'Anotado no concluído')$sql$, 'concluído aceita');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Arquivado'), null, 'Tentativa no arquivado')$sql$,
  'P0001', 'processo_arquivado', 'arquivado recusa');
insert into _tap (linha) select is(pg_temp.texto('Arquivado'), null::text, 'e o arquivado ficou sem texto');

-- ===== Consulta lê, mas não grava =====
reset role;
select pg_temp.claims('a3');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Direto', 'Da consulta')$sql$,
  '42501', null, 'Consulta não grava pela função');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'Consulta lê as Anotações');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set anotacoes = 'Da consulta' where id = pg_temp.processo('Notas')$sql$,
  'o update direto da Consulta não dá erro, mas a RLS não deixa linha alguma');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'Consulta não muda o texto pelo update direto');

-- ===== Inativo não grava nem lê =====
reset role;
select pg_temp.claims('a4');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo('00000000-0000-0000-0000-0000000000f0', null, 'Do inativo')$sql$,
  '42501', null, 'inativo não grava');
insert into _tap (linha) select is(
  (select count(*) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000050'), 0::bigint,
  'inativo não lê os processos, e com eles as Anotações');

-- ===== Visitante não grava nem lê =====
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo('00000000-0000-0000-0000-0000000000f0', null, 'Do visitante')$sql$,
  '42501', null, 'visitante não grava');
insert into _tap (linha) select throws_ok($sql$select anotacoes from public.processos$sql$, '42501', null,
  'visitante não lê as Anotações');
reset role;

-- ===== Fora da view e do pacote das planilhas =====
insert into _tap (linha) select is_empty(
  $sql$select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'processos_com_andamento' and column_name like 'anotacoes%'$sql$,
  'a view do Quadro e da Lista não tem coluna de Anotações');
insert into _tap (linha) select ok(position('Texto do pai' in (select private.montar_pacote_das_planilhas()::text)) = 0,
  'o pacote das planilhas não traz o texto das Anotações');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
