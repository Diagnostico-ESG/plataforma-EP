-- Formato do identificador do Drive (documentos-versoes, achado da revisão de segurança do /ship): o drive_id entra
-- na montagem de endereços da API do Google com a conta de serviço, e Administrador e Integrante gravam essa coluna
-- direto pela API do banco. Só letras, números, "_" e "-" (como a função arquivos-no-drive já exige no pedido);
-- sem isso, "../x" ou "x?param" mudariam o caminho que a conta de serviço chama.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
insert into _tap (linha) select plan(14);

-- replica desliga gatilhos e chaves estrangeiras, e só elas: as restrições CHECK continuam valendo. Assim o teste
-- não precisa montar setor, processo e versão para chegar à restrição.
set local session_replication_role = replica;

insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), '../x')$sql$,
  '23514', null, 'pasta: drive_id com barra e pontos é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), 'x?alt=media')$sql$,
  '23514', null, 'pasta: drive_id com interrogação é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), 'a b')$sql$,
  '23514', null, 'pasta: drive_id com espaço é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), repeat('a', 201))$sql$,
  '23514', null, 'pasta: drive_id com mais de 200 caracteres é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), 'a%2Fb')$sql$,
  '23514', null, 'pasta: drive_id com porcentagem é recusado');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), '1AbC_def-GHI234')$sql$,
  'pasta: drive_id com letras, números, sublinhado e hífen é aceito');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.pastas_no_drive (setor_id, drive_id) values (gen_random_uuid(), repeat('a', 200))$sql$,
  'pasta: drive_id com 200 caracteres é aceito');

create function pg_temp.arquivo_com(drive text) returns text language sql as $f$
  select format($q$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, enviado_por)
    values (gen_random_uuid(), 'bpmn', 'A.bpmn', 'bpmn', 10, repeat('a', 32), %L, gen_random_uuid())$q$, drive) $f$;

insert into _tap (linha) select throws_ok(pg_temp.arquivo_com('../x'), '23514', null, 'arquivo: drive_id com barra e pontos é recusado');
insert into _tap (linha) select throws_ok(pg_temp.arquivo_com('x?alt=media'), '23514', null, 'arquivo: drive_id com interrogação é recusado');
insert into _tap (linha) select throws_ok(pg_temp.arquivo_com('a b'), '23514', null, 'arquivo: drive_id com espaço é recusado');
insert into _tap (linha) select throws_ok(pg_temp.arquivo_com(repeat('a', 201)), '23514', null, 'arquivo: drive_id com mais de 200 caracteres é recusado');
insert into _tap (linha) select throws_ok(pg_temp.arquivo_com('a%2Fb'), '23514', null, 'arquivo: drive_id com porcentagem é recusado');
insert into _tap (linha) select lives_ok(pg_temp.arquivo_com('1AbC_def-GHI234'), 'arquivo: drive_id com letras, números, sublinhado e hífen é aceito');
insert into _tap (linha) select lives_ok(pg_temp.arquivo_com(repeat('a', 200)), 'arquivo: drive_id com 200 caracteres é aceito');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
