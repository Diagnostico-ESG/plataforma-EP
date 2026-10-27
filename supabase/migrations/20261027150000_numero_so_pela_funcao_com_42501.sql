-- Editar número da versão (travas-em-avisos, ticket 03), correção da migração 20261027140000_editar_numero_da_versao: a escrita
-- direta no número da versão e no nome dos arquivos continua recusada com 42501 (falta de permissão), como nos testes 27, 30 e
-- 60 e como era antes de a função existir, e não com P0001. Só troca o código do erro nos três gatilhos; mais nada muda.
-- Migração nova porque a anterior já foi aplicada no desenvolvimento (migração publicada não se edita).

create or replace function private.conferir_numero_da_versao_pela_funcao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.numero is distinct from old.numero and not private.renumerando() then
    raise exception 'numero_so_pela_funcao' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function private.preparar_arquivo_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  da_versao record;
begin
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome then
    if not private.renumerando() then
      raise exception 'nome_so_pela_funcao' using errcode = '42501';
    end if;
    return new;
  end if;
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

create or replace function private.preparar_pdf_da_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  processo uuid;
begin
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome then
    if not private.renumerando() then
      raise exception 'nome_so_pela_funcao' using errcode = '42501';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.guardado_em is distinct from old.guardado_em then
    return new;
  end if;
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para enviar o .pdf da aprovação' using errcode = '42501';
  end if;
  select a.processo_id into processo from public.aprovacoes a where a.id = new.aprovacao_id;
  if processo is null then
    raise exception 'sem_aprovacao_para_o_pdf';
  end if;
  perform private.conferir_processo_em_andamento(processo);
  if tg_op = 'INSERT' then
    if exists (select 1 from public.pdfs_da_aprovacao where aprovacao_id = new.aprovacao_id and guardado_em is null) then
      raise exception 'pdf_ja_enviado';
    end if;
    new.versao_id := (select versao_id from public.aprovacoes where id = new.aprovacao_id);
    perform private.conferir_nome_do_pdf(new.nome, new.versao_id);
  elsif old.guardado_em is not null then
    raise exception 'pdf_guardado_nao_se_altera';
  end if;
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;
