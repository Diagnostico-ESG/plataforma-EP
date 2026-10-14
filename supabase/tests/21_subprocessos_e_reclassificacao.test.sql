-- Subprocessos e reclassificação (processos-etapas, ticket 08): pai do tipo Processo, macroprocesso do pai, filhos que
-- acompanham o pai, exclusão recusada com a contagem, a função de reclassificar, eventos e perfis.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(34);

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

-- TS8 (envolvido nos dois macroprocessos pelos processos abaixo) e TS9 (em nenhum, até o Filho).
insert into public.setores (id, sigla, nome) values
  ('5f000000-0000-0000-0000-000000000008', 'TS8', 'Setor Estrutura'),
  ('5f000000-0000-0000-0000-000000000009', 'TS9', 'Setor do Filho');
insert into public.macroprocessos (id, codigo, nome) values
  ('af000000-0000-0000-0000-000000000081', null, 'Macro Um'),
  ('af000000-0000-0000-0000-000000000082', null, 'Macro Dois');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo) values
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Pai', 'processo'),
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000082', 'Outro Pai', 'processo'),
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Terceiro Pai', 'processo'),
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000082', 'Solto', 'a_classificar'),
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000082', 'Sem Tipo', 'a_classificar'),
  ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000082', 'Avulso', 'processo');

-- O id do "Solto" antes da reclassificação: o item reclassificado continua o mesmo.
create temp table _solto as select id from public.processos where nome = 'Solto';
grant select on _solto to authenticated;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$ select id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.macro(nome_do_processo text) returns uuid
language sql stable as $$ select macroprocesso_id from public.processos where nome = nome_do_processo $$;
grant execute on function pg_temp.macro(text) to authenticated;

create function pg_temp.envolvido(sigla_do_setor text, id_do_macro uuid) returns boolean
language sql stable as $$
  select exists (select 1 from public.setores_envolvidos v join public.setores s on s.id = v.setor_id
    where s.sigla = sigla_do_setor and v.macroprocesso_id = id_do_macro) $$;
grant execute on function pg_temp.envolvido(text, uuid) to authenticated;

create function pg_temp.evento(nome_do_processo text, acao_do_evento text) returns jsonb
language sql stable as $$
  select detalhes from public.eventos where entidade = 'processo' and acao = acao_do_evento
    and entidade_ref = pg_temp.processo(nome_do_processo)::text order by ocorrido_em desc, id desc limit 1 $$;
grant execute on function pg_temp.evento(text, text) to authenticated;

create function pg_temp.status(nome_do_processo text, codigo_da_etapa text) returns text
language sql stable as $$
  select a.status::text from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.status(text, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- Preparação: as etapas do setor resolvidas e a modelagem do "Solto" concluída.
update public.andamentos set status = 'realizada_anteriormente', nota = 'Feita antes'
  where setor_id = '5f000000-0000-0000-0000-000000000008' and status = 'pendente';
update public.andamentos set status = 'em_andamento' where processo_id = pg_temp.processo('Solto')
  and etapa_id = (select id from public.etapas where codigo = 'modelagem');
update public.andamentos set status = 'concluida' where processo_id = pg_temp.processo('Solto')
  and etapa_id = (select id from public.etapas where codigo = 'modelagem');

-- Cadastro do subprocesso: adota o macroprocesso do pai e inclui o setor dele como envolvido.
insert into _tap (linha) select lives_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
    values ('5f000000-0000-0000-0000-000000000009', 'af000000-0000-0000-0000-000000000082', 'Filho', 'subprocesso',
      pg_temp.processo('Pai'))$sql$,
  'subprocesso com pai do tipo Processo é cadastrado');
insert into _tap (linha) select is(pg_temp.macro('Filho'), 'af000000-0000-0000-0000-000000000081'::uuid,
  'o subprocesso adota o macroprocesso do pai, não o informado');
insert into _tap (linha) select ok(pg_temp.envolvido('TS9', 'af000000-0000-0000-0000-000000000081'),
  'o setor do subprocesso entra como envolvido no macroprocesso do pai');
insert into _tap (linha) select is(pg_temp.evento('Filho', 'criar') -> 'depois' ->> 'processo_pai_nome', 'Pai',
  'o evento do cadastro traz o nome do pai');

-- Pai que não é Processo; Processo e "a classificar" não têm pai.
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
    values ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Neto', 'subprocesso',
      pg_temp.processo('Filho'))$sql$,
  'P0001', 'pai_nao_e_processo', 'pai subprocesso é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
    values ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Filho do Solto',
      'subprocesso', pg_temp.processo('Solto'))$sql$,
  'P0001', 'pai_nao_e_processo', 'pai "a classificar" é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
    values ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Processo com Pai',
      'processo', pg_temp.processo('Pai'))$sql$,
  '23514', null, 'processo com pai é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
    values ('5f000000-0000-0000-0000-000000000008', 'af000000-0000-0000-0000-000000000081', 'Solto com Pai',
      'a_classificar', pg_temp.processo('Pai'))$sql$,
  '23514', null, '"a classificar" com pai é recusado');

-- O macroprocesso do subprocesso é sempre o do pai; mudar o do pai leva os filhos.
update public.processos set macroprocesso_id = 'af000000-0000-0000-0000-000000000082' where nome = 'Filho';
insert into _tap (linha) select is(pg_temp.macro('Filho'), 'af000000-0000-0000-0000-000000000081'::uuid,
  'editar o macroprocesso do subprocesso direto não o tira do macroprocesso do pai');
