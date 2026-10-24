-- Pacote das planilhas pela posição no catálogo (exportacao-e-manutencao, ticket 06; ADRs 0022 e 0024). Não destrutiva:
-- recria a função que monta o pacote. Só entram os processos de situação guardada em andamento (o suspenso e o
-- cancelado saem das planilhas) e sai `concluido`: o concluído é estar na etapa Concluídos, que o pacote já mostra por
-- `etapa_atual_id`. O resto é igual ao da migração 20261024040942_andamento_livre_sai_o_modelo_anterior: etapas com a
-- fase vazia nas duas fixas, a etiqueta, a data da publicação e as passagens sem quem moveu (nenhum nome de pessoa).
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
        'observacoes', p.observacoes, 'data_da_reuniao', p.data_da_reuniao,
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

-- `create or replace` mantém os privilégios, mas o refazemos por segurança (testes 44 e 46).
revoke execute on function private.montar_pacote_das_planilhas() from public, anon, authenticated;
