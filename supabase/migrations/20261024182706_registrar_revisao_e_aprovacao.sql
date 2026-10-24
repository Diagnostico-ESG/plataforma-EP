-- Registrar a revisão interna e a aprovação sem trava (revisoes-aprovacao, ticket 05; ADR 0023, que substitui os ADRs 0009
-- e 0015; o ADR 0011 continua). Destrutiva só no que sai: o apagar da aprovação, os gatilhos dela de volta de etapa e as
-- funções da trava do autor. Os registros que já existem ficam como estão (revisão antiga com passagem_id vazio). As
-- recusas chegam à interface como "motivo:valor" em P0001. Reaproveita private.pode_alterar_cadastros(), private.hoje(),
-- private.conferir_processo_em_andamento(), private.id_da_versao_mais_recente() e os estados dos eventos.

-- ===== Revisão interna =====

-- A passagem pela Revisão interna em que a revisão foi registrada; o gatilho a preenche (a coluna fica fora do privilégio
-- de inclusão). Uma revisão por passagem; a antiga fica sem passagem.
alter table public.revisoes_internas add column passagem_id uuid references public.passagens (id) on delete restrict;
create unique index revisoes_internas_uma_por_passagem on public.revisoes_internas (passagem_id) where passagem_id is not null;

grant update (resultado) on public.revisoes_internas to authenticated;

-- As versões que a revisão liga, dentro da janela da passagem. "Sem alteração": a mais recente até o fim da passagem.
-- "Corrigida": a versão mais recente enviada pela Revisão interna desde a entrada (a corrigida) e a anterior a ela (a
-- revisada). A revisão antiga, sem passagem, não tem janela: "corrigida" não se aplica a ela.
create function private.preparar_versoes_da_revisao(nova public.revisoes_internas) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  janela public.passagens;
  fim timestamptz;
  corrigida uuid;
begin
  select * into janela from public.passagens where id = nova.passagem_id;
  fim := coalesce(janela.saiu_em, 'infinity');
  if nova.resultado = 'sem_alteracao' then
    if nova.escopo is not null then
      raise exception 'escopo_so_na_corrigida';
    end if;
    nova.versao_revisada_id := (select id from public.versoes
      where processo_id = nova.processo_id and not historica and enviada_em < fim order by numero desc limit 1);
    nova.versao_corrigida_id := null;
    return nova;
  end if;
  if nova.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  corrigida := (select v.id from public.versoes v join public.etapas e on e.id = v.etapa_id
    where v.processo_id = nova.processo_id and not v.historica and e.codigo = 'revisao_interna'
      and v.enviada_em >= coalesce(janela.entrou_em, 'infinity') and v.enviada_em < fim
    order by v.numero desc limit 1);
  nova.versao_revisada_id := (select id from public.versoes
    where processo_id = nova.processo_id and not historica
      and numero < (select numero from public.versoes where id = corrigida)
    order by numero desc limit 1);
  if corrigida is null or nova.versao_revisada_id is null then
    raise exception 'corrigida_sem_versao_na_passagem';
  end if;
  nova.versao_corrigida_id := corrigida;
  return nova;
end $$;

-- Antes de incluir: perfil, processo em andamento e na Revisão interna, uma revisão por passagem, versão; revisor, dia,
-- passagem e versões preenchidos pelo banco (o que vier é ignorado); comentário aparado, vazio vira nulo. O autor da
-- versão pode revisá-la: a trava saiu (a tela avisa).
create or replace function private.preparar_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  perform private.conferir_revisao_interna_em_andamento(new.processo_id);
  new.passagem_id := (select id from public.passagens where processo_id = new.processo_id and saiu_em is null);
  if exists (select 1 from public.revisoes_internas where passagem_id = new.passagem_id) then
    raise exception 'revisao_ja_registrada';
  end if;
  if private.id_da_versao_mais_recente(new.processo_id) is null then
    raise exception 'sem_versao';
  end if;
  new.revisor_id := (select auth.uid());
  new.revisada_em := private.hoje();
  new.comentario := nullif(btrim(new.comentario), '');
  return private.preparar_versoes_da_revisao(new);
