-- Duas revisões, o registro (revisoes-aprovacao, ticket 07; ADR 0046): quem pode o quê em revisoes_internas com a Revisão
-- do relatório e as regras do gatilho nas duas etapas: "sem alteração" na Revisão do relatório vale para o relatório
-- numerado mais recente (sem ele, recusada); "corrigida" liga o que foi enviado na passagem ao anterior e deduz o escopo
-- (só relatório, só versão, os dois; nada, recusada); o escopo não se escreve; a edição recalcula; os eventos dizem a etapa
-- e os relatórios. As regras da Revisão do fluxograma que não mudaram ficam no 39 e no 41.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(32);

-- Trava de arquivos (ticket 11): este teste não prova a trava (ela é do 59), então move sem ela.
create function pg_temp.mover_sem_trava(p_processo uuid, p_etapa uuid) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.etapas set ativa = false
  where codigo in ('modelagem', 'relatorio_modelagem_tecnica') and ordem < (select ordem from public.etapas where id = p_etapa);
  set local session_replication_role = origin;
  perform public.mover_processo(p_processo, p_etapa, null, null, null);
  set local session_replication_role = replica;
  update public.etapas set ativa = true where codigo in ('modelagem', 'relatorio_modelagem_tecnica');
  set local session_replication_role = origin;
end $$;
grant execute on function pg_temp.mover_sem_trava(uuid, uuid) to authenticated;

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

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000077', 'T77', 'Setor Registro Duas');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000077', null, 'Macro Registro Duas');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000077', 'af000000-0000-0000-0000-000000000077', nome
from unnest(array['Rel Sem', 'Rel Sem Relatorio', 'Rel Corr Rel', 'Rel Corr Ambos', 'Flu Corr Rel', 'Flu Corr Flu', 'Nada',
  'Validacao', 'Rel Admin', 'Parado', 'Cancelado']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000077' $$;
create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$
  select pg_temp.mover_sem_trava(pg_temp.processo(nome_do_processo), (select id from public.etapas where codigo = codigo_da_etapa)) $$;
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T77_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.proximo_relatorio(nome_do_processo text) returns integer
language sql stable as $$
  select coalesce(max(a.numero_do_relatorio), 0) + 1 from public.arquivos_da_versao a
  join public.versoes v on v.id = a.versao_id where v.processo_id = pg_temp.processo(nome_do_processo) $$;
-- A versão seguinte (maior + 1) com o .bpm e, se pedido, o relatório junto.
create function pg_temp.enviar(nome_do_processo text, com_relatorio boolean default false) returns uuid
language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    case when com_relatorio then jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('relatorio', 'docx'))
      else jsonb_build_array(pg_temp.arquivo('bpm', 'bpm')) end,
    false, case when com_relatorio then pg_temp.proximo_relatorio(nome_do_processo) end) $$;
-- O relatório sozinho, na versão mais recente, com o próximo número do processo.
create function pg_temp.enviar_relatorio(nome_do_processo text) returns uuid
language sql as $$
  select public.enviar_relatorio(pg_temp.processo(nome_do_processo),
    (select max(numero) from public.versoes where processo_id = pg_temp.processo(nome_do_processo) and not historica),
    pg_temp.proximo_relatorio(nome_do_processo), pg_temp.arquivo('relatorio', 'docx')) $$;

-- Numa transação só, `enviada_em` e `enviado_em` são o início dela (now()) e a entrada da passagem é clock_timestamp(): o
-- que foi enviado depois do movimento pareceria anterior. Em produção cada pedido é uma transação. Os auxiliares (definidores,
-- dono do teste) carimbam o que acabou de ir com o relógio de agora; o gatilho dos arquivos regravaria a data, então ficam
-- desligados só durante o carimbo.
create function pg_temp.carimbar_versao(nome_do_processo text) returns void
language plpgsql security definer as $$
declare
  versao uuid := (select id from public.versoes where processo_id = pg_temp.processo(nome_do_processo) order by numero desc limit 1);
