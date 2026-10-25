-- Andamento livre, parte 1 de 3 (processos-etapas, ticket 24; ADRs 0022 e 0024): a estrutura nova e a conversão dos
-- processos do desenvolvimento. Destrutiva na sequência das três: esta acrescenta, converte com o modelo antigo ainda
-- de pé; a 2 apaga o modelo anterior e recria a view e o catálogo; a 3 traz mover_processo e o cadastro.
-- A etapa atual é a passagem aberta, nunca uma coluna do processo ("não guarde o que se calcula"). As recusas chegam à
-- interface como "motivo:valor" em P0001.

create type public.etiqueta_da_etapa as enum ('a_fazer', 'em_andamento', 'concluido');

-- Cada estadia do processo numa etapa. A aberta (sem saída) é a etapa atual.
create table public.passagens (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete cascade,
  etapa_id uuid not null references public.etapas (id) on delete restrict,
  entrou_em timestamptz not null default now(),
  saiu_em timestamptz,
  etiqueta public.etiqueta_da_etapa not null default 'a_fazer',
  concluido_em timestamptz,
  movido_por uuid references public.usuarios (id),
  constraint passagens_saida_depois_da_entrada check (saiu_em is null or saiu_em >= entrou_em)
);

create unique index passagens_uma_aberta_por_processo on public.passagens (processo_id) where saiu_em is null;
create index passagens_etapa on public.passagens (etapa_id);

alter table public.passagens enable row level security;

-- Privilégios: visitante nada; logado lê, inclui (só a função de mover passa pelo gatilho abaixo) e altera a etiqueta e
-- a saída (a saída, só a função). Ninguém apaga: a passagem sai com o processo, em cascata.
revoke all on public.passagens from anon, authenticated;
grant select on public.passagens to authenticated;
grant insert (processo_id, etapa_id, etiqueta) on public.passagens to authenticated;
grant update (etiqueta, saiu_em) on public.passagens to authenticated;

create policy "passagens: ativo lê" on public.passagens
  for select to authenticated using ((select private.usuario_ativo()));
create policy "passagens: administrador e integrante ativos incluem" on public.passagens
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "passagens: administrador e integrante ativos alteram" on public.passagens
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- A marca que mover_processo ('mover') e o cadastro ('cadastro') ligam só na transação para abrir e fechar passagens e
-- gravar o responsável e a publicação. Quem chama a API não consegue ajustá-la: só funções do banco a ligam.
create function private.marca_do_movimento() returns text
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.movendo_processo', true), '') $$;

create function private.movendo_processo() returns boolean
language sql stable set search_path = ''
as $$ select private.marca_do_movimento() in ('mover', 'cadastro') $$;

-- Passagem nova só pela marca; entrada, quem moveu e a data do Concluído vêm do banco. No cadastro, ninguém moveu.
create function private.preparar_passagem_nova() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.movendo_processo() then
    raise exception 'passagem_so_pela_funcao';
  end if;
  new.entrou_em := clock_timestamp();
  new.saiu_em := null;
  new.movido_por := case when private.marca_do_movimento() = 'mover' then (select auth.uid()) end;
  new.concluido_em := case when new.etiqueta = 'concluido' then new.entrou_em end;
  return new;
end $$;

create trigger preparar_passagem_nova before insert on public.passagens
  for each row execute function private.preparar_passagem_nova();

-- A etiqueta muda só na passagem aberta, com o processo em andamento e fora de Concluídos; a saída, só pela marca.
create function private.preparar_passagem() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.saiu_em is not null then
    raise exception 'passagem_fechada';
  end if;
  if new.saiu_em is distinct from old.saiu_em then
    if not private.movendo_processo() then
      raise exception 'passagem_so_pela_funcao';
    end if;
    return new;
  end if;
  if new.etiqueta is not distinct from old.etiqueta then
    return new;
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  if (select codigo from public.etapas where id = new.etapa_id) = 'concluidos' then
    raise exception 'etiqueta_fixa_em_concluidos';
  end if;
  new.concluido_em := case when new.etiqueta = 'concluido' then clock_timestamp() end;
  return new;
end $$;

create trigger preparar_passagem before update on public.passagens
  for each row execute function private.preparar_passagem();

