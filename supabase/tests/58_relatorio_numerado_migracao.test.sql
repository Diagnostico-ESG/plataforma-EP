-- Relatório com numeração própria, migração dos dados (documentos-versoes, ticket 10): os relatórios .docx das versões que
-- não são históricas ganham número na ordem do envio, por processo; os .pdf e o relatório da histórica ficam sem número;
-- rodar de novo não renumera. A migração usa private.numerar_relatorios_antigos(); aqui ela roda sobre linhas montadas com
-- os gatilhos desligados (como o desenvolvimento as tinha antes da migração).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(7);

-- Isola o teste dos dados que já existem no banco; a limpeza vale só nesta transação.
set local session_replication_role = replica;
delete from public.arquivos_da_versao;
delete from public.versoes;
delete from public.pastas_no_drive;
delete from public.eventos where entidade = 'versao';

insert into public.autorizacoes (email, perfil) values ('admin.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
insert into public.setores (id, sigla, nome, cor) values ('5f000000-0000-0000-0000-000000000058', 'MG1', 'Setor Migração', 1);
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000058', null, 'Macro Migração');
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-000000000058', 'af000000-0000-0000-0000-000000000058', 'Processo Migracao 1'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-000000000058', 'af000000-0000-0000-0000-000000000058', 'Processo Migracao 2');

-- Versões e relatórios como existiam: e1 com a histórica V1F (relatório .docx), a V3 (enviada antes, mas gravada primeiro),
-- a V2, e a V4 só com relatório .pdf; e2 com a V1.
create function pg_temp.versao(processo uuid, numero_da_versao integer, historica boolean, enviada interval) returns void
language sql as $$
  insert into public.versoes (processo_id, numero, historica, etapa_id, enviada_por, enviada_em)
  values (processo, numero_da_versao, historica,
    case when historica then null else (select id from public.etapas where codigo = 'nao_iniciados') end,
    '00000000-0000-0000-0000-0000000000a1', now() - enviada) $$;
create function pg_temp.relatorio(processo uuid, numero_da_versao integer, formato text, enviado interval) returns void
language sql as $$
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, enviado_por, enviado_em)
  select id, 'relatorio', 'MG1_V' || numero_da_versao || '_P_Relatório.' || formato, formato, 100,
    '0123456789abcdef0123456789abcdef', 'drive-' || id, '00000000-0000-0000-0000-0000000000a1', now() - enviado
  from public.versoes where processo_id = processo and numero = numero_da_versao $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.numero(processo uuid, numero_da_versao integer) returns integer
language sql stable as $$
  select a.numero_do_relatorio from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id
  where v.processo_id = processo and v.numero = numero_da_versao and a.papel = 'relatorio' $$;

select pg_temp.versao(pg_temp.processo('e1'), 1, true, interval '10 days');
select pg_temp.relatorio(pg_temp.processo('e1'), 1, 'docx', interval '10 days');
select pg_temp.versao(pg_temp.processo('e1'), 3, false, interval '5 days');
select pg_temp.relatorio(pg_temp.processo('e1'), 3, 'docx', interval '5 days');
select pg_temp.versao(pg_temp.processo('e1'), 2, false, interval '8 days');
select pg_temp.relatorio(pg_temp.processo('e1'), 2, 'docx', interval '8 days');
select pg_temp.versao(pg_temp.processo('e1'), 4, false, interval '2 days');
select pg_temp.relatorio(pg_temp.processo('e1'), 4, 'pdf', interval '2 days');
select pg_temp.versao(pg_temp.processo('e2'), 1, false, interval '3 days');
select pg_temp.relatorio(pg_temp.processo('e2'), 1, 'docx', interval '3 days');

-- Como na migração: gatilhos desligados enquanto a função numera.
select private.numerar_relatorios_antigos();
set local session_replication_role = origin;

insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e1'), 2), 1, 'o relatório enviado primeiro (V2) é o Relatório V1');
insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e1'), 3), 2, 'e o enviado depois (V3), mesmo gravado antes, é o Relatório V2');
insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e1'), 4), null::integer, 'o relatório .pdf fica sem número');
insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e1'), 1), null::integer, 'o relatório da versão histórica fica sem número');
insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e2'), 1), 1, 'cada processo tem a sua numeração');

set local session_replication_role = replica;
select private.numerar_relatorios_antigos();
set local session_replication_role = origin;
insert into _tap (linha) select is(pg_temp.numero(pg_temp.processo('e1'), 3), 2, 'rodar de novo não renumera');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao where numero_do_relatorio is not null), 3::bigint,
  'ao todo, três relatórios numerados');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
