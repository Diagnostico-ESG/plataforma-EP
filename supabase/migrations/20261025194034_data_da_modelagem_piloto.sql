-- Data da modelagem piloto (processos-etapas, ticket 26; CONTEXT.md): a data do encontro do EP com o setor, que se
-- chamava "data da reunião", passa a ter o nome do domínio em todo o banco. Não destrutiva: o rename preserva os
-- valores (os nulos continuam nulos) e o privilégio de update por coluna acompanha o nome novo. Os eventos já
-- gravados com a chave antiga (`data_da_reuniao`, em public.eventos.detalhes) ficam como estão; a tela lê as duas.
alter table public.processos rename column data_da_reuniao to data_da_modelagem_piloto;

-- O estado dos eventos do processo passa a gravar a chave nova (igual à da migração 20261018123613, só a chave muda).
create or replace function private.estado_do_processo(processo public.processos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', processo.nome, 'setor_id', processo.setor_id, 'setor_sigla', s.sigla,
    'macroprocesso_id', processo.macroprocesso_id, 'macroprocesso_nome', m.nome, 'tipo', processo.tipo,
    'origem', processo.origem, 'situacao', processo.situacao, 'contexto', processo.contexto,
    'observacoes', processo.observacoes, 'data_da_modelagem_piloto', processo.data_da_modelagem_piloto)
    || case when processo.processo_pai_id is null then '{}'::jsonb else jsonb_build_object('processo_pai_nome',
      (select pai.nome from public.processos pai where pai.id = processo.processo_pai_id)) end
  from public.setores s, public.macroprocessos m
  where s.id = processo.setor_id and m.id = processo.macroprocesso_id $$;

-- A view guarda o nome da coluna da época em que nasceu, e o "create or replace" não renomeia coluna: cai e volta
-- igual à da migração 20261024193536_registrar_publicacao_e_arquivar_tudo, só com o nome novo. Nada depende dela.
drop view public.processos_com_andamento;
create view public.processos_com_andamento with (security_invoker = true) as
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
  p.explicacao_sem_publicacao
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

-- O pacote das planilhas com a chave nova (igual à da migração 20261024173606_pacote_pela_posicao_no_catalogo).
create or replace function private.montar_pacote_das_planilhas() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'gerado_em', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'planilhas', jsonb_build_object(
      'interna', private.segredo_das_planilhas('planilhas_id_interna'),
      'publica', private.segredo_das_planilhas('planilhas_id_publica')),
    'etapas', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'codigo', e.codigo, 'ordem', e.ordem, 'fase', e.fase) order by e.ordem)
      from public.etapas e where e.ativa), '[]'::jsonb),
    'processos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nome', p.nome, 'tipo', p.tipo, 'setor_sigla', p.setor_sigla,
        'macroprocesso_nome', p.macroprocesso_nome, 'situacao_guardada', p.situacao_guardada,
        'observacoes', p.observacoes, 'data_da_modelagem_piloto', p.data_da_modelagem_piloto,
        'etapa_atual_id', p.etapa_atual_id, 'etiqueta', p.etiqueta, 'publicado_em', p.publicado_em,
        'ultima_versao', (select max(v.numero) from public.versoes v where v.processo_id = p.id and not v.historica)
      ) order by p.nome, p.id)
      from public.processos_com_andamento p where p.situacao_guardada = 'em_andamento'), '[]'::jsonb),
    'passagens', coalesce((
      select jsonb_agg(jsonb_build_object('processo_id', pa.processo_id, 'etapa_id', pa.etapa_id,
        'entrou_em', pa.entrou_em, 'saiu_em', pa.saiu_em, 'etiqueta', pa.etiqueta, 'concluido_em', pa.concluido_em))
      from public.passagens pa
      join public.processos pr on pr.id = pa.processo_id and pr.situacao = 'em_andamento'), '[]'::jsonb)
  )
$$;

revoke execute on function private.montar_pacote_das_planilhas() from public, anon, authenticated;
