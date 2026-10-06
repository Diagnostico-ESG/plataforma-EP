begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select is(
  (select count(*)::int from storage.buckets where public),
  0,
  'nenhum bucket do Storage é público'
);
select * from finish();
rollback;
