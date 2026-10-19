-- Cartão do Quadro (processos-etapas, ticket 20): os campos novos da view processos_com_andamento — início e status da
-- etapa atual, responsável ativo, caminho de etapas, última versão (histórica ou não, com ou sem relatório) e a
-- contagem de subprocessos não cancelados.
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
from unnest(array['Parado', 'Pendente', 'V1 Sem', 'V1 Com', 'Relatorio Depois', 'V2 Sem', 'Historica', 'Pai',
  'Resp Ativo', 'Resp Inativo']) as nome;
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

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a
  join public.etapas e on e.id = a.etapa_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.iniciar(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$
  update public.andamentos set status = 'em_andamento' where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.iniciar(text, text) to authenticated;

create function pg_temp.escolher(nome_do_processo text, codigo_da_etapa text, usuario uuid) returns void
language sql as $$
  update public.andamentos set responsavel_id = usuario where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.escolher(text, text, uuid) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T20_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel || '-' || formato) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn'), pg_temp.arquivo('png', 'png')) $$;
create function pg_temp.relatorio(nome text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', 'relatorio', 'nome', nome, 'formato', 'pdf', 'tamanho', 100,
    'hash_md5', 'abcdef0123456789abcdef0123456789', 'drive_id', 'drive-' || md5(nome)) $$;
create function pg_temp.versao(nome_do_processo text, numero_da_versao integer) returns uuid
language sql stable as $$
  select id from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and numero = numero_da_versao $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.par(), pg_temp.relatorio(text), pg_temp.versao(text, integer)
  to authenticated;

-- Tudo isto como administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select pg_temp.iniciar('Parado', 'modelagem');
select pg_temp.escolher('Resp Ativo', 'modelagem', '00000000-0000-0000-0000-0000000000a2');
select pg_temp.escolher('Resp Inativo', 'modelagem', '00000000-0000-0000-0000-0000000000a4');
select public.registrar_versao(pg_temp.processo('V1 Sem'), 1, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('V1 Com'), 1, null, pg_temp.par() || pg_temp.relatorio('T20_V1_Com_Relatório.pdf'));
select public.registrar_versao(pg_temp.processo('Relatorio Depois'), 1, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('V2 Sem'), 1, null, pg_temp.par() || pg_temp.relatorio('T20_V2_Sem_Relatório.pdf'));
select public.registrar_versao(pg_temp.processo('V2 Sem'), 2, null, pg_temp.par());
select public.registrar_versao_historica(pg_temp.processo('Historica'), 5, null, jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')));
select public.cancelar_processo(pg_temp.processo('Filho C'), 'Não segue');

-- Etapa atual: início e status.
insert into _tap (linha) select is((pg_temp.linha('Parado')).etapa_atual_status::text, 'em_andamento',
  'a etapa atual iniciada aparece como em andamento');
insert into _tap (linha) select is((pg_temp.linha('Parado')).etapa_atual_iniciada_em, current_date,
  'o início da etapa atual é a data em que ela foi iniciada');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).etapa_atual_status::text, 'pendente',
  'a etapa atual não iniciada aparece como pendente');
insert into _tap (linha) select is((pg_temp.linha('Pendente')).etapa_atual_iniciada_em, null::date,
  'a etapa atual pendente não tem início');

-- Caminho: um item por andamento, na ordem do catálogo.
insert into _tap (linha) select is(jsonb_array_length((pg_temp.linha('Parado')).caminho),
  (select count(*)::int from public.andamentos where processo_id = pg_temp.processo('Parado')),
  'o caminho tem um item por andamento do processo');
insert into _tap (linha) select is(
  (select array_agg(item ->> 'codigo' order by ordem) from jsonb_array_elements((pg_temp.linha('Parado')).caminho)
    with ordinality as t(item, ordem)),
  (select array_agg(codigo order by ordem) from public.etapas where id in
    (select etapa_id from public.andamentos where processo_id = pg_temp.processo('Parado'))),
  'o caminho segue a ordem do catálogo');
insert into _tap (linha) select is((pg_temp.linha('Parado')).caminho -> 0 ->> 'status', 'em_andamento',
  'o item do caminho traz o status do andamento');
insert into _tap (linha) select ok((pg_temp.linha('Parado')).caminho -> 0 ? 'etapa_id',
  'o item do caminho traz o id da etapa');

-- Última versão.
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_numero, 1, 'a última versão é a V1');
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_historica, false, 'a V1 não é histórica');
insert into _tap (linha) select is((pg_temp.linha('V1 Sem')).ultima_versao_tem_relatorio, false, 'a V1 sem relatório não tem relatório');
insert into _tap (linha) select is((pg_temp.linha('V1 Com')).ultima_versao_tem_relatorio, true, 'a V1 com relatório tem relatório');
insert into _tap (linha) select is((pg_temp.linha('Relatorio Depois')).ultima_versao_tem_relatorio, false,
  'antes de acrescentar o relatório, a versão não o tem');
select public.acrescentar_relatorio(pg_temp.versao('Relatorio Depois', 1), 1, pg_temp.relatorio('T20_RD_Relatório.pdf'));
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
insert into _tap (linha) select is((pg_temp.linha('Parado')).etapa_atual_iniciada_em, current_date, 'a consulta lê o mesmo início da etapa');
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
