-- Retirar anexo (documentos-versoes, ticket 13; ADR 0027): Administrador e Integrante ativos apagam o anexo, só com o processo
-- em andamento e não arquivado. A retirada deixa um evento com o nome e a etapa do envio, guardados mesmo depois de apagada a
-- linha. Consulta e usuário inativo não vêem a linha para apagar (a política de apagar não lhes serve) e o visitante não tem
-- o privilégio. Não destrutiva: só concede o privilégio e cria a política, as funções e os gatilhos; nenhum dado é tocado.
-- Recusas em P0001 "motivo:valor" (src/anexos/recusasDeAnexos.ts), as mesmas do envio.

grant delete on public.anexos to authenticated;

create policy "anexos: administrador e integrante ativos apagam" on public.anexos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de apagar: processo não arquivado e em andamento (as recusas de sempre, na ordem do envio). O nome começa com
-- "conferir_", que vem antes de "registrar_retirada_..." na ordem em que o Postgres dispara os gatilhos. Roda com a
-- permissão de quem apaga.
create function private.conferir_processo_do_anexo_retirado() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.processos where id = old.processo_id and arquivado_em is not null) then
    raise exception 'processo_arquivado';
  end if;
  perform private.conferir_processo_que_recebe_versao(old.processo_id);
  return old;
end $$;

create trigger conferir_processo_do_anexo_retirado before delete on public.anexos
  for each row execute function private.conferir_processo_do_anexo_retirado();

-- Um evento por retirada, gravado antes de a linha sumir (o estado do anexo é lido da própria linha). Se a política ou outro
-- gatilho recusar, o comando todo desfaz, inclusive o evento. A referência é o id do processo, como no envio.
create function private.registrar_retirada_do_anexo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'retirar', 'anexo', old.processo_id::text,
    jsonb_build_object('antes', private.estado_do_anexo(old.id), 'depois', null));
  return old;
end $$;

create trigger registrar_retirada_do_anexo before delete on public.anexos
  for each row execute function private.registrar_retirada_do_anexo();

revoke execute on function private.conferir_processo_do_anexo_retirado(), private.registrar_retirada_do_anexo()
  from public, anon, authenticated;
