-- Fim do Arquivado (repositorio-de-processos, ticket 01; ADR 0034). DESTRUTIVA: apaga a coluna processos.arquivado_em,
-- as funções arquivar_processo e desarquivar_processo, os gatilhos e as funções de conferência e de evento do
-- arquivamento, a liberação de sessão do arquivado e a trava "processo_arquivado" de cada função que a tinha. Cria
-- processos.tirado_do_quadro_em (copiada do arquivado_em dos concluídos arquivados; suspenso e cancelado que estavam
-- arquivados viram comuns) e, na view, tirado_do_quadro_em e no_quadro. Os eventos antigos 'arquivar' e 'desarquivar'
-- ficam em public.eventos.

-- 1. Coluna nova, privilégio e a liberação de sessão (nenhuma função a liga neste ticket; as do ticket 03 ligarão).
alter table public.processos add column tirado_do_quadro_em timestamptz;
grant update (tirado_do_quadro_em) on public.processos to authenticated;

create function private.liberando_tirada() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.liberando_tirada', true), '') = 'on' $$;

create function private.conferir_tirada_do_quadro() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.tirado_do_quadro_em is distinct from old.tirado_do_quadro_em and not private.liberando_tirada() then
    raise exception 'tirado_do_quadro_so_pela_funcao';
  end if;
  return new;
end $$;

-- 2. Soltar os gatilhos do arquivado antes da cópia, para ela não gerar evento nem recusa.
drop trigger conferir_processo_arquivado on public.processos;
drop trigger conferir_arquivamento on public.processos;
drop trigger registrar_evento_do_arquivamento on public.processos;

-- 3. O concluído arquivado continua fora do Quadro: a data do arquivamento vira a de Tirar do Quadro.
update public.processos p set tirado_do_quadro_em = p.arquivado_em
from public.passagens pa join public.etapas e on e.id = pa.etapa_id
where pa.processo_id = p.id and pa.saiu_em is null and e.codigo = 'concluidos'
  and p.situacao = 'em_andamento' and p.arquivado_em is not null;

create trigger conferir_tirada_do_quadro before update of tirado_do_quadro_em on public.processos
  for each row execute function private.conferir_tirada_do_quadro();

-- 4. As funções sem a trava do arquivado.
create or replace function private.conferir_processo_em_andamento(processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  situacao_do_processo public.situacao_guardada;
begin
  if processo is null then
    return;
  end if;
  select situacao into situacao_do_processo from public.processos where id = processo;
  if situacao_do_processo <> 'em_andamento' then
    raise exception 'processo_parado:%', situacao_do_processo;
  end if;
end $$;

-- Grava a data e o link com a liberação da publicação ligada. Zero linhas é a RLS recusando: 42501.
create or replace function private.gravar_publicacao(p_processo uuid, p_data date, p_link text) returns void
language plpgsql set search_path = ''
as $$
declare
  linhas integer;
begin
  perform set_config('ep.movendo_processo', 'publicar', true);
  update public.processos set publicado_em = p_data, link_da_publicacao = p_link where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.movendo_processo', '', true);
  if linhas = 0 then
    raise exception 'sem permissão para registrar a publicação' using errcode = '42501';
  end if;
end $$;

-- Registra ou corrige a data (e o link) da publicação; o processo fica onde está. O parado (suspenso ou cancelado) é
-- recusado como em qualquer alteração. Sem security definer: a RLS decide.
create or replace function public.registrar_publicacao(p_processo uuid, p_data date, p_link text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  link text := nullif(btrim(p_link), '');
begin
  if not exists (select 1 from public.processos where id = p_processo) then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para registrar a publicação' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(p_processo);
  perform private.conferir_etapa_da_publicacao(p_processo);
  perform private.conferir_data_da_publicacao(p_processo, p_data);
  perform private.conferir_link_da_aprovacao(link);
  perform private.gravar_publicacao(p_processo, p_data, link);
end $$;

create or replace function private.preparar_anexo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao(new.processo_id);
  new.etapa_id := (select etapa_atual_id from public.processos_com_andamento where id = new.processo_id);
  new.enviado_por := (select auth.uid());
  new.enviado_em := now();
  return new;
end $$;

create or replace function private.conferir_processo_do_anexo_retirado() returns trigger
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_processo_que_recebe_versao(old.processo_id);
  return old;
end $$;

create or replace function public.editar_numero_da_versao(p_versao uuid, p_numero_esperado integer, p_numero_novo integer)
returns void
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

-- 5. Apagar o que sobra do arquivado.
drop function public.arquivar_processo(uuid);
drop function public.desarquivar_processo(uuid);
drop function private.gravar_arquivamento(uuid, timestamptz);
drop function private.conferir_processo_arquivado();
drop function private.conferir_arquivamento();
drop function private.registrar_evento_do_arquivamento();
drop function private.liberando_arquivado();

-- 6. A view sem arquivado_em e com tirado_do_quadro_em e no_quadro no fim. no_quadro: fora de Concluídos é sempre
-- verdadeiro; em Concluídos, até 30 dias da entrada e enquanto ninguém tirou depois dela.
drop view public.processos_com_andamento;
create view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_modelagem_piloto, u.ativo as responsavel_ativo,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.publicado_em,
  pa.etiqueta, pa.entrou_em as entrou_na_etapa_em,
  (select count(*)::int from public.etapas x where x.ativa and x.ordem <= e.ordem) as etapa_atual_posicao,
  p.link_da_publicacao,
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao,
  p.explicacao_sem_publicacao,
  exists (select 1 from public.versoes v where v.processo_id = p.id and v.piloto) as tem_versao_piloto,
  exists (select 1 from public.versoes v where v.processo_id = p.id and not v.historica and not v.piloto)
    as tem_versao_em_sequencia,
  exists (select 1 from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = p.id and f.papel = 'relatorio' and f.numero_do_relatorio is not null) as tem_relatorio_numerado,
  p.data_da_validacao,
  s.cor as setor_cor,
  p.tirado_do_quadro_em,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos'
    then (p.tirado_do_quadro_em is null or p.tirado_do_quadro_em < pa.entrou_em)
      and pa.entrou_em > now() - interval '30 days'
    else true end as no_quadro
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join public.passagens pa on pa.processo_id = p.id and pa.saiu_em is null
left join public.etapas e on e.id = pa.etapa_id
left join public.usuarios u on u.id = p.responsavel_id
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

-- 7. Agora a coluna pode sair.
alter table public.processos drop column arquivado_em;

-- 8. Permissões das funções novas.
revoke execute on function private.liberando_tirada(), private.conferir_tirada_do_quadro() from public, anon;
grant execute on function private.liberando_tirada(), private.conferir_tirada_do_quadro() to authenticated;
