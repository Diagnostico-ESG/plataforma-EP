-- ENSAIO TEMPORÁRIO (apagar antes de aplicar a migração): o teste 48 com a migração 20261022204122 dentro, desfeita no fim.
-- Escolha de publicação e regra nova do concluído (publicacao-e-arquivamento, ticket 01, ADR 0020): quem pode responder
-- "Vai para publicação?" e ler os campos novos, a escolha obrigatória ao resolver a Aprovação com a Publicação pendente
-- depois, "sim" iniciando a Publicação e "não" a pulando, o concluído sem etapa atual, a volta que apaga ou mantém a
-- escolha, a coluna que só muda pelas funções, o evento da escolha, o nome "Validação com o setor", o subprocesso e a
-- Publicação desativada. A conversão dos dados antigos foi ensaiada à parte, antes de aplicar a migração.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(47);
-- Escolha de publicação (publicacao-e-arquivamento, ticket 01; ADR 0020). Não destrutiva. Quem resolve a Aprovação pelo
-- setor com a Publicação pendente depois responde "Vai para publicação?": "sim" inicia a Publicação, "não" a pula. O
-- concluído passa a exigir, além das obrigatórias resolvidas, a escolha "não" ou a Publicação resolvida, e o processo
-- concluído fica sem etapa atual. A escolha só muda pelas funções (e pela volta, que a apaga) e vira evento do processo.
-- A revisao_setor passa a se chamar "Validação com o setor". As recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts).

-- Nulo = sem resposta. A coluna tem privilégio de alterar porque as funções rodam com a permissão de quem chama; o
-- gatilho abaixo recusa a mudança feita fora delas.
alter table public.processos add column vai_para_publicacao boolean;
grant update (vai_para_publicacao) on public.processos to authenticated;

-- A função liga este ajuste (vale só na transação) para o gatilho aceitar a mudança da escolha. Quem chama a API não
-- consegue ajustá-lo: só uma função do banco o liga, e ela o desliga no fim (como ep.mudando_situacao).
create function private.escolhendo_publicacao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.escolhendo_publicacao', true), '') = 'on' $$;

-- A escolha muda dentro de avancar_etapa (a marca acima) ou dentro da volta (ep.voltando), nunca direto.
create function private.conferir_escolha_de_publicacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.vai_para_publicacao is distinct from old.vai_para_publicacao
    and not (private.escolhendo_publicacao() or private.voltando()) then
    raise exception 'publicacao_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_escolha_de_publicacao before update of vai_para_publicacao on public.processos
  for each row execute function private.conferir_escolha_de_publicacao();

-- Um evento por mudança da escolha, ligado ao processo (o histórico do processo lê por entidade_ref = id). O estado do
-- processo dos outros eventos não ganha a escolha: ela tem evento próprio, com a ação que diz o que aconteceu.
create function private.registrar_evento_da_escolha_de_publicacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') end;
begin
  if new.vai_para_publicacao is not distinct from old.vai_para_publicacao then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case when new.vai_para_publicacao is null then 'apagar_escolha_de_publicacao' else 'escolher_publicacao' end,
    'processo', new.id::text,
    jsonb_build_object('antes', base || jsonb_build_object('vai_para_publicacao', old.vai_para_publicacao),
      'depois', base || jsonb_build_object('vai_para_publicacao', new.vai_para_publicacao))
      || case when motivo is not null then jsonb_build_object('motivo', motivo) else '{}'::jsonb end);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_escolha_de_publicacao after update of vai_para_publicacao on public.processos
  for each row execute function private.registrar_evento_da_escolha_de_publicacao();

