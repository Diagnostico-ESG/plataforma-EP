-- Voltar a uma etapa, corrigir datas e mudar o responsável da etapa (processos-etapas, ticket 06).
-- Recusas chegam à interface como "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts).

-- Datas e responsável passam a poder ser corrigidos por quem mantém os cadastros (a RLS de andamentos já decide quem).
grant update (responsavel_id, iniciada_em, resolvida_em) on public.andamentos to authenticated;

-- Reserva do banco: a frase com os valores sai do gatilho abaixo, antes desta restrição.
alter table public.andamentos add constraint andamentos_resolvida_depois_do_inicio
  check (resolvida_em is null or iniciada_em is null or resolvida_em >= iniciada_em);

-- A função de voltar liga este ajuste (vale só na transação) para o gatilho aceitar sair de uma etapa resolvida.
-- Quem chama a API não consegue ajustá-lo: só uma função do banco o liga, e ela o desliga no fim.
create function private.voltando() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.voltando', true), '') = 'on' $$;

-- Datas: nunca no futuro; a conclusão nunca antes do início. O valor vai na frase da recusa.
create function private.conferir_datas(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.iniciada_em > current_date then
    raise exception 'data_no_futuro:%', andamento.iniciada_em;
  end if;
  if andamento.resolvida_em > current_date then
    raise exception 'data_no_futuro:%', andamento.resolvida_em;
  end if;
  if andamento.resolvida_em < andamento.iniciada_em then
    raise exception 'resolvida_antes_do_inicio:%:%', andamento.resolvida_em, andamento.iniciada_em;
  end if;
end $$;

-- Responsável: usuário ativo de perfil Administrador ou Integrante. Só confere quando o responsável muda (um
-- responsável desativado depois continua na etapa) e tirar o responsável é sempre aceito.
create function private.conferir_responsavel(novo uuid, antigo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  usuario record;
begin
  if novo is null or novo is not distinct from antigo then
    return;
  end if;
  select nome, ativo, perfil into usuario from public.usuarios where id = novo;
  if not found then
    raise exception 'responsavel_invalido:%', novo;
  end if;
  if not usuario.ativo or usuario.perfil not in ('administrador', 'integrante_ep') then
    raise exception 'responsavel_invalido:%', usuario.nome;
  end if;
end $$;

-- Igual ao do ticket 05, com as conferências de responsável e de datas em toda alteração. Na volta, a função decide
-- status e datas, e o gatilho não confere de novo.
create or replace function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  if private.voltando() then
    return new;
  end if;
  perform private.conferir_responsavel(new.responsavel_id, old.responsavel_id);
  if new.status <> old.status then
    perform private.conferir_transicao(old.status, new.status);
    if old.status = 'pendente' then
      perform private.conferir_sequencia(new);
    end if;
    perform private.conferir_dispensa(new);
    if new.status = 'em_andamento' then
      new.iniciada_em := current_date;
    else
      new.resolvida_em := current_date;
    end if;
  end if;
  perform private.conferir_datas(new);
  return new;
end $$;

-- Ação do evento: voltar; sem mudança de status, corrigir datas, mudar o responsável ou (só a nota) editar;
-- com mudança de status, a ação pelo status novo. Substitui a de dois status, que não via datas nem responsável.
drop function private.acao_do_andamento(public.status_da_etapa, public.status_da_etapa);
create function private.acao_do_andamento(antes public.andamentos, depois public.andamentos) returns text
language sql stable set search_path = ''
as $$ select case
  when private.voltando() then 'voltar'
  when antes.status = depois.status
    and (antes.iniciada_em, antes.resolvida_em) is distinct from (depois.iniciada_em, depois.resolvida_em) then 'corrigir_datas'
  when antes.status = depois.status and antes.responsavel_id is distinct from depois.responsavel_id then 'mudar_responsavel'
  when antes.status = depois.status then 'editar'
  when depois.status = 'em_andamento' then 'iniciar'
  when depois.status = 'concluida' then 'concluir'
  when depois.status = 'dispensada' then 'dispensar'
  when depois.status = 'realizada_anteriormente' then 'registrar_realizada'
  else 'editar' end $$;

-- O estado do andamento como o evento o guarda; o nome do responsável só entra quando há responsável (antes ou depois).
create function private.estado_do_andamento(andamento public.andamentos, tambem_o_responsavel boolean) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('status', andamento.status, 'iniciada_em', andamento.iniciada_em,
    'resolvida_em', andamento.resolvida_em)
    || case when tambem_o_responsavel then jsonb_build_object('responsavel_nome',
      (select nome from public.usuarios where id = andamento.responsavel_id)) else '{}'::jsonb end $$;

-- Igual ao do ticket 05, com o responsável e o motivo da volta (o texto que a função de voltar deixou no ajuste).
create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  com_responsavel boolean := old.responsavel_id is not null or new.responsavel_id is not null;
  antes jsonb := base || private.estado_do_andamento(old, com_responsavel);
  depois jsonb := base || private.estado_do_andamento(new, com_responsavel);
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') else new.nota end;
begin
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old, new), 'andamento',
    coalesce(new.setor_id, new.processo_id)::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', motivo));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Só se volta a uma etapa já resolvida.
create function private.conferir_etapa_resolvida(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  nome_da_etapa text := (select nome from public.etapas where id = andamento.etapa_id);
begin
  if andamento.status not in ('concluida', 'realizada_anteriormente', 'dispensada') then
    raise exception 'etapa_nao_resolvida:%', nome_da_etapa;
  end if;
end $$;

-- As etapas seguintes do mesmo setor ou processo, resolvidas ou em andamento, voltam a pendente e perdem datas e nota
-- (em andamento também: com a escolhida em andamento, haveria duas, e o índice único recusa).
create function private.devolver_etapas_seguintes(escolhido public.andamentos) returns void
language sql set search_path = ''
as $$
  update public.andamentos a set status = 'pendente', nota = null, iniciada_em = null, resolvida_em = null
  from public.etapas e, public.etapas da_escolhida
  where e.id = a.etapa_id and da_escolhida.id = escolhido.etapa_id
    and a.processo_id is not distinct from escolhido.processo_id
    and a.setor_id is not distinct from escolhido.setor_id
    and e.ordem > da_escolhida.ordem and a.status <> 'pendente' $$;

-- A escolhida volta a em andamento: mantém o início (ou recebe hoje, se não tinha) e perde a conclusão e a nota.
-- Zero linhas é a RLS recusando o perfil: 42501, como o resto da API.
create function private.reabrir_etapa(escolhido public.andamentos) returns void
language plpgsql set search_path = ''
as $$
begin
  update public.andamentos
  set status = 'em_andamento', nota = null, resolvida_em = null, iniciada_em = coalesce(iniciada_em, current_date)
  where id = escolhido.id;
  if not found then
    raise exception 'sem permissão para voltar a etapa' using errcode = '42501';
  end if;
end $$;

-- Voltar a uma etapa resolvida, com motivo. Sem security definer: roda com a permissão de quem chama e a RLS decide.
create function public.voltar_a_etapa(p_andamento uuid, p_motivo text) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  escolhido public.andamentos;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  select * into escolhido from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_etapa_resolvida(escolhido);
  perform set_config('ep.voltando', 'on', true), set_config('ep.motivo_da_volta', motivo, true);
  perform private.devolver_etapas_seguintes(escolhido);
  perform private.reabrir_etapa(escolhido);
  perform set_config('ep.voltando', 'off', true), set_config('ep.motivo_da_volta', '', true);
end $$;

revoke execute on function private.voltando(), private.conferir_datas(public.andamentos),
  private.conferir_responsavel(uuid, uuid), private.conferir_etapa_resolvida(public.andamentos),
  private.devolver_etapas_seguintes(public.andamentos), private.reabrir_etapa(public.andamentos),
  public.voltar_a_etapa(uuid, text) from public, anon;
grant execute on function private.voltando(), private.conferir_datas(public.andamentos),
  private.conferir_responsavel(uuid, uuid), private.conferir_etapa_resolvida(public.andamentos),
  private.devolver_etapas_seguintes(public.andamentos), private.reabrir_etapa(public.andamentos),
  public.voltar_a_etapa(uuid, text) to authenticated;
revoke execute on function private.acao_do_andamento(public.andamentos, public.andamentos),
  private.estado_do_andamento(public.andamentos, boolean) from public, anon, authenticated;
