-- Processos e etapas, ticket 11 (Simplificação, ADR 0013): os responsáveis do setor saem da plataforma.
-- A tabela leva junto as políticas, o índice e os gatilhos; drop table não dispara os gatilhos de linha, então nenhum
-- evento nasce. A política "eventos: perfil ativo lê os responsáveis do setor" fica: os eventos antigos continuam
-- legíveis por todo perfil ativo.

-- Excluir um setor deixa de listar os responsáveis (versão anterior: 20261013211710_responsaveis_do_setor; volta a
-- ser a de 20261013150735_setores_envolvidos).
create or replace function private.registrar_exclusao_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  macroprocessos jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('macroprocesso_id', m.id, 'codigo', m.codigo, 'nome', m.nome,
    'observacao', v.observacao) order by m.codigo nulls last, m.nome), '[]'::jsonb) into macroprocessos
  from public.setores_envolvidos v join public.macroprocessos m on m.id = v.macroprocesso_id
  where v.setor_id = old.id;
  delete from public.setores_envolvidos where setor_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'setor', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes,
      'ativo', old.ativo, 'macroprocessos', macroprocessos),
    'depois', null));
  return old;
end $$;

revoke execute on function private.registrar_exclusao_do_setor() from public, anon, authenticated;

drop table public.responsaveis_do_setor;
drop function private.preparar_responsavel_do_setor(), private.registrar_evento_do_responsavel_do_setor();