-- Resolver a Aprovação pelo setor com a Publicação pendente depois exige a escolha, que se grava no processo. Fora disso
-- (outra etapa, ou a Publicação fora do caminho) o valor recebido é ignorado. Zero linhas é a RLS recusando: 42501.
create function private.gravar_escolha_de_publicacao(resolvida public.andamentos, p_vai boolean) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  if (select codigo from public.etapas where id = resolvida.etapa_id) <> 'aprovacao_setor' or not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = resolvida.processo_id and e.codigo = 'publicacao' and a.status = 'pendente'
      and e.ordem > (select ordem from public.etapas where id = resolvida.etapa_id)) then
    return;
  end if;
  if p_vai is null then
    raise exception 'escolha_de_publicacao_obrigatoria';
  end if;
  perform set_config('ep.escolhendo_publicacao', 'on', true);
  update public.processos set vai_para_publicacao = p_vai where id = resolvida.processo_id;
  get diagnostics linhas = row_count;
  perform set_config('ep.escolhendo_publicacao', 'off', true);
  if linhas = 0 then
    raise exception 'sem permissão para responder a escolha de publicação' using errcode = '42501';
  end if;
end $$;

-- O andamento da Publicação de um processo que não vai para publicação fica fora da sequência: não é a "anterior" da
-- etapa seguinte nem a próxima a iniciar.
create function private.publicacao_pulada(andamento_id uuid) returns boolean
language sql stable set search_path = ''
as $$
  select exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id join public.processos p on p.id = a.processo_id
    where a.id = andamento_id and e.codigo = 'publicacao' and p.vai_para_publicacao is false) $$;

