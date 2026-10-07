-- Login e perfis, ticket 01: perfis, usuários, e-mails, autorizações, eventos,
-- funções auxiliares das políticas, barreira antes de criar a conta e primeiro acesso.
-- Barreira: gancho "antes de criar usuário" do Supabase Auth (devolve o motivo à interface);
-- o gatilho de primeiro acesso repete a conferência da autorização, caso o gancho esteja desligado.

create type public.perfil as enum ('administrador', 'integrante_ep', 'consulta');

create table public.usuarios (
  id uuid primary key references auth.users (id),
  nome text not null check (btrim(nome) <> ''),
  foto_url text,
  perfil public.perfil not null,
  ativo boolean not null default true,
  primeiro_acesso_em timestamptz not null default now()
);

create table public.usuarios_emails (
  usuario_id uuid primary key references public.usuarios (id),
  email text not null unique check (email ~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$')
);

create table public.autorizacoes (
  email text primary key check (email ~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$'),
  perfil public.perfil not null default 'consulta',
  criada_em timestamptz not null default now(),
  criada_por uuid references public.usuarios (id)
);

create table public.eventos (
  id bigint generated always as identity primary key,
  ocorrido_em timestamptz not null default now(),
  autor_id uuid references public.usuarios (id),
  acao text not null,
  entidade text not null,
  entidade_ref text not null,
  detalhes jsonb not null
);

alter table public.usuarios enable row level security;
alter table public.usuarios_emails enable row level security;
alter table public.autorizacoes enable row level security;
alter table public.eventos enable row level security;

-- Funções auxiliares: fora da API, lidas pelas políticas sem recursão na RLS.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

create function private.perfil_atual() returns public.perfil
language sql stable security definer set search_path = ''
as $$ select perfil from public.usuarios where id = (select auth.uid()) $$;

create function private.usuario_ativo() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select ativo from public.usuarios where id = (select auth.uid())), false) $$;

revoke execute on function private.perfil_atual(), private.usuario_ativo() from public, anon;
grant execute on function private.perfil_atual(), private.usuario_ativo() to authenticated;

-- Leitura (tabela "quem pode o quê"). Escrita nesta etapa: nenhuma política; só os gatilhos gravam.
create policy "usuarios: ativo lê todos, inativo só a si" on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()) or (select private.usuario_ativo()));

create policy "usuarios_emails: o próprio e o administrador, se ativos" on public.usuarios_emails
  for select to authenticated
  using ((select private.usuario_ativo())
    and (usuario_id = (select auth.uid()) or (select private.perfil_atual()) = 'administrador'));

-- Barreira: o texto "motivo:email" é traduzido em mensagem pela interface (src/acesso/motivos.ts).
create function private.recusa_de_entrada(motivo text, email text) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('error', jsonb_build_object(
  'http_code', 403, 'message', motivo || ':' || coalesce(email, ''))) $$;

create function private.antes_de_criar_usuario(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  email_recebido text := lower(btrim(event -> 'user' ->> 'email'));
begin
  if email_recebido is null or email_recebido !~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$' then
    return private.recusa_de_entrada('fora_do_dominio', email_recebido);
  end if;
  if not exists (select 1 from public.autorizacoes a where a.email = email_recebido) then
    return private.recusa_de_entrada('sem_autorizacao', email_recebido);
  end if;
  return '{}'::jsonb;
end $$;

revoke execute on function private.recusa_de_entrada(text, text), private.antes_de_criar_usuario(jsonb)
  from public, anon, authenticated;
grant execute on function private.antes_de_criar_usuario(jsonb) to supabase_auth_admin;

-- Primeiro acesso: a autorização vira usuário com o mesmo perfil; a própria pessoa é a autora do evento.
create function private.registrar_primeiro_acesso() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  email_novo text := lower(btrim(new.email));
  autorizacao public.autorizacoes;
  nome_novo text;
begin
  delete from public.autorizacoes where email = email_novo returning * into autorizacao;
  if not found then
    raise exception 'sem_autorizacao:%', email_novo using errcode = 'P0001';
  end if;
  insert into public.usuarios (id, nome, foto_url, perfil)
  values (new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
             nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(email_novo, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    autorizacao.perfil)
  returning nome into nome_novo;
  insert into public.usuarios_emails (usuario_id, email) values (new.id, email_novo);
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values (new.id, 'primeiro_acesso', 'usuario', new.id::text, jsonb_build_object(
    'antes', jsonb_build_object('email', email_novo, 'perfil', autorizacao.perfil, 'situacao', 'aguardando'),
    'depois', jsonb_build_object('nome', nome_novo, 'perfil', autorizacao.perfil, 'ativo', true)));
  return new;
end $$;

revoke execute on function private.registrar_primeiro_acesso() from public, anon, authenticated;

create trigger primeiro_acesso after insert on auth.users
  for each row execute function private.registrar_primeiro_acesso();
