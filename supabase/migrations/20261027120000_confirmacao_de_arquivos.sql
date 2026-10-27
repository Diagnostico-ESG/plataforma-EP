-- Confirmação de arquivos (travas-em-avisos, ticket 01; ADR 0028, que substitui a parte de trava do ADR 0025): mover o
-- processo para a frente da Modelagem piloto ou da Relatório e modelagem técnica sem os arquivos delas deixa de ser
-- recusado. O banco aceita e grava no lado "depois" do evento do movimento a lista do que faltava, só quando falta algo:
-- [{"etapa_codigo", "etapa_nome", "pecas": ["versao_piloto" | "versao" | "relatorio"]}], uma entrada por etapa, em ordem.
-- A Modelagem piloto pede uma versão piloto (uma em sequência também basta); a técnica pede uma versão em sequência e um
-- relatório numerado. Voltar, a mesma etapa, o processo que já estava adiante e a etapa desativada não entram na lista.
-- Saem as recusas trava_piloto e trava_tecnica:<falta> (as funções que as lançavam). Sem mudar tabela nem view.

drop function private.conferir_trava_de_arquivos(uuid, public.etapas, public.etapas);
drop function private.arquivos_que_faltam(uuid, text);

-- O que falta nas etapas com arquivos que a ida atravessa (ativas, vindo delas ou de antes e indo para depois): null se
-- nada, senão a lista em ordem. Lê a view, com a permissão de quem chama.
create function private.arquivos_que_faltam_na_ida(p_processo uuid, de public.etapas, para public.etapas) returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_agg(jsonb_build_object('etapa_codigo', e.codigo, 'etapa_nome', e.nome, 'pecas', f.pecas) order by e.ordem)
  from public.etapas e
  join public.processos_com_andamento a on a.id = p_processo
  cross join lateral (
    select array_remove(array[
      case when e.codigo = 'modelagem' and not (a.tem_versao_piloto or a.tem_versao_em_sequencia) then 'versao_piloto' end,
      case when e.codigo = 'relatorio_modelagem_tecnica' and not a.tem_versao_em_sequencia then 'versao' end,
      case when e.codigo = 'relatorio_modelagem_tecnica' and not a.tem_relatorio_numerado then 'relatorio' end
    ], null) as pecas
  ) f
  where e.codigo in ('modelagem', 'relatorio_modelagem_tecnica') and e.ativa
    and de.ordem <= e.ordem and para.ordem > e.ordem and cardinality(f.pecas) > 0 $$;

revoke execute on function private.arquivos_que_faltam_na_ida(uuid, public.etapas, public.etapas) from public, anon;
grant execute on function private.arquivos_que_faltam_na_ida(uuid, public.etapas, public.etapas) to authenticated;

-- Igual à da migração 20261026154356_trava_de_arquivos, sem a recusa: o que faltava vai para o evento do movimento.
create or replace function public.mover_processo(p_processo uuid, p_etapa uuid, p_data_da_publicacao date default null,
  p_link_da_publicacao text default null, p_explicacao_sem_publicacao text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  antes public.processos;
  depois public.processos;
  de public.etapas;
  para public.etapas;
  evento jsonb;
  faltas jsonb;
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
  faltas := private.arquivos_que_faltam_na_ida(p_processo, de, para);
  depois := antes;
  depois.responsavel_id := (select auth.uid());
  if para.codigo = 'concluidos' then
    depois := private.publicacao_da_chegada(depois, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao);
  elsif de.codigo = 'concluidos' then
    depois.explicacao_sem_publicacao := null;
  end if;
  evento := private.evento_do_movimento(antes, depois, de, para);
  if faltas is not null then
    evento := jsonb_set(evento, '{depois,sem_arquivos}', faltas);
  end if;
  perform set_config('ep.movendo_processo', 'mover', true);
  perform private.trocar_passagem(p_processo, para, evento);
  perform private.gravar_processo_movido(depois);
  perform set_config('ep.movendo_processo', '', true);
end $$;
