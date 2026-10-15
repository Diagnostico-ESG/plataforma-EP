-- Versões (documentos-versoes, ticket 02): a versão do processo com os arquivos dentro (ADR 0005), os arquivos no
-- Drive e só os dados deles aqui (ADR 0008). RLS por perfil, regras no banco, um evento por envio e a função que
-- grava a versão nova com os arquivos de uma vez. Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts).
-- Este ticket só grava a versão nova: a histórica (ticket 04) nasce sem privilégio de inclusão; relatório depois,
-- "sem alteração" e substituição (tickets 05 e 06) usam a política de alterar que já nasce aqui.
-- Reaproveita private.pode_alterar_cadastros() e private.usuario_ativo().

create type public.papel_do_arquivo as enum ('bpmn', 'png', 'bpm', 'relatorio');

create table public.versoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete restrict,
  numero integer not null constraint versoes_numero_positivo check (numero > 0),
  historica boolean not null default false,
  etapa_id uuid references public.etapas (id) on delete restrict,
  observacao text constraint versoes_observacao_tamanho check (char_length(observacao) <= 2000),
  enviada_por uuid not null references public.usuarios (id) on delete restrict,
  enviada_em timestamptz not null default now(),
  constraint versoes_numero_unico unique (processo_id, numero)
);

create table public.arquivos_da_versao (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references public.versoes (id) on delete restrict,
  papel public.papel_do_arquivo not null,
  nome text not null constraint arquivos_nome_tamanho check (char_length(nome) between 1 and 300),
  formato text not null,
  tamanho bigint not null constraint arquivos_tamanho_limite check (tamanho between 1 and 20971520),
  hash_md5 text not null constraint arquivos_hash_md5 check (hash_md5 ~ '^[0-9a-f]{32}$'),
  drive_id text not null constraint arquivos_drive_id check (btrim(drive_id) <> ''),
  copiado_de uuid references public.arquivos_da_versao (id) on delete restrict,
  enviado_por uuid not null references public.usuarios (id) on delete restrict,
  enviado_em timestamptz not null default now(),
  constraint arquivos_um_por_papel unique (versao_id, papel),
  constraint arquivos_formato_do_papel check (
    (papel = 'relatorio' and formato in ('docx', 'pdf')) or (papel <> 'relatorio' and formato = papel::text))
);

alter table public.versoes enable row level security;
alter table public.arquivos_da_versao enable row level security;

-- Privilégios: visitante nada; logado lê e inclui; a versão não se altera; do arquivo, só o conteúdo muda (tamanho,
-- hash, autor e data, na substituição). Ninguém apaga. "historica" fica sem inclusão até o ticket 04.
revoke all on public.versoes, public.arquivos_da_versao from anon, authenticated;
grant select on public.versoes, public.arquivos_da_versao to authenticated;
grant insert (processo_id, numero, observacao) on public.versoes to authenticated;
grant insert (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id) on public.arquivos_da_versao to authenticated;
grant update (tamanho, hash_md5, enviado_por, enviado_em) on public.arquivos_da_versao to authenticated;

create policy "versoes: ativo lê" on public.versoes
  for select to authenticated using ((select private.usuario_ativo()));
create policy "versoes: administrador e integrante ativos criam" on public.versoes
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "arquivos_da_versao: ativo lê" on public.arquivos_da_versao
  for select to authenticated using ((select private.usuario_ativo()));
