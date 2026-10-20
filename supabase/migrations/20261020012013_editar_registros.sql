-- Editar revisões e aprovação (revisoes-aprovacao, ticket 04; ADR 0015). Não destrutiva: privilégio por coluna, políticas
-- de alterar e gatilhos novos nas duas tabelas; nenhum dado existente muda. As recusas chegam à interface como
-- "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts). Só se alteram o escopo e o comentário da revisão e o
-- número, o link e a data da aprovação: o resto (versão, resultado, revisor, datas preenchidas, quem registrou) continua
-- sem privilégio de alterar (42501). Reaproveita private.pode_alterar_cadastros(), private.conferir_processo_em_andamento(),
-- private.conferir_link_da_aprovacao(), private.conferir_data_da_aprovacao(), private.estado_da_revisao() e
-- private.estado_da_aprovacao().

-- ===== Revisões =====

grant update (escopo, comentario) on public.revisoes_internas to authenticated;
create policy "revisoes_internas: administrador e integrante ativos alteram" on public.revisoes_internas
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Antes de alterar: perfil, processo em andamento, comentário aparado (vazio vira nulo) e escopo coerente com o resultado
-- (a restrição da tabela também o exige, mas com uma mensagem crua: aqui a recusa já vem com o código da tela).
create function private.preparar_edicao_da_revisao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado = 'corrigida' and new.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  if new.resultado = 'sem_alteracao' and new.escopo is not null then
    raise exception 'escopo_so_na_corrigida';
  end if;
  return new;
end $$;

create trigger preparar_edicao_da_revisao before update on public.revisoes_internas
  for each row execute function private.preparar_edicao_da_revisao();

-- O evento guarda o estado de agora (depois) e o mesmo estado com os campos editáveis de antes: só eles mudam.
create function private.registrar_evento_da_revisao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'revisao_interna', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_revisao(new.id) || jsonb_build_object('escopo', old.escopo, 'comentario', old.comentario),
    'depois', private.estado_da_revisao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- "when": salvar sem mudar nada não vira evento.
create trigger registrar_evento_da_revisao_editada after update on public.revisoes_internas
  for each row when (old.escopo is distinct from new.escopo or old.comentario is distinct from new.comentario)
  execute function private.registrar_evento_da_revisao_editada();

-- ===== Aprovação =====

grant update (numero_eprotocolo, link, aprovada_em) on public.aprovacoes to authenticated;
create policy "aprovacoes: administrador e integrante ativos alteram" on public.aprovacoes
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Antes de alterar: perfil, processo em andamento, número e link aparados (vazio vira nulo), link http(s) e data nunca no
-- futuro nem antes da última revisão interna (conferida sempre, como na inclusão).
create function private.preparar_edicao_da_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar a aprovação' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  new.numero_eprotocolo := nullif(btrim(new.numero_eprotocolo), '');
  new.link := nullif(btrim(new.link), '');
  perform private.conferir_link_da_aprovacao(new.link);
  perform private.conferir_data_da_aprovacao(new.processo_id, new.aprovada_em);
  return new;
end $$;

create trigger preparar_edicao_da_aprovacao before update on public.aprovacoes
  for each row execute function private.preparar_edicao_da_aprovacao();

-- O evento guarda o estado de agora (depois) e o mesmo estado com os campos editáveis de antes.
create function private.registrar_evento_da_aprovacao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'aprovacao', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_aprovacao(new.id) || jsonb_build_object('numero_eprotocolo', old.numero_eprotocolo,
      'link', old.link, 'aprovada_em', old.aprovada_em),
    'depois', private.estado_da_aprovacao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_aprovacao_editada after update on public.aprovacoes
  for each row when (old.numero_eprotocolo is distinct from new.numero_eprotocolo or old.link is distinct from new.link
    or old.aprovada_em is distinct from new.aprovada_em)
  execute function private.registrar_evento_da_aprovacao_editada();

revoke execute on function private.preparar_edicao_da_revisao(), private.preparar_edicao_da_aprovacao()
  from public, anon;
grant execute on function private.preparar_edicao_da_revisao(), private.preparar_edicao_da_aprovacao()
  to authenticated;
-- Chamadas só pelos gatilhos de evento (security definer).
revoke execute on function private.registrar_evento_da_revisao_editada(), private.registrar_evento_da_aprovacao_editada()
  from public, anon, authenticated;
