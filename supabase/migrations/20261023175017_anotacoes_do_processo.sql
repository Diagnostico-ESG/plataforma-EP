-- Anotações do processo (processos-etapas, ticket 23; ADR 0021). Não destrutiva. Um texto livre por processo, sem
-- histórico: fica fora da view processos_com_andamento, do pacote das planilhas e do estado guardado nos eventos
-- (private.estado_do_processo e as duas leituras listam as colunas uma a uma). A função grava só se o texto no banco
-- ainda é o que a pessoa tinha ao começar a escrever; quem e quando vêm do gatilho, nunca do cliente.

alter table public.processos
  add column anotacoes text,
  add column anotacoes_alteradas_em timestamptz,
  add column anotacoes_alteradas_por uuid references public.usuarios (id),
  add constraint processos_anotacoes_limite check (char_length(anotacoes) <= 2000);

-- Só o texto é gravável pela API (o privilégio de coluna deixa tentar; a RLS de processos decide o perfil). As duas
-- colunas da última alteração não recebem privilégio: o gatilho as preenche.
grant update (anotacoes) on public.processos to authenticated;

-- Preenche quem e quando quando o texto muda e recusa mudar as duas colunas sem mudar o texto. clock_timestamp e não
-- now(): a hora precisa mudar de verdade mesmo dentro de uma transação.
create function private.registrar_ultima_alteracao_das_anotacoes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.anotacoes is not distinct from old.anotacoes then
    if (new.anotacoes_alteradas_em, new.anotacoes_alteradas_por)
      is distinct from (old.anotacoes_alteradas_em, old.anotacoes_alteradas_por) then
      raise exception 'anotacoes_alteradas_so_pelo_banco';
    end if;
    return new;
  end if;
  new.anotacoes_alteradas_em := clock_timestamp();
  new.anotacoes_alteradas_por := (select auth.uid());
  return new;
end $$;

create trigger registrar_ultima_alteracao_das_anotacoes before update on public.processos
  for each row execute function private.registrar_ultima_alteracao_das_anotacoes();

-- Grava as Anotações se o texto atual é o esperado (nulo é igual a nulo); senão, recusa com 'anotacoes_em_conflito' sem
-- mudar nada. Só espaços e quebras de linha viram nulo; o resto fica como foi digitado. Sem security definer: a RLS de
-- alteração de processos e a trava do arquivado decidem; o perfil é conferido antes para a recusa ser a de perfil.
create function public.gravar_anotacoes_do_processo(p_processo uuid, p_esperado text, p_novo text)
returns table (texto text, alterado_em timestamptz, alterado_por_nome text)
language plpgsql set search_path = ''
as $$
declare
  novo text := case when btrim(p_novo, E' \t\r\n') = '' then null else p_novo end;
  linhas integer;
begin
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para gravar as anotações' using errcode = '42501';
  end if;
  if char_length(novo) > 2000 then
    raise exception 'anotacoes_longas:%', char_length(novo);
  end if;
  update public.processos p set anotacoes = novo
  where p.id = p_processo and p.anotacoes is not distinct from p_esperado;
  get diagnostics linhas = row_count;
  if linhas = 0 then
    if exists (select 1 from public.processos p where p.id = p_processo) then
      raise exception 'anotacoes_em_conflito';
    end if;
    raise exception 'registro_inexistente';
  end if;
  return query
    select p.anotacoes, p.anotacoes_alteradas_em, u.nome
    from public.processos p left join public.usuarios u on u.id = p.anotacoes_alteradas_por
    where p.id = p_processo;
end $$;

revoke execute on function private.registrar_ultima_alteracao_das_anotacoes(), public.gravar_anotacoes_do_processo(uuid, text, text)
  from public, anon;
grant execute on function private.registrar_ultima_alteracao_das_anotacoes(), public.gravar_anotacoes_do_processo(uuid, text, text)
  to authenticated;
