begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select is(
  (select count(*)::int from pg_tables
   where schemaname = 'public' and not rowsecurity),
  0,
  'toda tabela pública tem RLS ligada'
);
select * from finish();
rollback;
