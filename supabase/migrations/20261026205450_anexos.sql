-- Anexos (documentos-versoes, ticket 12; ADR 0027): o arquivo avulso do processo (o e-mail com a resposta do setor, a
-- planilha, a foto, um .pdf de apoio), enviado em qualquer etapa com o processo em andamento e não arquivado. Os bytes
-- ficam no Drive (ADR 0008); aqui só os dados. O anexo guarda a etapa do envio e não se altera. Ninguém apaga nesta
-- migração: a retirada é do ticket 13. Não destrutiva: só cria (tabela, coluna, gatilhos, função e política).
-- Recusas em P0001 "motivo:valor" (src/anexos/recusasDeAnexos.ts). Reaproveita private.pode_alterar_cadastros(),
-- private.usuario_ativo() e private.conferir_processo_que_recebe_versao().

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete restrict,
  etapa_id uuid not null references public.etapas (id) on delete restrict,
  nome text not null constraint anexos_nome_tamanho check (char_length(nome) between 1 and 300),
  formato text not null constraint anexos_formato check (formato in ('pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'eml')),
  tamanho bigint not null constraint anexos_tamanho_limite check (tamanho between 1 and 20971520),
  hash_md5 text not null constraint anexos_hash_md5 check (hash_md5 ~ '^[0-9a-f]{32}$'),
  drive_id text not null constraint anexos_drive_id_formato check (drive_id ~ '^[A-Za-z0-9_-]{1,200}$'),
  enviado_por uuid not null references public.usuarios (id) on delete restrict,
  enviado_em timestamptz not null default now()
);

create index anexos_processo on public.anexos (processo_id);
create index anexos_etapa on public.anexos (etapa_id);
create index anexos_enviado_por on public.anexos (enviado_por);

alter table public.anexos enable row level security;

-- Visitante nada; logado lê; Administrador e Integrante incluem (a etapa, o autor e a data são do banco, então ficam fora
-- do privilégio de inclusão); ninguém altera nem apaga.
revoke all on public.anexos from anon, authenticated;
grant select on public.anexos to authenticated;
grant insert (processo_id, nome, formato, tamanho, hash_md5, drive_id) on public.anexos to authenticated;

create policy "anexos: ativo lê" on public.anexos
  for select to authenticated using ((select private.usuario_ativo()));
create policy "anexos: administrador e integrante ativos criam" on public.anexos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

-- Identificador da subpasta "Anexos" no Drive, dentro da pasta do processo: gravado no primeiro anexo, pela função
-- arquivos-no-drive com o login de quem chamou. Fora do estado_do_processo, então gravá-lo não vira evento.
alter table public.processos add column drive_pasta_dos_anexos text
  constraint processos_pasta_dos_anexos_formato check (drive_pasta_dos_anexos ~ '^[A-Za-z0-9_-]{1,200}$');
grant update (drive_pasta_dos_anexos) on public.processos to authenticated;

-- Antes de incluir: processo não arquivado e em andamento (as recusas de sempre), e a etapa atual, o autor e a data de
-- quem grava (o que vier da tela é ignorado). Roda com a permissão de quem grava; sem a linha do processo (usuário
-- inativo), não recusa aqui: a RLS recusa depois.
create function private.preparar_anexo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.processos where id = new.processo_id and arquivado_em is not null) then
    raise exception 'processo_arquivado';
  end if;
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

create trigger preparar_anexo before insert on public.anexos
  for each row execute function private.preparar_anexo();

-- O anexo como o evento o guarda: o nome e a etapa do envio (o texto do histórico), mais o processo e o setor.
create function private.estado_do_anexo(anexo uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', a.nome, 'formato', a.formato, 'etapa', e.nome,
    'processo_nome', p.nome, 'setor_sigla', s.sigla)
  from public.anexos a
  join public.processos p on p.id = a.processo_id
  join public.setores s on s.id = p.setor_id
  join public.etapas e on e.id = a.etapa_id
  where a.id = anexo $$;

-- Um evento por envio. A referência é o id do processo: o histórico do processo lê os eventos de anexo junto com os dele.
create function private.registrar_evento_do_anexo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'enviar', 'anexo', new.processo_id::text,
    jsonb_build_object('antes', null, 'depois', private.estado_do_anexo(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_anexo after insert on public.anexos
  for each row execute function private.registrar_evento_do_anexo();

-- Todo perfil ativo lê os eventos de anexo (políticas de leitura somam).
create policy "eventos: perfil ativo lê os anexos" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'anexo');

-- Processo com anexo não se exclui, e a recusa traz a contagem. O nome começa com "conferir_", que vem antes de
-- "registrar_exclusao_..." na ordem em que o Postgres dispara os gatilhos.
create function private.conferir_processo_sem_anexos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.anexos where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_anexos:%', total;
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_anexos before delete on public.processos
  for each row execute function private.conferir_processo_sem_anexos();

-- Grava o anexo, chamada pela função arquivos-no-drive com o login de quem chamou (sem security definer: a RLS decide).
-- p_arquivo traz nome, formato, tamanho, hash_md5 e drive_id, lidos do Drive; o resto do que vier é ignorado.
create function public.registrar_anexo(p_processo uuid, p_arquivo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  novo uuid;
begin
  insert into public.anexos (processo_id, nome, formato, tamanho, hash_md5, drive_id)
  values (p_processo, p_arquivo ->> 'nome', p_arquivo ->> 'formato', (p_arquivo ->> 'tamanho')::bigint,
    p_arquivo ->> 'hash_md5', p_arquivo ->> 'drive_id')
  returning id into novo;
  return novo;
end $$;

revoke execute on function public.registrar_anexo(uuid, jsonb) from public, anon;
grant execute on function public.registrar_anexo(uuid, jsonb) to authenticated;
revoke execute on function private.preparar_anexo(), private.estado_do_anexo(uuid), private.registrar_evento_do_anexo(),
  private.conferir_processo_sem_anexos()
  from public, anon, authenticated;