-- O processo e a etapa da passagem como os eventos os guardam.
create function private.base_do_evento_da_passagem(passagem public.passagens) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_nome', p.nome, 'setor_sigla', s.sigla, 'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
  from public.processos p join public.setores s on s.id = p.setor_id, public.etapas e
  where p.id = passagem.processo_id and e.id = passagem.etapa_id $$;

-- O movimento: mover_processo deixa o antes e o depois em ep.evento_do_movimento, e a passagem aberta grava um evento
-- só (a etiqueta que volta a A fazer e o responsável vão dentro dele). O cadastro não gera movimento.
create function private.registrar_evento_do_movimento() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if private.marca_do_movimento() <> 'mover' then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'mover', 'passagem', new.processo_id::text,
    current_setting('ep.evento_do_movimento', true)::jsonb);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_movimento after insert on public.passagens
  for each row execute function private.registrar_evento_do_movimento();

create function private.registrar_evento_da_etiqueta() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_da_passagem(new);
begin
  if new.etiqueta is not distinct from old.etiqueta or private.movendo_processo() then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'mudar_etiqueta', 'passagem', new.processo_id::text,
    jsonb_build_object('antes', base || jsonb_build_object('etiqueta', old.etiqueta),
      'depois', base || jsonb_build_object('etiqueta', new.etiqueta)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_etiqueta after update of etiqueta on public.passagens
  for each row execute function private.registrar_evento_da_etiqueta();

-- Todo perfil ativo lê os eventos das passagens (a referência é o id do processo, para o histórico filtrar).
create policy "eventos: perfil ativo lê as passagens" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'passagem');

-- O responsável do processo e a publicação (spec de publicacao-e-arquivamento). As colunas da publicação mudam só pelas
-- funções (a marca acima); o privilégio existe porque as funções rodam com a permissão de quem chama.
alter table public.processos
  add column responsavel_id uuid references public.usuarios (id),
  add column publicado_em date,
  add column link_da_publicacao text constraint processos_link_da_publicacao_formato
    check (char_length(link_da_publicacao) <= 500 and link_da_publicacao ~* '^https?://.+'),
  add column explicacao_sem_publicacao text constraint processos_explicacao_sem_publicacao_tamanho
    check (char_length(explicacao_sem_publicacao) between 1 and 2000 and explicacao_sem_publicacao = btrim(explicacao_sem_publicacao));

grant update (responsavel_id, publicado_em, link_da_publicacao, explicacao_sem_publicacao) on public.processos to authenticated;

create function private.conferir_colunas_da_publicacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.publicado_em, new.link_da_publicacao, new.explicacao_sem_publicacao)
    is distinct from (old.publicado_em, old.link_da_publicacao, old.explicacao_sem_publicacao)
    and not private.movendo_processo() then
    raise exception 'publicacao_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_colunas_da_publicacao before update of publicado_em, link_da_publicacao, explicacao_sem_publicacao
  on public.processos for each row execute function private.conferir_colunas_da_publicacao();

-- Responsável: usuário ativo Administrador ou Integrante (a conferência que era da etapa), com o processo em andamento.
-- Só confere quando muda: o responsável desativado depois continua no processo.
create function private.conferir_responsavel_do_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.responsavel_id is not distinct from old.responsavel_id then
    return new;
  end if;
  perform private.conferir_processo_em_andamento(new.id);
  perform private.conferir_responsavel(new.responsavel_id, old.responsavel_id);
  return new;
end $$;

create trigger conferir_responsavel_do_processo before update of responsavel_id on public.processos
  for each row execute function private.conferir_responsavel_do_processo();

-- A troca direta vira evento do processo; a feita dentro do movimento vai no evento dele.
create function private.registrar_evento_do_responsavel() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
begin
  if new.responsavel_id is not distinct from old.responsavel_id or private.movendo_processo() then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'mudar_responsavel', 'processo', new.id::text, jsonb_build_object(
    'antes', base || jsonb_build_object('responsavel_id', old.responsavel_id,
      'responsavel_nome', (select nome from public.usuarios where id = old.responsavel_id)),
    'depois', base || jsonb_build_object('responsavel_id', new.responsavel_id,
      'responsavel_nome', (select nome from public.usuarios where id = new.responsavel_id))));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_responsavel after update of responsavel_id on public.processos
  for each row execute function private.registrar_evento_do_responsavel();