-- Igual à da migração 20261018141346_sem_etapas_do_setor, pulando a Publicação de quem não vai para publicação.
create or replace function private.conferir_sequencia_do_processo(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
    and not private.publicacao_pulada(a.id)
  order by e.ordem desc limit 1;
  if found and anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

-- Igual à da migração 20261019004727_avancar_etapa, pulando a Publicação de quem não vai para publicação.
create or replace function private.iniciar_proxima_do_avanco(resolvida public.andamentos, p_responsavel uuid) returns void
language sql set search_path = ''
as $$
  update public.andamentos set status = 'em_andamento', responsavel_id = p_responsavel
  where id = (
    select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = resolvida.processo_id and a.status = 'pendente'
      and e.ordem > (select ordem from public.etapas where id = resolvida.etapa_id)
      and not private.publicacao_pulada(a.id)
    order by e.ordem limit 1) $$;

-- avancar_etapa com a escolha (nula por padrão: as outras etapas não a usam). Apagada e recriada: a assinatura muda.
-- concluir_aprovacao e concluir_revisao_interna chamam pelo nome, e a resolução é na hora da chamada.
drop function public.avancar_etapa(uuid, text, text, uuid);
create function public.avancar_etapa(p_andamento uuid, p_acao text, p_nota text, p_responsavel uuid,
  p_vai_para_publicacao boolean default null) returns void
language plpgsql set search_path = ''
as $$
declare
  novo public.status_da_etapa := private.status_do_avanco(p_acao);
  escolhida public.andamentos;
begin
  if novo is null then
    raise exception 'acao_invalida:%', p_acao;
  end if;
  select * into escolhida from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_nota_do_avanco(novo, p_nota);
  perform private.resolver_etapa_do_avanco(escolhida, novo, p_nota);
  perform private.gravar_escolha_de_publicacao(escolhida, p_vai_para_publicacao);
  perform private.iniciar_proxima_do_avanco(escolhida, p_responsavel);
end $$;

-- concluir_aprovacao da migração 20261019224928_aprovacao, repassando a escolha.
drop function public.concluir_aprovacao(uuid, text, text, date, uuid);
create function public.concluir_aprovacao(p_andamento uuid, p_numero text, p_link text, p_data date, p_responsavel uuid,
  p_vai_para_publicacao boolean default null)
returns void
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  select a.processo_id into processo from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.id = p_andamento and e.codigo = 'aprovacao_setor';
  if not found then
    raise exception 'registro_inexistente';
  end if;
  insert into public.aprovacoes (processo_id, numero_eprotocolo, link, aprovada_em)
  values (processo, p_numero, p_link, p_data);
  perform public.avancar_etapa(p_andamento, 'concluir', null, p_responsavel, p_vai_para_publicacao);
end $$;

-- Voltar até a Aprovação ou antes dela apaga a escolha (a volta liga ep.voltando, que libera a mudança).
create function private.apagar_escolha_da_volta(escolhido public.andamentos) returns void
language sql set search_path = ''
as $$
  update public.processos set vai_para_publicacao = null
  where id = escolhido.processo_id and vai_para_publicacao is not null
    and (select ordem from public.etapas where id = escolhido.etapa_id)
      <= (select ordem from public.etapas where codigo = 'aprovacao_setor') $$;

-- voltar_a_etapa da migração 20261019224928_aprovacao, com a escolha apagada dentro da volta.
create or replace function public.voltar_a_etapa(p_andamento uuid, p_motivo text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  escolhido public.andamentos;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  select * into escolhido from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_etapa_resolvida(escolhido);
  perform set_config('ep.voltando', 'on', true), set_config('ep.motivo_da_volta', motivo, true);
  perform private.devolver_etapas_seguintes(escolhido);
  perform private.reabrir_etapa(escolhido, p_responsavel);
  perform private.desfazer_aprovacao_da_volta(escolhido);
  perform private.apagar_escolha_da_volta(escolhido);
  perform set_config('ep.voltando', 'off', true), set_config('ep.motivo_da_volta', '', true);
end $$;

revoke execute on function private.escolhendo_publicacao(), private.conferir_escolha_de_publicacao(),
  private.gravar_escolha_de_publicacao(public.andamentos, boolean), private.publicacao_pulada(uuid),
  public.avancar_etapa(uuid, text, text, uuid, boolean),
  public.concluir_aprovacao(uuid, text, text, date, uuid, boolean), private.apagar_escolha_da_volta(public.andamentos)
  from public, anon;
grant execute on function private.escolhendo_publicacao(), private.conferir_escolha_de_publicacao(),
  private.gravar_escolha_de_publicacao(public.andamentos, boolean), private.publicacao_pulada(uuid),
  public.avancar_etapa(uuid, text, text, uuid, boolean),
  public.concluir_aprovacao(uuid, text, text, date, uuid, boolean), private.apagar_escolha_da_volta(public.andamentos)
  to authenticated;
-- Chamada só pelo gatilho de evento (security definer).
revoke execute on function private.registrar_evento_da_escolha_de_publicacao() from public, anon, authenticated;

-- A view do Quadro e do painel com a regra nova do concluído: um lateral o calcula, a situação o usa e a etapa atual só
-- se procura em quem não está concluído (o concluído vem sem etapa atual nem responsável). Campos novos no fim (o
-- "create or replace" só aceita coluna nova depois das que já existem); fora isso, igual à da migração cartao_do_quadro.
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when fim.concluido then 'concluido' else p.situacao::text end as situacao,
  atual.etapa_id as etapa_atual_id, atual.codigo as etapa_atual_codigo, atual.nome as etapa_atual_nome,
  atual.ordem as etapa_atual_ordem,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao,
  atual.status as etapa_atual_status, atual.iniciada_em as etapa_atual_iniciada_em, u.ativo as responsavel_ativo,
  coalesce((
    select jsonb_agg(jsonb_build_object('etapa_id', e.id, 'codigo', e.codigo, 'status', a.status) order by e.ordem)
    from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id
  ), '[]'::jsonb) as caminho,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.vai_para_publicacao,
  (select a.resolvida_em from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.codigo = 'publicacao' and a.status in ('concluida', 'realizada_anteriormente'))
    as publicado_em
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
cross join lateral (
  select p.situacao = 'em_andamento'
    and not exists (
      select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
      where a.processo_id = p.id and e.obrigatoria and a.status in ('pendente', 'em_andamento'))
    and (p.vai_para_publicacao is false or not exists (
      select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
      where a.processo_id = p.id and e.codigo = 'publicacao' and a.status in ('pendente', 'em_andamento')))
    as concluido
) fim
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id, a.status, a.iniciada_em
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento') and not fim.concluido
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id
left join lateral (
  select v.numero, v.historica,
    exists (select 1 from public.arquivos_da_versao f where f.versao_id = v.id and f.papel = 'relatorio') as tem_relatorio
  from public.versoes v
  where v.processo_id = p.id
  order by v.numero desc
  limit 1
) ultima on true;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;

-- Mudança de estrutura e dados antigos, não ação de alguém: com os gatilhos desligados só neste trecho, nenhum evento
-- nasce e as travas de etapa protegida e da escolha não se aplicam (como na migração 20261018141346_sem_etapas_do_setor).
set local session_replication_role = replica;

-- O nome muda só se o administrador ainda não o trocou no catálogo.
update public.etapas set nome = 'Validação com o setor' where codigo = 'revisao_setor' and nome = 'Revisão pelo setor';

-- Os processos que já existem (só há desenvolvimento) ganham a escolha que corresponde ao estado deles (tabela "Dados
-- existentes" da spec). Publicação concluída, realizada anteriormente ou em andamento: "sim".
update public.processos p set vai_para_publicacao = true
from public.andamentos a join public.etapas e on e.id = a.etapa_id
where a.processo_id = p.id and e.codigo = 'publicacao' and a.status in ('concluida', 'realizada_anteriormente', 'em_andamento');

-- Publicação dispensada: "não", com a etapa de volta a pendente (sem nota, datas nem responsável).
update public.processos p set vai_para_publicacao = false
from public.andamentos a join public.etapas e on e.id = a.etapa_id
where a.processo_id = p.id and e.codigo = 'publicacao' and a.status = 'dispensada';
update public.andamentos a set status = 'pendente', nota = null, iniciada_em = null, resolvida_em = null, responsavel_id = null
from public.etapas e
where e.id = a.etapa_id and e.codigo = 'publicacao' and a.status = 'dispensada';

-- Publicação pendente com a Aprovação já resolvida: "não". Aprovação não resolvida fica sem resposta.
update public.processos p set vai_para_publicacao = false
where p.vai_para_publicacao is null
  and exists (select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.codigo = 'publicacao' and a.status = 'pendente')
  and exists (select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.codigo = 'aprovacao_setor'
      and a.status in ('concluida', 'realizada_anteriormente', 'dispensada'));

set local session_replication_role = origin;

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

-- Uma etapa opcional inventada depois da Publicação, acrescentada pelo administrador antes dos processos (todos a
-- ganham): no "não", ela é a que entra em andamento.
set local role authenticated;
select pg_temp.claims('a1');
select public.acrescentar_etapa('teste_t48', 'Etapa Depois T48', false, 'IX', null);
reset role;

-- Um setor, um macroprocesso e os processos; o Filho é subprocesso do Pai.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000048', 'T48', 'Setor Publicacao');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000048', null, 'Macro Publicacao');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', nome
from unnest(array['Sem Escolha', 'Sim', 'Nao', 'Realizada', 'Publicado', 'Volta Aprovacao', 'Volta Publicacao', 'Perfis',
  'Admin', 'Desativada']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000048', 'af000000-0000-0000-0000-000000000048', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000048' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = pg_temp.processo(nome_do_processo) and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

create function pg_temp.agir(nome_do_processo text, codigo_da_etapa text, novo public.status_da_etapa,
  nova_nota text default null) returns void
language sql as $$
  update public.andamentos set status = novo, nota = nova_nota
  where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.agir(text, text, public.status_da_etapa, text) to authenticated;

create function pg_temp.status(nome_do_processo text, codigo_da_etapa text) returns public.status_da_etapa
language sql stable as $$ select status from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.status(text, text) to authenticated;

-- A linha da view do processo (situação, etapa atual, responsável e os campos novos).
create function pg_temp.linha(nome_do_processo text) returns public.processos_com_andamento
language sql stable as $$ select * from public.processos_com_andamento where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.linha(text) to authenticated;

create function pg_temp.escolha(nome_do_processo text) returns boolean
language sql stable as $$ select vai_para_publicacao from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.escolha(text) to authenticated;

-- Um arquivo inventado no formato que registrar_versao recebe; a versão completa é o par .bpm + .png e o relatório.
create function pg_temp.arquivo(papel text, formato text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('papel', papel, 'nome', 'T48_V1_Processo.' || formato, 'formato', formato,
    'tamanho', 100, 'hash_md5', '0123456789abcdef0123456789abcdef', 'drive_id', 'drive-' || papel) $$;
create function pg_temp.enviar_completa(nome_do_processo text) returns void
language plpgsql as $$
declare
  versao uuid := public.registrar_versao(pg_temp.processo(nome_do_processo), 1, null,
    jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png')));
begin
  perform public.acrescentar_relatorio(versao, 1, pg_temp.arquivo('relatorio', 'docx'));
end $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- As etapas 1 a 4 "realizadas anteriormente" (sem registro nem trava) e a Aprovação em andamento.
create function pg_temp.ate_a_aprovacao(nome_do_processo text) returns void
language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'aprovacao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_aprovacao(text) to authenticated;

-- A chamada da tela: a aprovação, a escolha e a conclusão numa função só.
create function pg_temp.aprovar(nome_do_processo text, vai boolean default null, responsavel uuid default null) returns void
language sql as $$
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), null, null, null, responsavel, vai) $$;
grant execute on function pg_temp.aprovar(text, boolean, uuid) to authenticated;

-- Todos os processos com a versão completa de a1 e a Aprovação em andamento (por a2).
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000048';
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao(nome) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000048';

-- ===== Validação com o setor =====
insert into _tap (linha) select is((select nome from public.etapas where codigo = 'revisao_setor'), 'Validação com o setor',
  'a revisao_setor se chama Validação com o setor');

-- ===== A escolha é obrigatória =====
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Sem Escolha')$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', 'concluir a Aprovação sem escolha é recusado');
insert into _tap (linha) select is(pg_temp.status('Sem Escolha', 'aprovacao_setor'), 'em_andamento'::public.status_da_etapa,
  'a recusa deixa a Aprovação em andamento');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Realizada', 'aprovacao_setor'), 'realizada_anteriormente', 'Aprovada antes', null)$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', '"realizada anteriormente" na Aprovação sem escolha é recusado');
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Realizada', 'aprovacao_setor'), 'realizada_anteriormente', 'Aprovada antes', null, false)$sql$,
  '"realizada anteriormente" na Aprovação com escolha é aceito');
