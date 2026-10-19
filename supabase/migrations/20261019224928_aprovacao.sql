-- Aprovação na janela de concluir (revisoes-aprovacao, ticket 03; ADRs 0011 e 0015). Não destrutiva: tabela, funções e
-- gatilhos novos; o gatilho de conclusão ganha a Aprovação pelo setor; voltar_a_etapa passa a desfazer a aprovação
-- quando a volta é para a Aprovação ou antes dela; arquivos_da_versao ganha a proteção da versão aprovada. As recusas
-- chegam à interface como "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts). A edição da aprovação fica no
-- ticket 04: aqui a tabela só tem leitura, inclusão e exclusão (a exclusão só vale dentro da volta de etapa).
-- Reaproveita private.pode_alterar_cadastros(), private.usuario_ativo(), private.conferir_processo_em_andamento(),
-- private.id_da_versao_mais_recente(), private.conferir_versao_completa() e private.voltando().

create table public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null unique references public.processos (id) on delete restrict,
  versao_id uuid not null references public.versoes (id) on delete restrict,
  numero_eprotocolo text constraint aprovacoes_numero_tamanho check (char_length(numero_eprotocolo) between 1 and 60),
  link text constraint aprovacoes_link_formato check (char_length(link) <= 500 and link ~* '^https?://.+'),
  aprovada_em date,
  registrada_por uuid not null references public.usuarios (id) on delete restrict,
  registrada_em timestamptz not null default now()
);

alter table public.aprovacoes enable row level security;
revoke all on public.aprovacoes from anon, authenticated;
grant select, delete on public.aprovacoes to authenticated;
grant insert (processo_id, numero_eprotocolo, link, aprovada_em) on public.aprovacoes to authenticated;

create policy "aprovacoes: ativo lê" on public.aprovacoes
  for select to authenticated using ((select private.usuario_ativo()));
create policy "aprovacoes: administrador e integrante ativos criam" on public.aprovacoes
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "aprovacoes: administrador e integrante ativos apagam" on public.aprovacoes
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- A Aprovação pelo setor do processo tem de estar em andamento.
create function private.conferir_aprovacao_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p_processo and e.codigo = 'aprovacao_setor' and a.status = 'em_andamento') then
    raise exception 'aprovacao_fora_da_etapa';
  end if;
end $$;

-- O link, quando há, começa com http:// ou https:// e tem até 500 caracteres.
create function private.conferir_link_da_aprovacao(p_link text) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if p_link is not null and (char_length(p_link) > 500 or p_link !~* '^https?://.+') then
    raise exception 'link_invalido';
  end if;
end $$;

-- A data, quando há, não é futura nem anterior à última revisão interna (sem revisão, sem limite inferior).
create function private.conferir_data_da_aprovacao(p_processo uuid, p_data date) returns void
language plpgsql stable set search_path = ''
as $$
declare
  ultima_revisao date := (select max(revisada_em) from public.revisoes_internas where processo_id = p_processo);
begin
  if p_data is null then
    return;
  end if;
  if p_data > current_date then
    raise exception 'data_no_futuro:%', p_data;
  end if;
  if ultima_revisao is not null and p_data < ultima_revisao then
    raise exception 'aprovacao_antes_da_revisao:%:%', p_data, ultima_revisao;
  end if;
end $$;

-- Antes de incluir: perfil, processo e etapa em andamento, uma aprovação por processo, versão mais recente e completa;
-- a versão e quem registrou vêm do banco (o que vier é ignorado); número e link aparados, vazio vira nulo.
create function private.preparar_aprovacao() returns trigger
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
  perform private.conferir_versao_completa(new.processo_id);
  new.versao_id := private.id_da_versao_mais_recente(new.processo_id);
  new.registrada_por := (select auth.uid());
  new.numero_eprotocolo := nullif(btrim(new.numero_eprotocolo), '');
  new.link := nullif(btrim(new.link), '');
  perform private.conferir_link_da_aprovacao(new.link);
  perform private.conferir_data_da_aprovacao(new.processo_id, new.aprovada_em);
  return new;
