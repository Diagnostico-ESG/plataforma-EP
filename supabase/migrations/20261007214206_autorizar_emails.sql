-- Login e perfis, ticket 02: o administrador autoriza e-mails, muda o perfil da autorização e a exclui.
-- Recusas no formato "motivo:email", traduzidas pela interface (src/acesso/falhasDeGravacao.ts).

-- Privilégios: visitante nada; da autorização, só o perfil se altera (trocar o e-mail é excluir e autorizar de novo).
revoke all on public.autorizacoes from anon;
revoke update on public.autorizacoes from authenticated;
grant update (perfil) on public.autorizacoes to authenticated;

create policy "autorizacoes: administrador ativo lê" on public.autorizacoes
  for select to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo autoriza" on public.autorizacoes
  for insert to authenticated
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo muda o perfil" on public.autorizacoes
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo exclui" on public.autorizacoes
  for delete to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Preparo antes de incluir. Security invoker de propósito: quem não é administrador não vê as linhas
-- pela RLS, então a recusa não revela se um e-mail já está autorizado.
create function private.preparar_autorizacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  if new.email !~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$' then
    raise exception 'email_fora_do_dominio:%', new.email using errcode = 'P0001';
  end if;
  if exists (select 1 from public.autorizacoes a where a.email = new.email) then
    raise exception 'email_ja_autorizado:%', new.email using errcode = 'P0001';
  end if;
  if exists (select 1 from public.usuarios_emails u where u.email = new.email) then
    raise exception 'email_ja_e_usuario:%', new.email using errcode = 'P0001';
  end if;
  new.criada_em := now();
  new.criada_por := (select auth.uid());
  return new;
end $$;

create function private.registrar_evento_da_autorizacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then jsonb_build_object('email', old.email, 'perfil', old.perfil) end;
  depois jsonb := case when tg_op <> 'DELETE' then jsonb_build_object('email', new.email, 'perfil', new.perfil) end;
begin
  -- O primeiro acesso consome a autorização e já registra o próprio evento (private.registrar_primeiro_acesso).
  if tg_op = 'DELETE' and exists (select 1 from auth.users u where lower(btrim(u.email)) = old.email) then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case tg_op when 'INSERT' then 'autorizar' when 'UPDATE' then 'mudar_perfil' else 'excluir_autorizacao' end,
    'autorizacao', coalesce(depois, antes) ->> 'email', jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_autorizacao(), private.registrar_evento_da_autorizacao()
  from public, anon, authenticated;

create trigger preparar_autorizacao before insert on public.autorizacoes
  for each row execute function private.preparar_autorizacao();

create trigger registrar_evento_da_autorizacao after insert or update or delete on public.autorizacoes
  for each row execute function private.registrar_evento_da_autorizacao();
