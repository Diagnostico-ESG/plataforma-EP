-- Cartão do Quadro (processos-etapas, ticket 20; Andamento livre no ticket 24): os campos da view
-- processos_com_andamento que o cartão usa — etiqueta, entrada e posição da etapa atual, responsável ativo, última
-- versão (histórica ou não, com ou sem relatório) e a contagem de subprocessos não cancelados.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(33);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador (será desativado).
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

-- Um setor, um macroprocesso e os processos do cenário.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000020', 'T20', 'Setor Cartao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000020', null, 'Macro Cartao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000020', 'af000000-0000-0000-0000-000000000020', nome
from unnest(array['Parado', 'Pendente', 'V1 Sem', 'V1 Com', 'Relatorio Depois', 'V2 Sem', 'Historica',
  'Resp Ativo', 'Resp Inativo']) as nome;
-- O pai de um subprocesso precisa nascer do tipo Processo (o tipo só muda pela reclassificação).
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000020', 'af000000-0000-0000-0000-000000000020', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000020', 'af000000-0000-0000-0000-000000000020', nome, 'subprocesso',
  (select id from public.processos where nome = 'Pai')
from unnest(array['Filho A', 'Filho B', 'Filho C']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

-- A linha da view de um processo, lida com a permissão de quem chama.
create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where nome = nome_do_processo $$;
grant execute on function pg_temp.linha(text) to authenticated;

create function pg_temp.escolher(nome_do_processo text, usuario uuid) returns void
language sql as $$ update public.processos set responsavel_id = usuario where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.escolher(text, uuid) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T20_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel || '-' || formato) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
create function pg_temp.relatorio(nome text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', 'relatorio', 'nome', nome, 'formato', 'docx', 'tamanho', 100,
    'hash_md5', 'abcdef0123456789abcdef0123456789', 'drive_id', 'drive-' || md5(nome)) $$;
create function pg_temp.versao(nome_do_processo text, numero_da_versao integer) returns uuid
language sql stable as $$
  select id from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and numero = numero_da_versao $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.par(), pg_temp.relatorio(text), pg_temp.versao(text, integer)
  to authenticated;

-- Tudo isto como administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select public.mover_processo(pg_temp.processo('Parado'), (select id from public.etapas where codigo = 'modelagem'));
update public.passagens set etiqueta = 'em_andamento' where processo_id = pg_temp.processo('Parado') and saiu_em is null;
select pg_temp.escolher('Resp Ativo', '00000000-0000-0000-0000-0000000000a2');
select pg_temp.escolher('Resp Inativo', '00000000-0000-0000-0000-0000000000a4');
select public.registrar_versao(pg_temp.processo('V1 Sem'), 1, pg_temp.par());
select public.registrar_versao(pg_temp.processo('V1 Com'), 1, pg_temp.par() || pg_temp.relatorio('T20_V1_Com_Relatório.docx'));
select public.registrar_versao(pg_temp.processo('Relatorio Depois'), 1, pg_temp.par());
select public.registrar_versao(pg_temp.processo('V2 Sem'), 1, pg_temp.par() || pg_temp.relatorio('T20_V2_Sem_Relatório.docx'));
select public.registrar_versao(pg_temp.processo('V2 Sem'), 2, pg_temp.par());
select public.registrar_versao_historica(pg_temp.processo('Historica'), 5, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')));
select public.cancelar_processo(pg_temp.processo('Filho C'), 'Não segue');

-- Etapa atual: etiqueta e entrada.
insert into _tap (linha) select is((pg_temp.linha('Parado')).etiqueta::text, 'em_andamento',
  'a view traz a etiqueta da etapa atual');
insert into _tap (linha) select is(((pg_temp.linha('Parado')).entrou_na_etapa_em at time zone 'America/Sao_Paulo')::date,
  private.hoje(), 'a entrada na etapa atual é a data do movimento');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).etiqueta::text, 'a_fazer',
  'o processo cadastrado está em A fazer');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).etapa_atual_codigo, 'nao_iniciados',
  'o processo cadastrado está em Não iniciados');

-- Posição: entre as etapas ativas, na ordem do catálogo.
insert into _tap (linha) select is((pg_temp.linha('Pendente')).etapa_atual_posicao, 1, 'Não iniciados é a posição 1');
insert into _tap (linha) select is((pg_temp.linha('Parado')).etapa_atual_posicao,
  (select count(*)::int from public.etapas where ativa and ordem <= (select ordem from public.etapas where codigo = 'modelagem')),
  'a posição conta as etapas ativas até a atual');
