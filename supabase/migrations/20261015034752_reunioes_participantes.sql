-- Reuniões (reunioes, ticket 03): participantes. Usuários do EP e responsáveis do setor presentes (tabelas de ligação,
-- com RLS e privilégios no molde de reunioes_processos), responsável do setor da reunião, responsável excluído que
-- vira outro participante, participantes no estado dos eventos e a função de salvar com as duas listas novas.
-- Recusa em P0001 "motivo:valor" (src/reunioes/recusasDeReunioes.ts). Reaproveita private.pode_alterar_cadastros(),
-- private.usuario_ativo() e as funções de evento da migração reunioes.

-- Os usuários do EP presentes: a reunião excluída leva as ligações. Usuário não se apaga depois do primeiro acesso.
create table public.reunioes_usuarios (
  reuniao_id uuid not null references public.reunioes (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id),
  primary key (reuniao_id, usuario_id)
);

create index reunioes_usuarios_usuario on public.reunioes_usuarios (usuario_id);

-- Os responsáveis do setor presentes: apagam junto com a reunião, e o responsável excluído leva a ligação (o gatilho
-- manter_responsavel_nas_reunioes copia o nome antes).
create table public.reunioes_responsaveis (
  reuniao_id uuid not null references public.reunioes (id) on delete cascade,
  responsavel_id uuid not null references public.responsaveis_do_setor (id) on delete cascade,
  primary key (reuniao_id, responsavel_id)
);

create index reunioes_responsaveis_responsavel on public.reunioes_responsaveis (responsavel_id);

alter table public.reunioes_usuarios enable row level security;
alter table public.reunioes_responsaveis enable row level security;

-- Privilégios: visitante nada; logado lê, inclui e apaga. A ligação não se altera: troca-se apagando e incluindo.
revoke all on public.reunioes_usuarios, public.reunioes_responsaveis from anon, authenticated;
grant select, insert, delete on public.reunioes_usuarios, public.reunioes_responsaveis to authenticated;

create policy "reunioes_usuarios: ativo lê" on public.reunioes_usuarios
  for select to authenticated using ((select private.usuario_ativo()));
create policy "reunioes_usuarios: administrador e integrante ativos ligam" on public.reunioes_usuarios
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "reunioes_usuarios: administrador e integrante ativos desligam" on public.reunioes_usuarios
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

create policy "reunioes_responsaveis: ativo lê" on public.reunioes_responsaveis
  for select to authenticated using ((select private.usuario_ativo()));
create policy "reunioes_responsaveis: administrador e integrante ativos ligam" on public.reunioes_responsaveis
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "reunioes_responsaveis: administrador e integrante ativos desligam" on public.reunioes_responsaveis
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- O responsável presente é do setor da reunião.
create function private.conferir_responsavel_da_reuniao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  responsavel public.responsaveis_do_setor;
begin
  select * into responsavel from public.responsaveis_do_setor where id = new.responsavel_id;
  if found and responsavel.setor_id is distinct from (select setor_id from public.reunioes where id = new.reuniao_id) then
    raise exception 'responsavel_de_outro_setor:%', responsavel.nome;
  end if;
  return new;
end $$;

create trigger conferir_responsavel_da_reuniao before insert on public.reunioes_responsaveis
  for each row execute function private.conferir_responsavel_da_reuniao();

-- Trocar o setor da reunião não deixa responsável do setor antigo ligado a ela.
create function private.conferir_responsaveis_ao_trocar_o_setor() returns trigger
language plpgsql set search_path = ''
as $$
declare
  nome_do_responsavel text;
begin
  select r.nome into nome_do_responsavel
  from public.reunioes_responsaveis rr join public.responsaveis_do_setor r on r.id = rr.responsavel_id
  where rr.reuniao_id = new.id and r.setor_id <> new.setor_id order by r.nome limit 1;
  if found then
    raise exception 'responsavel_de_outro_setor:%', nome_do_responsavel;
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger conferir_responsaveis_ao_trocar_o_setor after update of setor_id on public.reunioes
  for each row execute function private.conferir_responsaveis_ao_trocar_o_setor();

-- Responsável excluído continua nas reuniões em que esteve, como outro participante com o nome que tinha (a ligação
-- sai em seguida, pela exclusão em cascata). Roda com a permissão de quem apaga, que já altera reuniões.
create function private.manter_responsavel_nas_reunioes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  update public.reunioes set outros_participantes = array_append(outros_participantes, old.nome)
  where id in (select reuniao_id from public.reunioes_responsaveis where responsavel_id = old.id)
    and not old.nome = any (outros_participantes);
  return old;
end $$;

create trigger manter_responsavel_nas_reunioes before delete on public.responsaveis_do_setor
  for each row execute function private.manter_responsavel_nas_reunioes();

