-- Processos e etapas, ticket 02: catálogo de etapas (carga da fase 1) e etapas do setor, com sequência, dispensa,
-- datas do dia da ação e eventos no histórico. Recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/processosSupabase.ts) ou pelo código do Postgres.
-- Ficam para depois: processo_id e regras de processo (ticket 04), edição de datas e responsável (ticket 06),
-- manutenção do catálogo (ticket 10).

create type public.nivel_da_etapa as enum ('setor', 'processo');
create type public.status_da_etapa as enum
  ('pendente', 'em_andamento', 'concluida', 'realizada_anteriormente', 'dispensada');

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null constraint etapas_codigo_formato check (codigo ~ '^[a-z0-9_]{2,40}$'),
  nome text not null constraint etapas_nome_tamanho check (char_length(nome) between 1 and 120 and nome = btrim(nome)),
  ordem integer not null constraint etapas_ordem_positiva check (ordem > 0),
  nivel public.nivel_da_etapa not null,
  obrigatoria boolean not null,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint etapas_codigo_key unique (codigo),
  constraint etapas_ordem_key unique (ordem)
);

create unique index etapas_nome_unico on public.etapas (lower(nome));

insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria) values
  ('identificacao_responsaveis', 'Identificação dos responsáveis', 1, 'setor', false),
  ('sensibilizacao', 'Reunião de sensibilização', 2, 'setor', false),
  ('identificacao_processos', 'Identificação dos processos', 3, 'setor', true),
  ('modelagem', 'Reunião de modelagem', 4, 'processo', true),
  ('relatorio_modelagem_tecnica', 'Relatório e modelagem técnica', 5, 'processo', true),
  ('revisao_interna', 'Revisão interna', 6, 'processo', true),
  ('revisao_setor', 'Revisão pelo setor', 7, 'processo', true),
  ('aprovacao_setor', 'Aprovação pelo setor', 8, 'processo', true),
  ('publicacao', 'Publicação', 9, 'processo', false);

alter table public.etapas enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, e inclui e altera só os campos editáveis (código e nível não mudam).
revoke all on public.etapas from anon, authenticated;
grant select, delete on public.etapas to authenticated;
grant insert (codigo, nome, ordem, nivel, obrigatoria, ativa) on public.etapas to authenticated;
grant update (nome, ordem, obrigatoria, ativa) on public.etapas to authenticated;

create policy "etapas: ativo lê" on public.etapas
  for select to authenticated using ((select private.usuario_ativo()));

create policy "etapas: administrador ativo cria" on public.etapas
  for insert to authenticated
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "etapas: administrador ativo altera" on public.etapas
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "etapas: administrador ativo apaga" on public.etapas
  for delete to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Uma etapa do catálogo num setor. A etapa usada não se apaga; o setor excluído leva as etapas dele.
create table public.andamentos (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references public.etapas (id) on delete restrict,
  setor_id uuid not null references public.setores (id) on delete cascade,
  status public.status_da_etapa not null default 'pendente',
  nota text constraint andamentos_nota_tamanho check (char_length(nota) <= 2000),
  responsavel_id uuid references public.usuarios (id),
  iniciada_em date,
  resolvida_em date,
  constraint andamentos_nota_obrigatoria
    check (status not in ('dispensada', 'realizada_anteriormente') or nota is not null),
  constraint andamentos_etapa_setor_key unique (etapa_id, setor_id)
);

create index andamentos_setor on public.andamentos (setor_id);
create unique index andamentos_um_em_andamento_por_setor on public.andamentos (setor_id) where status = 'em_andamento';

alter table public.andamentos enable row level security;

-- Privilégios: visitante nada; logado lê e muda só status e nota. Criar e apagar é dos gatilhos.
revoke all on public.andamentos from anon, authenticated;
grant select on public.andamentos to authenticated;
grant update (status, nota) on public.andamentos to authenticated;

create policy "andamentos: ativo lê" on public.andamentos
  for select to authenticated using ((select private.usuario_ativo()));

-- Quem registra o andamento é quem mantém os cadastros: administrador e integrante ativos (a regra da spec).
create policy "andamentos: administrador e integrante ativos alteram" on public.andamentos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Transições permitidas; voltar (sair de uma resolvida) é a função do ticket 06.
create function private.conferir_transicao(de public.status_da_etapa, para public.status_da_etapa) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if (de = 'pendente' and para = 'em_andamento') or (de = 'em_andamento' and para = 'concluida')
    or (de in ('pendente', 'em_andamento') and para in ('dispensada', 'realizada_anteriormente')) then
    return;
  end if;
  raise exception 'transicao_nao_permitida:%:%', de, para;
