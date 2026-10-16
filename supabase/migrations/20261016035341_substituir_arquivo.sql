-- Substituir arquivo (documentos-versoes, ticket 06): o arquivo novo, do mesmo papel e formato, troca só o conteúdo do
-- registro que já existe (tamanho, hash, autor e data); o nome, o papel, o identificador do Drive e a versão ficam.
-- Nada novo é concedido: o privilégio de coluna "update (tamanho, hash_md5, enviado_por, enviado_em)", a política de
-- alterar (administrador e integrante ativos) e os gatilhos "processo em andamento" e "histórica somente leitura" já
-- nasceram nas migrações versoes, versoes_historicas e relatorio_depois_e_sem_alteracao. Esta migração acrescenta a
-- função que grava a troca e o evento dela. Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts).

-- Troca o conteúdo de um arquivo, chamada pela função arquivos-no-drive com o login de quem chamou. Sem security
-- definer: a RLS decide. O formato novo precisa ser o do arquivo que sai (o nome, com a extensão, é fixo). Arquivo que
-- quem chama não enxerga, ou que a RLS não deixa mudar, é falta de permissão (42501), como no download.
create function public.substituir_arquivo(p_arquivo uuid, p_novo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  formato_atual text := (select formato from public.arquivos_da_versao where id = p_arquivo);
begin
  if formato_atual is null then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  if formato_atual <> coalesce(p_novo ->> 'formato', '') then
    raise exception 'tipo_de_arquivo_diferente:%', formato_atual;
  end if;
  update public.arquivos_da_versao
  set tamanho = (p_novo ->> 'tamanho')::bigint, hash_md5 = p_novo ->> 'hash_md5'
  where id = p_arquivo;
  if not found then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  return p_arquivo;
end $$;

-- Um evento por troca. O "antes" guarda o nome e o hash do que saiu (o arquivo anterior não fica guardado, o hash é o
-- que permite saber depois que ele mudou); o "depois" traz a versão, o processo e o hash novo. A referência é o id do
-- processo, como nos outros eventos de versão.
create function private.registrar_evento_da_substituicao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  versao jsonb := private.estado_da_versao(new.versao_id);
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'substituir', 'versao',
    (select processo_id::text from public.versoes where id = new.versao_id),
    jsonb_build_object(
      'antes', jsonb_build_object('nome', old.nome, 'hash_md5', old.hash_md5),
      'depois', jsonb_build_object('rotulo', versao -> 'rotulo', 'processo_nome', versao -> 'processo_nome',
        'setor_sigla', versao -> 'setor_sigla', 'nome', new.nome, 'hash_md5', new.hash_md5)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_substituicao after update on public.arquivos_da_versao
  for each row execute function private.registrar_evento_da_substituicao();

revoke execute on function public.substituir_arquivo(uuid, jsonb) from public, anon;
grant execute on function public.substituir_arquivo(uuid, jsonb) to authenticated;
revoke execute on function private.registrar_evento_da_substituicao() from public, anon, authenticated;
