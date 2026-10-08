-- Login e perfis (revisão de segurança do /ship, 2026-10-08): a foto passa a vir de auth.identities.
-- raw_user_meta_data, em auth.users, a própria pessoa altera pela API (auth.updateUser({ data })); com o gatilho
-- lendo dali, qualquer logado, até inativo, trocava a própria foto por um link qualquer, que os colegas carregariam.
-- identity_data só o Auth grava, com os dados do Google, a cada entrada (internal/api/external.go do supabase/auth).
-- O primeiro acesso continua lendo raw_user_meta_data: na criação da conta ele ainda é só o que o Google mandou.
drop trigger foto_acompanha_google on auth.users;
drop function private.acompanhar_foto_do_google();

create function private.acompanhar_foto_da_identidade_google() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  foto_nova text := coalesce(new.identity_data ->> 'avatar_url', new.identity_data ->> 'picture');
begin
  update public.usuarios set foto_url = foto_nova
    where id = new.user_id and foto_url is distinct from foto_nova;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.acompanhar_foto_da_identidade_google() from public, anon, authenticated;

create trigger foto_acompanha_identidade_google after insert or update on auth.identities
  for each row when (new.provider = 'google')
  execute function private.acompanhar_foto_da_identidade_google();
