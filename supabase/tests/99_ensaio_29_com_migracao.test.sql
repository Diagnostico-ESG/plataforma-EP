-- Relatório depois e "sem alteração de conteúdo" (documentos-versoes, ticket 05): o relatório acrescentado a uma versão
-- nova que ainda não tem, a cópia do relatório da versão imediatamente anterior, a histórica somente leitura, um evento
-- por operação e quem pode. Complementa o 27 (versões novas) e o 28 (históricas). "Outra chamada" é simulada recuando
-- enviada_em como superusuário, porque o pgTAP roda tudo numa transação só e o banco reconhece "a mesma chamada" por
-- enviada_em = now().
begin;
-- ENSAIO TEMPORÁRIO: a migração dentro do teste, desfeita no fim.
-- Relatório depois e "sem alteração de conteúdo" (documentos-versoes, ticket 05): o relatório que entra numa versão
-- nova que ainda não tem, e a cópia do relatório da versão imediatamente anterior. Acrescenta o ramo "arquivo novo" ao
-- gatilho dos arquivos, um evento por arquivo que entra depois da versão e as funções que gravam cada caso.
-- Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts). A histórica continua somente leitura (migração
-- versoes_historicas): nenhum arquivo entra nela depois da chamada que a criou.

-- "copiado_de" nasceu sem privilégio de inclusão (ticket 02): agora a cópia pode ser gravada; as regras abaixo e a RLS
-- (administrador e integrante ativos) decidem o resto.
grant insert (copiado_de) on public.arquivos_da_versao to authenticated;

-- A versão imediatamente anterior: a de maior número menor que o da versão, no mesmo processo (a histórica conta).
create function private.versao_anterior(versao uuid) returns uuid
language sql stable set search_path = ''
as $$
  select anterior.id
  from public.versoes atual
  join public.versoes anterior on anterior.processo_id = atual.processo_id and anterior.numero < atual.numero
  where atual.id = versao
  order by anterior.numero desc
  limit 1 $$;

-- A cópia só vale se for de um relatório, o da versão imediatamente anterior, e com o mesmo conteúdo do original
-- (formato, tamanho e MD5 que o Drive informou).
create function private.conferir_copia_do_relatorio(
  versao_alvo uuid, papel_novo public.papel_do_arquivo, origem uuid, formato_novo text, tamanho_novo bigint, hash_novo text
) returns void
language plpgsql stable set search_path = ''
as $$
declare
  da_origem record;
begin
  select versao_id, papel, formato, tamanho, hash_md5 into da_origem from public.arquivos_da_versao where id = origem;
  if papel_novo <> 'relatorio' or da_origem.papel is distinct from 'relatorio' then
    raise exception 'copia_so_de_relatorio';
  end if;
  if da_origem.versao_id is distinct from private.versao_anterior(versao_alvo) then
    raise exception 'copia_de_versao_que_nao_e_a_anterior';
  end if;
  if (da_origem.formato, da_origem.tamanho, da_origem.hash_md5) is distinct from (formato_novo, tamanho_novo, hash_novo) then
    raise exception 'copia_diferente_do_original';
  end if;
end $$;

-- O que vale para um arquivo que entra: a versão não tem outro relatório (a restrição única continua como rede de
-- segurança) e, sendo cópia, as conferências acima.
create function private.conferir_arquivo_novo(
  versao_alvo uuid, papel_novo public.papel_do_arquivo, origem uuid, formato_novo text, tamanho_novo bigint, hash_novo text
) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if papel_novo = 'relatorio'
    and exists (select 1 from public.arquivos_da_versao where versao_id = versao_alvo and papel = 'relatorio') then
    raise exception 'relatorio_ja_existe';
  end if;
  if origem is not null then
    perform private.conferir_copia_do_relatorio(versao_alvo, papel_novo, origem, formato_novo, tamanho_novo, hash_novo);
  end if;
end $$;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, histórica somente leitura, as conferências
-- do arquivo novo (só na inclusão), autor e data de quem grava.
create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  da_versao record;
begin
  select processo_id, historica, enviada_em into da_versao from public.versoes where id = new.versao_id;
  perform private.conferir_processo_que_recebe_versao(da_versao.processo_id);
  if da_versao.historica and (tg_op = 'UPDATE' or da_versao.enviada_em <> now()) then
    raise exception 'versao_historica_somente_leitura';
  end if;
  if tg_op = 'INSERT' then
    perform private.conferir_arquivo_novo(new.versao_id, new.papel, new.copiado_de, new.formato, new.tamanho, new.hash_md5);
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- Um evento por arquivo que entra depois da versão: "acrescentar_relatorio" ou, na cópia, "sem_alteracao" (com a versão
-- de onde veio o relatório). Os arquivos que entram junto com a versão já estão no evento de envio dela.
create function private.registrar_evento_do_relatorio() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  da_versao record;
  depois jsonb;
