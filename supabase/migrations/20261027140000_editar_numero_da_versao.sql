-- Editar número da versão (travas-em-avisos, ticket 03; ADR 0028): Administrador e Integrante ativos trocam o número de qualquer
-- versão (histórica, piloto, em sequência, a aprovada), com o processo em andamento e não arquivado. Muda só o número, nunca o
-- tipo; o nome guardado dos arquivos da versão (fluxogramas, relatórios ligados a ela e o .pdf atual da aprovação) acompanha o
-- rótulo; um evento por edição, com o antes e o depois. Não destrutiva: só concede privilégios de coluna, cria uma política,
-- funções e um gatilho e recria três funções de gatilho com a saída pela marca da função. Nenhum dado é tocado.
-- Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts). Reaproveita private.pode_alterar_cadastros().

-- Os privilégios deixam a função gravar (ela não é security definer); a marca, ligada só dentro dela, é o que os gatilhos
-- conferem: fora da função o número e o nome não mudam. O tipo (historica, piloto) segue sem privilégio de alteração.
grant update (numero) on public.versoes to authenticated;
grant update (nome) on public.arquivos_da_versao, public.pdfs_da_aprovacao to authenticated;

create policy "versoes: administrador e integrante ativos alteram" on public.versoes
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create function private.renumerando() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.renumerando', true), '') = 'on' $$;

create function private.conferir_numero_da_versao_pela_funcao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.numero is distinct from old.numero and not private.renumerando() then
    raise exception 'numero_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_numero_da_versao_pela_funcao before update of numero on public.versoes
  for each row execute function private.conferir_numero_da_versao_pela_funcao();

