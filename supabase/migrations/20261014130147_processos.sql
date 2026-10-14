-- Processos e etapas, ticket 04: processos, andamentos do processo e a view do Quadro, com RLS por perfil, eventos no
-- histórico e recusas de exclusão com contagem (P0001 "motivo:valor", lidas em src/cadastros/recusasDeProcessos.ts).
-- Ficam para depois: subprocesso, pai e reclassificação (ticket 08), sequência e eventos dos andamentos do processo
-- (ticket 05; até lá a política abaixo impede alterar andamento de processo), situação com motivo (ticket 07).
-- Reaproveita private.pode_alterar_cadastros() e private.acao_do_cadastro() da migração de setores.

create type public.tipo_de_processo as enum ('processo', 'subprocesso', 'a_classificar');
create type public.origem_do_processo as enum ('novo', 'retomado');
create type public.situacao_guardada as enum ('em_andamento', 'suspenso', 'cancelado');

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid not null references public.setores (id) on delete restrict,
  macroprocesso_id uuid not null references public.macroprocessos (id) on delete restrict,
  nome text not null constraint processos_nome_tamanho check (char_length(nome) between 1 and 200 and nome = btrim(nome)),
  tipo public.tipo_de_processo not null default 'a_classificar',
  processo_pai_id uuid references public.processos (id) on delete restrict,
  origem public.origem_do_processo not null default 'novo',
  situacao public.situacao_guardada not null default 'em_andamento',
  motivo_da_situacao text constraint processos_motivo_tamanho check (char_length(motivo_da_situacao) <= 2000),
  contexto text constraint processos_contexto_tamanho check (char_length(contexto) <= 4000),
  observacoes text constraint processos_observacoes_tamanho check (char_length(observacoes) <= 2000),
  criado_em timestamptz not null default now(),
  constraint processos_pai_coerente check ((tipo = 'subprocesso') = (processo_pai_id is not null)),
  constraint processos_motivo_da_situacao check ((situacao = 'em_andamento') = (motivo_da_situacao is null)),
  -- O setor do processo é sempre setor envolvido no macroprocesso dele; a referência também impede tirar o vínculo.
  constraint processos_envolvido_fkey foreign key (macroprocesso_id, setor_id)
    references public.setores_envolvidos (macroprocesso_id, setor_id) on delete restrict
);

create unique index processos_nome_unico on public.processos (setor_id, lower(nome));
create index processos_vinculo on public.processos (macroprocesso_id, setor_id);

alter table public.processos enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui e altera só os campos editáveis. Tipo, pai e situação
-- não entram: mudam por funções dos tickets 07 e 08.
revoke all on public.processos from anon, authenticated;
grant select, delete on public.processos to authenticated;
grant insert (setor_id, macroprocesso_id, nome, tipo, origem, contexto, observacoes) on public.processos to authenticated;
grant update (setor_id, macroprocesso_id, nome, origem, contexto, observacoes) on public.processos to authenticated;

create policy "processos: ativo lê" on public.processos
  for select to authenticated using ((select private.usuario_ativo()));

create policy "processos: administrador e integrante ativos criam" on public.processos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "processos: administrador e integrante ativos alteram" on public.processos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "processos: administrador e integrante ativos apagam" on public.processos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- A etapa passa a poder ser de um processo. Exatamente um dono por andamento; o processo excluído leva os andamentos.
alter table public.andamentos alter column setor_id drop not null;
alter table public.andamentos add column processo_id uuid references public.processos (id) on delete cascade;
alter table public.andamentos add constraint andamentos_um_dono check ((setor_id is null) <> (processo_id is null));
alter table public.andamentos add constraint andamentos_etapa_processo_key unique (etapa_id, processo_id);
create index andamentos_processo on public.andamentos (processo_id);
create unique index andamentos_um_em_andamento_por_processo on public.andamentos (processo_id) where status = 'em_andamento';

-- Até o ticket 05 só o andamento de setor muda: a sequência das etapas do processo ainda não é imposta pelo banco.
drop policy "andamentos: administrador e integrante ativos alteram" on public.andamentos;
create policy "andamentos: administrador e integrante ativos alteram" on public.andamentos
  for update to authenticated
  using ((select private.pode_alterar_cadastros()) and setor_id is not null)
  with check ((select private.pode_alterar_cadastros()) and setor_id is not null);

-- Antes de gravar: nome sem espaços nas pontas, textos vazios viram nulos e o setor entra como envolvido no
-- macroprocesso quando falta (a referência composta confere depois). Roda com a permissão de quem grava.
create function private.preparar_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.contexto := nullif(btrim(new.contexto), '');
  new.observacoes := nullif(btrim(new.observacoes), '');
  if tg_op = 'INSERT' or (new.setor_id, new.macroprocesso_id) is distinct from (old.setor_id, old.macroprocesso_id) then
    insert into public.setores_envolvidos (macroprocesso_id, setor_id)
    values (new.macroprocesso_id, new.setor_id) on conflict do nothing;
  end if;
  return new;
end $$;

