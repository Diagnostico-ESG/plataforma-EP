# Aba Planilhas e o pedido de atualização — plano de execução (ticket 02)

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) ao terminar cada passo.

**Meta:** o Administrador pede a atualização das planilhas e acompanha as tentativas pela aba "Planilhas"; o caminho do pedido (registro, ficha, envio pelo pg_net, resultado, agendamento das 6h) existe no banco, ainda sem a função que escreve as planilhas (ticket 03).

**Ticket:** `.scratch/exportacao-e-manutencao/issues/02-aba-planilhas-e-pedido-de-atualizacao.md` (critérios citados como "critério N"). **Spec:** `.scratch/exportacao-e-manutencao/spec.md`, histórias 28, 29 e 31 a 43, "Modelo de dados" e "Quem pode o quê". **ADR:** `docs/adr/0018-banco-agenda-e-entrega-os-dados-das-planilhas.md`.

**Branch:** `exportacao-e-manutencao-02` (isolamento por branch comum, sem worktree). Marco: `marco/2026-10-20-inicio-exportacao-e-manutencao-02`.

## Regras de `.claude/regras/banco.md` que valem

- Teste de banco antes da migração; migração com `npx supabase migration new`; migração, teste e tipos no mesmo ciclo.
- Vínculo conferido antes de `db:types` (`supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus`, desenvolvimento).
- Tabela nasce com RLS e políticas na mesma migração; privilégios de coluna só para o que a tela lê (a ficha nunca); view com `security_invoker = true`.
- Função `security definer` só em `private`, com `search_path` vazio; uso do schema e execução só a `authenticated`. **Exceção deste ticket:** `public.registrar_resultado_das_planilhas` é `security definer` em `public` e chamável por `anon`, porque a Edge Function a chama com a chave publicável e sem login (spec, "Funções do banco", e ADR 0018). A segurança está na ficha de uso único, conferida por hash dentro da função. Registrar no `desvios.md` (Tarefa 8).
- A rede do escritório só abre a porta 443: o teste de banco roda no GitHub Actions ("Testes de banco") e a migração pelo workflow "Migrar banco de desenvolvimento" (ambos autorizados na branch, ver "Ajustes deste Projeto" do `CLAUDE.md`). Não há `gh`: disparar pelo navegador do app, com alguns segundos entre os passos.
- Não ler `.env*`; o cofre real é do usuário (roteiro da Tarefa 7); os testes gravam segredos inventados dentro da transação e desfazem.

## Decisões deste plano (do ticket e da spec, sem novidade)

- Nomes no cofre (Vault): `planilhas_endereco_da_funcao`, `planilhas_senha_interna`, `planilhas_id_interna`, `planilhas_id_publica`. Os identificadores viram os links `https://docs.google.com/spreadsheets/d/<id>/edit`.
- "Configurado" = os quatro segredos existem. O pacote deste ticket leva só `{ tentativa, ficha }`; o ticket 03 acrescenta os dados.
- A ficha é gerada no banco (dois `gen_random_uuid()` sem hífen) e só o hash SHA-256 fica na tabela; o texto vai uma vez, no pacote.
- Três funções em `private` para separar o núcleo do que a tela alcança: `iniciar_atualizacao_das_planilhas(origem, usuário)` (núcleo, **sem** execução para `authenticated`), `pedir_atualizacao_do_botao()` (confere o Administrador ativo e chama o núcleo; `authenticated` executa) e `atualizar_planilhas_automaticamente()` (o que o pg_cron chama; não faz nada, sem erro, se há tentativa em andamento ou o cofre está incompleto, para o `cron.job_run_details` não encher de falhas e a lista de 10 tentativas não encher de "Falhou" num ambiente sem cofre).
- Trava de concorrência: `pg_advisory_xact_lock` no começo do núcleo, para dois pedidos simultâneos não passarem juntos pela conferência "em andamento".
- "Em andamento" = sem fim e com menos de 10 minutos (`private.espera_da_atualizacao()` devolve o intervalo, usado pela view e pelo núcleo: uma regra, um lugar). "Sem resposta" = sem fim e mais antiga; um resultado tardio ainda é aceito pela ficha.
- O motivo guardado tem até 60 caracteres (o código curto); a tela o traduz.
- Releitura a cada 5 s (`INTERVALO_DA_RELEITURA_MS`) só enquanto há tentativa "Em andamento".
- Novo prop `planilhas` obrigatório em `App`, `AreaDeAdministracao`; os ~50 arquivos de teste que renderizam `<App>` ganham `planilhas={new PlanilhasFalso()}` por um script (Tarefa 4).
- O roteiro do cofre fica em `docs/planilhas-cofre-do-banco.md` (o ticket 05 o inclui em `docs/manutencao/`).

