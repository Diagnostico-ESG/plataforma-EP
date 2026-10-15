-- Reuniões (reunioes, ticket 01): reunião com um setor, de sensibilização ou de modelagem (esta com um ou mais
-- processos do próprio setor), com RLS por perfil, regras no banco, um evento por gravação e a função de salvar.
-- Recusas em P0001 "motivo:valor" (src/reunioes/recusasDeReunioes.ts e src/cadastros/recusasDeProcessos.ts).
-- Participantes (usuários e responsáveis do setor) entram no ticket 03; a coluna de outros participantes já nasce aqui.
-- Reaproveita private.pode_alterar_cadastros() e private.usuario_ativo().

create type public.tipo_de_reuniao as enum ('sensibilizacao', 'modelagem');

create table public.reunioes (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid not null references public.setores (id) on delete restrict,
  tipo public.tipo_de_reuniao not null,
  data date not null,
  hora time,
  local text constraint reunioes_local_tamanho check (char_length(local) <= 300),
  anotacoes text constraint reunioes_anotacoes_tamanho check (char_length(anotacoes) <= 10000),
  outros_participantes text[] not null default '{}',
  criado_em timestamptz not null default now()
);

create index reunioes_setor on public.reunioes (setor_id);
create index reunioes_data on public.reunioes (data);

-- Os processos tratados na modelagem: a reunião excluída leva as ligações; o processo tratado não se exclui.
create table public.reunioes_processos (
  reuniao_id uuid not null references public.reunioes (id) on delete cascade,
  processo_id uuid not null references public.processos (id) on delete restrict,
  primary key (reuniao_id, processo_id)
);

create index reunioes_processos_processo on public.reunioes_processos (processo_id);

alter table public.reunioes enable row level security;
alter table public.reunioes_processos enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui e altera só os campos editáveis (id e criado_em ficam
-- de fora). A ligação não se altera: troca-se apagando e incluindo.
revoke all on public.reunioes, public.reunioes_processos from anon, authenticated;
grant select, delete on public.reunioes to authenticated;
grant insert (setor_id, tipo, data, hora, local, anotacoes, outros_participantes) on public.reunioes to authenticated;
grant update (setor_id, tipo, data, hora, local, anotacoes, outros_participantes) on public.reunioes to authenticated;
grant select, insert, delete on public.reunioes_processos to authenticated;

create policy "reunioes: ativo lê" on public.reunioes
  for select to authenticated using ((select private.usuario_ativo()));
create policy "reunioes: administrador e integrante ativos criam" on public.reunioes
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "reunioes: administrador e integrante ativos alteram" on public.reunioes
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));
create policy "reunioes: administrador e integrante ativos apagam" on public.reunioes
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

create policy "reunioes_processos: ativo lê" on public.reunioes_processos
  for select to authenticated using ((select private.usuario_ativo()));
create policy "reunioes_processos: administrador e integrante ativos ligam" on public.reunioes_processos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "reunioes_processos: administrador e integrante ativos desligam" on public.reunioes_processos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: textos aparados (vazio vira nulo) e outros participantes sem itens vazios, cada um com até 200
-- caracteres. Roda com a permissão de quem grava.
create function private.preparar_reuniao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  maior integer;
begin
  new.local := nullif(btrim(new.local), '');
  new.anotacoes := nullif(btrim(new.anotacoes), '');
  new.outros_participantes := coalesce((select array_agg(btrim(nome) order by posicao)
    from unnest(new.outros_participantes) with ordinality as itens (nome, posicao)
    where btrim(nome) <> ''), '{}');
  maior := (select max(char_length(nome)) from unnest(new.outros_participantes) as itens (nome));
  if maior > 200 then
    raise exception 'outro_participante_longo:%', maior;
  end if;
  return new;
end $$;

create trigger preparar_reuniao before insert or update on public.reunioes
  for each row execute function private.preparar_reuniao();

-- Reunião nova só em setor ativo; a que já existe continua válida se o setor ficar inativo depois.
create function private.conferir_setor_da_reuniao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  setor public.setores;
begin
  if tg_op = 'UPDATE' and new.setor_id = old.setor_id then
    return new;
  end if;
  select * into setor from public.setores where id = new.setor_id;
  if found and not setor.ativo then
    raise exception 'setor_inativo:%', setor.sigla;
  end if;
  return new;
end $$;

create trigger conferir_setor_da_reuniao before insert or update of setor_id on public.reunioes
  for each row execute function private.conferir_setor_da_reuniao();

-- O processo tratado é do setor da reunião, em qualquer situação.
create function private.conferir_processo_da_reuniao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  processo public.processos;
begin
  select * into processo from public.processos where id = new.processo_id;
  if found and processo.setor_id is distinct from (select setor_id from public.reunioes where id = new.reuniao_id) then
    raise exception 'processo_de_outro_setor:%', processo.nome;
  end if;
  return new;
