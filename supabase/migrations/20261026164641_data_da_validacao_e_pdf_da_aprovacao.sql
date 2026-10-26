-- Data da validação e .pdf da aprovação (revisoes-aprovacao, ticket 06; ADRs 0007, 0011 e 0023). Não destrutiva: coluna
-- nova em processos, tabela nova, funções novas, a view recriada com uma coluna no fim e o evento da troca da aprovação
-- recriado com o .pdf que ficou guardado. Nenhum dado existente muda. As recusas chegam à interface como "motivo:valor"
-- em P0001 (src/processos/recusasDoBanco.ts). Reaproveita private.pode_alterar_cadastros(), private.usuario_ativo(),
-- private.hoje(), private.conferir_processo_em_andamento(), private.registrando_aprovacao() e private.estado_da_aprovacao().

-- ===== Data da validação =====

alter table public.processos add column data_da_validacao date;

-- O privilégio deixa a função gravar (ela não é security definer); a marca, ligada só dentro dela, é o que o gatilho
-- confere: fora da função a coluna não muda.
grant update (data_da_validacao) on public.processos to authenticated;

create function private.gravando_data_da_validacao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.gravando_data_da_validacao', true), '') = 'on' $$;

create function private.conferir_data_da_validacao_pela_funcao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.data_da_validacao is distinct from old.data_da_validacao and not private.gravando_data_da_validacao() then
    raise exception 'data_da_validacao_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_data_da_validacao_pela_funcao before update of data_da_validacao on public.processos
  for each row execute function private.conferir_data_da_validacao_pela_funcao();

-- Um evento por mudança: "registrar" quando estava vazia, "alterar" nas demais (inclusive apagar, que deixa o depois vazio).
create function private.registrar_evento_da_data_da_validacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
begin
  if new.data_da_validacao is not distinct from old.data_da_validacao then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case when old.data_da_validacao is null then 'registrar_data_da_validacao' else 'alterar_data_da_validacao' end,
    'processo', new.id::text,
    jsonb_build_object('antes', base || jsonb_build_object('data_da_validacao', old.data_da_validacao),
      'depois', base || jsonb_build_object('data_da_validacao', new.data_da_validacao)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_data_da_validacao after update of data_da_validacao on public.processos
  for each row execute function private.registrar_evento_da_data_da_validacao();

-- A data só vale com o processo na Validação com o setor (mesmo desenho de conferir_aprovacao_em_andamento).
create function private.conferir_validacao_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.passagens pa join public.etapas e on e.id = pa.etapa_id
    where pa.processo_id = p_processo and pa.saiu_em is null and e.codigo = 'revisao_setor') then
    raise exception 'data_so_na_validacao';
  end if;
end $$;

-- Registra, altera ou apaga (p_data nula) a data da validação. Sem security definer: a RLS de processos decide, e o perfil
-- é conferido antes para a Consulta não ver "zero linhas" como sucesso.
create function public.registrar_data_da_validacao(p_processo uuid, p_data date) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a data da validação' using errcode = '42501';
  end if;
  if not exists (select 1 from public.processos where id = p_processo) then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_processo_em_andamento(p_processo);
  perform private.conferir_validacao_em_andamento(p_processo);
  if p_data > private.hoje() then
    raise exception 'data_no_futuro:%', p_data;
  end if;
  perform set_config('ep.gravando_data_da_validacao', 'on', true);
  update public.processos set data_da_validacao = p_data where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.gravando_data_da_validacao', 'off', true);
  if linhas = 0 then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
end $$;

-- A view do Quadro e das gavetas, igual à da migração 20261026154356_trava_de_arquivos, mais a data da validação no fim.
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_modelagem_piloto, u.ativo as responsavel_ativo,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.publicado_em, p.arquivado_em,
  pa.etiqueta, pa.entrou_em as entrou_na_etapa_em,
  (select count(*)::int from public.etapas x where x.ativa and x.ordem <= e.ordem) as etapa_atual_posicao,
  p.link_da_publicacao,
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao,
  p.explicacao_sem_publicacao,
  exists (select 1 from public.versoes v where v.processo_id = p.id and v.piloto) as tem_versao_piloto,
  exists (select 1 from public.versoes v where v.processo_id = p.id and not v.historica and not v.piloto)
    as tem_versao_em_sequencia,
  exists (select 1 from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = p.id and f.papel = 'relatorio' and f.numero_do_relatorio is not null) as tem_relatorio_numerado,
  p.data_da_validacao
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join public.passagens pa on pa.processo_id = p.id and pa.saiu_em is null
left join public.etapas e on e.id = pa.etapa_id
left join public.usuarios u on u.id = p.responsavel_id
left join lateral (
  select v.numero, v.historica,
    exists (select 1 from public.arquivos_da_versao f where f.versao_id = v.id and f.papel = 'relatorio') as tem_relatorio
  from public.versoes v
  where v.processo_id = p.id
  order by v.numero desc
  limit 1
) ultima on true;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

