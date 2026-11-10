-- Duas revisões, a etapa (revisoes-aprovacao, ticket 07; ADR 0046, que altera o 0023 na parte da revisão). A Revisão
-- interna passa a se chamar Revisão do fluxograma (o código revisao_interna fica). Logo depois dela entra a Revisão do
-- relatório (revisao_relatorio), na fase VI, sem responsável inicial, de campos próprios: não se desativa nem se exclui.
-- Versão em sequência e relatório passam a se enviar até ela. Não destrutiva: renomeia uma etapa, inclui outra, desloca a
-- ordem das seguintes e recria duas funções com o mesmo comportamento fora do que muda. O registro da revisão nas duas
-- etapas é da migração seguinte (duas_revisoes_registro).

update public.etapas set nome = 'Revisão do fluxograma' where codigo = 'revisao_interna';

-- Os gatilhos do catálogo (eventos, ordem e fixas nas pontas) ficam de fora: a mudança é da plataforma, não de uma pessoa,
-- como na migração andamento_livre_passagens. O unique (ordem) é verificado no fim do comando (deferrable).
set local session_replication_role = replica;
update public.etapas set ordem = ordem + 1 where ordem > (select ordem from public.etapas where codigo = 'revisao_interna');
insert into public.etapas (codigo, nome, ordem, fase, ativa, responsavel_inicial_id)
values ('revisao_relatorio', 'Revisão do relatório', (select ordem + 1 from public.etapas where codigo = 'revisao_interna'), 'VI',
  true, null);
set local session_replication_role = origin;

-- Igual à da migração andamento_livre_sai_o_modelo_anterior, com a Revisão do relatório entre as de campos próprios.
create or replace function private.bloquear_etapa_protegida() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.codigo in ('nao_iniciados', 'concluidos') and (tg_op = 'DELETE'
    or (new.nome, new.fase, new.ativa) is distinct from (old.nome, old.fase, old.ativa)) then
    raise exception 'etapa_fixa';
  end if;
  if old.codigo in ('modelagem', 'relatorio_modelagem_tecnica', 'revisao_interna', 'revisao_relatorio', 'revisao_setor',
    'aprovacao_setor', 'publicacao') and (tg_op = 'DELETE' or (old.ativa and not new.ativa)) then
    raise exception 'etapa_protegida:%', old.nome;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- Igual à da migração importar_versao, com a Revisão do relatório como limite da versão em sequência e do relatório.
create or replace function private.conferir_onde_cabe_a_versao(processo uuid, tipo text) returns void
language plpgsql stable set search_path = ''
as $$
declare
  atual record;
  limite integer := (select ordem from public.etapas where codigo = 'revisao_relatorio');
begin
  if private.importando_versao() then
    return;
  end if;
  select e.codigo, e.ordem into atual
  from public.processos_com_andamento p join public.etapas e on e.id = p.etapa_atual_id
  where p.id = processo;
  if tipo = 'historica' and atual.codigo <> 'nao_iniciados' then
    raise exception 'historica_fora_de_nao_iniciados';
  end if;
  if tipo = 'piloto' and atual.ordem > (select ordem from public.etapas where codigo = 'modelagem') then
    raise exception 'piloto_fora_da_etapa';
  end if;
  if tipo = 'sequencia' and atual.ordem > limite then
    raise exception 'versao_fora_da_etapa';
  end if;
  if tipo = 'relatorio' and atual.ordem > limite then
    raise exception 'relatorio_fora_da_etapa';
  end if;
end $$;
