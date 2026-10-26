-- Versões por etapa (documentos-versoes, ticket 09; ADR 0025, que substitui o 0016): a versão piloto (V6P, número
-- digitado), a versão em sequência (número dado pelo banco, depois da maior de qualquer tipo) e a histórica passam a
-- caber cada uma na sua etapa; toda versão que não é histórica exige só o .bpm; o .png e o .bpmn entram depois
-- (acrescentar_arquivo); a observação da versão sai. O relatório (numeração própria, só .docx, trava ao mover) é dos
-- tickets 10 e 11 e fica como está.
-- Destrutiva só em dados inventados do desenvolvimento: apaga a coluna versoes.observacao e as duas assinaturas antigas
-- de registrar_versao e registrar_versao_historica (que tinham p_observacao). Recusas em P0001 "motivo:valor"
-- (src/versoes/recusasDeVersoes.ts).

-- A piloto nunca é histórica; a inclusão da coluna fica com quem registra a versão (a RLS e os gatilhos decidem o resto).
alter table public.versoes add column piloto boolean not null default false;
alter table public.versoes add constraint versoes_piloto_nao_e_historica check (not (piloto and historica));
grant insert (piloto) on public.versoes to authenticated;

alter table public.versoes drop column observacao;

-- A etapa atual do processo cabe para esse tipo de envio? Pela ordem do catálogo, não pela etapa exata: a histórica só em
-- Não iniciados, a piloto até a Modelagem piloto e a em sequência até a Revisão interna. Assim a janela da trava (ticket
-- 11) pode enviar a piloto com o processo ainda em Não iniciados.
create function private.conferir_onde_cabe_a_versao(processo uuid, tipo text) returns void
language plpgsql stable set search_path = ''
as $$
declare
  atual record;
begin
  select e.codigo, e.ordem into atual
  from public.processos_com_andamento p join public.etapas e on e.id = p.etapa_atual_id
  where p.id = processo;
  if tipo = 'historica' and atual.codigo <> 'nao_iniciados' then
    raise exception 'historica_fora_de_nao_iniciados';
  end if;
  if tipo = 'piloto' and atual.ordem > (select ordem from public.etapas where codigo = 'modelagem') then
    raise exception 'piloto_fora_da_etapa';
  end if;
  if tipo = 'sequencia' and atual.ordem > (select ordem from public.etapas where codigo = 'revisao_interna') then
    raise exception 'versao_fora_da_etapa';
  end if;
end $$;

-- A piloto só entra antes da primeira versão em sequência, com número maior que o de todas as versões do processo.
create function private.conferir_numero_da_piloto(processo uuid, numero_digitado integer) returns void
language plpgsql stable set search_path = ''
as $$
declare
  maior integer := (select max(numero) from public.versoes where processo_id = processo);
begin
  if exists (select 1 from public.versoes where processo_id = processo and not historica and not piloto) then
    raise exception 'piloto_depois_de_versao_em_sequencia';
  end if;
  if maior >= numero_digitado then
    raise exception 'numero_da_piloto_nao_maior:%', maior;
  end if;
end $$;

-- Antes de incluir a versão: processo em andamento, onde o envio cabe, o número (histórica e piloto, o digitado; em
-- sequência, o maior do processo + 1, e o que vier é ignorado), a etapa (a histórica não tem), autor e data.
create or replace function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  perform private.conferir_onde_cabe_a_versao(new.processo_id,
    case when new.historica then 'historica' when new.piloto then 'piloto' else 'sequencia' end);
  if new.historica then
    perform private.conferir_versao_historica(new.processo_id, new.numero);
    new.etapa_id := null;
  else
    if new.piloto then
      perform private.conferir_numero_da_piloto(new.processo_id, new.numero);
    else
      new.numero := coalesce((select max(numero) from public.versoes where processo_id = new.processo_id), 0) + 1;
    end if;
    new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  end if;
  new.enviada_por := (select auth.uid());
  new.enviada_em := now();
  return new;
end $$;