-- ===== .pdf da aprovação =====

-- O .pdf protocolado de uma aprovação, guardado no Drive (sem Storage). Um atual por aprovação; o da aprovação trocada fica
-- guardado (guardado_em) e nunca se apaga. A versão (que dá o nome), quem enviou e quando são do banco.
create table public.pdfs_da_aprovacao (
  id uuid primary key default gen_random_uuid(),
  aprovacao_id uuid not null references public.aprovacoes (id) on delete restrict,
  versao_id uuid not null references public.versoes (id) on delete restrict,
  nome text not null constraint pdfs_da_aprovacao_nome check (char_length(nome) between 1 and 300),
  tamanho bigint not null constraint pdfs_da_aprovacao_tamanho check (tamanho between 1 and 20971520),
  hash_md5 text not null constraint pdfs_da_aprovacao_hash_md5 check (hash_md5 ~ '^[0-9a-f]{32}$'),
  drive_id text not null constraint pdfs_da_aprovacao_drive_id check (drive_id ~ '^[A-Za-z0-9_-]{1,200}$'),
  enviado_por uuid not null references public.usuarios (id) on delete restrict,
  enviado_em timestamptz not null default now(),
  guardado_em timestamptz
);

create unique index pdfs_da_aprovacao_um_atual on public.pdfs_da_aprovacao (aprovacao_id) where guardado_em is null;

alter table public.pdfs_da_aprovacao enable row level security;

-- Visitante nada; logado lê e inclui; do .pdf só o conteúdo muda (tamanho, hash, autor e data, na substituição). Ninguém apaga.
revoke all on public.pdfs_da_aprovacao from anon, authenticated;
grant select on public.pdfs_da_aprovacao to authenticated;
grant insert (aprovacao_id, nome, tamanho, hash_md5, drive_id) on public.pdfs_da_aprovacao to authenticated;
grant update (tamanho, hash_md5, enviado_por, enviado_em) on public.pdfs_da_aprovacao to authenticated;

create policy "pdfs_da_aprovacao: ativo lê" on public.pdfs_da_aprovacao
  for select to authenticated using ((select private.usuario_ativo()));