## Arquivos

- Banco: `supabase/tests/43_atualizacao_das_planilhas.test.sql` (novo), `supabase/migrations/<timestamp>_atualizacao_das_planilhas.sql` (novo), `src/types/database.ts` (gerado).
- Módulo e regras puras (novo diretório `src/planilhas/`): `tipos.ts`, `frasesDasPlanilhas.ts` (+ `.test.ts`), `planilhasSupabase.ts` (+ `.test.ts`), `PlanilhasFalso.ts` (+ `.test.ts`).
- Hooks: `src/hooks/useAtualizacoesDasPlanilhas.ts`, `src/hooks/usePedidoDeAtualizacao.ts`.
- Tela: `src/components/administracao/AreaDasPlanilhas.tsx`, `BarraDasPlanilhas.tsx`, `ListaDeAtualizacoes.tsx`; `AreaDeAdministracao.tsx` (aba nova); `Administracao.css`; `src/App.tsx` e `src/main.tsx` (módulo novo).
- Teste de tela: `src/App.planilhas.test.tsx` (novo); ajuste mecânico em todo teste que renderiza `<App>`.
- Docs: `docs/planilhas-cofre-do-banco.md` (novo); `supabase/AMBIENTES.md`; `.scratch/exportacao-e-manutencao/desvios.md`.

## Tarefas

### Tarefa 1 — Teste de banco que falha (critério 1)

- [ ] Criar `supabase/tests/43_atualizacao_das_planilhas.test.sql` no formato do 42 (tabela `_tap`, usuários inventados a1 a4: Administrador, Integrante, Consulta, Administrador desativado). Roda como dono (postgres) para preparar e como `authenticated`/`anon` para provar. Início, auxiliares e blocos:

