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
