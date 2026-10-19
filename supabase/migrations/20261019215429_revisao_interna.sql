-- Revisão interna na janela de concluir (revisoes-aprovacao, ticket 02; ADRs 0014 e 0015). Não destrutiva: tipos,
-- tabela, funções e gatilhos novos; o gatilho de conclusão do ticket 01 ganha a Revisão interna. As recusas chegam à
-- interface como "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts). A edição fica no ticket 04: aqui a
-- tabela só tem leitura e inclusão (nada se altera nem se apaga). Reaproveita private.pode_alterar_cadastros(),
-- private.usuario_ativo(), private.conferir_processo_em_andamento() e private.id_da_versao_mais_recente().

create type public.resultado_da_revisao as enum ('sem_alteracao', 'corrigida');
create type public.escopo_da_correcao as enum ('fluxograma', 'relatorio', 'ambos');

create table public.revisoes_internas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete restrict,
  versao_revisada_id uuid not null references public.versoes (id) on delete restrict,
  versao_corrigida_id uuid references public.versoes (id) on delete restrict,
  resultado public.resultado_da_revisao not null,
  escopo public.escopo_da_correcao,
  comentario text constraint revisoes_comentario_tamanho check (char_length(comentario) <= 2000),
  revisada_em date not null,
  revisor_id uuid not null references public.usuarios (id) on delete restrict,
  registrada_em timestamptz not null default now(),
  constraint revisoes_corrigida_completa check (
    (resultado = 'corrigida' and escopo is not null and versao_corrigida_id is not null)
    or (resultado = 'sem_alteracao' and escopo is null and versao_corrigida_id is null))
);
create index revisoes_internas_processo on public.revisoes_internas (processo_id, registrada_em desc);

alter table public.revisoes_internas enable row level security;
revoke all on public.revisoes_internas from anon, authenticated;
grant select on public.revisoes_internas to authenticated;
grant insert (processo_id, resultado, escopo, comentario) on public.revisoes_internas to authenticated;

create policy "revisoes_internas: ativo lê" on public.revisoes_internas
  for select to authenticated using ((select private.usuario_ativo()));
create policy "revisoes_internas: administrador e integrante ativos criam" on public.revisoes_internas
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

-- A versão não histórica de número imediatamente menor que a mais recente; null sem anterior.
create function private.id_da_versao_anterior(p_processo uuid) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = p_processo and not historica
    and numero < (select numero from public.versoes where id = private.id_da_versao_mais_recente(p_processo))
  order by numero desc limit 1 $$;

-- Quem enviou a versão (para a trava do revisor).
create function private.autor_da_versao(p_versao uuid) returns uuid
language sql stable set search_path = ''
as $$ select enviada_por from public.versoes where id = p_versao $$;

-- A Revisão interna do processo tem de estar em andamento.
create function private.conferir_revisao_interna_em_andamento(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p_processo and e.codigo = 'revisao_interna' and a.status = 'em_andamento') then
    raise exception 'revisao_fora_da_etapa';
  end if;
end $$;

-- "Sem alteração": a revisada é a mais recente e não é de quem revisa; sem escopo.
create function private.preparar_sem_alteracao(nova public.revisoes_internas, revisor uuid) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(nova.processo_id);
begin
  if nova.escopo is not null then
    raise exception 'escopo_so_na_corrigida';
  end if;
  if private.autor_da_versao(ultima) = revisor then
    raise exception 'revisor_e_autor:%', (select numero from public.versoes where id = ultima);
  end if;
  nova.versao_revisada_id := ultima;
  nova.versao_corrigida_id := null;
  return nova;
end $$;

-- "Corrigida": a mais recente é do revisor (a correção) e a anterior, de outra pessoa (a revisada); escopo obrigatório.
create function private.preparar_corrigida(nova public.revisoes_internas, revisor uuid) returns public.revisoes_internas
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(nova.processo_id);
  anterior uuid := private.id_da_versao_anterior(nova.processo_id);
begin
  if nova.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  if private.autor_da_versao(ultima) <> revisor then
    raise exception 'corrigida_sem_versao_do_revisor';
  end if;
  if anterior is null then
    raise exception 'corrigida_sem_versao_anterior';
  end if;
  if private.autor_da_versao(anterior) = revisor then
    raise exception 'revisor_e_autor:%', (select numero from public.versoes where id = anterior);
  end if;
  nova.versao_revisada_id := anterior;
  nova.versao_corrigida_id := ultima;
  return nova;
end $$;

-- Antes de incluir: perfil, processo e etapa em andamento, versão e regras do revisor; revisor, data e versões
-- preenchidos pelo banco (o que vier é ignorado); comentário aparado, vazio vira nulo.
create function private.preparar_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  perform private.conferir_revisao_interna_em_andamento(new.processo_id);
  if private.id_da_versao_mais_recente(new.processo_id) is null then
    raise exception 'sem_versao';
  end if;
  new.revisor_id := (select auth.uid());
  new.revisada_em := current_date;
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado = 'corrigida' then
    new := private.preparar_corrigida(new, new.revisor_id);
  else
    new := private.preparar_sem_alteracao(new, new.revisor_id);
  end if;
  return new;