-- O estado completo da reunião para o evento, agora com usuários e responsáveis (por nome). A versão anterior é da
-- migração reunioes; os eventos antigos não têm as duas chaves.
create or replace function private.estado_da_reuniao(reuniao uuid) returns jsonb
language sql security definer set search_path = ''
as $$
  select jsonb_build_object('tipo', r.tipo, 'setor_id', r.setor_id, 'setor_sigla', s.sigla, 'data', r.data,
    'hora', r.hora, 'local', r.local, 'anotacoes', r.anotacoes, 'outros_participantes', to_jsonb(r.outros_participantes),
    'processos', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome) order by p.nome)
      from public.reunioes_processos rp join public.processos p on p.id = rp.processo_id
      where rp.reuniao_id = r.id), '[]'::jsonb),
    'usuarios', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'nome', u.nome) order by u.nome)
      from public.reunioes_usuarios ru join public.usuarios u on u.id = ru.usuario_id
      where ru.reuniao_id = r.id), '[]'::jsonb),
    'responsaveis', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'nome', x.nome) order by x.nome)
      from public.reunioes_responsaveis rr join public.responsaveis_do_setor x on x.id = rr.responsavel_id
      where rr.reuniao_id = r.id), '[]'::jsonb))
  from public.reunioes r join public.setores s on s.id = r.setor_id
  where r.id = reuniao $$;

-- Mesmos gatilhos de estado e de evento das ligações de processos. O gatilho de evento leva o mesmo nome em todas as
-- tabelas de ligação, para o SET CONSTRAINTS da função de salvar valer para as três.
create trigger guardar_estado_da_reuniao before insert or delete on public.reunioes_usuarios
  for each row execute function private.guardar_estado_da_reuniao();
create trigger guardar_estado_da_reuniao before insert or delete on public.reunioes_responsaveis
  for each row execute function private.guardar_estado_da_reuniao();
create constraint trigger registrar_evento_da_reuniao_nas_ligacoes after insert or delete on public.reunioes_usuarios
  deferrable initially deferred for each row execute function private.registrar_evento_da_reuniao();
create constraint trigger registrar_evento_da_reuniao_nas_ligacoes after insert or delete on public.reunioes_responsaveis
  deferrable initially deferred for each row execute function private.registrar_evento_da_reuniao();

-- A função de salvar ganha as listas de usuários e de responsáveis: troca de assinatura (a de 9 parâmetros sai). As
-- ligações que saíram são apagadas antes do update, para o gatilho de trocar o setor não ver o que era do setor antigo.
-- Sem security definer: roda com a permissão de quem chama, e a RLS decide.
drop function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[], uuid[]);

create function public.salvar_reuniao(p_id uuid, p_tipo public.tipo_de_reuniao, p_setor_id uuid, p_data date,
  p_hora time, p_local text, p_anotacoes text, p_outros text[], p_processos uuid[], p_usuarios uuid[],
  p_responsaveis uuid[]) returns uuid
language plpgsql set search_path = ''
as $$
declare
  reuniao uuid := p_id;
  processos uuid[] := coalesce(p_processos, '{}');
  usuarios uuid[] := coalesce(p_usuarios, '{}');
  responsaveis uuid[] := coalesce(p_responsaveis, '{}');
begin
  if p_id is null then
    insert into public.reunioes (setor_id, tipo, data, hora, local, anotacoes, outros_participantes)
    values (p_setor_id, p_tipo, p_data, p_hora, p_local, p_anotacoes, coalesce(p_outros, '{}')) returning id into reuniao;
  else
    delete from public.reunioes_processos where reuniao_id = p_id and processo_id <> all (processos);
    delete from public.reunioes_usuarios where reuniao_id = p_id and usuario_id <> all (usuarios);
    delete from public.reunioes_responsaveis where reuniao_id = p_id and responsavel_id <> all (responsaveis);
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
  insert into public.reunioes_usuarios (reuniao_id, usuario_id)
  select reuniao, usuario from unnest(usuarios) as usuario on conflict do nothing;
  insert into public.reunioes_responsaveis (reuniao_id, responsavel_id)
  select reuniao, responsavel from unnest(responsaveis) as responsavel on conflict do nothing;
  set constraints public.conferir_tipo_da_reuniao_na_reuniao, public.conferir_tipo_da_reuniao_nas_ligacoes,
    public.registrar_evento_da_reuniao_na_reuniao, public.registrar_evento_da_reuniao_nas_ligacoes immediate;
  set constraints public.conferir_tipo_da_reuniao_na_reuniao, public.conferir_tipo_da_reuniao_nas_ligacoes,
    public.registrar_evento_da_reuniao_na_reuniao, public.registrar_evento_da_reuniao_nas_ligacoes deferred;
  return reuniao;
end $$;

revoke execute on function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[],
  uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[],
  uuid[], uuid[], uuid[]) to authenticated;
-- Chamadas de dentro dos gatilhos que rodam com a permissão de quem grava.
revoke execute on function private.conferir_responsavel_da_reuniao(), private.conferir_responsaveis_ao_trocar_o_setor(),
  private.manter_responsavel_nas_reunioes()
  from public, anon, authenticated;