insert into _tap (linha) select is((pg_temp.linha('Realizada')).situacao, 'concluido', 'e, com "não", o processo fica concluído');

-- ===== "Sim" =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Sim', true, '00000000-0000-0000-0000-0000000000a1')$sql$,
  'concluir a Aprovação com "sim" é aceito');
insert into _tap (linha) select is(pg_temp.escolha('Sim'), true, 'a escolha fica "sim"');
insert into _tap (linha) select results_eq(
  $sql$select status::text, responsavel_id::text from public.andamentos where id = pg_temp.andamento('Sim', 'publicacao')$sql$,
  $sql$values ('em_andamento', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'a Publicação entra em andamento com o responsável escolhido');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, vai_para_publicacao from public.processos_com_andamento where id = pg_temp.processo('Sim')$sql$,
  $sql$values ('em_andamento', 'publicacao', true)$sql$,
  'com a Publicação em andamento o processo não está concluído e segue na Publicação');
insert into _tap (linha) select results_eq(
  $sql$select acao, autor_id::text, detalhes->'antes'->>'vai_para_publicacao', detalhes->'depois'->>'vai_para_publicacao'
    from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Sim')::text and acao = 'escolher_publicacao'$sql$,
  $sql$values ('escolher_publicacao', '00000000-0000-0000-0000-0000000000a2', null::text, 'true')$sql$,
  'um evento "escolher_publicacao" guarda o antes vazio, o "sim" e o autor');

