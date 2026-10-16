# Ticket 07 de documentos-versoes (Conferência com o Drive) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** ao abrir a seção Versões, a tela pergunta à função do servidor como está cada arquivo do processo no Drive e marca "Alterado fora da plataforma" ou "Não encontrado no Drive" no arquivo afetado; se a pergunta falhar, a lista aparece normal, sem marcas, com o aviso "Não foi possível conferir os arquivos no Drive.".

**Architecture:** a função `arquivos-no-drive` ganha a ação `conferir` (por processo, só leitura, nada gravado): lê pela RLS os arquivos do processo (`arquivos_da_versao`), pergunta ao Drive o MD5 e a lixeira de cada um e devolve `{ arquivos: { <id do arquivo>: 'ok' | 'alterado' | 'nao_encontrado' } }`. A decisão (quem pode, o que vale como `ok`, `alterado` e `nao_encontrado`) fica num arquivo puro novo, testado no Vitest. O módulo de versões (real e falso) ganha `conferirArquivos`; um hook novo chama o módulo quando a lista chega e a lista mostra a marca (pílula com texto) ao lado do nome do arquivo.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`); Drive API v3 por `fetch` (`files.get` com `fields=id,md5Checksum,trashed`). **Nenhuma migração, nenhuma tabela, nenhuma dependência nova.**

**Spec:** `.scratch/documentos-versoes/spec.md` (histórias 39 e 50; seção "Regras de estado"; ação `conferir`; estado "conferência com o Drive falhou"; critério `[visual]` das marcas) · **Ticket:** `.scratch/documentos-versoes/issues/07-conferencia-com-o-drive.md` (critérios citados como "critério N", na ordem: 1 ação `conferir`, 2 marcas ao abrir, 3 falha com aviso, 4 testes de interface e do módulo real, 5 prova no desenvolvimento).

## Global Constraints

- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui (seção "Edge Functions" e "Arquivos"): a decisão (quem pode, qual entrada vale) fica em arquivo puro, sem Deno, testado no Vitest, inclusive o chamador sem permissão; a função confere o chamador antes de tocar o Drive (já é a ordem de `index.ts`); a entrada é dado de fora e passa por validação; resposta e logs sem dado pessoal (a resposta leva só ids de arquivo e a situação; nada de nome, e-mail ou corpo do Google); a leitura dos arquivos usa o login de quem chamou (a RLS decide o que existe); nenhuma chave secreta do Supabase; nada se apaga, nada se grava (a conferência não escreve no banco nem no Drive).
- **Sem migração e sem teste de banco:** o ticket não mexe em tabela, política, função ou gatilho do banco. Por isso não há `db:types`, nem "Migrar banco de desenvolvimento", nem registro novo em `supabase/AMBIENTES.md`.
- **Quem pode `conferir`:** os três perfis ativos (tabela "quem pode o quê" da spec, linha `baixar`, `conferir`: Administrador, Integrante e Consulta sim; inativo e visitante não).
- **Publicar a função no desenvolvimento** (`npx supabase functions deploy arquivos-no-drive --use-api`, vínculo conferido) **pede a aprovação do usuário** e não é feita pelo plano: a prova do critério 5 (alterar um arquivo à mão no Drive de desenvolvimento) é dele. O plano deixa o passo pronto em `scripts/prova-do-drive.mjs` e no roteiro.
- Nenhuma dependência nova. Funções de lógica de 4 a 20 linhas (hooks até 40), arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados. Os arquivos Deno (`supabase/functions/arquivos-no-drive/*.ts`) não passam pelo `tsc` (desvio do ticket 01): conferir à mão contra a documentação do Drive (`files.get`, parâmetro `fields`).
- **Pré-commit:** cada commit roda a bateria inteira (cerca de 1 minuto): rodar em segundo plano; nunca `--no-verify`. Como a bateria roda sobre a árvore de trabalho, **teste vermelho não pode ficar no disco na hora do commit**: em cada tarefa, escreve-se o teste, roda-se o arquivo para ver falhar (o vermelho), implementa-se e só então se comita teste e código juntos.
- A branch `documentos-versoes-07` parte de `documentos-versoes-01` (pedido do usuário); a `main` só recebe os tickets 01 a 07 depois da prova do Drive. Marco: `marco/2026-10-16-inicio-ticket-07-documentos-versoes`.

## Decisões do plano

- **Resposta de `conferir`:** `{ "arquivos": { "<arquivo_id>": "ok" | "alterado" | "nao_encontrado" } }`, um item por arquivo de qualquer versão do processo (a histórica também: o .bpm está no Drive do mesmo jeito). Processo sem arquivo ou invisível → `{ "arquivos": {} }`.
- **Regra da situação** (`situacaoDoArquivo`): o Drive não acha (404) ou o arquivo está na lixeira (`trashed: true`) → `nao_encontrado`; o MD5 do Drive é o guardado → `ok`; qualquer outro caso (MD5 diferente ou ausente) → `alterado`. A lixeira conta como "não encontrado" porque quem abre a pasta não o vê mais.
- **Falha do Drive não é situação:** qualquer erro do Drive que não seja 404 (indisponível, token) derruba a conferência inteira (erro da função, status 502 etc.) e a tela mostra o aviso; nunca se marca um arquivo como alterado por não ter conseguido perguntar.
- **Leituras em paralelo** (`Promise.all`, uma chamada `files.get` por arquivo). `// ponytail:` registrado no código: sem limite de simultâneas; processos com centenas de arquivos pedem lotes.
- **Reaproveitar:** o `try/catch` que transforma o 404 do Drive em `null` já existe em `registrar.ts` (`lerArquivoNoDrive`). Ele vira `lerNoDriveOuNulo` em `google.ts`, com os campos como parâmetro, e `registrar.ts` e `conferir.ts` usam o mesmo.
- **Quando a tela confere:** uma vez quando a lista de versões chega e uma vez a cada vez que a lista é recarregada (depois de enviar, substituir etc.), para a marca de um arquivo que acabou de ser substituído sumir. O efeito do hook depende da lista; lista vazia não chama a função.
- **Tela:** a marca é a pílula `bloco-da-versao-marca` (a mesma de "Relatório pendente"), com texto, ao lado do nome do arquivo; o aviso é um parágrafo discreto acima da lista (`role="status"`); enquanto a conferência não respondeu, a lista aparece sem marca e sem aviso.
- **Falso (`VersoesFalso`):** `conferencia: Record<string, SituacaoNoDrive>` (por id do arquivo; ausente = `ok`), `falharConferencia: boolean` e `conferidos: string[]` (os ids de processo conferidos, na ordem). A substituição de um arquivo remove a situação programada dele (o banco passa a guardar o MD5 novo).
- **Concluído em:** este ticket segue a regra dos tickets 01 a 06 (a prova do Drive é do usuário); a Tarefa 5 pergunta se a linha `Concluído em` é gravada agora ou depois da prova.

## Estrutura de arquivos

Criar:
- `supabase/functions/_shared/conferencia.ts` (+ `conferencia.test.ts`)
- `supabase/functions/arquivos-no-drive/conferir.ts`
- `src/versoes/situacaoNoDrive.ts` (+ `situacaoNoDrive.test.ts`)
- `src/hooks/useConferenciaNoDrive.ts`
- `src/components/versoes/MarcaNoDrive.tsx`
- `src/App.conferenciaNoDrive.test.tsx`

Modificar: `supabase/functions/_shared/decisao.ts` (ação e perfis), `arquivos-no-drive/google.ts` (`lerNoDriveOuNulo`), `registrar.ts` (usa o auxiliar), `index.ts` (liga a ação e a mensagem de ação desconhecida), `src/versoes/tipos.ts`, `versoesSupabase.ts`, `VersoesFalso.ts` (+ seus testes), `src/components/versoes/SecaoDeVersoes.tsx`, `ListaDeVersoes.tsx`, `Versoes.css`, `scripts/prova-do-drive.mjs`, `docs/drive-conta-de-servico.md`, `.scratch/documentos-versoes/desvios.md`, `issues/07-conferencia-com-o-drive.md`, `.scratch/melhorias-protocolo.md`.

## Tarefas

### Tarefa 0 — Branch e marco

- [x] Conferir que a árvore está limpa e que a branch atual é `documentos-versoes-01`. Criar o marco `marco/2026-10-16-inicio-ticket-07-documentos-versoes` e a branch `documentos-versoes-07` (`git switch -c documentos-versoes-07`). Comitar este plano.

### Tarefa 1 — Decisão pura da conferência (critério 1)

**Arquivos:** criar `supabase/functions/_shared/conferencia.ts` e `conferencia.test.ts`; modificar `_shared/decisao.ts`.

**Interfaces — produz:** `SituacaoNoDrive`; `LidoNoDrive = { md5Checksum?: string; trashed?: boolean }`; `EntradaConferir = { processoId: string }`; `validarConferir(corpo: unknown): Validacao<EntradaConferir>`; `situacaoDoArquivo(hashMd5: string, lido: LidoNoDrive | null): SituacaoNoDrive`. Em `decisao.ts`: `Acao` ganha `'conferir'`, liberada aos três perfis.

- [x] Teste `conferencia.test.ts` (vermelho, antes do código):

```ts
import { describe, expect, it } from 'vitest'
import { situacaoDoArquivo, validarConferir } from './conferencia.ts'
import { conferirChamador, lerAcao } from './decisao.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const GUARDADO = 'a'.repeat(32)
const OUTRO = 'b'.repeat(32)

describe('validarConferir', () => {
  it('lê o processo', () => {
    expect(validarConferir({ acao: 'conferir', processo_id: PROCESSO })).toEqual({ ok: true, valor: { processoId: PROCESSO } })
  })

  it.each([
    ['corpo que não é objeto', null],
    ['sem processo', { acao: 'conferir' }],
    ['processo que não é uuid', { processo_id: 'p1' }],
    ['processo de tipo errado', { processo_id: 5 }],
  ])('recusa %s', (_nome, corpo) => {
    const resultado = validarConferir(corpo)
    expect(!resultado.ok && resultado.recusa.codigo).toBe('entrada_invalida')
  })

  it('a mensagem traz o campo e o tipo recebido, nunca o valor', () => {
    const resultado = validarConferir({ processo_id: 'segredo' })
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('processo_id')
    expect(!resultado.ok && resultado.recusa.mensagem).not.toContain('segredo')
  })
})

describe('situacaoDoArquivo', () => {
  it('ok quando o MD5 do Drive é o guardado', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: GUARDADO })).toBe('ok')
  })
  it('alterado quando o MD5 do Drive é outro', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: OUTRO })).toBe('alterado')
  })
  it('alterado quando o Drive não informa MD5 (o arquivo deixou de ser o binário enviado)', () => {
    expect(situacaoDoArquivo(GUARDADO, {})).toBe('alterado')
  })
  it('nao_encontrado quando o Drive não acha o arquivo', () => {
    expect(situacaoDoArquivo(GUARDADO, null)).toBe('nao_encontrado')
  })
  it('nao_encontrado quando o arquivo está na lixeira, mesmo com o MD5 igual', () => {
    expect(situacaoDoArquivo(GUARDADO, { md5Checksum: GUARDADO, trashed: true })).toBe('nao_encontrado')
  })
})

describe('quem pode conferir', () => {
  it('a ação é reconhecida', () => {
    expect(lerAcao({ acao: 'conferir' })).toBe('conferir')
  })
  it.each(['administrador', 'integrante_ep', 'consulta'] as const)('o perfil %s ativo pode', (perfil) => {
    expect(conferirChamador({ perfil, ativo: true }, 'conferir')).toBeNull()
  })
  it('recusa o usuário desativado e o visitante', () => {
    expect(conferirChamador({ perfil: 'administrador', ativo: false }, 'conferir')?.codigo).toBe('usuario_inativo')
    expect(conferirChamador(null, 'conferir')?.codigo).toBe('sem_login')
  })
})
```

- [x] Rodar `npx vitest run supabase/functions/_shared/conferencia.test.ts`: falha (módulo e ação inexistentes). Esse é o vermelho.
- [x] `decisao.ts`: `Acao` ganha `'conferir'`; `PERFIS_POR_ACAO` ganha `conferir: ['administrador', 'integrante_ep', 'consulta']`.
- [x] `conferencia.ts` (cabeçalho no padrão dos arquivos puros: o que decide e que é testado no Vitest):

```ts
// Decisão da ação conferir da função arquivos-no-drive (documentos-versoes, ticket 07). Arquivo puro, testado no Vitest.
// Quem pode está em decisao.ts; aqui: qual entrada vale e como o que o Drive informa vira a situação do arquivo.
import { FORMATO_UUID, eCorpo, falhar, lerTexto, tipoDe, type Validacao } from './decisao.ts'

export type SituacaoNoDrive = 'ok' | 'alterado' | 'nao_encontrado'

/** O que o Drive informa do arquivo (`fields=id,md5Checksum,trashed`). */
export interface LidoNoDrive {
  md5Checksum?: string
  trashed?: boolean
}

