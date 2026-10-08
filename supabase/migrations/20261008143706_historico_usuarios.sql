-- Login e perfis, ticket 04: só o administrador ativo lê o histórico; ninguém grava nele pela API.
-- Os eventos entram pelos gatilhos dos tickets 01 a 03, que são security definer e não dependem destes privilégios.
-- O truncate também sai: a RLS não vale para ele, só o privilégio o barra.

revoke all on public.eventos from anon, authenticated;
grant select on public.eventos to authenticated;

create policy "eventos: administrador ativo lê" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');