begin
  select processo_id, enviada_em into da_versao from public.versoes where id = new.versao_id;
  if da_versao.enviada_em = now() then
    return null;
  end if;
  depois := private.estado_da_versao(new.versao_id);
  if new.copiado_de is not null then
    depois := depois || jsonb_build_object('relatorio_de', (
      select 'V' || v.numero || case when v.historica then 'F' else '' end
      from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id where a.id = new.copiado_de));
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.copiado_de is null then 'acrescentar_relatorio' else 'sem_alteracao' end,
    'versao', da_versao.processo_id::text, jsonb_build_object('antes', null, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_relatorio after insert on public.arquivos_da_versao
  for each row execute function private.registrar_evento_do_relatorio();

-- O relatório da versão imediatamente anterior, para a função do servidor copiá-lo no Drive. Vazio se não há.
create function public.origem_do_relatorio(p_versao uuid) returns table (arquivo_id uuid, formato text, drive_id text)
language sql stable set search_path = ''
as $$
  select a.id, a.formato, a.drive_id
  from public.arquivos_da_versao a
  where a.versao_id = private.versao_anterior(p_versao) and a.papel = 'relatorio' $$;

-- Acrescenta o relatório a uma versão que ainda não tem, chamada pela função arquivos-no-drive com o login de quem
-- chamou. Sem security definer: a RLS decide. O papel é sempre relatório; p_numero é o número com que o arquivo foi
-- nomeado no Drive (se a versão tem outro, nada é gravado).
create function public.acrescentar_relatorio(p_versao uuid, p_numero integer, p_arquivo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  numero_dado integer := (select numero from public.versoes where id = p_versao);
begin
  if numero_dado <> p_numero then
    raise exception 'numero_da_versao_mudou:%', numero_dado;
  end if;
  perform private.gravar_arquivos_da_versao(p_versao, jsonb_build_array(p_arquivo || jsonb_build_object('papel', 'relatorio')));
  return (select id from public.arquivos_da_versao where versao_id = p_versao and papel = 'relatorio');
end $$;

-- "Sem alteração de conteúdo": grava o relatório que a função copiou no Drive, ligado ao da versão anterior. Sem security
-- definer: a RLS decide.
create function public.registrar_sem_alteracao(p_versao uuid, p_arquivo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  origem uuid := (select arquivo_id from public.origem_do_relatorio(p_versao));
  novo uuid;
begin
  if origem is null then
    raise exception 'versao_anterior_sem_relatorio';
  end if;
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, copiado_de)
  values (p_versao, 'relatorio', p_arquivo ->> 'nome', p_arquivo ->> 'formato', (p_arquivo ->> 'tamanho')::bigint,
    p_arquivo ->> 'hash_md5', p_arquivo ->> 'drive_id', origem)
  returning id into novo;
  return novo;
end $$;

revoke execute on function public.origem_do_relatorio(uuid), public.acrescentar_relatorio(uuid, integer, jsonb),
  public.registrar_sem_alteracao(uuid, jsonb) from public, anon;
grant execute on function public.origem_do_relatorio(uuid), public.acrescentar_relatorio(uuid, integer, jsonb),
  public.registrar_sem_alteracao(uuid, jsonb) to authenticated;
-- Chamadas de dentro das funções e do gatilho, que rodam com a permissão de quem grava.
revoke execute on function private.versao_anterior(uuid),
  private.conferir_copia_do_relatorio(uuid, public.papel_do_arquivo, uuid, text, bigint, text),
  private.conferir_arquivo_novo(uuid, public.papel_do_arquivo, uuid, text, bigint, text) from public, anon;
grant execute on function private.versao_anterior(uuid),
  private.conferir_copia_do_relatorio(uuid, public.papel_do_arquivo, uuid, text, bigint, text),
  private.conferir_arquivo_novo(uuid, public.papel_do_arquivo, uuid, text, bigint, text) to authenticated;
revoke execute on function private.registrar_evento_do_relatorio() from public, anon, authenticated;

create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(37);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-0000000000e1', 'RD1', 'Setor Relatório');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000e1', null, 'Macro Relatório');
insert into public.processos (id, setor_id, macroprocesso_id, nome) values
  ('9f000000-0000-0000-0000-0000000000e1', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Relatorio'),
  ('9f000000-0000-0000-0000-0000000000e2', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Parado R'),
  ('9f000000-0000-0000-0000-0000000000e3', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Cancelado R'),
  ('9f000000-0000-0000-0000-0000000000e4', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Concluido R'),
  ('9f000000-0000-0000-0000-0000000000e5', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Historico R'),
  ('9f000000-0000-0000-0000-0000000000e6', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Perfis R'),
  ('9f000000-0000-0000-0000-0000000000e7', '5f000000-0000-0000-0000-0000000000e1', 'af000000-0000-0000-0000-0000000000e1', 'Processo Integrante R');

-- Um arquivo inventado no formato que registrar_versao recebe.
create function pg_temp.arquivo(papel text, formato text, tamanho bigint default 100) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'RD1_V1_Processo.' || formato, 'formato', formato,
    'tamanho', tamanho, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpmn', 'bpmn'), pg_temp.arquivo('png', 'png')) $$;
-- O relatório do V2 (o que o "sem alteração" copia) e o que a cópia traz de volta; o MD5 pode ser trocado.
create function pg_temp.relatorio(nome text, hash text default 'abcdef0123456789abcdef0123456789') returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', 'relatorio', 'nome', nome, 'formato', 'pdf', 'tamanho', 100, 'hash_md5', hash,
    'drive_id', 'drive-' || nome) $$;
create function pg_temp.processo(sufixo text) returns uuid
language sql immutable as $$ select ('9f000000-0000-0000-0000-0000000000' || sufixo)::uuid $$;
create function pg_temp.versao(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$ select id from public.versoes where processo_id = processo and numero = numero_da_versao $$;
create function pg_temp.relatorio_da(processo uuid, numero_da_versao integer) returns uuid
language sql stable as $$
  select id from public.arquivos_da_versao where papel = 'relatorio' and versao_id = pg_temp.versao(processo, numero_da_versao) $$;
create function pg_temp.arquivo_da(processo uuid, numero_da_versao integer, qual public.papel_do_arquivo) returns uuid
language sql stable as $$
  select id from public.arquivos_da_versao where papel = qual and versao_id = pg_temp.versao(processo, numero_da_versao) $$;
grant execute on function pg_temp.arquivo(text, text, bigint), pg_temp.par(), pg_temp.relatorio(text, text), pg_temp.processo(text),
  pg_temp.versao(uuid, integer), pg_temp.relatorio_da(uuid, integer), pg_temp.arquivo_da(uuid, integer, public.papel_do_arquivo) to authenticated;

-- Versões, como administrador (os processos ainda estão em andamento). e1: V1 sem relatório, V2 com, V3 a V5 sem.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select public.registrar_versao(pg_temp.processo('e1'), 1, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e1'), 2, null, pg_temp.par() || pg_temp.relatorio('RD1_V2_Processo Relatorio_Relatório.pdf'));
select public.registrar_versao(pg_temp.processo('e1'), 3, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e1'), 4, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e1'), 5, null, pg_temp.par());
-- e2, e3 e e4 ganham uma versão sem relatório antes de mudar de situação.
select public.registrar_versao(pg_temp.processo('e2'), 1, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e3'), 1, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e4'), 1, null, pg_temp.par());
-- e5: a histórica V1F com relatório e a V2F sem.
select public.registrar_versao_historica(pg_temp.processo('e5'), 1, null, pg_temp.par() || pg_temp.relatorio('RD1_V1F_Processo Historico R_Relatório.pdf'));
select public.registrar_versao_historica(pg_temp.processo('e5'), 2, null, pg_temp.par());
-- e6: V1 com relatório, V2 e V3 sem. e7: V1 sem relatório.
select public.registrar_versao(pg_temp.processo('e6'), 1, null, pg_temp.par() || pg_temp.relatorio('RD1_V1_Processo Perfis R_Relatório.pdf'));
select public.registrar_versao(pg_temp.processo('e6'), 2, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e6'), 3, null, pg_temp.par());
select public.registrar_versao(pg_temp.processo('e7'), 1, null, pg_temp.par());

-- Outra chamada: as versões já existem há um dia.
reset role;
update public.versoes set enviada_em = now() - interval '1 day';

-- Administrador, no processo e1.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 1), pg_temp.relatorio('RD1_V1_Processo Relatorio_Relatório.pdf'))$sql$,
  'P0001', 'versao_anterior_sem_relatorio', 'a V1 não tem versão anterior para copiar');
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e1'), 1), 1, pg_temp.relatorio('RD1_V1_Processo Relatorio_Relatório.pdf'))$sql$,
  'administrador acrescenta o relatório à V1');
insert into _tap (linha) select is((select count(*) from public.arquivos_da_versao
    where versao_id = pg_temp.versao(pg_temp.processo('e1'), 1) and papel = 'relatorio'
      and enviado_por = '00000000-0000-0000-0000-0000000000a1' and copiado_de is null), 1::bigint,
  'a V1 passa a ter o relatório, enviado por quem chamou e sem origem de cópia');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e1'), 1), 1, pg_temp.relatorio('RD1_V1_Processo Relatorio_Relatório.pdf'))$sql$,
  'P0001', 'relatorio_ja_existe', 'a versão que já recebeu o relatório depois não recebe outro');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e1'), 2), 2, pg_temp.relatorio('outro.pdf'))$sql$,
  'P0001', 'relatorio_ja_existe', 'a versão criada com relatório não recebe outro');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e1'), 3), 3, pg_temp.arquivo('png', 'png'))$sql$,
  '23514', null, 'o papel é sempre relatório: um .png não entra');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e1'), 3), 9, pg_temp.relatorio('x.pdf'))$sql$,
  'P0001', 'numero_da_versao_mudou:3', 'o número esperado precisa ser o da versão');

