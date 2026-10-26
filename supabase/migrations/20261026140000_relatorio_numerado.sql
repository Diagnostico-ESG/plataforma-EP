-- Relatório com numeração própria (documentos-versoes, ticket 10; ADR 0026, que muda o 0005 só no relatório): o relatório
-- deixa de ter o número da versão e passa a ter o seu por processo (Relatório V1, V2…), dado pelo banco; entra sozinho,
-- ligado à versão mais recente que não é histórica, ou junto com a versão em sequência; só .docx; só até a Revisão
-- interna. Saem "relatório pendente" (a tela), "sem alteração de conteúdo" e a cópia (copiado_de).
-- Destrutiva só em dados inventados do desenvolvimento: apaga as linhas de "sem alteração de conteúdo", a coluna
-- copiado_de e as funções acrescentar_relatorio, registrar_sem_alteracao e origem_do_relatorio; a assinatura de 4
-- parâmetros de registrar_versao também sai. Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts).

alter table public.arquivos_da_versao add column numero_do_relatorio integer
  constraint arquivos_numero_do_relatorio_positivo check (numero_do_relatorio > 0);
-- Sem privilégio de inclusão nem de alteração: só o gatilho (numerar_relatorio_novo) preenche a coluna.

-- Dá o número aos relatórios .docx das versões que não são históricas, na ordem do envio, por processo; o .pdf antigo e o
-- relatório da histórica ficam sem número. Idempotente: só numera o que ainda não tem, a partir do maior do processo.
-- Quem chama desliga os gatilhos antes (session_replication_role = replica): a troca de autor e data deles estragaria o
-- histórico. A migração e o teste 58 fazem isso.
create function private.numerar_relatorios_antigos() returns void
language sql set search_path = ''
as $$
  update public.arquivos_da_versao a set numero_do_relatorio = n.numero
  from (
    select a2.id, coalesce((select max(x.numero_do_relatorio) from public.arquivos_da_versao x
        join public.versoes vx on vx.id = x.versao_id where vx.processo_id = v.processo_id), 0)
      + row_number() over (partition by v.processo_id order by a2.enviado_em, a2.id) as numero
    from public.arquivos_da_versao a2 join public.versoes v on v.id = a2.versao_id
    where a2.papel = 'relatorio' and a2.formato = 'docx' and a2.numero_do_relatorio is null and not v.historica
  ) n
  where a.id = n.id $$;
revoke execute on function private.numerar_relatorios_antigos() from public, anon, authenticated;

-- As cópias de "sem alteração de conteúdo" saem (as cópias no Drive ficam na pasta, como os órfãos; os eventos antigos
-- ficam com o texto), e depois a coluna.
set local session_replication_role = replica;
delete from public.arquivos_da_versao where copiado_de is not null;
select private.numerar_relatorios_antigos();
set local session_replication_role = origin;

-- Onde cabe, agora também para o relatório: até a Revisão interna, pela ordem do catálogo.
create or replace function private.conferir_onde_cabe_a_versao(processo uuid, tipo text) returns void
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
  if tipo = 'relatorio' and atual.ordem > (select ordem from public.etapas where codigo = 'revisao_interna') then
    raise exception 'relatorio_fora_da_etapa';
  end if;
end $$;

-- O próximo número de relatório do processo: o maior + 1 (a histórica e o .pdf antigo, sem número, não contam). A trava
-- de aviso serializa dois envios ao mesmo tempo no mesmo processo; a tabela não guarda o processo, então a unicidade
-- do número por processo é desta função e do gatilho (não há índice único).
create function private.proximo_numero_do_relatorio(processo uuid) returns integer
language plpgsql set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(processo::text, 10));
  return coalesce((select max(a.numero_do_relatorio) from public.arquivos_da_versao a
    join public.versoes v on v.id = a.versao_id where v.processo_id = processo), 0) + 1;
end $$;

-- A versão mais recente do processo que não é histórica (a que recebe o relatório); nula se não há.
create function private.versao_que_recebe_o_relatorio(processo uuid) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = processo and not historica order by numero desc limit 1 $$;

-- O relatório novo de uma versão que não é histórica: só .docx, só até a Revisão interna, só na versão mais recente que
-- não é histórica; devolve o número que ele recebe.
create function private.numerar_relatorio_novo(versao uuid, formato_novo text) returns integer
language plpgsql set search_path = ''
as $$
declare
  processo uuid := (select processo_id from public.versoes where id = versao);
begin
  if formato_novo <> 'docx' then
    raise exception 'relatorio_so_docx';
  end if;
  perform private.conferir_onde_cabe_a_versao(processo, 'relatorio');
  if versao is distinct from private.versao_que_recebe_o_relatorio(processo) then
    raise exception 'relatorio_fora_da_versao_mais_recente';
  end if;
  return private.proximo_numero_do_relatorio(processo);
end $$;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, histórica somente leitura, o .png e o .bpmn
-- que entram depois (não entram na versão aprovada), o número do relatório novo, autor e data de quem grava.
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
    if new.papel in ('png', 'bpmn') and da_versao.enviada_em <> now() then
      perform private.conferir_acrescimo_a_versao(new.versao_id);
    end if;
    if new.papel = 'relatorio' and not da_versao.historica then
      new.numero_do_relatorio := private.numerar_relatorio_novo(new.versao_id, new.formato);
    end if;
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- Um evento por arquivo que entra depois da versão: "enviar_relatorio" (com o número do relatório; o rótulo é o da versão
-- que ele acompanha) ou "acrescentar_arquivo" (o .png ou o .bpmn, com o papel). Os arquivos que entram junto com a versão
-- já estão no evento de envio dela.
create or replace function private.registrar_evento_do_relatorio() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  da_versao record;
  depois jsonb;
