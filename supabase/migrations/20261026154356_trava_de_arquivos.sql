-- Trava de arquivos (documentos-versoes, ticket 11; ADR 0025): mover o processo para a frente da Modelagem piloto ou da
-- Relatório e modelagem técnica, faltando o que a etapa exige, é recusado. A Modelagem piloto exige uma versão piloto (uma
-- versão em sequência também basta, porque depois dela a piloto já não entra e o processo ficaria sem saída); a técnica
-- exige uma versão em sequência e um relatório numerado, sem importar a ligação entre os dois. Voltar, a mesma etapa, o
-- processo que já estava adiante e a etapa desativada no catálogo não travam. Não destrutiva: view com três colunas no fim
-- e funções novas. As recusas chegam como "motivo:valor" em P0001 (src/processos/recusasDoBanco.ts).

-- O que o processo tem, para a tela decidir a janela da trava antes de mover. Igual à da migração
-- 20261025194034_data_da_modelagem_piloto, mais as três colunas no fim (calculadas, não guardadas).
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_modelagem_piloto, u.ativo as responsavel_ativo,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.publicado_em, p.arquivado_em,
  pa.etiqueta, pa.entrou_em as entrou_na_etapa_em,
  (select count(*)::int from public.etapas x where x.ativa and x.ordem <= e.ordem) as etapa_atual_posicao,
  p.link_da_publicacao,
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao,
  p.explicacao_sem_publicacao,
  exists (select 1 from public.versoes v where v.processo_id = p.id and v.piloto) as tem_versao_piloto,
  exists (select 1 from public.versoes v where v.processo_id = p.id and not v.historica and not v.piloto)
    as tem_versao_em_sequencia,
  exists (select 1 from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = p.id and f.papel = 'relatorio' and f.numero_do_relatorio is not null) as tem_relatorio_numerado
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join public.passagens pa on pa.processo_id = p.id and pa.saiu_em is null
left join public.etapas e on e.id = pa.etapa_id
left join public.usuarios u on u.id = p.responsavel_id
left join lateral (
  select v.numero, v.historica,
    exists (select 1 from public.arquivos_da_versao f where f.versao_id = v.id and f.papel = 'relatorio') as tem_relatorio
  from public.versoes v
  where v.processo_id = p.id
  order by v.numero desc
  limit 1
) ultima on true;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

-- O que falta para sair da etapa com trava: null se nada, senão o valor da recusa. Lê a view, com a permissão de quem chama.
create function private.arquivos_que_faltam(p_processo uuid, p_etapa text) returns text
language sql stable set search_path = ''
as $$
  select case p_etapa
    when 'modelagem' then case when a.tem_versao_piloto or a.tem_versao_em_sequencia then null else 'piloto' end
    when 'relatorio_modelagem_tecnica' then case
      when a.tem_versao_em_sequencia and a.tem_relatorio_numerado then null
      when a.tem_relatorio_numerado then 'versao'
      when a.tem_versao_em_sequencia then 'relatorio'
      else 'versao_e_relatorio' end
  end
  from public.processos_com_andamento a where a.id = p_processo $$;

-- Percorre, em ordem, as etapas com trava que a ida atravessa (ativas, vindo delas ou de antes e indo para depois) e
-- recusa na primeira a que faltam arquivos.
create function private.conferir_trava_de_arquivos(p_processo uuid, de public.etapas, para public.etapas) returns void
language plpgsql stable set search_path = ''
as $$
declare
  trava record;
  falta text;
begin
  for trava in
    select e.codigo from public.etapas e
    where e.codigo in ('modelagem', 'relatorio_modelagem_tecnica') and e.ativa and de.ordem <= e.ordem and para.ordem > e.ordem
    order by e.ordem
  loop
    falta := private.arquivos_que_faltam(p_processo, trava.codigo);
    if falta is not null then
      raise exception '%', case when trava.codigo = 'modelagem' then 'trava_piloto' else 'trava_tecnica:' || falta end;
    end if;
  end loop;
end $$;

revoke execute on function private.arquivos_que_faltam(uuid, text),
  private.conferir_trava_de_arquivos(uuid, public.etapas, public.etapas) from public, anon;
grant execute on function private.arquivos_que_faltam(uuid, text),
  private.conferir_trava_de_arquivos(uuid, public.etapas, public.etapas) to authenticated;

-- Igual à da migração 20261024040945_andamento_livre_mover, mais a trava de arquivos logo depois da própria etapa e antes
-- da regra da chegada a Concluídos.
create or replace function public.mover_processo(p_processo uuid, p_etapa uuid, p_data_da_publicacao date default null,
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
  perform private.conferir_trava_de_arquivos(p_processo, de, para);
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
