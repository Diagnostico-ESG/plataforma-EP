-- Atualização das planilhas dos dashboards (exportacao-e-manutencao, ticket 02; ADRs 0017 e 0018). Não destrutiva:
-- extensões (pg_cron, pg_net, Vault), tipo, tabela de tentativas (só o Administrador ativo lê; ninguém grava direto),
-- view com o resultado calculado, funções e o agendamento das 6h de Brasília (9h UTC). A função que escreve as
-- planilhas e o pacote com os dados são do ticket 03: aqui o pacote leva só a tentativa e a ficha.
-- Reaproveita private.usuario_ativo() e private.perfil_atual(). As recusas chegam à interface como texto simples em
-- P0001 (atualizacao_em_andamento, planilhas_nao_configuradas, resultado_recusado).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create type public.origem_da_atualizacao as enum ('automatica', 'botao');

create table public.atualizacoes_das_planilhas (
  id uuid primary key default gen_random_uuid(),
  iniciada_em timestamptz not null default now(),
  origem public.origem_da_atualizacao not null,
  pedida_por uuid references public.usuarios (id) on delete restrict,
  concluida_em timestamptz,
  deu_certo boolean,
  motivo text constraint atualizacoes_motivo_tamanho check (char_length(motivo) <= 60),
  -- A ficha de uso único nunca é guardada: só o hash dela.
  ficha_hash text not null constraint atualizacoes_ficha_formato check (ficha_hash ~ '^[0-9a-f]{64}$'),
  constraint atualizacoes_fim_completo check ((concluida_em is null) = (deu_certo is null)),
  constraint atualizacoes_origem_e_autor check ((origem = 'botao') = (pedida_por is not null))
);

alter table public.atualizacoes_das_planilhas enable row level security;
revoke all on public.atualizacoes_das_planilhas from anon, authenticated;
grant select (id, iniciada_em, origem, pedida_por, concluida_em, deu_certo, motivo)
  on public.atualizacoes_das_planilhas to authenticated;

-- Quem administra: administrador ativo (a leitura das tentativas, os links e o pedido são só dele).
create function private.administrador_ativo() returns boolean
language sql stable set search_path = ''
as $$ select private.usuario_ativo() and coalesce(private.perfil_atual() = 'administrador', false) $$;

revoke execute on function private.administrador_ativo() from public, anon;
grant execute on function private.administrador_ativo() to authenticated;

create policy "atualizacoes_das_planilhas: administrador ativo lê" on public.atualizacoes_das_planilhas
  for select to authenticated using ((select private.administrador_ativo()));

-- Quanto tempo uma tentativa sem resposta ainda conta como em andamento (a view e o pedido usam o mesmo valor).
create function private.espera_da_atualizacao() returns interval
language sql immutable set search_path = ''
as $$ select interval '10 minutes' $$;

revoke execute on function private.espera_da_atualizacao() from public, anon;
grant execute on function private.espera_da_atualizacao() to authenticated;

-- O resultado se calcula, não se guarda: sem fim e recente é em andamento; sem fim e antiga, sem resposta.
create view public.resultado_das_atualizacoes_das_planilhas with (security_invoker = true) as
select a.id, a.iniciada_em, a.origem, a.pedida_por, u.nome as pedida_por_nome, a.concluida_em, a.motivo,
  case
    when a.concluida_em is not null and a.deu_certo then 'concluida'
    when a.concluida_em is not null then 'falhou'
    when a.iniciada_em > now() - private.espera_da_atualizacao() then 'em_andamento'
    else 'sem_resposta'
  end as resultado
from public.atualizacoes_das_planilhas a
left join public.usuarios u on u.id = a.pedida_por;

revoke all on public.resultado_das_atualizacoes_das_planilhas from anon, authenticated;
grant select on public.resultado_das_atualizacoes_das_planilhas to authenticated;

-- Só as 10 mais recentes ficam (depois de cada inclusão).
create function private.manter_as_dez_ultimas_atualizacoes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  delete from public.atualizacoes_das_planilhas where id in (
    select id from public.atualizacoes_das_planilhas order by iniciada_em desc, id desc offset 10);
  return null;
end $$;

create trigger manter_as_dez_ultimas after insert on public.atualizacoes_das_planilhas
  for each statement execute function private.manter_as_dez_ultimas_atualizacoes();

-- Cofre (Vault): só o dono lê; nenhuma função de tela devolve a senha.
create function private.segredo_das_planilhas(p_nome text) returns text
language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = p_nome $$;

revoke execute on function private.segredo_das_planilhas(text) from public, anon, authenticated;

-- Os dois endereços, montados a partir dos identificadores do cofre; nulos se faltar algum.
create function private.links_do_cofre() returns table (planilha_interna text, planilha_publica text)
language sql stable security definer set search_path = ''
as $$
  select case when i is null or p is null then null else 'https://docs.google.com/spreadsheets/d/' || i || '/edit' end,
         case when i is null or p is null then null else 'https://docs.google.com/spreadsheets/d/' || p || '/edit' end
  from (select private.segredo_das_planilhas('planilhas_id_interna') as i,
               private.segredo_das_planilhas('planilhas_id_publica') as p) cofre
