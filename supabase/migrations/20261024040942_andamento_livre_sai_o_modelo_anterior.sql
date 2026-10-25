-- Andamento livre, parte 2 de 3 (processos-etapas, ticket 24; ADRs 0022, 0023 e 0024). Destrutiva: apaga os eventos do
-- modelo anterior (andamento de etapa e escolha de publicação, exceção única à regra do histórico, ADR 0022), os
-- andamentos, o status, a obrigatória, a escolha de publicação e as funções e gatilhos que os usavam. Recria a view, o
-- catálogo (acrescentar sem obrigatória, as fixas nas pontas, as recusas com processo dentro) e o que lia os andamentos:
-- a exclusão do processo, a revisão e a aprovação em andamento (até o ticket 05 de revisoes-aprovacao) e o pacote das
-- planilhas (o mínimo para não ler o que saiu; o resto no ticket 06 de exportacao-e-manutencao).

-- A view lê o que sai; ela volta no fim, com outras colunas (create or replace view não tira coluna).
drop view public.processos_com_andamento;

-- Os eventos do modelo anterior saem com os gatilhos desligados só neste trecho.
set local session_replication_role = replica;
delete from public.eventos
where entidade = 'andamento'
  or (entidade = 'processo' and acao in ('escolher_publicacao', 'apagar_escolha_de_publicacao',
    'nao_vai_mais_para_publicacao', 'registrar_publicacao'));
set local session_replication_role = origin;
drop policy "eventos: perfil ativo lê as etapas" on public.eventos;

-- ===== Funções públicas do modelo anterior =====
drop function public.avancar_etapa(uuid, text, text, uuid, boolean);
drop function public.voltar_a_etapa(uuid, text, uuid);
drop function public.concluir_revisao_interna(uuid, public.resultado_da_revisao, public.escopo_da_correcao, text, uuid);
drop function public.concluir_aprovacao(uuid, text, text, date, uuid, boolean);
drop function public.nao_vai_mais_para_publicacao(uuid, text);
drop function public.registrar_publicacao(uuid, date, text);
drop function public.acrescentar_etapa(text, text, boolean, public.fase_do_regimento, uuid);

-- ===== Gatilhos e funções sobre processos e etapas que mexiam nos andamentos ou na escolha =====
drop trigger criar_andamentos_do_processo on public.processos;
drop trigger conferir_escolha_de_publicacao on public.processos;
drop trigger registrar_evento_da_escolha_de_publicacao on public.processos;
drop trigger sincronizar_andamentos_da_etapa on public.etapas;
drop function private.criar_andamentos_do_processo(), private.conferir_escolha_de_publicacao(),
  private.registrar_evento_da_escolha_de_publicacao(), private.sincronizar_andamentos_da_etapa();

-- ===== Funções que recebem ou leem andamentos (os gatilhos da tabela saem com ela) =====
drop function private.conferir_dispensa(public.andamentos), private.conferir_uma_em_andamento(public.andamentos),
  private.conferir_sequencia_do_processo(public.andamentos), private.conferir_sequencia(public.andamentos),
  private.base_do_evento_do_andamento(public.andamentos), private.conferir_datas(public.andamentos),
  private.conferir_etapa_resolvida(public.andamentos), private.devolver_etapas_seguintes(public.andamentos),
  private.reabrir_etapa(public.andamentos, uuid), private.acao_do_andamento(public.andamentos, public.andamentos),
  private.estado_do_andamento(public.andamentos, boolean),
  private.resolver_etapa_do_avanco(public.andamentos, public.status_da_etapa, text),
  private.iniciar_proxima_do_avanco(public.andamentos, uuid), private.desfazer_aprovacao_da_volta(public.andamentos),
  private.apagar_escolha_da_volta(public.andamentos), private.gravar_escolha_de_publicacao(public.andamentos, boolean),
  private.andamento_da_publicacao(uuid, public.status_da_etapa), private.publicacao_pulada(uuid),
  private.publicacao_a_registrar(uuid), private.mudar_escolha_de_publicacao(uuid, boolean),
  private.marcar_publicacao(jsonb), private.desmarcar_publicacao(), private.incluir_andamentos_pendentes(public.etapas),
  private.apagar_andamentos_pendentes(uuid);

