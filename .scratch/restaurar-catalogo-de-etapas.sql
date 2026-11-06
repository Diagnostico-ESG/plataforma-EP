-- RESTAURA O CATÁLOGO DE ETAPAS NO DESENVOLVIMENTO (plataforma-ep-dev, ref yclkzyoebpsxmgpbcbus)
-- O script de limpeza esvaziou public.etapas, que é dado fixo do sistema (nasce nas migrações), e a importação
-- passou a recusar com "etapa_invalida:publicacao". Este script recompõe o catálogo no estado em que as migrações
-- o deixam: Não iniciados, Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Validação com o setor,
-- Aprovação pelo setor, Publicação e Concluídos. NÃO RODAR NA PRODUÇÃO (lá o catálogo não foi apagado).
-- Etapas criadas à mão no catálogo antes da limpeza não voltam (o Administrador as recria em Administração).

begin;

-- Estrutura de dados fixos, não ação de alguém: sem gatilhos, nenhum evento nasce (como nas migrações).
set local session_replication_role = replica;

do $$
begin
  if exists (select 1 from public.etapas) then
    raise exception 'public.etapas não está vazia: nada foi feito.';
  end if;

  insert into public.etapas (codigo, nome, ordem, fase) values
    ('nao_iniciados', 'Não iniciados', 1, null),
    ('modelagem', 'Modelagem piloto', 2, 'IV'),
    ('relatorio_modelagem_tecnica', 'Relatório e modelagem técnica', 3, 'V'),
    ('revisao_interna', 'Revisão interna', 4, 'VI'),
    ('revisao_setor', 'Validação com o setor', 5, 'VI'),
    ('aprovacao_setor', 'Aprovação pelo setor', 6, 'VI'),
    ('publicacao', 'Publicação', 7, 'VII'),
    ('concluidos', 'Concluídos', 8, null);
end
$$;

select codigo, nome, ordem, fase, ativa from public.etapas order by ordem;

commit;
