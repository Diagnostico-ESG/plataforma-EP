-- Trava do autor na Revisão interna e voltar com responsável (processos-etapas, ticket 14, ADR 0014). Não destrutiva:
-- nenhuma tabela ou coluna muda. As recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts).

-- Ninguém revisa o próprio trabalho: quem enviou a versão mais recente não histórica não pode passar a ser o
-- responsável da Revisão interna. Só confere quando o responsável passa a ser alguém e muda, para o revisor que
-- continua e envia uma versão nova não perder a etapa e para deixar vazio ser sempre aceito.
create function private.conferir_autor_da_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
declare
  ultima record;
begin
  if new.responsavel_id is null or new.responsavel_id is not distinct from old.responsavel_id then
    return new;
  end if;
  if (select codigo from public.etapas where id = new.etapa_id) <> 'revisao_interna' then
    return new;
  end if;
  select v.numero, v.enviada_por, u.nome into ultima
  from public.versoes v join public.usuarios u on u.id = v.enviada_por
  where v.processo_id = new.processo_id and not v.historica
  order by v.numero desc limit 1;
  if found and ultima.enviada_por = new.responsavel_id then
    raise exception 'autor_da_versao:%:%', ultima.numero, ultima.nome;
  end if;
  return new;
end $$;

create trigger conferir_autor_da_revisao_interna before update of responsavel_id on public.andamentos
  for each row execute function private.conferir_autor_da_revisao_interna();

-- Voltar leva o responsável da etapa reaberta (null: ninguém). O gatilho de andamento não confere o responsável na
-- volta (private.voltando()), então a conferência de ativo e perfil é feita aqui; a trava do autor é o gatilho acima.
drop function public.voltar_a_etapa(uuid, text);
drop function private.reabrir_etapa(public.andamentos);

-- A escolhida volta a em andamento: mantém o início (ou recebe hoje, se não tinha), perde a conclusão e a nota e
-- recebe o responsável. Zero linhas é a RLS recusando o perfil: 42501, como o resto da API.
create function private.reabrir_etapa(escolhido public.andamentos, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_responsavel(p_responsavel, escolhido.responsavel_id);
  update public.andamentos
  set status = 'em_andamento', nota = null, resolvida_em = null, iniciada_em = coalesce(iniciada_em, current_date),
    responsavel_id = p_responsavel
  where id = escolhido.id;
  if not found then
    raise exception 'sem permissão para voltar a etapa' using errcode = '42501';
  end if;
end $$;

-- Voltar a uma etapa resolvida, com motivo e o responsável da etapa reaberta. Sem security definer: roda com a
-- permissão de quem chama e a RLS decide.
create function public.voltar_a_etapa(p_andamento uuid, p_motivo text, p_responsavel uuid) returns void
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
  perform private.reabrir_etapa(escolhido, p_responsavel);
  perform set_config('ep.voltando', 'off', true), set_config('ep.motivo_da_volta', '', true);
end $$;

revoke execute on function private.conferir_autor_da_revisao_interna(), private.reabrir_etapa(public.andamentos, uuid),
  public.voltar_a_etapa(uuid, text, uuid) from public, anon;
grant execute on function private.conferir_autor_da_revisao_interna(), private.reabrir_etapa(public.andamentos, uuid),
  public.voltar_a_etapa(uuid, text, uuid) to authenticated;
