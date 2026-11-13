-- Relatório numerado com R (documentos-versoes, mudança de 2026-11-13; ADR 0047): o rótulo do relatório passa a "Relatório R2"
-- e public.renomear_relatorio_para_r troca o "_Relatório V<n>" do fim do nome por "_Relatório R<n>", só para o Administrador
-- ativo, com um evento por arquivo, em qualquer situação do processo e no subprocesso. Os dados são montados pelo dono do
-- teste com os gatilhos desligados (o envio e o andamento têm os testes deles); a renomeação roda com os gatilhos ligados.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(21);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000078', 'T78', 'Setor Relatorio R');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000078', null, 'Macro Relatorio R');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
select '5f000000-0000-0000-0000-000000000078', 'af000000-0000-0000-0000-000000000078', nome, 'processo'
from unnest(array['Emitir Oficio', 'Cancelado', 'Concluido']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000078', 'af000000-0000-0000-0000-000000000078', 'Filho', 'subprocesso', id
from public.processos where nome = 'Emitir Oficio' and setor_id = '5f000000-0000-0000-0000-000000000078';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000078' $$;

-- Uma versão com um arquivo, gravada direto (gatilhos desligados); devolve o id do arquivo.
create function pg_temp.arquivo(nome_do_processo text, numero integer, historica boolean, papel public.papel_do_arquivo,
  nome text, numero_do_relatorio integer) returns uuid
language plpgsql as $$
declare
  versao uuid;
  novo uuid;
begin
  set local session_replication_role = replica;
  select id into versao from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and versoes.numero = arquivo.numero;
  if versao is null then
    insert into public.versoes (processo_id, numero, historica, enviada_por)
    values (pg_temp.processo(nome_do_processo), arquivo.numero, arquivo.historica, '00000000-0000-0000-0000-0000000000a2')
    returning id into versao;
  end if;
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, enviado_por,
    numero_do_relatorio)
  values (versao, arquivo.papel, arquivo.nome, substring(arquivo.nome from '\.([^.]+)$'), 100, '0123456789abcdef0123456789abcdef',
    'drive-' || gen_random_uuid(), '00000000-0000-0000-0000-0000000000a2', arquivo.numero_do_relatorio)
  returning id into novo;
  set local session_replication_role = origin;
  return novo;
end $$;

create temp table _arquivos (chave text primary key, id uuid);
grant all on _arquivos to authenticated;
insert into _arquivos values
  ('padrao', pg_temp.arquivo('Emitir Oficio', 2, false, 'relatorio', 'T78_V2_Emitir Oficio_Relatório V1.docx', 1)),
  ('ja_com_r', pg_temp.arquivo('Emitir Oficio', 3, false, 'relatorio', 'T78_V3_Emitir Oficio_Relatório R2.docx', 2)),
  ('numero_diferente', pg_temp.arquivo('Emitir Oficio', 4, false, 'relatorio', 'T78_V4_Emitir Oficio_Relatório V9.docx', 3)),
  ('sem_padrao', pg_temp.arquivo('Emitir Oficio', 5, false, 'relatorio', 'relatorio.docx', 4)),
  ('sem_numero', pg_temp.arquivo('Emitir Oficio', 1, true, 'relatorio', 'T78_V1F_Emitir Oficio_Relatório.pdf', null)),
  ('bpm', pg_temp.arquivo('Emitir Oficio', 2, false, 'bpm', 'T78_V2_Emitir Oficio.bpm', null)),
  ('cancelado', pg_temp.arquivo('Cancelado', 1, false, 'relatorio', 'T78_V1_Cancelado_Relatório V1.docx', 1)),
  ('concluido', pg_temp.arquivo('Concluido', 1, false, 'relatorio', 'T78_V1_Concluido_Relatório V1.docx', 1)),
  ('filho', pg_temp.arquivo('Filho', 1, false, 'relatorio', 'T78_V1_Filho_Relatório V1.docx', 1)),
  ('perfis', pg_temp.arquivo('Emitir Oficio', 6, false, 'relatorio', 'T78_V6_Emitir Oficio_Relatório V5.docx', 5));

-- Situações: cancelado e em Concluídos (a passagem aberta passa a ser a de Concluídos).
set local session_replication_role = replica;
update public.processos set situacao = 'cancelado', motivo_da_situacao = 'Desistência do setor' where id = pg_temp.processo('Cancelado');
update public.passagens set etapa_id = (select id from public.etapas where codigo = 'concluidos')
where processo_id = pg_temp.processo('Concluido') and saiu_em is null;
set local session_replication_role = origin;

create function pg_temp.id(chave text) returns uuid language sql stable as $$ select id from _arquivos where _arquivos.chave = id.chave $$;
create function pg_temp.nome(chave text) returns text
language sql stable as $$ select nome from public.arquivos_da_versao where id = pg_temp.id(chave) $$;
create function pg_temp.renomear(chave text, esperado text default null) returns text
language sql as $$ select public.renomear_relatorio_para_r(pg_temp.id(chave), coalesce(esperado, pg_temp.nome(chave))) $$;
create function pg_temp.eventos(nome_do_processo text, acao text) returns bigint
language sql stable as $$
  select count(*) from public.eventos e
  where e.entidade = 'versao' and e.acao = eventos.acao and e.entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.id(text), pg_temp.nome(text), pg_temp.renomear(text, text), pg_temp.eventos(text, text),
  pg_temp.claims(text) to authenticated;

