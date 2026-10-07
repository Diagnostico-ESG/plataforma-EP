# Ticket 01 (Entrar e sair) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** entrada pelo Google com barreira no banco, primeiro acesso, recusas com mensagem, avatar com menu e Sair.

**Arquitetura:** o banco decide quem entra (gancho "antes de criar usuário" + gatilho de primeiro acesso, em schema `private`) e quem lê o quê (RLS). A interface fala com o Auth e com o banco só pelo `ModuloDeAcesso`, injetado no `App`; nos testes entra o `AcessoFalso`.

**Tecnologia:** Supabase (Postgres, Auth, pgTAP), React 19, Vitest + Testing Library.

**Requisitos:** `.scratch/login-perfis/issues/01-entrar-e-sair.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (seções "Entrada", "Interface", "Modelo de dados", "Configuração"; textos exatos das mensagens estão lá).

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; toda tabela com RLS na mesma migração; função `security definer` só em `private`, com `search_path = ''` e nomes qualificados; execução concedida só a `authenticated` (e ao `supabase_auth_admin` no gancho); políticas com `(select auth.uid())`; interface só com a chave publicável por `src/lib/supabase.ts`; primeiro administrador por SQL com `<meu-email>`, rodado pelo usuário; conferir o alvo (vínculo `yclkzyoebpsxmgpbcbus`, projeto dev) antes de qualquer comando no banco.
- Desvio autorizado (ADR 0001): cadastro aberto **ligado**, cadastro por e-mail desligado.
- Rede atual: só porta 443. `npx supabase db push` e `npm run test:db` provavelmente não conectam; o caminho é o SQL Editor do painel do projeto dev, com o usuário colando o arquivo e relatando o resultado. `npm run db:types` funciona.
- Limites do ESLint: função ≤ 20 linhas (hooks ≤ 40), arquivo ≤ 300, complexidade ≤ 10. Sem `any`.
- Dados de teste inventados, e-mails `@ccivil.pr.gov.br` fictícios. Nenhum e-mail real no código, nos testes ou na conversa.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/tests/02_login_barreira.test.sql` (novo) | gancho e primeiro acesso |
| `supabase/tests/03_login_leitura.test.sql` (novo) | leitura de `usuarios` e `usuarios_emails` por perfil |
| `scripts/relatorio-tap.mjs` + `.test.mjs` (novos) | lê o relatório que os testes novos devolvem numa exceção |
| `scripts/testar-banco.mjs` (alterar) | aceita esse relatório |
| `supabase/migrations/<data>_login_perfis.sql` (novo) | tipo, tabelas, RLS, funções, gancho, gatilho |
| `src/types/database.ts` (gerado) | tipos do banco |
| `src/acesso/tipos.ts` | tipos do acesso e `ModuloDeAcesso` |
| `src/acesso/motivos.ts` + teste | código de recusa → mensagem |
| `src/acesso/perfis.ts` + teste | rótulo de cada perfil |
| `src/acesso/conferirAcesso.ts` | decide o estado da entrada |
| `src/acesso/acessoSupabase.ts` + teste | implementação real |
| `src/acesso/AcessoFalso.ts` | implementação falsa nomeada |
| `src/hooks/useEntrada.ts` | estado da entrada no React |
| `src/components/entrada/TelaDeEntrada.tsx` + `.css` | tela de entrada |
| `src/components/moldura/MenuDaConta.tsx` + `Moldura.css` | avatar e menu |
| `src/components/moldura/BarraSuperior.tsx`, `Moldura.tsx`, `src/App.tsx`, `src/main.tsx` (alterar) | ligação |
| `src/App.test.tsx` (alterar), `src/App.entrada.test.tsx`, `src/App.conta.test.tsx` (novos) | tela inteira |
| `supabase/config.toml` (alterar), `docs/implantacao-login.md` (novo) | configuração e guia |

---

### Tarefa 1: Banco (critérios 1 a 5)

**Produz:** tipo `public.perfil`; tabelas `public.usuarios`, `public.usuarios_emails`, `public.autorizacoes`, `public.eventos`; funções `private.perfil_atual()`, `private.usuario_ativo()`, `private.antes_de_criar_usuario(jsonb)`; recusa no formato de texto `motivo:email` (`fora_do_dominio` ou `sem_autorizacao`).

- [x] **1.1 Relatório dos testes.** O SQL Editor só mostra o último resultado, então os testes novos guardam as linhas do pgTAP numa tabela temporária e terminam com uma exceção que traz todas elas (a exceção também desfaz tudo). Criar `scripts/relatorio-tap.mjs`:

```js
// Os testes de banco novos terminam com uma exceção "RESULTADO DOS TESTES" que traz as linhas do pgTAP,
// porque o SQL Editor do painel só mostra o último resultado (e a exceção desfaz tudo o que o teste criou).
const MARCADOR = 'RESULTADO DOS TESTES'

export function linhasDoRelatorio(mensagem) {
  if (!mensagem.startsWith(MARCADOR)) return null
  return mensagem.slice(MARCADOR.length).split('\n').map((l) => l.trim()).filter(Boolean)
}
```

