-- Desistir, registrar publicação e arquivar (publicacao-e-arquivamento, ticket 02; ADR 0020). Não destrutiva. A
-- Publicação deixa de se dispensar: "não vai mais para publicação", com motivo, a devolve a pendente e o processo vai a
-- Concluídos como não publicado. Num processo concluído não publicado (arquivado ou não), registrar a publicação a
-- conclui na data informada. O concluído se arquiva e se desarquiva; o arquivado recusa qualquer outra alteração. As
-- recusas chegam à interface como "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts).

-- Nulo = não arquivado. Privilégio de coluna porque as funções rodam com a permissão de quem chama; o gatilho abaixo
-- recusa a mudança feita fora delas.
alter table public.processos add column arquivado_em timestamptz;
grant update (arquivado_em) on public.processos to authenticated;

-- Ligada (só na transação) por arquivar, desarquivar e registrar publicação: libera a coluna e a trava do arquivado.
-- Quem chama a API não consegue ajustá-la: só uma função do banco a liga, e ela a desliga no fim.
create function private.liberando_arquivado() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.liberando_arquivado', true), '') = 'on' $$;

create function private.conferir_arquivamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.arquivado_em is distinct from old.arquivado_em and not private.liberando_arquivado() then
    raise exception 'arquivamento_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_arquivamento before update of arquivado_em on public.processos
  for each row execute function private.conferir_arquivamento();

-- Arquivar e desarquivar viram evento do processo (o histórico do processo lê por entidade_ref = id), com quem e quando.
create function private.registrar_evento_do_arquivamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
begin
  if new.arquivado_em is not distinct from old.arquivado_em then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.arquivado_em is null then 'desarquivar' else 'arquivar' end, 'processo',
    new.id::text, jsonb_build_object('antes', base, 'depois', base));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_arquivamento after update of arquivado_em on public.processos
  for each row execute function private.registrar_evento_do_arquivamento();

-- Igual à da migração 20261014201236_situacao_do_processo, com a trava do arquivado antes da do processo parado. Cobre
-- andamentos (voltar, datas, responsável, avançar), revisões internas e aprovações (incluir e editar). Versões e arquivos
-- já recusam o processo concluído (private.conferir_processo_que_recebe_versao), e o arquivado é concluído.
create or replace function private.conferir_processo_em_andamento(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  linha record;
begin
  if processo is null then
    return;
  end if;
  select situacao, arquivado_em into linha from public.processos where id = processo;
  if linha.arquivado_em is not null and not private.liberando_arquivado() then
    raise exception 'processo_arquivado';
  end if;
  if linha.situacao <> 'em_andamento' then
    raise exception 'processo_parado:%', linha.situacao;
  end if;
end $$;

-- O arquivado não se edita, não muda de situação, não se reclassifica nem se exclui. A exceção é o macroprocesso que o
-- pai leva aos subprocessos (gatilho levar_macroprocesso_aos_subprocessos, por isso a profundidade): o subprocesso
-- arquivado não trava a edição do pai.
create function private.conferir_processo_arquivado() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.arquivado_em is null or private.liberando_arquivado() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
    and to_jsonb(new) - 'macroprocesso_id' = to_jsonb(old) - 'macroprocesso_id' then
    return new;
  end if;
  raise exception 'processo_arquivado';
end $$;

-- O nome vem antes dos outros gatilhos "conferir_processo_*" de exclusão: a recusa é a do arquivado.
create trigger conferir_processo_arquivado before update or delete on public.processos
  for each row execute function private.conferir_processo_arquivado();

-- Igual à da migração 20261013203452_etapas_do_setor, recusando dispensar a Publicação ("realizada anteriormente" segue).
create or replace function private.conferir_dispensa(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  etapa record;
begin
  if andamento.status <> 'dispensada' then
    return;
  end if;
  select nome, obrigatoria, codigo into etapa from public.etapas where id = andamento.etapa_id;
  if etapa.codigo = 'publicacao' then
    raise exception 'publicacao_nao_se_dispensa';
  end if;
  if etapa.obrigatoria then
    raise exception 'etapa_obrigatoria:%', etapa.nome;
  end if;
end $$;

-- Igual à da migração 20261020180000_datas_das_etapas_no_fuso. Dentro de "não vai mais para publicação" e de registrar
-- publicação (ep.escolhendo_publicacao), a mudança da Publicação sai cedo, como na volta: as funções já conferiram tudo.
create or replace function private.preparar_andamento() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nota := nullif(btrim(new.nota), '');
  perform private.conferir_processo_em_andamento(new.processo_id);
  if private.voltando() or private.escolhendo_publicacao() then
    return new;
  end if;
  perform private.conferir_responsavel(new.responsavel_id, old.responsavel_id);
  if new.status <> old.status then
    perform private.conferir_transicao(old.status, new.status);
    if old.status = 'pendente' then
      perform private.conferir_sequencia(new);
    end if;
    perform private.conferir_dispensa(new);
    if new.status = 'em_andamento' then
      new.iniciada_em := private.hoje();
    else
      new.resolvida_em := private.hoje();
    end if;
  end if;
  perform private.conferir_datas(new);
  return new;
end $$;

-- Igual à da migração 20261018141346_sem_etapas_do_setor. A mudança da Publicação dentro das funções acima não vira
-- evento de andamento: o evento do processo (desistência ou publicação registrada) conta o que houve.
create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  com_responsavel boolean := old.responsavel_id is not null or new.responsavel_id is not null;
  antes jsonb := base || private.estado_do_andamento(old, com_responsavel);
  depois jsonb := base || private.estado_do_andamento(new, com_responsavel);
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') else new.nota end;
begin
  if private.escolhendo_publicacao() then
    return null;
  end if;
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old, new), 'andamento',
    new.processo_id::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', motivo));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Igual à da migração 20261022204122_escolha_de_publicacao. As funções abaixo deixam em ep.evento_da_publicacao a ação,
-- o motivo (ou a nota) e, no registro, a data da publicação, que entra no antes (nula) e no depois.
create or replace function private.registrar_evento_da_escolha_de_publicacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := jsonb_build_object('nome', new.nome, 'setor_sigla', (select sigla from public.setores where id = new.setor_id));
  extra jsonb := coalesce(nullif(current_setting('ep.evento_da_publicacao', true), '')::jsonb, '{}'::jsonb);
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') else extra ->> 'motivo' end;
  data_antes jsonb := case when extra ? 'publicado_em' then jsonb_build_object('publicado_em', null) else '{}'::jsonb end;
  data_depois jsonb := case when extra ? 'publicado_em' then jsonb_build_object('publicado_em', extra -> 'publicado_em') else '{}'::jsonb end;
begin
  if new.vai_para_publicacao is not distinct from old.vai_para_publicacao then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    coalesce(extra ->> 'acao',
      case when new.vai_para_publicacao is null then 'apagar_escolha_de_publicacao' else 'escolher_publicacao' end),
    'processo', new.id::text,
    jsonb_build_object('antes', base || jsonb_build_object('vai_para_publicacao', old.vai_para_publicacao) || data_antes,
      'depois', base || jsonb_build_object('vai_para_publicacao', new.vai_para_publicacao) || data_depois)
      || case when motivo is not null then jsonb_build_object('motivo', motivo) else '{}'::jsonb end);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- O andamento da Publicação do processo no status pedido; null sem ele.
