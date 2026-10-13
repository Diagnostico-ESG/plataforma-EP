# Ticket 01 de processos-etapas — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** juntar num ponto só as peças de acesso ao banco que os módulos de cadastros repetem, sem mudar comportamento.

**Architecture:** `ErroDoBanco` e as duas traduções compartilhadas (`recusaPorPerfil`, `porQueNadaMudou`) ficam em `src/acesso/falhasDeGravacao.ts`, que já é o lugar da `TravaDoBanco` e da tradução de falhas. `ClienteSupabase` passa a ser exportado de `src/lib/supabase.ts`, o ponto único de conexão. As frases de cadastros viram uma constante `RECUSAS_DOS_CADASTROS` em `src/cadastros/cadastroInexistente.ts`, passada como parâmetro.

**Tech Stack:** TypeScript, Vitest, supabase-js.

**Spec:** `.scratch/processos-etapas/spec.md` (Interface, "Terceiro módulo injetado"); requisitos nos critérios do ticket `.scratch/processos-etapas/issues/01-pecas-comuns-de-acesso-ao-banco.md`.

## Global Constraints

- Sem mudança de comportamento: os 732 testes de hoje continuam passando, mesma quantidade (critério 3).
- Texto de cadastros continua "Seu perfil não permite alterar os cadastros." (critério 2).
- Não mexe no banco: sem migração, sem `db:types`.
- Pre-commit: ESLint (funções ≤ 20 linhas, complexidade ≤ 10, arquivo ≤ 300), `tsc -b`, `madge --circular`.

---

### Task 1: Peças compartilhadas com teste

**Files:**
- Modify: `src/acesso/falhasDeGravacao.ts` (exportar `ErroDoBanco`; criar `RecusasDoModulo`, `recusaPorPerfil`, `porQueNadaMudou`)
- Modify: `src/lib/supabase.ts` (exportar `ClienteSupabase`)
- Modify: `src/cadastros/cadastroInexistente.ts` (criar `RECUSAS_DOS_CADASTROS`)
- Test: `src/acesso/falhasDeGravacao.test.ts`

**Interfaces:**
- Produces:
  - `export type ErroDoBanco = { message: string; code?: string }`
  - `export type RecusasDoModulo = { semPermissao: string; registroInexistente: () => Error }`
  - `export function recusaPorPerfil(erro: ErroDoBanco, semPermissao: string): Error`
  - `export function porQueNadaMudou(aindaExiste: boolean, recusas: RecusasDoModulo): Error`
  - `export type ClienteSupabase = SupabaseClient<Database>` (em `src/lib/supabase.ts`)
  - `export const RECUSAS_DOS_CADASTROS: RecusasDoModulo`

- [x] **Step 1: testes que falham** — em `falhasDeGravacao.test.ts`, acrescentar ao import `porQueNadaMudou, recusaPorPerfil` e:

```ts
describe('recusaPorPerfil', () => {
  test('42501 vira TravaDoBanco com a frase do módulo', () => {
    const falha = recusaPorPerfil({ message: 'permission denied', code: '42501' }, 'Seu perfil não permite isto.')
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Seu perfil não permite isto.')
  })

  test('outro código vira erro inesperado com o texto recebido', () => {
    const falha = recusaPorPerfil({ message: 'Failed to fetch' }, 'Seu perfil não permite isto.')
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('erro inesperado do banco (Failed to fetch)')
  })
})

describe('porQueNadaMudou', () => {
  class RegistroSumiu extends Error {}
  const recusas = { semPermissao: 'Seu perfil não permite isto.', registroInexistente: () => new RegistroSumiu('sumiu') }

  test('registro ainda legível: a recusa foi do perfil', () => {
    const falha = porQueNadaMudou(true, recusas)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('Seu perfil não permite isto.')
  })

  test('registro ilegível: ele não existe mais', () => {
    expect(porQueNadaMudou(false, recusas)).toBeInstanceOf(RegistroSumiu)
  })
})
```

- [x] **Step 2: rodar e ver falhar** — `npx vitest run src/acesso/falhasDeGravacao.test.ts`. Esperado: falha por `recusaPorPerfil`/`porQueNadaMudou` não exportados.

