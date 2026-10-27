-- Corrige a corrida de editar_numero_da_versao (achado do code-review do /ship): o número que a tela viu era conferido antes
-- da trava do processo, então duas edições simultâneas passavam as duas pela conferência e a segunda sobrescrevia a primeira.
-- Agora a trava vem primeiro e o número é lido de novo depois dela. Mesmo corpo da migração 20261027140000 fora essa ordem;
-- create or replace mantém os privilégios.

create or replace function public.editar_numero_da_versao(p_versao uuid, p_numero_esperado integer, p_numero_novo integer) returns void
language plpgsql set search_path = ''
as $$
declare
  atual record;
  outro text;
  letra text;
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar o número da versão' using errcode = '42501';
  end if;
  select processo_id, numero, historica, piloto into atual from public.versoes where id = p_versao;
  if not found then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  if exists (select 1 from public.processos where id = atual.processo_id and arquivado_em is not null) then
    raise exception 'processo_arquivado';
  end if;
  perform private.conferir_processo_que_recebe_versao(atual.processo_id);
  if p_numero_novo is null or p_numero_novo < 1 then
    raise exception 'numero_invalido:%', p_numero_novo;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(atual.processo_id::text, 11));
  select numero into atual.numero from public.versoes where id = p_versao;
  if p_numero_novo = atual.numero then
    raise exception 'numero_invalido:%', p_numero_novo;
  end if;
  if p_numero_esperado is distinct from atual.numero then
    raise exception 'numero_da_versao_alterado:%', atual.numero;
  end if;
  select 'V' || numero || case when historica then 'F' when piloto then 'P' else '' end into outro
  from public.versoes where processo_id = atual.processo_id and numero = p_numero_novo;
  if outro is not null then
    raise exception 'numero_ja_usado:%', outro;
  end if;
  letra := case when atual.historica then 'F' when atual.piloto then 'P' else '' end;
  perform set_config('ep.renumerando', 'on', true);
  update public.versoes set numero = p_numero_novo where id = p_versao;
  update public.arquivos_da_versao
  set nome = private.nome_com_o_rotulo_novo(nome, '_V' || atual.numero || letra || '_', '_V' || p_numero_novo || letra || '_')
  where versao_id = p_versao;
  update public.pdfs_da_aprovacao
  set nome = private.nome_com_o_rotulo_novo(nome, '_V' || atual.numero || '_', '_V' || p_numero_novo || '_')
  where versao_id = p_versao and guardado_em is null;
  perform set_config('ep.renumerando', 'off', true);
end $$;