```sql
begin;
create extension if not exists pgtap with schema extensions;
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(46);

-- Ficha e hash como o banco calcula; o teste conhece a ficha só das linhas que ele mesmo grava.
create function pg_temp.hash(ficha text) returns text language sql immutable as $$
  select encode(sha256(convert_to(ficha, 'utf8')), 'hex') $$;
create function pg_temp.entrar(id_usuario text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true); end $$;
grant execute on function pg_temp.entrar(text) to authenticated;
create function pg_temp.vazio_o_cofre() returns void language sql as $$
  delete from vault.secrets where name like 'planilhas\_%' $$;
create function pg_temp.configurar_cofre() returns void language plpgsql as $$
begin
  perform pg_temp.vazio_o_cofre();
  perform vault.create_secret('https://funcao.exemplo.test/planilhas', 'planilhas_endereco_da_funcao');
  perform vault.create_secret('senha-interna-de-teste', 'planilhas_senha_interna');
  perform vault.create_secret('id-interna-teste', 'planilhas_id_interna');
  perform vault.create_secret('id-publica-teste', 'planilhas_id_publica');
end $$;
create function pg_temp.tentativas() returns int language sql as $$
  select count(*)::int from public.atualizacoes_das_planilhas $$;
-- (usuários a1 a4 e delete from public.atualizacoes_das_planilhas, iguais ao arranque do teste 42)
```

  Casos (cada um uma linha em `_tap`, com `throws_ok`/`is`/`lives_ok` do pgTAP, texto do que prova na descrição). Numeração = contagem do `plan`:
  - **Cofre vazio, Administrador (a1):** 1 `pedir_atualizacao_das_planilhas()` recusa com `planilhas_nao_configuradas`; 2 `links_das_planilhas()` devolve uma linha com os dois endereços nulos; 3 nenhuma tentativa registrada (lido como dono).
  - **Cofre configurado; perfis sem poder.** Auxiliar `pg_temp.conferir_perfil(id, quem)` repetido para a2 (Integrante), a3 (Consulta) e a4 (desativado), com 3 provas cada (4 a 12): `pedir` recusa com `42501`; `links_das_planilhas()` recusa com `42501`; `select count(*) from public.resultado_das_atualizacoes_das_planilhas` dá 0 (a RLS esconde). Visitante (`anon`), 3 provas (13 a 15): as três chamadas recusam com `42501`.
  - **Administrador pede:** 16 `lives_ok` do pedido; 17 (como dono) a linha tem `origem = 'botao'`, `pedida_por` = a1, sem fim e `ficha_hash ~ '^[0-9a-f]{64}$'`; 18 a view mostra `resultado = 'em_andamento'`; 19 segundo pedido recusa com `atualizacao_em_andamento`; 20 continua 1 tentativa; 21 `private.atualizar_planilhas_automaticamente()` (como dono) não acrescenta tentativa; 22 e 23 `links_das_planilhas()` devolve `https://docs.google.com/spreadsheets/d/id-interna-teste/edit` e `.../id-publica-teste/edit`; 24 o Administrador não lê `ficha_hash` (`42501`); 25, 26 e 27 `insert`, `update` e `delete` diretos na tabela recusam com `42501`.
  - **Resultado calculado:** como dono, inserir três linhas `automatica` com ids fixos: sem fim e `iniciada_em = now() - interval '11 minutes'`; concluída (`deu_certo = true`, `concluida_em = now()`); falhou (`deu_certo = false`, `motivo = 'planilha_publica_recusada'`); hashes inventados. 28 a 31: a view dá `sem_resposta`, `concluida`, `falhou` e o motivo `planilha_publica_recusada`.
  - **Resultado (como `anon`):** duas tentativas abertas R1 (ficha `ficha-r1`) e R2 (`ficha-r2`) gravadas como dono com `pg_temp.hash`. 32 ficha errada recusa com `resultado_recusado`; 33 tentativa inexistente recusa; 34 ficha de outra tentativa (id de R1 com `ficha-r2`) recusa; 35 R1 segue sem fim; 36 ficha certa de R1 aceita (`deu_certo = true`); 37 R1 terminou como concluída; 38 repetição recusa; 39 R2 aceita com `deu_certo = false` e motivo `planilha_interna_recusada`; 40 o motivo e o `deu_certo = false` ficaram gravados.
  - **Agendamento:** 41 `cron.job` tem `jobname = 'atualizar-planilhas-dos-dashboards'` com `schedule = '0 9 * * *'`.
  - **Automática (como dono; apagar as tentativas antes):** 42 com o cofre configurado cria 1 tentativa `automatica` com `pedida_por` nulo; 43 chamar de novo não cria outra; 44 com o cofre vazio e sem tentativas não cria nenhuma.
  - **Só as 10 mais recentes (por último):** apagar tudo, inserir 12 linhas `automatica` com `iniciada_em = now() - (n || ' days')::interval`, n de 1 a 12, num `insert ... select` só. 45 sobram 10; 46 a de 12 dias atrás não existe mais.
  - Fim igual ao do 42: `insert into _tap (linha) select * from finish();` e a exceção `RESULTADO DOS TESTES`. Se a contagem de asserções der diferente de 46, ajustar o `plan`.
- [ ] Commit só do teste; `git push -u origin exportacao-e-manutencao-02`; disparar "Testes de banco" na branch: esperado falhar no 43 (a tabela e as funções não existem) e passar nos demais. Anotar o número da execução.

### Tarefa 2 — Migração e tipos (critério 1)

- [ ] `npx supabase migration new atualizacao_das_planilhas`. Conteúdo, nesta ordem (comentário de cabeçalho no estilo das migrações anteriores: o que cria, não destrutiva, o que reaproveita — `private.usuario_ativo()` e `private.perfil_atual()`):