- [x] **Step 3: implementar** — em `falhasDeGravacao.ts`, trocar a linha 1 por `export type ErroDoBanco = ...` e acrescentar no fim:

```ts
/** Frases de recusa de um módulo: o que o perfil não pode alterar e o aviso de registro que já não existe. */
export type RecusasDoModulo = { semPermissao: string; registroInexistente: () => Error }

// 42501 é o código do Postgres para falta de privilégio: a permissão do perfil recusou a gravação.
export function recusaPorPerfil(erro: ErroDoBanco, semPermissao: string): Error {
  if (erro.code === '42501') return new TravaDoBanco(semPermissao)
  return new Error(`erro inesperado do banco (${erro.message})`)
}

// A RLS não acusa erro ao filtrar: zero linhas com o registro ainda legível é perfil; ilegível, ele sumiu.
export function porQueNadaMudou(aindaExiste: boolean, recusas: RecusasDoModulo): Error {
  if (aindaExiste) return new TravaDoBanco(recusas.semPermissao)
  return recusas.registroInexistente()
}
```

Em `src/lib/supabase.ts`: importar `type SupabaseClient` e exportar `export type ClienteSupabase = SupabaseClient<Database>`.
Em `cadastroInexistente.ts`: acrescentar

```ts
export const RECUSAS_DOS_CADASTROS: RecusasDoModulo = {
  semPermissao: 'Seu perfil não permite alterar os cadastros.',
  registroInexistente: () => new CadastroInexistente(),
}
```

- [x] **Step 4: rodar e ver passar** — `npx vitest run src/acesso/falhasDeGravacao.test.ts`.

- [x] **Step 5: commit** — `git add` os quatro arquivos; mensagem "Ticket 01 de processos-etapas: peças comuns de recusa do banco".

### Task 2: Módulos passam a usar as peças comuns

**Files:**
- Modify: `src/cadastros/cadastrosSupabase.ts` (tirar `ClienteSupabase`, `ErroDoBanco`, `porQueNadaMudou` local; última linha de `falhaDoSetor` vira `recusaPorPerfil`)
- Modify: `src/cadastros/macroprocessosSupabase.ts` (idem, com `falhaDoMacroprocesso`)
- Modify: `src/cadastros/setoresEnvolvidosSupabase.ts` (tirar tipos e `SEM_PERMISSAO`; `falhaDoVinculo` some, chamadas viram `recusaPorPerfil(erro, RECUSAS_DOS_CADASTROS.semPermissao)`; `conferirPerfil` usa `RECUSAS_DOS_CADASTROS.semPermissao`)
- Modify: `src/cadastros/historicoSupabase.ts`, `src/acesso/acessoSupabase.ts`, `src/acesso/administracaoSupabase.ts` (só o tipo `ClienteSupabase`)

**Interfaces:** consome tudo da Task 1. Nos três `alterar`/`excluir`: `if (!data.length) throw porQueNadaMudou(Boolean(await lerSetor(cliente, id)), RECUSAS_DOS_CADASTROS)` (com `ler` no de macroprocessos).

- [x] **Step 1: trocar** os seis arquivos como acima; `SupabaseClient`/`Database` saem dos imports onde ficarem sem uso.
- [x] **Step 2: conferir** — `grep -rn "type ClienteSupabase\|type ErroDoBanco\|Seu perfil não permite alterar os cadastros" src --include=*.ts | grep -v test` mostra uma declaração de cada e a frase só em `cadastroInexistente.ts`.
- [x] **Step 3: bateria** — `npm test` (esperado: 732 + 4 novos = 736, todos passando), `npm run typecheck`, `npm run lint`, `npm run check:circular`.
- [x] **Step 4: commit** — "Ticket 01 de processos-etapas: módulos usam as peças comuns".

### Task 3: Backlog

**Files:** Modify: `.scratch/backlog.md` (item "Refatoração em cadastros-basicos")

- [x] **Step 1:** acrescentar ao item: "(2) feita no ticket 01 de processos-etapas (2026-10-13); as demais partes seguem." (critério 4).
- [x] **Step 2: commit** — "Backlog: parte (2) da refatoração feita no ticket 01".