begin
  select processo_id, enviada_em into da_versao from public.versoes where id = new.versao_id;
  if da_versao.enviada_em = now() then
    return null;
  end if;
  depois := private.estado_da_versao(new.versao_id);
  if new.papel = 'relatorio' then
    depois := depois || jsonb_build_object('numero_do_relatorio', new.numero_do_relatorio);
  else
    depois := depois || jsonb_build_object('papel', new.papel);
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.papel = 'relatorio' then 'enviar_relatorio' else 'acrescentar_arquivo' end,
    'versao', da_versao.processo_id::text, jsonb_build_object('antes', null, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Sai o que era da cópia e do relatório depois (o gatilho dos arquivos já não os chama).
drop function public.acrescentar_relatorio(uuid, integer, jsonb), public.registrar_sem_alteracao(uuid, jsonb),
  public.origem_do_relatorio(uuid);
drop function private.conferir_arquivo_novo(uuid, public.papel_do_arquivo, uuid, text, bigint, text),
  private.conferir_copia_do_relatorio(uuid, public.papel_do_arquivo, uuid, text, bigint, text),
  private.versao_anterior(uuid);
alter table public.arquivos_da_versao drop column copiado_de;

-- A unicidade (versão, papel) vale para todo papel menos o relatório numerado: uma versão pode ter mais de um relatório
-- (os enviados enquanto ela era a mais recente). O relatório da histórica e o .pdf antigo, sem número, continuam um por versão.
alter table public.arquivos_da_versao drop constraint arquivos_um_por_papel;
create unique index arquivos_um_por_papel on public.arquivos_da_versao (versao_id, papel) where numero_do_relatorio is null;

-- O relatório sozinho: liga à versão mais recente que não é histórica e dá o próximo número do processo. p_numero_da_versao
-- e p_numero_do_relatorio são os da prévia (com que o arquivo foi nomeado no Drive): se mudaram, nada é gravado. Sem
-- security definer: a RLS decide; a conferência explícita dá a recusa certa a quem não pode alterar.
create function public.enviar_relatorio(p_processo uuid, p_numero_da_versao integer, p_numero_do_relatorio integer, p_arquivo jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  alvo uuid;
  numero_da_versao_dado integer;
  proximo integer;
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para enviar relatório' using errcode = '42501';
  end if;
  perform private.conferir_processo_que_recebe_versao(p_processo);
  alvo := private.versao_que_recebe_o_relatorio(p_processo);
  if alvo is null then
    raise exception 'relatorio_sem_versao';
  end if;
  numero_da_versao_dado := (select numero from public.versoes where id = alvo);
  if numero_da_versao_dado <> p_numero_da_versao then
    raise exception 'numero_da_versao_mudou:%', numero_da_versao_dado;
  end if;
  proximo := private.proximo_numero_do_relatorio(p_processo);
  if proximo <> p_numero_do_relatorio then
    raise exception 'numero_do_relatorio_mudou:%', proximo;
  end if;
  perform private.gravar_arquivos_da_versao(alvo, jsonb_build_array(p_arquivo || jsonb_build_object('papel', 'relatorio')));
  return (select id from public.arquivos_da_versao where versao_id = alvo and numero_do_relatorio = proximo);
end $$;

-- A versão com o relatório junto: p_numero_do_relatorio é o da prévia (se o banco der outro, nada é gravado).
drop function public.registrar_versao(uuid, integer, jsonb, boolean);
create function public.registrar_versao(p_processo uuid, p_numero integer, p_arquivos jsonb, p_piloto boolean default false,
  p_numero_do_relatorio integer default null)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
  numero_dado integer;
  relatorio_dado integer;
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
  if p_numero_do_relatorio is not null then
    relatorio_dado := (select numero_do_relatorio from public.arquivos_da_versao where versao_id = versao and papel = 'relatorio');
    if relatorio_dado is distinct from p_numero_do_relatorio then
      raise exception 'numero_do_relatorio_mudou:%', coalesce(relatorio_dado, private.proximo_numero_do_relatorio(p_processo));
    end if;
  end if;
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

revoke execute on function public.enviar_relatorio(uuid, integer, integer, jsonb),
  public.registrar_versao(uuid, integer, jsonb, boolean, integer) from public, anon;
grant execute on function public.enviar_relatorio(uuid, integer, integer, jsonb),
  public.registrar_versao(uuid, integer, jsonb, boolean, integer) to authenticated;
-- Chamadas de dentro das funções e dos gatilhos, que rodam com a permissão de quem grava.
revoke execute on function private.proximo_numero_do_relatorio(uuid), private.versao_que_recebe_o_relatorio(uuid),
  private.numerar_relatorio_novo(uuid, text) from public, anon;
grant execute on function private.proximo_numero_do_relatorio(uuid), private.versao_que_recebe_o_relatorio(uuid),
  private.numerar_relatorio_novo(uuid, text) to authenticated;
