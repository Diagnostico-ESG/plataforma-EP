-- Pacote das planilhas (exportacao-e-manutencao, ticket 03; spec, "Modelo de dados" e "Quem pode o quê"; ADR 0018):
-- a função que monta os dados enviados à Edge Function não é chamável pela tela; o pacote traz as etapas ativas com a
-- fase (vazia nas duas fixas), os processos em andamento (o suspenso e o cancelado ficam de fora), as passagens e os
-- identificadores das planilhas, e nenhum nome nem e-mail de usuário. O núcleo do pedido (ticket 02) passa a enviar o
-- pacote. Andamento livre (ticket 06 de exportacao-e-manutencao): a etapa atual, a etiqueta e a data da publicação no
-- lugar de `concluido` e da escolha de publicação; passagens no lugar dos andamentos.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(37);

-- Usuários inventados: a1 administrador, a2 integrante (será responsável de um processo, com nome conhecido).
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set nome = 'Fulana Inventada Responsavel' where id = '00000000-0000-0000-0000-0000000000a2';

-- O banco de desenvolvimento pode já ter tentativas e segredos reais: dentro da transação o teste parte do zero.
delete from public.atualizacoes_das_planilhas;
delete from vault.secrets where name like 'planilhas\_%';
select vault.create_secret('https://funcao.exemplo.test/planilhas', 'planilhas_endereco_da_funcao');
select vault.create_secret('senha-interna-de-teste', 'planilhas_senha_interna');
select vault.create_secret('id-interna-teste', 'planilhas_id_interna');
select vault.create_secret('id-publica-teste', 'planilhas_id_publica');