-- "Sem alteração de conteúdo": a V3 copia o relatório da V2.
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 3), pg_temp.relatorio('RD1_V3_Processo Relatorio_Relatório.pdf'))$sql$,
  'a V3 copia o relatório da V2');
insert into _tap (linha) select is((select copiado_de from public.arquivos_da_versao
    where id = pg_temp.relatorio_da(pg_temp.processo('e1'), 3)), pg_temp.relatorio_da(pg_temp.processo('e1'), 2),
  'a cópia guarda de qual relatório veio');
insert into _tap (linha) select is((select nome from public.arquivos_da_versao where id = pg_temp.relatorio_da(pg_temp.processo('e1'), 3)),
  'RD1_V3_Processo Relatorio_Relatório.pdf', 'a cópia tem o nome da versão nova');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 5), pg_temp.relatorio('RD1_V5_Processo Relatorio_Relatório.pdf'))$sql$,
  'P0001', 'versao_anterior_sem_relatorio', 'a V5 não copia: a V4, anterior a ela, não tem relatório');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 3), pg_temp.relatorio('RD1_V3_Processo Relatorio_Relatório.pdf'))$sql$,
  'P0001', 'relatorio_ja_existe', 'a versão que já tem relatório não copia outro');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 4), pg_temp.relatorio('RD1_V4_Processo Relatorio_Relatório.pdf', 'ffffffffffffffffffffffffffffffff'))$sql$,
  'P0001', 'copia_diferente_do_original', 'a cópia precisa ter o mesmo conteúdo do original (MD5)');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, copiado_de)
    values (pg_temp.versao(pg_temp.processo('e1'), 4), 'relatorio', 'RD1_V4_P_Relatório.pdf', 'pdf', 100, 'abcdef0123456789abcdef0123456789', 'x',
      pg_temp.relatorio_da(pg_temp.processo('e1'), 2))$sql$,
  'P0001', 'copia_de_versao_que_nao_e_a_anterior', 'copiar de versão que não é a anterior é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, copiado_de)
    values (pg_temp.versao(pg_temp.processo('e1'), 4), 'bpm', 'RD1_V4_P.bpm', 'bpm', 100, 'abcdef0123456789abcdef0123456789', 'x',
      pg_temp.relatorio_da(pg_temp.processo('e1'), 3))$sql$,
  'P0001', 'copia_so_de_relatorio', 'só o relatório pode ser uma cópia');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id, copiado_de)
    values (pg_temp.versao(pg_temp.processo('e1'), 4), 'relatorio', 'RD1_V4_P_Relatório.pdf', 'pdf', 100, '0123456789abcdef0123456789abcdef', 'x',
      pg_temp.arquivo_da(pg_temp.processo('e1'), 3, 'bpmn'))$sql$,
  'P0001', 'copia_so_de_relatorio', 'copiar de um arquivo que não é relatório é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e1'), 4), pg_temp.relatorio('RD1_V4_Processo Relatorio_Relatório.pdf'))$sql$,
  'a V4 copia o relatório da V3, que já era uma cópia');
