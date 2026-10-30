-- Origem, Contexto e Observações saem (enxugar-cartao-e-cadastro, ticket 05): a junção dos textos antigos nas Anotações,
-- a view e o histórico sem as três colunas, as colunas e o tipo apagados, e a leitura das Anotações juntadas por perfil.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(20);

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000072', 'T72', 'Setor Textos Antigos');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000072', null, 'Macro Textos Antigos');
insert into public.processos (id, setor_id, macroprocesso_id, nome, tipo) values
  ('70000000-0000-0000-0000-000000000072', '5f000000-0000-0000-0000-000000000072', 'af000000-0000-0000-0000-000000000072',
   'T72 Estado', 'processo'),
  ('70000000-0000-0000-0000-000000000073', '5f000000-0000-0000-0000-000000000072', 'af000000-0000-0000-0000-000000000072',
   'T72 Juntado', 'processo');

-- ===== A junção: "Contexto: …", "Observações: …" e o texto que já havia, separados por linha em branco =====
insert into _tap (linha) select is(private.juntar_textos_antigos('C', null, null), 'Contexto: C', 'só o Contexto');
insert into _tap (linha) select is(private.juntar_textos_antigos(null, 'O', null), 'Observações: O', 'só as Observações');
insert into _tap (linha) select is(private.juntar_textos_antigos('C', 'O', null), E'Contexto: C\n\nObservações: O', 'os dois, nessa ordem');
insert into _tap (linha) select is(private.juntar_textos_antigos('C', 'O', 'Texto antigo'),
  E'Contexto: C\n\nObservações: O\n\nTexto antigo', 'os dois antes das Anotações que já havia');
insert into _tap (linha) select is(private.juntar_textos_antigos(null, '', 'Texto antigo'), 'Texto antigo',
  'só as Anotações: o texto fica como estava');
insert into _tap (linha) select is(private.juntar_textos_antigos(null, null, null), null::text, 'nenhum texto: fica nulo');
insert into _tap (linha) select is(private.juntar_textos_antigos('   ', 'O', null), 'Observações: O',
  'trecho vazio ou só de espaços não gera rótulo');

-- ===== A view sem as três colunas, com as outras na mesma ordem e com security_invoker =====
insert into _tap (linha) select is(
  (select array_agg(a.attname::text order by a.attnum) from pg_attribute a
    where a.attrelid = 'public.processos_com_andamento'::regclass and a.attnum > 0 and not a.attisdropped),
  array['id', 'nome', 'tipo', 'processo_pai_id', 'situacao_guardada', 'motivo_da_situacao', 'criado_em', 'setor_id',
    'setor_sigla', 'macroprocesso_id', 'macroprocesso_nome', 'situacao', 'etapa_atual_id', 'etapa_atual_codigo',
    'etapa_atual_nome', 'etapa_atual_ordem', 'responsavel_id', 'responsavel_nome', 'responsavel_foto_url',
    'data_da_modelagem_piloto', 'responsavel_ativo', 'ultima_versao_numero', 'ultima_versao_historica',
    'ultima_versao_tem_relatorio', 'subprocessos_quantidade', 'publicado_em', 'etiqueta', 'entrou_na_etapa_em',
    'etapa_atual_posicao', 'link_da_publicacao', 'sem_publicacao', 'explicacao_sem_publicacao', 'tem_versao_piloto',
    'tem_versao_em_sequencia', 'tem_relatorio_numerado', 'data_da_validacao', 'setor_cor', 'tirado_do_quadro_em',
    'no_quadro'],
  'a view não tem Origem, Contexto nem Observações e mantém as outras colunas na mesma ordem');
insert into _tap (linha) select ok(
  (select reloptions from pg_class where oid = 'public.processos_com_andamento'::regclass) @> array['security_invoker=true'],
  'a view segue com security_invoker');

-- ===== As colunas e o tipo da Origem não existem mais =====
insert into _tap (linha) select hasnt_column('public', 'processos', 'origem', 'a coluna origem saiu');
insert into _tap (linha) select hasnt_column('public', 'processos', 'contexto', 'a coluna contexto saiu');
insert into _tap (linha) select hasnt_column('public', 'processos', 'observacoes', 'a coluna observacoes saiu');
insert into _tap (linha) select hasnt_type('public', 'origem_do_processo', 'o tipo origem_do_processo saiu');

-- ===== O estado guardado no histórico não cita mais as três =====
insert into _tap (linha) select ok(
  not ((select detalhes -> 'depois' from public.eventos where entidade = 'processo' and acao = 'criar'
    and entidade_ref = '70000000-0000-0000-0000-000000000072') ?| array['origem', 'contexto', 'observacoes']),
  'o evento de criar não traz Origem, Contexto nem Observações');

-- ===== O texto juntado se lê pelos perfis certos =====
update public.processos set anotacoes = private.juntar_textos_antigos('Contexto inventado', 'Observação inventada', 'Texto antigo')
  where id = '70000000-0000-0000-0000-000000000073';
create function pg_temp.juntado() returns text
language sql stable as $$ select anotacoes from public.processos where id = '70000000-0000-0000-0000-000000000073' $$;
grant execute on function pg_temp.juntado() to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.juntado(),
  E'Contexto: Contexto inventado\n\nObservações: Observação inventada\n\nTexto antigo', 'administrador lê o texto juntado');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select ok(pg_temp.juntado() like 'Contexto: %', 'integrante lê o texto juntado');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select ok(pg_temp.juntado() like 'Contexto: %', 'consulta lê o texto juntado');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo('70000000-0000-0000-0000-000000000073', 'x', 'Outro')$sql$,
  '42501', null, 'consulta não altera as Anotações');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.juntado(), null::text, 'desativado não lê o texto juntado');
reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok($sql$select anotacoes from public.processos$sql$, '42501', null,
  'visitante não lê as Anotações');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