-- ===== O rótulo do relatório (os eventos de revisão gravados daqui em diante) =====
insert into _tap (linha) select is(private.rotulo_do_relatorio(pg_temp.id('padrao')), 'Relatório R1',
  'o rótulo do relatório numerado é "Relatório R1"');

-- ===== Perfis =====
select pg_temp.claims('a2');
set local role authenticated;
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('perfis')$sql$, '42501', null,
  'o integrante não renomeia o relatório');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('perfis')$sql$, '42501', null,
  'a consulta não renomeia o relatório');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok($sql$select public.renomear_relatorio_para_r(pg_temp.id('perfis'),
  'T78_V6_Emitir Oficio_Relatório V5.docx')$sql$, '42501', null, 'o administrador desativado não renomeia o relatório');
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok($sql$select public.renomear_relatorio_para_r('00000000-0000-0000-0000-000000000000',
  'x_Relatório V1.docx')$sql$, '42501', null, 'o visitante não renomeia o relatório');
reset role;

-- ===== O administrador renomeia =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select is(pg_temp.renomear('padrao'), 'T78_V2_Emitir Oficio_Relatório R1.docx',
  'o administrador renomeia e recebe o nome novo');
insert into _tap (linha) select is(pg_temp.nome('padrao'), 'T78_V2_Emitir Oficio_Relatório R1.docx',
  'o nome guardado passa a terminar em _Relatório R1');
insert into _tap (linha) select is((select numero_do_relatorio from public.arquivos_da_versao where id = pg_temp.id('padrao')), 1,
  'o número do relatório não muda');
insert into _tap (linha) select results_eq(
  $sql$select detalhes -> 'antes' ->> 'nome', detalhes -> 'depois' ->> 'nome', entidade_ref from public.eventos
    where entidade = 'versao' and acao = 'renomear_relatorio'
      and detalhes -> 'depois' ->> 'nome' = 'T78_V2_Emitir Oficio_Relatório R1.docx'$sql$,
  $sql$values ('T78_V2_Emitir Oficio_Relatório V1.docx', 'T78_V2_Emitir Oficio_Relatório R1.docx',
    pg_temp.processo('Emitir Oficio')::text)$sql$,
  'a renomeação grava um evento com o nome antigo e o novo, no histórico do processo');
insert into _tap (linha) select is(pg_temp.eventos('Emitir Oficio', 'substituir'), 0::bigint,
  'a troca do nome não registra substituição de arquivo');

-- ===== Já com R: nada muda =====
insert into _tap (linha) select is(pg_temp.renomear('padrao', 'T78_V2_Emitir Oficio_Relatório V1.docx'),
  'T78_V2_Emitir Oficio_Relatório R1.docx', 'renomear de novo devolve o nome com R');
insert into _tap (linha) select is((select count(*) from public.eventos where acao = 'renomear_relatorio'
  and detalhes -> 'depois' ->> 'nome' = 'T78_V2_Emitir Oficio_Relatório R1.docx'), 1::bigint,
  'renomear de novo não grava outro evento');
insert into _tap (linha) select is(pg_temp.renomear('ja_com_r'), 'T78_V3_Emitir Oficio_Relatório R2.docx',
  'o relatório que já nasceu com R fica como está');

-- ===== Recusas =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('perfis', 'T78_V6_Outro nome_Relatório V5.docx')$sql$,
  'P0001', 'nome_do_relatorio_alterado:T78_V6_Emitir Oficio_Relatório V5.docx',
  'nome guardado diferente do esperado é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('numero_diferente')$sql$, 'P0001',
  'relatorio_fora_do_padrao:T78_V4_Emitir Oficio_Relatório V9.docx', 'nome com número diferente do guardado é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('sem_padrao')$sql$, 'P0001',
  'relatorio_fora_do_padrao:relatorio.docx', 'nome fora do padrão é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('sem_numero')$sql$, 'P0001',
  'relatorio_fora_do_padrao:T78_V1F_Emitir Oficio_Relatório.pdf', 'relatório sem número é recusado');
insert into _tap (linha) select throws_ok($sql$select pg_temp.renomear('bpm')$sql$, 'P0001',
  'relatorio_fora_do_padrao:T78_V2_Emitir Oficio.bpm', 'arquivo que não é relatório é recusado');

-- ===== Qualquer situação e subprocesso =====
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.renomear(chave) from unnest(array['cancelado', 'concluido', 'filho']) as chave$sql$,
  $sql$values ('T78_V1_Cancelado_Relatório R1.docx'), ('T78_V1_Concluido_Relatório R1.docx'), ('T78_V1_Filho_Relatório R1.docx')$sql$,
  'renomeia no processo cancelado, no concluído e no subprocesso');

-- ===== O nome continua só pelas funções =====
insert into _tap (linha) select throws_ok(
  $sql$update public.arquivos_da_versao set nome = 'T78_V6_Emitir Oficio_Relatório R5.docx' where id = pg_temp.id('perfis')$sql$,
  '42501', null, 'alterar o nome direto continua recusado');
insert into _tap (linha) select is(pg_temp.nome('perfis'), 'T78_V6_Emitir Oficio_Relatório V5.docx',
  'o relatório que ninguém renomeou fica com V');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