e `scripts/relatorio-tap.test.mjs`:

```js
import { expect, test } from 'vitest'
import { linhasDoRelatorio } from './relatorio-tap.mjs'

test('extrai as linhas do pgTAP da exceção de relatório', () => {
  expect(linhasDoRelatorio('RESULTADO DOS TESTES\n1..2\nok 1 - a\nnot ok 2 - b')).toEqual(['1..2', 'ok 1 - a', 'not ok 2 - b'])
})

test('outro erro de SQL não é relatório', () => {
  expect(linhasDoRelatorio('relation "public.usuarios" does not exist')).toBeNull()
})
```

Rodar `npx vitest run scripts` → falha (módulo ausente), criar o módulo, rodar → passa. No `catch` de `rodarArquivo` em `scripts/testar-banco.mjs`:

```js
  } catch (erro) {
    const linhas = linhasDoRelatorio(erro.message)
    if (linhas) return { linhas, falhas: linhas.filter(falhou) }
    return { linhas: [], falhas: [`erro de SQL: ${erro.message}`] }
```

- [x] **1.2 Testes de banco que falham.** Criar `supabase/tests/02_login_barreira.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(10);

-- Gancho "antes de criar usuário"
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":"pessoa@gmail.com"}}') -> 'error' ->> 'message',
  'fora_do_dominio:pessoa@gmail.com', 'conta fora do domínio é recusada com o motivo');
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":"sem.autorizacao@ccivil.pr.gov.br"}}') -> 'error' ->> 'message',
  'sem_autorizacao:sem.autorizacao@ccivil.pr.gov.br', 'conta do domínio sem autorização é recusada com o motivo');
insert into public.autorizacoes (email, perfil) values ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into _tap (linha) select is(
  private.antes_de_criar_usuario('{"user":{"email":" Integrante.Teste@CCivil.pr.gov.br "}}'),
  '{}'::jsonb, 'conta autorizada passa, sem diferença de maiúsculas e espaços');
insert into _tap (linha) select ok(
  has_function_privilege('supabase_auth_admin', 'private.antes_de_criar_usuario(jsonb)', 'execute'),
  'o Auth pode chamar o gancho');
insert into _tap (linha) select ok(
  not has_function_privilege('authenticated', 'private.antes_de_criar_usuario(jsonb)', 'execute'),
  'usuário logado não chama o gancho');

-- Primeiro acesso
insert into auth.users (id, email, raw_user_meta_data, aud, role) values (
  '00000000-0000-0000-0000-0000000000b1', 'Integrante.Teste@ccivil.pr.gov.br',
  '{"full_name":"Integrante de Teste","avatar_url":"https://exemplo.invalid/foto.png"}',
  'authenticated', 'authenticated');
insert into _tap (linha) select results_eq(
  $$select nome, foto_url, perfil::text, ativo from public.usuarios where id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('Integrante de Teste', 'https://exemplo.invalid/foto.png', 'integrante_ep', true)$$,
  'primeiro acesso cria o usuário com o perfil da autorização, nome e foto do Google');
insert into _tap (linha) select is(
  (select email from public.usuarios_emails where usuario_id = '00000000-0000-0000-0000-0000000000b1'),
  'integrante.teste@ccivil.pr.gov.br', 'o e-mail do usuário é guardado em minúsculas');
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'integrante.teste@ccivil.pr.gov.br'),
  0, 'a autorização sai no primeiro acesso');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, acao, entidade, entidade_ref from public.eventos
    where entidade_ref = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('00000000-0000-0000-0000-0000000000b1', 'primeiro_acesso', 'usuario', '00000000-0000-0000-0000-0000000000b1')$$,
  'o evento primeiro_acesso tem a própria pessoa como autora');
insert into _tap (linha) select throws_ok(
  $$insert into auth.users (id, email, aud, role)
    values ('00000000-0000-0000-0000-0000000000b9', 'intruso@ccivil.pr.gov.br', 'authenticated', 'authenticated')$$,
  'P0001', 'sem_autorizacao:intruso@ccivil.pr.gov.br',
  'sem o gancho, o gatilho também recusa a conta sem autorização');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Criar `supabase/tests/03_login_leitura.test.sql` com o mesmo cabeçalho e o mesmo fim (`plan(12)`), preparando como `postgres`:

```sql
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'consulta');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';
insert into public.autorizacoes (email) values ('aguardando.teste@ccivil.pr.gov.br');
```

Para cada perfil, entrar assim (trocando o `sub`) e voltar com `reset role;` depois das asserções:

```sql
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
```

O visitante usa `select set_config('request.jwt.claims', '{"role":"anon"}', true); set local role anon;`. As contagens filtram pelos ids de teste (`where id = any('{…a1,…a2,…a3,…a4}'::uuid[])`), porque o banco dev também terá a conta real do usuário. As 12 asserções (tabela "quem pode o quê" da spec):

| # | Quem | Consulta | Esperado |
|---|---|---|---|
| 1-3 | Administrador, Integrante, Consulta | `count(*)` de `usuarios` (ids de teste) | 4 |
| 4 | Inativo | `select id from usuarios` (ids de teste) | só `…a4` (`results_eq`) |
| 5 | Visitante | `count(*)` de `usuarios` | 0 |
| 6 | Administrador | `count(*)` de `usuarios_emails` (ids de teste) | 4 |
| 7-8 | Integrante, Consulta | `select usuario_id from usuarios_emails` | só o próprio (`results_eq`) |
| 9 | Inativo | `count(*)` de `usuarios_emails` | 0 |
| 10 | Visitante | `count(*)` de `usuarios_emails` | 0 |
| 11 | Integrante | `count(*)` de `autorizacoes` | 0 |
| 12 | Integrante | `count(*)` de `eventos` | 0 |

- [x] **1.3 Ver os testes falharem.** Conferir o alvo (`supabase/AMBIENTES.md` "vínculo atual" e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`). Tentar `npm run test:db -- supabase/tests/02_login_barreira.test.sql`; sem conexão, pedir ao usuário que cole o arquivo no SQL Editor do projeto dev. Esperado: erro `relation "public.autorizacoes" does not exist` (ou `schema "private"`).

