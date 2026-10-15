-- Pastas no Drive (documentos-versoes, ticket 01): o identificador da pasta do setor e da pasta do processo no
-- Drive compartilhado, para a pasta ser achada mesmo depois de renomeada (spec, "Pastas no Drive").
-- Escrita só pela função arquivos-no-drive, com o login de quem chamou (Administrador e Integrante).
-- O "on delete cascade" apaga só a linha: a pasta no Drive fica (a função nunca apaga nada no Drive).
create table public.pastas_no_drive (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid unique references public.setores (id) on delete cascade,
  processo_id uuid unique references public.processos (id) on delete cascade,
  drive_id text not null check (btrim(drive_id) <> ''),
  constraint pasta_de_um_so_dono check ((setor_id is null) <> (processo_id is null))
);

alter table public.pastas_no_drive enable row level security;

-- Privilégios: visitante nada; logado lê, inclui e altera só o drive_id. Ninguém apaga nem troca o dono.
revoke all on public.pastas_no_drive from anon, authenticated;
grant select on public.pastas_no_drive to authenticated;
grant insert (setor_id, processo_id, drive_id) on public.pastas_no_drive to authenticated;
grant update (drive_id) on public.pastas_no_drive to authenticated;

create policy "pastas_no_drive: ativo lê" on public.pastas_no_drive
  for select to authenticated using ((select private.usuario_ativo()));
create policy "pastas_no_drive: administrador e integrante ativos criam" on public.pastas_no_drive
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "pastas_no_drive: administrador e integrante ativos alteram" on public.pastas_no_drive
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));
