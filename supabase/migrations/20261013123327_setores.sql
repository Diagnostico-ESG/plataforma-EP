-- Cadastros básicos, ticket 01: setores, com sigla conferida, RLS por perfil e eventos no histórico.
-- Recusas chegam à interface pelo código do Postgres e pelo nome da restrição (src/cadastros/cadastrosSupabase.ts).

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null constraint setores_nome_tamanho check (char_length(nome) between 1 and 200),
  sigla text not null constraint setores_sigla_formato check (sigla ~ '^[A-Z0-9-]{2,15}$'),
  observacoes text constraint setores_observacoes_tamanho check (char_length(observacoes) <= 2000),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint setores_sigla_key unique (sigla)
);

-- O nome chega aqui já sem espaços nas pontas (gatilho abaixo); lower() torna a unicidade indiferente a maiúsculas.
create unique index setores_nome_unico on public.setores (lower(nome));

alter table public.setores enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui e altera só os campos editáveis (id e criado_em ficam).
revoke all on public.setores from anon, authenticated;
grant select, delete on public.setores to authenticated;
grant insert (nome, sigla, observacoes) on public.setores to authenticated;
grant update (nome, sigla, observacoes, ativo) on public.setores to authenticated;

-- Quem mantém os cadastros: administrador e integrante ativos (reaproveitada por macroprocessos e setores envolvidos).
create function private.pode_alterar_cadastros() returns boolean
language sql stable set search_path = ''
as $$ select private.usuario_ativo() and coalesce(private.perfil_atual() in ('administrador', 'integrante_ep'), false) $$;

revoke execute on function private.pode_alterar_cadastros() from public, anon;
grant execute on function private.pode_alterar_cadastros() to authenticated;

create policy "setores: ativo lê" on public.setores
  for select to authenticated using ((select private.usuario_ativo()));

create policy "setores: administrador e integrante ativos criam" on public.setores
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "setores: administrador e integrante ativos alteram" on public.setores
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "setores: administrador e integrante ativos apagam" on public.setores
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: nome sem espaços nas pontas e sigla em maiúsculas; o formato é conferido pela restrição.
create function private.preparar_setor() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.sigla := upper(btrim(new.sigla));
  return new;
end $$;

-- Ação do evento de um cadastro: mudança só em "ativo" é desativar ou reativar; o resto é editar.
create function private.acao_do_cadastro(operacao text, antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when operacao = 'INSERT' then 'criar'
  when operacao = 'DELETE' then 'excluir'
  when antes - 'ativo' = depois - 'ativo' then case when (depois ->> 'ativo')::boolean then 'reativar' else 'desativar' end
  else 'editar' end $$;

-- Antes e depois com os campos legíveis, para o histórico continuar legível depois de uma exclusão.
create function private.registrar_evento_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then jsonb_build_object(
    'sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes, 'ativo', old.ativo) end;
  depois jsonb := case when tg_op <> 'DELETE' then jsonb_build_object(
    'sigla', new.sigla, 'nome', new.nome, 'observacoes', new.observacoes, 'ativo', new.ativo) end;
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'setor',
    coalesce(new.id, old.id)::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_setor(), private.acao_do_cadastro(text, jsonb, jsonb),
  private.registrar_evento_do_setor() from public, anon, authenticated;

create trigger preparar_setor before insert or update on public.setores
  for each row execute function private.preparar_setor();

create trigger registrar_evento_do_setor after insert or update or delete on public.setores
  for each row execute function private.registrar_evento_do_setor();
