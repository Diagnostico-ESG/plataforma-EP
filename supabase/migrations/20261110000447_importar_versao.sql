-- Importação dos dados atuais, ticket 02 (ADR 0044): as versões da pasta DOCUMENTOS MAPEAMENTO entram com o número do nome
-- do arquivo, em qualquer etapa e também em processo concluído, só pelo Administrador ativo. Só nesse caminho ficam de lado as
-- travas de etapa do envio (ADR 0025) e a ordem entre histórica, piloto e em sequência (ADR 0028); o número único por
-- processo (versoes_numero_unico) e o .bpm obrigatório (conferir_arquivos_da_versao) continuam. O caminho é a marca de
-- sessão ep.importando_versao, ligada e desligada dentro das funções novas, como a ep.importando_etapa do importar_processo:
-- fora delas, os gatilhos seguem iguais. Não destrutiva: só cria funções e recria quatro gatilhos com o mesmo comportamento
-- quando a marca está desligada. Recusas em P0001 "motivo:valor"; perfil errado, 42501.

-- A marca vale até o fim da transação (set_config local) e é desligada pelas funções antes de devolver.
create function private.importando_versao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.importando_versao', true), '') = 'sim' $$;

create function private.conferir_administrador_da_importacao() returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not (private.perfil_atual() = 'administrador' and private.usuario_ativo()) then
    raise exception 'sem permissão para importar' using errcode = '42501';
  end if;
end $$;

