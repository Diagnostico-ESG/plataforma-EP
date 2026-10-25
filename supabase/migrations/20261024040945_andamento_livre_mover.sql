-- Andamento livre, parte 3 de 3 (processos-etapas, ticket 24; ADRs 0022 e 0024): o cadastro abre a primeira passagem, em
-- Não iniciados, e mover_processo leva o processo a qualquer etapa ativa. Não destrutiva. As recusas chegam à interface
-- como "motivo:valor" em P0001.

-- Processo novo entra em Não iniciados, com A fazer e sem responsável (ninguém inclui passagens pela API).
create function private.abrir_primeira_passagem() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform set_config('ep.movendo_processo', 'cadastro', true);
  insert into public.passagens (processo_id, etapa_id)
  values (new.id, (select id from public.etapas where codigo = 'nao_iniciados'));
  perform set_config('ep.movendo_processo', '', true);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger abrir_primeira_passagem after insert on public.processos
  for each row execute function private.abrir_primeira_passagem();

-- A etapa de destino, ativa; inativa ou inexistente é recusada.
create function private.etapa_de_destino(p_etapa uuid) returns public.etapas
language plpgsql stable set search_path = ''
as $$
declare
  destino public.etapas;
begin
  select * into destino from public.etapas where id = p_etapa;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not destino.ativa then
    raise exception 'etapa_inativa:%', destino.nome;
  end if;
  return destino;
end $$;

-- A chegada a Concluídos (ADR 0024): com a data já registrada, nada se pede; senão, a data (com o link) ou a explicação.
-- Devolve as colunas da publicação como ficam depois da chegada.
create function private.publicacao_da_chegada(processo public.processos, p_data date, p_link text, p_explicacao text)
  returns public.processos
language plpgsql stable set search_path = ''
as $$
declare
  explicacao text := btrim(p_explicacao);
begin
  if processo.publicado_em is not null then
    return processo;
  end if;
  if p_data is not null then
    perform private.conferir_data_da_publicacao(processo.id, p_data);
    perform private.conferir_link_da_aprovacao(nullif(btrim(p_link), ''));
    processo.publicado_em := p_data;
    processo.link_da_publicacao := nullif(btrim(p_link), '');
    return processo;
  end if;
  if p_explicacao is null then
    raise exception 'publicacao_ou_explicacao_obrigatoria';
  end if;
  if explicacao = '' then
    raise exception 'explicacao_obrigatoria';
  end if;
  if char_length(explicacao) > 2000 then
    raise exception 'explicacao_longa:%', char_length(explicacao);
  end if;
  processo.explicacao_sem_publicacao := explicacao;
  return processo;
end $$;

-- A etapa e o responsável como o evento do movimento os guarda.
create function private.lado_do_movimento(etapa public.etapas, responsavel uuid) returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object('etapa_codigo', etapa.codigo, 'etapa_nome', etapa.nome, 'responsavel_id', responsavel,
    'responsavel_nome', (select nome from public.usuarios where id = responsavel)) $$;

-- O antes e o depois do movimento, com o que muda na publicação (a explicação que sai, a data e o link que chegam).
create function private.evento_do_movimento(antes public.processos, depois public.processos, de public.etapas,
  para public.etapas) returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'antes', jsonb_build_object('processo_nome', antes.nome) || private.lado_do_movimento(de, antes.responsavel_id)
      || jsonb_strip_nulls(jsonb_build_object('explicacao_sem_publicacao',
        case when depois.explicacao_sem_publicacao is null then antes.explicacao_sem_publicacao end)),
    'depois', jsonb_build_object('processo_nome', depois.nome) || private.lado_do_movimento(para, depois.responsavel_id)
      || jsonb_strip_nulls(jsonb_build_object(
        'publicado_em', case when antes.publicado_em is null then depois.publicado_em end,
        'link_da_publicacao', case when antes.publicado_em is null then depois.link_da_publicacao end,
        'explicacao_sem_publicacao', case when antes.explicacao_sem_publicacao is null then depois.explicacao_sem_publicacao end))) $$;

