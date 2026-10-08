# Ticket 04 (Histórico de usuários) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** o administrador vê, em Administração > Usuários, o histórico das mudanças de usuários e autorizações; o banco garante que só o Administrador ativo lê os eventos e que ninguém os grava, altera ou apaga pela API.

**Arquitetura:** a tabela `eventos` já existe e já recebe os eventos pelos gatilhos dos tickets 01 a 03 (RLS ligada, sem política). Uma migração dá leitura só ao Administrador ativo e tira da API qualquer escrita. A interface ganha `listarHistorico` no `ModuloDeAcesso` (real e falso), funções puras que traduzem ação, antes e depois em texto, e uma seção "Histórico de usuários" abaixo da tabela de usuários, que se relê depois de cada gravação.

**Tecnologia:** Supabase (Postgres, pgTAP), React 19, Vitest + Testing Library.

**Requisitos:** `.scratch/login-perfis/issues/04-historico-usuarios.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (histórias 38 a 41; seções "Interface" e "Quem pode o quê", linhas de `eventos`; os textos exatos dos estados estão lá).

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; políticas na mesma migração; políticas com `(select auth.uid())` por meio das funções auxiliares `private.perfil_atual()` e `private.usuario_ativo()` do ticket 01; cada célula de "quem pode o quê" vira teste com cada perfil, um inativo e um visitante; a segurança está na RLS (esconder a seção não protege); interface só pela chave publicável, por `src/lib/supabase.ts`; conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`, projeto dev `yclkzyoebpsxmgpbcbus`) antes de qualquer comando no banco; as três migrações anteriores já estão no dev e não se editam.
- Rede atual: só porta 443. Teste e migração vão pelo SQL Editor do painel do projeto dev, com o usuário colando **um arquivo por vez** e relatando o resultado, com o resultado esperado de cada um dito antes; `npm run db:types` funciona.
- Limites do ESLint: função ≤ 20 linhas em `.ts` (hooks ≤ 40), arquivo ≤ 300, complexidade ≤ 10. Sem `any`.
- Dados de teste inventados, e-mails `@ccivil.pr.gov.br` fictícios. Consulta de conferência no banco real pede só colunas sem dado pessoal.

## Decisões de execução

