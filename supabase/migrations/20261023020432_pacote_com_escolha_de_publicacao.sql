-- Pacote das planilhas com a escolha de publicação (publicacao-e-arquivamento, ticket 03; ADR 0020). Não destrutiva:
-- só acrescenta `vai_para_publicacao` (true, false ou nulo) a cada processo do pacote, para a função das planilhas
-- mostrar "Não publicado" na fase VII. O arquivado já vem como concluído (arquivar não muda `situacao` na view).
-- Igual à função da migração 20261020173638_pacote_das_planilhas, com o campo novo.
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
        'concluido', p.situacao = 'concluido', 'observacoes', p.observacoes, 'data_da_reuniao', p.data_da_reuniao,
        'vai_para_publicacao', p.vai_para_publicacao,
        'ultima_versao', (select max(v.numero) from public.versoes v where v.processo_id = p.id and not v.historica)
      ) order by p.nome, p.id)
      from public.processos_com_andamento p), '[]'::jsonb),
    'andamentos', coalesce((
      select jsonb_agg(jsonb_build_object('processo_id', a.processo_id, 'etapa_id', a.etapa_id, 'status', a.status,
        'iniciada_em', a.iniciada_em, 'resolvida_em', a.resolvida_em))
      from public.andamentos a join public.etapas e on e.id = a.etapa_id where e.ativa), '[]'::jsonb)
  )
$$;

-- `create or replace` mantém os privilégios, mas o refazemos por segurança (teste 44 e 46).
revoke execute on function private.montar_pacote_das_planilhas() from public, anon, authenticated;
