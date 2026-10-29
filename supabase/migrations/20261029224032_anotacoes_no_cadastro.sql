-- Anotações no cadastro (enxugar-cartao-e-cadastro, ticket 04). Não destrutiva: o limite sobe e o cadastro passa a poder gravar o texto.

-- Limite de 2.000 para 8.000 caracteres (a soma dos limites dos textos antigos, para a junção do ticket 05 nunca cortar nada).
alter table public.processos
  drop constraint processos_anotacoes_limite,
  add constraint processos_anotacoes_limite check (char_length(anotacoes) <= 8000);

-- O cadastro grava o texto; quem e quando continuam sem privilégio, preenchidos pelo gatilho.
grant insert (anotacoes) on public.processos to authenticated;

-- Ao inserir, com texto, o gatilho preenche quem e quando como faz ao alterar. Sem texto, nada a registrar.
create or replace function private.registrar_ultima_alteracao_das_anotacoes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.anotacoes is not null then
      new.anotacoes_alteradas_em := clock_timestamp();
      new.anotacoes_alteradas_por := (select auth.uid());
    end if;
    return new;
  end if;
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

drop trigger registrar_ultima_alteracao_das_anotacoes on public.processos;
create trigger registrar_ultima_alteracao_das_anotacoes before insert or update on public.processos
  for each row execute function private.registrar_ultima_alteracao_das_anotacoes();

-- A função de gravar passa a recusar acima de 8.000 (mesmo corpo da migração das Anotações, só o limite muda).
create or replace function public.gravar_anotacoes_do_processo(p_processo uuid, p_esperado text, p_novo text)
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
  if char_length(novo) > 8000 then
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
