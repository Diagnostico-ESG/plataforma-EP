-- Duas revisões, o registro (revisoes-aprovacao, ticket 07; ADR 0046). A revisão se registra nas duas etapas de revisão:
-- na Revisão do fluxograma (revisao_interna) e na Revisão do relatório (revisao_relatorio). A etapa sai da passagem
-- (passagem_id → passagens.etapa_id); a revisão antiga, sem passagem, conta como da Revisão do fluxograma. O escopo deixa de
-- ser escrito por quem registra: o gatilho o deduz do que foi enviado na passagem (versão, relatório ou os dois). O relatório
-- revisado e o corrigido ficam em duas colunas novas. Não destrutiva: duas colunas opcionais, uma restrição trocada por outra
-- mais larga (as linhas existentes continuam válidas), privilégios de coluna refeitos e funções recriadas. Recusas em P0001
-- "motivo" (src/revisoes/frasesDeRevisao.ts); perfil errado e coluna sem privilégio, 42501.

alter table public.revisoes_internas
  add column relatorio_revisado_id uuid references public.arquivos_da_versao (id) on delete restrict,
  add column relatorio_corrigido_id uuid references public.arquivos_da_versao (id) on delete restrict;
create index revisoes_internas_relatorio_revisado on public.revisoes_internas (relatorio_revisado_id);
create index revisoes_internas_relatorio_corrigido on public.revisoes_internas (relatorio_corrigido_id);

-- "Corrigida" liga uma versão ou um relatório (ou os dois); "sem alteração" não liga nada corrigido.
alter table public.revisoes_internas drop constraint revisoes_corrigida_completa;
alter table public.revisoes_internas add constraint revisoes_corrigida_completa check (
  (resultado = 'corrigida' and escopo is not null and (versao_corrigida_id is not null or relatorio_corrigido_id is not null))
  or (resultado = 'sem_alteracao' and escopo is null and versao_corrigida_id is null and relatorio_corrigido_id is null));

-- O escopo, as versões e os relatórios são do gatilho: quem registra escreve só o resultado e o comentário.
revoke insert, update on public.revisoes_internas from authenticated;
grant insert (processo_id, resultado, comentario) on public.revisoes_internas to authenticated;
grant update (resultado, comentario) on public.revisoes_internas to authenticated;

-- A revisão se registra com o processo numa das duas etapas de revisão (a passagem aberta). O nome fica, para não mexer em
-- quem a chama.
create or replace function private.conferir_revisao_interna_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = p_processo and pa.saiu_em is null and e.codigo in ('revisao_interna', 'revisao_relatorio')) then
    raise exception 'revisao_fora_da_etapa';
  end if;
end $$;

-- A etapa da revisão: a da passagem em que nasceu; sem passagem (a revisão antiga), a Revisão do fluxograma.
create function private.etapa_da_revisao(p_passagem uuid) returns text
language sql stable set search_path = ''
as $$
  select coalesce((select e.codigo from public.passagens pa join public.etapas e on e.id = pa.etapa_id where pa.id = p_passagem),
    'revisao_interna') $$;

-- O relatório numerado de maior número do processo enviado antes de p_fim; nulo se não há (o .pdf antigo e o da histórica
-- não têm número e não contam).
create function private.relatorio_mais_recente(p_processo uuid, p_fim timestamptz) returns public.arquivos_da_versao
language sql stable set search_path = ''
as $$
  select a.* from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id
  where v.processo_id = p_processo and a.numero_do_relatorio is not null and a.enviado_em < p_fim
  order by a.numero_do_relatorio desc limit 1 $$;

-- O relatório numerado de número imediatamente menor que p_numero, no processo; nulo se não há.
create function private.relatorio_anterior(p_processo uuid, p_numero integer) returns uuid
language sql stable set search_path = ''
as $$
  select a.id from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id
  where v.processo_id = p_processo and a.numero_do_relatorio < p_numero
  order by a.numero_do_relatorio desc limit 1 $$;

