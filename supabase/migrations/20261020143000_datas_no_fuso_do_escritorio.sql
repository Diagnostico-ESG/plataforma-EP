-- O dia da revisão interna e o "hoje" da data da aprovação passam a ser os de Brasília (achado do /ship de
-- revisoes-aprovacao). Não destrutiva: só recria duas funções. `current_date` é o dia do relógio do banco (UTC, 3 h à
-- frente): depois das 21h em Brasília a revisão gravava o dia seguinte, e a data de hoje escolhida na tela era recusada
-- como "futura" ou como anterior à revisão. As datas de início e fim das etapas seguem como estão (backlog).

create function private.hoje() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

revoke execute on function private.hoje() from public, anon;
grant execute on function private.hoje() to authenticated;

-- Igual à da migração 20261019215429_revisao_interna, trocando só o dia da revisão.
create or replace function private.preparar_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para registrar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  perform private.conferir_revisao_interna_em_andamento(new.processo_id);
  if private.id_da_versao_mais_recente(new.processo_id) is null then
    raise exception 'sem_versao';
  end if;
  new.revisor_id := (select auth.uid());
  new.revisada_em := private.hoje();
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado = 'corrigida' then
    new := private.preparar_corrigida(new, new.revisor_id);
  else
    new := private.preparar_sem_alteracao(new, new.revisor_id);
  end if;
  return new;
end $$;

-- Igual à da migração 20261019224928_aprovacao, trocando só o "hoje".
create or replace function private.conferir_data_da_aprovacao(p_processo uuid, p_data date) returns void
language plpgsql stable set search_path = ''
as $$
declare
  ultima_revisao date := (select max(revisada_em) from public.revisoes_internas where processo_id = p_processo);
begin
  if p_data is null then
    return;
  end if;
  if p_data > private.hoje() then
    raise exception 'data_no_futuro:%', p_data;
  end if;
  if ultima_revisao is not null and p_data < ultima_revisao then
    raise exception 'aprovacao_antes_da_revisao:%:%', p_data, ultima_revisao;
  end if;
end $$;
