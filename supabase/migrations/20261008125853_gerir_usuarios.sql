-- Login e perfis, ticket 03: o administrador muda perfil, desativa, reativa e corrige o nome de quem já entrou.
-- Travas no formato "motivo:valor", traduzidas pela interface (src/acesso/falhasDeGravacao.ts).

-- Privilégios: ninguém cria nem apaga usuário pela API (a linha nasce no primeiro acesso; ADR 0002);
-- de quem já entrou, só nome, perfil e ativo se alteram.
revoke insert, update, delete on public.usuarios from anon, authenticated;
grant update (nome, perfil, ativo) on public.usuarios to authenticated;

create policy "usuarios: administrador ativo altera" on public.usuarios
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Travas antes de alterar. Security invoker de propósito: só chega aqui quem a RLS deixou alterar (administrador
-- ativo, que lê todos os usuários) ou o dono do banco no painel, onde auth.uid() é nulo e só a última trava vale.
create function private.conferir_alteracao_do_usuario() returns trigger
language plpgsql set search_path = ''
as $$
declare
  quem uuid := (select auth.uid());
begin
  new.nome := btrim(new.nome);
  if old.id = quem and old.ativo and not new.ativo then
    raise exception 'nao_desativa_a_si_mesmo:%', old.id using errcode = 'P0001';
  end if;
  if old.id = quem and new.perfil <> old.perfil then
    raise exception 'nao_muda_o_proprio_perfil:%', old.id using errcode = 'P0001';
  end if;
  -- ponytail: dois administradores rebaixando um ao outro no mesmo instante passariam os dois; com até 10 usuários,
  -- aceito. Se pesar, travar as linhas de administradores (select … for update) antes de contar.
  if old.perfil = 'administrador' and old.ativo and (new.perfil <> 'administrador' or not new.ativo)
    and not exists (select 1 from public.usuarios u where u.perfil = 'administrador' and u.ativo and u.id <> old.id) then
    raise exception 'ultimo_administrador:%', old.nome using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Um evento por campo alterado; a tela altera um campo por vez.
create function private.registrar_evento_do_usuario() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := to_jsonb(old);
  depois jsonb := to_jsonb(new);
  campo text;
begin
  foreach campo in array array['nome', 'perfil', 'ativo'] loop
    continue when antes -> campo = depois -> campo;
    insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
    values ((select auth.uid()),
      case campo when 'nome' then 'corrigir_nome' when 'perfil' then 'mudar_perfil'
        else case when new.ativo then 'reativar' else 'desativar' end end,
      'usuario', new.id::text,
      jsonb_build_object('antes', jsonb_build_object(campo, antes -> campo),
        'depois', jsonb_build_object(campo, depois -> campo)));
  end loop;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.conferir_alteracao_do_usuario(), private.registrar_evento_do_usuario()
  from public, anon, authenticated;

create trigger conferir_alteracao_do_usuario before update on public.usuarios
  for each row execute function private.conferir_alteracao_do_usuario();

create trigger registrar_evento_do_usuario after update on public.usuarios
  for each row execute function private.registrar_evento_do_usuario();