- [x] **1.4 Migração.** `npx supabase migration new login_perfis` e preencher:

```sql
-- Login e perfis, ticket 01: perfis, usuários, e-mails, autorizações, eventos,
-- funções auxiliares das políticas, barreira antes de criar a conta e primeiro acesso.
-- Barreira: gancho "antes de criar usuário" do Supabase Auth (devolve o motivo à interface);
-- o gatilho de primeiro acesso repete a conferência da autorização, caso o gancho esteja desligado.

create type public.perfil as enum ('administrador', 'integrante_ep', 'consulta');

create table public.usuarios (
  id uuid primary key references auth.users (id),
  nome text not null check (btrim(nome) <> ''),
  foto_url text,
  perfil public.perfil not null,
  ativo boolean not null default true,
  primeiro_acesso_em timestamptz not null default now()
);

create table public.usuarios_emails (
  usuario_id uuid primary key references public.usuarios (id),
  email text not null unique check (email ~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$')
);

create table public.autorizacoes (
  email text primary key check (email ~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$'),
  perfil public.perfil not null default 'consulta',
  criada_em timestamptz not null default now(),
  criada_por uuid references public.usuarios (id)
);

create table public.eventos (
  id bigint generated always as identity primary key,
  ocorrido_em timestamptz not null default now(),
  autor_id uuid references public.usuarios (id),
  acao text not null,
  entidade text not null,
  entidade_ref text not null,
  detalhes jsonb not null
);

alter table public.usuarios enable row level security;
alter table public.usuarios_emails enable row level security;
alter table public.autorizacoes enable row level security;
alter table public.eventos enable row level security;

-- Funções auxiliares: fora da API, lidas pelas políticas sem recursão na RLS.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

create function private.perfil_atual() returns public.perfil
language sql stable security definer set search_path = ''
as $$ select perfil from public.usuarios where id = (select auth.uid()) $$;

create function private.usuario_ativo() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select ativo from public.usuarios where id = (select auth.uid())), false) $$;

revoke execute on function private.perfil_atual(), private.usuario_ativo() from public, anon;
grant execute on function private.perfil_atual(), private.usuario_ativo() to authenticated;

-- Leitura (tabela "quem pode o quê"). Escrita nesta etapa: nenhuma política; só os gatilhos gravam.
create policy "usuarios: ativo lê todos, inativo só a si" on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()) or (select private.usuario_ativo()));

create policy "usuarios_emails: o próprio e o administrador, se ativos" on public.usuarios_emails
  for select to authenticated
  using ((select private.usuario_ativo())
    and (usuario_id = (select auth.uid()) or (select private.perfil_atual()) = 'administrador'));

-- Barreira: o texto "motivo:email" é traduzido em mensagem pela interface (src/acesso/motivos.ts).
create function private.recusa_de_entrada(motivo text, email text) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('error', jsonb_build_object(
  'http_code', 403, 'message', motivo || ':' || coalesce(email, ''))) $$;

create function private.antes_de_criar_usuario(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  email_recebido text := lower(btrim(event -> 'user' ->> 'email'));
begin
  if email_recebido is null or email_recebido !~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$' then
    return private.recusa_de_entrada('fora_do_dominio', email_recebido);
  end if;
  if not exists (select 1 from public.autorizacoes a where a.email = email_recebido) then
    return private.recusa_de_entrada('sem_autorizacao', email_recebido);
  end if;
  return '{}'::jsonb;
end $$;

revoke execute on function private.recusa_de_entrada(text, text), private.antes_de_criar_usuario(jsonb)
  from public, anon, authenticated;
grant execute on function private.antes_de_criar_usuario(jsonb) to supabase_auth_admin;

-- Primeiro acesso: a autorização vira usuário com o mesmo perfil; a própria pessoa é a autora do evento.
create function private.registrar_primeiro_acesso() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  email_novo text := lower(btrim(new.email));
  autorizacao public.autorizacoes;
  nome_novo text;
begin
  delete from public.autorizacoes where email = email_novo returning * into autorizacao;
  if not found then
    raise exception 'sem_autorizacao:%', email_novo using errcode = 'P0001';
  end if;
  insert into public.usuarios (id, nome, foto_url, perfil)
  values (new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
             nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(email_novo, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    autorizacao.perfil)
  returning nome into nome_novo;
  insert into public.usuarios_emails (usuario_id, email) values (new.id, email_novo);
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values (new.id, 'primeiro_acesso', 'usuario', new.id::text, jsonb_build_object(
    'antes', jsonb_build_object('email', email_novo, 'perfil', autorizacao.perfil, 'situacao', 'aguardando'),
    'depois', jsonb_build_object('nome', nome_novo, 'perfil', autorizacao.perfil, 'ativo', true)));
  return new;
end $$;

revoke execute on function private.registrar_primeiro_acesso() from public, anon, authenticated;

create trigger primeiro_acesso after insert on auth.users
  for each row execute function private.registrar_primeiro_acesso();
```

