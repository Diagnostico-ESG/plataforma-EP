-- Versões históricas (documentos-versoes, ticket 04): as versões da primeira etapa do trabalho (V5F), registradas à
-- mão com o número digitado e os arquivos que existirem. Acrescenta o ramo "historica" aos gatilhos da migração
-- versoes e a função que grava a histórica. Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts).
-- Regras: só enquanto o processo não tem versão nova; número único; sem etapa; .bpm ou .bpmn e .png (relatório
-- opcional, só na criação); depois de criada é somente leitura; um evento próprio ("registrar_historica").

-- A coluna "historica" nasceu sem privilégio de inclusão (ticket 02): agora a inclusão é permitida; as regras abaixo
-- e a RLS (administrador e integrante ativos) decidem o resto.
grant insert (historica) on public.versoes to authenticated;

-- A histórica só entra enquanto o processo não tem versão nova, e o número digitado não pode já existir nele
-- (a restrição versoes_numero_unico continua como rede de segurança). Roda com a permissão de quem grava.
create function private.conferir_versao_historica(processo uuid, numero_digitado integer) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if exists (select 1 from public.versoes where processo_id = processo and not historica) then
    raise exception 'historica_depois_de_versao_nova';
  end if;
  if exists (select 1 from public.versoes where processo_id = processo and numero = numero_digitado) then
    raise exception 'numero_historico_repetido:%', numero_digitado;
  end if;
end $$;

-- Antes de incluir a versão: a nova recebe o número (maior do processo + 1, o que vier é ignorado) e a etapa atual; a
-- histórica mantém o número digitado e não tem etapa. Autor, data e observação aparada valem para as duas.
create or replace function private.preparar_versao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  if new.historica then
    perform private.conferir_versao_historica(new.processo_id, new.numero);
    new.etapa_id := null;
  else
    new.numero := coalesce((select max(numero) from public.versoes where processo_id = new.processo_id), 0) + 1;
    new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  end if;
  new.observacao := nullif(btrim(new.observacao), '');
  new.enviada_por := (select auth.uid());
  new.enviada_em := now();
  return new;
end $$;

-- A nova tem .bpmn e .png; a histórica, o .bpm ou o par .bpmn e .png (o relatório é opcional nas duas). Conferido no
-- fim da gravação (restrição adiada), porque a versão entra antes dos arquivos.
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
  elsif not papeis @> array['bpmn', 'png']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpmn_e_png';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Antes de incluir ou trocar o conteúdo de um arquivo: processo em andamento, autor e data de quem grava. A histórica é
-- somente leitura: nenhum arquivo muda, e só entra arquivo na chamada que criou a versão (enviada_em = now() é o
-- início da transação; outra chamada tem outro instante).
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
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

-- Um evento por registro: "registrar_historica" na histórica, "enviar" na nova.
create or replace function private.registrar_evento_da_versao() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), case when new.historica then 'registrar_historica' else 'enviar' end, 'versao',
    new.processo_id::text, jsonb_build_object('antes', null, 'depois', private.estado_da_versao(new.id)));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Os arquivos que a função de registro recebeu (papel, nome, formato, tamanho, hash_md5, drive_id), gravados com a
-- permissão de quem chamou: a RLS e os gatilhos decidem. Compartilhada pelas duas funções de registro.
create function private.gravar_arquivos_da_versao(versao uuid, arquivos jsonb) returns void
language sql set search_path = ''
as $$
  insert into public.arquivos_da_versao (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)
  select versao, (a ->> 'papel')::public.papel_do_arquivo, a ->> 'nome', a ->> 'formato', (a ->> 'tamanho')::bigint,
    a ->> 'hash_md5', a ->> 'drive_id'
  from jsonb_array_elements(arquivos) as a $$;

-- No fim da gravação, cobra as conferências adiadas e o evento; nomes qualificados (lição da migração
-- reunioes_salvar_com_nomes_qualificados).
create function private.cobrar_conferencias_da_versao() returns void
language plpgsql set search_path = ''
as $$
begin
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao immediate;
  set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao deferred;
end $$;

-- Mesma assinatura e mesmo comportamento da migração versoes; só passa a usar as funções compartilhadas.
create or replace function public.registrar_versao(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
  numero_dado integer;
begin
  insert into public.versoes (processo_id, observacao) values (p_processo, p_observacao)
  returning id, numero into versao, numero_dado;
  if numero_dado <> p_numero then
    raise exception 'numero_da_versao_mudou:%', numero_dado;
  end if;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

-- Grava a versão histórica e os arquivos de uma vez, chamada pela função arquivos-no-drive com o login de quem chamou.
-- Sem security definer: a RLS decide. p_numero é o número digitado.
create function public.registrar_versao_historica(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb)
returns uuid
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
begin
  insert into public.versoes (processo_id, numero, observacao, historica)
  values (p_processo, p_numero, p_observacao, true) returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.cobrar_conferencias_da_versao();
  return versao;
end $$;

revoke execute on function public.registrar_versao_historica(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.registrar_versao_historica(uuid, integer, text, jsonb) to authenticated;
-- Chamadas de dentro das funções de registro, que rodam com a permissão de quem grava.
revoke execute on function private.conferir_versao_historica(uuid, integer), private.gravar_arquivos_da_versao(uuid, jsonb),
  private.cobrar_conferencias_da_versao() from public, anon;
grant execute on function private.conferir_versao_historica(uuid, integer), private.gravar_arquivos_da_versao(uuid, jsonb),
  private.cobrar_conferencias_da_versao() to authenticated;
