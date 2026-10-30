-- Responsável inicial por etapa (funcionalidade 17 de processos-etapas; ADR 0036, que substitui a parte do ADR 0022 em
-- que quem move vira o responsável). Não destrutiva: só acrescenta a coluna (nula em todas as etapas) e muda quem fica
-- responsável ao mover, cadastrar e retomar. Nenhum processo que já existe muda.

alter table public.etapas add column responsavel_inicial_id uuid references public.usuarios (id);
-- A política "etapas: administrador ativo altera" já vale para a coluna nova; o privilégio de coluna é o que faltava.
-- As etapas fixas já deixam mudar esta coluna: a trava delas (bloquear_etapa_protegida) só olha nome, fase e ativa.
grant update (responsavel_inicial_id) on public.etapas to authenticated;

-- Só Administrador ou Integrante do EP ativo (a mesma conferência do responsável do processo, reaproveitada), e nunca
-- em Concluídos. Gravar nulo ou o mesmo valor passa sempre: o gatilho só confere o que muda.
create function private.conferir_responsavel_inicial() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.responsavel_inicial_id is null or new.responsavel_inicial_id is not distinct from old.responsavel_inicial_id then
    return new;
  end if;
  if new.codigo = 'concluidos' then
    raise exception 'responsavel_inicial_em_concluidos';
  end if;
  perform private.conferir_responsavel(new.responsavel_inicial_id, null);
  return new;
end $$;

create trigger conferir_responsavel_inicial before update of responsavel_inicial_id on public.etapas
  for each row execute function private.conferir_responsavel_inicial();

-- O responsável inicial válido da etapa: o id dele se é Administrador ou Integrante do EP ativo agora; senão nulo
-- (inclusive em Concluídos). Não se guarda a validade: ela se calcula a cada chegada.
create function private.responsavel_inicial_valido(p_etapa uuid) returns uuid
language sql stable set search_path = ''
as $$
  select u.id
  from public.etapas e join public.usuarios u on u.id = e.responsavel_inicial_id
  where e.id = p_etapa and e.codigo <> 'concluidos' and u.ativo and u.perfil in ('administrador', 'integrante_ep') $$;

-- Cadastro (inclusive subprocesso e "a classificar"): o processo entra em Não iniciados com o responsável inicial dela. O
-- que a tela mandar no campo é ignorado.
create function private.dar_responsavel_inicial_ao_cadastrar() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.responsavel_id := private.responsavel_inicial_valido((select id from public.etapas where codigo = 'nao_iniciados'));
  return new;
end $$;

create trigger dar_responsavel_inicial_ao_cadastrar before insert on public.processos
  for each row execute function private.dar_responsavel_inicial_ao_cadastrar();

-- Retomar: como se o processo chegasse de novo à etapa em que está. A troca, se houver, é o evento de mudança de
-- responsável que já existe (autor: quem retomou); sem troca, nada a mais é registrado.
create function private.dar_responsavel_inicial_ao_retomar(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  inicial uuid := private.responsavel_inicial_valido(
    (select etapa_id from public.passagens where processo_id = p_processo and saiu_em is null));
begin
  update public.processos set responsavel_id = inicial where id = p_processo and responsavel_id is distinct from inicial;
end $$;

create or replace function public.retomar_processo(p_processo uuid, p_motivo text) returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.mudar_situacao(p_processo, 'em_andamento', p_motivo);
  perform private.dar_responsavel_inicial_ao_retomar(p_processo);
end $$;

-- Igual à da migração 20261027120000_confirmacao_de_arquivos, com uma troca: o responsável depois do movimento é o
-- responsável inicial válido da etapa de destino (ou ninguém), no lugar de quem chama. Quem move fica só no histórico,
-- como autor do evento.
create or replace function public.mover_processo(p_processo uuid, p_etapa uuid, p_data_da_publicacao date default null,
  p_link_da_publicacao text default null, p_explicacao_sem_publicacao text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  antes public.processos;
  depois public.processos;
  de public.etapas;
  para public.etapas;
  evento jsonb;
  faltas jsonb;
begin
  select * into antes from public.processos where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para mover o processo' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(p_processo);
  para := private.etapa_de_destino(p_etapa);
  select e.* into de from public.passagens pa join public.etapas e on e.id = pa.etapa_id
  where pa.processo_id = p_processo and pa.saiu_em is null;
  if de.id = para.id then
    return;
  end if;
  faltas := private.arquivos_que_faltam_na_ida(p_processo, de, para);
  depois := antes;
  depois.responsavel_id := private.responsavel_inicial_valido(para.id);
  if para.codigo = 'concluidos' then
    depois := private.publicacao_da_chegada(depois, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao);
  elsif de.codigo = 'concluidos' then
    depois.explicacao_sem_publicacao := null;
  end if;
  evento := private.evento_do_movimento(antes, depois, de, para);
  if faltas is not null then
    evento := jsonb_set(evento, '{depois,sem_arquivos}', faltas);
  end if;
  perform set_config('ep.movendo_processo', 'mover', true);
  perform private.trocar_passagem(p_processo, para, evento);
  perform private.gravar_processo_movido(depois);
  perform set_config('ep.movendo_processo', '', true);
end $$;

-- O evento da etapa passa a levar o responsável inicial (id e nome); a troca dele é uma edição da etapa. Lê o nome em
-- usuarios, por isso deixa de ser "immutable".
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql stable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome, 'ativa', etapa.ativa, 'ordem', etapa.ordem,
  'fase', etapa.fase, 'responsavel_inicial_id', etapa.responsavel_inicial_id,
  'responsavel_inicial_nome', (select nome from public.usuarios where id = etapa.responsavel_inicial_id)) $$;

revoke execute on function private.responsavel_inicial_valido(uuid), private.dar_responsavel_inicial_ao_retomar(uuid)
  from public, anon;
grant execute on function private.responsavel_inicial_valido(uuid), private.dar_responsavel_inicial_ao_retomar(uuid)
  to authenticated;
revoke execute on function private.conferir_responsavel_inicial(), private.dar_responsavel_inicial_ao_cadastrar()
  from public, anon, authenticated;