```sql
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
  ficha_hash text not null constraint atualizacoes_ficha_formato check (ficha_hash ~ '^[0-9a-f]{64}$'),
  constraint atualizacoes_fim_completo check ((concluida_em is null) = (deu_certo is null)),
  constraint atualizacoes_origem_e_autor check ((origem = 'botao') = (pedida_por is not null))
);
alter table public.atualizacoes_das_planilhas enable row level security;
revoke all on public.atualizacoes_das_planilhas from anon, authenticated;
grant select (id, iniciada_em, origem, pedida_por, concluida_em, deu_certo, motivo)
  on public.atualizacoes_das_planilhas to authenticated;

create function private.administrador_ativo() returns boolean
language sql stable set search_path = ''
as $$ select private.usuario_ativo() and coalesce(private.perfil_atual() = 'administrador', false) $$;
revoke execute on function private.administrador_ativo() from public, anon;
grant execute on function private.administrador_ativo() to authenticated;

create policy "atualizacoes_das_planilhas: administrador ativo lê" on public.atualizacoes_das_planilhas
  for select to authenticated using ((select private.administrador_ativo()));

create function private.espera_da_atualizacao() returns interval
language sql immutable set search_path = '' as $$ select interval '10 minutes' $$;
revoke execute on function private.espera_da_atualizacao() from public, anon;
grant execute on function private.espera_da_atualizacao() to authenticated;

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

-- Cofre: só o dono lê. Nenhuma função de tela devolve a senha.
create function private.segredo_das_planilhas(p_nome text) returns text
language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = p_nome $$;
revoke execute on function private.segredo_das_planilhas(text) from public, anon, authenticated;

create function private.links_do_cofre() returns table (planilha_interna text, planilha_publica text)
language sql stable security definer set search_path = ''
as $$
  select case when i is null or p is null then null else 'https://docs.google.com/spreadsheets/d/' || i || '/edit' end,
         case when i is null or p is null then null else 'https://docs.google.com/spreadsheets/d/' || p || '/edit' end
  from (select private.segredo_das_planilhas('planilhas_id_interna') as i,
               private.segredo_das_planilhas('planilhas_id_publica') as p) c $$;
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

-- Núcleo: confere, registra a tentativa e envia o pacote. Ninguém da tela o executa.
create function private.iniciar_atualizacao_das_planilhas(p_origem public.origem_da_atualizacao, p_usuario uuid)
returns uuid language plpgsql security definer set search_path = ''
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
revoke execute on function private.iniciar_atualizacao_das_planilhas(public.origem_da_atualizacao, uuid) from public, anon, authenticated;

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
language sql set search_path = '' as $$ select private.pedir_atualizacao_do_botao() $$;
revoke execute on function public.pedir_atualizacao_das_planilhas() from public, anon;
grant execute on function public.pedir_atualizacao_das_planilhas() to authenticated;

-- O que o pg_cron chama: sem tentativa nova se há uma em andamento ou o cofre está incompleto.
create function private.atualizar_planilhas_automaticamente() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.iniciar_atualizacao_das_planilhas('automatica', null);
exception when others then
  if sqlerrm not in ('atualizacao_em_andamento', 'planilhas_nao_configuradas') then raise; end if;
end $$;
revoke execute on function private.atualizar_planilhas_automaticamente() from public, anon, authenticated;

create function public.registrar_resultado_das_planilhas(p_tentativa uuid, p_ficha text, p_deu_certo boolean, p_motivo text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.atualizacoes_das_planilhas
  set concluida_em = now(), deu_certo = p_deu_certo, motivo = case when p_deu_certo then null else left(p_motivo, 60) end
  where id = p_tentativa and concluida_em is null
    and ficha_hash = encode(sha256(convert_to(p_ficha, 'utf8')), 'hex');
  if not found then raise exception 'resultado_recusado'; end if;
end $$;
revoke execute on function public.registrar_resultado_das_planilhas(uuid, text, boolean, text) from public;
grant execute on function public.registrar_resultado_das_planilhas(uuid, text, boolean, text) to anon, authenticated;

select cron.schedule('atualizar-planilhas-dos-dashboards', '0 9 * * *', $$select private.atualizar_planilhas_automaticamente()$$);
```