begin
  set local session_replication_role = replica;
  update public.versoes set enviada_em = clock_timestamp() where id = versao;
  update public.arquivos_da_versao set enviado_em = clock_timestamp() where versao_id = versao;
  set local session_replication_role = origin;
end $$;
create function pg_temp.carimbar_relatorio(nome_do_processo text) returns void
language plpgsql security definer as $$
begin
  set local session_replication_role = replica;
  update public.arquivos_da_versao set enviado_em = clock_timestamp()
  where numero_do_relatorio = pg_temp.proximo_relatorio(nome_do_processo) - 1
    and versao_id in (select id from public.versoes where processo_id = pg_temp.processo(nome_do_processo));
  set local session_replication_role = origin;
end $$;

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
create function pg_temp.revisar(nome_do_processo text, resultado public.resultado_da_revisao) returns void
language sql as $$
  insert into public.revisoes_internas (processo_id, resultado) values (pg_temp.processo(nome_do_processo), resultado) $$;
-- O que a revisão do processo liga, como texto: escopo, versão revisada e corrigida ("V1"), relatório revisado e corrigido ("1").
create function pg_temp.ligacoes(nome_do_processo text) returns table (escopo text, vr text, vc text, rr text, rc text)
language sql stable as $$
  select r.escopo::text, 'V' || vr.numero, 'V' || vc.numero, ar.numero_do_relatorio::text, ac.numero_do_relatorio::text
  from public.revisoes_internas r
  join public.versoes vr on vr.id = r.versao_revisada_id
  left join public.versoes vc on vc.id = r.versao_corrigida_id
  left join public.arquivos_da_versao ar on ar.id = r.relatorio_revisado_id
  left join public.arquivos_da_versao ac on ac.id = r.relatorio_corrigido_id
  where r.processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.processo(text), pg_temp.mover(text, text), pg_temp.arquivo(text, text),
  pg_temp.proximo_relatorio(text), pg_temp.enviar(text, boolean), pg_temp.enviar_relatorio(text),
  pg_temp.carimbar_versao(text), pg_temp.carimbar_relatorio(text), pg_temp.claims(text),
  pg_temp.revisar(text, public.resultado_da_revisao), pg_temp.ligacoes(text) to authenticated;

-- Cenário de a1 (autor), antes de cada passagem: V1 com o Relatório V1; os sem relatório só com a V1.
select pg_temp.claims('a1');
set local role authenticated;
select pg_temp.mover(nome, 'revisao_interna') from unnest(array['Rel Sem', 'Rel Corr Rel', 'Rel Corr Ambos', 'Flu Corr Rel',
  'Flu Corr Flu', 'Nada', 'Validacao', 'Rel Admin', 'Parado', 'Cancelado', 'Rel Sem Relatorio']) as nome;
select pg_temp.enviar(nome, true) from unnest(array['Rel Sem', 'Rel Corr Rel', 'Rel Corr Ambos', 'Flu Corr Rel', 'Nada',
  'Validacao', 'Rel Admin', 'Parado', 'Cancelado']) as nome;
select pg_temp.enviar(nome) from unnest(array['Flu Corr Flu', 'Rel Sem Relatorio']) as nome;
select pg_temp.mover(nome, 'revisao_relatorio') from unnest(array['Rel Sem', 'Rel Corr Rel', 'Rel Corr Ambos', 'Nada',
  'Rel Admin', 'Parado', 'Cancelado', 'Rel Sem Relatorio']) as nome;
select pg_temp.claims('a2');

-- ===== Sem alteração na Revisão do relatório =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.revisar('Rel Sem', 'sem_alteracao')$sql$,
  'o integrante registra a revisão do relatório "sem alteração"');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Rel Sem')$sql$,
  $sql$values (null::text, 'V1', null::text, '1', null::text)$sql$,
  '"sem alteração" vale para o Relatório V1 (o mais recente) e para a versão dele, sem escopo');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Rel Sem Relatorio', 'sem_alteracao')$sql$,
  'P0001', 'sem_relatorio', 'sem relatório numerado, "sem alteração" na Revisão do relatório é recusada');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Rel Sem', 'sem_alteracao')$sql$,
  'P0001', 'revisao_ja_registrada', 'a segunda revisão na mesma passagem da Revisão do relatório é recusada');