end $$;

create trigger preparar_aprovacao before insert on public.aprovacoes
  for each row execute function private.preparar_aprovacao();

-- A aprovação só se apaga dentro da volta de etapa (voltar_a_etapa liga ep.voltando). O nome vem antes do gatilho do evento.
create function private.bloquear_apagar_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.voltando() then
    raise exception 'aprovacao_so_se_desfaz_na_volta';
  end if;
  return old;
end $$;

create trigger bloquear_apagar_aprovacao before delete on public.aprovacoes
  for each row execute function private.bloquear_apagar_aprovacao();

-- A aprovação como o evento a guarda: processo, versão como "V8", número, link, data e quem registrou.
create function private.estado_da_aprovacao(p_aprovacao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla, 'versao', 'V' || v.numero,
    'numero_eprotocolo', a.numero_eprotocolo, 'link', a.link, 'aprovada_em', a.aprovada_em, 'registrada_por_nome', u.nome)
  from public.aprovacoes a
  join public.processos p on p.id = a.processo_id
  join public.setores s on s.id = p.setor_id
  join public.versoes v on v.id = a.versao_id
  join public.usuarios u on u.id = a.registrada_por
  where a.id = p_aprovacao $$;

-- Um evento por aprovação registrada; a referência é o id do processo (o histórico do processo lê por ela).
create function private.registrar_evento_da_aprovacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'registrar', 'aprovacao', new.processo_id::text,
    jsonb_build_object('antes', null, 'depois', private.estado_da_aprovacao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_aprovacao after insert on public.aprovacoes
  for each row execute function private.registrar_evento_da_aprovacao();

-- Um evento por aprovação desfeita, com o que ela era. Antes de apagar, porque o estado lê a linha.
create function private.registrar_evento_da_aprovacao_desfeita() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'desfazer', 'aprovacao', old.processo_id::text,
    jsonb_build_object('antes', private.estado_da_aprovacao(old.id), 'depois', null));
  return old;
end $$;

create trigger registrar_evento_da_aprovacao_desfeita before delete on public.aprovacoes
  for each row execute function private.registrar_evento_da_aprovacao_desfeita();

-- Todo perfil ativo lê os eventos de aprovação (políticas de leitura somam).
create policy "eventos: perfil ativo lê as aprovações" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'aprovacao');

-- Processo com aprovação não se exclui. O nome vem antes de conferir_processo_sem_revisoes.
create function private.conferir_processo_sem_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.aprovacoes where processo_id = old.id) then
    raise exception 'processo_com_aprovacao';
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_aprovacao before delete on public.processos
  for each row execute function private.conferir_processo_sem_aprovacao();

-- Arquivo de versão aprovada não se substitui (ADR 0011). O nome vem antes de preparar_arquivo_da_versao.
create function private.bloquear_troca_em_versao_aprovada() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.aprovacoes where versao_id = old.versao_id) then
    raise exception 'versao_aprovada:%', (select numero from public.versoes where id = old.versao_id);
  end if;
  return new;
end $$;

create trigger bloquear_troca_em_versao_aprovada before update on public.arquivos_da_versao
  for each row execute function private.bloquear_troca_em_versao_aprovada();

