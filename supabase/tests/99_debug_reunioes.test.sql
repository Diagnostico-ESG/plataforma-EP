-- Reuniões (reunioes, ticket 01): registro por função, regras do tipo/setor/processo, textos, exclusão com contagem,
-- eventos com o estado completo e quem pode o quê.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(4);

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

-- TR1 e TR2 ativos, TR3 inativo, TR4 só com reuniões (para a exclusão do setor).
insert into public.setores (id, sigla, nome, ativo) values
  ('5f000000-0000-0000-0000-0000000000a1', 'TR1', 'Setor Reunião Um', true),
  ('5f000000-0000-0000-0000-0000000000a2', 'TR2', 'Setor Reunião Dois', true),
  ('5f000000-0000-0000-0000-0000000000a3', 'TR3', 'Setor Reunião Três', false),
  ('5f000000-0000-0000-0000-0000000000a4', 'TR4', 'Setor Reunião Quatro', true);
insert into public.macroprocessos (id, codigo, nome) values
  ('af000000-0000-0000-0000-0000000000a1', null, 'Macro Reunião');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo) values
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc A', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc B', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a2', 'af000000-0000-0000-0000-0000000000a1', 'Proc C', 'processo'),
  ('5f000000-0000-0000-0000-0000000000a1', 'af000000-0000-0000-0000-0000000000a1', 'Proc D', 'processo');

create temp table _r (nome text primary key, id uuid);
grant all on _r to authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok($sql$insert into _r select 'x', public.salvar_reuniao(null, 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a1', '2026-11-10', null, null, null, '{}', '{}')$sql$, 'criou');
insert into _tap (linha) select is((select string_agg(acao, ',' order by id) from public.eventos where entidade = 'reuniao'), 'zzz', 'eventos depois de criar');
insert into _tap (linha) select lives_ok($sql$select public.salvar_reuniao((select id from _r), 'sensibilizacao', '5f000000-0000-0000-0000-0000000000a2', '2026-11-10', null, null, null, '{}', '{}')$sql$, 'alterou');
insert into _tap (linha) select is((select string_agg(acao || ':' || coalesce(detalhes -> 'antes' ->> 'setor_sigla', '-') || '>' || coalesce(detalhes -> 'depois' ->> 'setor_sigla', '-'), ' | ' order by id) from public.eventos where entidade = 'reuniao') || ' // guc=' || coalesce(current_setting('ep.reuniao_' || replace((select id::text from _r), '-', '_'), true), 'NULL') || ' // setor=' || (select setor_id::text from public.reunioes limit 1), 'zzz', 'eventos depois de alterar');
reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES
%', (select string_agg(linha, E'
' order by n) from _tap);
end $$;