- [x] **1.5 Aplicar no dev.** Conferir o alvo de novo. Tentar `npx supabase db push`; sem conexão, o usuário cola a migração no SQL Editor do projeto dev (registrar em `supabase/AMBIENTES.md` que ela foi aplicada à mão e precisa de `migration repair` antes da produção).

- [x] **1.6 Testes passam.** Rodar (ou colar) `02`, `03`, e `00_rls_ligada` / `01_buckets_privados`. Esperado: só linhas `ok`, nenhuma `not ok`.

- [x] **1.7 Tipos.** `npm run db:types`; conferir que `src/types/database.ts` traz `Enums: { perfil: … }` e as quatro tabelas. `npm run typecheck`.

- [x] **1.8 Commit** (migração, testes de banco, scripts e tipos juntos): `Cria tabelas, barreira e primeiro acesso do login`.

### Tarefa 2: Motivos de recusa e rótulos de perfil (critério 10)

**Consome:** `Database['public']['Enums']['perfil']`.
**Produz:** `src/acesso/tipos.ts` com `Perfil`, `SessaoAtual`, `UsuarioAtual`, `MotivoDeRecusa`, `RecusaDeEntrada`, `EstadoDaEntrada`, `ModuloDeAcesso`; `lerRecusa(texto: string | null): RecusaDeEntrada | null`, `lerRecusaDaUrl(endereco: string): RecusaDeEntrada | null`, `mensagemDaRecusa(recusa: RecusaDeEntrada): string`, `rotuloDoPerfil(perfil: Perfil): string`.

- [x] **2.1 Tipos** em `src/acesso/tipos.ts`:

```ts
import type { Database } from '../types/database'

export type Perfil = Database['public']['Enums']['perfil']
export type SessaoAtual = { usuarioId: string; email: string }
export type UsuarioAtual = { id: string; nome: string; fotoUrl: string | null; perfil: Perfil; ativo: boolean }
export type MotivoDeRecusa = 'fora_do_dominio' | 'sem_autorizacao' | 'inativo'
export type RecusaDeEntrada = { motivo: MotivoDeRecusa; email: string }

export type EstadoDaEntrada =
  | { tipo: 'verificando' }
  | { tipo: 'fora'; recusa: RecusaDeEntrada | null }
  | { tipo: 'falha' }
  | { tipo: 'dentro'; usuario: UsuarioAtual }

/** Único ponto por onde a interface fala com o Auth e com o banco no login. */
export type ModuloDeAcesso = {
  recusaNaChegada(): RecusaDeEntrada | null
  sessaoAtual(): Promise<SessaoAtual | null>
  entrarComGoogle(): Promise<void>
  sair(): Promise<void>
  lerProprioUsuario(id: string): Promise<UsuarioAtual | null>
}
```

- [x] **2.2 Teste que falha** `src/acesso/motivos.test.ts`: `lerRecusa('fora_do_dominio:pessoa@gmail.com')` → `{ motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' }`; texto com prefixo do Auth (`'Error running hook: sem_autorizacao:x@ccivil.pr.gov.br'`) → `sem_autorizacao`; texto desconhecido e `null` → `null`; `lerRecusaDaUrl` com `?error_description=sem_autorizacao%3Ax%40ccivil.pr.gov.br` e com o mesmo no `#` → recusa; URL sem erro → `null`; `mensagemDaRecusa` dos três motivos → os textos exatos da spec. `src/acesso/perfis.test.ts`: os três rótulos `Administrador`, `Integrante do EP`, `Consulta`. `npm test` → falha.

- [x] **2.3 Implementar** `src/acesso/motivos.ts`:

