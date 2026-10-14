-- Subprocessos e reclassificação (processos-etapas, ticket 08): pai do tipo Processo, macroprocesso do pai, filhos que
-- acompanham o pai, exclusão recusada com a contagem e a função de reclassificar. Recusas chegam à interface como
-- "motivo:valor" em P0001 (src/processos/andamentosSupabase.ts).

-- O pai entra no cadastro; tipo e pai têm privilégio de coluna, mas só mudam pela função de reclassificar.
grant insert (processo_pai_id) on public.processos to authenticated;
grant update (tipo, processo_pai_id) on public.processos to authenticated;

-- A função liga este ajuste (vale só na transação) para o gatilho aceitar a mudança de tipo e pai, e deixa o motivo
-- para o evento. Quem chama a API não consegue ajustá-lo: só uma função do banco o liga, e ela o desliga no fim.
create function private.reclassificando() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.reclassificando', true), '') = 'on' $$;

create function private.conferir_tipo_do_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.reclassificando()
    and (new.tipo, new.processo_pai_id) is distinct from (old.tipo, old.processo_pai_id) then
    raise exception 'tipo_so_pela_funcao';
  end if;
  return new;
end $$;

create trigger conferir_tipo_do_processo before update on public.processos
  for each row execute function private.conferir_tipo_do_processo();

-- O pai é sempre um Processo (nunca o próprio item) e o subprocesso adota o macroprocesso dele. Roda antes de
-- preparar_processo (os gatilhos "antes" disparam em ordem alfabética), que inclui o setor envolvido no macroprocesso
-- adotado. Pai nulo, ou pai num tipo que não tem pai: a restrição processos_pai_coerente decide.
create function private.adotar_macroprocesso_do_pai() returns trigger
language plpgsql set search_path = ''
as $$
declare
  pai public.processos;
begin
  if new.processo_pai_id is null or new.tipo <> 'subprocesso' then
    return new;
  end if;
  select * into pai from public.processos where id = new.processo_pai_id;
  if pai.tipo is distinct from 'processo' or pai.id = new.id then
    raise exception 'pai_nao_e_processo';
  end if;
  new.macroprocesso_id := pai.macroprocesso_id;
  return new;
end $$;

create trigger adotar_macroprocesso_do_pai before insert or update on public.processos
  for each row execute function private.adotar_macroprocesso_do_pai();

-- Mudar o macroprocesso do pai leva os filhos junto: o gatilho de cada filho adota o novo e inclui o setor envolvido.
-- Roda com a permissão de quem grava; quem altera o pai também altera os filhos.
create function private.levar_macroprocesso_aos_subprocessos() returns trigger
language plpgsql set search_path = ''
as $$
begin
  update public.processos set macroprocesso_id = new.macroprocesso_id where processo_pai_id = new.id;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger levar_macroprocesso_aos_subprocessos after update of macroprocesso_id on public.processos
  for each row when (old.macroprocesso_id is distinct from new.macroprocesso_id)
  execute function private.levar_macroprocesso_aos_subprocessos();

-- Recusa com a contagem. "conferir_" vem antes de "registrar_exclusao_..." na ordem dos gatilhos: a recusa sai antes
-- de o evento da exclusão ser gravado.
create function private.conferir_processo_sem_subprocessos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.processos where processo_pai_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_subprocessos:%', total;
  end if;
  return old;
end $$;

create trigger conferir_processo_sem_subprocessos before delete on public.processos
  for each row execute function private.conferir_processo_sem_subprocessos();