- [ ] Se o Postgres do desenvolvimento recusar uma `create extension` (permissão), parar e pedir ao usuário que ligue a extensão em Database → Extensions do painel; não contornar. Registrar no `desvios.md`.
- [ ] Conferir o alvo (vínculo atual e `supabase/.temp/project-ref`, se existir), commit e push. Disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo; depois "Testes de banco": esperado os 44 arquivos verdes, o 43 com os 46 casos. Anotar os números das execuções. Se algum caso falhar por erro do próprio teste, corrigir o teste e dizer isso no `desvios.md`; se falhar por erro da migração, a correção é uma **migração nova** (a anterior já foi ao banco).
- [ ] `npm run db:types` (vínculo conferido) e conferir em `src/types/database.ts`: tabela e view novas, `origem_da_atualizacao` em `Enums`, as funções `pedir_atualizacao_das_planilhas`, `links_das_planilhas` e `registrar_resultado_das_planilhas` em `Functions`. Commit da migração + tipos.

### Tarefa 3 — Tipos, frases e módulo real (critério 5)

- [ ] Criar `src/planilhas/tipos.ts`:

```ts
export type OrigemDaAtualizacao = 'automatica' | 'botao'
export type ResultadoDaAtualizacao = 'em_andamento' | 'sem_resposta' | 'concluida' | 'falhou'

/** Uma tentativa de atualizar as planilhas; `iniciadaEm` é ISO e `motivo` o código curto da falha (só em "falhou"). */
export type AtualizacaoDasPlanilhas = {
  id: string
  iniciadaEm: string
  origem: OrigemDaAtualizacao
  /** Nome de quem pediu pelo botão; null na automática (ou se o usuário não puder ser lido). */
  pedidaPor: string | null
  resultado: ResultadoDaAtualizacao
  motivo: string | null
}

export type LinksDasPlanilhas = { interna: string; publica: string }

/**
 * Único ponto por onde a interface fala com o banco nas planilhas. Recusa do banco chega como TravaDoBanco, com a
 * frase pronta; outra falha, como Error cuja mensagem é o motivo.
 */
export type ModuloDePlanilhas = {
  /** As últimas 10 tentativas, da mais recente para a mais antiga. */
  listarAtualizacoes(): Promise<AtualizacaoDasPlanilhas[]>
  /** Os dois endereços; null quando as planilhas ainda não foram configuradas no ambiente. */
  lerLinks(): Promise<LinksDasPlanilhas | null>
  /** Registra a tentativa e envia o pedido; a tentativa nasce "Em andamento". */
  pedirAtualizacao(): Promise<void>
}
```

- [ ] **Teste primeiro** `src/planilhas/frasesDasPlanilhas.test.ts`, depois `frasesDasPlanilhas.ts`. Comportamentos: `motivoDaFalha('planilha_interna_recusada')` = "O Google recusou a escrita na planilha interna."; `'planilha_publica_recusada'` = "O Google recusou a escrita na planilha pública."; `'google_indisponivel'` = "O Google não respondeu."; `'pacote_invalido'` = "O pedido enviado à atualização estava incompleto."; código desconhecido, `null` ou vazio = "A atualização falhou por um motivo não identificado."; `rotuloDaOrigem('automatica', null)` = "Automática"; `rotuloDaOrigem('botao', 'Ana Teste')` = "Pelo botão · Ana Teste"; `rotuloDaOrigem('botao', null)` = "Pelo botão"; `rotuloDoResultado` devolve "Em andamento", "Sem resposta", "Concluída", "Falhou". Constantes `FRASE_EM_ANDAMENTO = 'Já há uma atualização em andamento.'`, `FRASE_NAO_CONFIGURADA = 'As planilhas ainda não foram configuradas neste ambiente.'`, `FRASE_SEM_PERMISSAO = 'Seu perfil não permite atualizar as planilhas.'`. `frasePedidoRecusado(erro: unknown)`: `TravaDoBanco` → a própria mensagem; outro erro → `Não foi possível pedir a atualização (${mensagem}). Tente de novo.`. Os códigos do 03 (`pacote_invalido` etc.) ficam aqui como tabela pura `const MOTIVOS: Record<string, string>`.
- [ ] **Teste primeiro** `src/planilhas/planilhasSupabase.test.ts` com o `ClienteSupabaseFalso` (padrão de `revisoesSupabase.test.ts`), depois `planilhasSupabase.ts` com `criarPlanilhasSupabase(cliente: ClienteSupabase): ModuloDePlanilhas`. Casos: `listarAtualizacoes` lê `resultado_das_atualizacoes_das_planilhas` (colunas `id, iniciada_em, origem, pedida_por_nome, motivo, resultado`), ordena por `iniciada_em` decrescente, limite 10, e converte as linhas (`pedida_por_nome` → `pedidaPor`); falha de leitura vira `Error` com a mensagem `Falha ao ler as atualizações das planilhas: <motivo do banco>`. `lerLinks` chama `rpc('links_das_planilhas')`: linha com os dois endereços vira `{ interna, publica }`; linha com nulos (ou nenhuma linha) vira `null`; falha vira `Error`. `pedirAtualizacao` chama `rpc('pedir_atualizacao_das_planilhas')`; os erros `atualizacao_em_andamento`, `planilhas_nao_configuradas` e o código `42501` viram `TravaDoBanco` com `FRASE_EM_ANDAMENTO`, `FRASE_NAO_CONFIGURADA` e `FRASE_SEM_PERMISSAO`; qualquer outro vira `Error('erro inesperado do banco (<mensagem>)')`. Rodar cada teste antes do código e ver falhar.

