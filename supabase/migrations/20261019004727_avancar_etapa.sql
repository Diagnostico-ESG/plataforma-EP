-- Avanço da etapa (processos-etapas, ticket 13, ADR 0014): resolver a etapa atual já inicia a próxima, com o
-- responsável escolhido, numa transação só. Não destrutiva. As recusas chegam à interface como "motivo:valor"
-- em P0001 (src/processos/andamentosSupabase.ts); as regras de sequência, dispensa, responsável, processo parado
-- e evento são as dos gatilhos de andamento, que esta função só aciona.

-- A ação do avanço vira o status que a etapa resolvida recebe; outra ação não tem status.
create function private.status_do_avanco(acao text) returns public.status_da_etapa
language sql immutable set search_path = ''
as $$ select case acao
  when 'concluir' then 'concluida'::public.status_da_etapa
  when 'dispensar' then 'dispensada'::public.status_da_etapa
  when 'realizada_anteriormente' then 'realizada_anteriormente'::public.status_da_etapa
end $$;

-- Dispensar e registrar como realizada anteriormente exigem nota (a restrição da tabela só a aceita nesses dois).
create function private.conferir_nota_do_avanco(novo public.status_da_etapa, p_nota text) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if novo <> 'concluida' and nullif(btrim(p_nota), '') is null then
    raise exception 'nota_obrigatoria';
  end if;
end $$;

-- Resolve a etapa. O gatilho de andamento confere sequência, dispensa, processo parado e data; a transição é
-- conferida aqui também, porque o gatilho deixaria passar resolver de novo uma etapa que já tem o mesmo status.
-- Zero linhas é a RLS recusando o perfil: 42501, como o resto da API.
create function private.resolver_etapa_do_avanco(escolhida public.andamentos, novo public.status_da_etapa, p_nota text)
  returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_transicao(escolhida.status, novo);
  update public.andamentos set status = novo, nota = case when novo = 'concluida' then null else p_nota end
  where id = escolhida.id;
  if not found then
    raise exception 'sem permissão para resolver a etapa' using errcode = '42501';
  end if;
end $$;

-- A primeira pendente do mesmo processo depois da resolvida, na ordem do catálogo, entra em andamento com o
-- responsável escolhido (nenhum, se for null). Sem pendente depois, nada acontece.
create function private.iniciar_proxima_do_avanco(resolvida public.andamentos, p_responsavel uuid) returns void
language sql set search_path = ''
as $$
  update public.andamentos set status = 'em_andamento', responsavel_id = p_responsavel
  where id = (
    select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = resolvida.processo_id and a.status = 'pendente'
      and e.ordem > (select ordem from public.etapas where id = resolvida.etapa_id)
    order by e.ordem limit 1) $$;

-- Sem security definer: roda com a permissão de quem chama e a RLS decide.
create function public.avancar_etapa(p_andamento uuid, p_acao text, p_nota text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  novo public.status_da_etapa := private.status_do_avanco(p_acao);
  escolhida public.andamentos;
begin
  if novo is null then
    raise exception 'acao_invalida:%', p_acao;
  end if;
  select * into escolhida from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_nota_do_avanco(novo, p_nota);
  perform private.resolver_etapa_do_avanco(escolhida, novo, p_nota);
  perform private.iniciar_proxima_do_avanco(escolhida, p_responsavel);
end $$;

revoke execute on function private.status_do_avanco(text),
  private.conferir_nota_do_avanco(public.status_da_etapa, text),
  private.resolver_etapa_do_avanco(public.andamentos, public.status_da_etapa, text),
  private.iniciar_proxima_do_avanco(public.andamentos, uuid), public.avancar_etapa(uuid, text, text, uuid)
  from public, anon;
grant execute on function private.status_do_avanco(text),
  private.conferir_nota_do_avanco(public.status_da_etapa, text),
  private.resolver_etapa_do_avanco(public.andamentos, public.status_da_etapa, text),
  private.iniciar_proxima_do_avanco(public.andamentos, uuid), public.avancar_etapa(uuid, text, text, uuid)
  to authenticated;
