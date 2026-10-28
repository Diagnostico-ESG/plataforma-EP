-- Cor do setor na view dos processos (visual-do-cartao, ticket 04): setor_cor igual à cor do setor dono.
begin;
create extension if not exists pgtap with schema extensions;
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(7);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

insert into public.setores (id, sigla, nome, cor) values ('5f000000-0000-0000-0000-0000000000f1', 'TV1', 'Setor da View Um', 17);
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000f1', null, 'Macro da View');

-- O processo nasce pelas mãos do administrador, como na tela.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
  values ('5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo da View', 'processo');
reset role;

create function pg_temp.cor_do_processo() returns int
language sql stable as $$ select setor_cor from public.processos_com_andamento where nome = 'Processo da View' $$;
grant execute on function pg_temp.cor_do_processo() to anon, authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'administrador lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'integrante lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'consulta lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is((select count(*)::int from public.processos_com_andamento), 0, 'usuário desativado não lê a view');
reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select setor_cor from public.processos_com_andamento', '42501', null, 'visitante não lê a view');
reset role;

-- A cor trocada no cadastro vale na próxima leitura; o setor desativado mantém a sua.
update public.setores set cor = 3 where sigla = 'TV1';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 3, 'a cor trocada no setor aparece na view');
reset role;
update public.setores set ativo = false where sigla = 'TV1';
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 3, 'o setor desativado mantém a cor na view');
reset role;

insert into _tap (linha) select * from finish();
-- Devolve o resultado como exceção (e desfaz tudo), como os demais testes.
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
