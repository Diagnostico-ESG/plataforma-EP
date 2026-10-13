-- Cadastros básicos, ticket 04: setores envolvidos em cada macroprocesso, com RLS por perfil e eventos no histórico.
-- Recusas chegam à interface pelo código do Postgres e pelo nome da restrição (src/cadastros/setoresEnvolvidosSupabase.ts).
-- Reaproveita private.pode_alterar_cadastros() e private.acao_do_cadastro() da migração de setores.

create table public.setores_envolvidos (
  macroprocesso_id uuid not null references public.macroprocessos (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  observacao text constraint setores_envolvidos_observacao_tamanho check (char_length(observacao) <= 500),
  criado_em timestamptz not null default now(),
  constraint setores_envolvidos_pkey primary key (macroprocesso_id, setor_id)
);

-- A chave composta serve para buscar por macroprocesso; falta o caminho inverso (macroprocessos de um setor).
create index setores_envolvidos_setor on public.setores_envolvidos (setor_id);

alter table public.setores_envolvidos enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui os dois ids e a observação e altera só a observação.
revoke all on public.setores_envolvidos from anon, authenticated;
grant select, delete on public.setores_envolvidos to authenticated;
grant insert (macroprocesso_id, setor_id, observacao) on public.setores_envolvidos to authenticated;
grant update (observacao) on public.setores_envolvidos to authenticated;

create policy "setores_envolvidos: ativo lê" on public.setores_envolvidos
  for select to authenticated using ((select private.usuario_ativo()));

create policy "setores_envolvidos: administrador e integrante ativos criam" on public.setores_envolvidos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "setores_envolvidos: administrador e integrante ativos alteram" on public.setores_envolvidos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "setores_envolvidos: administrador e integrante ativos apagam" on public.setores_envolvidos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: observação sem espaços nas pontas e vazia guardada como nula; o limite é da restrição.
create function private.preparar_setor_envolvido() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.observacao := nullif(btrim(new.observacao), '');
  return new;
end $$;

-- Evento de pôr (criar), mudar a observação (editar) e tirar (excluir) com sigla e nome legíveis.
-- Na exclusão de setor ou macroprocesso os vínculos são tirados ANTES do pai sair (gatilhos abaixo), quando os dois ainda existem.
create function private.registrar_evento_do_setor_envolvido() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  linha public.setores_envolvidos := case when tg_op = 'DELETE' then old else new end;
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla,
    'macroprocesso_id', m.id, 'macroprocesso_nome', m.nome) into base
  from public.setores s, public.macroprocessos m
  where s.id = linha.setor_id and m.id = linha.macroprocesso_id;
  base := coalesce(base, jsonb_build_object('setor_id', linha.setor_id, 'macroprocesso_id', linha.macroprocesso_id));
  antes := case when tg_op <> 'INSERT' then base || jsonb_build_object('observacao', old.observacao) end;
  depois := case when tg_op <> 'DELETE' then base || jsonb_build_object('observacao', new.observacao) end;
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'setor_envolvido',
    linha.macroprocesso_id::text || ':' || linha.setor_id::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Excluir um setor: guarda a lista de macroprocessos dele, tira os vínculos (cada um gera o seu evento) e registra a exclusão.
create function private.registrar_exclusao_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  macroprocessos jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('macroprocesso_id', m.id, 'codigo', m.codigo, 'nome', m.nome,
    'observacao', v.observacao) order by m.codigo nulls last, m.nome), '[]'::jsonb) into macroprocessos
  from public.setores_envolvidos v join public.macroprocessos m on m.id = v.macroprocesso_id
  where v.setor_id = old.id;
  delete from public.setores_envolvidos where setor_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'setor', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes,
      'ativo', old.ativo, 'macroprocessos', macroprocessos),
    'depois', null));
  return old;
end $$;

-- Excluir um macroprocesso: o mesmo, com a lista de setores.
create function private.registrar_exclusao_do_macroprocesso() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  setores jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('setor_id', s.id, 'sigla', s.sigla, 'nome', s.nome,
    'observacao', v.observacao) order by s.sigla), '[]'::jsonb) into setores
  from public.setores_envolvidos v join public.setores s on s.id = v.setor_id
  where v.macroprocesso_id = old.id;
  delete from public.setores_envolvidos where macroprocesso_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'macroprocesso', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('codigo', old.codigo, 'nome', old.nome, 'descricao', old.descricao,
      'categoria', old.categoria, 'ativo', old.ativo, 'setores', setores),
    'depois', null));
  return old;
end $$;

revoke execute on function private.preparar_setor_envolvido(), private.registrar_evento_do_setor_envolvido(),
  private.registrar_exclusao_do_setor(), private.registrar_exclusao_do_macroprocesso()
  from public, anon, authenticated;

create trigger preparar_setor_envolvido before insert or update on public.setores_envolvidos
  for each row execute function private.preparar_setor_envolvido();

create trigger registrar_evento_do_setor_envolvido after insert or update or delete on public.setores_envolvidos
  for each row execute function private.registrar_evento_do_setor_envolvido();

-- O evento de exclusão de setor e de macroprocesso sai dos gatilhos "antes de apagar" abaixo; os de
-- inclusão e alteração ficam como estavam (a ramificação de exclusão das funções antigas deixa de ser usada).
drop trigger registrar_evento_do_setor on public.setores;
create trigger registrar_evento_do_setor after insert or update on public.setores
  for each row execute function private.registrar_evento_do_setor();
drop trigger registrar_evento_do_macroprocesso on public.macroprocessos;
create trigger registrar_evento_do_macroprocesso after insert or update on public.macroprocessos
  for each row execute function private.registrar_evento_do_macroprocesso();

create trigger registrar_exclusao_do_setor before delete on public.setores
  for each row execute function private.registrar_exclusao_do_setor();
create trigger registrar_exclusao_do_macroprocesso before delete on public.macroprocessos
  for each row execute function private.registrar_exclusao_do_macroprocesso();