end $$;

-- Antes de alterar: perfil, processo em andamento ou concluído e não arquivado (a conferência recusa suspenso, cancelado e
-- arquivado), comentário aparado, escopo coerente com o resultado e, se o resultado mudou, as versões recalculadas.
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
  if new.resultado = 'corrigida' and new.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  if new.resultado = 'sem_alteracao' and new.escopo is not null then
    raise exception 'escopo_so_na_corrigida';
  end if;
  return new;
end $$;

-- O evento da edição leva o resultado e as versões de antes; "when": salvar sem mudar nada não vira evento.
create or replace function private.registrar_evento_da_revisao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'revisao_interna', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_revisao(new.id) || jsonb_build_object('resultado', old.resultado, 'escopo', old.escopo,
      'comentario', old.comentario, 'versao_revisada', (select 'V' || numero from public.versoes where id = old.versao_revisada_id),
      'versao_corrigida', (select 'V' || numero from public.versoes where id = old.versao_corrigida_id)),
    'depois', private.estado_da_revisao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

drop trigger registrar_evento_da_revisao_editada on public.revisoes_internas;
create trigger registrar_evento_da_revisao_editada after update on public.revisoes_internas
  for each row when (old.resultado is distinct from new.resultado or old.escopo is distinct from new.escopo
    or old.comentario is distinct from new.comentario)
  execute function private.registrar_evento_da_revisao_editada();

drop function private.preparar_sem_alteracao(public.revisoes_internas, uuid), private.preparar_corrigida(public.revisoes_internas, uuid),
  private.autor_da_versao(uuid), private.id_da_versao_anterior(uuid);

-- ===== Aprovação =====

-- Nada se apaga: sai o privilégio, a política e os gatilhos da volta de etapa.
revoke delete on public.aprovacoes from authenticated;
drop policy "aprovacoes: administrador e integrante ativos apagam" on public.aprovacoes;
drop trigger bloquear_apagar_aprovacao on public.aprovacoes;
drop trigger registrar_evento_da_aprovacao_desfeita on public.aprovacoes;
drop function private.bloquear_apagar_aprovacao(), private.registrar_evento_da_aprovacao_desfeita();

-- A versão, quem registrou e quando mudam só dentro de registrar_aprovacao (que não é security definer, então precisa do
-- privilégio): a marca, ligada só dentro da função, é o que o gatilho confere.
grant update (versao_id, registrada_por, registrada_em) on public.aprovacoes to authenticated;

create function private.registrando_aprovacao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.registrando_aprovacao', true), '') = 'on' $$;

-- A data, quando há, não é futura (a ordem contra a última revisão saiu).
create function private.conferir_data_da_aprovacao(p_data date) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if p_data > private.hoje() then
    raise exception 'data_no_futuro:%', p_data;
  end if;
end $$;

-- Antes de incluir: perfil, processo e etapa em andamento, uma aprovação por processo (a troca é da função), versão mais
-- recente de qualquer tipo; a versão e quem registrou vêm do banco; número e link aparados, vazio vira nulo.
create or replace function private.preparar_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a aprovação' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  perform private.conferir_aprovacao_em_andamento(new.processo_id);
  if exists (select 1 from public.aprovacoes where processo_id = new.processo_id) then
    raise exception 'processo_ja_aprovado';
  end if;
  new.versao_id := private.id_da_versao_mais_recente(new.processo_id);
  if new.versao_id is null then
    raise exception 'sem_versao';
  end if;
  new.registrada_por := (select auth.uid());
  new.numero_eprotocolo := nullif(btrim(new.numero_eprotocolo), '');
  new.link := nullif(btrim(new.link), '');
  perform private.conferir_link_da_aprovacao(new.link);
  perform private.conferir_data_da_aprovacao(new.aprovada_em);
  return new;
end $$;