-- Um setor, um macroprocesso e os processos do cenário (todos com o prefixo T44, para não se misturar com dados do banco).
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000044', 'T44', 'Setor Pacote');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000044', null, 'Macro T44');
-- Sem tipo informado o processo nasce "a classificar"; o Normal nasce do tipo Processo para provar o tipo no pacote.
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000044', 'af000000-0000-0000-0000-000000000044', 'T44 Normal', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000044', 'af000000-0000-0000-0000-000000000044', nome
from unnest(array['T44 Cancelado', 'T44 Concluido', 'T44 Versoes', 'T44 Historica', 'T44 Sem Versao',
  'T44 Nao Publicado', 'T44 Arquivado', 'T44 Suspenso']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000044' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T44_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel || '-' || formato) $$;
create function pg_temp.par() returns jsonb
language sql immutable as $$ select jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')) $$;
grant execute on function pg_temp.arquivo(text, text), pg_temp.par() to authenticated;

-- Mudanças pelas funções e colunas da tela, como administrador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
update public.processos set observacoes = 'Observacao inventada', data_da_modelagem_piloto = '2026-03-10'
  where id = pg_temp.processo('T44 Normal');
update public.processos set responsavel_id = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('T44 Normal');
-- Concluídos: com a data da publicação, sem ela (com a explicação) e o arquivado.
select public.mover_processo(pg_temp.processo('T44 Concluido'), (select id from public.etapas where codigo = 'concluidos'),
  date '2026-04-02');
select public.mover_processo(pg_temp.processo('T44 Nao Publicado'), (select id from public.etapas where codigo = 'concluidos'),
  null, null, 'Explicacao inventada');
select public.mover_processo(pg_temp.processo('T44 Arquivado'), (select id from public.etapas where codigo = 'concluidos'),
  date '2026-04-02');
select public.arquivar_processo(pg_temp.processo('T44 Arquivado'));
select public.cancelar_processo(pg_temp.processo('T44 Cancelado'), 'Motivo inventado');
select public.suspender_processo(pg_temp.processo('T44 Suspenso'), 'Motivo inventado');
select public.registrar_versao(pg_temp.processo('T44 Versoes'), 1, pg_temp.par());
select public.registrar_versao(pg_temp.processo('T44 Versoes'), 2, pg_temp.par());
select public.registrar_versao_historica(pg_temp.processo('T44 Historica'), 5,
  jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')));

-- Provas de quem não pode (a1 é Administrador, mas o pacote não é da tela de ninguém).
insert into _tap (linha) select throws_ok($sql$select private.montar_pacote_das_planilhas()$sql$, '42501', null,
  'o Administrador logado não chama a montagem do pacote');
reset role;
insert into _tap (linha) select is(has_function_privilege('authenticated', 'private.montar_pacote_das_planilhas()', 'execute'),
  false, 'a tela (authenticated) não executa a montagem do pacote');
insert into _tap (linha) select is(has_function_privilege('anon', 'private.montar_pacote_das_planilhas()', 'execute'),
  false, 'o visitante (anon) não executa a montagem do pacote');

-- Uma etapa inativa, como dono.
select public.acrescentar_etapa('inativa_t44', 'Inativa T44', 'IX', null);
update public.etapas set ativa = false where codigo = 'inativa_t44';

create temp table _pacote as select private.montar_pacote_das_planilhas() as p;
create function pg_temp.pacote() returns jsonb language sql stable as $$ select p from _pacote $$;
create function pg_temp.do_processo(nome_do_processo text) returns jsonb language sql stable as $$
  select item from jsonb_array_elements(pg_temp.pacote() -> 'processos') item where item ->> 'nome' = nome_do_processo $$;
create function pg_temp.passagens_de(nome_do_processo text) returns setof jsonb language sql stable as $$
  select item from jsonb_array_elements(pg_temp.pacote() -> 'passagens') item
  where item ->> 'processo_id' = pg_temp.processo(nome_do_processo)::text $$;

-- O que viaja além dos dados.
insert into _tap (linha) select ok((pg_temp.pacote() ->> 'gerado_em')::timestamptz is not null,
  'o pacote traz a data e a hora da geração');
insert into _tap (linha) select is(pg_temp.pacote() #>> '{planilhas,interna}', 'id-interna-teste',
  'o pacote traz o identificador da planilha interna, do cofre');
insert into _tap (linha) select is(pg_temp.pacote() #>> '{planilhas,publica}', 'id-publica-teste',
  'o pacote traz o identificador da planilha pública, do cofre');

-- Etapas.
insert into _tap (linha) select is(jsonb_array_length(pg_temp.pacote() -> 'etapas'),
  (select count(*)::int from public.etapas where ativa), 'o pacote traz as etapas ativas, uma a uma');
insert into _tap (linha) select is((select count(*)::int from jsonb_array_elements(pg_temp.pacote() -> 'etapas') e
  where e ->> 'codigo' = 'inativa_t44'), 0, 'a etapa inativa não entra no pacote');
insert into _tap (linha) select is((select array_agg(k order by k) from jsonb_object_keys(pg_temp.pacote() -> 'etapas' -> 0) k),
  array['codigo', 'fase', 'id', 'ordem'], 'cada etapa traz só id, código, ordem e fase');
insert into _tap (linha) select is((select e ->> 'fase' from jsonb_array_elements(pg_temp.pacote() -> 'etapas') e
  where e ->> 'codigo' = 'modelagem'), 'IV', 'a Modelagem piloto vai com a fase IV');

insert into _tap (linha) select is((select jsonb_typeof(e -> 'fase') from jsonb_array_elements(pg_temp.pacote() -> 'etapas') e
  where e ->> 'codigo' = 'nao_iniciados'), 'null', 'Não iniciados vai sem fase');
insert into _tap (linha) select is((select jsonb_typeof(e -> 'fase') from jsonb_array_elements(pg_temp.pacote() -> 'etapas') e
  where e ->> 'codigo' = 'concluidos'), 'null', 'Concluídos vai sem fase');

-- Processos.
insert into _tap (linha) select is(pg_temp.do_processo('T44 Cancelado'), null,
  'o cancelado fica fora do pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Suspenso'), null,
  'o suspenso fica fora do pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'situacao_guardada', 'em_andamento',
  'o processo comum vai em andamento');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'tipo', 'processo', 'o tipo do processo vai no pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'setor_sigla', 'T44', 'a sigla do setor vai no pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'macroprocesso_nome', 'Macro T44',
  'o nome do macroprocesso vai no pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'observacoes', 'Observacao inventada',
  'as observações do processo vão no pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Normal') ->> 'data_da_modelagem_piloto', '2026-03-10',
  'a data da modelagem piloto vai no pacote como AAAA-MM-DD');
