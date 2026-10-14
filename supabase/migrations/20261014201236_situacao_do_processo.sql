-- Situação do processo (processos-etapas, ticket 07): suspender, cancelar e retomar com motivo, e o congelamento dos
-- andamentos enquanto o processo está parado. Recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts).

-- A situação e o motivo passam a ter privilégio de coluna, mas só mudam pelas funções abaixo: o gatilho recusa o resto.
grant update (situacao, motivo_da_situacao) on public.processos to authenticated;

-- As funções ligam este ajuste (vale só na transação) para o gatilho aceitar a mudança de situação e deixam o motivo
-- para o evento. Quem chama a API não consegue ajustá-lo: só uma função do banco o liga, e ela o desliga no fim.
create function private.mudando_situacao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.mudando_situacao', true), '') = 'on' $$;

-- As transições da spec (Regras de estado); outra recusa com os dois valores, para a frase dizer de onde para onde.
create function private.conferir_transicao_da_situacao(de public.situacao_guardada, para public.situacao_guardada)
returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if de::text || '>' || para::text not in ('em_andamento>suspenso', 'em_andamento>cancelado', 'suspenso>em_andamento',
    'suspenso>cancelado', 'cancelado>em_andamento') then
    raise exception 'situacao_invalida:%:%', de, para;
  end if;
end $$;

create function private.conferir_situacao_do_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if private.mudando_situacao() then
    perform private.conferir_transicao_da_situacao(old.situacao, new.situacao);
  elsif (new.situacao, new.motivo_da_situacao) is distinct from (old.situacao, old.motivo_da_situacao) then
    raise exception 'situacao_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_situacao_do_processo before update on public.processos
  for each row execute function private.conferir_situacao_do_processo();

-- Muda a situação com motivo. Sem security definer: roda com a permissão de quem chama e a RLS decide. Zero linhas é
-- a RLS recusando o perfil (42501) ou o processo que não existe (mais).
create function private.mudar_situacao(p_processo uuid, nova public.situacao_guardada, p_motivo text) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  linhas integer;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  perform set_config('ep.mudando_situacao', 'on', true), set_config('ep.motivo_da_situacao', motivo, true);
  update public.processos
  set situacao = nova, motivo_da_situacao = case when nova = 'em_andamento' then null else motivo end
  where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.mudando_situacao', 'off', true), set_config('ep.motivo_da_situacao', '', true);
  if linhas = 0 and not exists (select 1 from public.processos where id = p_processo) then
    raise exception 'registro_inexistente';
  end if;
  if linhas = 0 then
    raise exception 'sem permissão para mudar a situação do processo' using errcode = '42501';
  end if;
end $$;

create function public.suspender_processo(p_processo uuid, p_motivo text) returns void
language sql set search_path = ''
as $$ select private.mudar_situacao(p_processo, 'suspenso', p_motivo) $$;

create function public.cancelar_processo(p_processo uuid, p_motivo text) returns void
language sql set search_path = ''
as $$ select private.mudar_situacao(p_processo, 'cancelado', p_motivo) $$;

create function public.retomar_processo(p_processo uuid, p_motivo text) returns void
language sql set search_path = ''
as $$ select private.mudar_situacao(p_processo, 'em_andamento', p_motivo) $$;

-- Processo suspenso ou cancelado congela os andamentos: nenhuma etapa dele muda (iniciar, concluir, dispensar, voltar,
-- datas, responsável). Sem o processo (etapa do setor), não há o que conferir.
create function private.conferir_processo_em_andamento(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  situacao_do_processo public.situacao_guardada;
begin
  if processo is null then
    return;
  end if;
  select situacao into situacao_do_processo from public.processos where id = processo;
  if situacao_do_processo <> 'em_andamento' then
    raise exception 'processo_parado:%', situacao_do_processo;
  end if;
end $$;

-- Igual ao do ticket 06, com a conferência do processo parado antes de qualquer outra (inclusive na volta).
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
      new.iniciada_em := current_date;
    else
      new.resolvida_em := current_date;
    end if;
  end if;
  perform private.conferir_datas(new);
  return new;
end $$;

-- Ação do evento do processo: mudou a situação, suspender, cancelar ou retomar; o resto segue a do cadastro.
create function private.acao_do_processo(operacao text, antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when operacao = 'UPDATE' and antes ->> 'situacao' is distinct from depois ->> 'situacao' then
    case depois ->> 'situacao' when 'suspenso' then 'suspender' when 'cancelado' then 'cancelar' else 'retomar' end
  else private.acao_do_cadastro(operacao, antes, depois) end $$;

-- Igual ao do ticket 04, com a ação nova e o motivo que a função de situação deixou no ajuste.
create or replace function private.registrar_evento_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'UPDATE' then private.estado_do_processo(old) end;
  depois jsonb := private.estado_do_processo(new);
  motivo text := case when private.mudando_situacao() then nullif(current_setting('ep.motivo_da_situacao', true), '') end;
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_processo(tg_op, antes, depois), 'processo', new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois)
      || case when motivo is not null then jsonb_build_object('motivo', motivo) else '{}'::jsonb end);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.mudando_situacao(), private.conferir_situacao_do_processo(),
  private.conferir_transicao_da_situacao(public.situacao_guardada, public.situacao_guardada),
  private.mudar_situacao(uuid, public.situacao_guardada, text), private.conferir_processo_em_andamento(uuid),
  public.suspender_processo(uuid, text), public.cancelar_processo(uuid, text), public.retomar_processo(uuid, text)
  from public, anon;
grant execute on function private.mudando_situacao(),
  private.conferir_transicao_da_situacao(public.situacao_guardada, public.situacao_guardada),
  private.mudar_situacao(uuid, public.situacao_guardada, text), private.conferir_processo_em_andamento(uuid),
  public.suspender_processo(uuid, text), public.cancelar_processo(uuid, text), public.retomar_processo(uuid, text)
  to authenticated;
revoke execute on function private.acao_do_processo(text, jsonb, jsonb) from public, anon, authenticated;
