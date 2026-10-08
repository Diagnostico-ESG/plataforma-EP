-- Ninguém esvazia as tabelas de login-perfis pela API (bug do truncate, backlog de 2026-10-08).
-- A RLS não vale para o truncate; só o privilégio o barra. Sem o privilégio o erro é 42501;
-- com ele, o truncate passa (ou, em usuarios, esbarra na chave estrangeira com outro código).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(6);

create function pg_temp.conferir_que_nao_esvazia(papel text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"role":"%s"}', papel), true);
  execute format('set local role %I', papel);
  insert into _tap (linha) select throws_ok(
    $sql$truncate public.usuarios$sql$, '42501', null, quem || ' não esvazia usuarios');
  insert into _tap (linha) select throws_ok(
    $sql$truncate public.usuarios_emails$sql$, '42501', null, quem || ' não esvazia usuarios_emails');
  insert into _tap (linha) select throws_ok(
    $sql$truncate public.autorizacoes$sql$, '42501', null, quem || ' não esvazia autorizacoes');
  reset role;
end $$;
grant execute on function pg_temp.conferir_que_nao_esvazia(text, text) to anon, authenticated;

select pg_temp.conferir_que_nao_esvazia('authenticated', 'Usuário logado');
select pg_temp.conferir_que_nao_esvazia('anon', 'Visitante');

insert into _tap (linha) select * from finish();
-- A exceção desfaz tudo, inclusive um truncate que tenha passado antes da correção.
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
