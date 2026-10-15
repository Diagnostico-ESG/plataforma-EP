-- Reuniões (ticket 01), correção da migração reunioes: o SET CONSTRAINTS procura os gatilhos de restrição pelo
-- schema e, na função de salvar, o search_path é vazio; sem o nome qualificado, o Postgres responde que a restrição
-- não existe. A função é a mesma, só com "public." nos quatro nomes. O grant e o revoke não mudam com o replace.

create or replace function public.salvar_reuniao(p_id uuid, p_tipo public.tipo_de_reuniao, p_setor_id uuid, p_data date,
  p_hora time, p_local text, p_anotacoes text, p_outros text[], p_processos uuid[]) returns uuid
language plpgsql set search_path = ''
as $$
declare
  reuniao uuid := p_id;
  processos uuid[] := coalesce(p_processos, '{}');
begin
  if p_id is null then
    insert into public.reunioes (setor_id, tipo, data, hora, local, anotacoes, outros_participantes)
    values (p_setor_id, p_tipo, p_data, p_hora, p_local, p_anotacoes, coalesce(p_outros, '{}')) returning id into reuniao;
  else
    delete from public.reunioes_processos where reuniao_id = p_id and processo_id <> all (processos);
    update public.reunioes set setor_id = p_setor_id, tipo = p_tipo, data = p_data, hora = p_hora, local = p_local,
      anotacoes = p_anotacoes, outros_participantes = coalesce(p_outros, '{}') where id = p_id;
    if not found then
      if exists (select 1 from public.reunioes where id = p_id) then
        raise exception 'sem permissão para alterar reuniões' using errcode = '42501';
      end if;
      raise exception 'registro_inexistente';
    end if;
  end if;
  insert into public.reunioes_processos (reuniao_id, processo_id)
  select reuniao, processo from unnest(processos) as processo on conflict do nothing;
  set constraints public.conferir_tipo_da_reuniao_na_reuniao, public.conferir_tipo_da_reuniao_nas_ligacoes,
    public.registrar_evento_da_reuniao_na_reuniao, public.registrar_evento_da_reuniao_nas_ligacoes immediate;
  set constraints public.conferir_tipo_da_reuniao_na_reuniao, public.conferir_tipo_da_reuniao_nas_ligacoes,
    public.registrar_evento_da_reuniao_na_reuniao, public.registrar_evento_da_reuniao_nas_ligacoes deferred;
  return reuniao;
end $$;
