# Ticket 08 de documentos-versoes (A pasta acompanha a renomeação) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** a decisão "nada, renomear, mover" da pasta do setor e da pasta do processo vira uma função pura testada, e `iniciar_envio` passa a usá-la; a prova em desenvolvimento (processo inventado renomeado) fica pronta no roteiro do usuário.

**Architecture:** a conferência e o ajuste da pasta já existem desde o ticket 01 (`acertarPasta` em `supabase/functions/arquivos-no-drive/pastas.ts`, chamada por `garantirPasta` a cada `iniciar_envio` e `sem_alteracao`, achando a pasta pelo identificador guardado em `pastas_no_drive`). O que falta do ticket é a **função pura testada** (critério 1). Este plano a extrai para `_shared/pasta.ts` (mesmo molde de `conferencia.ts`), faz `acertarPasta` obedecê-la e documenta a prova. Nenhum comportamento muda, exceto: a PATCH só leva `name` quando há renomeação (antes levava sempre).

**Tech Stack:** Edge Function Deno (`arquivos-no-drive`), Drive API v3 (`files.update` com `addParents`/`removeParents`), Vitest. **Nenhuma migração, tabela, dependência nova nem mudança de tela.**

**Spec:** `.scratch/documentos-versoes/spec.md` (história 38; seção "Pastas no Drive") · **Ticket:** `issues/08-pasta-acompanha-a-renomeacao.md` (critérios citados como "critério N", na ordem: 1 função pura, 2 processo renomeado, 3 sigla trocada, 4 processo trocado de setor, 5 prova no desenvolvimento).

## Global Constraints

- `.claude/regras/banco.md` lido nesta sessão. Valem (seção "Edge Functions"): a decisão fica em arquivo puro, sem Deno, testado no Vitest; a função nunca apaga pasta; resposta e logs sem dado pessoal. Sem migração, não há teste de banco, `db:types` nem registro novo em `AMBIENTES.md`.
- Publicar a função no desenvolvimento (`npx supabase functions deploy arquivos-no-drive --use-api`, vínculo conferido) e a prova do critério 5 são do usuário; o plano só deixa o roteiro pronto.
- Funções de lógica de 4 a 20 linhas, arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados. Os arquivos Deno não passam pelo `tsc`: `files.update` com `addParents`/`removeParents` na query e `name` no corpo já é o que o código faz hoje.
- **Pré-commit** roda a bateria inteira (cerca de 1 minuto); nunca `--no-verify`. Teste vermelho não fica no disco na hora do commit: escreve-se, vê-se falhar, implementa-se e comita-se junto.
- A branch `documentos-versoes-08` parte de `documentos-versoes-01` (pedido do usuário); a `main` só recebe os tickets 01 a 08 depois da prova do Drive. Marco: `marco/2026-10-16-inicio-ticket-08-documentos-versoes`.

## Decisões do plano

- **Interface:** `decidirAjusteDaPasta(atual: PastaNoDrive, desejado: PastaDesejada): AjusteDaPasta`, com `PastaNoDrive = { nome: string; pais: string[] }`, `PastaDesejada = { nome: string; paiId: string }` e `AjusteDaPasta = { renomearPara: string | null; mover: { paraPai: string; tirarDe: string[] } | null }`. "Nada" é os dois campos `null`.
- **Mover** só quando o pai desejado não está entre os pais atuais; nesse caso `tirarDe` são todos os pais atuais. Pai desejado entre os atuais não gera movimento (no Drive compartilhado a pasta tem um pai só).
- **Subprocesso:** a decisão é a mesma do processo (a pasta dele fica na pasta do setor dele, não na do pai); o teste cobre o subprocesso reclassificado para outro setor.
- **Setor trocado:** `garantirPastaDoProcesso` já garante a pasta do setor novo (criando se faltar) antes de acertar a do processo; critério 4 não pede código novo, só a prova.
- **Critério 5** vira passo manual 6.2 do roteiro (renomear um processo inventado na plataforma, enviar uma versão, olhar o Drive), e não passo do script: o script não renomeia dados.

