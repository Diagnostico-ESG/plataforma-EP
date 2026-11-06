-- Importação dos dados atuais, ticket 01 (ADR 0044): importar_processo grava um processo da planilha já na etapa certa, só
-- para o Administrador ativo, criando setor e macroprocesso só se faltam e pulando o processo que já existe. Um único
-- evento "importar" no histórico; nada de movimento; a marca da importação não vaza para o cadastro comum. Só dados inventados.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(51);

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

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Responsável inicial: Não iniciados com o integrante, Modelagem piloto e Aprovação pelo setor com o administrador.
update public.etapas set responsavel_inicial_id = '00000000-0000-0000-0000-0000000000a2' where codigo = 'nao_iniciados';
update public.etapas set responsavel_inicial_id = '00000000-0000-0000-0000-0000000000a1' where codigo in ('modelagem', 'aprovacao_setor');

-- Um setor, um macroprocesso e um processo que já existem antes da importação.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000074', 'EXI', 'Setor Existente');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000074', null, 'Macro Existente');
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000074', 'af000000-0000-0000-0000-000000000074', 'Já Existe');

create function pg_temp.importar(setor text, macro text, nome text, etapa text, publicacao date default null,
  piloto date default null, anotacoes text default null) returns text
language sql as $$ select public.importar_processo(setor, macro, nome, etapa, publicacao, piloto, anotacoes) $$;
grant execute on function pg_temp.importar(text, text, text, text, date, date, text) to authenticated;

create function pg_temp.processo(sigla_do_setor text, nome_do_processo text) returns uuid
language sql stable as $$
  select p.id from public.processos p join public.setores s on s.id = p.setor_id
  where s.sigla = sigla_do_setor and p.nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text, text) to authenticated;

create function pg_temp.linha(sigla_do_setor text, nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(sigla_do_setor, nome_do_processo) $$;
grant execute on function pg_temp.linha(text, text) to authenticated;

create function pg_temp.eventos(sigla_do_setor text, nome_do_processo text, entidade_do_evento text, acao_do_evento text)
  returns bigint language sql stable as $$
  select count(*) from public.eventos where entidade = entidade_do_evento and acao = acao_do_evento
    and entidade_ref = pg_temp.processo(sigla_do_setor, nome_do_processo)::text $$;
grant execute on function pg_temp.eventos(text, text, text, text) to authenticated;

-- ===== O administrador importa =====
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is(pg_temp.importar('XYZ', 'Gestão de exemplos', 'Exemplo Alfa', 'nao_iniciados'), 'criado',
  'o administrador importa um processo em Não iniciados');
insert into _tap (linha) select is((select nome from public.setores where sigla = 'XYZ'), 'XYZ', 'o setor que faltava nasce com o nome igual à sigla');
insert into _tap (linha) select is((select count(*) from public.macroprocessos where nome = 'Gestão de exemplos'), 1::bigint,
  'o macroprocesso que faltava nasce');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Alfa')).etapa_atual_codigo, 'nao_iniciados', 'o processo está em Não iniciados');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Alfa')).etiqueta::text, 'a_fazer', 'com A fazer');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Alfa')).responsavel_id, '00000000-0000-0000-0000-0000000000a2'::uuid,
  'e o responsável inicial da etapa');

insert into _tap (linha) select is(
  pg_temp.importar('xyz', 'gestão de exemplos', 'Exemplo Beta', 'modelagem', null, date '2026-09-01', 'Falta o fluxo'), 'criado',
  'importa em outra etapa, com a data do piloto e a anotação');
insert into _tap (linha) select is((select count(*) from public.setores where sigla = 'XYZ'), 1::bigint,
  'o setor existente é reaproveitado, mesmo com a sigla em outra caixa');
