-- Andamento das etapas do processo (processos-etapas, ticket 05): o banco impõe a sequência das etapas do processo,
-- o setor resolvido antes da primeira etapa e uma só etapa em andamento; o andamento do processo gera evento.

-- O andamento do processo volta a poder ser alterado por quem mantém os cadastros (o ticket 04 o travava).
drop policy "andamentos: administrador e integrante ativos alteram" on public.andamentos;
create policy "andamentos: administrador e integrante ativos alteram" on public.andamentos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- No máximo uma etapa em andamento por processo, com a frase pronta (o índice único fica de reserva).
create function private.conferir_uma_em_andamento(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  em_andamento text;
begin
  select e.nome into em_andamento
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id and a.status = 'em_andamento' and a.id <> andamento.id;
  if found then
    raise exception 'ja_ha_etapa_em_andamento:%', em_andamento;
  end if;
end $$;

-- A primeira etapa do processo pede as etapas do setor resolvidas (concluídas, dispensadas ou realizadas antes).
create function private.conferir_setor_resolvido(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  sigla_do_setor text;
begin
  select s.sigla into sigla_do_setor
  from public.processos p join public.setores s on s.id = p.setor_id
  where p.id = processo and exists (
    select 1 from public.andamentos a where a.setor_id = p.setor_id and a.status in ('pendente', 'em_andamento'));
  if found then
    raise exception 'setor_nao_resolveu:%', sigla_do_setor;
  end if;
end $$;

-- Sair de pendente pede a anterior do processo resolvida; sem anterior, é a primeira etapa e vale o setor.
create function private.conferir_sequencia_do_processo(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if not found then
    perform private.conferir_setor_resolvido(andamento.processo_id);
  elsif anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

-- A sequência de quem sai de pendente: a do setor (ticket 02) ou a do processo. Iniciar confere antes se já há outra
-- em andamento, que é o aviso mais útil quando a anterior é justamente a que está em andamento.
create function private.conferir_sequencia(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.processo_id is null then
    perform private.conferir_anterior_resolvida(andamento);
    return;
  end if;
  if andamento.status = 'em_andamento' then
    perform private.conferir_uma_em_andamento(andamento);
  end if;
  perform private.conferir_sequencia_do_processo(andamento);
end $$;

-- Igual ao do ticket 02, chamando a sequência que serve ao setor ou ao processo.
create or replace function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  if new.status = old.status then
    return new;
  end if;
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
  return new;
end $$;

-- Os campos legíveis do evento: do setor (id e sigla) ou do processo (id, nome e sigla do setor), mais a etapa.
create function private.base_do_evento_do_andamento(andamento public.andamentos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when andamento.processo_id is null then
    (select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla, 'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
      from public.setores s, public.etapas e where s.id = andamento.setor_id and e.id = andamento.etapa_id)
  else
    (select jsonb_build_object('processo_id', p.id, 'processo_nome', p.nome, 'setor_sigla', s.sigla,
        'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
      from public.processos p join public.setores s on s.id = p.setor_id, public.etapas e
      where p.id = andamento.processo_id and e.id = andamento.etapa_id)
  end $$;

-- Igual ao do ticket 02, com a base acima; a referência 'dono:andamento' deixa o histórico filtrar pelo setor ou pelo processo.
create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  antes jsonb;
  depois jsonb;
begin
  antes := base || jsonb_build_object('status', old.status, 'iniciada_em', old.iniciada_em, 'resolvida_em', old.resolvida_em);
  depois := base || jsonb_build_object('status', new.status, 'iniciada_em', new.iniciada_em, 'resolvida_em', new.resolvida_em);
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old.status, new.status), 'andamento',
    coalesce(new.setor_id, new.processo_id)::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', new.nota));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- As conferências rodam com a permissão de quem altera; as funções de evento só o gatilho chama.
revoke execute on function private.conferir_uma_em_andamento(public.andamentos), private.conferir_setor_resolvido(uuid),
  private.conferir_sequencia_do_processo(public.andamentos), private.conferir_sequencia(public.andamentos)
  from public, anon;
grant execute on function private.conferir_uma_em_andamento(public.andamentos), private.conferir_setor_resolvido(uuid),
  private.conferir_sequencia_do_processo(public.andamentos), private.conferir_sequencia(public.andamentos)
  to authenticated;
revoke execute on function private.base_do_evento_do_andamento(public.andamentos) from public, anon, authenticated;