```ts
import type { MotivoDeRecusa, RecusaDeEntrada } from './tipos'

// O banco recusa com "motivo:email" (private.recusa_de_entrada); o Auth pode acrescentar um prefixo ao texto.
const PADRAO_DA_RECUSA = /\b(fora_do_dominio|sem_autorizacao|inativo):(\S*)/

export function lerRecusa(texto: string | null): RecusaDeEntrada | null {
  const achado = texto?.match(PADRAO_DA_RECUSA)
  if (!achado) return null
  return { motivo: achado[1] as MotivoDeRecusa, email: achado[2] }
}

// Depois do Google, o Auth volta com o erro na consulta (?) ou no fragmento (#), conforme o fluxo.
export function lerRecusaDaUrl(endereco: string): RecusaDeEntrada | null {
  const url = new URL(endereco)
  const doFragmento = new URLSearchParams(url.hash.slice(1))
  return lerRecusa(url.searchParams.get('error_description') ?? doFragmento.get('error_description'))
}

export function mensagemDaRecusa({ motivo, email }: RecusaDeEntrada): string {
  if (motivo === 'fora_do_dominio') return `Use sua conta @ccivil.pr.gov.br. A conta ${email} não é institucional.`
  if (motivo === 'sem_autorizacao') return `A conta ${email} ainda não foi autorizada. Peça a um administrador.`
  return 'Seu acesso está inativo. Fale com um administrador.'
}
```

e `src/acesso/perfis.ts`:

```ts
import type { Perfil } from './tipos'

const ROTULO_DO_PERFIL: Record<Perfil, string> = {
  administrador: 'Administrador',
  integrante_ep: 'Integrante do EP',
  consulta: 'Consulta',
}

export function rotuloDoPerfil(perfil: Perfil): string {
  return ROTULO_DO_PERFIL[perfil]
}
```

- [x] **2.4** `npm test` passa. **Commit:** `Traduz os motivos de recusa da entrada e os rótulos de perfil`.

### Tarefa 3: Módulo de acesso (critério 6)

**Consome:** tipos da tarefa 2; `supabase` de `src/lib/supabase.ts` (só no `main.tsx`).
**Produz:** `criarAcessoSupabase(cliente: SupabaseClient<Database>, urlDeChegada: string): ModuloDeAcesso`; `class AcessoFalso implements ModuloDeAcesso` e `USUARIO_DE_TESTE`; `conferirAcesso(acesso: ModuloDeAcesso): Promise<EstadoDaEntrada>`.

- [x] **3.1 Falso nomeado** `src/acesso/AcessoFalso.ts`:

```ts
import type { ModuloDeAcesso, RecusaDeEntrada, SessaoAtual, UsuarioAtual } from './tipos'

export const USUARIO_DE_TESTE: UsuarioAtual = {
  id: 'usuario-de-teste', nome: 'Pessoa de Teste', fotoUrl: null, perfil: 'integrante_ep', ativo: true,
}

/** Implementação falsa do acesso para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class AcessoFalso implements ModuloDeAcesso {
  sessao: SessaoAtual | null = null
  usuarios = new Map<string, UsuarioAtual>()
  recusa: RecusaDeEntrada | null = null
  falharConexao = false
  segurarVerificacao = false
  chamadas = { entrarComGoogle: 0, sair: 0 }

  static logadoComo(usuario: UsuarioAtual = USUARIO_DE_TESTE): AcessoFalso {
    const acesso = new AcessoFalso()
    acesso.sessao = { usuarioId: usuario.id, email: 'pessoa.teste@ccivil.pr.gov.br' }
    acesso.usuarios.set(usuario.id, usuario)
    return acesso
  }

  recusaNaChegada() { return this.recusa }

  async sessaoAtual() {
    if (this.segurarVerificacao) return new Promise<never>(() => {})
    if (this.falharConexao) throw new Error('falha de conexão simulada')
    return this.sessao
  }

  async entrarComGoogle() { this.chamadas.entrarComGoogle++ }

  async sair() {
    this.chamadas.sair++
    this.sessao = null
  }

  async lerProprioUsuario(id: string) { return this.usuarios.get(id) ?? null }
}
```

- [x] **3.2** `src/acesso/conferirAcesso.ts`:

```ts
import type { EstadoDaEntrada, ModuloDeAcesso } from './tipos'

// A RLS já não entrega dados ao inativo; aqui a interface encerra a sessão e explica o motivo.
export async function conferirAcesso(acesso: ModuloDeAcesso): Promise<EstadoDaEntrada> {
  const recusa = acesso.recusaNaChegada()
  const sessao = await acesso.sessaoAtual()
  if (!sessao) return { tipo: 'fora', recusa }
  const usuario = await acesso.lerProprioUsuario(sessao.usuarioId)
  if (usuario?.ativo) return { tipo: 'dentro', usuario }
  await acesso.sair()
  const motivo = usuario ? 'inativo' : 'sem_autorizacao'
  return { tipo: 'fora', recusa: { motivo, email: sessao.email } }
}
```

(coberto pelos testes de tela das tarefas 4 e 5).