insert into _tap (linha) select is((pg_temp.linha('Parado')).etapa_atual_codigo, 'modelagem', 'a etapa atual é a da passagem aberta');
insert into _tap (linha) select is(
  (select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'processos_com_andamento'
    and column_name in ('caminho', 'etapa_atual_status', 'etapa_atual_iniciada_em', 'vai_para_publicacao')),
  0, 'a view não traz mais o caminho, o status, o início da etapa nem a escolha de publicação');

-- Última versão.
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_numero, 1, 'a última versão é a V1');
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_historica, false, 'a V1 não é histórica');
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_tem_relatorio, false, 'a V1 sem relatório não tem relatório');
insert into _tap (linha) select is((pg_temp.linha('V1 Com')).ultima_versao_tem_relatorio, true, 'a V1 com relatório tem relatório');
insert into _tap (linha) select is((pg_temp.linha('Relatorio Depois')).ultima_versao_tem_relatorio, false,
  'antes de acrescentar o relatório, a versão não o tem');
select public.enviar_relatorio(pg_temp.processo('Relatorio Depois'), 1, 1, pg_temp.relatorio('T20_RD_Relatório.docx'));
insert into _tap (linha) select is((pg_temp.linha('Relatorio Depois')).ultima_versao_tem_relatorio, true,
  'depois de acrescentar o relatório, a versão o tem');
insert into _tap (linha) select is((pg_temp.linha('V2 Sem')).ultima_versao_numero, 2, 'a última versão é a de maior número');
insert into _tap (linha) select is((pg_temp.linha('V2 Sem')).ultima_versao_tem_relatorio, false,
  'o relatório da V1 não conta para a V2');
insert into _tap (linha) select is((pg_temp.linha('Historica')).ultima_versao_numero, 5, 'a versão histórica guarda o número digitado');
insert into _tap (linha) select is((pg_temp.linha('Historica')).ultima_versao_historica, true, 'a V5F é histórica');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).ultima_versao_numero, null::int, 'sem versão, o número é vazio');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).ultima_versao_historica, null::boolean, 'sem versão, histórica é vazio');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).ultima_versao_tem_relatorio, null::boolean,
  'sem versão, o relatório é vazio');

-- Subprocessos: o cancelado fica fora; sem subprocessos é zero.
insert into _tap (linha) select is((pg_temp.linha('Pai')).subprocessos_quantidade, 2, 'o subprocesso cancelado não entra na contagem');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).subprocessos_quantidade, 0, 'sem subprocessos, a contagem é zero e não vazio');

-- Responsável ativo ou não: a4 é desativado agora.
reset role;
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is((pg_temp.linha('Resp Ativo')).responsavel_ativo, true, 'o responsável ativo aparece como ativo');
insert into _tap (linha) select is((pg_temp.linha('Resp Inativo')).responsavel_ativo, false, 'o responsável desativado aparece como inativo');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).responsavel_ativo, null::boolean, 'sem responsável, o campo é vazio');

-- Integrante e Consulta leem os mesmos valores.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select is((pg_temp.linha('V2 Sem')).ultima_versao_numero, 2, 'o integrante lê a última versão');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select is((pg_temp.linha('V2 Sem')).ultima_versao_numero, 2, 'a consulta lê a mesma última versão');
insert into _tap (linha) select is((pg_temp.linha('Parado')).etiqueta::text, 'em_andamento', 'a consulta lê a mesma etiqueta');
insert into _tap (linha) select is((pg_temp.linha('Pai')).subprocessos_quantidade, 2, 'a consulta lê a mesma contagem de subprocessos');

-- O usuário desativado e o visitante não leem.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento), 0::bigint, 'o usuário desativado não lê processos');
select set_config('request.jwt.claims', '', true);
set local role anon;
insert into _tap (linha) select throws_ok($sql$select * from public.processos_com_andamento$sql$, '42501', null,
  'o visitante não lê a view');
reset role;

insert into _tap (linha) select ok(
  (select coalesce(reloptions, '{}') @> array['security_invoker=true'] from pg_class
    where oid = 'public.processos_com_andamento'::regclass),
  'a view continua com security_invoker');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