## Estrutura de arquivos

Criar: `supabase/functions/_shared/pasta.ts` e `pasta.test.ts`.
Modificar: `supabase/functions/arquivos-no-drive/pastas.ts` (`acertarPasta`), `docs/drive-conta-de-servico.md`, `.scratch/documentos-versoes/desvios.md`, `issues/08-pasta-acompanha-a-renomeacao.md`, `.scratch/melhorias-protocolo.md` (se algum item não testado acontecer).

## Tarefas

### Tarefa 0 — Branch e marco

- [x] Árvore limpa, marco `marco/2026-10-16-inicio-ticket-08-documentos-versoes` e branch `documentos-versoes-08` criados a partir de `documentos-versoes-01`. Comitar este plano.

### Tarefa 1 — Decisão pura (critério 1)

**Arquivos:** criar `supabase/functions/_shared/pasta.ts` e `pasta.test.ts`.

- [x] Teste `pasta.test.ts` (vermelho):

```ts
import { describe, expect, it } from 'vitest'
import { decidirAjusteDaPasta } from './pasta.ts'

const SETOR_A = 'pasta-do-setor-a'
const SETOR_B = 'pasta-do-setor-b'

describe('decidirAjusteDaPasta', () => {
  it('nada quando o nome e o lugar já batem', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras', paiId: SETOR_A })
    expect(ajuste).toEqual({ renomearPara: null, mover: null })
  })

  it('renomeia quando o processo foi renomeado', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras diretas', paiId: SETOR_A })
    expect(ajuste).toEqual({ renomearPara: 'Compras diretas', mover: null })
  })

  it('renomeia a pasta do setor quando a sigla mudou', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'DAF', pais: ['raiz'] }, { nome: 'DAFI', paiId: 'raiz' })
    expect(ajuste).toEqual({ renomearPara: 'DAFI', mover: null })
  })

  it('move quando o processo mudou de setor, tirando a pasta do pai antigo', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras', paiId: SETOR_B })
    expect(ajuste).toEqual({ renomearPara: null, mover: { paraPai: SETOR_B, tirarDe: [SETOR_A] } })
  })

  it('renomeia e move quando as duas coisas mudaram', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [SETOR_A] }, { nome: 'Compras diretas', paiId: SETOR_B })
    expect(ajuste).toEqual({ renomearPara: 'Compras diretas', mover: { paraPai: SETOR_B, tirarDe: [SETOR_A] } })
  })

  it('subprocesso reclassificado para outro setor é movido para a pasta do setor novo', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Pregão', pais: [SETOR_A] }, { nome: 'Pregão', paiId: SETOR_B })
    expect(ajuste.mover).toEqual({ paraPai: SETOR_B, tirarDe: [SETOR_A] })
  })

  it('pasta sem pai informado pelo Drive é movida para o pai desejado', () => {
    const ajuste = decidirAjusteDaPasta({ nome: 'Compras', pais: [] }, { nome: 'Compras', paiId: SETOR_A })
    expect(ajuste.mover).toEqual({ paraPai: SETOR_A, tirarDe: [] })
  })
})
```

- [x] Rodar `npx vitest run supabase/functions/_shared/pasta.test.ts`: falha (módulo inexistente).
- [x] `pasta.ts`:

```ts
// Decide o que fazer com uma pasta do Drive para ela acompanhar a sigla, o nome e o setor atuais do banco (ticket 08).
// Pura e sem Deno, testada no Vitest; quem fala com o Drive é pastas.ts.

export interface PastaNoDrive {
  nome: string
  pais: string[]
}

export interface PastaDesejada {
  nome: string
  paiId: string
}

export interface AjusteDaPasta {
  renomearPara: string | null
  mover: { paraPai: string; tirarDe: string[] } | null
}

export function decidirAjusteDaPasta(atual: PastaNoDrive, desejado: PastaDesejada): AjusteDaPasta {
  const renomearPara = atual.nome === desejado.nome ? null : desejado.nome
  const mover = atual.pais.includes(desejado.paiId) ? null : { paraPai: desejado.paiId, tirarDe: atual.pais }
  return { renomearPara, mover }
}
```