-- Antes de alterar: perfil, processo em andamento ou concluído e não arquivado, número e link aparados, link http(s), data
-- nunca no futuro. Dentro da função, a aprovação toma o lugar da anterior (versão mais recente, quem registrou e quando),
-- com o processo na Aprovação pelo setor; fora dela, essas três colunas não mudam.
create or replace function private.preparar_edicao_da_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar a aprovação' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  if private.registrando_aprovacao() then
    perform private.conferir_aprovacao_em_andamento(new.processo_id);
    new.versao_id := private.id_da_versao_mais_recente(new.processo_id);
    if new.versao_id is null then
      raise exception 'sem_versao';
    end if;
    new.registrada_por := (select auth.uid());
    new.registrada_em := now();
  elsif (new.versao_id, new.registrada_por, new.registrada_em) is distinct from (old.versao_id, old.registrada_por, old.registrada_em) then
    raise exception 'aprovacao_so_pela_funcao';
  end if;
  new.numero_eprotocolo := nullif(btrim(new.numero_eprotocolo), '');
  new.link := nullif(btrim(new.link), '');
  perform private.conferir_link_da_aprovacao(new.link);
  perform private.conferir_data_da_aprovacao(new.aprovada_em);
  return new;
end $$;

drop function private.conferir_data_da_aprovacao(uuid, date);

-- A edição fora da função é "editar"; a troca feita pela função é "substituir" (abaixo).
create or replace function private.registrar_evento_da_aprovacao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if private.registrando_aprovacao() then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'aprovacao', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_aprovacao(new.id) || jsonb_build_object('numero_eprotocolo', old.numero_eprotocolo,
      'link', old.link, 'aprovada_em', old.aprovada_em),
    'depois', private.estado_da_aprovacao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- O evento da troca guarda a aprovação anterior inteira no antes (versão, número, link, data e quem a registrou).
create function private.registrar_evento_da_aprovacao_substituida() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.registrando_aprovacao() then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'substituir', 'aprovacao', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_aprovacao(new.id) || jsonb_build_object('versao', (select 'V' || numero from public.versoes where id = old.versao_id),
      'numero_eprotocolo', old.numero_eprotocolo, 'link', old.link, 'aprovada_em', old.aprovada_em,
      'registrada_por_nome', (select nome from public.usuarios where id = old.registrada_por)),
    'depois', private.estado_da_aprovacao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_aprovacao_substituida after update on public.aprovacoes
  for each row execute function private.registrar_evento_da_aprovacao_substituida();

-- Inclui a aprovação ou, se já há, toma o lugar dela. Sem security definer: a RLS de quem chama decide, e o perfil é
-- conferido antes para a Consulta não ver "zero linhas" como sucesso.
create function public.registrar_aprovacao(p_processo uuid, p_numero text, p_link text, p_data date) returns void
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a aprovação' using errcode = '42501';
  end if;
  if not exists (select 1 from public.aprovacoes where processo_id = p_processo) then
    insert into public.aprovacoes (processo_id, numero_eprotocolo, link, aprovada_em) values (p_processo, p_numero, p_link, p_data);
    return;
  end if;
  perform set_config('ep.registrando_aprovacao', 'on', true);
  update public.aprovacoes set numero_eprotocolo = p_numero, link = p_link, aprovada_em = p_data where processo_id = p_processo;
  perform set_config('ep.registrando_aprovacao', 'off', true);
end $$;

revoke execute on function public.registrar_aprovacao(uuid, text, text, date), private.registrando_aprovacao(),
  private.conferir_data_da_aprovacao(date), private.preparar_versoes_da_revisao(public.revisoes_internas)
  from public, anon;
grant execute on function public.registrar_aprovacao(uuid, text, text, date), private.registrando_aprovacao(),
  private.conferir_data_da_aprovacao(date), private.preparar_versoes_da_revisao(public.revisoes_internas)
  to authenticated;
-- Chamadas só pelos gatilhos de evento (security definer).
revoke execute on function private.registrar_evento_da_aprovacao_substituida() from public, anon, authenticated;
