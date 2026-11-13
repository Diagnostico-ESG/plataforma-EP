-- Relatório numerado com R (documentos-versoes, mudança de 2026-11-13; ADR 0047, que muda o ADR 0026 só na letra): o rótulo do
-- relatório passa a "Relatório R2" (os eventos já gravados ficam como estão) e o Administrador ativo renomeia, um arquivo por
-- chamada, os relatórios numerados cujo nome ainda termina em "_Relatório V<número dele>.<extensão>". A função do servidor
-- renomeia primeiro no Drive e então chama esta; nome já com R volta sem gravar nem registrar (clicar de novo conserta o que
-- ficou pela metade). Não destrutiva: recria uma função e cria outras duas; nenhum dado é tocado pela migração.
-- Recusas em P0001 "motivo:valor" (src/versoes/recusasDeVersoes.ts); quem não é Administrador ativo, 42501.

create or replace function private.rotulo_do_relatorio(p_arquivo uuid) returns text
language sql stable set search_path = ''
as $$ select 'Relatório R' || numero_do_relatorio from public.arquivos_da_versao where id = p_arquivo $$;

-- O evento da renomeação, no histórico do processo (a referência é o id dele), com o processo e o setor como nos demais eventos
-- de versão. Definidor porque quem chama não insere em eventos; só a função abaixo o usa.
create function private.registrar_renomeacao_do_relatorio(p_arquivo uuid, p_antes text, p_depois text) returns void
language sql security definer set search_path = ''
as $$
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  select (select auth.uid()), 'renomear_relatorio', 'versao', v.processo_id::text,
    jsonb_build_object('antes', jsonb_build_object('nome', p_antes),
      'depois', jsonb_build_object('nome', p_depois, 'processo_nome', p.nome, 'setor_sigla', s.sigla))
  from public.arquivos_da_versao a
  join public.versoes v on v.id = a.versao_id
  join public.processos p on p.id = v.processo_id
  join public.setores s on s.id = p.setor_id
  where a.id = p_arquivo $$;

-- Não é definidora: grava com os privilégios de quem chama (a coluna nome já se altera pela marca da edição do número, que os
-- gatilhos de arquivos_da_versao conferem; com ela, a troca não conta como substituição nem esbarra na versão aprovada ou na
-- situação do processo).
create function public.renomear_relatorio_para_r(p_arquivo uuid, p_nome_esperado text) returns text
language plpgsql set search_path = ''
as $$
declare
  atual record;
  novo text;
begin
  if not private.administrador_ativo() then
    raise exception 'sem permissão para renomear o relatório' using errcode = '42501';
  end if;
  select nome, papel, numero_do_relatorio into atual from public.arquivos_da_versao where id = p_arquivo;
  if not found then
    raise insufficient_privilege using message = 'sem_permissao';
  end if;
  if atual.numero_do_relatorio is not null and atual.nome ~ ('_Relatório R' || atual.numero_do_relatorio || '\.[^.]+$') then
    return atual.nome;
  end if;
  if atual.nome is distinct from p_nome_esperado then
    raise exception 'nome_do_relatorio_alterado:%', atual.nome;
  end if;
  if atual.papel <> 'relatorio' or atual.numero_do_relatorio is null
    or atual.nome !~ ('_Relatório V' || atual.numero_do_relatorio || '\.[^.]+$') then
    raise exception 'relatorio_fora_do_padrao:%', atual.nome;
  end if;
  novo := regexp_replace(atual.nome, '_Relatório V' || atual.numero_do_relatorio || '(\.[^.]+)$',
    '_Relatório R' || atual.numero_do_relatorio || '\1');
  perform set_config('ep.renumerando', 'on', true);
  update public.arquivos_da_versao set nome = novo where id = p_arquivo;
  perform set_config('ep.renumerando', 'off', true);
  perform private.registrar_renomeacao_do_relatorio(p_arquivo, atual.nome, novo);
  return novo;
end $$;

revoke execute on function private.registrar_renomeacao_do_relatorio(uuid, text, text),
  public.renomear_relatorio_para_r(uuid, text) from public, anon;
grant execute on function private.registrar_renomeacao_do_relatorio(uuid, text, text),
  public.renomear_relatorio_para_r(uuid, text) to authenticated;