$$;

revoke execute on function private.links_do_cofre() from public, anon;
grant execute on function private.links_do_cofre() to authenticated;

create function public.links_das_planilhas() returns table (planilha_interna text, planilha_publica text)
language plpgsql stable set search_path = ''
as $$
begin
  if not private.administrador_ativo() then
    raise exception 'sem permissão para ver os links das planilhas' using errcode = '42501';
  end if;
  return query select * from private.links_do_cofre();
end $$;

revoke execute on function public.links_das_planilhas() from public, anon;
grant execute on function public.links_das_planilhas() to authenticated;

-- Núcleo: confere, registra a tentativa e envia o pacote (neste ticket, só a tentativa e a ficha). Ninguém da tela o executa.
-- O bloqueio de transação impede dois pedidos simultâneos de passarem juntos pela conferência "em andamento".
create function private.iniciar_atualizacao_das_planilhas(p_origem public.origem_da_atualizacao, p_usuario uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  endereco text := private.segredo_das_planilhas('planilhas_endereco_da_funcao');
  senha text := private.segredo_das_planilhas('planilhas_senha_interna');
  ficha text;
  tentativa uuid;
begin
  perform pg_advisory_xact_lock(hashtext('atualizacao_das_planilhas'));
  if exists (select 1 from public.atualizacoes_das_planilhas
             where concluida_em is null and iniciada_em > now() - private.espera_da_atualizacao()) then
    raise exception 'atualizacao_em_andamento';
  end if;
  if endereco is null or senha is null or private.segredo_das_planilhas('planilhas_id_interna') is null
     or private.segredo_das_planilhas('planilhas_id_publica') is null then
    raise exception 'planilhas_nao_configuradas';
  end if;
  ficha := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.atualizacoes_das_planilhas (origem, pedida_por, ficha_hash)
  values (p_origem, p_usuario, encode(sha256(convert_to(ficha, 'utf8')), 'hex')) returning id into tentativa;
  perform net.http_post(url := endereco,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-senha-interna', senha),
    body := jsonb_build_object('tentativa', tentativa, 'ficha', ficha));
  return tentativa;
end $$;

revoke execute on function private.iniciar_atualizacao_das_planilhas(public.origem_da_atualizacao, uuid)
  from public, anon, authenticated;

create function private.pedir_atualizacao_do_botao() returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.administrador_ativo() then
    raise exception 'sem permissão para pedir a atualização das planilhas' using errcode = '42501';
  end if;
  return private.iniciar_atualizacao_das_planilhas('botao', (select auth.uid()));
end $$;

revoke execute on function private.pedir_atualizacao_do_botao() from public, anon;
grant execute on function private.pedir_atualizacao_do_botao() to authenticated;

create function public.pedir_atualizacao_das_planilhas() returns uuid
language sql set search_path = ''
as $$ select private.pedir_atualizacao_do_botao() $$;

revoke execute on function public.pedir_atualizacao_das_planilhas() from public, anon;
grant execute on function public.pedir_atualizacao_das_planilhas() to authenticated;

-- O que o pg_cron chama: não faz nada, sem erro, se há tentativa em andamento ou o cofre está incompleto.
create function private.atualizar_planilhas_automaticamente() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.iniciar_atualizacao_das_planilhas('automatica', null);
exception when others then
  if sqlerrm not in ('atualizacao_em_andamento', 'planilhas_nao_configuradas') then
    raise;
  end if;
end $$;

revoke execute on function private.atualizar_planilhas_automaticamente() from public, anon, authenticated;

-- O resultado volta da Edge Function sem login, com a chave publicável: security definer em public é a exceção
-- (spec e ADR 0018). A trava é a ficha de uso único, conferida por hash, só para tentativa ainda sem fim.
create function public.registrar_resultado_das_planilhas(
  p_tentativa uuid, p_ficha text, p_deu_certo boolean, p_motivo text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.atualizacoes_das_planilhas
  set concluida_em = now(), deu_certo = p_deu_certo, motivo = case when p_deu_certo then null else left(p_motivo, 60) end
  where id = p_tentativa and concluida_em is null
    and ficha_hash = encode(sha256(convert_to(p_ficha, 'utf8')), 'hex');
  if not found then
    raise exception 'resultado_recusado';
  end if;
end $$;

revoke execute on function public.registrar_resultado_das_planilhas(uuid, text, boolean, text) from public;
grant execute on function public.registrar_resultado_das_planilhas(uuid, text, boolean, text) to anon, authenticated;

-- Todo dia às 9h UTC (6h de Brasília, sem horário de verão).
select cron.schedule('atualizar-planilhas-dos-dashboards', '0 9 * * *',
  $$select private.atualizar_planilhas_automaticamente()$$);