### Tarefa 4 — Módulo falso e o novo prop (critério 5)

- [ ] **Teste primeiro** `src/planilhas/PlanilhasFalso.test.ts`, depois `PlanilhasFalso.ts` (`class PlanilhasFalso implements ModuloDePlanilhas`, construtor `(nomeDoAdministrador = 'Ana Administradora')`). Comportamento: campos públicos `atualizacoes: AtualizacaoDasPlanilhas[]` (mais recente primeiro), `links: LinksDasPlanilhas | null` (padrão: `https://docs.google.com/spreadsheets/d/id-interna-teste/edit` e `.../id-publica-teste/edit`), `falharAoLer`, `segurarLeitura` (a leitura nunca responde), `falharAoPedir: Error | null`, `pedidos` (contador). `listarAtualizacoes` devolve cópias das 10 primeiras; `pedirAtualizacao` conta o pedido, lança `falharAoPedir` se houver, recusa com `TravaDoBanco(FRASE_EM_ANDAMENTO)` se há "em_andamento" e com `TravaDoBanco(FRASE_NAO_CONFIGURADA)` se `links` é null, senão põe no início `{ id: 't<n>', iniciadaEm: agora, origem: 'botao', pedidaPor: nomeDoAdministrador, resultado: 'em_andamento', motivo: null }` e guarda só 10. `terminar(id, resultado, motivo = null)` troca o resultado e o motivo da tentativa. Testes: pedir inclui a tentativa em andamento; segundo pedido recusado; sem links recusado; a 11ª tentativa tira a mais antiga; `terminar` muda o resultado; `falharAoPedir` e `falharAoLer` lançam.
- [ ] `src/App.tsx`: prop `planilhas: ModuloDePlanilhas`, repassada a `AreaDeAdministracao`; `src/main.tsx`: `const planilhas = criarPlanilhasSupabase(supabase)` e `planilhas={planilhas}`.
- [ ] Ajuste mecânico dos testes que renderizam `<App>`: escrever `planilhas-nos-testes.mjs` no scratchpad (fora do projeto) que, para cada `src/**/*.test.tsx` e `src/testes/*` que contenha `<App `, troca `revisoes={X}` dentro do elemento `<App ...>` por `revisoes={X} planilhas={new PlanilhasFalso()}` (regex `/(<App\b[^>]*?revisoes=\{[^{}]+\})/gs` → `$1 planilhas={new PlanilhasFalso()}`) e acrescenta, depois da linha de importação de `RevisoesFalso`, `import { PlanilhasFalso } from '<mesmo prefixo>planilhas/PlanilhasFalso'`. Rodar `npx tsc -b` e corrigir à mão o que sobrar (props com outro nome, helpers que montam o `<App>`). `npm test` verde sem mudar comportamento. Commit separado ("planilhas: prop novo nos testes de tela").

### Tarefa 5 — Aba Planilhas na Administração (critérios 2 a 5 e 7)

