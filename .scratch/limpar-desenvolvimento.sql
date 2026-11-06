-- LIMPEZA DO BANCO DE DESENVOLVIMENTO (plataforma-ep-dev, ref yclkzyoebpsxmgpbcbus)
-- Apaga TODOS os dados de public (setores, macroprocessos, processos, etapas, versões, reuniões,
-- histórico etc.) e todos os usuários, exceto os de perfil 'administrador'.
-- NÃO RODAR NA PRODUÇÃO (plataforma-ep-prod, ref shiummttjxncahitrjwe). Confira o projeto no
-- painel antes de colar. Rode no SQL Editor; é uma transação só: se algo falhar, nada é apagado.
-- Não apaga arquivos do Google Drive (a plataforma só guarda referências a eles).

begin;

-- Desliga os gatilhos só nesta transação (há gatilhos que impedem apagar versões, histórico etc.).
set local session_replication_role = replica;

do $$
declare
  admins int;
  tabela text;
begin
  select count(*) into admins from public.usuarios where perfil = 'administrador';
  if admins = 0 then
    raise exception 'Nenhum administrador encontrado em public.usuarios: nada foi apagado.';
  end if;

  -- Todas as tabelas de public, menos as três do login (essas são tratadas abaixo).
  for tabela in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not in ('usuarios', 'usuarios_emails', 'autorizacoes')
  loop
    execute format('truncate table public.%I restart identity cascade', tabela);
  end loop;

  delete from public.usuarios_emails
    where usuario_id not in (select id from public.usuarios where perfil = 'administrador');
  delete from public.autorizacoes
    where email not in (
      select ue.email from public.usuarios_emails ue
      join public.usuarios u on u.id = ue.usuario_id where u.perfil = 'administrador');
  update public.autorizacoes
    set criada_por = null
    where criada_por is not null
      and criada_por not in (select id from public.usuarios where perfil = 'administrador');
  delete from public.usuarios where perfil <> 'administrador';
  delete from auth.users where id not in (select id from public.usuarios);

  raise notice 'Pronto. Administradores mantidos: %', admins;
end
$$;

-- Conferência: deve mostrar só o(s) administrador(es), com as demais contagens em zero.
select (select count(*) from public.usuarios) as usuarios,
       (select count(*) from auth.users) as contas_de_login,
       (select count(*) from public.setores) as setores,
       (select count(*) from public.processos) as processos,
       (select count(*) from public.eventos) as historico;

commit;
