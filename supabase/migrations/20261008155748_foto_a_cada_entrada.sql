-- Login e perfis, ticket 05: o gatilho da foto passa a rodar em toda alteração da conta no Auth (cada entrada
-- muda last_sign_in_at), e não só quando os dados do Google mudam. Com a condição antiga, quem já tinha os dados
-- novos no Auth de antes de o gatilho existir ficava com a foto velha até trocar de foto de novo (achado no teste
-- de ponta a ponta, 2026-10-08). A função só grava quando o link é outro, então rodar sempre não gera escrita à toa.
drop trigger foto_acompanha_google on auth.users;

create trigger foto_acompanha_google after update on auth.users
  for each row execute function private.acompanhar_foto_do_google();