insert into _tap (linha) select is((select copiado_de from public.arquivos_da_versao
    where id = pg_temp.relatorio_da(pg_temp.processo('e1'), 4)), pg_temp.relatorio_da(pg_temp.processo('e1'), 3),
  'a cópia da V4 vem do relatório da V3');

-- Eventos: um por operação (a V2, criada com relatório, não ganha evento extra).
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'acrescentar_relatorio'
    and entidade_ref = pg_temp.processo('e1')::text and detalhes -> 'depois' ->> 'rotulo' = 'V1'
    and detalhes -> 'depois' -> 'arquivos' @> '[{"papel": "relatorio"}]'::jsonb
    and autor_id = '00000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'acrescentar o relatório gera um evento, com o rótulo, os arquivos e o autor');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'sem_alteracao'
    and entidade_ref = pg_temp.processo('e1')::text), 2::bigint, 'cada "sem alteração" gera um evento');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'sem_alteracao'
    and detalhes -> 'depois' ->> 'rotulo' = 'V3' and detalhes -> 'depois' ->> 'relatorio_de' = 'V2'), 1::bigint,
  'o evento diz de qual versão veio o relatório');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao = 'enviar'
    and entidade_ref = pg_temp.processo('e1')::text), 5::bigint, 'as cinco versões criadas têm só o evento de envio');