- [x] Rodar o arquivo: passa.

### Tarefa 2 — `acertarPasta` obedece a decisão (critérios 2 a 4)

**Arquivos:** modificar `supabase/functions/arquivos-no-drive/pastas.ts`.

- [x] Importar `decidirAjusteDaPasta` de `../_shared/pasta.ts` e trocar o corpo de `acertarPasta` por:

```ts
async function acertarPasta(token: string, driveId: string, nome: string, paiId: string): Promise<void> {
  const atual = await lerJsonDoDrive<{ name: string; parents?: string[] }>(
    token,
    `${API_DE_ARQUIVOS}/${driveId}?fields=name,parents`,
  )
  const ajuste = decidirAjusteDaPasta({ nome: atual.name, pais: atual.parents ?? [] }, { nome, paiId })
  if (!ajuste.renomearPara && !ajuste.mover) return
  const url = new URL(`${API_DE_ARQUIVOS}/${driveId}`)
  if (ajuste.mover) {
    url.searchParams.set('addParents', ajuste.mover.paraPai)
    if (ajuste.mover.tirarDe.length > 0) url.searchParams.set('removeParents', ajuste.mover.tirarDe.join(','))
  }
  await chamarDrive(token, url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(ajuste.renomearPara ? { name: ajuste.renomearPara } : {}),
  })
}
```

- [x] Conferir à mão contra a documentação do Drive: `files.update` aceita `addParents`/`removeParents` na query e corpo `{}`; `supportsAllDrives=true` já é posto por `chamarDrive`.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`. Commit (segundo plano): "Ticket 08 de documentos-versoes: decisão pura de renomear ou mover a pasta e acertarPasta obedecendo a ela".

### Tarefa 3 — Roteiro da prova, registro e fecho (critério 5)

**Arquivos:** `docs/drive-conta-de-servico.md`, `desvios.md`, `issues/08-...md`.

- [x] Roteiro: acrescentar o passo **6.2** (depois do 6.1): na plataforma, renomear um processo inventado que já tenha pasta no Drive (o da prova); enviar uma nova versão; no **EP – desenvolvimento** conferir que a pasta do processo tem o nome novo, que os arquivos antigos mantêm o nome antigo e que o arquivo novo usa o nome novo; opcional: trocar a sigla do setor (a pasta do setor é renomeada) e mudar o processo de setor (a pasta vai para a pasta do novo setor, criada se faltar). Copiar o que apareceu para a conversa. Pré-requisito: função publicada com este ticket.
- [x] `desvios.md`: entrada datada (2026-10-16) dizendo que o ajuste da pasta já existia desde o ticket 01 e que este ticket só extraiu a decisão pura e a testou; e que o ticket 08 também fica sem `Concluído em` até a prova do Drive (mesma regra dos 01 a 07), se o usuário confirmar.
- [x] Registro de execução no fim do ticket 08 (critérios 1 a 4 feitos e testados na decisão; 5 pendente do usuário). Marcar as caixas dos critérios 1 a 4 só se a decisão pura cobrir (1) e a prova ainda não confirmou 2 a 4: deixá-las abertas com a nota.
- [x] Marcar o plano. `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`. Commit: "Ticket 08 de documentos-versoes: roteiro da prova, desvios, registro do ticket e plano".

## Self-review

- Critério 1 → Tarefa 1; 2, 3 e 4 → Tarefas 2 (comportamento) e 3 (prova); 5 → Tarefa 3 (roteiro do usuário). Sem lacuna de código.
- `decidirAjusteDaPasta`, `AjusteDaPasta`, `PastaNoDrive`, `PastaDesejada` têm os mesmos nomes nas Tarefas 1 e 2.