update public.processos set macroprocesso_id = 'af000000-0000-0000-0000-000000000082' where nome = 'Pai';
insert into _tap (linha) select is(pg_temp.macro('Filho'), 'af000000-0000-0000-0000-000000000082'::uuid,
  'mudar o macroprocesso do pai muda o do filho');
insert into _tap (linha) select ok(pg_temp.envolvido('TS9', 'af000000-0000-0000-0000-000000000082'),
  'o setor do filho entra como envolvido no novo macroprocesso');

insert into _tap (linha) select throws_ok(
  $sql$delete from public.processos where nome = 'Pai'$sql$, 'P0001', 'processo_com_subprocessos:1',
  'excluir processo com subprocessos é recusado com a contagem');

-- Recusas da reclassificação.
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'subprocesso', pg_temp.processo('Pai'), '  ')$sql$,
  'P0001', 'motivo_obrigatorio', 'reclassificar sem motivo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Pai'), 'subprocesso', pg_temp.processo('Outro Pai'),
    'Tentativa')$sql$,
  'P0001', 'processo_com_subprocessos:1', 'processo com subprocessos não vira subprocesso');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'subprocesso', null, 'Tentativa')$sql$,
  'P0001', 'pai_nao_e_processo', 'virar subprocesso sem pai é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'subprocesso', pg_temp.processo('Solto'),
    'Tentativa')$sql$,
  'P0001', 'pai_nao_e_processo', 'virar subprocesso de um "a classificar" é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'subprocesso', pg_temp.processo('Avulso'),
    'Tentativa')$sql$,
  'P0001', 'pai_nao_e_processo', 'virar subprocesso de si mesmo é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'a_classificar', null, 'Tentativa')$sql$,
  'P0001', 'tipo_invalido:processo:a_classificar', 'processo não volta a "a classificar"');

-- Subprocesso vira processo: o pai sai e o macroprocesso fica.
insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Filho'), 'processo', null, 'Virou processo')$sql$,
  'subprocesso vira processo');
insert into _tap (linha) select ok(
  (select tipo = 'processo' and processo_pai_id is null and macroprocesso_id = 'af000000-0000-0000-0000-000000000082'
   from public.processos where nome = 'Filho'),
  'ao virar processo, o pai é apagado e o macroprocesso continua o mesmo');
insert into _tap (linha) select is(
  (select array[d -> 'antes' ->> 'tipo', d -> 'depois' ->> 'tipo', d ->> 'motivo'] from pg_temp.evento('Filho', 'reclassificar') d),
  array['subprocesso', 'processo', 'Virou processo'], 'a reclassificação gera o evento com de, para e motivo');

-- "A classificar" vira subprocesso de um pai em outro macroprocesso: o mesmo item, com as etapas dele.
insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Solto'), 'subprocesso', pg_temp.processo('Terceiro Pai'),
    'Faz parte do Terceiro Pai')$sql$,
  '"a classificar" vira subprocesso');
insert into _tap (linha) select ok(
  (select tipo = 'subprocesso' and macroprocesso_id = 'af000000-0000-0000-0000-000000000081'
   from public.processos where nome = 'Solto'),
  'ao virar subprocesso, o item passa ao macroprocesso do pai');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos where processo_id = (select id from _solto)), 6,
  'o item reclassificado mantém o id e os andamentos');
insert into _tap (linha) select is(pg_temp.status('Solto', 'modelagem'), 'concluida',
  'o andamento concluído continua concluído');
insert into _tap (linha) select is(
  (select array[d -> 'antes' ->> 'tipo', d -> 'depois' ->> 'processo_pai_nome', d ->> 'motivo']
   from pg_temp.evento('Solto', 'reclassificar') d),
  array['a_classificar', 'Terceiro Pai', 'Faz parte do Terceiro Pai'], 'o evento traz o pai novo e o motivo');
insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Sem Tipo'), 'processo', null, 'É um processo')$sql$,
  '"a classificar" vira processo');

-- Tipo e pai só mudam pela função.
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set tipo = 'subprocesso' where nome = 'Avulso'$sql$,
  'P0001', 'tipo_so_pela_funcao', 'mudar o tipo direto é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set processo_pai_id = pg_temp.processo('Pai') where nome = 'Avulso'$sql$,
  'P0001', 'tipo_so_pela_funcao', 'mudar o pai direto é recusado');

insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo('00000000-0000-0000-0000-000000000000', 'processo', null, 'Tentativa')$sql$,
  'P0001', 'registro_inexistente', 'processo inexistente');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where oid = 'public.reclassificar_processo(uuid, public.tipo_de_processo, uuid, text)'::regprocedure),
  false, 'a função de reclassificar não é security definer');

-- Perfis.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Avulso'), 'subprocesso', pg_temp.processo('Pai'),
    'Tentativa')$sql$,
  '42501', null, 'Consulta não reclassifica');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo((select id from _solto), 'processo', null, 'Tentativa')$sql$,
  'P0001', 'registro_inexistente', 'Inativo não reclassifica (não lê nada, o processo "não existe" para ele)');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select public.reclassificar_processo('00000000-0000-0000-0000-000000000000', 'processo', null, 'Tentativa')$sql$,
  '42501', null, 'visitante não reclassifica');

reset role;
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