-- ===== "Não" =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Nao', false)$sql$, 'concluir a Aprovação com "não" é aceito');
insert into _tap (linha) select results_eq(
  $sql$select status::text, responsavel_id, iniciada_em from public.andamentos where id = pg_temp.andamento('Nao', 'publicacao')$sql$,
  $sql$values ('pendente', null::uuid, null::date)$sql$, 'com "não" a Publicação fica pendente, parada');
insert into _tap (linha) select is(pg_temp.status('Nao', 'teste_t48'), 'em_andamento'::public.status_da_etapa,
  'e a etapa depois dela entra em andamento');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, responsavel_id, vai_para_publicacao, publicado_em
    from public.processos_com_andamento where id = pg_temp.processo('Nao')$sql$,
  $sql$values ('concluido', null::text, null::uuid, false, null::date)$sql$,
  'o processo com "não" está concluído, sem etapa atual nem responsável');
insert into _tap (linha) select is(
  (select detalhes->'depois'->>'vai_para_publicacao' from public.eventos
    where entidade = 'processo' and entidade_ref = pg_temp.processo('Nao')::text and acao = 'escolher_publicacao'),
  'false', 'o evento guarda o "não"');

-- ===== Publicação resolvida =====
select pg_temp.aprovar('Publicado', true);
insert into _tap (linha) select lives_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Publicado', 'publicacao'), 'concluir', null, null)$sql$,
  'concluir a Publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, publicado_em from public.processos_com_andamento where id = pg_temp.processo('Publicado')$sql$,
  $sql$values ('concluido', (now() at time zone 'America/Sao_Paulo')::date)$sql$,
  'com a Publicação concluída o processo está concluído e publicado na data dela');

