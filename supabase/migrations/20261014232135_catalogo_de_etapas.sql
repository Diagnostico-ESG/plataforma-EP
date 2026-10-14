-- Catálogo de etapas (processos-etapas, ticket 10; ADR 0004): acrescentar, mover, desativar, reativar e excluir etapas,
-- com os andamentos pendentes que cada mudança inclui ou apaga, e os eventos do catálogo. Recusas em P0001
-- "motivo:valor" (src/processos/andamentosSupabase.ts).

-- Abrir espaço e trocar duas etapas mudam várias ordens num comando só: a unicidade é conferida no fim dele.
alter table public.etapas drop constraint etapas_ordem_key;
alter table public.etapas add constraint etapas_ordem_key unique (ordem) deferrable initially immediate;

-- Os gatilhos do catálogo ligam este ajuste (só na transação) para a RLS de andamentos deixar incluir e apagar.
-- Quem chama a API não consegue ajustá-lo: só funções do banco o ligam.
create function private.sincronizando_catalogo() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.sincronizando_catalogo', true), '') = 'on' $$;

grant insert (etapa_id, setor_id, processo_id), delete on public.andamentos to authenticated;

create policy "andamentos: o catálogo do administrador inclui" on public.andamentos
  for insert to authenticated
  with check ((select private.sincronizando_catalogo()) and (select private.usuario_ativo())
    and (select private.perfil_atual()) = 'administrador');

create policy "andamentos: o catálogo do administrador apaga" on public.andamentos
  for delete to authenticated
  using ((select private.sincronizando_catalogo()) and (select private.usuario_ativo())
    and (select private.perfil_atual()) = 'administrador');

-- A etapa entra pendente em todos os setores (inclusive inativos) e nos processos em andamento ou suspensos que não
-- estão concluídos (situação calculada da view); só onde falta, porque a reativação usa a mesma regra.
create function private.incluir_andamentos_pendentes(etapa public.etapas) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  if etapa.nivel = 'setor' then
    insert into public.andamentos (etapa_id, setor_id)
    select etapa.id, s.id from public.setores s
    where not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.setor_id = s.id);
  else
    insert into public.andamentos (etapa_id, processo_id)
    select etapa.id, p.id from public.processos_com_andamento p
    where p.situacao in ('em_andamento', 'suspenso')
      and not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.processo_id = p.id);
  end if;
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

create function private.apagar_andamentos_pendentes(etapa uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  delete from public.andamentos where etapa_id = etapa and status = 'pendente';
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

-- Sem security definer: roda com a permissão de quem muda o catálogo (a RLS de etapas e de andamentos decide).
create function private.sincronizar_andamentos_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.ativa then
    perform private.incluir_andamentos_pendentes(new);
  elsif tg_op = 'UPDATE' and new.ativa and not old.ativa then
    perform private.incluir_andamentos_pendentes(new);
  elsif tg_op = 'UPDATE' and old.ativa and not new.ativa then
    perform private.apagar_andamentos_pendentes(new.id);
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger sincronizar_andamentos_da_etapa after insert or update of ativa on public.etapas
  for each row execute function private.sincronizar_andamentos_da_etapa();

-- Etapa usada (algum andamento fora de pendente) não se exclui; a nunca usada leva os pendentes junto.
create function private.conferir_etapa_nunca_usada() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.andamentos where etapa_id = old.id and status <> 'pendente') then
    raise exception 'etapa_usada:%', old.nome;
  end if;
  perform private.apagar_andamentos_pendentes(old.id);
  return old;
end $$;

create trigger conferir_etapa_nunca_usada before delete on public.etapas
  for each row execute function private.conferir_etapa_nunca_usada();

-- Conferido depois de cada comando: abrir espaço e trocar duas etapas passam por estados válidos a cada comando.
create function private.conferir_ordem_dos_niveis() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.etapas s join public.etapas p on p.nivel = 'processo'
    where s.nivel = 'setor' and s.ordem > p.ordem) then
    raise exception 'etapas_do_setor_primeiro';
  end if;
  return null;
end $$;

create trigger conferir_ordem_dos_niveis after insert or update of ordem on public.etapas
  for each statement execute function private.conferir_ordem_dos_niveis();

-- As funções abaixo ligam 'ep.etapa_movida' com o id da etapa cuja mudança de ordem vira evento (a vizinha trocada
-- e o espaço aberto pela etapa nova não viram); vazio, toda mudança de ordem vira evento.
create function private.registra_mudanca_de_ordem(etapa uuid) returns boolean
language sql stable set search_path = ''
as $$ select coalesce(nullif(current_setting('ep.etapa_movida', true), ''), etapa::text) = etapa::text $$;