insert into _tap (linha) select is((select count(*) from public.macroprocessos where lower(nome) = 'gestão de exemplos'), 1::bigint,
  'o macroprocesso existente é reaproveitado, mesmo com o nome em outra caixa');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Beta')).etapa_atual_codigo, 'modelagem', 'o processo está na etapa pedida');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Beta')).etiqueta::text, 'concluido', 'com o status Finalizado');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Beta')).responsavel_id, '00000000-0000-0000-0000-0000000000a1'::uuid,
  'e o responsável inicial dessa etapa');
insert into _tap (linha) select is((pg_temp.linha('XYZ', 'Exemplo Beta')).data_da_modelagem_piloto, date '2026-09-01', 'a data do piloto é gravada');
insert into _tap (linha) select is((select anotacoes from public.processos where id = pg_temp.processo('XYZ', 'Exemplo Beta')),
  'Falta o fluxo', 'a anotação é gravada');
insert into _tap (linha) select is((select count(*) from public.passagens where processo_id = pg_temp.processo('XYZ', 'Exemplo Beta')),
  1::bigint, 'uma passagem só, a aberta');
insert into _tap (linha) select ok((pg_temp.linha('XYZ', 'Exemplo Beta')).entrou_na_etapa_em >= now() - interval '1 minute',
  'a contagem de dias na etapa começa na importação');

-- ===== Concluídos, Aprovação e Publicação =====
insert into _tap (linha) select is(pg_temp.importar('ABC', 'Orçamentário', 'Exemplo Gama', 'concluidos', date '2026-10-16'), 'criado',
  'importa em Concluídos com a Data da Publicação');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).etapa_atual_codigo, 'concluidos', 'o processo está em Concluídos');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).etiqueta::text, 'concluido', 'com o status de Concluídos');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).publicado_em, date '2026-10-16', 'e a Data da Publicação');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).responsavel_id, null::uuid, 'sem responsável');
-- Ajuste de 2026-11-06 (ADR 0045): o importado em Concluídos fica no Quadro, como qualquer concluído (sai após 30 dias).
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).no_quadro, true, 'e no Quadro');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Gama')).tirado_do_quadro_em, null::timestamptz, 'sem a marca de tirado do Quadro');
select pg_temp.importar('ABC', 'Orçamentário', 'Exemplo Delta', 'aprovacao_setor');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Delta')).responsavel_id, '00000000-0000-0000-0000-0000000000a1'::uuid,
  'Aprovação pelo setor leva o responsável inicial dela');
select pg_temp.importar('ABC', 'Orçamentário', 'Exemplo Epsilon', 'publicacao');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Epsilon')).etapa_atual_codigo, 'publicacao', 'Publicação sem data entra na etapa Publicação');
insert into _tap (linha) select is((pg_temp.linha('ABC', 'Exemplo Epsilon')).publicado_em, null::date, 'e sem Data da Publicação');

-- ===== O que já existe não muda =====
insert into _tap (linha) select is(pg_temp.importar('exi', 'macro existente', '  já existe ', 'revisao_interna'), 'ja_existia',
  'o processo que já existe é pulado (setor e nome sem diferença de caixa e espaços)');
insert into _tap (linha) select is((pg_temp.linha('EXI', 'Já Existe')).etapa_atual_codigo, 'nao_iniciados', 'e nada muda nele');
insert into _tap (linha) select is((select count(*) from public.setores where sigla = 'EXI'), 1::bigint, 'nenhum setor a mais');
insert into _tap (linha) select is((select count(*) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000074'), 1::bigint,
  'nenhum processo a mais');

-- ===== Um único registro no histórico =====
insert into _tap (linha) select is(pg_temp.eventos('XYZ', 'Exemplo Beta', 'processo', 'importar'), 1::bigint, 'um evento "importar"');
insert into _tap (linha) select is((select autor_id from public.eventos where acao = 'importar'
  and entidade_ref = pg_temp.processo('XYZ', 'Exemplo Beta')::text), '00000000-0000-0000-0000-0000000000a1'::uuid, 'com quem importou');
insert into _tap (linha) select is((select detalhes -> 'depois' ->> 'etapa_codigo' from public.eventos where acao = 'importar'
  and entidade_ref = pg_temp.processo('XYZ', 'Exemplo Beta')::text), 'modelagem', 'e a etapa em que o processo entrou');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo'
  and entidade_ref = pg_temp.processo('XYZ', 'Exemplo Beta')::text), 1::bigint, 'nenhum outro evento do processo (nem criar, nem responsável)');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'passagem'
  and entidade_ref = pg_temp.processo('XYZ', 'Exemplo Beta')::text), 0::bigint, 'nenhum movimento');