-- As mudanças de tipo da spec (Regras de estado, Reclassificação); outra recusa com os dois tipos. Virar subprocesso
-- pede um pai e nenhum filho próprio (um nível só).
create function private.conferir_reclassificacao(processo uuid, de public.tipo_de_processo,
  para public.tipo_de_processo, pai uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  filhos integer := (select count(*) from public.processos where processo_pai_id = processo);
begin
  if de::text || '>' || para::text not in ('a_classificar>processo', 'a_classificar>subprocesso',
    'processo>subprocesso', 'subprocesso>processo') then
    raise exception 'tipo_invalido:%:%', de, para;
  end if;
  if para = 'subprocesso' and filhos > 0 then
    raise exception 'processo_com_subprocessos:%', filhos;
  end if;
  if para = 'subprocesso' and pai is null then
    raise exception 'pai_nao_e_processo';
  end if;
end $$;

-- Muda o tipo (e o pai) com motivo; o item continua o mesmo, com as etapas. Sem security definer: roda com a
-- permissão de quem chama e a RLS decide. Zero linhas é a RLS recusando o perfil (42501).
create function public.reclassificar_processo(p_processo uuid, p_tipo public.tipo_de_processo, p_pai uuid,
  p_motivo text) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  atual public.tipo_de_processo := (select tipo from public.processos where id = p_processo);
  linhas integer;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  if atual is null then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_reclassificacao(p_processo, atual, p_tipo, p_pai);
  perform set_config('ep.reclassificando', 'on', true), set_config('ep.motivo_da_reclassificacao', motivo, true);
  update public.processos set tipo = p_tipo, processo_pai_id = case when p_tipo = 'subprocesso' then p_pai end
  where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.reclassificando', 'off', true), set_config('ep.motivo_da_reclassificacao', '', true);
  if linhas = 0 then
    raise exception 'sem permissão para reclassificar o processo' using errcode = '42501';
  end if;
end $$;

-- Igual ao do ticket 04, com o nome do pai quando há pai (sem a chave quando não há, para os eventos antigos e os
-- dos processos sem pai continuarem iguais).
create or replace function private.estado_do_processo(processo public.processos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('nome', processo.nome, 'setor_id', processo.setor_id, 'setor_sigla', s.sigla,
    'macroprocesso_id', processo.macroprocesso_id, 'macroprocesso_nome', m.nome, 'tipo', processo.tipo,
    'origem', processo.origem, 'situacao', processo.situacao, 'contexto', processo.contexto,
    'observacoes', processo.observacoes)
    || case when processo.processo_pai_id is null then '{}'::jsonb else jsonb_build_object('processo_pai_nome',
      (select pai.nome from public.processos pai where pai.id = processo.processo_pai_id)) end
  from public.setores s, public.macroprocessos m
  where s.id = processo.setor_id and m.id = processo.macroprocesso_id $$;

-- Ação do evento do processo: mudou o tipo, reclassificar; depois, a da situação (ticket 07) e a do cadastro.
create or replace function private.acao_do_processo(operacao text, antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when operacao = 'UPDATE' and antes ->> 'tipo' is distinct from depois ->> 'tipo' then 'reclassificar'
  when operacao = 'UPDATE' and antes ->> 'situacao' is distinct from depois ->> 'situacao' then
    case depois ->> 'situacao' when 'suspenso' then 'suspender' when 'cancelado' then 'cancelar' else 'retomar' end
  else private.acao_do_cadastro(operacao, antes, depois) end $$;

-- Igual ao do ticket 07, com o motivo da reclassificação quando é ela que grava.
create or replace function private.registrar_evento_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'UPDATE' then private.estado_do_processo(old) end;
  depois jsonb := private.estado_do_processo(new);
  motivo text := coalesce(
    case when private.mudando_situacao() then nullif(current_setting('ep.motivo_da_situacao', true), '') end,
    case when private.reclassificando() then nullif(current_setting('ep.motivo_da_reclassificacao', true), '') end);
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_processo(tg_op, antes, depois), 'processo', new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois)
      || case when motivo is not null then jsonb_build_object('motivo', motivo) else '{}'::jsonb end);
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.conferir_tipo_do_processo(), private.adotar_macroprocesso_do_pai(),
  private.levar_macroprocesso_aos_subprocessos(), private.conferir_processo_sem_subprocessos()
  from public, anon, authenticated;
revoke execute on function private.reclassificando(),
  private.conferir_reclassificacao(uuid, public.tipo_de_processo, public.tipo_de_processo, uuid),
  public.reclassificar_processo(uuid, public.tipo_de_processo, uuid, text)
  from public, anon;
grant execute on function private.reclassificando(),
  private.conferir_reclassificacao(uuid, public.tipo_de_processo, public.tipo_de_processo, uuid),
  public.reclassificar_processo(uuid, public.tipo_de_processo, uuid, text)
  to authenticated;