-- Etapa nova antes de outra (ou no fim, com p_antes_de nulo), abrindo espaço na ordem. Sem security definer: a RLS
-- de etapas deixa só o administrador ativo incluir.
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_nivel public.nivel_da_etapa,
  p_obrigatoria boolean, p_antes_de uuid) returns uuid
language plpgsql set search_path = ''
as $$
declare
  posicao integer := (select ordem from public.etapas where id = p_antes_de);
  nova uuid;
begin
  if p_antes_de is not null and posicao is null then
    raise exception 'registro_inexistente';
  end if;
  posicao := coalesce(posicao, (select coalesce(max(ordem), 0) + 1 from public.etapas));
  perform set_config('ep.etapa_movida', 'nenhuma', true);
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
  values (p_codigo, btrim(p_nome), posicao, p_nivel, p_obrigatoria) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

-- A vizinha de cima ('subir') ou de baixo ('descer'), ou nada na ponta.
create function private.vizinha_da_etapa(movida public.etapas, sentido text) returns public.etapas
language sql stable set search_path = ''
as $$
  select * from public.etapas
  where (sentido = 'subir' and ordem < movida.ordem) or (sentido = 'descer' and ordem > movida.ordem)
  order by case when sentido = 'subir' then -ordem else ordem end limit 1 $$;

-- Troca a etapa com a vizinha num comando só; na ponta, nada muda.
create function public.mover_etapa(p_etapa uuid, p_sentido text) returns void
language plpgsql set search_path = ''
as $$
declare
  movida public.etapas;
  vizinha public.etapas;
  trocadas integer;
begin
  if p_sentido is null or p_sentido not in ('subir', 'descer') then
    raise exception 'sentido_invalido:%', p_sentido;
  end if;
  select * into movida from public.etapas where id = p_etapa;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  vizinha := private.vizinha_da_etapa(movida, p_sentido);
  if vizinha.id is null then
    return;
  end if;
  perform set_config('ep.etapa_movida', movida.id::text, true);
  update public.etapas set ordem = case when id = movida.id then vizinha.ordem else movida.ordem end
  where id in (movida.id, vizinha.id);
  get diagnostics trocadas = row_count;
  perform set_config('ep.etapa_movida', '', true);
  if trocadas = 0 then
    raise exception 'sem permissão para mudar o catálogo' using errcode = '42501';
  end if;
end $$;

-- Evento da etapa com os campos legíveis; a gravação sem mudança não vira evento.
create function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome, 'nivel', etapa.nivel,
  'obrigatoria', etapa.obrigatoria, 'ativa', etapa.ativa, 'ordem', etapa.ordem) $$;

create function private.acao_da_etapa(antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when antes is null then 'acrescentar'
  when depois is null then 'excluir'
  when antes -> 'ativa' <> depois -> 'ativa' then
    case when (depois ->> 'ativa')::boolean then 'reativar' else 'desativar' end
  when antes - 'ordem' = depois - 'ordem' then 'mudar_ordem'
  else 'editar' end $$;

-- security definer como os outros gatilhos de evento: ninguém inclui eventos pela API.
create function private.registrar_evento_da_etapa() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'INSERT' then null else private.estado_da_etapa(old) end;
  depois jsonb := case when tg_op = 'DELETE' then null else private.estado_da_etapa(new) end;
  acao text := private.acao_da_etapa(antes, depois);
  referencia uuid := case when tg_op = 'DELETE' then old.id else new.id end;
begin
  if antes = depois or (acao = 'mudar_ordem' and not private.registra_mudanca_de_ordem(referencia)) then
    return null; -- sem mudança, ou só a ordem de uma etapa que não foi a movida
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), acao, 'etapa', referencia::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_etapa after insert or update or delete on public.etapas
  for each row execute function private.registrar_evento_da_etapa();

-- Todo perfil ativo lê os eventos do catálogo (os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê o catálogo" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'etapa');

revoke execute on function private.sincronizando_catalogo(), private.incluir_andamentos_pendentes(public.etapas),
  private.apagar_andamentos_pendentes(uuid), private.registra_mudanca_de_ordem(uuid),
  private.vizinha_da_etapa(public.etapas, text),
  public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid), public.mover_etapa(uuid, text)
  from public, anon;
grant execute on function private.sincronizando_catalogo(), private.incluir_andamentos_pendentes(public.etapas),
  private.apagar_andamentos_pendentes(uuid), private.registra_mudanca_de_ordem(uuid),
  private.vizinha_da_etapa(public.etapas, text),
  public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid), public.mover_etapa(uuid, text)
  to authenticated;
revoke execute on function private.sincronizar_andamentos_da_etapa(), private.conferir_etapa_nunca_usada(),
  private.conferir_ordem_dos_niveis(), private.estado_da_etapa(public.etapas), private.acao_da_etapa(jsonb, jsonb),
  private.registrar_evento_da_etapa()
  from public, anon, authenticated;