-- ===== A coluna só muda pelas funções =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Nao')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'integrante não muda a escolha direto');
select pg_temp.claims('a1');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = null where id = pg_temp.processo('Sim')$sql$,
  'P0001', 'publicacao_so_pela_funcao', 'administrador também não muda a escolha direto');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Admin', false)$sql$, 'administrador responde a escolha');
select pg_temp.claims('a2');

-- ===== Voltar =====
select pg_temp.aprovar('Volta Aprovacao', true);
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Aprovacao', 'aprovacao_setor'), 'Rever a aprovação', null)$sql$,
  'voltar à Aprovação é aceito');
insert into _tap (linha) select is(pg_temp.escolha('Volta Aprovacao'), null, 'voltar à Aprovação apaga a escolha');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'vai_para_publicacao', jsonb_typeof(detalhes->'depois'->'vai_para_publicacao'), detalhes->>'motivo'
    from public.eventos where entidade = 'processo' and entidade_ref = pg_temp.processo('Volta Aprovacao')::text
      and acao = 'apagar_escolha_de_publicacao'$sql$,
  $sql$values ('true', 'null', 'Rever a aprovação')$sql$,
  'um evento "apagar_escolha_de_publicacao" guarda o antes e o motivo da volta');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Volta Aprovacao')$sql$,
  'P0001', 'escolha_de_publicacao_obrigatoria', 'a escolha é perguntada de novo na próxima conclusão');
select pg_temp.aprovar('Volta Publicacao', true);
select public.avancar_etapa(pg_temp.andamento('Volta Publicacao', 'publicacao'), 'concluir', null, null);
insert into _tap (linha) select lives_ok(
  $sql$select public.voltar_a_etapa(pg_temp.andamento('Volta Publicacao', 'publicacao'), 'Republicar', null)$sql$,
  'voltar à Publicação é aceito');
insert into _tap (linha) select results_eq(
  $sql$select situacao, etapa_atual_codigo, vai_para_publicacao from public.processos_com_andamento
    where id = pg_temp.processo('Volta Publicacao')$sql$,
  $sql$values ('em_andamento', 'publicacao', true)$sql$,
  'voltar à Publicação reabre só ela, mantém o "sim" e tira o processo de concluído');