- [x] **3.3 Teste que falha** `src/acesso/acessoSupabase.test.ts`, com um `class ClienteSupabaseFalso` nomeado (só `auth.getSession`, `auth.signInWithOAuth`, `auth.signOut` e `from().select().eq().maybeSingle()`), passado com `as unknown as SupabaseClient<Database>`. Casos: sessão com usuário → `{ usuarioId, email }`; sem sessão → `null`; linha de `usuarios` → `UsuarioAtual` com `fotoUrl`; erro do banco → exceção com o id recebido; `entrarComGoogle` pede `provider: 'google'` com `hd: 'ccivil.pr.gov.br'`; `recusaNaChegada` lê a URL de chegada.

- [x] **3.4 Implementar** `src/acesso/acessoSupabase.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { lerRecusaDaUrl } from './motivos'
import type { ModuloDeAcesso, SessaoAtual, UsuarioAtual } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
const DOMINIO_INSTITUCIONAL = 'ccivil.pr.gov.br'

// urlDeChegada é lida no main.tsx antes de o supabase-js tratar o endereço de retorno do Google.
export function criarAcessoSupabase(cliente: ClienteSupabase, urlDeChegada: string): ModuloDeAcesso {
  const recusa = lerRecusaDaUrl(urlDeChegada)
  return {
    recusaNaChegada: () => recusa,
    sessaoAtual: () => lerSessao(cliente),
    entrarComGoogle: () => entrarComGoogle(cliente),
    sair: () => sair(cliente),
    lerProprioUsuario: (id) => lerUsuario(cliente, id),
  }
}

async function lerSessao(cliente: ClienteSupabase): Promise<SessaoAtual | null> {
  const { data, error } = await cliente.auth.getSession()
  if (error) throw new Error(`Falha ao ler a sessão: ${error.message}`)
  const usuario = data.session?.user
  return usuario ? { usuarioId: usuario.id, email: usuario.email ?? '' } : null
}

async function entrarComGoogle(cliente: ClienteSupabase): Promise<void> {
  const { error } = await cliente.auth.signInWithOAuth({
    provider: 'google',
    // hd só sugere a conta institucional na tela do Google; quem barra é o banco.
    options: { redirectTo: window.location.origin, queryParams: { hd: DOMINIO_INSTITUCIONAL, prompt: 'select_account' } },
  })
  if (error) throw new Error(`Falha ao abrir a entrada do Google: ${error.message}`)
}

async function sair(cliente: ClienteSupabase): Promise<void> {
  const { error } = await cliente.auth.signOut()
  if (error) throw new Error(`Falha ao sair: ${error.message}`)
}

async function lerUsuario(cliente: ClienteSupabase, id: string): Promise<UsuarioAtual | null> {
  const { data, error } = await cliente.from('usuarios').select('id, nome, foto_url, perfil, ativo').eq('id', id).maybeSingle()
  if (error) throw new Error(`Falha ao ler o usuário ${id}: ${error.message}`)
  if (!data) return null
  return { id: data.id, nome: data.nome, fotoUrl: data.foto_url, perfil: data.perfil, ativo: data.ativo }
}
```

- [x] **3.5** `npm test` e `npm run typecheck` passam. **Commit:** `Cria o módulo de acesso com implementação real e falsa`.

### Tarefa 4: Tela de entrada (critérios 7, 8 e 11, parte da entrada)

**Consome:** `ModuloDeAcesso`, `conferirAcesso`, `mensagemDaRecusa`, `AcessoFalso`.
**Produz:** `useEntrada(acesso)` → `{ estado, entrar, sair, tentarDeNovo }`; `App` com prop `acesso: ModuloDeAcesso`.

- [x] **4.1 Testes que falham** `src/App.entrada.test.tsx`, renderizando `<App acesso={…} />` com o `AcessoFalso`:
  - sem sessão: botão "Entrar com a conta institucional"; clicar soma 1 em `chamadas.entrarComGoogle`;
  - `segurarVerificacao`: texto "Verificando seu acesso…";
  - `recusa = { motivo: 'fora_do_dominio', email: 'pessoa@gmail.com' }`: mensagem exata da spec com o e-mail;
  - `recusa` sem autorização: mensagem exata;
  - logado com `ativo: false`: mensagem de inativo e `chamadas.sair === 1`;
  - `falharConexao`: mensagem de falha e botão "Tentar de novo"; depois de `falharConexao = false` e clique, aparece o título "Processos".

  Ajustar `src/App.test.tsx`: cada teste usa `AcessoFalso.logadoComo()` e `await screen.findByRole('heading', { name: 'Processos' })` antes das asserções atuais. `npm test` → falha.

