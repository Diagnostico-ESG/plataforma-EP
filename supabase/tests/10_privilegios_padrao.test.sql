-- Nenhuma tabela de public deixa a visitante ou logado os privilégios que a RLS não cobre
-- (causa raiz do bug do truncate, backlog de 2026-10-08). O Supabase concede tudo nas tabelas
-- novas de public; quem cria uma tabela tira estes na mesma migração, e este teste avisa se esquecer.
-- Olha tabelas, views (as do dashboard), views materializadas e tabelas externas.
-- Lê a lista de permissões de cada uma (relacl), que vale em qualquer versão do Postgres;
-- MAINTAIN só existe a partir do 17. Em caso de falha, o pgTAP lista tabela, papel e privilégio.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select is_empty(
  $sql$
    select c.relname || ': ' || coalesce(r.rolname, 'public') || ' ' || a.privilege_type
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) a
    left join pg_roles r on r.oid = a.grantee
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
      and a.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  $sql$,
  'nenhuma tabela pública deixa truncate, references, trigger ou maintain a visitante ou logado'
);
select * from finish();
rollback;