-- ===== Subprocesso =====
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Filho', false)$sql$, 'o subprocesso responde a escolha');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.escolha('Filho'), pg_temp.escolha('Pai'), (pg_temp.linha('Filho')).situacao, (pg_temp.linha('Pai')).situacao$sql$,
  $sql$values (false, null::boolean, 'concluido', 'em_andamento')$sql$,
  'a escolha e o concluído são do subprocesso, sem mexer no pai');

-- ===== Perfis =====
select pg_temp.claims('a3');
insert into _tap (linha) select results_eq(
  $sql$select vai_para_publicacao, publicado_em is not null from public.processos_com_andamento
    where id in (pg_temp.processo('Nao'), pg_temp.processo('Publicado')) order by nome$sql$,
  $sql$values (false, false), (true, true)$sql$, 'consulta lê a escolha e a data da publicação');
insert into _tap (linha) select ok(
  (select count(*) from public.eventos where entidade = 'processo' and acao = 'escolher_publicacao') > 0,
  'consulta lê os eventos da escolha');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, '42501', null,
  'consulta não responde a escolha');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Perfis', 'aprovacao_setor'), 'realizada_anteriormente', 'Antes', null, true)$sql$,
  '42501', null, 'consulta não responde a escolha na "realizada anteriormente"');
insert into _tap (linha) select results_eq(
  $sql$with mudadas as (update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Perfis') returning 1)
    select count(*) from mudadas$sql$,
  $sql$values (0::bigint)$sql$, 'consulta não muda a escolha direto (a política não deixa a linha à vista)');

select pg_temp.claims('a4');
insert into _tap (linha) select is((select count(*) from public.processos_com_andamento where setor_id = '5f000000-0000-0000-0000-000000000048'),
  0::bigint, 'inativo não lê a escolha nem a data da publicação');
insert into _tap (linha) select is((select count(*) from public.eventos where entidade = 'processo' and acao = 'escolher_publicacao'),
  0::bigint, 'inativo não lê os eventos da escolha');
insert into _tap (linha) select throws_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, 'P0001', 'registro_inexistente',
  'inativo não responde a escolha (não enxerga a etapa)');
insert into _tap (linha) select results_eq(
  $sql$with mudadas as (update public.processos set vai_para_publicacao = true where id = pg_temp.processo('Perfis') returning 1)
    select count(*) from mudadas$sql$,
  $sql$values (0::bigint)$sql$, 'inativo não muda a escolha direto (não enxerga o processo)');

select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.escolha('Perfis'), null, 'as tentativas recusadas não deixam escolha');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Perfis', true)$sql$, 'integrante responde a escolha');

reset role;
set local role anon;
insert into _tap (linha) select throws_ok($sql$select vai_para_publicacao from public.processos_com_andamento$sql$, '42501', null,
  'visitante não lê a escolha');
insert into _tap (linha) select throws_ok(
  $sql$select public.concluir_aprovacao('00000000-0000-0000-0000-000000000000', null, null, null, null, true)$sql$, '42501', null,
  'visitante não responde a escolha');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set vai_para_publicacao = true$sql$, '42501', null, 'visitante não muda a escolha direto');

-- ===== Publicação desativada (por último: muda o catálogo para os casos seguintes) =====
reset role;
set local role authenticated;
select pg_temp.claims('a1');
update public.etapas set ativa = false where codigo = 'publicacao';
select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.andamento('Desativada', 'publicacao'), null,
  'a Publicação desativada sai do processo em que estava pendente');
insert into _tap (linha) select lives_ok($sql$select pg_temp.aprovar('Desativada')$sql$,
  'sem a Publicação, a Aprovação conclui sem escolha');
insert into _tap (linha) select results_eq(
  $sql$select situacao, vai_para_publicacao from public.processos_com_andamento where id = pg_temp.processo('Desativada')$sql$,
  $sql$values ('concluido', null::boolean)$sql$, 'e o processo fica concluído, sem resposta');

-- ===== Estrutura =====
reset role;
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'avancar_etapa' and pronamespace = 'public'::regnamespace), false,
  'o avanço continua sem security definer');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