-- ===== Corrigida: o escopo sai do que foi enviado na passagem =====
select pg_temp.enviar_relatorio('Rel Corr Rel');
select pg_temp.carimbar_relatorio('Rel Corr Rel');
insert into _tap (linha) select lives_ok($sql$select pg_temp.revisar('Rel Corr Rel', 'corrigida')$sql$,
  '"corrigida" com só o relatório enviado na passagem é aceita');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Rel Corr Rel')$sql$,
  $sql$values ('relatorio', 'V1', null::text, '1', '2')$sql$,
  'o Relatório V2 corrige o Relatório V1, a versão revisada é a mais recente e o escopo é relatório');

select pg_temp.enviar('Rel Corr Ambos', true);
select pg_temp.carimbar_versao('Rel Corr Ambos');
select pg_temp.revisar('Rel Corr Ambos', 'corrigida');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Rel Corr Ambos')$sql$,
  $sql$values ('ambos', 'V1', 'V2', '1', '2')$sql$,
  'com o relatório e o .bpm, a V2 corrige a V1, o Relatório V2 corrige o V1 e o escopo é ambos');

select pg_temp.enviar_relatorio('Flu Corr Rel');
select pg_temp.carimbar_relatorio('Flu Corr Rel');
select pg_temp.revisar('Flu Corr Rel', 'corrigida');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Flu Corr Rel')$sql$,
  $sql$values ('relatorio', 'V1', null::text, '1', '2')$sql$,
  'na Revisão do fluxograma, "corrigida" com só o relatório vale, com o escopo relatório');

select pg_temp.enviar('Flu Corr Flu');
select pg_temp.carimbar_versao('Flu Corr Flu');
select pg_temp.revisar('Flu Corr Flu', 'corrigida');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Flu Corr Flu')$sql$,
  $sql$values ('fluxograma', 'V1', 'V2', null::text, null::text)$sql$,
  'na Revisão do fluxograma, só a versão nova dá o escopo fluxograma');

insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Nada', 'corrigida')$sql$,
  'P0001', 'corrigida_sem_envio_na_passagem', '"corrigida" sem nada enviado na passagem é recusada');

-- ===== O escopo não se escreve =====
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado, escopo) values (pg_temp.processo('Nada'), 'corrigida', 'ambos')$sql$,
  '42501', null, 'incluir com o escopo é recusado (coluna sem privilégio)');
insert into _tap (linha) select throws_ok(
  $sql$update public.revisoes_internas set escopo = 'ambos' where processo_id = pg_temp.processo('Rel Corr Rel')$sql$,
  '42501', null, 'alterar o escopo é recusado (coluna sem privilégio)');

-- ===== A edição recalcula =====
update public.revisoes_internas set resultado = 'sem_alteracao' where processo_id = pg_temp.processo('Rel Corr Rel');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Rel Corr Rel')$sql$,
  $sql$values (null::text, 'V1', null::text, '2', null::text)$sql$,
  'trocar para "sem alteração" passa a valer para o Relatório V2 e tira o escopo');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'relatorio_corrigido' from public.eventos where entidade = 'revisao_interna' and acao = 'editar'
    and entidade_ref = pg_temp.processo('Rel Corr Rel')::text),
  'Relatório V2', 'o evento da edição guarda o relatório corrigido de antes');
update public.revisoes_internas set resultado = 'corrigida' where processo_id = pg_temp.processo('Rel Corr Rel');
insert into _tap (linha) select results_eq($sql$select * from pg_temp.ligacoes('Rel Corr Rel')$sql$,
  $sql$values ('relatorio', 'V1', null::text, '1', '2')$sql$, 'voltar para "corrigida" deduz o escopo de novo');