end $$;

-- Sair de pendente pede a anterior resolvida: a anterior é a etapa do mesmo setor com a maior ordem abaixo desta.
create function private.conferir_anterior_resolvida(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.setor_id = andamento.setor_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if found and anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

-- Só a etapa opcional se dispensa.
create function private.conferir_dispensa(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  etapa record;
begin
  select nome, obrigatoria into etapa from public.etapas where id = andamento.etapa_id;
  if andamento.status = 'dispensada' and etapa.obrigatoria then
    raise exception 'etapa_obrigatoria:%', etapa.nome;
  end if;
end $$;

-- Antes de gravar: nota sem espaços nas pontas (vazia vira nula e a restrição a exige onde é obrigatória);
-- na mudança de status, transição, sequência e dispensa conferidas e a data do dia da ação gravada.
create function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  if new.status = old.status then
    return new;
  end if;
  perform private.conferir_transicao(old.status, new.status);
  if old.status = 'pendente' then
    perform private.conferir_anterior_resolvida(new);
  end if;
  perform private.conferir_dispensa(new);
  if new.status = 'em_andamento' then
    new.iniciada_em := current_date;
  else
    new.resolvida_em := current_date;
  end if;
  return new;
end $$;

-- As conferências rodam com a permissão de quem altera (o gatilho não é security definer).
revoke execute on function private.conferir_transicao(public.status_da_etapa, public.status_da_etapa),
  private.conferir_anterior_resolvida(public.andamentos), private.conferir_dispensa(public.andamentos)
  from public, anon;
grant execute on function private.conferir_transicao(public.status_da_etapa, public.status_da_etapa),
  private.conferir_anterior_resolvida(public.andamentos), private.conferir_dispensa(public.andamentos)
  to authenticated;

create trigger preparar_andamento before update on public.andamentos
  for each row execute function private.preparar_andamento();

-- Setor novo nasce com uma etapa pendente por etapa ativa do nível setor (ninguém inclui andamentos pela API).
create function private.criar_andamentos_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.andamentos (etapa_id, setor_id)
  select id, new.id from public.etapas where nivel = 'setor' and ativa;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger criar_andamentos_do_setor after insert on public.setores
  for each row execute function private.criar_andamentos_do_setor();

-- Os setores que já existem ganham as etapas do setor agora.
insert into public.andamentos (etapa_id, setor_id)
select e.id, s.id from public.etapas e cross join public.setores s where e.nivel = 'setor' and e.ativa;

-- Ação do evento pelo status novo; sem mudança de status (só a nota), é editar.
create function private.acao_do_andamento(antes public.status_da_etapa, depois public.status_da_etapa) returns text
language sql immutable set search_path = ''
as $$ select case
  when antes = depois then 'editar'
  when depois = 'em_andamento' then 'iniciar'
  when depois = 'concluida' then 'concluir'
  when depois = 'dispensada' then 'dispensar'
  when depois = 'realizada_anteriormente' then 'registrar_realizada'
  else 'editar' end $$;

-- Evento com setor e etapa legíveis; a referência 'setor:andamento' deixa o histórico filtrar pelo setor.
create function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla, 'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
    into base
  from public.setores s, public.etapas e where s.id = new.setor_id and e.id = new.etapa_id;
  antes := base || jsonb_build_object('status', old.status, 'iniciada_em', old.iniciada_em, 'resolvida_em', old.resolvida_em);
  depois := base || jsonb_build_object('status', new.status, 'iniciada_em', new.iniciada_em, 'resolvida_em', new.resolvida_em);
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old.status, new.status), 'andamento',
    new.setor_id::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', new.nota));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_andamento(), private.criar_andamentos_do_setor(),
  private.acao_do_andamento(public.status_da_etapa, public.status_da_etapa), private.registrar_evento_do_andamento()
  from public, anon, authenticated;

create trigger registrar_evento_do_andamento after update on public.andamentos
  for each row execute function private.registrar_evento_do_andamento();

-- Todo perfil ativo lê os eventos das etapas (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê as etapas" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'andamento');
