-- Pacote das planilhas (exportacao-e-manutencao, ticket 03; ADRs 0017 e 0018). Não destrutiva: uma função de montagem
-- em `private` (sem execução para a tela) e o núcleo do pedido do ticket 02, que passa a enviar à Edge Function o
-- pacote inteiro junto com a tentativa e a ficha. A função das planilhas não lê o banco: tudo o que ela precisa
-- (inclusive os dois identificadores das planilhas, que o cofre guarda) viaja aqui. Nenhum nome nem e-mail de usuário
-- entra no pacote; os cancelados entram de propósito (a função é que decide tirá-los); as datas das etapas seguem
-- o dia do banco (backlog de 2026-10-20).

-- Lê da view do Quadro (a mesma regra de "concluído" e de situação) e da tabela de versões, só as não históricas.
create function private.montar_pacote_das_planilhas() returns jsonb
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
        'ultima_versao', (select max(v.numero) from public.versoes v where v.processo_id = p.id and not v.historica)
      ) order by p.nome, p.id)
      from public.processos_com_andamento p), '[]'::jsonb),
    'andamentos', coalesce((
      select jsonb_agg(jsonb_build_object('processo_id', a.processo_id, 'etapa_id', a.etapa_id, 'status', a.status,
        'iniciada_em', a.iniciada_em, 'resolvida_em', a.resolvida_em))
      from public.andamentos a join public.etapas e on e.id = a.etapa_id where e.ativa), '[]'::jsonb)
  )
$$;

revoke execute on function private.montar_pacote_das_planilhas() from public, anon, authenticated;

-- O núcleo do ticket 02 com uma única mudança: o corpo enviado leva o pacote além da tentativa e da ficha.
create or replace function private.iniciar_atualizacao_das_planilhas(p_origem public.origem_da_atualizacao, p_usuario uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  endereco text := private.segredo_das_planilhas('planilhas_endereco_da_funcao');
  senha text := private.segredo_das_planilhas('planilhas_senha_interna');
  ficha text;
  tentativa uuid;
begin
  perform pg_advisory_xact_lock(hashtext('atualizacao_das_planilhas'));
  if exists (select 1 from public.atualizacoes_das_planilhas
             where concluida_em is null and iniciada_em > now() - private.espera_da_atualizacao()) then
    raise exception 'atualizacao_em_andamento';
  end if;
  if endereco is null or senha is null or private.segredo_das_planilhas('planilhas_id_interna') is null
     or private.segredo_das_planilhas('planilhas_id_publica') is null then
    raise exception 'planilhas_nao_configuradas';
  end if;
  ficha := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.atualizacoes_das_planilhas (origem, pedida_por, ficha_hash)
  values (p_origem, p_usuario, encode(sha256(convert_to(ficha, 'utf8')), 'hex')) returning id into tentativa;
  perform net.http_post(url := endereco,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-senha-interna', senha),
    body := private.montar_pacote_das_planilhas() || jsonb_build_object('tentativa', tentativa, 'ficha', ficha));
  return tentativa;
end $$;

revoke execute on function private.iniciar_atualizacao_das_planilhas(public.origem_da_atualizacao, uuid)
  from public, anon, authenticated;