drop table public.andamentos;

drop function private.preparar_andamento(), private.registrar_evento_do_andamento(),
  private.conferir_autor_da_revisao_interna(), private.conferir_conclusao_da_etapa(),
  private.conferir_transicao(public.status_da_etapa, public.status_da_etapa),
  private.status_do_avanco(text), private.conferir_nota_do_avanco(public.status_da_etapa, text),
  private.escolhendo_publicacao(), private.sincronizando_catalogo();
drop type public.status_da_etapa;

-- A aprovação deixa de se desfazer na volta (não há mais volta): não se apaga (ticket 05 de revisoes-aprovacao).
create or replace function private.bloquear_apagar_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'aprovacao_nao_se_apaga';
end $$;

drop function private.voltando();

-- A escolha de publicação sai.
alter table public.processos drop column vai_para_publicacao;

-- ===== Revisão e aprovação: a etapa "em andamento" passa a ser a passagem aberta =====
create or replace function private.conferir_revisao_interna_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = p_processo and pa.saiu_em is null and e.codigo = 'revisao_interna') then
    raise exception 'revisao_fora_da_etapa';
  end if;
end $$;

create or replace function private.conferir_aprovacao_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = p_processo and pa.saiu_em is null and e.codigo = 'aprovacao_setor') then
    raise exception 'aprovacao_fora_da_etapa';
  end if;
end $$;

-- ===== Exclusão do processo: o "antes" traz a etapa atual, a etiqueta e o responsável =====
create or replace function private.registrar_exclusao_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  atual jsonb;
begin
  select jsonb_build_object('etapa_codigo', e.codigo, 'etapa_nome', e.nome, 'etiqueta', pa.etiqueta,
      'responsavel_nome', (select nome from public.usuarios where id = old.responsavel_id))
    into atual
  from public.passagens pa join public.etapas e on e.id = pa.etapa_id
  where pa.processo_id = old.id and pa.saiu_em is null;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'processo', old.id::text, jsonb_build_object(
    'antes', private.estado_do_processo(old) || coalesce(atual, '{}'::jsonb), 'depois', null));
  return old;
end $$;

-- ===== Catálogo =====
alter table public.etapas drop column obrigatoria;

-- O evento da etapa sem a obrigatória; os eventos antigos ficam com ela.
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome, 'ativa', etapa.ativa, 'ordem', etapa.ordem,
  'fase', etapa.fase) $$;

-- Etapa nova antes de outra; sem posição, logo antes de Concluídos. Não cria nada nos processos. Sem security definer:
-- a RLS de etapas deixa só o administrador ativo incluir.
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_fase public.fase_do_regimento, p_antes_de uuid)
  returns uuid
language plpgsql set search_path = ''
as $$
declare
  posicao integer := (select ordem from public.etapas where id = coalesce(p_antes_de,
    (select id from public.etapas where codigo = 'concluidos')));
  nova uuid;
begin
  if posicao is null then
    raise exception 'registro_inexistente';
  end if;
  perform set_config('ep.etapa_movida', 'nenhuma', true);
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, fase)
  values (p_codigo, btrim(p_nome), posicao, p_fase) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

revoke execute on function public.acrescentar_etapa(text, text, public.fase_do_regimento, uuid) from public, anon;
grant execute on function public.acrescentar_etapa(text, text, public.fase_do_regimento, uuid) to authenticated;

-- As fixas não mudam de nome, fase nem situação e não saem; os oito códigos de fábrica não se desativam nem saem
-- (as seis com campos próprios ainda se renomeiam e se movem). O nome do gatilho vem antes dos "conferir_" de etapa.
create or replace function private.bloquear_etapa_protegida() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.codigo in ('nao_iniciados', 'concluidos') and (tg_op = 'DELETE'
    or (new.nome, new.fase, new.ativa) is distinct from (old.nome, old.fase, old.ativa)) then
    raise exception 'etapa_fixa';
  end if;
  if old.codigo in ('modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_setor', 'aprovacao_setor',
    'publicacao') and (tg_op = 'DELETE' or (old.ativa and not new.ativa)) then
    raise exception 'etapa_protegida:%', old.nome;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger bloquear_etapa_protegida on public.etapas;
