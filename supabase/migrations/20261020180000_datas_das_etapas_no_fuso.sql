-- As datas de início e fim das etapas passam a ser as de Brasília (bug do backlog, 2026-10-20). Não destrutiva: só
-- recria três funções. `current_date` é o dia do relógio do banco (UTC, 3 h à frente): depois das 21h em Brasília a
-- etapa iniciada ou concluída gravava o dia seguinte, e a correção manual para "hoje" era recusada como futura.
-- A função private.hoje() veio na migração 20261020143000_datas_no_fuso_do_escritorio.

-- Igual à da migração 20261014201236_situacao_do_processo, trocando só o "hoje" das datas automáticas.
create or replace function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  perform private.conferir_processo_em_andamento(new.processo_id);
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
      new.iniciada_em := private.hoje();
    else
      new.resolvida_em := private.hoje();
    end if;
  end if;
  perform private.conferir_datas(new);
  return new;
end $$;

-- Igual à da migração 20261014143045_voltar_datas_responsavel, trocando só o "hoje" do limite.
create or replace function private.conferir_datas(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.iniciada_em > private.hoje() then
    raise exception 'data_no_futuro:%', andamento.iniciada_em;
  end if;
  if andamento.resolvida_em > private.hoje() then
    raise exception 'data_no_futuro:%', andamento.resolvida_em;
  end if;
  if andamento.resolvida_em < andamento.iniciada_em then
    raise exception 'resolvida_antes_do_inicio:%:%', andamento.resolvida_em, andamento.iniciada_em;
  end if;
end $$;

-- Igual à da migração 20261019020700_trava_do_autor_e_voltar_com_responsavel, trocando só o "hoje" do início.
create or replace function private.reabrir_etapa(escolhido public.andamentos, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_responsavel(p_responsavel, escolhido.responsavel_id);
  update public.andamentos
  set status = 'em_andamento', nota = null, resolvida_em = null, iniciada_em = coalesce(iniciada_em, private.hoje()),
    responsavel_id = p_responsavel
  where id = escolhido.id;
  if not found then
    raise exception 'sem permissão para voltar a etapa' using errcode = '42501';
  end if;
end $$;
