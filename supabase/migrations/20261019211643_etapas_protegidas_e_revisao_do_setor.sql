-- Etapas protegidas e Revisão pelo setor com versão completa (revisoes-aprovacao, ticket 01; ADR 0015). Não destrutiva:
-- gatilhos e funções novos. As recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts). Sem security definer: a RLS de quem chama decide (todo perfil ativo lê versões).

-- A versão mais recente é a não histórica de maior número (a mesma da trava do autor, ADR 0014); null sem versão.
create function private.id_da_versao_mais_recente(p_processo uuid) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = p_processo and not historica order by numero desc limit 1 $$;

-- Os papéis que a versão completa exige e ela ainda não tem, na ordem em que a frase os lista.
create function private.papeis_que_faltam(p_versao uuid) returns text[]
language sql stable set search_path = ''
as $$
  select coalesce(array_agg(exigido.papel order by exigido.ordem), '{}')
  from (values ('bpmn', 1), ('png', 2), ('relatorio', 3)) as exigido (papel, ordem)
  where not exists (
    select 1 from public.arquivos_da_versao a where a.versao_id = p_versao and a.papel::text = exigido.papel) $$;

-- Recusa a conclusão sem versão ou com a versão mais recente incompleta, com o número e o que falta.
create function private.conferir_versao_completa(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  versao uuid := private.id_da_versao_mais_recente(p_processo);
  faltas text[];
begin
  if versao is null then
    raise exception 'sem_versao';
  end if;
  faltas := private.papeis_que_faltam(versao);
  if cardinality(faltas) > 0 then
    raise exception 'versao_incompleta:%:%', (select numero from public.versoes where id = versao), array_to_string(faltas, ',');
  end if;
end $$;

-- A conclusão de uma etapa (só quando o status passa a concluída). Aqui só a Revisão pelo setor tem conferência; os
-- tickets 02 e 03 acrescentam a Revisão interna e a Aprovação pelo setor.
create function private.conferir_conclusao_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status <> 'concluida' or old.status = 'concluida' then
    return new;
  end if;
  if (select codigo from public.etapas where id = new.etapa_id) = 'revisao_setor' then
    perform private.conferir_versao_completa(new.processo_id);
  end if;
  return new;
end $$;

create trigger conferir_conclusao_da_etapa before update of status on public.andamentos
  for each row execute function private.conferir_conclusao_da_etapa();

-- As três etapas de revisão e aprovação não saem do catálogo (renomear e mover continuam). O nome do gatilho vem antes
-- de conferir_etapa_nunca_usada na ordem alfabética, para a recusa ser a de etapa protegida mesmo com a etapa em uso.
create function private.bloquear_etapa_protegida() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.codigo not in ('revisao_interna', 'revisao_setor', 'aprovacao_setor') then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' or (old.ativa and not new.ativa) then
    raise exception 'etapa_protegida:%', old.nome;
  end if;
  return new;
end $$;

create trigger bloquear_etapa_protegida before delete or update of ativa on public.etapas
  for each row execute function private.bloquear_etapa_protegida();

revoke execute on function private.id_da_versao_mais_recente(uuid), private.papeis_que_faltam(uuid),
  private.conferir_versao_completa(uuid), private.conferir_conclusao_da_etapa(), private.bloquear_etapa_protegida()
  from public, anon;
grant execute on function private.id_da_versao_mais_recente(uuid), private.papeis_que_faltam(uuid),
  private.conferir_versao_completa(uuid), private.conferir_conclusao_da_etapa(), private.bloquear_etapa_protegida()
  to authenticated;