create trigger bloquear_etapa_protegida before update or delete on public.etapas
  for each row execute function private.bloquear_etapa_protegida();

-- Quantos processos estão na etapa agora (passagem aberta).
create function private.processos_na_etapa(p_etapa uuid) returns integer
language sql stable set search_path = ''
as $$ select count(*)::int from public.passagens where etapa_id = p_etapa and saiu_em is null $$;

-- Etapa com processo dentro não se desativa nem se apaga; a que já recebeu processo não se apaga (a referência de
-- passagens também recusaria, sem a frase).
create or replace function private.conferir_etapa_nunca_usada() returns trigger
language plpgsql set search_path = ''
as $$
declare
  dentro integer := private.processos_na_etapa(old.id);
begin
  if dentro > 0 then
    raise exception 'etapa_com_processos:%:%', old.nome, dentro;
  end if;
  if exists (select 1 from public.passagens where etapa_id = old.id) then
    raise exception 'etapa_usada:%', old.nome;
  end if;
  return old;
end $$;

create function private.conferir_etapa_sem_processos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  dentro integer;
begin
  if not (old.ativa and not new.ativa) then
    return new;
  end if;
  dentro := private.processos_na_etapa(old.id);
  if dentro > 0 then
    raise exception 'etapa_com_processos:%:%', old.nome, dentro;
  end if;
  return new;
end $$;

create trigger conferir_etapa_sem_processos before update of ativa on public.etapas
  for each row execute function private.conferir_etapa_sem_processos();

-- Conferido depois de cada comando que inclui ou reordena: Não iniciados é a primeira e Concluídos a última.
create function private.conferir_fixas_nas_pontas() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select codigo from public.etapas order by ordem limit 1) <> 'nao_iniciados'
    or (select codigo from public.etapas order by ordem desc limit 1) <> 'concluidos' then
    raise exception 'etapas_fixas_nas_pontas';
  end if;
  return null;
end $$;

create trigger conferir_fixas_nas_pontas after insert or update of ordem on public.etapas
  for each statement execute function private.conferir_fixas_nas_pontas();

-- ===== A view do Quadro e do painel, pela passagem aberta =====
-- Os nomes que outras partes leem continuam (etapa_atual_*, responsavel_*, situacao, publicado_em, arquivado_em). O
-- concluído é estar em Concluídos com a situação guardada em andamento.
create view public.processos_com_andamento with (security_invoker = true) as
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
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao
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

-- ===== Pacote das planilhas: o mínimo para não ler o que saiu =====
-- Igual à da migração 20261023020432_pacote_com_escolha_de_publicacao, com a data da publicação no lugar da escolha e
-- as passagens no lugar dos andamentos (sem quem moveu: nenhum nome de pessoa vai às planilhas).
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
        'etapa_atual_id', p.etapa_atual_id, 'etiqueta', p.etiqueta, 'publicado_em', p.publicado_em,
        'ultima_versao', (select max(v.numero) from public.versoes v where v.processo_id = p.id and not v.historica)
      ) order by p.nome, p.id)
      from public.processos_com_andamento p), '[]'::jsonb),
    'passagens', coalesce((
      select jsonb_agg(jsonb_build_object('processo_id', pa.processo_id, 'etapa_id', pa.etapa_id,
        'entrou_em', pa.entrou_em, 'saiu_em', pa.saiu_em, 'etiqueta', pa.etiqueta, 'concluido_em', pa.concluido_em))
      from public.passagens pa), '[]'::jsonb)
  )
$$;

-- `create or replace` mantém os privilégios, mas o refazemos por segurança (testes 44 e 46).
revoke execute on function private.montar_pacote_das_planilhas() from public, anon, authenticated;

revoke execute on function private.conferir_etapa_sem_processos(), private.conferir_fixas_nas_pontas() from public, anon;
grant execute on function private.conferir_etapa_sem_processos(), private.conferir_fixas_nas_pontas() to authenticated;
revoke execute on function private.processos_na_etapa(uuid) from public, anon;
grant execute on function private.processos_na_etapa(uuid) to authenticated;
