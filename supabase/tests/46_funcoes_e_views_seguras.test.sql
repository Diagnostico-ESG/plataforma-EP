-- Testes gerais de defesa em profundidade (backlog de 2026-10-09, achados do /ship das permissões padrão):
-- o Supabase concede execução de função nova a visitante e logado, e uma view sem security_invoker
-- ignora a RLS das tabelas. Quem cria uma função ou view em public cuida disso na mesma migração;
-- estes testes avisam se esquecer. Em caso de falha, o pgTAP lista o que sobrou.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select is_empty(
  $sql$
    select c.relname || ' (relkind ' || c.relkind::text || ')'
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
      and not coalesce(c.reloptions @> array['security_invoker=true'], false)
  $sql$,
  'toda view de public tem security_invoker = true'
);

-- proacl nulo quer dizer o padrão do Postgres: execução liberada a todos (PUBLIC).
select is_empty(
  $sql$
    select p.oid::regprocedure::text || ': ' || coalesce(r.rolname, 'public')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    left join pg_roles r on r.oid = a.grantee
    where n.nspname = 'public'
      and a.privilege_type = 'EXECUTE'
      and (a.grantee = 0 or r.rolname = 'anon')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  $sql$,
  'nenhuma função de public pode ser executada por visitante (anon ou public)'
);

select is_empty(
  $sql$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  $sql$,
  'nenhuma função security definer em public (elas ficam em private, fora da API)'
);

select * from finish();
rollback;