create function private.andamento_da_publicacao(p_processo uuid, p_status public.status_da_etapa) returns uuid
language sql stable set search_path = ''
as $$
  select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p_processo and e.codigo = 'publicacao' and a.status = p_status $$;

-- Liga e desliga as marcas das funções de publicação (a escolha, a Publicação sem as conferências do avanço e o evento).
create function private.marcar_publicacao(evento jsonb) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.escolhendo_publicacao', 'on', true), set_config('ep.evento_da_publicacao', evento::text, true);
end $$;

create function private.desmarcar_publicacao() returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.escolhendo_publicacao', 'off', true), set_config('ep.evento_da_publicacao', '', true),
    set_config('ep.liberando_arquivado', 'off', true);
end $$;

-- A escolha do processo muda pela função (as marcas ligadas). Zero linhas é a RLS recusando: 42501.
create function private.mudar_escolha_de_publicacao(p_processo uuid, p_vai boolean) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  update public.processos set vai_para_publicacao = p_vai where id = p_processo;
  get diagnostics linhas = row_count;
  if linhas = 0 then
    raise exception 'sem permissão para mudar a escolha de publicação' using errcode = '42501';
  end if;
end $$;

-- Desistir da publicação no meio: só com a Publicação em andamento e com motivo. A escolha vira "não" e a Publicação
-- volta a pendente, sem responsável, datas nem nota; o processo vai a Concluídos.
create function public.nao_vai_mais_para_publicacao(p_processo uuid, p_motivo text) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  publicacao uuid;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  if not exists (select 1 from public.processos where id = p_processo) then
    raise exception 'registro_inexistente';
  end if;
  publicacao := private.andamento_da_publicacao(p_processo, 'em_andamento');
  if publicacao is null then
    raise exception 'publicacao_fora_de_andamento';
  end if;
  perform private.marcar_publicacao(jsonb_build_object('acao', 'nao_vai_mais_para_publicacao', 'motivo', motivo));
  perform private.mudar_escolha_de_publicacao(p_processo, false);
  update public.andamentos set status = 'pendente', responsavel_id = null, iniciada_em = null, resolvida_em = null, nota = null
  where id = publicacao;
  perform private.desmarcar_publicacao();
end $$;

-- A data da publicação: obrigatória, nem futura nem antes da data da aprovação (quando a aprovação tem data).
create function private.conferir_data_da_publicacao(p_processo uuid, p_data date) returns void
language plpgsql stable set search_path = ''
as $$
declare
  aprovada date := (select aprovada_em from public.aprovacoes where processo_id = p_processo);