- [x] **4.2 Hook** `src/hooks/useEntrada.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { conferirAcesso } from '../acesso/conferirAcesso'
import type { EstadoDaEntrada, ModuloDeAcesso } from '../acesso/tipos'

export function useEntrada(acesso: ModuloDeAcesso) {
  const [estado, setEstado] = useState<EstadoDaEntrada>({ tipo: 'verificando' })

  // Sem setState síncrono: o estado inicial já é "verificando".
  const carregar = useCallback(async () => {
    try {
      setEstado(await conferirAcesso(acesso))
    } catch {
      setEstado({ tipo: 'falha' })
    }
  }, [acesso])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const tentarDeNovo = useCallback(() => {
    setEstado({ tipo: 'verificando' })
    void carregar()
  }, [carregar])

  const entrar = useCallback(() => {
    acesso.entrarComGoogle().catch(() => setEstado({ tipo: 'falha' }))
  }, [acesso])

  const sair = useCallback(async () => {
    await acesso.sair()
    setEstado({ tipo: 'fora', recusa: null })
  }, [acesso])

  return { estado, entrar, sair, tentarDeNovo }
}
```

- [x] **4.3 Tela** `src/components/entrada/TelaDeEntrada.tsx` (estilo em `TelaDeEntrada.css`, só com os tokens de `src/styles/tokens.css` e as classes de `botoes.css`; cartão branco centralizado sobre `--fundo`, marca "EP", mensagem logo abaixo do botão; antes, conferir `.scratch/identidade-visual.md` e `DESIGN.md`):

```tsx
import { mensagemDaRecusa } from '../../acesso/motivos'
import type { EstadoDaEntrada } from '../../acesso/tipos'
import './TelaDeEntrada.css'

type EstadoForaDaPlataforma = Exclude<EstadoDaEntrada, { tipo: 'dentro' }>

type TelaDeEntradaProps = {
  estado: EstadoForaDaPlataforma
  aoEntrar: () => void
  aoTentarDeNovo: () => void
}

export function TelaDeEntrada({ estado, aoEntrar, aoTentarDeNovo }: TelaDeEntradaProps) {
  return (
    <main className="entrada">
      <section className="entrada-cartao" aria-labelledby="entrada-titulo">
        <span className="entrada-marca" aria-hidden="true">EP</span>
        <h1 id="entrada-titulo" className="entrada-titulo">Escritório de Processos</h1>
        <button type="button" className="botao botao-principal" onClick={aoEntrar} disabled={estado.tipo === 'verificando'}>
          Entrar com a conta institucional
        </button>
        <MensagemDaEntrada estado={estado} aoTentarDeNovo={aoTentarDeNovo} />
      </section>
    </main>
  )
}

function MensagemDaEntrada({ estado, aoTentarDeNovo }: Omit<TelaDeEntradaProps, 'aoEntrar'>) {
  if (estado.tipo === 'verificando') return <p className="entrada-mensagem" role="status">Verificando seu acesso…</p>
  if (estado.tipo === 'falha') {
    return (
      <div className="entrada-mensagem entrada-erro" role="alert">
        <p>Não foi possível conectar. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  if (!estado.recusa) return null
  return <p className="entrada-mensagem entrada-erro" role="alert">{mensagemDaRecusa(estado.recusa)}</p>
}
```

- [x] **4.4 Ligação.** `src/App.tsx`:

```tsx
import type { ModuloDeAcesso } from './acesso/tipos'
import { TelaDeEntrada } from './components/entrada/TelaDeEntrada'
import { Moldura } from './components/moldura/Moldura'
import { QuadroVazio } from './components/quadro/QuadroVazio'
import { useEntrada } from './hooks/useEntrada'

type AppProps = { acesso: ModuloDeAcesso }

function App({ acesso }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual="quadro" titulo="Processos" usuario={estado.usuario} aoSair={sair}>
      <QuadroVazio />
    </Moldura>
  )
}

export default App
```

`src/main.tsx`:

```tsx
// Lida antes de o supabase-js tratar o retorno do Google, que pode trazer o motivo da recusa.
const urlDeChegada = window.location.href
const acesso = criarAcessoSupabase(supabase, urlDeChegada)
// …
    <App acesso={acesso} />
```

`Moldura` e `BarraSuperior` passam a receber `usuario: UsuarioAtual` e `aoSair: () => void` (a barra usa na tarefa 5; nesta tarefa só repassa).

- [x] **4.5** `npm test`, `npm run typecheck`, `npm run lint` passam. **Commit:** `Cria a tela de entrada com os estados de verificação, recusa e falha`.

### Tarefa 5: Avatar e menu da conta (critérios 9 e 11, parte da conta)

**Consome:** `UsuarioAtual`, `rotuloDoPerfil`, `Avatar` (tamanho 32).

- [x] **5.1 Testes que falham** `src/App.conta.test.tsx` (app inteiro, `AcessoFalso.logadoComo()`):
  - o botão "Sua conta" sem avatar não existe mais; existe o avatar `img` "Pessoa de Teste" com "PT" dentro do botão da conta;
  - clicar no botão da conta mostra "Pessoa de Teste", "Integrante do EP" e o botão "Sair"; `Escape` fecha;
  - clicar em "Sair" soma 1 em `chamadas.sair` e mostra o botão "Entrar com a conta institucional".

- [x] **5.2 Componente** `src/components/moldura/MenuDaConta.tsx` (padrão de divulgação: botão com `aria-expanded` e `aria-controls`, painel ancorado embaixo à direita; estilo em `Moldura.css`, com `--sombra-flutuante`, `--folha`, `--linha`, `--canto`):