create policy "pdfs_da_aprovacao: administrador e integrante ativos criam" on public.pdfs_da_aprovacao
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "pdfs_da_aprovacao: administrador e integrante ativos alteram" on public.pdfs_da_aprovacao
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- O nome do Drive leva a versão aprovada (CEE_V8_...): um pedido montado fora da tela não grava um nome que mente.
create function private.conferir_nome_do_pdf(p_nome text, p_versao uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if position('_V' || (select numero from public.versoes where id = p_versao) || '_' in p_nome) = 0 then
    raise exception 'pdf_nome_sem_versao:%', p_nome;
  end if;
end $$;

-- Antes de incluir ou trocar o conteúdo: perfil, processo em andamento ou concluído e não arquivado (a regra do editar a
-- aprovação), um .pdf atual por aprovação, versão da aprovação, nome com a versão, autor e data de quem grava. O guardado
-- (a aprovação trocada) muda só pelo gatilho da aprovação, que preenche guardado_em: esse caso segue sem as conferências.
create function private.preparar_pdf_da_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
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

create trigger preparar_pdf_da_aprovacao before insert or update on public.pdfs_da_aprovacao
  for each row execute function private.preparar_pdf_da_aprovacao();

-- Um evento por .pdf enviado e por troca de conteúdo (o hash de antes é o que prova depois que ele mudou). O "depois"
-- leva a versão e o processo, como o da aprovação, para o histórico nomear o item.
create function private.registrar_evento_do_pdf_da_aprovacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.estado_da_aprovacao(new.aprovacao_id);
  antes jsonb := case when tg_op = 'UPDATE' then jsonb_build_object('nome', old.nome, 'hash_md5', old.hash_md5) end;
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when tg_op = 'INSERT' then 'enviar_pdf' else 'substituir_pdf' end, 'aprovacao',
    (select processo_id::text from public.aprovacoes where id = new.aprovacao_id),
    jsonb_build_object('antes', antes, 'depois', base || jsonb_build_object('nome', new.nome, 'hash_md5', new.hash_md5)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_pdf_enviado after insert on public.pdfs_da_aprovacao
  for each row execute function private.registrar_evento_do_pdf_da_aprovacao();
create trigger registrar_evento_do_pdf_substituido after update on public.pdfs_da_aprovacao
  for each row when (old.hash_md5 is distinct from new.hash_md5 or old.tamanho is distinct from new.tamanho)
  execute function private.registrar_evento_do_pdf_da_aprovacao();

-- A aprovação nova (registrar_aprovacao liga a marca) deixa o .pdf atual da anterior guardado. clock_timestamp: o evento da
-- troca acha o .pdf guardado agora pelo instante do comando. O nome do gatilho vem antes do do evento (ordem alfabética).
create function private.guardar_pdf_da_aprovacao_trocada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.registrando_aprovacao() then
    return null;
  end if;
  update public.pdfs_da_aprovacao set guardado_em = clock_timestamp() where aprovacao_id = new.id and guardado_em is null;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger guardar_pdf_da_aprovacao_trocada after update on public.aprovacoes
  for each row execute function private.guardar_pdf_da_aprovacao_trocada();

-- Igual à da migração 20261024182706_registrar_revisao_e_aprovacao, com o .pdf que ficou guardado nesta troca no antes.
create or replace function private.registrar_evento_da_aprovacao_substituida() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  pdf record;
begin
  if not private.registrando_aprovacao() then
    return null;
  end if;
  select p.id, p.nome into pdf from public.pdfs_da_aprovacao p
  where p.aprovacao_id = new.id and p.guardado_em >= statement_timestamp() order by p.guardado_em desc limit 1;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'substituir', 'aprovacao', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_aprovacao(new.id) || jsonb_build_object('versao', (select 'V' || numero from public.versoes where id = old.versao_id),
      'numero_eprotocolo', old.numero_eprotocolo, 'link', old.link, 'aprovada_em', old.aprovada_em,
      'registrada_por_nome', (select nome from public.usuarios where id = old.registrada_por))
      || case when pdf.id is null then '{}'::jsonb else jsonb_build_object('pdf_id', pdf.id, 'pdf_nome', pdf.nome) end,
    'depois', private.estado_da_aprovacao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Inclui o .pdf da aprovação do processo, chamada pela função arquivos-no-drive com o login de quem chamou. Sem security
-- definer: a RLS e o gatilho decidem. `p_arquivo` traz o que o Drive informou (nome, tamanho, MD5 e identificador).
create function public.registrar_pdf_da_aprovacao(p_processo uuid, p_arquivo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  aprovacao uuid;
  novo uuid;
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para enviar o .pdf da aprovação' using errcode = '42501';
  end if;
  select id into aprovacao from public.aprovacoes where processo_id = p_processo;
  if aprovacao is null then
    raise exception 'sem_aprovacao_para_o_pdf';
  end if;
  insert into public.pdfs_da_aprovacao (aprovacao_id, nome, tamanho, hash_md5, drive_id)
  values (aprovacao, p_arquivo ->> 'nome', (p_arquivo ->> 'tamanho')::bigint, p_arquivo ->> 'hash_md5', p_arquivo ->> 'drive_id')
  returning id into novo;
  return novo;
end $$;

-- Troca o conteúdo do .pdf atual (mesmo arquivo do Drive, sem guardar o anterior, ADR 0007): só tamanho, hash, autor e data.
-- O formato novo precisa ser .pdf. .pdf que quem chama não enxerga, ou já guardado, é falta de permissão (42501).
create function public.substituir_pdf_da_aprovacao(p_pdf uuid, p_novo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para substituir o .pdf da aprovação' using errcode = '42501';
  end if;
  if not exists (select 1 from public.pdfs_da_aprovacao where id = p_pdf and guardado_em is null) then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  if coalesce(p_novo ->> 'formato', '') <> 'pdf' then
    raise exception 'tipo_de_arquivo_diferente:pdf';
  end if;
  update public.pdfs_da_aprovacao set tamanho = (p_novo ->> 'tamanho')::bigint, hash_md5 = p_novo ->> 'hash_md5'
  where id = p_pdf;
  if not found then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  return p_pdf;
end $$;

revoke execute on function public.registrar_data_da_validacao(uuid, date), public.registrar_pdf_da_aprovacao(uuid, jsonb),
  public.substituir_pdf_da_aprovacao(uuid, jsonb), private.gravando_data_da_validacao(),
  private.conferir_data_da_validacao_pela_funcao(), private.conferir_validacao_em_andamento(uuid),
  private.conferir_nome_do_pdf(text, uuid), private.preparar_pdf_da_aprovacao() from public, anon;
grant execute on function public.registrar_data_da_validacao(uuid, date), public.registrar_pdf_da_aprovacao(uuid, jsonb),
  public.substituir_pdf_da_aprovacao(uuid, jsonb), private.gravando_data_da_validacao(),
  private.conferir_data_da_validacao_pela_funcao(), private.conferir_validacao_em_andamento(uuid),
  private.conferir_nome_do_pdf(text, uuid), private.preparar_pdf_da_aprovacao() to authenticated;
-- Chamadas só pelos gatilhos de evento e de guardar (security definer).
revoke execute on function private.registrar_evento_da_data_da_validacao(), private.registrar_evento_do_pdf_da_aprovacao(),
  private.guardar_pdf_da_aprovacao_trocada() from public, anon, authenticated;