- **Privilégios de `eventos`:** `revoke all` de `anon` e de `authenticated`, depois `grant select` a `authenticated`. Assim incluir, alterar, apagar e `truncate` dão erro de permissão (42501) para qualquer perfil, inclusive o Administrador; os gatilhos gravam porque são `security definer`. O `truncate` entra no teste porque a RLS não vale para ele.
- **Coluna "Alvo" (sobre quem foi a mudança):** não está escrita no ticket, mas sem ela "Desativou" não responde a uma auditoria. Para `entidade = 'autorizacao'`, o alvo é o e-mail (`entidade_ref`); para `entidade = 'usuario'`, o nome atual do usuário (lido de `usuarios`, que o Administrador lê inteira), ou o próprio id se não achar. Registrar no `desvios.md`.
- **Texto da ação** (função pura `textoDaAcao`): autorizar → "Autorizou o e-mail"; excluir_autorizacao → "Excluiu a autorização"; primeiro_acesso → "Primeiro acesso"; mudar_perfil em autorização → "Mudou o perfil da autorização"; mudar_perfil em usuário → "Mudou o perfil"; desativar → "Desativou"; reativar → "Reativou"; corrigir_nome → "Corrigiu o nome"; ação desconhecida → o próprio código (não esconde evento que uma funcionalidade futura grave).
- **Antes e depois** (função pura `descreverEstado`): cada objeto vira "Rótulo: valor" separados por "; ". Rótulos: email → "E-mail", nome → "Nome", perfil → "Perfil" (valor por `rotuloDoPerfil`), ativo → "Situação" (Ativo/Inativo), situacao → "Situação" ("aguardando" → "Aguardando primeiro acesso"). Objeto nulo → "—".
- **Data e hora:** `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })`, dentro de `<time dateTime>`. Fuso fixo para o teste não depender da máquina.
- **Lista, não tabela:** o histórico é uma `<ol>` (ordem do mais recente ao mais antigo). Uma segunda `<table>` quebraria os testes que buscam "a" tabela de usuários, e a lista ordenada já diz o que é.
- **Ordem** vem do banco: `order('ocorrido_em', desc)` e, no empate, `order('id', desc)`. Sem paginação — ponytail: com até 10 usuários são poucas centenas de eventos por ano; paginar quando a lista pesar.
- **Releitura depois de gravar:** cada gravação bem-sucedida relê usuários e histórico, para o evento novo aparecer.
- **Hook compartilhado:** o carregar/tentar de novo de `useUsuarios` vira `useCarregamento<T>` (segunda repetição real), usado pela lista e pelo histórico.
- **Fora deste ticket:** conferir se `usuarios_emails` e `autorizacoes` também aceitam `truncate` pela API (diagnóstico na tarefa 1; se aceitarem, item no backlog e aviso ao usuário).

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/tests/06_historico.test.sql` (novo) | quem lê e quem grava `eventos` |
| `supabase/migrations/<data>_historico_usuarios.sql` (novo) | privilégios e política de leitura de `eventos` |
| `src/types/database.ts` (gerado) | tipos do banco (sem mudança esperada) |
| `supabase/AMBIENTES.md` (alterar) | migração aplicada à mão |
| `src/acesso/tipos.ts` (alterar) | `EstadoRegistrado`, `EventoDoHistorico`, `listarHistorico` |
| `src/acesso/historico.ts` + teste (novo) | `textoDaAcao`, `descreverEstado`, `formatarMomento`, `AUTOR_DIRETO_NO_BANCO` |
| `src/acesso/administracaoSupabase.ts` + teste (alterar) | `listarHistorico` real |
| `src/acesso/AcessoFalso.ts` (alterar) | `listarHistorico` falso |
| `src/hooks/useCarregamento.ts` (novo), `src/hooks/useUsuarios.ts` (alterar) | carregar / tentar de novo genérico |
| `src/components/administracao/HistoricoDeUsuarios.tsx` (novo) | seção do histórico e seus estados |
| `src/components/administracao/AreaDeUsuarios.tsx` (alterar) | liga o histórico e a releitura |
| `src/components/administracao/Administracao.css` (alterar) | estilo da lista do histórico |
| `src/App.historico.test.tsx` (novo) | tela inteira |

---

### Tarefa 1: Banco (critério 1)

**Produz:** política `"eventos: administrador ativo lê"`; nenhum privilégio de escrita em `eventos` para `anon` e `authenticated`.

- [x] **1.1 Teste que falha.** Criar `supabase/tests/06_historico.test.sql`:

```sql
-- Histórico: só o administrador ativo lê eventos; ninguém grava pela API (login-perfis, ticket 04).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(25);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
-- O inativo é administrador de propósito: a recusa dele só pode vir de estar inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

-- Ninguém grava: as mesmas quatro conferências para cada perfil, inclusive o administrador.
-- O truncate entra porque a RLS não vale para ele; só o privilégio o barra.
create function pg_temp.conferir_que_nao_grava(papel text, id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', case when id_usuario is null then format('{"role":"%s"}', papel)
    else format('{"sub":"%s","role":"%s"}', id_usuario, papel) end, true);
  execute format('set local role %I', papel);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.eventos (acao, entidade, entidade_ref, detalhes) values ('x', 'usuario', 'x', '{}')$sql$,
    '42501', null, quem || ' não inclui evento');
  insert into _tap (linha) select throws_ok(
    $sql$update public.eventos set acao = 'x'$sql$, '42501', null, quem || ' não altera evento');
  insert into _tap (linha) select throws_ok(
    $sql$delete from public.eventos$sql$, '42501', null, quem || ' não apaga evento');
  insert into _tap (linha) select throws_ok(
    $sql$truncate public.eventos$sql$, '42501', null, quem || ' não esvazia o histórico');
  reset role;
end $$;
grant execute on function pg_temp.conferir_que_nao_grava(text, text, text) to anon, authenticated;

-- Quem lê: conta os eventos de primeiro acesso dos quatro usuários inventados.
create function pg_temp.eventos_visiveis(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where acao = 'primeiro_acesso' and entidade_ref like '00000000-0000-0000-0000-0000000000a_';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_visiveis(text) to authenticated;

insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a1'), 4,
  'Administrador lê o histórico');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a2'), 0,
  'Integrante não lê o histórico');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a3'), 0,
  'Consulta não lê o histórico');
