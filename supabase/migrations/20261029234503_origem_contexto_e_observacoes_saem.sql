-- Origem, Contexto e Observações saem (enxugar-cartao-e-cadastro, ticket 05). Destrutiva só para dados inventados do
-- desenvolvimento (não há produção): o Contexto e as Observações viram texto das Anotações, e as três colunas somem.

-- 1. A junção: "Contexto: …", "Observações: …" e o texto que já havia, separados por linha em branco, só com os trechos
-- não vazios. Função pura, usada pelo update abaixo e mantida para o teste (depois da migração a coluna contexto não existe).
create function private.juntar_textos_antigos(p_contexto text, p_observacoes text, p_anotacoes text) returns text
language sql immutable set search_path = ''
as $$
  select nullif(concat_ws(E'\n\n',
    'Contexto: ' || nullif(btrim(p_contexto), ''),
    'Observações: ' || nullif(btrim(p_observacoes), ''),
    case when btrim(coalesce(p_anotacoes, '')) = '' then null else p_anotacoes end), '') $$;

revoke execute on function private.juntar_textos_antigos(text, text, text) from public, anon, authenticated;

-- Passa pelo gatilho das Anotações: quem fica nulo (a migração não tem usuário) e quando fica com a hora da migração.
-- Se a soma passar de 8.000 caracteres, o limite das Anotações faz a migração falhar: nada é cortado.
update public.processos
set anotacoes = private.juntar_textos_antigos(contexto, observacoes, anotacoes)
where nullif(btrim(contexto), '') is not null or nullif(btrim(observacoes), '') is not null;

-- 2. O gatilho de preparar o processo deixa de limpar os dois textos (resto igual ao da migração 20261014130147).
create or replace function private.preparar_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  if tg_op = 'INSERT' or (new.setor_id, new.macroprocesso_id) is distinct from (old.setor_id, old.macroprocesso_id) then
    insert into public.setores_envolvidos (macroprocesso_id, setor_id)
    values (new.macroprocesso_id, new.setor_id) on conflict do nothing;
  end if;
  return new;
end $$;

-- 3. O estado guardado no histórico (igual ao da migração 20261025194034, sem as três chaves). Os eventos antigos ficam como estão.
create or replace function private.estado_do_processo(processo public.processos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', processo.nome, 'setor_id', processo.setor_id, 'setor_sigla', s.sigla,
    'macroprocesso_id', processo.macroprocesso_id, 'macroprocesso_nome', m.nome, 'tipo', processo.tipo,
    'situacao', processo.situacao, 'data_da_modelagem_piloto', processo.data_da_modelagem_piloto)
    || case when processo.processo_pai_id is null then '{}'::jsonb else jsonb_build_object('processo_pai_nome',
      (select pai.nome from public.processos pai where pai.id = processo.processo_pai_id)) end
  from public.setores s, public.macroprocessos m
  where s.id = processo.setor_id and m.id = processo.macroprocesso_id $$;

-- 4. A view sem as três colunas (igual à da migração 20261029001211, mesma ordem no resto).
drop view public.processos_com_andamento;
create view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_modelagem_piloto, u.ativo as responsavel_ativo,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.publicado_em,
  pa.etiqueta, pa.entrou_em as entrou_na_etapa_em,
  (select count(*)::int from public.etapas x where x.ativa and x.ordem <= e.ordem) as etapa_atual_posicao,
  p.link_da_publicacao,
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao,
  p.explicacao_sem_publicacao,
  exists (select 1 from public.versoes v where v.processo_id = p.id and v.piloto) as tem_versao_piloto,
  exists (select 1 from public.versoes v where v.processo_id = p.id and not v.historica and not v.piloto)
    as tem_versao_em_sequencia,
  exists (select 1 from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = p.id and f.papel = 'relatorio' and f.numero_do_relatorio is not null) as tem_relatorio_numerado,
  p.data_da_validacao,
  s.cor as setor_cor,
  p.tirado_do_quadro_em,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos'
    then (p.tirado_do_quadro_em is null or p.tirado_do_quadro_em < pa.entrou_em)
      and pa.entrou_em > now() - interval '30 days'
    else true end as no_quadro
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

-- 5. O pacote das planilhas (igual ao da migração 20261025194034, sem 'observacoes').
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
        'data_da_modelagem_piloto', p.data_da_modelagem_piloto,
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

-- 6. Agora as colunas e o tipo podem sair (com elas vão o limite de tamanho e os privilégios de coluna).
alter table public.processos drop column origem, drop column contexto, drop column observacoes;
drop type public.origem_do_processo;
