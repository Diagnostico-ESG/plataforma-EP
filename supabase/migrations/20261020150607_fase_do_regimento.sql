-- Fase do Regimento no catálogo (exportacao-e-manutencao, ticket 01; ADR 0017): cada etapa ganha a fase do art. 8º do
-- Regimento (IV a IX) em que conta nas planilhas dos dashboards. Obrigatória: etapa nova nunca fica fora do dashboard
-- sem aviso. As fases I a III não existem no banco (são constantes da montagem das planilhas).

create type public.fase_do_regimento as enum ('IV', 'V', 'VI', 'VII', 'VIII', 'IX');

-- Nasce anulável só para a carga abaixo; fica obrigatória no fim da migração.
alter table public.etapas add column fase public.fase_do_regimento;

update public.etapas set fase = case codigo
  when 'modelagem' then 'IV'
  when 'relatorio_modelagem_tecnica' then 'V'
  when 'revisao_interna' then 'VI'
  when 'revisao_setor' then 'VI'
  when 'aprovacao_setor' then 'VI'
  when 'publicacao' then 'VII'
end::public.fase_do_regimento
where codigo in ('modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_setor', 'aprovacao_setor', 'publicacao');

-- Etapa criada à mão no desenvolvimento, fora das seis: fica na fase da etapa conhecida anterior na ordem (ou IV, se não
-- há). Escolha padrão: o Administrador corrige pelo Editar do catálogo.
update public.etapas e set fase = coalesce(
  (select p.fase from public.etapas p where p.fase is not null and p.ordem < e.ordem order by p.ordem desc limit 1), 'IV')
where e.fase is null;

alter table public.etapas alter column fase set not null;

-- Como as outras colunas editáveis: grava só o administrador ativo, pelas políticas de etapas que já existem.
grant insert (fase) on public.etapas to authenticated;
grant update (fase) on public.etapas to authenticated;

-- A fase entra no antes e no depois do evento do catálogo; os eventos antigos ficam sem ela.
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome,
  'obrigatoria', etapa.obrigatoria, 'ativa', etapa.ativa, 'ordem', etapa.ordem, 'fase', etapa.fase) $$;

-- Acrescentar etapa com a fase: apagada e recriada com a assinatura nova e os mesmos privilégios.
drop function public.acrescentar_etapa(text, text, boolean, uuid);
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_obrigatoria boolean,
  p_fase public.fase_do_regimento, p_antes_de uuid) returns uuid
language plpgsql set search_path = ''
as $$
declare
  posicao integer := (select ordem from public.etapas where id = p_antes_de);
  nova uuid;
begin
  if p_antes_de is not null and posicao is null then
    raise exception 'registro_inexistente';
  end if;
  posicao := coalesce(posicao, (select coalesce(max(ordem), 0) + 1 from public.etapas));
  perform set_config('ep.etapa_movida', 'nenhuma', true);
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, obrigatoria, fase)
  values (p_codigo, btrim(p_nome), posicao, p_obrigatoria, p_fase) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

revoke execute on function public.acrescentar_etapa(text, text, boolean, public.fase_do_regimento, uuid)
  from public, anon;
grant execute on function public.acrescentar_etapa(text, text, boolean, public.fase_do_regimento, uuid)
  to authenticated;