end $$;

create trigger conferir_processo_da_reuniao before insert on public.reunioes_processos
  for each row execute function private.conferir_processo_da_reuniao();

-- Trocar o setor da reunião não deixa processo do setor antigo ligado a ela.
create function private.conferir_processos_ao_trocar_o_setor() returns trigger
language plpgsql set search_path = ''
as $$
declare
  nome_do_processo text;
begin
  select p.nome into nome_do_processo
  from public.reunioes_processos rp join public.processos p on p.id = rp.processo_id
  where rp.reuniao_id = new.id and p.setor_id <> new.setor_id order by p.nome limit 1;
  if found then
    raise exception 'processo_de_outro_setor:%', nome_do_processo;
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger conferir_processos_ao_trocar_o_setor after update of setor_id on public.reunioes
  for each row execute function private.conferir_processos_ao_trocar_o_setor();

-- A reunião de uma linha de reunioes (id) ou de reunioes_processos (reuniao_id), vista como json.
create function private.reuniao_da_linha(linha jsonb) returns uuid
language sql immutable set search_path = ''
as $$ select coalesce(linha ->> 'reuniao_id', linha ->> 'id')::uuid $$;

-- Modelagem tem ao menos um processo e sensibilização nenhum. Conferido no fim da gravação (restrição adiada),
-- porque a reunião entra antes das ligações. A reunião que já não existe (excluída) não é conferida.
create function private.conferir_tipo_da_reuniao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  reuniao uuid := private.reuniao_da_linha(to_jsonb(case when tg_op = 'DELETE' then old else new end));
  tipo_da_reuniao public.tipo_de_reuniao;
  processos_ligados integer;
begin
  select tipo into tipo_da_reuniao from public.reunioes where id = reuniao;
  if not found then
    return null;
  end if;
  processos_ligados := (select count(*) from public.reunioes_processos where reuniao_id = reuniao);
  if tipo_da_reuniao = 'modelagem' and processos_ligados = 0 then
    raise exception 'modelagem_sem_processo';
  elsif tipo_da_reuniao = 'sensibilizacao' and processos_ligados > 0 then
    raise exception 'sensibilizacao_com_processo';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create constraint trigger conferir_tipo_da_reuniao_na_reuniao after insert or update on public.reunioes
  deferrable initially deferred for each row execute function private.conferir_tipo_da_reuniao();
create constraint trigger conferir_tipo_da_reuniao_nas_ligacoes after insert or delete on public.reunioes_processos
  deferrable initially deferred for each row execute function private.conferir_tipo_da_reuniao();

-- Setor e processo com reunião não se excluem, e a recusa traz a contagem. O nome começa com "conferir_", que vem
-- antes de "registrar_exclusao_..." na ordem em que o Postgres dispara os gatilhos.
create function private.conferir_setor_sem_reunioes() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.reunioes where setor_id = old.id);
begin
  if total > 0 then
    raise exception 'setor_com_reunioes:%', total;
  end if;
  return old;
end $$;

create function private.conferir_processo_sem_reunioes() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.reunioes_processos where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_reunioes:%', total;
  end if;
  return old;
end $$;

create trigger conferir_setor_sem_reunioes before delete on public.setores
  for each row execute function private.conferir_setor_sem_reunioes();
create trigger conferir_processo_sem_reunioes before delete on public.processos
  for each row execute function private.conferir_processo_sem_reunioes();

-- O estado completo da reunião como o evento o guarda (dados e processos), legível depois de uma exclusão;
-- null se a reunião não existe.
create function private.estado_da_reuniao(reuniao uuid) returns jsonb
language sql security definer set search_path = ''
as $$
  select jsonb_build_object('tipo', r.tipo, 'setor_id', r.setor_id, 'setor_sigla', s.sigla, 'data', r.data,
    'hora', r.hora, 'local', r.local, 'anotacoes', r.anotacoes, 'outros_participantes', to_jsonb(r.outros_participantes),
    'processos', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome) order by p.nome)
      from public.reunioes_processos rp join public.processos p on p.id = rp.processo_id
      where rp.reuniao_id = r.id), '[]'::jsonb))
  from public.reunioes r join public.setores s on s.id = r.setor_id
  where r.id = reuniao $$;

-- Um evento por gravação: na primeira mudança da transação, o estado de antes fica guardado num ajuste local
-- (a chave leva o id da reunião); no fim da gravação, o gatilho adiado compara com o de depois, grava o evento se
-- mudou e limpa o ajuste. "novo" marca a reunião que ainda não existia.
create function private.chave_da_reuniao(reuniao uuid) returns text
language sql immutable set search_path = ''
as $$ select 'ep.reuniao_' || replace(reuniao::text, '-', '_') $$;

create function private.guardar_estado_da_reuniao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  reuniao uuid := private.reuniao_da_linha(to_jsonb(case when tg_op = 'DELETE' then old else new end));
  chave text := private.chave_da_reuniao(reuniao);
