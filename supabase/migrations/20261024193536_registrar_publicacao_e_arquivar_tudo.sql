-- Registrar publicação e arquivar tudo (publicacao-e-arquivamento, ticket 04; ADR 0024). Não destrutiva. Cria
-- registrar_publicacao (registra e corrige a data e o link, na Publicação ou em Concluídos, arquivado ou não, sem mover
-- o processo), deixa arquivar o suspenso e o cancelado, grava o evento da publicação e mostra a explicação na view. As
-- recusas chegam à interface como "motivo:valor" em P0001.

-- A marca 'publicar' (só na transação) libera as colunas da publicação sem abrir as passagens do movimento.
create or replace function private.conferir_colunas_da_publicacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.publicado_em, new.link_da_publicacao, new.explicacao_sem_publicacao)
    is distinct from (old.publicado_em, old.link_da_publicacao, old.explicacao_sem_publicacao)
    and not private.movendo_processo() and private.marca_do_movimento() <> 'publicar' then
    raise exception 'publicacao_so_pela_funcao';
  end if;
  return new;
end $$;

-- Registrar e corrigir viram evento do processo; a data que chega por mover_processo vai no evento do movimento.
create function private.registrar_evento_da_publicacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
begin
  if private.marca_do_movimento() <> 'publicar'
    or (new.publicado_em, new.link_da_publicacao) is not distinct from (old.publicado_em, old.link_da_publicacao) then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when old.publicado_em is null then 'registrar_publicacao' else 'corrigir_publicacao' end,
    'processo', new.id::text, jsonb_build_object(
      'antes', base || jsonb_strip_nulls(jsonb_build_object('publicado_em', old.publicado_em, 'link_da_publicacao', old.link_da_publicacao)),
      'depois', base || jsonb_strip_nulls(jsonb_build_object('publicado_em', new.publicado_em, 'link_da_publicacao', new.link_da_publicacao))));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_publicacao after update of publicado_em, link_da_publicacao on public.processos
  for each row execute function private.registrar_evento_da_publicacao();

-- Grava a data e o link com as duas liberações ligadas (a da publicação e a do arquivado). Zero linhas é a RLS
-- recusando: 42501.
create function private.gravar_publicacao(p_processo uuid, p_data date, p_link text) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  perform set_config('ep.movendo_processo', 'publicar', true);
  perform set_config('ep.liberando_arquivado', 'on', true);
  update public.processos set publicado_em = p_data, link_da_publicacao = p_link where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.movendo_processo', '', true);
  perform set_config('ep.liberando_arquivado', 'off', true);
  if linhas = 0 then
    raise exception 'sem permissão para registrar a publicação' using errcode = '42501';
  end if;
end $$;

-- A etapa atual (a passagem aberta) tem de ser a Publicação ou Concluídos.
create function private.conferir_etapa_da_publicacao(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = p_processo and pa.saiu_em is null and e.codigo in ('publicacao', 'concluidos')) then
    raise exception 'publicacao_fora_da_etapa';
  end if;
end $$;

-- Registra ou corrige a data (e o link) da publicação; o processo fica onde está. O arquivado só registra, e só sem data;
-- o parado (suspenso ou cancelado) não arquivado é recusado como em qualquer alteração. Sem security definer: a RLS decide.
create function public.registrar_publicacao(p_processo uuid, p_data date, p_link text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  processo public.processos;
  link text := nullif(btrim(p_link), '');
begin
  select * into processo from public.processos where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para registrar a publicação' using errcode = '42501';
  end if;
  if processo.arquivado_em is null then
    perform private.conferir_processo_em_andamento(p_processo);
  elsif processo.publicado_em is not null then
    raise exception 'arquivado_ja_publicado';
  end if;
  perform private.conferir_etapa_da_publicacao(p_processo);
  perform private.conferir_data_da_publicacao(p_processo, p_data);
  perform private.conferir_link_da_aprovacao(link);
  perform private.gravar_publicacao(p_processo, p_data, link);
end $$;

-- Arquivar aceita o concluído, o suspenso e o cancelado (o arquivado guarda a situação e a etapa).
create or replace function public.arquivar_processo(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  linha record;
begin
  select situacao, arquivado_em into linha from public.processos_com_andamento where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if linha.arquivado_em is not null then
    raise exception 'ja_arquivado';
  end if;
  if linha.situacao not in ('concluido', 'suspenso', 'cancelado') then
    raise exception 'arquivar_so_concluido:%', linha.situacao;
  end if;
  perform private.gravar_arquivamento(p_processo, now());
end $$;

-- A view igual à da migração 20261024040942_andamento_livre_sai_o_modelo_anterior, com a explicação no fim (o verso a mostra).
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao, u.ativo as responsavel_ativo,
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

revoke execute on function private.gravar_publicacao(uuid, date, text), private.conferir_etapa_da_publicacao(uuid),
  public.registrar_publicacao(uuid, date, text) from public, anon;
grant execute on function private.gravar_publicacao(uuid, date, text), private.conferir_etapa_da_publicacao(uuid),
  public.registrar_publicacao(uuid, date, text) to authenticated;
-- Chamada só pelo gatilho de evento (security definer).
revoke execute on function private.registrar_evento_da_publicacao() from public, anon, authenticated;
