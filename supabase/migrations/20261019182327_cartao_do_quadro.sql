-- Cartão do Quadro (processos-etapas, parte 4, ticket 20): a view do Quadro ganha, no fim, o que a barra de progresso e
-- os selos precisam: status e início da etapa atual, se o responsável está ativo, o caminho de etapas, a última versão
-- (com a marca de relatório) e a quantidade de subprocessos não cancelados. Não destrutiva: os campos antigos ficam
-- na mesma ordem e com os mesmos tipos; nada é guardado, tudo se calcula das tabelas que o perfil já lê pelas
-- próprias políticas (security_invoker).
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.obrigatoria and a.status in ('pendente', 'em_andamento')
  ) then 'concluido' else p.situacao::text end as situacao,
  atual.etapa_id as etapa_atual_id, atual.codigo as etapa_atual_codigo, atual.nome as etapa_atual_nome,
  atual.ordem as etapa_atual_ordem,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao,
  atual.status as etapa_atual_status, atual.iniciada_em as etapa_atual_iniciada_em, u.ativo as responsavel_ativo,
  coalesce((
    select jsonb_agg(jsonb_build_object('etapa_id', e.id, 'codigo', e.codigo, 'status', a.status) order by e.ordem)
    from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id
  ), '[]'::jsonb) as caminho,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id, a.status, a.iniciada_em
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento')
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id
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