-- Concluir a Aprovação exige aprovação da versão mais recente.
create function private.conferir_aprovacao_da_versao(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(p_processo);
begin
  if ultima is null then
    raise exception 'sem_versao';
  end if;
  if not exists (select 1 from public.aprovacoes where processo_id = p_processo and versao_id = ultima) then
    raise exception 'sem_aprovacao:%', (select numero from public.versoes where id = ultima);
  end if;
end $$;

-- O gatilho de conclusão do ticket 02, com a Aprovação pelo setor.
create or replace function private.conferir_conclusao_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
declare
  codigo_da_etapa text := (select codigo from public.etapas where id = new.etapa_id);
begin
  if new.status <> 'concluida' or old.status = 'concluida' then
    return new;
  end if;
  if codigo_da_etapa = 'revisao_interna' then
    perform private.conferir_revisao_da_versao(new.processo_id);
  elsif codigo_da_etapa = 'revisao_setor' then
    perform private.conferir_versao_completa(new.processo_id);
  elsif codigo_da_etapa = 'aprovacao_setor' then
    perform private.conferir_aprovacao_da_versao(new.processo_id);
  end if;
  return new;
end $$;

-- Grava a aprovação e conclui a etapa numa transação só: se a conclusão falha, a aprovação não fica. Sem security
-- definer: a RLS de quem chama decide. Outro andamento que não o da Aprovação pelo setor é registro inexistente.
create function public.concluir_aprovacao(p_andamento uuid, p_numero text, p_link text, p_data date, p_responsavel uuid)
returns void
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  select a.processo_id into processo from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.id = p_andamento and e.codigo = 'aprovacao_setor';
  if not found then
    raise exception 'registro_inexistente';
  end if;
  insert into public.aprovacoes (processo_id, numero_eprotocolo, link, aprovada_em)
  values (processo, p_numero, p_link, p_data);
  perform public.avancar_etapa(p_andamento, 'concluir', null, p_responsavel);
end $$;

-- Voltar para a Aprovação ou antes dela desfaz a aprovação (a volta liga ep.voltando, que libera o apagar).
create function private.desfazer_aprovacao_da_volta(escolhido public.andamentos) returns void
language sql set search_path = ''
as $$
  delete from public.aprovacoes
  where processo_id = escolhido.processo_id
    and (select ordem from public.etapas where id = escolhido.etapa_id)
      <= (select ordem from public.etapas where codigo = 'aprovacao_setor') $$;

-- voltar_a_etapa do ticket 14 de processos-etapas, com a aprovação desfeita dentro da volta.
create or replace function public.voltar_a_etapa(p_andamento uuid, p_motivo text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  escolhido public.andamentos;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  select * into escolhido from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_etapa_resolvida(escolhido);
  perform set_config('ep.voltando', 'on', true), set_config('ep.motivo_da_volta', motivo, true);
  perform private.devolver_etapas_seguintes(escolhido);
  perform private.reabrir_etapa(escolhido, p_responsavel);
  perform private.desfazer_aprovacao_da_volta(escolhido);
  perform set_config('ep.voltando', 'off', true), set_config('ep.motivo_da_volta', '', true);
end $$;

revoke execute on function public.concluir_aprovacao(uuid, text, text, date, uuid),
  private.conferir_aprovacao_em_andamento(uuid), private.conferir_link_da_aprovacao(text),
  private.conferir_data_da_aprovacao(uuid, date), private.preparar_aprovacao(), private.bloquear_apagar_aprovacao(),
  private.conferir_processo_sem_aprovacao(), private.bloquear_troca_em_versao_aprovada(),
  private.conferir_aprovacao_da_versao(uuid), private.conferir_conclusao_da_etapa(),
  private.desfazer_aprovacao_da_volta(public.andamentos), public.voltar_a_etapa(uuid, text, uuid)
  from public, anon;
grant execute on function public.concluir_aprovacao(uuid, text, text, date, uuid),
  private.conferir_aprovacao_em_andamento(uuid), private.conferir_link_da_aprovacao(text),
  private.conferir_data_da_aprovacao(uuid, date), private.preparar_aprovacao(), private.bloquear_apagar_aprovacao(),
  private.conferir_processo_sem_aprovacao(), private.bloquear_troca_em_versao_aprovada(),
  private.conferir_aprovacao_da_versao(uuid), private.conferir_conclusao_da_etapa(),
  private.desfazer_aprovacao_da_volta(public.andamentos), public.voltar_a_etapa(uuid, text, uuid)
  to authenticated;
-- Chamadas só pelos gatilhos de evento (security definer).
revoke execute on function private.estado_da_aprovacao(uuid), private.registrar_evento_da_aprovacao(),
  private.registrar_evento_da_aprovacao_desfeita() from public, anon, authenticated;