-- ===== Os eventos dizem a etapa e os relatórios =====
insert into _tap (linha) select results_eq(
  $sql$select detalhes -> 'depois' ->> 'etapa', detalhes -> 'depois' ->> 'relatorio_revisado', detalhes -> 'depois' ->> 'relatorio_corrigido'
    from public.eventos where entidade = 'revisao_interna' and acao = 'registrar' and entidade_ref = pg_temp.processo('Rel Corr Ambos')::text$sql$,
  $sql$values ('revisao_relatorio', 'Relatório V1', 'Relatório V2')$sql$,
  'o evento da revisão do relatório diz a etapa e os relatórios');
insert into _tap (linha) select is(
  (select detalhes -> 'depois' ->> 'etapa' from public.eventos where entidade = 'revisao_interna' and acao = 'registrar'
    and entidade_ref = pg_temp.processo('Flu Corr Flu')::text),
  'revisao_interna', 'o evento da revisão do fluxograma diz a etapa');

-- ===== Fora das duas etapas, suspenso e cancelado =====
select pg_temp.mover('Validacao', 'revisao_setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Validacao', 'sem_alteracao')$sql$,
  'P0001', 'revisao_fora_da_etapa', 'na Validação com o setor a revisão é recusada');
select public.suspender_processo(pg_temp.processo('Parado'), 'Aguardando o setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Parado', 'sem_alteracao')$sql$,
  'P0001', 'processo_parado:suspenso', 'processo suspenso na Revisão do relatório recusa a revisão');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Desistência do setor');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Cancelado', 'sem_alteracao')$sql$,
  'P0001', 'processo_parado:cancelado', 'processo cancelado na Revisão do relatório recusa a revisão');

-- ===== Perfis na Revisão do relatório =====
create function pg_temp.revisoes_lidas() returns bigint
language sql stable as $$
  select count(*) from public.revisoes_internas r join public.passagens pa on pa.id = r.passagem_id
  join public.etapas e on e.id = pa.etapa_id where e.codigo = 'revisao_relatorio' $$;
grant execute on function pg_temp.revisoes_lidas() to authenticated;

insert into _tap (linha) select ok(pg_temp.revisoes_lidas() > 0, 'o integrante lê as revisões do relatório');
select pg_temp.claims('a3');
insert into _tap (linha) select ok(pg_temp.revisoes_lidas() > 0, 'a consulta lê as revisões do relatório');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Rel Admin', 'sem_alteracao')$sql$, '42501', null,
  'a consulta não registra a revisão do relatório');
-- A política filtra: para a consulta, a linha não existe para alterar.
with alteradas as (update public.revisoes_internas set comentario = 'Outro' where processo_id = pg_temp.processo('Rel Sem') returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 0, 'a consulta não edita a revisão do relatório');
select pg_temp.claims('a4');
insert into _tap (linha) select is(pg_temp.revisoes_lidas(), 0::bigint, 'o inativo não lê as revisões do relatório');
insert into _tap (linha) select throws_ok($sql$select pg_temp.revisar('Rel Admin', 'sem_alteracao')$sql$, '42501', null,
  'o inativo não registra a revisão do relatório');
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.revisar('Rel Admin', 'sem_alteracao')$sql$,
  'o administrador registra a revisão do relatório');
insert into _tap (linha) select ok(pg_temp.revisoes_lidas() > 0, 'o administrador lê as revisões do relatório');
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set comentario = 'Conferido' where processo_id = pg_temp.processo('Rel Admin')$sql$,
  'o administrador edita a revisão do relatório');
select pg_temp.claims('a2');
insert into _tap (linha) select lives_ok(
  $sql$update public.revisoes_internas set comentario = 'Conferido de novo' where processo_id = pg_temp.processo('Rel Admin')$sql$,
  'o integrante edita a revisão do relatório');

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok($sql$select count(*) from public.revisoes_internas$sql$, '42501', null,
  'o visitante não lê as revisões');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.revisoes_internas (processo_id, resultado) values ('00000000-0000-0000-0000-000000000000', 'sem_alteracao')$sql$,
  '42501', null, 'o visitante não registra revisão');
reset role;

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
