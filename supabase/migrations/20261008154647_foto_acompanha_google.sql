-- Login e perfis, ticket 05 (ADR 0003): a foto acompanha a conta Google a cada entrada.
-- A cada entrada por OAuth, o Auth regrava raw_user_meta_data com os dados do Google (UpdateUserMetaData no
-- supabase/auth). Daqui só a foto vai para usuarios: o nome não acompanha, para não desfazer a correção do
-- administrador, e não há evento (registrar_evento_do_usuario só olha nome, perfil e ativo).
create function private.acompanhar_foto_do_google() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  foto_nova text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  update public.usuarios set foto_url = foto_nova
    where id = new.id and foto_url is distinct from foto_nova;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.acompanhar_foto_do_google() from public, anon, authenticated;

create trigger foto_acompanha_google after update on auth.users
  for each row when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function private.acompanhar_foto_do_google();