-- A histórica tem o .bpm ou o par .bpmn e .png; a piloto e a em sequência, o .bpm (o resto é opcional). Conferido no fim
-- da gravação (restrição adiada), porque a versão entra antes dos arquivos.
create or replace function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  papeis public.papel_do_arquivo[] := array(select papel from public.arquivos_da_versao where versao_id = new.id);
begin
  if new.historica then
    if not (papeis @> array['bpm']::public.papel_do_arquivo[] or papeis @> array['bpmn', 'png']::public.papel_do_arquivo[]) then
      raise exception 'historica_sem_arquivo_de_fluxograma';
    end if;
  elsif not papeis @> array['bpm']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpm';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- O .png e o .bpmn que entram depois da versão (outra chamada) não entram na versão aprovada (ADR 0011).
create function private.conferir_acrescimo_a_versao(versao uuid) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if exists (select 1 from public.aprovacoes where versao_id = versao) then
    raise exception 'versao_aprovada:%', (select numero from public.versoes where id = versao);
  end if;
end $$;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, histórica somente leitura, as conferências
-- do arquivo novo (só na inclusão; o .png e o .bpmn acrescentados depois, também a da versão aprovada), autor e data.
create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  da_versao record;
begin
  select processo_id, historica, enviada_em into da_versao from public.versoes where id = new.versao_id;
  perform private.conferir_processo_que_recebe_versao(da_versao.processo_id);
  if da_versao.historica and (tg_op = 'UPDATE' or da_versao.enviada_em <> now()) then
    raise exception 'versao_historica_somente_leitura';
  end if;
  if tg_op = 'INSERT' then
    perform private.conferir_arquivo_novo(new.versao_id, new.papel, new.copiado_de, new.formato, new.tamanho, new.hash_md5);
    if new.papel in ('png', 'bpmn') and da_versao.enviada_em <> now() then
      perform private.conferir_acrescimo_a_versao(new.versao_id);
    end if;
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- A versão como o evento a guarda: rótulo (V5F, V6P, V7), processo, etapa e os arquivos (papel e nome). A observação saiu.
create or replace function private.estado_da_versao(versao uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'rotulo', 'V' || v.numero || case when v.historica then 'F' when v.piloto then 'P' else '' end,
    'processo_nome', p.nome, 'setor_sigla', s.sigla, 'etapa', e.nome,
    'arquivos', coalesce((select jsonb_agg(jsonb_build_object('papel', a.papel, 'nome', a.nome) order by a.papel)
      from public.arquivos_da_versao a where a.versao_id = v.id), '[]'::jsonb))
  from public.versoes v
  join public.processos p on p.id = v.processo_id
  join public.setores s on s.id = p.setor_id
  left join public.etapas e on e.id = v.etapa_id
  where v.id = versao $$;

-- Um evento por envio: "registrar_historica" na histórica, "enviar_piloto" na piloto, "enviar" na em sequência.
create or replace function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case when new.historica then 'registrar_historica' when new.piloto then 'enviar_piloto' else 'enviar' end,
    'versao', new.processo_id::text, jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Um evento por arquivo que entra depois da versão: "acrescentar_relatorio", "sem_alteracao" (com a versão de onde veio
-- o relatório) ou "acrescentar_arquivo" (o .png ou o .bpmn, com o papel). Os arquivos que entram junto com a versão já
-- estão no evento de envio dela.
create or replace function private.registrar_evento_do_relatorio() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  da_versao record;
  depois jsonb;
  acao_do_evento text;
