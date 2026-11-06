-- Importação dos dados atuais, ticket 01 (ADR 0044). Não destrutiva: cria importar_processo, que o Administrador chama uma vez por
-- processo da planilha. Cada chamada é uma transação (o processo entra inteiro ou não entra), cria setor e macroprocesso só se
-- faltam, pula o processo que já existe e nunca altera o que existe. A marca de sessão ep.importando_etapa (o código da etapa,
-- ligada só dentro da função) faz o cadastro abrir a passagem já na etapa certa, com o responsável inicial dela, e deixa de
-- gravar o evento "criar": a função grava o único evento "importar". Quem não é Administrador ativo recebe 42501; etapa que não
-- existe ou está inativa, "etapa_invalida:<código>" em P0001 (padrão "motivo:valor").

-- Igual à da migração andamento_livre_mover, com uma troca: a etapa e a etiqueta vêm da marca quando há importação.
create or replace function private.abrir_primeira_passagem() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_codigo text := coalesce(nullif(current_setting('ep.importando_etapa', true), ''), 'nao_iniciados');
begin
  perform set_config('ep.movendo_processo', 'cadastro', true);
  insert into public.passagens (processo_id, etapa_id, etiqueta)
  values (new.id, (select id from public.etapas where codigo = v_codigo),
    (case when v_codigo = 'nao_iniciados' then 'a_fazer' else 'concluido' end)::public.etiqueta_da_etapa);
  perform set_config('ep.movendo_processo', '', true);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Igual à da migração responsavel_inicial_por_etapa, com uma troca: na importação vale o responsável inicial da etapa de destino
-- (nulo em Concluídos), e não o de Não iniciados.
create or replace function private.dar_responsavel_inicial_ao_cadastrar() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.responsavel_id := private.responsavel_inicial_valido((select id from public.etapas
    where codigo = coalesce(nullif(current_setting('ep.importando_etapa', true), ''), 'nao_iniciados')));
  return new;
end $$;

-- Igual à da migração subprocessos_e_reclassificacao, com uma troca: durante a importação não grava nada (a função grava o
-- evento "importar").
create or replace function private.registrar_evento_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'UPDATE' then private.estado_do_processo(old) end;
  depois jsonb := private.estado_do_processo(new);
  motivo text := coalesce(
    case when private.mudando_situacao() then nullif(current_setting('ep.motivo_da_situacao', true), '') end,
    case when private.reclassificando() then nullif(current_setting('ep.motivo_da_reclassificacao', true), '') end);
begin
  if antes = depois or coalesce(current_setting('ep.importando_etapa', true), '') <> '' then
    return null; -- gravação sem mudança não vira evento; a importação tem o evento dela
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_processo(tg_op, antes, depois), 'processo', new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois)
      || case when motivo is not null then jsonb_build_object('motivo', motivo) else '{}'::jsonb end);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- O único registro da importação no histórico: quem importou (autor) e a etapa em que o processo entrou.
create function private.registrar_importacao(p_processo public.processos, p_etapa public.etapas) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'importar', 'processo', p_processo.id::text, jsonb_build_object('antes', null,
    'depois', private.estado_do_processo(p_processo)
      || jsonb_build_object('etapa_codigo', p_etapa.codigo, 'etapa_nome', p_etapa.nome)));
end $$;

-- O setor (sigla em qualquer caixa) e o macroprocesso (nome em qualquer caixa) que já existem; senão, os cria. O setor novo
-- leva a própria sigla como nome (completa-se depois em Cadastros); o macroprocesso, só o nome.
create function private.setor_da_importacao(p_sigla text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := (select id from public.setores where upper(sigla) = upper(btrim(p_sigla)));
begin
  if v_id is null then
    insert into public.setores (sigla, nome) values (btrim(p_sigla), btrim(p_sigla)) returning id into v_id;
  end if;
  return v_id;
end $$;

create function private.macroprocesso_da_importacao(p_nome text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := (select id from public.macroprocessos where lower(nome) = lower(btrim(p_nome)));
begin
  if v_id is null then
    insert into public.macroprocessos (nome) values (btrim(p_nome)) returning id into v_id;
  end if;
  return v_id;
end $$;

-- Grava o processo na etapa pedida (com a Data da Publicação, a data do piloto e a anotação, quando vierem). Em Concluídos o
-- processo já entra tirado do Quadro: a marca vem depois da entrada, que é o que a view compara.
create function private.importar_processo(p_setor text, p_macroprocesso text, p_nome text, p_etapa text,
  p_data_da_publicacao date, p_data_da_modelagem_piloto date, p_anotacoes text) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_etapa public.etapas;
  v_setor uuid;
  v_processo public.processos;
begin
  if not (private.perfil_atual() = 'administrador' and private.usuario_ativo()) then
    raise exception 'sem permissão para importar' using errcode = '42501';
  end if;
  select * into v_etapa from public.etapas where codigo = p_etapa and ativa;
  if not found then
    raise exception 'etapa_invalida:%', p_etapa;
  end if;
  v_setor := (select id from public.setores where upper(sigla) = upper(btrim(p_setor)));
  if exists (select 1 from public.processos where setor_id = v_setor and lower(nome) = lower(btrim(p_nome))) then
    return 'ja_existia';
  end if;
  perform set_config('ep.importando_etapa', v_etapa.codigo, true);
  insert into public.processos (setor_id, macroprocesso_id, nome, publicado_em, data_da_modelagem_piloto, anotacoes)
  values (private.setor_da_importacao(p_setor), private.macroprocesso_da_importacao(p_macroprocesso), p_nome,
    p_data_da_publicacao, p_data_da_modelagem_piloto, p_anotacoes)
  returning * into v_processo;
  if v_etapa.codigo = 'concluidos' then
    perform private.gravar_tirada_do_quadro(v_processo.id, clock_timestamp());
  end if;
  perform private.registrar_importacao(v_processo, v_etapa);
  perform set_config('ep.importando_etapa', '', true);
  return 'criado';
end $$;

-- A de public só repassa, sem security definer: a conferência de perfil está na privada.
create function public.importar_processo(p_setor text, p_macroprocesso text, p_nome text, p_etapa text,
  p_data_da_publicacao date, p_data_da_modelagem_piloto date, p_anotacoes text) returns text
language sql set search_path = ''
as $$ select private.importar_processo(p_setor, p_macroprocesso, p_nome, p_etapa, p_data_da_publicacao,
  p_data_da_modelagem_piloto, p_anotacoes) $$;

revoke execute on function private.registrar_importacao(public.processos, public.etapas), private.setor_da_importacao(text),
  private.macroprocesso_da_importacao(text) from public, anon, authenticated;
revoke execute on function private.importar_processo(text, text, text, text, date, date, text),
  public.importar_processo(text, text, text, text, date, date, text) from public, anon;
grant execute on function private.importar_processo(text, text, text, text, date, date, text),
  public.importar_processo(text, text, text, text, date, date, text) to authenticated;