-- Grava no processo o responsável e a publicação. Zero linhas é a RLS recusando: 42501.
create function private.gravar_processo_movido(depois public.processos) returns void
language plpgsql set search_path = ''
as $$
begin
  update public.processos set responsavel_id = depois.responsavel_id, publicado_em = depois.publicado_em,
    link_da_publicacao = depois.link_da_publicacao, explicacao_sem_publicacao = depois.explicacao_sem_publicacao
  where id = depois.id;
  if not found then
    raise exception 'sem permissão para mover o processo' using errcode = '42501';
  end if;
end $$;

-- Fecha a passagem aberta e abre outra no destino, com A fazer (em Concluídos, Concluído). Os gatilhos de passagens
-- preenchem as datas e quem moveu e gravam o evento que fica em ep.evento_do_movimento.
create function private.trocar_passagem(processo uuid, para public.etapas, evento jsonb) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.evento_do_movimento', evento::text, true);
  update public.passagens set saiu_em = clock_timestamp() where processo_id = processo and saiu_em is null;
  insert into public.passagens (processo_id, etapa_id, etiqueta)
  values (processo, para.id, case when para.codigo = 'concluidos' then 'concluido' else 'a_fazer' end::public.etiqueta_da_etapa);
  perform set_config('ep.evento_do_movimento', '', true);
end $$;

-- Leva o processo a qualquer etapa ativa, para a frente ou para trás, sem motivo. Quem move vira o responsável. Para
-- Concluídos, a data da publicação (com o link) ou a explicação; ao sair de lá, a explicação se apaga. Sem security
-- definer: roda com a permissão de quem chama, e a RLS decide.
create function public.mover_processo(p_processo uuid, p_etapa uuid, p_data_da_publicacao date default null,
  p_link_da_publicacao text default null, p_explicacao_sem_publicacao text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  antes public.processos;
  depois public.processos;
  de public.etapas;
  para public.etapas;
begin
  select * into antes from public.processos where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para mover o processo' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(p_processo);
  para := private.etapa_de_destino(p_etapa);
  select e.* into de from public.passagens pa join public.etapas e on e.id = pa.etapa_id
  where pa.processo_id = p_processo and pa.saiu_em is null;
  if de.id = para.id then
    return;
  end if;
  depois := antes;
  depois.responsavel_id := (select auth.uid());
  if para.codigo = 'concluidos' then
    depois := private.publicacao_da_chegada(depois, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao);
  elsif de.codigo = 'concluidos' then
    depois.explicacao_sem_publicacao := null;
  end if;
  perform set_config('ep.movendo_processo', 'mover', true);
  perform private.trocar_passagem(p_processo, para, private.evento_do_movimento(antes, depois, de, para));
  perform private.gravar_processo_movido(depois);
  perform set_config('ep.movendo_processo', '', true);
end $$;

revoke execute on function private.etapa_de_destino(uuid),
  private.publicacao_da_chegada(public.processos, date, text, text), private.lado_do_movimento(public.etapas, uuid),
  private.evento_do_movimento(public.processos, public.processos, public.etapas, public.etapas),
  private.gravar_processo_movido(public.processos), private.trocar_passagem(uuid, public.etapas, jsonb),
  public.mover_processo(uuid, uuid, date, text, text)
  from public, anon;
grant execute on function private.etapa_de_destino(uuid),
  private.publicacao_da_chegada(public.processos, date, text, text), private.lado_do_movimento(public.etapas, uuid),
  private.evento_do_movimento(public.processos, public.processos, public.etapas, public.etapas),
  private.gravar_processo_movido(public.processos), private.trocar_passagem(uuid, public.etapas, jsonb),
  public.mover_processo(uuid, uuid, date, text, text)
  to authenticated;
revoke execute on function private.abrir_primeira_passagem() from public, anon, authenticated;