-- ===== Quem pode =====
select pg_temp.claims('a2');
insert into _tap (linha) select throws_ok($sql$select pg_temp.importar('REC', 'Macro Rec', 'Proc Rec', 'nao_iniciados')$sql$,
  '42501', null, 'o integrante do EP não importa');
select pg_temp.claims('a3');
insert into _tap (linha) select throws_ok($sql$select pg_temp.importar('REC', 'Macro Rec', 'Proc Rec', 'nao_iniciados')$sql$,
  '42501', null, 'a consulta não importa');
select pg_temp.claims('a4');
insert into _tap (linha) select throws_ok($sql$select pg_temp.importar('REC', 'Macro Rec', 'Proc Rec', 'nao_iniciados')$sql$,
  '42501', null, 'o administrador desativado não importa');
select pg_temp.claims('a1');
insert into _tap (linha) select is((select count(*) from public.setores where sigla = 'REC'), 0::bigint, 'as recusas não deixam setor criado');

-- ===== Recusas de regra: nada fica pela metade =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.importar('ZZZ', 'Macro Z', 'Proc Z', 'etapa_que_nao_existe')$sql$,
  'P0001', 'etapa_invalida:etapa_que_nao_existe', 'etapa que não existe é recusada');
insert into _tap (linha) select is((select count(*) from public.setores where sigla = 'ZZZ'), 0::bigint, 'e não deixa setor criado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.importar('FUT', 'Macro Fut', 'Proc Fut', 'modelagem', null, current_date + 30)$sql$,
  'P0001', null, 'data do piloto no futuro é recusada');
insert into _tap (linha) select is((select count(*) from public.setores where sigla = 'FUT'), 0::bigint, 'e não deixa setor criado');

-- ===== A marca da importação não vaza para o cadastro comum =====
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000074', 'af000000-0000-0000-0000-000000000074', 'Cadastro Comum');
insert into _tap (linha) select is((pg_temp.linha('EXI', 'Cadastro Comum')).etapa_atual_codigo, 'nao_iniciados',
  'o cadastro comum seguinte entra em Não iniciados');
insert into _tap (linha) select is(pg_temp.eventos('EXI', 'Cadastro Comum', 'processo', 'criar'), 1::bigint, 'e gera o evento "criar"');

-- ===== Visitante =====
reset role;
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.importar_processo('REC', 'Macro Rec', 'Proc Rec', 'nao_iniciados', null, null, null)$sql$,
  '42501', null, 'o visitante não importa');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is((select prosecdef from pg_proc where pronamespace = 'public'::regnamespace and proname = 'importar_processo'),
  false, 'a função de public não usa security definer');
insert into _tap (linha) select is((select prosecdef from pg_proc where pronamespace = 'private'::regnamespace and proname = 'importar_processo'),
  true, 'a que grava mora em private');
insert into _tap (linha) select ok((select proconfig @> array['search_path='] or proconfig @> array['search_path=""']
  from pg_proc where pronamespace = 'private'::regnamespace and proname = 'importar_processo'), 'com search_path vazio');
insert into _tap (linha) select is(has_function_privilege('anon',
  'public.importar_processo(text, text, text, text, date, date, text)', 'execute'), false, 'o visitante não tem execute');
insert into _tap (linha) select is(has_function_privilege('authenticated',
  'public.importar_processo(text, text, text, text, date, date, text)', 'execute'), true, 'o usuário logado tem execute');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