begin
  if coalesce(current_setting(chave, true), '') = '' then
    perform set_config(chave, case when tg_op = 'INSERT' and tg_table_name = 'reunioes' then 'novo'
      else coalesce(private.estado_da_reuniao(reuniao)::text, 'novo') end, true);
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger guardar_estado_da_reuniao before insert or update or delete on public.reunioes
  for each row execute function private.guardar_estado_da_reuniao();
create trigger guardar_estado_da_reuniao before insert or delete on public.reunioes_processos
  for each row execute function private.guardar_estado_da_reuniao();

create function private.registrar_evento_da_reuniao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  reuniao uuid := private.reuniao_da_linha(to_jsonb(case when tg_op = 'DELETE' then old else new end));
  chave text := private.chave_da_reuniao(reuniao);
  guardado text := coalesce(current_setting(chave, true), '');
  antes jsonb;
  depois jsonb := private.estado_da_reuniao(reuniao);
begin
  if guardado = '' then
    return null; -- o evento desta gravação já foi gravado
  end if;
  antes := case when guardado = 'novo' then null else guardado::jsonb end;
  perform set_config(chave, '', true);
  if antes is not distinct from depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when antes is null then 'criar' when depois is null then 'excluir' else 'editar' end,
    'reuniao', reuniao::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create constraint trigger registrar_evento_da_reuniao_na_reuniao after insert or update or delete on public.reunioes
  deferrable initially deferred for each row execute function private.registrar_evento_da_reuniao();
create constraint trigger registrar_evento_da_reuniao_nas_ligacoes after insert or delete on public.reunioes_processos
  deferrable initially deferred for each row execute function private.registrar_evento_da_reuniao();

-- Salva a reunião e a lista de processos de uma vez (id nulo cria). Sem security definer: roda com a permissão de
-- quem chama, e a RLS decide. No fim, as conferências adiadas e o evento valem na própria chamada.
create function public.salvar_reuniao(p_id uuid, p_tipo public.tipo_de_reuniao, p_setor_id uuid, p_data date,
  p_hora time, p_local text, p_anotacoes text, p_outros text[], p_processos uuid[]) returns uuid
language plpgsql set search_path = ''
as $$
declare
  reuniao uuid := p_id;
  processos uuid[] := coalesce(p_processos, '{}');
begin
  if p_id is null then
    insert into public.reunioes (setor_id, tipo, data, hora, local, anotacoes, outros_participantes)
    values (p_setor_id, p_tipo, p_data, p_hora, p_local, p_anotacoes, coalesce(p_outros, '{}')) returning id into reuniao;
  else
    delete from public.reunioes_processos where reuniao_id = p_id and processo_id <> all (processos);
    update public.reunioes set setor_id = p_setor_id, tipo = p_tipo, data = p_data, hora = p_hora, local = p_local,
      anotacoes = p_anotacoes, outros_participantes = coalesce(p_outros, '{}') where id = p_id;
    if not found then
      if exists (select 1 from public.reunioes where id = p_id) then
        raise exception 'sem permissão para alterar reuniões' using errcode = '42501';
      end if;
      raise exception 'registro_inexistente';
    end if;
  end if;
  insert into public.reunioes_processos (reuniao_id, processo_id)
  select reuniao, processo from unnest(processos) as processo on conflict do nothing;
  set constraints conferir_tipo_da_reuniao_na_reuniao, conferir_tipo_da_reuniao_nas_ligacoes,
    registrar_evento_da_reuniao_na_reuniao, registrar_evento_da_reuniao_nas_ligacoes immediate;
  set constraints conferir_tipo_da_reuniao_na_reuniao, conferir_tipo_da_reuniao_nas_ligacoes,
    registrar_evento_da_reuniao_na_reuniao, registrar_evento_da_reuniao_nas_ligacoes deferred;
  return reuniao;
end $$;

-- Todo perfil ativo lê os eventos de reunião (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê as reuniões" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'reuniao');

revoke execute on function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[], uuid[])
  from public, anon;
grant execute on function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[], uuid[])
  to authenticated;
-- Chamada de dentro dos gatilhos que rodam com a permissão de quem grava.
revoke execute on function private.reuniao_da_linha(jsonb) from public, anon;
grant execute on function private.reuniao_da_linha(jsonb) to authenticated;
revoke execute on function private.preparar_reuniao(), private.conferir_setor_da_reuniao(),
  private.conferir_processo_da_reuniao(), private.conferir_processos_ao_trocar_o_setor(),
  private.conferir_tipo_da_reuniao(), private.conferir_setor_sem_reunioes(), private.conferir_processo_sem_reunioes(),
  private.estado_da_reuniao(uuid), private.chave_da_reuniao(uuid), private.guardar_estado_da_reuniao(),
  private.registrar_evento_da_reuniao()
  from public, anon, authenticated;