-- As fixas nas pontas do catálogo: sem fase, as outras com fase obrigatória.
alter table public.etapas alter column fase drop not null;
alter table public.etapas add constraint etapas_fase_so_nas_fixas
  check ((codigo in ('nao_iniciados', 'concluidos')) = (fase is null));

-- Estrutura e dados antigos, não ação de alguém: com os gatilhos desligados só neste trecho, nenhum evento nasce e a
-- etapa nova não ganha andamentos (como na migração 20261018141346_sem_etapas_do_setor).
set local session_replication_role = replica;

update public.etapas set ordem = ordem + 1;
insert into public.etapas (codigo, nome, ordem, obrigatoria, fase) values
  ('nao_iniciados', 'Não iniciados', 1, false, null),
  ('concluidos', 'Concluídos', (select max(ordem) + 1 from public.etapas), false, null);

-- Conversão: cada processo ganha só a passagem atual, lida da view do modelo antigo (decisão 12 da spec). Concluído
-- (arquivado ou não) vai a Concluídos; a etapa em andamento fica, com a etiqueta e a entrada dela; a Modelagem piloto
-- pendente (ou nenhuma etapa) vai a Não iniciados; a primeira pendente fica, em A fazer.
insert into public.passagens (processo_id, etapa_id, entrou_em, etiqueta, concluido_em)
select v.id, destino.etapa_id, destino.entrou_em, destino.etiqueta,
  case when destino.etiqueta = 'concluido' then now() end
from public.processos_com_andamento v
cross join lateral (
  select case
      when v.situacao = 'concluido' or v.arquivado_em is not null then (select id from public.etapas where codigo = 'concluidos')
      when v.etapa_atual_status = 'pendente' and v.etapa_atual_codigo = 'modelagem' or v.etapa_atual_id is null
        then (select id from public.etapas where codigo = 'nao_iniciados')
      else v.etapa_atual_id end as etapa_id,
    case
      when v.situacao = 'concluido' or v.arquivado_em is not null then 'concluido'
      when v.etapa_atual_status = 'em_andamento' then 'em_andamento'
      else 'a_fazer' end::public.etiqueta_da_etapa as etiqueta,
    case when v.etapa_atual_status = 'em_andamento' and v.situacao <> 'concluido'
      then v.etapa_atual_iniciada_em::timestamp at time zone 'America/Sao_Paulo' else now() end as entrou_em
) destino;

-- O responsável do processo é o da etapa atual (o concluído não tem etapa atual, então fica sem).
update public.processos p set responsavel_id = v.responsavel_id
from public.processos_com_andamento v
where v.id = p.id and v.responsavel_id is not null;

-- A publicação (tabela "Migração dos dados" da spec de publicacao-e-arquivamento): a data é a da Publicação resolvida;
-- o processo em Concluídos sem ela fica com a explicação fixa, que diz de onde veio.
update public.processos p set publicado_em = a.resolvida_em
from public.andamentos a join public.etapas e on e.id = a.etapa_id
where a.processo_id = p.id and e.codigo = 'publicacao' and a.status in ('concluida', 'realizada_anteriormente');

update public.processos p set explicacao_sem_publicacao = 'Concluído sem publicação no modelo anterior da plataforma.'
from public.passagens pa join public.etapas e on e.id = pa.etapa_id
where pa.processo_id = p.id and pa.saiu_em is null and e.codigo = 'concluidos' and p.publicado_em is null;

set local session_replication_role = origin;

-- As conferências rodam com a permissão de quem altera; as funções de evento só os gatilhos chamam.
revoke execute on function private.marca_do_movimento(), private.movendo_processo(), private.preparar_passagem_nova(),
  private.preparar_passagem(), private.conferir_colunas_da_publicacao(), private.conferir_responsavel_do_processo()
  from public, anon;
grant execute on function private.marca_do_movimento(), private.movendo_processo(), private.preparar_passagem_nova(),
  private.preparar_passagem(), private.conferir_colunas_da_publicacao(), private.conferir_responsavel_do_processo()
  to authenticated;
revoke execute on function private.base_do_evento_da_passagem(public.passagens), private.registrar_evento_do_movimento(),
  private.registrar_evento_da_etiqueta(), private.registrar_evento_do_responsavel()
  from public, anon, authenticated;