-- A versão não histórica de número imediatamente menor que p_numero; nula se não há.
create function private.versao_anterior(p_processo uuid, p_numero integer) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = p_processo and not historica and numero < p_numero
  order by numero desc limit 1 $$;

-- "Sem alteração": na Revisão do fluxograma vale para a versão mais recente; na Revisão do relatório, para o relatório
-- numerado mais recente, e a versão revisada é a dele. Sem relatório numerado, recusada.
create function private.preparar_sem_alteracao_da_revisao(nova public.revisoes_internas, p_fim timestamptz)
returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  relatorio public.arquivos_da_versao;
begin
  if private.etapa_da_revisao(nova.passagem_id) <> 'revisao_relatorio' then
    nova.versao_revisada_id := (select id from public.versoes
      where processo_id = nova.processo_id and not historica and enviada_em < p_fim order by numero desc limit 1);
    return nova;
  end if;
  relatorio := private.relatorio_mais_recente(nova.processo_id, p_fim);
  if relatorio.id is null then
    raise exception 'sem_relatorio';
  end if;
  nova.relatorio_revisado_id := relatorio.id;
  nova.versao_revisada_id := relatorio.versao_id;
  return nova;
end $$;

-- "Corrigida" (as duas etapas): a versão em sequência enviada nesta passagem (pela etapa dela) corrige a anterior a ela, e o
-- relatório numerado enviado nesta passagem corrige o anterior a ele; sem versão nova, a versão revisada é a mais recente. O
-- escopo sai do que veio. Nada enviado na passagem (ou sem anterior ao que veio), recusada.
create function private.preparar_corrigida_da_revisao(nova public.revisoes_internas, janela public.passagens, p_fim timestamptz)
returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  versao public.versoes;
  relatorio public.arquivos_da_versao;
begin
  select * into versao from public.versoes v where v.processo_id = nova.processo_id and not v.historica
    and v.etapa_id = janela.etapa_id and v.enviada_em >= coalesce(janela.entrou_em, 'infinity') and v.enviada_em < p_fim
  order by v.numero desc limit 1;
  relatorio := private.relatorio_mais_recente(nova.processo_id, p_fim);
  if relatorio.enviado_em < coalesce(janela.entrou_em, 'infinity') then
    relatorio := null;
  end if;
  nova.versao_corrigida_id := case when private.versao_anterior(nova.processo_id, versao.numero) is not null then versao.id end;
  nova.versao_revisada_id := coalesce(private.versao_anterior(nova.processo_id, versao.numero),
    (select id from public.versoes where processo_id = nova.processo_id and not historica and enviada_em < p_fim
      order by numero desc limit 1));
  nova.relatorio_revisado_id := private.relatorio_anterior(nova.processo_id, relatorio.numero_do_relatorio);
  nova.relatorio_corrigido_id := case when nova.relatorio_revisado_id is not null then relatorio.id end;
  if nova.versao_corrigida_id is null and nova.relatorio_corrigido_id is null then
    raise exception 'corrigida_sem_envio_na_passagem';
  end if;
  nova.escopo := case when nova.versao_corrigida_id is null then 'relatorio'
    when nova.relatorio_corrigido_id is null then 'fluxograma' else 'ambos' end;
  return nova;
end $$;

-- O que a revisão liga, dentro da janela da passagem (ao incluir e ao mudar o resultado): limpa o que é do gatilho e
-- preenche pelo resultado. A revisão antiga, sem passagem, não tem janela: "corrigida" não se aplica a ela.
create or replace function private.preparar_versoes_da_revisao(nova public.revisoes_internas) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  janela public.passagens;
  fim timestamptz;
