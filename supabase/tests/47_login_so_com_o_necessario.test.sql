-- Defesa em profundidade (backlog de 2026-10-09, achado do /ship das permissões padrão): as três tabelas de
-- login guardavam select/insert/update/delete para visitante e logado, barrados só pela RLS. Agora cada papel
-- guarda exatamente o que a plataforma usa; qualquer privilégio a mais (de tabela ou de coluna) reprova aqui.
-- Papéis internos (postgres, service_role, supabase_auth_admin) ficam de fora: não passam pela API.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

select is_empty(
  $sql$
    with concedidos as (
      select c.relname::text as tabela, coalesce(r.rolname, 'public')::text as papel, a.privilege_type::text as privilegio, null::text as coluna
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(c.relacl) a
      left join pg_roles r on r.oid = a.grantee
      where n.nspname = 'public' and c.relname in ('usuarios', 'usuarios_emails', 'autorizacoes')
      union all
      select c.relname::text, coalesce(r.rolname, 'public')::text, a.privilege_type::text, att.attname::text
      from pg_attribute att
      join pg_class c on c.oid = att.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(att.attacl) a
      left join pg_roles r on r.oid = a.grantee
      where n.nspname = 'public' and c.relname in ('usuarios', 'usuarios_emails', 'autorizacoes') and att.attacl is not null
    ),
    permitidos (tabela, papel, privilegio, coluna) as (
      values
        ('usuarios', 'authenticated', 'SELECT', null),
        ('usuarios', 'authenticated', 'UPDATE', 'nome'),
        ('usuarios', 'authenticated', 'UPDATE', 'perfil'),
        ('usuarios', 'authenticated', 'UPDATE', 'ativo'),
        ('usuarios_emails', 'authenticated', 'SELECT', null),
        ('autorizacoes', 'authenticated', 'SELECT', null),
        ('autorizacoes', 'authenticated', 'INSERT', null),
        ('autorizacoes', 'authenticated', 'DELETE', null),
        ('autorizacoes', 'authenticated', 'UPDATE', 'perfil')
    )
    select c.tabela || ': ' || c.papel || ' ' || c.privilegio || coalesce(' (' || c.coluna || ')', '')
    from concedidos c
    where c.papel in ('public', 'anon', 'authenticated')
      and not exists (
        select 1 from permitidos p
        where p.tabela = c.tabela and p.papel = c.papel and p.privilegio = c.privilegio
          and p.coluna is not distinct from c.coluna)
  $sql$,
  'usuarios, usuarios_emails e autorizacoes guardam, para visitante e logado, só os privilégios que a plataforma usa'
);

select * from finish();
rollback;