- [ ] **Testes de tela primeiro** `src/App.planilhas.test.tsx` (renderiza `<App>` inteiro com `AcessoFalso.logadoComo(administrador)`, `PlanilhasFalso` e as outras falsas; padrão de `App.administracao.test.tsx`; para a releitura, `vi.useFakeTimers({ shouldAdvanceTime: true })` e `await act(() => vi.advanceTimersByTimeAsync(5000))`). Casos:
  - Administrador vê a aba "Planilhas" depois de "Catálogo de etapas"; Integrante e Consulta que chegam por `#/administracao` veem a mensagem de permissão e nenhuma aba (critério 2).
  - Com tentativas inventadas (automática concluída em `2026-10-20T09:00:00Z`, pelo botão "Bruno Teste" falhou com `planilha_publica_recusada`, uma `sem_resposta`): a lista mostra da mais recente para a mais antiga, "Automática", "Pelo botão · Bruno Teste", `20/10/2026 06:00` (Brasília), o resultado em texto e a frase "O Google recusou a escrita na planilha pública."; código desconhecido mostra "A atualização falhou por um motivo não identificado." (critério 2).
  - Sem tentativas: "Nenhuma atualização ainda.".
  - Links: dois links "Planilha interna" e "Planilha pública" com `target="_blank"` e `rel` com `noopener`; com `links = null`: o texto "As planilhas ainda não foram configuradas neste ambiente.", nenhum link e o botão desligado com a explicação (critério 4).
  - Botão: clicar em [Atualizar planilhas agora] mostra a tentativa "Em andamento" e desliga o botão; depois de 5 s com `terminar(id, 'concluida')` a linha muda para "Concluída" e o botão volta; uma tentativa "Sem resposta" deixa o botão ligado; sem tentativa em andamento a tela não relê (o contador de leituras do falso não cresce com o tempo) (critério 3).
  - Recusa: `falharAoPedir = new TravaDoBanco('Já há uma atualização em andamento.')` mostra essa frase num `role="alert"`; erro comum mostra "Não foi possível pedir a atualização (…). Tente de novo." e a lista continua na tela.
  - Estados: "Carregando…" enquanto `segurarLeitura`; `falharAoLer` mostra "Não foi possível carregar as planilhas…" com "Tentar de novo" que, depois de `falharAoLer = false`, mostra a lista.
  Rodar e ver falhar.
- [ ] Hooks (`src/hooks/`, até 40 linhas por função): `useAtualizacoesDasPlanilhas(planilhas)` — `useCarregamento` da lista, devolve `{ estado, tentarDeNovo, recarregar, emAndamento }` e, só enquanto `emAndamento`, relê a cada `INTERVALO_DA_RELEITURA_MS = 5000` com `setInterval` limpo no efeito; `usePedidoDeAtualizacao(planilhas, aoTerminar)` — `{ pedindo, falha, pedir }`: liga `pedindo`, limpa a falha, chama `pedirAtualizacao()`, guarda `frasePedidoRecusado(erro)` na falha, desliga `pedindo` e chama `aoTerminar` (relê a lista também na recusa).
- [ ] Componentes (`src/components/administracao/`): `AreaDasPlanilhas` (seção `administracao` com `<h2>` "Planilhas"; lê a lista e os links; erro de qualquer das duas leituras mostra `ErroAoCarregar alvo="as planilhas"` cujo "Tentar de novo" refaz as duas); `BarraDasPlanilhas` (links em `<ul>` com `<span className="etapa-so-leitor"> (abre em nova aba)</span>`, ou o aviso de não configuração; botão `botao botao-principal` "Atualizar planilhas agora" com `disabled` e `aria-describedby` apontando para a explicação — "O botão fica desligado: as planilhas ainda não foram configuradas neste ambiente." ou "Aguarde: há uma atualização em andamento."; falha de pedido em `<p className="cadastros-falha" role="alert">`); `ListaDeAtualizacoes` (tabela `tabela-cadastros` com colunas Quando, Origem, Resultado, Motivo; `formatarMomento` de `src/acesso/historico.ts` para a data; resultado numa `Pilula` — `em_andamento` informativa, `concluida` aprovado, `falhou` atraso, `sem_resposta` vencendo, sempre com o texto; motivo só em "falhou", senão "—"; vazio: `<p className="cadastros-vazio">Nenhuma atualização ainda.</p>`).
- [ ] `AreaDeAdministracao.tsx`: prop `planilhas`, `Aba` ganha `'planilhas'`, `ABAS` ganha `{ aba: 'planilhas', rotulo: 'Planilhas' }` depois do catálogo, e a troca de aba passa a ser um `switch`/mapa pequeno (a complexidade do arquivo segue ≤ 10). `Administracao.css`: `.planilhas-barra` (flex, `gap: var(--esp-3)`, quebra em linhas), `.planilhas-aviso` (cores `--pendencia-fundo`/`--pendencia-borda`, como o aviso amarelo da Administração) e `.planilhas-links` (lista sem marcadores, em linha). Ver todos os testes da Tarefa 5 passarem; `npm test`, `npx tsc -b` e lint verdes.
- [ ] Commit da tela (hooks, componentes, teste e CSS).