begin
  select * into janela from public.passagens where id = nova.passagem_id;
  fim := coalesce(janela.saiu_em, 'infinity');
  nova.escopo := null;
  nova.versao_corrigida_id := null;
  nova.relatorio_revisado_id := null;
  nova.relatorio_corrigido_id := null;
  if nova.resultado = 'sem_alteracao' then
    return private.preparar_sem_alteracao_da_revisao(nova, fim);
  end if;
  return private.preparar_corrigida_da_revisao(nova, janela, fim);
end $$;

-- Antes de alterar: perfil, processo em andamento ou concluído (a conferência recusa suspenso e cancelado), comentário
-- aparado e, se o resultado mudou, o que a revisão liga recalculado. O escopo não se escreve (sem privilégio).
create or replace function private.preparar_edicao_da_revisao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado is distinct from old.resultado then
    return private.preparar_versoes_da_revisao(new);
  end if;
  return new;
end $$;

-- O relatório como o evento o guarda: "Relatório V2"; nulo sem ele.
create function private.rotulo_do_relatorio(p_arquivo uuid) returns text
language sql stable set search_path = ''
as $$ select 'Relatório V' || numero_do_relatorio from public.arquivos_da_versao where id = p_arquivo $$;

-- A revisão como o evento a guarda (igual à da migração revisao_interna), agora com a etapa e os relatórios.
create or replace function private.estado_da_revisao(p_revisao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla, 'etapa', private.etapa_da_revisao(r.passagem_id),
    'versao_revisada', 'V' || vr.numero, 'versao_corrigida', 'V' || vc.numero,
    'relatorio_revisado', private.rotulo_do_relatorio(r.relatorio_revisado_id),
    'relatorio_corrigido', private.rotulo_do_relatorio(r.relatorio_corrigido_id), 'resultado', r.resultado,
    'escopo', r.escopo, 'comentario', r.comentario, 'revisor_nome', u.nome, 'revisada_em', r.revisada_em)
  from public.revisoes_internas r
  join public.processos p on p.id = r.processo_id
  join public.setores s on s.id = p.setor_id
  join public.versoes vr on vr.id = r.versao_revisada_id
  left join public.versoes vc on vc.id = r.versao_corrigida_id
  join public.usuarios u on u.id = r.revisor_id
  where r.id = p_revisao $$;

-- O evento da edição (igual ao da migração registrar_revisao_e_aprovacao), com os relatórios de antes.
create or replace function private.registrar_evento_da_revisao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'revisao_interna', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_revisao(new.id) || jsonb_build_object('resultado', old.resultado, 'escopo', old.escopo,
      'comentario', old.comentario, 'versao_revisada', (select 'V' || numero from public.versoes where id = old.versao_revisada_id),
      'versao_corrigida', (select 'V' || numero from public.versoes where id = old.versao_corrigida_id),
      'relatorio_revisado', private.rotulo_do_relatorio(old.relatorio_revisado_id),
      'relatorio_corrigido', private.rotulo_do_relatorio(old.relatorio_corrigido_id)),
    'depois', private.estado_da_revisao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.etapa_da_revisao(uuid), private.relatorio_mais_recente(uuid, timestamptz),
  private.relatorio_anterior(uuid, integer), private.versao_anterior(uuid, integer),
  private.preparar_sem_alteracao_da_revisao(public.revisoes_internas, timestamptz),
  private.preparar_corrigida_da_revisao(public.revisoes_internas, public.passagens, timestamptz),
  private.rotulo_do_relatorio(uuid)
  from public, anon;
grant execute on function private.etapa_da_revisao(uuid), private.relatorio_mais_recente(uuid, timestamptz),
  private.relatorio_anterior(uuid, integer), private.versao_anterior(uuid, integer),
  private.preparar_sem_alteracao_da_revisao(public.revisoes_internas, timestamptz),
  private.preparar_corrigida_da_revisao(public.revisoes_internas, public.passagens, timestamptz),
  private.rotulo_do_relatorio(uuid)
  to authenticated;
