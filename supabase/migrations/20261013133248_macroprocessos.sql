-- Cadastros básicos, ticket 03: macroprocessos, com nome e código únicos, RLS por perfil e eventos no histórico.
-- Recusas chegam à interface pelo código do Postgres e pelo nome da restrição (src/cadastros/macroprocessosSupabase.ts).
-- Reaproveita private.pode_alterar_cadastros() e private.acao_do_cadastro() da migração de setores.

create type public.categoria_macroprocesso as enum ('finalistico', 'apoio', 'gerencial');

create table public.macroprocessos (
  id uuid primary key default gen_random_uuid(),
  codigo text constraint macroprocessos_codigo_tamanho check (char_length(codigo) <= 20),
  nome text not null constraint macroprocessos_nome_tamanho check (char_length(nome) between 1 and 200),
  descricao text constraint macroprocessos_descricao_tamanho check (char_length(descricao) <= 2000),
  categoria public.categoria_macroprocesso,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  -- Vários códigos nulos são aceitos: o Postgres não compara nulos na unicidade.
  constraint macroprocessos_codigo_key unique (codigo)
);

-- O nome chega aqui já sem espaços nas pontas (gatilho abaixo); lower() torna a unicidade indiferente a maiúsculas.
create unique index macroprocessos_nome_unico on public.macroprocessos (lower(nome));

alter table public.macroprocessos enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui e altera só os campos editáveis (id e criado_em ficam).
revoke all on public.macroprocessos from anon, authenticated;
grant select, delete on public.macroprocessos to authenticated;
grant insert (codigo, nome, descricao, categoria) on public.macroprocessos to authenticated;
grant update (codigo, nome, descricao, categoria, ativo) on public.macroprocessos to authenticated;

create policy "macroprocessos: ativo lê" on public.macroprocessos
  for select to authenticated using ((select private.usuario_ativo()));

create policy "macroprocessos: administrador e integrante ativos criam" on public.macroprocessos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "macroprocessos: administrador e integrante ativos alteram" on public.macroprocessos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "macroprocessos: administrador e integrante ativos apagam" on public.macroprocessos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: nome sem espaços nas pontas e código vazio guardado como nulo; os limites são das restrições.
create function private.preparar_macroprocesso() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.codigo := nullif(btrim(new.codigo), '');
  return new;
end $$;

-- Antes e depois com os campos legíveis, para o histórico continuar legível depois de uma exclusão.
create function private.registrar_evento_do_macroprocesso() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then jsonb_build_object(
    'codigo', old.codigo, 'nome', old.nome, 'descricao', old.descricao,
    'categoria', old.categoria, 'ativo', old.ativo) end;
  depois jsonb := case when tg_op <> 'DELETE' then jsonb_build_object(
    'codigo', new.codigo, 'nome', new.nome, 'descricao', new.descricao,
    'categoria', new.categoria, 'ativo', new.ativo) end;
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'macroprocesso',
    coalesce(new.id, old.id)::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_macroprocesso(), private.registrar_evento_do_macroprocesso()
  from public, anon, authenticated;

create trigger preparar_macroprocesso before insert or update on public.macroprocessos
  for each row execute function private.preparar_macroprocesso();

create trigger registrar_evento_do_macroprocesso after insert or update or delete on public.macroprocessos
  for each row execute function private.registrar_evento_do_macroprocesso();