export interface EntradaConferir {
  processoId: string
}

export function validarConferir(corpo: unknown): Validacao<EntradaConferir> {
  if (!eCorpo(corpo)) return falhar('entrada_invalida', `corpo: esperado objeto, recebido ${tipoDe(corpo)}`)
  const processoId = lerTexto(corpo, 'processo_id', FORMATO_UUID, 'uuid')
  if (!processoId.ok) return processoId
  return { ok: true, valor: { processoId: processoId.valor } }
}

// Arquivo que o Drive não acha ou que está na lixeira não está mais na pasta para quem a abre. O MD5 ausente
// (o arquivo virou outra coisa, como um documento do Google) não confirma nada: conta como alterado.
export function situacaoDoArquivo(hashMd5: string, lido: LidoNoDrive | null): SituacaoNoDrive {
  if (!lido || lido.trashed === true) return 'nao_encontrado'
  return lido.md5Checksum === hashMd5 ? 'ok' : 'alterado'
}
```

- [x] Rodar o arquivo de teste: passa. `npm run lint` e `npm run typecheck`. Commit (segundo plano): "Ticket 07 de documentos-versoes: decisão pura da conferência com o Drive (entrada, situação do arquivo e perfis)".

### Tarefa 2 — Ação `conferir` na função do servidor (critério 1)

**Arquivos:** criar `supabase/functions/arquivos-no-drive/conferir.ts`; modificar `google.ts`, `registrar.ts`, `index.ts`.

**Interfaces — consome:** `situacaoDoArquivo`, `validarConferir`, `EntradaConferir`, `LidoNoDrive` (Tarefa 1); `ContextoDoDrive`, `API_DE_ARQUIVOS` (`pastas.ts`); `responderJson` (`respostas.ts`). **Produz:** `conferir(contexto: ContextoDoDrive, entrada: EntradaConferir): Promise<Response>`; `lerNoDriveOuNulo<T>(token: string, endereco: string): Promise<T | null>` em `google.ts`.

Os arquivos Deno não rodam no Vitest; o teste desta tarefa é a leitura cuidadosa contra a documentação do Drive e a prova do critério 5. O que decide está testado na Tarefa 1.

- [x] `google.ts`: acrescentar, depois de `lerJsonDoDrive`, o auxiliar tirado de `registrar.ts`:

```ts
// O arquivo que o Drive não acha (404) vira null; qualquer outra falha do Drive segue como erro do Drive.
export async function lerNoDriveOuNulo<T>(token: string, endereco: string): Promise<T | null> {
  try {
    return await lerJsonDoDrive<T>(token, endereco)
  } catch (erro) {
    if (erro instanceof ErroDoDrive && erro.codigo === 'nao_encontrado_no_drive') return null
    throw erro
  }
}
```

  O auxiliar recebe o endereço já montado por quem chama (`API_DE_ARQUIVOS` vive em `pastas.ts`, que importa de `google.ts`; importar de volta criaria dependência circular e o `check:circular` reprova). `registrar.ts` e `conferir.ts` passam `` `${API_DE_ARQUIVOS}/${driveId}?fields=…` ``. Interface: `lerNoDriveOuNulo<T>(token: string, endereco: string): Promise<T | null>`.
- [x] `registrar.ts`: apagar a função local `lerArquivoNoDrive` e usar `lerNoDriveOuNulo<ArquivoNoDrive>(contexto.token, \`${API_DE_ARQUIVOS}/${arquivo.driveId}?fields=id,name,size,md5Checksum,parents\`)` na linha do `Promise.all`. Ajustar os imports (`ErroDoDrive` deixa de ser usado ali; `lerJsonDoDrive` também).
- [x] `conferir.ts`:

```ts
// Ação conferir (ticket 07): para um processo, compara a existência e o MD5 de cada arquivo no Drive com o que o banco
// guarda e devolve a situação de cada um. Não grava nada, no banco nem no Drive. Os arquivos são lidos pela RLS, com o
// login de quem chamou; o que ela não mostra não é conferido.
import { situacaoDoArquivo, type EntradaConferir, type LidoNoDrive } from '../_shared/conferencia.ts'
import { lerNoDriveOuNulo } from './google.ts'
import { API_DE_ARQUIVOS, type ContextoDoDrive } from './pastas.ts'
import { responderJson } from './respostas.ts'

interface ArquivoGuardado {
  id: string
  drive_id: string
  hash_md5: string
}

async function lerArquivosDoProcesso(contexto: ContextoDoDrive, processoId: string): Promise<ArquivoGuardado[]> {
  const { data, error } = await contexto.cliente
    .from('arquivos_da_versao')
    .select('id, drive_id, hash_md5, versoes!inner(processo_id)')
    .eq('versoes.processo_id', processoId)
  if (error) throw new Error(`leitura de arquivos_da_versao falhou (código ${error.code}); esperado: arquivos do processo visíveis`)
  return data as unknown as ArquivoGuardado[]
}

async function situacaoNoDrive(contexto: ContextoDoDrive, arquivo: ArquivoGuardado): Promise<[string, string]> {
  const endereco = `${API_DE_ARQUIVOS}/${arquivo.drive_id}?fields=id,md5Checksum,trashed`
  const lido = await lerNoDriveOuNulo<LidoNoDrive>(contexto.token, endereco)
  return [arquivo.id, situacaoDoArquivo(arquivo.hash_md5, lido)]
}

// ponytail: uma leitura do Drive por arquivo, todas ao mesmo tempo; processo com centenas de arquivos pede lotes.
export async function conferir(contexto: ContextoDoDrive, entrada: EntradaConferir): Promise<Response> {
  const guardados = await lerArquivosDoProcesso(contexto, entrada.processoId)
  const situacoes = await Promise.all(guardados.map((arquivo) => situacaoNoDrive(contexto, arquivo)))
  return responderJson(200, { arquivos: Object.fromEntries(situacoes) })
}
```

- [x] `index.ts`: importar `validarConferir` e `conferir`; em `executar`, antes do bloco de `baixar`, acrescentar o bloco `if (acao === 'conferir')` no mesmo molde dos vizinhos (validar → `responderRecusa` → `conferir({ cliente: chamador.cliente, token: await obterToken(config), config }, entrada.valor)`); a mensagem da ação desconhecida passa a ser `'campo acao: esperado iniciar_envio, baixar, registrar, sem_alteracao ou conferir'`; o comentário do cabeçalho cita o ticket 07. Se `executar` passar de 20 linhas ou da complexidade, extrair as ações de leitura (`baixar`, `conferir`) para uma função `executarLeitura`.
- [x] Conferir à mão: `fields=id,md5Checksum,trashed` é um valor válido de `files.get`; `supportsAllDrives=true` já é posto por `chamarDrive`; a resposta não leva nome nem corpo do Google. `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`. Commit: "Ticket 07 de documentos-versoes: ação conferir da função do servidor e leitura do Drive compartilhada com o registrar".

### Tarefa 3 — Módulo de versões: tipo, real e falso (critério 4, módulo)

**Arquivos:** modificar `src/versoes/tipos.ts`, `versoesSupabase.ts`, `VersoesFalso.ts`, `versoesSupabase.test.ts`, `VersoesFalso.test.ts`; criar `src/versoes/situacaoNoDrive.ts` e `situacaoNoDrive.test.ts`.

**Interfaces — produz:** em `tipos.ts`: `SituacaoNoDrive = 'ok' | 'alterado' | 'nao_encontrado'`, `ConferenciaDosArquivos = Record<string, SituacaoNoDrive>` (por id do arquivo) e o método `conferirArquivos(processoId: string): Promise<ConferenciaDosArquivos>` em `ModuloDeVersoes`. Em `situacaoNoDrive.ts`: `marcaDaSituacao(situacao: SituacaoNoDrive | undefined): string | null` (`ok` e ausente → `null`; `alterado` → "Alterado fora da plataforma"; `nao_encontrado` → "Não encontrado no Drive").

- [x] Testes (vermelho, antes do código):
  - `situacaoNoDrive.test.ts`: `marcaDaSituacao('alterado')` é "Alterado fora da plataforma"; `'nao_encontrado'` é "Não encontrado no Drive"; `'ok'` e `undefined` são `null`.
  - `versoesSupabase.test.ts`: `conferirArquivos('p1')` chama a função uma vez com `{ acao: 'conferir', processo_id: 'p1' }` (`cliente.chamadasDaFuncao`) e devolve o `arquivos` da resposta (`cliente.respostasDaFuncao['funcao.conferir'] = { data: { arquivos: { a1: 'ok', a2: 'alterado' } }, error: null }`); falha da função (`recusa('drive_indisponivel', '', 502)`, o auxiliar que o arquivo já tem) vira rejeição.
  - `VersoesFalso.test.ts`: `conferirArquivos` devolve `ok` para todo arquivo do processo e a situação programada em `conferencia`; registra o processo em `conferidos`; com `falharConferencia = true` rejeita com `falha de conexão simulada`; depois de `substituirArquivo` no arquivo programado como `alterado`, a situação volta a `ok`.
- [x] Rodar os três arquivos: falham. Implementar:
  - `tipos.ts`: os dois tipos e o método em `ModuloDeVersoes`, com o comentário "Como cada arquivo do processo está no Drive agora: o MD5 e a existência são comparados com o que o banco guarda; nada é gravado. Falha de conexão ou do Drive rejeita (a tela mostra o aviso, sem marcas)".
  - `versoesSupabase.ts`: `conferirArquivos: (processoId) => conferirArquivos(cliente, processoId)` na fábrica e
    ```ts
    // Só pergunta: a função compara com o Drive e devolve a situação de cada arquivo; nada é gravado.
    async function conferirArquivos(cliente: ClienteSupabase, processoId: string): Promise<ConferenciaDosArquivos> {
      const { arquivos } = await chamarFuncao<{ arquivos: ConferenciaDosArquivos }>(cliente, { acao: 'conferir', processo_id: processoId })
      return arquivos
    }
    ```
  - `situacaoNoDrive.ts`: a tabela de marcas e `marcaDaSituacao`.
  - `VersoesFalso.ts`: os três campos públicos (`conferencia`, `falharConferencia`, `conferidos`, com comentário no padrão dos vizinhos), o método
    ```ts
    // Como a função conferir: uma situação por arquivo do processo, `ok` quando nada foi programado.
    async conferirArquivos(processoId: string): Promise<ConferenciaDosArquivos> {
      this.conferidos.push(processoId)
      if (this.falharConferencia) throw new Error('falha de conexão simulada')
      const arquivos = (this.versoes[processoId] ?? []).flatMap((versao) => versao.arquivos)
      return Object.fromEntries(arquivos.map((arquivo) => [arquivo.id, this.conferencia[arquivo.id] ?? 'ok']))
    }
    ```
    e, em `guardarTroca`, `delete this.conferencia[atual.id]` (o banco passa a guardar o MD5 novo).
- [x] Rodar os três arquivos: passam. `npm run lint`, `npm run typecheck`, `npm test`. Commit: "Ticket 07 de documentos-versoes: conferirArquivos no módulo de versões (real e falso) e as frases das marcas".

### Tarefa 4 — Tela: conferência ao abrir, marcas e aviso (critérios 2, 3 e 4)

**Arquivos:** criar `src/hooks/useConferenciaNoDrive.ts`, `src/components/versoes/MarcaNoDrive.tsx`, `src/App.conferenciaNoDrive.test.tsx`; modificar `SecaoDeVersoes.tsx`, `ListaDeVersoes.tsx`, `Versoes.css`.

**Interfaces — consome:** `ModuloDeVersoes.conferirArquivos`, `ConferenciaDosArquivos`, `marcaDaSituacao` (Tarefa 3). **Produz:** `useConferenciaNoDrive(modulo, processoId, versoes): { tipo: 'conferindo' } | { tipo: 'falhou' } | { tipo: 'pronta'; situacoes: ConferenciaDosArquivos }`; `MarcaNoDrive({ situacao })`; `ListaDeVersoes` ganha a prop opcional `situacoes?: ConferenciaDosArquivos`.

- [x] Testes de interface (vermelho), com o aplicativo inteiro e a `VersoesFalso`, em `App.conferenciaNoDrive.test.tsx`, no molde de `App.substituirArquivo.test.tsx` (mesmos `beforeEach`/`afterEach` do hash `#/processos/p1`, `secaoDeVersoes()`, `montarNosCadastros`, `versaoDeTeste`, `arquivoDeTeste`). Dados: V4 só com o par (`a4-bpmn`, `a4-png`) e V3 com relatório (`a3-relatorio`). Casos:
  1. **Marcas:** com `falso.conferencia = { 'a4-png': 'alterado', 'a3-relatorio': 'nao_encontrado' }`, o item do `.png` da V4 mostra "Alterado fora da plataforma", o do relatório da V3 mostra "Não encontrado no Drive", e o `.bpmn` da V4 não mostra marca (cada marca dentro do `li` do arquivo: `secao.getByRole('link', { name: <nome> }).closest('li')`, `await within(li).findByText(...)`).
  2. **Uma vez ao abrir:** depois de a lista e as marcas aparecerem, `falso.conferidos` é `['p1']`.
  3. **Consulta também vê as marcas** (`montarNosCadastros({ perfil: 'consulta', ajustarVersoes })`).
  4. **Falha:** com `falso.falharConferencia = true`, a lista aparece normal (os nomes dos arquivos), o aviso "Não foi possível conferir os arquivos no Drive." aparece e nenhuma marca ("Alterado fora da plataforma", "Não encontrado no Drive") existe.
  5. **Tudo certo:** sem programar nada, nenhuma marca e nenhum aviso.
  6. **Lista vazia:** processo sem versões não chama a função (`falso.conferidos` vazio).
- [x] Rodar o arquivo: falha. Implementar:
  - `useConferenciaNoDrive.ts`:
    ```ts
    import { useEffect, useState } from 'react'
    import type { ConferenciaDosArquivos, ModuloDeVersoes, Versao } from '../versoes/tipos'

    export type ConferenciaNoDrive =
      | { tipo: 'conferindo' }
      | { tipo: 'falhou' }
      | { tipo: 'pronta'; situacoes: ConferenciaDosArquivos }

    /**
     * Pergunta ao servidor como cada arquivo está no Drive quando a lista de versões chega (e de novo a cada recarga da lista,
     * para a marca de um arquivo recém-substituído sumir). A conferência nunca impede a lista: se falha, vira "falhou".
     */
    export function useConferenciaNoDrive(modulo: ModuloDeVersoes, processoId: string, versoes: Versao[]): ConferenciaNoDrive {
      const [conferencia, setConferencia] = useState<ConferenciaNoDrive>({ tipo: 'conferindo' })
      useEffect(() => {
        if (versoes.length === 0) return
        let valida = true
        modulo.conferirArquivos(processoId).then(
          (situacoes) => { if (valida) setConferencia({ tipo: 'pronta', situacoes }) },
          () => { if (valida) setConferencia({ tipo: 'falhou' }) },
        )
        return () => { valida = false }
      }, [modulo, processoId, versoes])
      return conferencia
    }
    ```
  - `MarcaNoDrive.tsx`: `({ situacao }: { situacao: SituacaoNoDrive | undefined })` devolve `null` sem marca, ou `<span className="bloco-da-versao-marca">{texto}</span>`.
  - `SecaoDeVersoes.tsx` (`VersoesProntas`): `const conferencia = useConferenciaNoDrive(versoes, processo.id, lidas)`; acima da lista, `{conferencia.tipo === 'falhou' && <p className="secao-de-versoes-aviso" role="status">Não foi possível conferir os arquivos no Drive.</p>}`; `ListaDeVersoes` recebe `situacoes={conferencia.tipo === 'pronta' ? conferencia.situacoes : undefined}`.
  - `ListaDeVersoes.tsx`: a prop `situacoes` entra em `ListaDeVersoesProps` (já repassada pelo `...resto`), `BlocoDaVersao` a recebe e põe `<MarcaNoDrive situacao={situacoes?.[arquivo.id]} />` logo depois do `LinkDoArquivo`.
  - `Versoes.css`: `.secao-de-versoes-aviso { margin: 0; color: var(--texto-2); font-size: var(--tam-rotulo); }` (aviso discreto, no padrão de `.bloco-da-versao-origem`); a pílula reaproveita `.bloco-da-versao-marca`, com texto (nunca só cor). Se a marca de "Não encontrado" pedir mais destaque, usar só borda e texto já definidos; nenhuma cor nova.
- [x] Rodar o arquivo: passa. Rodar também `App.substituirArquivo`, `App.enviarVersao`, `App.versoesNoProcesso` (a lista mudou de lugar da marca e o hook roda em todos). `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`. Commit: "Ticket 07 de documentos-versoes: seção Versões confere os arquivos com o Drive, marca alterado e não encontrado e avisa quando a conferência falha".

### Tarefa 5 — Prova do Drive, registros e fecho do ticket

**Arquivos:** modificar `scripts/prova-do-drive.mjs`, `docs/drive-conta-de-servico.md`, `.scratch/documentos-versoes/desvios.md`, `issues/07-conferencia-com-o-drive.md`, `.scratch/melhorias-protocolo.md`.

- [x] `scripts/prova-do-drive.mjs`: passo novo logo depois de `conferirDownload` do integrante e antes de `registrarHistorica`: `conferirNoDrive(config, token, processoId, arquivoId, passo)` chama `{ acao: 'conferir', processo_id }` e relata `ok` quando a resposta é 200 e `arquivos[arquivoId] === 'ok'` (arquivo recém-enviado, intacto), com o texto "situação 'ok' para o arquivo enviado". Passos para os outros perfis: a consulta também confere (200); sem login é `401 sem_login` (mesmo molde de `esperarRecusa`). Se o script passar de 300 linhas, o passo vai num auxiliar já existente ou em arquivo irmão.
- [x] `docs/drive-conta-de-servico.md`: acrescentar ao roteiro do usuário o passo manual do critério 5: depois da prova, abrir o arquivo de teste no Drive de desenvolvimento, **editar ou substituir o conteúdo** (por exemplo, subir um arquivo novo por cima, pelo próprio Drive) e abrir o processo na plataforma: o arquivo deve aparecer com "Alterado fora da plataforma"; mover o arquivo para a lixeira do Drive e reabrir: "Não encontrado no Drive". Antes: publicar a função (`npx supabase functions deploy arquivos-no-drive --use-api`, com o vínculo de desenvolvimento conferido).
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`. Sem migração, não há "Testes de banco" novo a rodar; o último (#88) segue valendo, pois nada de `supabase/migrations/` ou `supabase/tests/` mudou.
- [x] `desvios.md` (entrada "ticket 07", datada): o `try/catch` do 404 foi extraído de `registrar.ts` para `lerNoDriveOuNulo`; a lixeira conta como "não encontrado"; MD5 ausente conta como "alterado"; a conferência roda também a cada recarga da lista; sem migração; o que ficou pendente (publicação da função e prova do critério 5, do usuário). Qualquer outro desvio que apareça na execução.
- [x] Ticket 07: marcar as caixas dos critérios provados (1 a 4); o critério 5 fica aberto, com a nota "prova do Drive pendente (do usuário)"; ressalva do critério `[visual]` das marcas (tela não conferida a olho), como nos tickets anteriores.
- [x] `.scratch/melhorias-protocolo.md`: acrescentar os itens de `.claude/regras/nao-testados.md` do `/executar-complexo` e do bloco "Qualquer momento" que aconteceram nesta execução (data, item, esperado, aconteceu), sem concluir se funcionou.
- [x] Commit dos registros. Juntar à `documentos-versoes-01` (`git switch documentos-versoes-01`; `git merge --ff-only documentos-versoes-07`), apagar a branch com `git branch -d documentos-versoes-07` (se o `-d` recusar, parar e perguntar) e enviar a `documentos-versoes-01` (`git push`, sem `--force`).
- [x] **Perguntar ao usuário**: (1) se grava a linha `Concluído em` do ticket 07 agora ou só depois da prova do Drive (regra dos tickets 01 a 06); (2) se aprova publicar a função no desenvolvimento para a prova do critério 5. Depois, apontar o ticket 08 (ou a prova dos tickets 01 a 03, pendente) e lembrar o `/cost`.