insert into _tap (linha) select is(pg_temp.eventos_visiveis('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê o histórico');

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.eventos', '42501', null, 'Visitante não lê o histórico');
reset role;

select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a1', 'Administrador');
select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_que_nao_grava('authenticated', '00000000-0000-0000-0000-0000000000a4', 'Inativo');
select pg_temp.conferir_que_nao_grava('anon', null, 'Visitante');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [x] **1.2 Ver falhar.** Conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`). Pedir ao usuário que cole **só** o `06_historico.test.sql` no SQL Editor do projeto dev e devolva o resultado. Esperado: falhas (`not ok`) ao menos em "Administrador lê o histórico", "Visitante não lê", e em "não altera" / "não apaga" (hoje dão 0 linhas sem erro). Se vier tudo `ok`, parar: o teste não prova nada.

- [x] **1.3 Migração.** `npx supabase migration new historico_usuarios` e escrever:

```sql
-- Login e perfis, ticket 04: só o administrador ativo lê o histórico; ninguém grava nele pela API.
-- Os eventos entram pelos gatilhos dos tickets 01 a 03, que são security definer e não dependem destes privilégios.

revoke all on public.eventos from anon, authenticated;
grant select on public.eventos to authenticated;

create policy "eventos: administrador ativo lê" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');
```

- [x] **1.4 Aplicar e ver passar.** Pedir ao usuário, um arquivo por vez: (a) colar a migração (esperado: "Success. No rows returned"); (b) colar `06_historico.test.sql` (esperado: 25 de 25 `ok`); (c) colar `02`, `03`, `04` e `05` de novo (esperado: todos `ok`, porque os gatilhos continuam gravando eventos).
- [ ] **1.5 Diagnóstico do truncate nas outras tabelas** (só leitura, sem dado pessoal). Pedir ao usuário que rode:

```sql
select t as tabela, has_table_privilege('authenticated', 'public.' || t, 'TRUNCATE') as logado,
  has_table_privilege('anon', 'public.' || t, 'TRUNCATE') as visitante
from unnest(array['usuarios', 'usuarios_emails', 'autorizacoes']) as t;
```

Se alguma coluna vier `true`, acrescentar ao `.scratch/backlog.md` (caminho `/demanda`, antes do `/ship` de login-perfis) e avisar o usuário.

- [x] **1.6 Tipos e registro.** `npm run db:types` (esperado: nenhuma diferença em `src/types/database.ts`). Acrescentar em `supabase/AMBIENTES.md`, na lista de migrações aplicadas à mão: `- <data>_historico_usuarios (2026-10-08; testes 06, 02, 03, 04 e 05 passaram pelo SQL Editor)`.
- [x] **1.7 Commit.** `git add supabase/tests/06_historico.test.sql supabase/migrations/*_historico_usuarios.sql supabase/AMBIENTES.md src/types/database.ts` e `git commit -m "Histórico no banco: só o administrador ativo lê, ninguém grava pela API"`.

---

### Tarefa 2: Textos do histórico (critério 3, parte do texto)

**Produz:** em `src/acesso/tipos.ts`:

```ts
/** Antes ou depois de uma mudança, como o gatilho gravou em eventos.detalhes. */
export type EstadoRegistrado = Record<string, string | boolean | null> | null
export type EventoDoHistorico = {
  id: number
  ocorridoEm: string
  autor: string | null
  acao: string
  entidade: string
  alvo: string
  antes: EstadoRegistrado
  depois: EstadoRegistrado
}
```

e em `src/acesso/historico.ts`: `AUTOR_DIRETO_NO_BANCO: string`, `textoDaAcao(acao: string, entidade: string): string`, `descreverEstado(estado: EstadoRegistrado): string`, `formatarMomento(iso: string): string`.

- [x] **2.1 Tipos.** Acrescentar os dois tipos acima a `src/acesso/tipos.ts` (ainda sem `listarHistorico`).
- [x] **2.2 Teste que falha.** Criar `src/acesso/historico.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { descreverEstado, formatarMomento, textoDaAcao } from './historico'

describe('textoDaAcao', () => {
  test.each([
    ['autorizar', 'autorizacao', 'Autorizou o e-mail'],
    ['excluir_autorizacao', 'autorizacao', 'Excluiu a autorização'],
    ['mudar_perfil', 'autorizacao', 'Mudou o perfil da autorização'],
    ['primeiro_acesso', 'usuario', 'Primeiro acesso'],
    ['mudar_perfil', 'usuario', 'Mudou o perfil'],
    ['desativar', 'usuario', 'Desativou'],
    ['reativar', 'usuario', 'Reativou'],
    ['corrigir_nome', 'usuario', 'Corrigiu o nome'],
  ])('%s em %s vira "%s"', (acao, entidade, texto) => {
    expect(textoDaAcao(acao, entidade)).toBe(texto)
  })

  test('ação que a tela não conhece aparece pelo próprio código, sem sumir', () => {
    expect(textoDaAcao('arquivar', 'processo')).toBe('arquivar')
  })
})

describe('descreverEstado', () => {
  test('perfil e situação aparecem com os rótulos da tela', () => {
    expect(descreverEstado({ email: 'nova.teste@ccivil.pr.gov.br', perfil: 'integrante_ep', situacao: 'aguardando' }))
      .toBe('E-mail: nova.teste@ccivil.pr.gov.br; Perfil: Integrante do EP; Situação: Aguardando primeiro acesso')
  })

  test('ativo vira Ativo ou Inativo; nome passa como está', () => {
    expect(descreverEstado({ ativo: false })).toBe('Situação: Inativo')
    expect(descreverEstado({ nome: 'Ana Teste', ativo: true })).toBe('Nome: Ana Teste; Situação: Ativo')
  })

  test('sem estado (antes de autorizar, depois de excluir) vira travessão', () => {
    expect(descreverEstado(null)).toBe('—')
  })
})

test('formatarMomento mostra data e hora de Brasília', () => {
  expect(formatarMomento('2026-10-08T14:05:00Z')).toBe('08/10/2026, 11:05')
})
```

- [x] **2.3 Ver falhar.** `npx vitest run src/acesso/historico.test.ts` → falha ("Failed to resolve import ./historico").
- [x] **2.4 Implementar.** Criar `src/acesso/historico.ts`:

```ts
import { rotuloDoPerfil } from './perfis'
import type { EstadoRegistrado, Perfil } from './tipos'

/** Autor nulo: a mudança foi feita por SQL no painel, como a autorização do primeiro administrador. */
export const AUTOR_DIRETO_NO_BANCO = 'Configuração inicial (direto no banco)'

const TEXTO_DA_ACAO: Record<string, string> = {
  autorizar: 'Autorizou o e-mail',
  excluir_autorizacao: 'Excluiu a autorização',
  primeiro_acesso: 'Primeiro acesso',
  mudar_perfil: 'Mudou o perfil',
  desativar: 'Desativou',
  reativar: 'Reativou',
  corrigir_nome: 'Corrigiu o nome',
}

const ROTULO_DO_CAMPO: Record<string, string> = {
  email: 'E-mail', nome: 'Nome', perfil: 'Perfil', ativo: 'Situação', situacao: 'Situação',
}

// Ação desconhecida (de uma funcionalidade futura) aparece pelo código: some do histórico é pior que texto cru.
export function textoDaAcao(acao: string, entidade: string): string {
  if (acao === 'mudar_perfil' && entidade === 'autorizacao') return 'Mudou o perfil da autorização'
  return TEXTO_DA_ACAO[acao] ?? acao
}

export function descreverEstado(estado: EstadoRegistrado): string {
  if (estado === null) return '—'
  return Object.entries(estado)
    .map(([campo, valor]) => `${ROTULO_DO_CAMPO[campo] ?? campo}: ${valorLegivel(campo, valor)}`)
    .join('; ')
}

function valorLegivel(campo: string, valor: string | boolean | null): string {
  if (campo === 'perfil') return rotuloDoPerfil(valor as Perfil)
  if (campo === 'ativo') return valor ? 'Ativo' : 'Inativo'
  if (campo === 'situacao' && valor === 'aguardando') return 'Aguardando primeiro acesso'
  return String(valor ?? '—')
}

const FORMATO_DO_MOMENTO = new Intl.DateTimeFormat('pt-BR',
  { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

export function formatarMomento(iso: string): string {
  return FORMATO_DO_MOMENTO.format(new Date(iso))
}
```

- [x] **2.5 Ver passar.** `npx vitest run src/acesso/historico.test.ts` → todos passam. (Se `formatarMomento` vier com espaço especial do Intl, ajustar o esperado ao texto real e anotar no teste o porquê.)
- [x] **2.6 Commit.** `git add src/acesso/tipos.ts src/acesso/historico.ts src/acesso/historico.test.ts` e `git commit -m "Traduz ação, antes e depois do histórico em texto da tela"`.

---

### Tarefa 3: Módulo de acesso (critério 2)

**Consome:** `EventoDoHistorico`, `EstadoRegistrado` (tarefa 2).
**Produz:** `ModuloDeAcesso.listarHistorico(): Promise<EventoDoHistorico[]>`; no `AcessoFalso`: `historico: EventoDoHistorico[]`, `falharHistorico`, `segurarHistorico`, `chamadas.listarHistorico`.

- [x] **3.1 Teste que falha.** Em `src/acesso/administracaoSupabase.test.ts`: (a) o cliente falso passa a guardar as ordenações — trocar `order: () => consulta` por `order: (coluna: string, opcoes?: { ascending?: boolean }) => (pedido.ordem ??= []).push([coluna, opcoes?.ascending ?? true]) && consulta` e acrescentar `ordem?: [string, boolean][]` ao tipo `Pedido`; (b) acrescentar ao `describe`:

```ts
  test('o histórico vem do mais recente ao mais antigo, com autor, ação e o alvo pelo nome', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['eventos.select'] = { data: [
      { id: 2, ocorrido_em: '2026-10-08T14:05:00Z', acao: 'desativar', entidade: 'usuario', entidade_ref: 'u1',
        detalhes: { antes: { ativo: true }, depois: { ativo: false } }, autor: { nome: 'Ana Teste' } },
      { id: 1, ocorrido_em: '2026-10-07T12:00:00Z', acao: 'autorizar', entidade: 'autorizacao',
        entidade_ref: 'nova.teste@ccivil.pr.gov.br', detalhes: { antes: null, depois: { perfil: 'consulta' } }, autor: null },
    ], error: null }
    cliente.respostas['usuarios.select'] = { data: [{ id: 'u1', nome: 'Beto Teste' }], error: null }
    expect(await criar(cliente).listarHistorico()).toEqual([
      { id: 2, ocorridoEm: '2026-10-08T14:05:00Z', autor: 'Ana Teste', acao: 'desativar', entidade: 'usuario',
        alvo: 'Beto Teste', antes: { ativo: true }, depois: { ativo: false } },
      { id: 1, ocorridoEm: '2026-10-07T12:00:00Z', autor: null, acao: 'autorizar', entidade: 'autorizacao',
        alvo: 'nova.teste@ccivil.pr.gov.br', antes: null, depois: { perfil: 'consulta' } },
    ])
    expect(cliente.pedidos.find((p) => p.tabela === 'eventos')?.ordem)
      .toEqual([['ocorrido_em', false], ['id', false]])
  })

  test('usuário que não está mais na lista aparece pelo id; falha ao ler o histórico vira exceção', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['eventos.select'] = { data: [{ id: 1, ocorrido_em: '2026-10-08T14:05:00Z', acao: 'reativar',
      entidade: 'usuario', entidade_ref: 'u9', detalhes: { antes: null, depois: null }, autor: null }], error: null }
    expect((await criar(cliente).listarHistorico())[0].alvo).toBe('u9')
    cliente.respostas['eventos.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarHistorico()).rejects.toThrow(/histórico.*sem rede/)
  })
```

- [x] **3.2 Ver falhar.** `npx vitest run src/acesso/administracaoSupabase.test.ts` → falha (`listarHistorico` não existe).
- [x] **3.3 Interface do módulo.** Em `src/acesso/tipos.ts`, acrescentar ao `ModuloDeAcesso`: `listarHistorico(): Promise<EventoDoHistorico[]>` e mencionar o histórico no comentário do tipo.
- [x] **3.4 Implementação real.** Em `src/acesso/administracaoSupabase.ts`: acrescentar `'listarHistorico'` ao `Pick` de `FuncoesDeAdministracao`, `listarHistorico: () => listarHistorico(cliente),` no objeto devolvido, e:

```ts
type EventoDoBanco = {
  id: number; ocorrido_em: string; acao: string; entidade: string; entidade_ref: string
  detalhes: { antes: EstadoRegistrado; depois: EstadoRegistrado }; autor: { nome: string } | null
}

// O alvo de um evento de usuário é o id; a tela mostra o nome atual (o administrador lê todos os usuários).
async function listarHistorico(cliente: ClienteSupabase): Promise<EventoDoHistorico[]> {
  const [eventos, usuarios] = await Promise.all([
    cliente.from('eventos').select('id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)')
      .order('ocorrido_em', { ascending: false }).order('id', { ascending: false }),
    cliente.from('usuarios').select('id, nome'),
  ])
  if (eventos.error) throw new Error(`Falha ao ler o histórico: ${eventos.error.message}`)
  const nomes = new Map((usuarios.data ?? []).map(({ id, nome }) => [id, nome]))
  return (eventos.data as unknown as EventoDoBanco[]).map((evento) => ({
    id: evento.id, ocorridoEm: evento.ocorrido_em, autor: evento.autor?.nome ?? null,
    acao: evento.acao, entidade: evento.entidade, antes: evento.detalhes.antes, depois: evento.detalhes.depois,
    alvo: evento.entidade === 'usuario' ? nomes.get(evento.entidade_ref) ?? evento.entidade_ref : evento.entidade_ref,
  }))
}
```

(importar `EstadoRegistrado` e `EventoDoHistorico` de `./tipos`). Se `listarHistorico` passar de 20 linhas ou de 10 caminhos no ESLint, extrair `eventoDoHistorico(evento, nomes)` com nome próprio.
- [x] **3.5 Implementação falsa.** Em `src/acesso/AcessoFalso.ts`: campos `historico: EventoDoHistorico[] = []`, `falharHistorico = false`, `segurarHistorico = false`; `chamadas` ganha `listarHistorico: 0`; e:

```ts
  async listarHistorico(): Promise<EventoDoHistorico[]> {
    this.chamadas.listarHistorico++
    if (this.segurarHistorico) return new Promise<never>(() => {})
    if (this.falharHistorico) throw new Error('falha de conexão simulada')
    return [...this.historico]
  }
```

- [x] **3.6 Ver passar.** `npm test` e `npm run typecheck` → tudo verde.
- [x] **3.7 Commit.** `git commit -am "Acrescenta ao módulo de acesso a leitura do histórico"`.

---

### Tarefa 4: Histórico na tela (critérios 3, 4 e 5)

**Consome:** `listarHistorico`, `AcessoFalso.historico/falharHistorico/segurarHistorico/chamadas.listarHistorico` (tarefa 3); `textoDaAcao`, `descreverEstado`, `formatarMomento`, `AUTOR_DIRETO_NO_BANCO` (tarefa 2).
**Produz:** `useCarregamento<T>(carregar: () => Promise<T>)` → `{ estado: EstadoDoCarregamento<T>, tentarDeNovo, recarregar }`; componente `HistoricoDeUsuarios`.

- [x] **4.1 Teste que falha.** Criar `src/App.historico.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { EventoDoHistorico, Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BETO = 'beto.teste@ccivil.pr.gov.br'
const HISTORICO: EventoDoHistorico[] = [
  { id: 2, ocorridoEm: '2026-10-08T14:05:00Z', autor: 'Ana Teste', acao: 'desativar', entidade: 'usuario',
    alvo: 'Beto Teste', antes: { ativo: true }, depois: { ativo: false } },
  { id: 1, ocorridoEm: '2026-10-07T12:00:00Z', autor: null, acao: 'autorizar', entidade: 'autorizacao',
    alvo: 'nova.teste@ccivil.pr.gov.br', antes: null, depois: { email: 'nova.teste@ccivil.pr.gov.br', perfil: 'consulta' } },
]

function acessoDoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [{ chave: 'u-beto', nome: 'Beto Teste', email: BETO, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' }]
  acesso.historico = [...HISTORICO]
  return acesso
}

function secaoDoHistorico() {
  return within(screen.getByRole('region', { name: 'Histórico de usuários' }))
}

test('o histórico lista, na ordem recebida, data e hora, autor, ação, alvo, antes e depois', async () => {
  render(<App acesso={acessoDoAdministrador()} />)
  const itens = await waitFor(() => secaoDoHistorico().getAllByRole('listitem'))
  expect(itens.map((item) => item.textContent)).toEqual([
    expect.stringMatching(/08\/10\/2026, 11:05.*Ana Teste.*Desativou.*Beto Teste.*Situação: Ativo.*Situação: Inativo/),
    expect.stringMatching(/07\/10\/2026, 09:00.*Configuração inicial \(direto no banco\).*Autorizou o e-mail.*—.*Perfil: Consulta/),
  ])
})

test('histórico vazio mostra "Nenhuma alteração registrada ainda."', async () => {
  const acesso = acessoDoAdministrador()
  acesso.historico = []
  render(<App acesso={acesso} />)
  expect(await screen.findByText('Nenhuma alteração registrada ainda.')).toBeTruthy()
})

test('enquanto carrega, mostra "Carregando histórico…"', async () => {
  const acesso = acessoDoAdministrador()
  acesso.segurarHistorico = true
  render(<App acesso={acesso} />)
  expect(await screen.findByText('Carregando histórico…')).toBeTruthy()
})

test('se o histórico falha, mostra o erro e recupera com Tentar de novo', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharHistorico = true
  render(<App acesso={acesso} />)
  expect(await screen.findByText('Não foi possível carregar o histórico. Verifique a conexão e tente de novo.'))
    .toBeTruthy()
  acesso.falharHistorico = false
  fireEvent.click(secaoDoHistorico().getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText(/Desativou/)).toBeTruthy()
})

test('depois de uma alteração, o histórico é lido de novo', async () => {
  const acesso = acessoDoAdministrador()
  render(<App acesso={acesso} />)
  await screen.findByRole('table', { busy: false })
  await waitFor(() => expect(acesso.chamadas.listarHistorico).toBe(1))
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${BETO}` }))
  await waitFor(() => expect(acesso.chamadas.listarHistorico).toBe(2))
})

test.each<Perfil>(['integrante_ep', 'consulta'])('perfil %s não vê nem pede o histórico', async (perfil) => {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })
  render(<App acesso={acesso} />)
  await screen.findByText(/não permite administrar usuários/)
  expect(screen.queryByRole('region', { name: 'Histórico de usuários' })).toBeNull()
  expect(acesso.chamadas.listarHistorico).toBe(0)
})
```

- [x] **4.2 Ver falhar.** `npx vitest run src/App.historico.test.tsx` → falha (não há região "Histórico de usuários").
- [x] **4.3 Hook compartilhado.** Criar `src/hooks/useCarregamento.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'

export type EstadoDoCarregamento<T> = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; valor: T }

/** Carrega ao montar; "tentar de novo" volta a mostrar o carregando, "recarregar" troca o conteúdo sem piscar. */
export function useCarregamento<T>(carregar: () => Promise<T>) {
  const [estado, setEstado] = useState<EstadoDoCarregamento<T>>({ tipo: 'carregando' })

  // O estado só muda quando a leitura responde (o inicial já é "carregando").
  const recarregar = useCallback(() => {
    carregar().then((valor) => setEstado({ tipo: 'pronto', valor }), () => setEstado({ tipo: 'erro' }))
  }, [carregar])

  useEffect(recarregar, [recarregar])

  const tentarDeNovo = useCallback(() => {
    setEstado({ tipo: 'carregando' })
    recarregar()
  }, [recarregar])

  return { estado, tentarDeNovo, recarregar }
}
```

e reescrever `src/hooks/useUsuarios.ts` sobre ele, mantendo a interface que `ListaDeUsuarios` usa:

```ts
import { useCallback } from 'react'
import type { LinhaDeUsuario, ModuloDeAcesso } from '../acesso/tipos'
import { useCarregamento } from './useCarregamento'

export type EstadoDaLista = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; linhas: LinhaDeUsuario[] }

export function useUsuarios(acesso: ModuloDeAcesso, aposGravar: () => void) {
  const listar = useCallback(() => acesso.listarUsuarios(), [acesso])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const lista: EstadoDaLista = estado.tipo === 'pronto' ? { tipo: 'pronta', linhas: estado.valor } : estado

  // Depois de gravar, relê a lista (quem diz como ela ficou é o banco) e avisa quem mais depende dela.
  // A falha segue para quem chamou.
  const gravar = useCallback(async (alteracao: () => Promise<void>) => {
    await alteracao()
    recarregar()
    aposGravar()
  }, [recarregar, aposGravar])

  return { lista, tentarDeNovo, gravar }
}
```

- [x] **4.4 Rodar a bateria** (`npm test`): os testes de administração, autorizações e gestão continuam passando (só o hook mudou por dentro).
- [x] **4.5 Componente.** Criar `src/components/administracao/HistoricoDeUsuarios.tsx`:

```tsx
import { AUTOR_DIRETO_NO_BANCO, descreverEstado, formatarMomento, textoDaAcao } from '../../acesso/historico'
import type { EventoDoHistorico } from '../../acesso/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'

type HistoricoDeUsuariosProps = { historico: EstadoDoCarregamento<EventoDoHistorico[]>; aoTentarDeNovo: () => void }

export function HistoricoDeUsuarios({ historico, aoTentarDeNovo }: HistoricoDeUsuariosProps) {
  return (
    <section className="historico" aria-labelledby="titulo-historico">
      <h3 id="titulo-historico" className="historico-titulo">Histórico de usuários</h3>
      <ConteudoDoHistorico historico={historico} aoTentarDeNovo={aoTentarDeNovo} />
    </section>
  )
}

function ConteudoDoHistorico({ historico, aoTentarDeNovo }: HistoricoDeUsuariosProps) {
  if (historico.tipo === 'carregando') return <p className="historico-aviso">Carregando histórico…</p>
  if (historico.tipo === 'erro') {
    return (
      <div className="administracao-erro" role="alert">
        <p>Não foi possível carregar o histórico. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  if (historico.valor.length === 0) return <p className="historico-aviso">Nenhuma alteração registrada ainda.</p>
  return <ol className="historico-lista">{historico.valor.map((evento) => <ItemDoHistorico key={evento.id} evento={evento} />)}</ol>
}

function ItemDoHistorico({ evento }: { evento: EventoDoHistorico }) {
  return (
    <li className="historico-item">
      <time dateTime={evento.ocorridoEm}>{formatarMomento(evento.ocorridoEm)}</time>
      <span>{evento.autor ?? AUTOR_DIRETO_NO_BANCO}</span>
      <span><strong>{textoDaAcao(evento.acao, evento.entidade)}</strong> {evento.alvo}</span>
      <span className="historico-mudanca">
        <span>Antes: {descreverEstado(evento.antes)}</span>
        <span>Depois: {descreverEstado(evento.depois)}</span>
      </span>
    </li>
  )
}
```

(O texto de erro segue o padrão da spec: "o mesmo padrão de erro com [Tentar de novo]".)
- [x] **4.6 Ligar na área.** Em `src/components/administracao/AreaDeUsuarios.tsx`:

```tsx
  const listarHistorico = useCallback(() => acesso.listarHistorico(), [acesso])
  const historico = useCarregamento(listarHistorico)
  const { lista, tentarDeNovo, gravar } = useUsuarios(acesso, historico.recarregar)
```

e, depois de `<ListaDeUsuarios … />`, `<HistoricoDeUsuarios historico={historico.estado} aoTentarDeNovo={historico.tentarDeNovo} />` (importar `useCallback`, `useCarregamento` e `HistoricoDeUsuarios`). A área só é montada para o Administrador (`AreaDeAdministracao`), então quem não é administrador não pede o histórico.
- [x] **4.7 Estilo.** Acrescentar a `src/components/administracao/Administracao.css`:

```css
.historico {
  display: grid;
  gap: var(--esp-2);
}

.historico-titulo {
  margin: 0;
  font-size: var(--tam-base);
}

.historico-aviso {
  margin: 0;
  color: var(--texto-2);
}

.historico-lista {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--folha);
  font-size: var(--tam-secundario);
}

.historico-item {
  display: grid;
  grid-template-columns: 9rem 14rem 1fr;
  gap: var(--esp-1) var(--esp-3);
  padding: var(--esp-2) var(--esp-3);
  border-bottom: 1px solid var(--linha);
}

.historico-item time {
  color: var(--texto-2);
  font-variant-numeric: tabular-nums;
}

.historico-mudanca {
  grid-column: 3;
  display: grid;
  color: var(--texto-2);
}
```

- [x] **4.8 Ver passar.** `npm test`, `npm run typecheck`, `npm run lint` e `npm run check:circular` → tudo verde.
- [x] **4.9 Commit.** `git add` dos arquivos da tarefa e `git commit -m "Mostra o histórico de usuários na área Administração"`.

---

### Tarefa 5: Conferência final

- [x] **5.1 Cobertura.** `npx vitest run --coverage --coverage.reporter=text`; informar o percentual e classificar as linhas novas sem cobertura (comportamento real sem teste / ligação com serviço real / reserva). Comportamento real sem teste ganha teste agora (é deste ticket).
- [ ] **5.2 Teste na tela** (servidor na porta 5173; conferir antes quem ocupa a porta). Pedir ao usuário, primeiro, só os passos na tela: (1) entrar como administrador e abrir Administração; (2) ver a seção "Histórico de usuários" com os eventos já gravados (o próprio primeiro acesso, a autorização inicial como "Configuração inicial (direto no banco)", a correção de nome do ticket 03); (3) corrigir o próprio nome de novo e ver o evento novo aparecer no topo; (4) olhar a aparência (alinhamento das colunas, legibilidade de antes e depois). Nenhuma consulta SQL com dado pessoal: o que se confere é a tela.
- [ ] **5.3 Registros.** Entrada datada no `.scratch/login-perfis/desvios.md` (coluna "Alvo" acrescentada; o que mais divergir do plano). Marcar os critérios do ticket 04.
- [ ] **5.4 Commit** dos registros.