begin
  if p_data is null then
    raise exception 'data_da_publicacao_obrigatoria';
  end if;
  if p_data > private.hoje() then
    raise exception 'data_no_futuro:%', p_data;
  end if;
  if p_data < aprovada then
    raise exception 'publicacao_antes_da_aprovacao:%:%', p_data, aprovada;
  end if;
end $$;

-- O processo que recebe o registro: concluído, ainda não publicado e com a Publicação pendente no caminho. Devolve o
-- andamento dela.
create function private.publicacao_a_registrar(p_processo uuid) returns uuid
language plpgsql stable set search_path = ''
as $$
declare
  linha record;
  publicacao uuid := private.andamento_da_publicacao(p_processo, 'pendente');
begin
  select situacao, publicado_em into linha from public.processos_com_andamento where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if linha.situacao <> 'concluido' then
    raise exception 'publicacao_so_no_concluido:%', linha.situacao;
  end if;
  if linha.publicado_em is not null then
    raise exception 'publicacao_ja_registrada';
  end if;
  if publicacao is null then
    raise exception 'sem_publicacao_pendente';
  end if;
  return publicacao;
end $$;

-- A publicação que aconteceu depois: a escolha vira "sim" e a Publicação, concluída com início e fim na data. O
-- processo fica onde está (Concluídos ou arquivado). A nota vai só para o evento.
create function public.registrar_publicacao(p_processo uuid, p_data date, p_nota text) returns void
language plpgsql set search_path = ''
as $$
declare
  publicacao uuid := private.publicacao_a_registrar(p_processo);
begin
  perform private.conferir_data_da_publicacao(p_processo, p_data);
  perform private.marcar_publicacao(jsonb_build_object('acao', 'registrar_publicacao',
    'motivo', nullif(btrim(p_nota), ''), 'publicado_em', p_data));
  perform set_config('ep.liberando_arquivado', 'on', true);
  perform private.mudar_escolha_de_publicacao(p_processo, true);
  update public.andamentos set status = 'concluida', iniciada_em = p_data, resolvida_em = p_data where id = publicacao;
  perform private.desmarcar_publicacao();
end $$;

-- Grava a marca de arquivado (data ou null) com a liberação ligada. Zero linhas é a RLS recusando: 42501.
create function private.gravar_arquivamento(p_processo uuid, p_quando timestamptz) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  perform set_config('ep.liberando_arquivado', 'on', true);
  update public.processos set arquivado_em = p_quando where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.liberando_arquivado', 'off', true);
  if linhas = 0 then
    raise exception 'sem permissão para arquivar o processo' using errcode = '42501';
  end if;
end $$;

-- Arquivar só o concluído não arquivado. "Concluído" é calculado pela view, lida com a permissão de quem chama.
create function public.arquivar_processo(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  linha record;
begin
  select situacao, arquivado_em into linha from public.processos_com_andamento where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if linha.arquivado_em is not null then
    raise exception 'ja_arquivado';
  end if;
  if linha.situacao <> 'concluido' then
    raise exception 'arquivar_so_concluido:%', linha.situacao;
  end if;
  perform private.gravar_arquivamento(p_processo, now());
end $$;

create function public.desarquivar_processo(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  quando timestamptz;
begin
  select arquivado_em into quando from public.processos where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if quando is null then
    raise exception 'nao_arquivado';
  end if;
  perform private.gravar_arquivamento(p_processo, null);
end $$;

revoke execute on function private.liberando_arquivado(), private.conferir_arquivamento(),
  private.conferir_processo_arquivado(), private.andamento_da_publicacao(uuid, public.status_da_etapa),
  private.marcar_publicacao(jsonb), private.desmarcar_publicacao(), private.mudar_escolha_de_publicacao(uuid, boolean),
  private.conferir_data_da_publicacao(uuid, date), private.publicacao_a_registrar(uuid),
  private.gravar_arquivamento(uuid, timestamptz),
  public.nao_vai_mais_para_publicacao(uuid, text), public.registrar_publicacao(uuid, date, text),
  public.arquivar_processo(uuid), public.desarquivar_processo(uuid)
  from public, anon;
grant execute on function private.liberando_arquivado(), private.conferir_arquivamento(),
  private.conferir_processo_arquivado(), private.andamento_da_publicacao(uuid, public.status_da_etapa),
  private.marcar_publicacao(jsonb), private.desmarcar_publicacao(), private.mudar_escolha_de_publicacao(uuid, boolean),
  private.conferir_data_da_publicacao(uuid, date), private.publicacao_a_registrar(uuid),
  private.gravar_arquivamento(uuid, timestamptz),
  public.nao_vai_mais_para_publicacao(uuid, text), public.registrar_publicacao(uuid, date, text),
  public.arquivar_processo(uuid), public.desarquivar_processo(uuid)
  to authenticated;
-- Chamada só pelo gatilho de evento (security definer).
revoke execute on function private.registrar_evento_do_arquivamento() from public, anon, authenticated;

-- A view do Quadro e do painel igual à da migração 20261022204122_escolha_de_publicacao, com a marca de arquivado no
-- fim (o "create or replace" só aceita coluna nova depois das que já existem).
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
    as publicado_em,
  p.arquivado_em
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