create policy "arquivos_da_versao: administrador e integrante ativos criam" on public.arquivos_da_versao
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "arquivos_da_versao: administrador e integrante ativos alteram" on public.arquivos_da_versao
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Versão e arquivo só com o processo em andamento. "Concluído" é calculado pela view, lida com a permissão de quem
-- grava; sem a linha (usuário inativo), não recusa aqui: a RLS recusa depois.
create function private.conferir_processo_que_recebe_versao(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  situacao_atual text;
begin
  select situacao into situacao_atual from public.processos_com_andamento where id = processo;
  if situacao_atual <> 'em_andamento' then
    raise exception 'processo_fora_de_andamento:%', situacao_atual;
  end if;
end $$;

-- Antes de incluir a versão nova: o número (maior do processo + 1, o que vier é ignorado), a etapa atual, o autor e
-- a observação aparada. Roda com a permissão de quem grava.
create function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  new.numero := coalesce((select max(numero) from public.versoes where processo_id = new.processo_id), 0) + 1;
  new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  new.observacao := nullif(btrim(new.observacao), '');
  new.enviada_por := (select auth.uid());
  new.enviada_em := now();
  return new;
end $$;

create trigger preparar_versao before insert on public.versoes
  for each row execute function private.preparar_versao();

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, autor e data de quem grava.
create function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao((select processo_id from public.versoes where id = new.versao_id));
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

create trigger preparar_arquivo_da_versao before insert or update on public.arquivos_da_versao
  for each row execute function private.preparar_arquivo_da_versao();

-- A versão nova tem .bpmn e .png. Conferido no fim da gravação (restrição adiada), porque a versão entra antes dos
-- arquivos. Arquivo não se apaga, então basta conferir quando a versão nasce.
create function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  papeis public.papel_do_arquivo[] := array(select papel from public.arquivos_da_versao where versao_id = new.id);
begin
  if not new.historica and not papeis @> array['bpmn', 'png']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpmn_e_png';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create constraint trigger conferir_arquivos_da_versao after insert on public.versoes
  deferrable initially deferred for each row execute function private.conferir_arquivos_da_versao();

-- A versão como o evento a guarda: rótulo, processo, etapa, observação e os arquivos (papel e nome).
create function private.estado_da_versao(versao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('rotulo', 'V' || v.numero || case when v.historica then 'F' else '' end,
    'processo_nome', p.nome, 'setor_sigla', s.sigla, 'etapa', e.nome, 'observacao', v.observacao,
    'arquivos', coalesce((select jsonb_agg(jsonb_build_object('papel', a.papel, 'nome', a.nome) order by a.papel)
      from public.arquivos_da_versao a where a.versao_id = v.id), '[]'::jsonb))
  from public.versoes v
  join public.processos p on p.id = v.processo_id
  join public.setores s on s.id = p.setor_id
  left join public.etapas e on e.id = v.etapa_id
  where v.id = versao $$;

-- Um evento por envio, no fim da gravação (já com os arquivos). A referência é o id do processo: o histórico do
-- processo lê os eventos de versão junto com os dele.
create function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'enviar', 'versao', new.processo_id::text,
    jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create constraint trigger registrar_evento_da_versao after insert on public.versoes
  deferrable initially deferred for each row execute function private.registrar_evento_da_versao();

-- Processo com versão não se exclui, e a recusa traz a contagem. O nome começa com "conferir_", que vem antes de
-- "registrar_exclusao_..." na ordem em que o Postgres dispara os gatilhos.
create function private.conferir_processo_sem_versoes() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.versoes where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_versoes:%', total;
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_versoes before delete on public.processos
  for each row execute function private.conferir_processo_sem_versoes();

-- Grava a versão nova e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou.
-- Sem security definer: a RLS decide. p_numero é o número com que os arquivos foram nomeados no Drive; se outra pessoa
-- enviou no meio e o banco deu outro número, nada é gravado. No fim, as conferências adiadas e o evento valem aqui.
create function public.registrar_versao(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
  numero_dado integer;
begin
  insert into public.versoes (processo_id, observacao) values (p_processo, p_observacao)
  returning id, numero into versao, numero_dado;
  if numero_dado <> p_numero then
    raise exception 'numero_da_versao_mudou:%', numero_dado;
  end if;
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
  select versao, (a ->> 'papel')::public.papel_do_arquivo, a ->> 'nome', a ->> 'formato', (a ->> 'tamanho')::bigint,
    a ->> 'hash_md5', a ->> 'drive_id'
  from jsonb_array_elements(p_arquivos) as a;
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao immediate;
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao deferred;
  return versao;
end $$;

-- Todo perfil ativo lê os eventos de versão (políticas de leitura somam).
create policy "eventos: perfil ativo lê as versões" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'versao');

revoke execute on function public.registrar_versao(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.registrar_versao(uuid, integer, text, jsonb) to authenticated;
-- Chamada de dentro dos gatilhos que rodam com a permissão de quem grava.
revoke execute on function private.conferir_processo_que_recebe_versao(uuid) from public, anon;
grant execute on function private.conferir_processo_que_recebe_versao(uuid) to authenticated;
revoke execute on function private.preparar_versao(), private.preparar_arquivo_da_versao(),
  private.conferir_arquivos_da_versao(), private.estado_da_versao(uuid), private.registrar_evento_da_versao(),
  private.conferir_processo_sem_versoes()
  from public, anon, authenticated;