-- Versão, arquivo e anexo só com o processo em andamento; na importação, também com ele concluído.
create or replace function private.conferir_processo_que_recebe_versao(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  situacao_atual text;
begin
  select situacao into situacao_atual from public.processos_com_andamento where id = processo;
  if situacao_atual = 'concluido' and private.importando_versao() then
    return;
  end if;
  if situacao_atual <> 'em_andamento' then
    raise exception 'processo_fora_de_andamento:%', situacao_atual;
  end if;
end $$;

-- Onde cabe cada envio (igual à da migração relatorio_numerado); na importação, nenhuma trava de etapa.
create or replace function private.conferir_onde_cabe_a_versao(processo uuid, tipo text) returns void
language plpgsql stable set search_path = ''
as $$
declare
  atual record;
begin
  if private.importando_versao() then
    return;
  end if;
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

-- Antes de incluir a versão (igual à da migração versoes_por_etapa). Na importação, o número é o do nome do arquivo, em
-- qualquer tipo, e a ordem entre os tipos não se confere: a unicidade fica com versoes_numero_unico.
create or replace function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  importando boolean := private.importando_versao();
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  perform private.conferir_onde_cabe_a_versao(new.processo_id,
    case when new.historica then 'historica' when new.piloto then 'piloto' else 'sequencia' end);
  if new.historica then
    if not importando then
      perform private.conferir_versao_historica(new.processo_id, new.numero);
    end if;
    new.etapa_id := null;
  else
    if new.piloto and not importando then
      perform private.conferir_numero_da_piloto(new.processo_id, new.numero);
    elsif not new.piloto and not importando then
      new.numero := coalesce((select max(numero) from public.versoes where processo_id = new.processo_id), 0) + 1;
    end if;
    new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  end if;
  new.enviada_por := (select auth.uid());
  new.enviada_em := now();
  return new;
end $$;

-- O relatório novo de versão que não é histórica (igual à da migração relatorio_numerado); na importação, ele não precisa
-- ser da versão mais recente, porque as versões antigas entram fora de ordem.
create or replace function private.numerar_relatorio_novo(versao uuid, formato_novo text) returns integer
language plpgsql set search_path = ''
as $$
declare
  processo uuid := (select processo_id from public.versoes where id = versao);
begin
  if formato_novo <> 'docx' then
    raise exception 'relatorio_so_docx';
  end if;
  perform private.conferir_onde_cabe_a_versao(processo, 'relatorio');
  if not private.importando_versao() and versao is distinct from private.versao_que_recebe_o_relatorio(processo) then
    raise exception 'relatorio_fora_da_versao_mais_recente';
  end if;
  return private.proximo_numero_do_relatorio(processo);
end $$;

-- Um evento por envio (igual ao da migração versoes_por_etapa); a versão importada ganha o evento "importar".
create or replace function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case when private.importando_versao() then 'importar'
      when new.historica then 'registrar_historica' when new.piloto then 'enviar_piloto' else 'enviar' end,
    'versao', new.processo_id::text, jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Grava uma versão da pasta e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou (sem
-- security definer: a RLS decide). p_tipo: historica, piloto ou sequencia. p_numero_do_relatorio é o da prévia, com que o
-- relatório foi nomeado no Drive (se o banco der outro, nada é gravado). A versão que já existe é pulada, sem tocar em nada.
create function public.importar_versao(p_processo uuid, p_numero integer, p_tipo text, p_arquivos jsonb,
  p_numero_do_relatorio integer default null) returns text
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
  relatorio_dado integer;
begin
  perform private.conferir_administrador_da_importacao();
  if p_tipo is null or p_tipo not in ('historica', 'piloto', 'sequencia') then
    raise exception 'tipo_de_versao_invalido:%', p_tipo;
  end if;
  if exists (select 1 from public.versoes where processo_id = p_processo and numero = p_numero) then
    return 'ja_existia';
  end if;
  perform set_config('ep.importando_versao', 'sim', true);
  insert into public.versoes (processo_id, numero, historica, piloto)
  values (p_processo, p_numero, p_tipo = 'historica', p_tipo = 'piloto') returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  if p_numero_do_relatorio is not null then
    relatorio_dado := (select numero_do_relatorio from public.arquivos_da_versao where versao_id = versao and papel = 'relatorio');
    if relatorio_dado is distinct from p_numero_do_relatorio then
      raise exception 'numero_do_relatorio_mudou:%', coalesce(relatorio_dado, private.proximo_numero_do_relatorio(p_processo));
    end if;
  end if;
  perform private.cobrar_conferencias_da_versao();
  perform set_config('ep.importando_versao', '', true);
  return 'criada';
end $$;

-- O .pdf do relatório da pasta entra nos anexos do processo (história 48), também com o processo concluído. O anexo de mesmo
-- nome no processo é pulado: rodar de novo não duplica.
create function public.importar_anexo(p_processo uuid, p_arquivo jsonb) returns text
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_administrador_da_importacao();
  if exists (select 1 from public.anexos where processo_id = p_processo and lower(nome) = lower(p_arquivo ->> 'nome')) then
    return 'ja_existia';
  end if;
  perform set_config('ep.importando_versao', 'sim', true);
  insert into public.anexos (processo_id, nome, formato, tamanho, hash_md5, drive_id)
  values (p_processo, p_arquivo ->> 'nome', p_arquivo ->> 'formato', (p_arquivo ->> 'tamanho')::bigint,
    p_arquivo ->> 'hash_md5', p_arquivo ->> 'drive_id');
  perform set_config('ep.importando_versao', '', true);
  return 'criado';
end $$;

-- A linha da subpasta de onde vieram os arquivos (história 48b), acrescentada ao fim das Anotações; se o texto já tem a
-- linha, nada muda (a importação pode rodar de novo). É a única alteração que a importação faz em dado que já existe.
create function public.anotar_subpasta_da_importacao(p_processo uuid, p_subpasta text) returns void
language plpgsql set search_path = ''
as $$
declare
  linha text := 'Arquivos da subpasta ' || btrim(p_subpasta) || '.';
begin
  perform private.conferir_administrador_da_importacao();
  update public.processos set anotacoes = coalesce(anotacoes || E'\n', '') || linha
  where id = p_processo and position(linha in coalesce(anotacoes, '')) = 0;
end $$;

revoke execute on function private.importando_versao(), private.conferir_administrador_da_importacao() from public, anon;
grant execute on function private.importando_versao(), private.conferir_administrador_da_importacao() to authenticated;
revoke execute on function public.importar_versao(uuid, integer, text, jsonb, integer), public.importar_anexo(uuid, jsonb),
  public.anotar_subpasta_da_importacao(uuid, text) from public, anon;
grant execute on function public.importar_versao(uuid, integer, text, jsonb, integer), public.importar_anexo(uuid, jsonb),
  public.anotar_subpasta_da_importacao(uuid, text) to authenticated;