```tsx
import { useId, useState } from 'react'
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { UsuarioAtual } from '../../acesso/tipos'
import { Avatar } from '../Avatar'

type MenuDaContaProps = { usuario: UsuarioAtual; aoSair: () => void }

export function MenuDaConta({ usuario, aoSair }: MenuDaContaProps) {
  const [aberto, setAberto] = useState(false)
  const idDoPainel = useId()
  return (
    <div className="menu-conta" onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}>
      <button type="button" className="menu-conta-botao" aria-label={`Sua conta: ${usuario.nome}`}
        aria-expanded={aberto} aria-controls={idDoPainel} onClick={() => setAberto(!aberto)}>
        <Avatar nome={usuario.nome} fotoUrl={usuario.fotoUrl ?? undefined} tamanho={32} />
      </button>
      {aberto && (
        <div id={idDoPainel} className="menu-conta-painel">
          <p className="menu-conta-nome">{usuario.nome}</p>
          <p className="menu-conta-perfil">{rotuloDoPerfil(usuario.perfil)}</p>
          <button type="button" className="botao botao-secundario" onClick={aoSair}>Sair</button>
        </div>
      )}
    </div>
  )
}
```

Em `BarraSuperior.tsx`, trocar o botão "Sua conta" por `<MenuDaConta usuario={usuario} aoSair={aoSair} />` e apagar o comentário "Sem login ainda…".

- [x] **5.3** `npm test`, `npm run typecheck`, `npm run lint` passam. A conferência visual do avatar fica para a tarefa 7 (sem o Google configurado, a tela real para na entrada). **Commit:** `Mostra o avatar com menu de conta e Sair na barra superior`.

### Tarefa 6: Configuração e guia de implantação (critérios 2 (registro da escolha), 5 e 12)

- [x] **6.1** `supabase/config.toml` (vale para o Supabase local; o remoto se configura no painel): `[auth] enable_signup = true` com comentário citando o ADR 0001; `[auth.email] enable_signup = false` mantido; `site_url = "http://localhost:5173"` e `additional_redirect_urls = ["http://localhost:5173"]`; bloco

```toml
# Barreira de entrada (ADR 0001): recusa conta fora do domínio ou sem autorização.
[auth.hook.before_user_created]
enabled = true
uri = "pg-functions://postgres/private/antes_de_criar_usuario"

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = true
```

- [x] **6.2** `docs/implantacao-login.md`, em linguagem simples e válido para cada ambiente (dev agora, produção depois):
  1. Google Cloud: tela de consentimento com público "Interno" (se a conta da organização permitir; senão "Externo" em teste, só com a própria conta), cliente OAuth "Aplicativo da Web", origem `http://localhost:5173` e URI de retorno `https://<ref>.supabase.co/auth/v1/callback`.
  2. Painel do Supabase, Authentication: provedor Google ligado com o identificador e o segredo colados ali (nunca na conversa nem no git); provedor E-mail desligado; "Allow new users to sign up" ligado; URL Configuration com Site URL e Redirect URL `http://localhost:5173`.
  3. Authentication → Hooks → "Before User Created" → Postgres → `private.antes_de_criar_usuario`. Se o painel não listar o schema `private`, parar e avisar (não mover a função para `public` sem decisão).
  4. SQL Editor, uma vez por ambiente:

```sql
-- Primeiro administrador: troque <meu-email> pelo seu e-mail institucional e rode uma vez.
insert into public.autorizacoes (email, perfil)
values (lower(btrim('<meu-email>')), 'administrador');
```

  5. Registro da escolha: gancho "antes de criar usuário" (com o gatilho de primeiro acesso como segunda barreira), conferido na documentação do Supabase em 2026-10-07.

- [x] **6.3 Commit:** `Documenta a configuração do login pelo Google e o primeiro administrador`.

### Tarefa 7: Passo do usuário e ponta a ponta (critérios 12 e 13)

- [ ] **7.1** Guiar o usuário pelo `docs/implantacao-login.md`, um passo por vez, esperando a confirmação de cada um. Ele mesmo cola segredos e o próprio e-mail no painel.
- [ ] **7.2** Com `npm run dev` (em segundo plano) aberto no navegador interno ou no navegador dele, o usuário faz: primeiro acesso com a própria conta → Quadro com o avatar dele; abrir o menu (nome, "Administrador", Sair); Sair → tela de entrada; entrar com uma conta não autorizada (ex.: pessoal) → mensagem de fora do domínio. Conferir, com o usuário, os critérios `[visual]` da tela de entrada e do avatar.
- [ ] **7.3** Se a recusa chegar sem a mensagem certa (o Auth pode embrulhar o texto do gancho), ajustar `PADRAO_DA_RECUSA` com um teste novo em `motivos.test.ts` que reproduza o texto real (sem e-mail real: trocar pelo fictício).
- [ ] **7.4** Marcar as caixas dos critérios no ticket e comitar: `Conclui o ticket 01 de login-perfis`.