-- Histórica: somente leitura (a V1F tem relatório; a V2F não recebe nem copia).
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e5'), 2), 2, pg_temp.relatorio('x.pdf'))$sql$,
  'P0001', 'versao_historica_somente_leitura', 'relatório não se acrescenta a versão histórica');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e5'), 2), pg_temp.relatorio('RD1_V2F_Processo Historico R_Relatório.pdf'))$sql$,
  'P0001', 'versao_historica_somente_leitura', '"sem alteração" não vale para versão histórica');

-- Processo fora de andamento (as versões foram criadas antes de a situação mudar; a mudança vem agora, como integrante).
reset role;
-- Preparação, como integrante: as etapas do setor resolvidas e o "Processo Concluido V" com as obrigatórias resolvidas.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-0000000000e1' and status = 'pendente';
-- Na ordem do caminho, uma por vez (a sequência das etapas é conferida a cada mudança).
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'modelagem';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'relatorio_modelagem_tecnica';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'revisao_interna';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'revisao_setor';
update public.andamentos a set status = 'realizada_anteriormente', nota = 'Feita antes' from public.etapas e
  where e.id = a.etapa_id and a.processo_id = pg_temp.processo('e4') and e.codigo = 'aprovacao_setor';
select public.suspender_processo(pg_temp.processo('e2'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('e3'), 'Não segue');
reset role;
update public.versoes set enviada_em = now() - interval '1 day';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e2'), 1), 1, pg_temp.relatorio('x.pdf'))$sql$,
  'P0001', 'processo_fora_de_andamento:suspenso', 'relatório em processo suspenso é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e3'), 1), 1, pg_temp.relatorio('x.pdf'))$sql$,
  'P0001', 'processo_fora_de_andamento:cancelado', 'relatório em processo cancelado é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e4'), 1), 1, pg_temp.relatorio('x.pdf'))$sql$,
  'P0001', 'processo_fora_de_andamento:concluido', 'relatório em processo concluído é recusado');

-- Integrante.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e6'), 2), pg_temp.relatorio('RD1_V2_Processo Perfis R_Relatório.pdf'))$sql$,
  'integrante marca "sem alteração"');
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e7'), 1), 1, pg_temp.relatorio('RD1_V1_Processo Integrante R_Relatório.pdf'))$sql$,
  'integrante acrescenta um relatório');

-- Consulta.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e6'), 3), 3, pg_temp.relatorio('x.pdf'))$sql$,
  '42501', null, 'consulta não acrescenta relatório');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao(pg_temp.versao(pg_temp.processo('e6'), 3), pg_temp.relatorio('RD1_V3_Processo Perfis R_Relatório.pdf'))$sql$,
  '42501', null, 'consulta não marca "sem alteração"');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao in ('acrescentar_relatorio', 'sem_alteracao')),
  5::bigint, 'consulta lê os eventos de relatório');

-- Inativo.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio(pg_temp.versao(pg_temp.processo('e6'), 3), 3, pg_temp.relatorio('x.pdf'))$sql$,
  '42501', null, 'inativo não acrescenta relatório');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'versao' and acao in ('acrescentar_relatorio', 'sem_alteracao')),
  0::bigint, 'inativo não lê os eventos de relatório');

-- Visitante.
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.acrescentar_relatorio('00000000-0000-0000-0000-000000000001', 1, '{}'::jsonb)$sql$, '42501', null,
  'visitante não acrescenta relatório');
insert into _tap (linha) select throws_ok(
  $sql$select public.registrar_sem_alteracao('00000000-0000-0000-0000-000000000001', '{}'::jsonb)$sql$, '42501', null,
  'visitante não marca "sem alteração"');
insert into _tap (linha) select throws_ok(
  $sql$select public.origem_do_relatorio('00000000-0000-0000-0000-000000000001')$sql$, '42501', null,
  'visitante não lê a origem do relatório');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
