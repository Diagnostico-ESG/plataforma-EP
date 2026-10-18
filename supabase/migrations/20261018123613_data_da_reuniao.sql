-- Data da reunião no processo (reunioes, ticket 05; ADR 0013): a reunião vira só a data da modelagem piloto, guardada
-- no processo, e tudo o que era da área Reuniões sai do banco. Destrutiva: não há produção, e as reuniões do
-- desenvolvimento são inventadas e não são copiadas para a coluna nova. Os eventos antigos de reunião ficam em
-- public.eventos, legíveis pela política "eventos: perfil ativo lê as reuniões", que esta migração não toca.

-- A data, opcional e sem restrição de passado ou futuro. Gravada por update direto: o privilégio de coluna deixa o
-- logado tentar, e a RLS de processos decide quem pode (Administrador e Integrante ativos). A situação do processo
-- não trava a coluna: conferir_situacao_do_processo só olha a situação e o motivo.
alter table public.processos add column data_da_reuniao date;
grant update (data_da_reuniao) on public.processos to authenticated;

-- O estado dos eventos do processo passa a trazer a data: marcar, trocar e remover viram evento "editar" com antes e
-- depois, e gravar a mesma data não gera evento (registrar_evento_do_processo compara os dois estados).
create or replace function private.estado_do_processo(processo public.processos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', processo.nome, 'setor_id', processo.setor_id, 'setor_sigla', s.sigla,
    'macroprocesso_id', processo.macroprocesso_id, 'macroprocesso_nome', m.nome, 'tipo', processo.tipo,
    'origem', processo.origem, 'situacao', processo.situacao, 'contexto', processo.contexto,
    'observacoes', processo.observacoes, 'data_da_reuniao', processo.data_da_reuniao)
    || case when processo.processo_pai_id is null then '{}'::jsonb else jsonb_build_object('processo_pai_nome',
      (select pai.nome from public.processos pai where pai.id = processo.processo_pai_id)) end
  from public.setores s, public.macroprocessos m
  where s.id = processo.setor_id and m.id = processo.macroprocesso_id $$;

-- A view do Quadro e do painel ganha a data no fim (o "create or replace" só aceita coluna nova depois das que já
-- existem). Fora isso, igual à da migração processos.
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
  exists (
    select 1 from public.andamentos a
    where a.setor_id = p.setor_id and a.status in ('pendente', 'em_andamento')
  ) as aguardando_o_setor,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento')
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

-- As travas de reunião que moram em outras tabelas: excluir setor e processo com reunião, trocar o setor do processo
-- com reunião e manter o responsável do setor nas reuniões. Saem antes das tabelas, porque as funções delas as leem.
drop trigger conferir_setor_sem_reunioes on public.setores;
drop trigger conferir_processo_sem_reunioes on public.processos;
drop trigger conferir_processo_sem_reunioes_na_troca_de_setor on public.processos;
drop trigger manter_responsavel_nas_reunioes on public.responsaveis_do_setor;

-- As tabelas levam junto as políticas, os gatilhos e os índices delas.
drop table public.reunioes_responsaveis, public.reunioes_usuarios, public.reunioes_processos, public.reunioes;

drop function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[], uuid[], uuid[],
  uuid[]);
drop function private.preparar_reuniao(), private.conferir_setor_da_reuniao(), private.conferir_processo_da_reuniao(),
  private.conferir_processos_ao_trocar_o_setor(), private.reuniao_da_linha(jsonb), private.conferir_tipo_da_reuniao(),
  private.conferir_setor_sem_reunioes(), private.conferir_processo_sem_reunioes(), private.estado_da_reuniao(uuid),
  private.chave_da_reuniao(uuid), private.guardar_estado_da_reuniao(), private.registrar_evento_da_reuniao(),
  private.conferir_responsavel_da_reuniao(), private.conferir_responsaveis_ao_trocar_o_setor(),
  private.manter_responsavel_nas_reunioes(), private.conferir_processo_sem_reunioes_na_troca_de_setor();
drop type public.tipo_de_reuniao;