insert into _tap (linha) select is((select array_agg(k order by k) from jsonb_object_keys(pg_temp.do_processo('T44 Normal')) k),
  array['data_da_modelagem_piloto', 'etapa_atual_id', 'etiqueta', 'id', 'macroprocesso_nome', 'nome', 'observacoes',
    'publicado_em', 'setor_sigla', 'situacao_guardada', 'tipo', 'ultima_versao'], 'cada processo traz só os campos combinados');

-- Publicação e etapa atual (Andamento livre): a data da publicação, a etapa e a etiqueta viajam como estão.
insert into _tap (linha) select is(pg_temp.do_processo('T44 Concluido') ->> 'publicado_em', '2026-04-02',
  'a data da publicação vai no pacote');
insert into _tap (linha) select is(jsonb_typeof(pg_temp.do_processo('T44 Nao Publicado') -> 'publicado_em'), 'null',
  'o concluído sem publicação vai sem a data');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.do_processo('T44 Normal') ->> 'etapa_atual_id', pg_temp.do_processo('T44 Normal') ->> 'etiqueta'$sql$,
  $sql$select (select id::text from public.etapas where codigo = 'nao_iniciados'), 'a_fazer'$sql$,
  'a etapa atual e a etiqueta vão no pacote');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Concluido') ->> 'etapa_atual_id',
  (select id::text from public.etapas where codigo = 'concluidos'), 'o concluído vai com a etapa atual Concluídos');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Nao Publicado') ->> 'etapa_atual_id',
  (select id::text from public.etapas where codigo = 'concluidos'), 'o concluído sem publicação vai em Concluídos');
insert into _tap (linha) select is(pg_temp.do_processo('T44 Arquivado') ->> 'etapa_atual_id',
  (select id::text from public.etapas where codigo = 'concluidos'), 'o arquivado continua no pacote, em Concluídos');

-- Última versão não histórica.
insert into _tap (linha) select is((pg_temp.do_processo('T44 Versoes') ->> 'ultima_versao')::int, 2,
  'a última versão é a de maior número');
insert into _tap (linha) select is(jsonb_typeof(pg_temp.do_processo('T44 Historica') -> 'ultima_versao'), 'null',
  'só versão histórica: a última versão não histórica é vazia');
insert into _tap (linha) select is(jsonb_typeof(pg_temp.do_processo('T44 Sem Versao') -> 'ultima_versao'), 'null',
  'sem versão, a última versão é vazia');

-- Passagens.
insert into _tap (linha) select is((select count(*)::int from pg_temp.passagens_de('T44 Normal')), 1,
  'o processo recém-cadastrado tem uma passagem');
insert into _tap (linha) select is((select count(*)::int from pg_temp.passagens_de('T44 Concluido')), 2,
  'as passagens fechadas também vão no pacote');
insert into _tap (linha) select is((select array_agg(k order by k) from jsonb_object_keys((select a from pg_temp.passagens_de('T44 Normal') a limit 1)) k),
  array['concluido_em', 'entrou_em', 'etapa_id', 'etiqueta', 'processo_id', 'saiu_em'],
  'cada passagem traz só processo, etapa, datas e etiqueta (sem quem moveu)');
insert into _tap (linha) select is((select count(*)::int from pg_temp.passagens_de('T44 Concluido') a
  where a ->> 'etiqueta' = 'concluido' and a ->> 'concluido_em' is not null and a ->> 'saiu_em' is null), 1,
  'a passagem aberta em Concluídos vai com a etiqueta e a data do Concluído');

-- Sem pessoa.
insert into _tap (linha) select is(position('Fulana Inventada' in pg_temp.pacote()::text), 0,
  'o nome do responsável do processo não vai no pacote');
insert into _tap (linha) select is(position('ccivil.pr.gov.br' in pg_temp.pacote()::text), 0,
  'nenhum e-mail de usuário vai no pacote');

-- O núcleo do pedido envia o pacote (a ficha só viaja no corpo, nunca fica guardada).
select private.iniciar_atualizacao_das_planilhas('automatica', null);
insert into _tap (linha) select ok(exists (
  select 1 from net.http_request_queue q
  where q.url = 'https://funcao.exemplo.test/planilhas'
    and convert_from(q.body, 'utf8')::jsonb ?& array['tentativa', 'ficha', 'planilhas', 'etapas', 'processos', 'passagens']),
  'o pedido envia à função a tentativa, a ficha e o pacote inteiro');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
