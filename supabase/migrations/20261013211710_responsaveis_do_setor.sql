-- Processos e etapas, ticket 03: responsáveis do setor (nome, e-mail e cargo), lidos por todo perfil ativo e mantidos
-- por administrador e integrante, com eventos no histórico. A recusa do e-mail chega à interface como
-- "email_mal_formado:valor" em P0001 (src/processos/responsaveisSupabase.ts).

create table public.responsaveis_do_setor (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid not null references public.setores (id) on delete cascade,
  nome text not null constraint responsaveis_do_setor_nome_tamanho
    check (char_length(nome) between 1 and 200 and nome = btrim(nome)),
  email text constraint responsaveis_do_setor_email_formato
    check (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  cargo text constraint responsaveis_do_setor_cargo_tamanho check (char_length(cargo) <= 200),
  criado_em timestamptz not null default now()
);

create index responsaveis_do_setor_setor on public.responsaveis_do_setor (setor_id);

alter table public.responsaveis_do_setor enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui com o setor e altera só nome, e-mail e cargo.
revoke all on public.responsaveis_do_setor from anon, authenticated;
grant select, delete on public.responsaveis_do_setor to authenticated;
grant insert (setor_id, nome, email, cargo) on public.responsaveis_do_setor to authenticated;
grant update (nome, email, cargo) on public.responsaveis_do_setor to authenticated;

-- Todo perfil ativo vê com quem falar (decisão da sabatina de cadastros-basicos, 2026-10-10).
create policy "responsaveis_do_setor: ativo lê" on public.responsaveis_do_setor
  for select to authenticated using ((select private.usuario_ativo()));

create policy "responsaveis_do_setor: administrador e integrante ativos criam" on public.responsaveis_do_setor
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "responsaveis_do_setor: administrador e integrante ativos alteram" on public.responsaveis_do_setor
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "responsaveis_do_setor: administrador e integrante ativos apagam" on public.responsaveis_do_setor
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: sem espaços nas pontas, e-mail em minúsculas, vazio vira nulo; e-mail mal formado é recusado
-- com o valor como foi digitado (a restrição acima fica de reserva).
create function private.preparar_responsavel_do_setor() returns trigger
language plpgsql set search_path = ''
as $$
declare
  recebido text := btrim(new.email);
begin
  new.nome := btrim(new.nome);
  new.cargo := nullif(btrim(new.cargo), '');
  new.email := nullif(lower(recebido), '');
  if new.email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email_mal_formado:%', recebido;
  end if;
  return new;
end $$;

create trigger preparar_responsavel_do_setor before insert or update on public.responsaveis_do_setor
  for each row execute function private.preparar_responsavel_do_setor();

-- Evento com sigla e nome legíveis; a referência 'setor:responsável' deixa o histórico filtrar pelo setor.
-- Na exclusão do setor os responsáveis saem ANTES do setor (gatilho abaixo), quando a sigla ainda existe.
create function private.registrar_evento_do_responsavel_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  linha public.responsaveis_do_setor := case when tg_op = 'DELETE' then old else new end;
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla) into base
  from public.setores s where s.id = linha.setor_id;
  base := coalesce(base, jsonb_build_object('setor_id', linha.setor_id));
  antes := case when tg_op <> 'INSERT' then base || jsonb_build_object('nome', old.nome, 'email', old.email, 'cargo', old.cargo) end;
  depois := case when tg_op <> 'DELETE' then base || jsonb_build_object('nome', new.nome, 'email', new.email, 'cargo', new.cargo) end;
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'responsavel_do_setor',
    linha.setor_id::text || ':' || linha.id::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_responsavel_do_setor after insert or update or delete on public.responsaveis_do_setor
  for each row execute function private.registrar_evento_do_responsavel_do_setor();

-- Excluir um setor: além dos macroprocessos, guarda a lista dos responsáveis e os apaga antes do setor sair
-- (cada um gera o seu evento). A versão anterior é da migração setores_envolvidos.
create or replace function private.registrar_exclusao_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  macroprocessos jsonb;
  responsaveis jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('macroprocesso_id', m.id, 'codigo', m.codigo, 'nome', m.nome,
    'observacao', v.observacao) order by m.codigo nulls last, m.nome), '[]'::jsonb) into macroprocessos
  from public.setores_envolvidos v join public.macroprocessos m on m.id = v.macroprocesso_id
  where v.setor_id = old.id;
  select coalesce(jsonb_agg(jsonb_build_object('nome', r.nome, 'email', r.email, 'cargo', r.cargo)
    order by r.nome), '[]'::jsonb) into responsaveis
  from public.responsaveis_do_setor r where r.setor_id = old.id;
  delete from public.setores_envolvidos where setor_id = old.id;
  delete from public.responsaveis_do_setor where setor_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'setor', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes,
      'ativo', old.ativo, 'macroprocessos', macroprocessos, 'responsaveis', responsaveis),
    'depois', null));
  return old;
end $$;

revoke execute on function private.preparar_responsavel_do_setor(), private.registrar_evento_do_responsavel_do_setor(),
  private.registrar_exclusao_do_setor()
  from public, anon, authenticated;

-- Todo perfil ativo lê os eventos dos responsáveis (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê os responsáveis do setor" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'responsavel_do_setor');