begin
  select processo_id, enviada_em into da_versao from public.versoes where id = new.versao_id;
  if da_versao.enviada_em = now() then
    return null;
  end if;
  depois := private.estado_da_versao(new.versao_id);
  acao_do_evento := case when new.copiado_de is not null then 'sem_alteracao'
    when new.papel = 'relatorio' then 'acrescentar_relatorio' else 'acrescentar_arquivo' end;
  if new.copiado_de is not null then
    depois := depois || jsonb_build_object('relatorio_de', (
      select 'V' || v.numero || case when v.historica then 'F' when v.piloto then 'P' else '' end
      from public.arquivos_da_versao a join public.versoes v on v.id = a.versao_id where a.id = new.copiado_de));
  end if;
  if acao_do_evento = 'acrescentar_arquivo' then
    depois := depois || jsonb_build_object('papel', new.papel);
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), acao_do_evento, 'versao', da_versao.processo_id::text,
    jsonb_build_object('antes', null, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- As duas funções de registro perdem o p_observacao; a assinatura muda, então saem as antigas.
drop function public.registrar_versao(uuid, integer, text, jsonb);
drop function public.registrar_versao_historica(uuid, integer, text, jsonb);

-- Grava a versão e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou. Sem
-- security definer: a RLS decide. Na em sequência, p_numero é o número com que os arquivos foram nomeados no Drive (se
-- o banco der outro, nada é gravado); na piloto (p_piloto), é o número digitado.
create function public.registrar_versao(p_processo uuid, p_numero integer, p_arquivos jsonb, p_piloto boolean default false)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
  numero_dado integer;
begin
  if p_piloto then
    insert into public.versoes (processo_id, numero, piloto) values (p_processo, p_numero, true) returning id into versao;
  else
    insert into public.versoes (processo_id) values (p_processo) returning id, numero into versao, numero_dado;
    if numero_dado <> p_numero then
      raise exception 'numero_da_versao_mudou:%', numero_dado;
    end if;
  end if;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

-- Grava a versão histórica e os arquivos de uma vez. p_numero é o número digitado.
create function public.registrar_versao_historica(p_processo uuid, p_numero integer, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
begin
  insert into public.versoes (processo_id, numero, historica) values (p_processo, p_numero, true) returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

-- Acrescenta o .png ou o .bpmn a uma versão piloto ou em sequência que ainda não o tem, chamada pela função
-- arquivos-no-drive. A histórica (somente leitura) e a aprovada (ADR 0011) são recusadas pelo gatilho dos arquivos.
-- Quem pode: os mesmos de registrar a versão (a RLS também decide); a conferência explícita dá a recusa certa a quem não
-- enxerga a versão.
create function public.acrescentar_arquivo(p_versao uuid, p_arquivo jsonb) returns uuid
language plpgsql set search_path = ''
as $$
declare
  papel_novo text := p_arquivo ->> 'papel';
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para acrescentar arquivo à versão' using errcode = '42501';
  end if;
  if papel_novo is null or papel_novo not in ('png', 'bpmn') then
    raise exception 'papel_nao_acrescentavel';
  end if;
  if exists (select 1 from public.arquivos_da_versao where versao_id = p_versao and papel = papel_novo::public.papel_do_arquivo) then
    raise exception 'arquivo_ja_existe';
  end if;
  perform private.gravar_arquivos_da_versao(p_versao, jsonb_build_array(p_arquivo));
  return (select id from public.arquivos_da_versao where versao_id = p_versao and papel = papel_novo::public.papel_do_arquivo);
end $$;

revoke execute on function public.registrar_versao(uuid, integer, jsonb, boolean),
  public.registrar_versao_historica(uuid, integer, jsonb), public.acrescentar_arquivo(uuid, jsonb) from public, anon;
grant execute on function public.registrar_versao(uuid, integer, jsonb, boolean),
  public.registrar_versao_historica(uuid, integer, jsonb), public.acrescentar_arquivo(uuid, jsonb) to authenticated;
-- Chamadas de dentro das funções e dos gatilhos, que rodam com a permissão de quem grava.
revoke execute on function private.conferir_onde_cabe_a_versao(uuid, text), private.conferir_numero_da_piloto(uuid, integer),
  private.conferir_acrescimo_a_versao(uuid) from public, anon;
grant execute on function private.conferir_onde_cabe_a_versao(uuid, text), private.conferir_numero_da_piloto(uuid, integer),
  private.conferir_acrescimo_a_versao(uuid) to authenticated;