create trigger preparar_processo before insert or update on public.processos
  for each row execute function private.preparar_processo();

-- Processo novo nasce com uma etapa pendente por etapa ativa do nível processo (ninguém inclui andamentos pela API).
create function private.criar_andamentos_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.andamentos (etapa_id, processo_id)
  select id, new.id from public.etapas where nivel = 'processo' and ativa;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger criar_andamentos_do_processo after insert on public.processos
  for each row execute function private.criar_andamentos_do_processo();

-- Os campos do processo como o evento os guarda: legíveis, para o histórico continuar legível depois de uma exclusão.
create function private.estado_do_processo(processo public.processos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', processo.nome, 'setor_id', processo.setor_id, 'setor_sigla', s.sigla,
    'macroprocesso_id', processo.macroprocesso_id, 'macroprocesso_nome', m.nome, 'tipo', processo.tipo,
    'origem', processo.origem, 'situacao', processo.situacao, 'contexto', processo.contexto,
    'observacoes', processo.observacoes)
  from public.setores s, public.macroprocessos m
  where s.id = processo.setor_id and m.id = processo.macroprocesso_id $$;

-- A referência do evento é o id do processo; as etapas dele (ticket 05) usam 'processo:andamento'.
create function private.registrar_evento_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'UPDATE' then private.estado_do_processo(old) end;
  depois jsonb := private.estado_do_processo(new);
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'processo', new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_processo after insert or update on public.processos
  for each row execute function private.registrar_evento_do_processo();

-- Excluir um processo: "antes de apagar", porque os andamentos saem em cascata antes de qualquer gatilho "depois".
create function private.registrar_exclusao_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  andamentos jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('etapa_codigo', e.codigo, 'etapa_nome', e.nome, 'status', a.status,
    'nota', a.nota, 'iniciada_em', a.iniciada_em, 'resolvida_em', a.resolvida_em) order by e.ordem), '[]'::jsonb)
    into andamentos
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'processo', old.id::text, jsonb_build_object(
    'antes', private.estado_do_processo(old) || jsonb_build_object('andamentos', andamentos), 'depois', null));
  return old;
end $$;

create trigger registrar_exclusao_do_processo before delete on public.processos
  for each row execute function private.registrar_exclusao_do_processo();

-- Recusas com a contagem. O nome começa com "conferir_", que vem antes de "registrar_exclusao_..." na ordem em que o
-- Postgres dispara os gatilhos: a recusa sai antes de qualquer vínculo ser tirado ou de qualquer evento ser gravado.
create function private.conferir_setor_sem_processos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.processos where setor_id = old.id);
begin
  if total > 0 then
    raise exception 'setor_com_processos:%', total;
  end if;
  return old;
end $$;

create function private.conferir_macroprocesso_sem_processos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.processos where macroprocesso_id = old.id);
begin
  if total > 0 then
    raise exception 'macroprocesso_com_processos:%', total;
  end if;
  return old;
end $$;

create function private.conferir_vinculo_sem_processos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.processos
    where macroprocesso_id = old.macroprocesso_id and setor_id = old.setor_id);
begin
  if total > 0 then
    raise exception 'setor_com_processos_no_macroprocesso:%:%',
      (select sigla from public.setores where id = old.setor_id), total;
  end if;
  return old;
end $$;

create trigger conferir_setor_sem_processos before delete on public.setores
  for each row execute function private.conferir_setor_sem_processos();
create trigger conferir_macroprocesso_sem_processos before delete on public.macroprocessos
  for each row execute function private.conferir_macroprocesso_sem_processos();
create trigger conferir_vinculo_sem_processos before delete on public.setores_envolvidos
  for each row execute function private.conferir_vinculo_sem_processos();

-- A view do Quadro, com a permissão de quem lê. Tudo o que ela calcula não é guardado:
-- etapa atual (a em andamento ou, sem ela, a primeira pendente), situação "concluido" (guardada em andamento com todas
-- as etapas obrigatórias resolvidas) e "aguardando o setor" (alguma etapa do setor ainda pendente ou em andamento).
create view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.obrigatoria and a.status in ('pendente', 'em_andamento')
  ) then 'concluido' else p.situacao::text end as situacao,
  atual.etapa_id as etapa_atual_id, atual.codigo as etapa_atual_codigo, atual.nome as etapa_atual_nome,
  atual.ordem as etapa_atual_ordem,
  exists (
    select 1 from public.andamentos a
    where a.setor_id = p.setor_id and a.status in ('pendente', 'em_andamento')
  ) as aguardando_o_setor,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento')
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

revoke execute on function private.preparar_processo(), private.criar_andamentos_do_processo(),
  private.estado_do_processo(public.processos), private.registrar_evento_do_processo(),
  private.registrar_exclusao_do_processo(), private.conferir_setor_sem_processos(),
  private.conferir_macroprocesso_sem_processos(), private.conferir_vinculo_sem_processos()
  from public, anon, authenticated;

-- Todo perfil ativo lê os eventos dos processos (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê os processos" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'processo');