end $$;

create trigger preparar_revisao_interna before insert on public.revisoes_internas
  for each row execute function private.preparar_revisao_interna();

-- A revisão como o evento a guarda: processo, versões como "V7", resultado, escopo, comentário, revisor e data.
create function private.estado_da_revisao(p_revisao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla,
    'versao_revisada', 'V' || vr.numero, 'versao_corrigida', 'V' || vc.numero, 'resultado', r.resultado,
    'escopo', r.escopo, 'comentario', r.comentario, 'revisor_nome', u.nome, 'revisada_em', r.revisada_em)
  from public.revisoes_internas r
  join public.processos p on p.id = r.processo_id
  join public.setores s on s.id = p.setor_id
  join public.versoes vr on vr.id = r.versao_revisada_id
  left join public.versoes vc on vc.id = r.versao_corrigida_id
  join public.usuarios u on u.id = r.revisor_id
  where r.id = p_revisao $$;

-- Um evento por revisão registrada; a referência é o id do processo (o histórico do processo lê por ela).
create function private.registrar_evento_da_revisao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'registrar', 'revisao_interna', new.processo_id::text,
    jsonb_build_object('antes', null, 'depois', private.estado_da_revisao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_revisao after insert on public.revisoes_internas
  for each row execute function private.registrar_evento_da_revisao();

-- Todo perfil ativo lê os eventos de revisão (políticas de leitura somam).
create policy "eventos: perfil ativo lê as revisões internas" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'revisao_interna');

-- Processo com revisão não se exclui, e a recusa traz a contagem. O nome vem antes de conferir_processo_sem_versoes.
create function private.conferir_processo_sem_revisoes() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.revisoes_internas where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_revisoes:%', total;
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_revisoes before delete on public.processos
  for each row execute function private.conferir_processo_sem_revisoes();

-- Concluir a Revisão interna exige revisão que cubra a versão mais recente: a revisada (sem alteração) ou a corrigida.
create function private.conferir_revisao_da_versao(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  ultima uuid := private.id_da_versao_mais_recente(p_processo);
begin
  if ultima is null then
    raise exception 'sem_versao';
  end if;
  if not exists (select 1 from public.revisoes_internas r
    where r.processo_id = p_processo and coalesce(r.versao_corrigida_id, r.versao_revisada_id) = ultima) then
    raise exception 'sem_revisao_da_versao:%', (select numero from public.versoes where id = ultima);
  end if;
end $$;

-- O gatilho de conclusão do ticket 01, com a Revisão interna. Tickets seguintes acrescentam a Aprovação pelo setor.
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
  end if;
  return new;
end $$;

-- Grava a revisão e conclui a etapa numa transação só: se a conclusão falha, a revisão não fica. Sem security
-- definer: a RLS de quem chama decide. Outro andamento que não o da Revisão interna é registro inexistente.
create function public.concluir_revisao_interna(p_andamento uuid, p_resultado public.resultado_da_revisao,
  p_escopo public.escopo_da_correcao, p_comentario text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  select a.processo_id into processo from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.id = p_andamento and e.codigo = 'revisao_interna';
  if not found then
    raise exception 'registro_inexistente';
  end if;
  insert into public.revisoes_internas (processo_id, resultado, escopo, comentario)
  values (processo, p_resultado, p_escopo, p_comentario);
  perform public.avancar_etapa(p_andamento, 'concluir', null, p_responsavel);
end $$;

revoke execute on function public.concluir_revisao_interna(uuid, public.resultado_da_revisao, public.escopo_da_correcao, text, uuid),
  private.id_da_versao_anterior(uuid), private.autor_da_versao(uuid), private.conferir_revisao_interna_em_andamento(uuid),
  private.conferir_revisao_da_versao(uuid), private.conferir_conclusao_da_etapa(),
  private.preparar_sem_alteracao(public.revisoes_internas, uuid), private.preparar_corrigida(public.revisoes_internas, uuid),
  private.preparar_revisao_interna(), private.conferir_processo_sem_revisoes()
  from public, anon;
grant execute on function public.concluir_revisao_interna(uuid, public.resultado_da_revisao, public.escopo_da_correcao, text, uuid),
  private.id_da_versao_anterior(uuid), private.autor_da_versao(uuid), private.conferir_revisao_interna_em_andamento(uuid),
  private.conferir_revisao_da_versao(uuid), private.conferir_conclusao_da_etapa(),
  private.preparar_sem_alteracao(public.revisoes_internas, uuid), private.preparar_corrigida(public.revisoes_internas, uuid),
  private.preparar_revisao_interna(), private.conferir_processo_sem_revisoes()
  to authenticated;
-- Chamadas só pelos gatilhos de evento (security definer).
revoke execute on function private.estado_da_revisao(uuid), private.registrar_evento_da_revisao()
  from public, anon, authenticated;