### Tarefa 6 — Verificação visual (critério 7)

- [ ] [visual] Abrir a vitrine local (módulos falsos) no notebook (1366×768) e conferir: a aba segue o estilo de Usuários e do Catálogo; o resultado se distingue pela cor e pelo texto; o botão está no lugar dos botões principais; o estado sem configuração e o "Em andamento". Se a tela não puder ser conferida, registrar como presumido no `desvios.md` e na marca de entrega.

### Tarefa 7 — Roteiro do cofre (critério 6)

- [ ] Escrever `docs/planilhas-cofre-do-banco.md`, no tom de `docs/drive-conta-de-servico.md`: termos (Vault/cofre, SQL Editor, pg_cron, planilha interna e pública, senha interna) explicados numa frase; lista numerada, um passo por linha, com o endereço direto do SQL Editor do projeto de desenvolvimento (`https://supabase.com/dashboard/project/yclkzyoebpsxmgpbcbus/sql/new`). Passos: criar as duas planilhas em branco no Drive compartilhado e copiar o trecho do endereço depois de `/d/` (o identificador); inventar uma senha interna longa e guardá-la só no gerenciador de senhas; rodar no SQL Editor quatro comandos `select vault.create_secret('<valor>', '<nome>');` com os nomes `planilhas_endereco_da_funcao` (valor `https://yclkzyoebpsxmgpbcbus.supabase.co/functions/v1/planilhas-dos-dashboards`), `planilhas_senha_interna`, `planilhas_id_interna` e `planilhas_id_publica` (com marcadores `<…>` no lugar dos valores, nunca valores reais); conferir com `select name from vault.secrets where name like 'planilhas\_%';` (devem aparecer 4 nomes, sem os valores); como trocar um valor depois (`vault.update_secret`); e o aviso de que o segredo novo da função (a mesma senha interna) e o Sheets ligado no Google Cloud são do ticket 03. Nada de segredo real no arquivo.
- [ ] Commit do roteiro.

### Tarefa 8 — Fecho do ticket

- [ ] `npm test`, `npx tsc -b` e lint passando (o pre-commit confere).
- [ ] `supabase/AMBIENTES.md`: linha da migração aplicada (nome, data, "não destrutiva", teste 43 com os números das execuções antes e depois, padrão das linhas anteriores). `.scratch/exportacao-e-manutencao/desvios.md`: entrada datada com a exceção de `public.registrar_resultado_das_planilhas` (`security definer` em `public`, `anon` executa, por que e qual a trava), a decisão da automática silenciosa, qualquer ajuste de teste e o que ficou presumido na Tarefa 6.
- [ ] Marcar os critérios do ticket e fechar pelo passo 4 do `/executar-complexo` (merge na `main`, `git branch -d`, linha `Concluído em`, push da `main` e dos marcos).
- [ ] Itens não testados do `/executar-complexo` que aconteceram → `.scratch/melhorias-protocolo.md`.

## Conferência do plano contra o ticket

- Critério 1: Tarefas 1 e 2 (46 casos; o teste confere o registro e a hash da ficha, não a chegada ao pg_net).
- Critérios 2, 3 e 4: Tarefa 5 (testes de tela). Critério 5: Tarefas 3, 4 e 5. Critério 6: Tarefa 7. Critério 7: Tarefa 6.
- Fora deste ticket (03): pacote com dados, Edge Function, segredo novo da função e escrita no Sheets.
