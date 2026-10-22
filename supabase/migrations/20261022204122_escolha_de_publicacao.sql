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
