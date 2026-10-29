-- Tirar do Quadro e Desfazer (repositorio-de-processos, ticket 03; ADR 0034). Não destrutiva: cria tirar_do_quadro (grava quando
-- o cartão saiu da coluna Concluídos) e voltar_ao_quadro (o Desfazer, grava nulo). Nenhuma grava evento no histórico. Sem
-- security definer: a RLS de processos decide quem altera. A coluna tirado_do_quadro_em só muda com a liberação de sessão
-- ep.liberando_tirada, que só estas funções ligam (gatilho conferir_tirada_do_quadro, da migração fim_do_arquivado).
-- As recusas chegam à interface como "motivo" em P0001.

-- Grava a marca (ou nulo) com a liberação ligada. Zero linhas é a RLS recusando: 42501.
create function private.gravar_tirada_do_quadro(p_processo uuid, p_quando timestamptz) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  perform set_config('ep.liberando_tirada', 'on', true);
  update public.processos set tirado_do_quadro_em = p_quando where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.liberando_tirada', 'off', true);
  if linhas = 0 then
    raise exception 'sem permissão para tirar do Quadro' using errcode = '42501';
  end if;
end $$;

-- A situação do processo visível e se está no Quadro, o que as duas funções conferem. Quem não altera (Consulta) é recusado
-- antes de qualquer regra de negócio, como em registrar_publicacao. Devolve colunas simples, e não o tipo da view, para a view
-- poder ser recriada por uma migração futura sem esbarrar nesta função.
create function private.ler_processo_para_o_quadro(p_processo uuid) returns table (situacao text, no_quadro boolean)
language plpgsql stable set search_path = ''
as $$
begin
  return query select v.situacao, v.no_quadro from public.processos_com_andamento v where v.id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para tirar do Quadro' using errcode = '42501';
  end if;
end $$;

-- Só se tira do Quadro o concluído que ainda está nele. clock_timestamp (e não now) para a marca ficar depois da entrada
-- em Concluídos mesmo numa transação só.
create function public.tirar_do_quadro(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  linha record;
begin
  select * into linha from private.ler_processo_para_o_quadro(p_processo);
  if linha.situacao <> 'concluido' then
    raise exception 'tirar_do_quadro_so_concluido';
  end if;
  if not linha.no_quadro then
    raise exception 'ja_fora_do_quadro';
  end if;
  perform private.gravar_tirada_do_quadro(p_processo, clock_timestamp());
end $$;

-- O Desfazer: grava nulo. Num concluído que já está no Quadro não muda nada e não é recusado.
create function public.voltar_ao_quadro(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  linha record;
begin
  select * into linha from private.ler_processo_para_o_quadro(p_processo);
  if linha.situacao <> 'concluido' then
    raise exception 'voltar_ao_quadro_so_concluido';
  end if;
  perform private.gravar_tirada_do_quadro(p_processo, null);
end $$;

revoke execute on function private.gravar_tirada_do_quadro(uuid, timestamptz), private.ler_processo_para_o_quadro(uuid),
  public.tirar_do_quadro(uuid), public.voltar_ao_quadro(uuid) from public, anon;
grant execute on function private.gravar_tirada_do_quadro(uuid, timestamptz), private.ler_processo_para_o_quadro(uuid),
  public.tirar_do_quadro(uuid), public.voltar_ao_quadro(uuid) to authenticated;