-- Um evento por edição: o rótulo de antes e o de depois (V7 para V5, V3F para V2F), com o processo e o setor como nos demais
-- eventos de versão. A referência é o id do processo.
create function private.registrar_evento_do_numero_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  letra text := case when new.historica then 'F' when new.piloto then 'P' else '' end;
  base jsonb := (select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla)
    from public.processos p join public.setores s on s.id = p.setor_id where p.id = new.processo_id);
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'alterar_numero', 'versao', new.processo_id::text,
    jsonb_build_object('antes', base || jsonb_build_object('rotulo', 'V' || old.numero || letra),
      'depois', base || jsonb_build_object('rotulo', 'V' || new.numero || letra)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_numero_da_versao after update of numero on public.versoes
  for each row when (old.numero is distinct from new.numero) execute function private.registrar_evento_do_numero_da_versao();

-- Arquivo de versão aprovada não se substitui (ADR 0011), mas a edição do número renomeia os arquivos dela.
create or replace function private.bloquear_troca_em_versao_aprovada() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if private.renumerando() then
    return new;
  end if;
  if exists (select 1 from public.aprovacoes where versao_id = old.versao_id) then
    raise exception 'versao_aprovada:%', (select numero from public.versoes where id = old.versao_id);
  end if;
  return new;
end $$;

-- Igual à da migração relatorio_numerado, com a troca de nome na frente: o nome só muda pela função, e então autor e data do
-- envio ficam como estão (a histórica, somente leitura para arquivos, também se renomeia).
create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  da_versao record;
begin
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome then
    if not private.renumerando() then
      raise exception 'nome_so_pela_funcao';
    end if;
    return new;
  end if;
  select processo_id, historica, enviada_em into da_versao from public.versoes where id = new.versao_id;
  perform private.conferir_processo_que_recebe_versao(da_versao.processo_id);
  if da_versao.historica and (tg_op = 'UPDATE' or da_versao.enviada_em <> now()) then
    raise exception 'versao_historica_somente_leitura';
  end if;
  if tg_op = 'INSERT' then
    if new.papel in ('png', 'bpmn') and da_versao.enviada_em <> now() then
      perform private.conferir_acrescimo_a_versao(new.versao_id);
    end if;
    if new.papel = 'relatorio' and not da_versao.historica then
      new.numero_do_relatorio := private.numerar_relatorio_novo(new.versao_id, new.formato);
    end if;
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- Igual à da migração substituir_arquivo; trocar só o nome (edição do número) não é substituição.
create or replace function private.registrar_evento_da_substituicao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  versao jsonb;
begin
  if private.renumerando() then
    return null;
  end if;
  versao := private.estado_da_versao(new.versao_id);
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'substituir', 'versao',
    (select processo_id::text from public.versoes where id = new.versao_id),
    jsonb_build_object(
      'antes', jsonb_build_object('nome', old.nome, 'hash_md5', old.hash_md5),
      'depois', jsonb_build_object('rotulo', versao -> 'rotulo', 'processo_nome', versao -> 'processo_nome',
        'setor_sigla', versao -> 'setor_sigla', 'nome', new.nome, 'hash_md5', new.hash_md5)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Igual à da migração data_da_validacao_e_pdf_da_aprovacao, com a troca de nome na frente (só pela função; autor e data ficam).
create or replace function private.preparar_pdf_da_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome then
    if not private.renumerando() then
      raise exception 'nome_so_pela_funcao';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.guardado_em is distinct from old.guardado_em then
    return new;
  end if;
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para enviar o .pdf da aprovação' using errcode = '42501';
  end if;
  select a.processo_id into processo from public.aprovacoes a where a.id = new.aprovacao_id;
  if processo is null then
    raise exception 'sem_aprovacao_para_o_pdf';
  end if;
  perform private.conferir_processo_em_andamento(processo);
  if tg_op = 'INSERT' then
    if exists (select 1 from public.pdfs_da_aprovacao where aprovacao_id = new.aprovacao_id and guardado_em is null) then
      raise exception 'pdf_ja_enviado';
    end if;
    new.versao_id := (select versao_id from public.aprovacoes where id = new.aprovacao_id);
    perform private.conferir_nome_do_pdf(new.nome, new.versao_id);
  elsif old.guardado_em is not null then
    raise exception 'pdf_guardado_nao_se_altera';
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- O nome com o rótulo trocado: o primeiro "_V7_" (ou "_V7F_", "_V7P_") do nome padrão vira o novo; nome sem o rótulo fica como está.
create function private.nome_com_o_rotulo_novo(p_nome text, p_rotulo_antigo text, p_rotulo_novo text) returns text
language sql immutable set search_path = ''
as $$
  select case when strpos(p_nome, p_rotulo_antigo) = 0 then p_nome
    else substr(p_nome, 1, strpos(p_nome, p_rotulo_antigo) - 1) || p_rotulo_novo
      || substr(p_nome, strpos(p_nome, p_rotulo_antigo) + length(p_rotulo_antigo)) end $$;

-- Troca o número da versão e o nome dos arquivos dela, chamada pela função arquivos-no-drive com o login de quem chamou depois
-- de renomear no Drive. Sem security definer: a RLS decide; o perfil é conferido antes para a Consulta não ver "zero linhas"
-- como sucesso. p_numero_esperado é o número que a tela viu: se mudou, nada é gravado. Versão que quem chama não enxerga é falta
-- de permissão (42501), como no download. O .pdf guardado de uma aprovação trocada não se renomeia (é histórico).
create function public.editar_numero_da_versao(p_versao uuid, p_numero_esperado integer, p_numero_novo integer) returns void
language plpgsql set search_path = ''
as $$
declare
  atual record;
  outro text;
  letra text;
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar o número da versão' using errcode = '42501';
  end if;
  select processo_id, numero, historica, piloto into atual from public.versoes where id = p_versao;
  if not found then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  if exists (select 1 from public.processos where id = atual.processo_id and arquivado_em is not null) then
    raise exception 'processo_arquivado';
  end if;
  perform private.conferir_processo_que_recebe_versao(atual.processo_id);
  if p_numero_novo is null or p_numero_novo < 1 or p_numero_novo = atual.numero then
    raise exception 'numero_invalido:%', p_numero_novo;
  end if;
  if p_numero_esperado is distinct from atual.numero then
    raise exception 'numero_da_versao_alterado:%', atual.numero;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(atual.processo_id::text, 11));
  select 'V' || numero || case when historica then 'F' when piloto then 'P' else '' end into outro
  from public.versoes where processo_id = atual.processo_id and numero = p_numero_novo;
  if outro is not null then
    raise exception 'numero_ja_usado:%', outro;
  end if;
  letra := case when atual.historica then 'F' when atual.piloto then 'P' else '' end;
  perform set_config('ep.renumerando', 'on', true);
  update public.versoes set numero = p_numero_novo where id = p_versao;
  update public.arquivos_da_versao
  set nome = private.nome_com_o_rotulo_novo(nome, '_V' || atual.numero || letra || '_', '_V' || p_numero_novo || letra || '_')
  where versao_id = p_versao;
  update public.pdfs_da_aprovacao
  set nome = private.nome_com_o_rotulo_novo(nome, '_V' || atual.numero || '_', '_V' || p_numero_novo || '_')
  where versao_id = p_versao and guardado_em is null;
  perform set_config('ep.renumerando', 'off', true);
end $$;

revoke execute on function public.editar_numero_da_versao(uuid, integer, integer) from public, anon;
grant execute on function public.editar_numero_da_versao(uuid, integer, integer) to authenticated;
-- Chamadas de dentro de funções e gatilhos que rodam com a permissão de quem grava.
revoke execute on function private.renumerando(), private.nome_com_o_rotulo_novo(text, text, text) from public, anon;
grant execute on function private.renumerando(), private.nome_com_o_rotulo_novo(text, text, text) to authenticated;
revoke execute on function private.conferir_numero_da_versao_pela_funcao(), private.registrar_evento_do_numero_da_versao()
  from public, anon, authenticated;
