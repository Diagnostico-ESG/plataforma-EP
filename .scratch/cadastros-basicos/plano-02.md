# Ticket 02 (Setores: abrir, editar, desativar, reativar e excluir): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fechar o ciclo de vida do setor na área Setores: abrir, editar, desativar, reativar e excluir, com "Mostrar inativos" na lista.

**Architecture:** só interface. O banco já tem tudo o que o ticket usa, desde o ticket 01 (`supabase/migrations/20261013123327_setores.sql`): privilégios e políticas de `update` e `delete` por perfil, gatilho que normaliza nome e sigla, eventos `editar`, `desativar`, `reativar` e `excluir`, todos já cobertos por `supabase/tests/11_setores.test.sql`. **Sem migração, sem teste de banco, sem `db:types`.** O módulo de cadastros ganha cinco operações (real e falso). O setor aberto fica em estado da `AreaDeSetores` (o endereço continua só com a área e a aba, como manda a spec).

**Tech Stack:** React + TypeScript, Vitest + Testing Library, cliente Supabase (chave publicável, via `src/lib/supabase.ts`).

**Spec:** `.scratch/cadastros-basicos/spec.md` · **Ticket:** `.scratch/cadastros-basicos/issues/02-setores-editar-desativar-excluir.md` (critérios citados como "critério N", na ordem do ticket).

## Restrições globais

- `.claude/regras/banco.md` lida: nenhuma regra de banco muda neste ticket. Continuam valendo: interface só pela chave publicável (módulo `src/cadastros/`), `npm test` nunca depende do banco ligado (tudo com `CadastrosFalso`), a segurança está na RLS (esconder botão da Consulta é conveniência).
- Limites do ESLint: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; nada de `any`.
- Dados de teste inventados (`AFT`, `CIT`, `EXT`, "Núcleo Fictício de Teste" etc., como no ticket 01).
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Mensagens em vermelho para "a ação não aconteceu" (classe `cadastros-falha` / `cadastros-erro`, ADR 0003).

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Setor inexistente** chega como `CadastroInexistente` (classe nova, a mesma ideia de `TravaDoBanco`); `lerSetor` devolve `null` para o caso de leitura. A tela mostra "Este cadastro não existe mais…" em vermelho (a spec não fixa a cor desse aviso).
- **Gravação que não muda linha nenhuma** (a RLS filtra sem acusar erro, como em `administracaoSupabase.ts`): o módulo real lê o setor de novo. Se não existe, `CadastroInexistente`; se existe, `TravaDoBanco('Seu perfil não permite alterar os cadastros.')`.
- **Salvar** e **Excluir** voltam à lista (como o cadastro do ticket 01); **Desativar** e **Reativar** ficam no setor aberto, com o botão trocado.
- **"Macroprocessos em que participa"** do setor aberto não entra aqui: o critério não pede e os macroprocessos só existem a partir do ticket 03. O texto da janela de exclusão usa a forma de zero macroprocessos (critério 6); o ticket 04 passa a contar.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `src/components/JanelaDeConfirmacao.tsx` (+ `.test.tsx`, `.css`) (movidos) | prefactor: janela compartilhada |
| `src/components/administracao/Administracao.css` | perde as regras `.janela-confirmacao*` |
| `vite.config.ts` | `JanelaDeConfirmacao` entra no filtro de CSS do Vitest |
| `src/cadastros/cadastroInexistente.ts` (novo) | `CadastroInexistente` e o texto do aviso |
| `src/cadastros/tipos.ts` | `ModuloDeCadastros` ganha 5 operações |
| `src/cadastros/cadastrosSupabase.ts` (+ `.test.ts`) | operações reais |
| `src/cadastros/CadastrosFalso.ts` | operações falsas |
| `src/components/cadastros/ErroAoCarregar.tsx` (novo) | bloco de erro + [Tentar de novo], compartilhado |
| `src/components/cadastros/ListaDeSetores.tsx` | "Mostrar inativos", pílula, linha clicável |
| `src/components/cadastros/AreaDeSetores.tsx` | setor aberto em estado |
| `src/components/cadastros/SetorAberto.tsx` (novo) | carrega o setor; escolhe editável, leitura ou inexistente |
| `src/components/cadastros/SetorEditavel.tsx` (novo) | formulário + ações |
| `src/components/cadastros/AcoesDoSetor.tsx` (novo) | Desativar/Reativar e Excluir com janela |
| `src/components/cadastros/SetorSomenteLeitura.tsx` (novo) | Consulta |
| `src/components/cadastros/SetorInexistente.tsx` (novo) | aviso + [Voltar à lista] |
| `src/components/cadastros/FormularioDeSetor.tsx` | serve também para editar |
| `src/components/cadastros/Cadastros.css` | caixa, linha clicável, ações |
| `src/App.setoresInativos.test.tsx`, `src/App.editarSetor.test.tsx`, `src/App.excluirSetor.test.tsx` (novos) | testes de tela |

---

### Tarefa 1: Prefactor: janela de confirmação compartilhada (critério 1)

**Files:** mover `src/components/administracao/JanelaDeConfirmacao.tsx` e `.test.tsx` para `src/components/`; criar `src/components/JanelaDeConfirmacao.css`; modificar `Administracao.css`, `LinhaDaTabelaDeUsuarios.tsx`, `vite.config.ts`.

**Interfaces:** Produz `JanelaDeConfirmacao` em `src/components/JanelaDeConfirmacao.tsx`, mesma assinatura de hoje (`aberta, titulo, texto, rotuloDaAcao, aoConfirmar, aoFechar`).

- [x] **Passo 1: linha de base.** `npm test` passa (531).
- [x] **Passo 2: mover os arquivos** com `git mv src/components/administracao/JanelaDeConfirmacao.tsx src/components/JanelaDeConfirmacao.tsx` e o mesmo para o `.test.tsx`.
- [x] **Passo 3: mover o CSS.** Recortar as quatro regras `.janela-confirmacao*` (hoje em `Administracao.css`, linhas ~200-222) para `src/components/JanelaDeConfirmacao.css`, sem mudar uma propriedade. No topo de `JanelaDeConfirmacao.tsx`, acrescentar `import './JanelaDeConfirmacao.css'`.
- [x] **Passo 4: ajustar os usos.** Em `LinhaDaTabelaDeUsuarios.tsx`: `import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'`. Em `vite.config.ts`: `css: { include: /(Administracao|Moldura|Cadastros|JanelaDeConfirmacao)\.css/ }`. Conferir com `grep -rn "janela-confirmacao" src` se algum teste lia essas regras em `Administracao.css?raw` (os dois testes que importam esse CSS são `App.coresDasMensagens` e `App.perfilComSalvar`; se algum conferir `.janela-confirmacao`, passar a importar o novo `.css`).
- [x] **Passo 5: `npm test`** passa com os mesmos 531 testes; `npm run lint` e `npx tsc -b` sem erro.
- [x] **Passo 6: commit** `Janela de confirmação sai da Administração para os componentes compartilhados`.

---

### Tarefa 2: Módulo de cadastros: ler, editar, desativar, reativar e excluir (critério 2)

**Files:** criar `src/cadastros/cadastroInexistente.ts`; modificar `tipos.ts`, `cadastrosSupabase.ts`, `cadastrosSupabase.test.ts`, `CadastrosFalso.ts`.

**Interfaces:**
- Produz `CadastroInexistente` (extends `Error`, mensagem `TEXTO_DE_CADASTRO_INEXISTENTE`) e, em `ModuloDeCadastros`: `lerSetor(id: string): Promise<Setor | null>`, `editarSetor(id: string, dados: DadosDoSetor): Promise<void>`, `desativarSetor(id: string)`, `reativarSetor(id: string)`, `excluirSetor(id: string)` (todas `Promise<void>`; as quatro de gravação lançam `CadastroInexistente` se o setor não existe).

- [x] **Passo 1: criar `src/cadastros/cadastroInexistente.ts`.**

```ts
export const TEXTO_DE_CADASTRO_INEXISTENTE = 'Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico.'

/** A gravação mirou um cadastro que já não existe (excluído por outra pessoa): a tela mostra o aviso próprio. */
export class CadastroInexistente extends Error {
  name = 'CadastroInexistente'

  constructor() {
    super(TEXTO_DE_CADASTRO_INEXISTENTE)
  }
}
```

- [x] **Passo 2: ampliar o tipo** em `tipos.ts`: dentro de `ModuloDeCadastros`, depois de `criarSetor`, acrescentar

```ts
  /** null: o setor não existe (mais). */
  lerSetor(id: string): Promise<Setor | null>
  editarSetor(id: string, dados: DadosDoSetor): Promise<void>
  desativarSetor(id: string): Promise<void>
  reativarSetor(id: string): Promise<void>
  excluirSetor(id: string): Promise<void>
```

e ajustar o comentário do tipo para dizer que gravação em setor que não existe mais chega como `CadastroInexistente`.

- [x] **Passo 3: escrever os testes que falham** em `cadastrosSupabase.test.ts` (dentro do `describe`; importar `CadastroInexistente` de `./cadastroInexistente`):

```ts
  const LINHA = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true }

  test('ler pede o setor pelo id e devolve a linha', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: [LINHA], error: null }
    expect(await criar(cliente).lerSetor('s1')).toEqual(LINHA)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', filtro: ['id', 's1'] })
  })

  test('ler um setor que não existe devolve null', async () => {
    expect(await criar(new ClienteSupabaseFalso()).lerSetor('sumiu')).toBeNull()
  })

  test('falha ao ler vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).lerSetor('s1')).rejects.toThrow('Falha ao ler o setor: sem conexão')
  })

  test.each([
    ['editar', (m: ReturnType<typeof criar>) => m.editarSetor('s1', NOVO), NOVO],
    ['desativar', (m: ReturnType<typeof criar>) => m.desativarSetor('s1'), { ativo: false }],
    ['reativar', (m: ReturnType<typeof criar>) => m.reativarSetor('s1'), { ativo: true }],
  ])('%s grava só o que muda, filtrando pelo id', async (_nome, chamar, valores) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: [{ id: 's1' }], error: null }
    await chamar(criar(cliente))
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'update', valores, filtro: ['id', 's1'] })
  })

  test('excluir apaga pelo id', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.delete'] = { data: [{ id: 's1' }], error: null }
    await criar(cliente).excluirSetor('s1')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'delete', filtro: ['id', 's1'] })
  })

  test('editar com sigla repetida vira a frase pronta da tela', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: null, error: { code: '23505',
      message: 'duplicate key value violates unique constraint "setores_sigla_key"' } }
    const falha = await criar(cliente).editarSetor('s1', NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Já existe um setor com a sigla NFT.')
  })

  test.each([
    ['update', (m: ReturnType<typeof criar>) => m.desativarSetor('s1')],
    ['delete', (m: ReturnType<typeof criar>) => m.excluirSetor('s1')],
  ])('%s sem nenhuma linha afetada e setor que sumiu: CadastroInexistente', async (operacao, chamar) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas[`setores.${operacao}`] = { data: [], error: null }
    cliente.respostas['setores.select'] = { data: [], error: null }
    await expect(chamar(criar(cliente))).rejects.toBeInstanceOf(CadastroInexistente)
  })

  test('nenhuma linha afetada com o setor ainda lá: o perfil não permite', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.update'] = { data: [], error: null }
    cliente.respostas['setores.select'] = { data: [LINHA], error: null }
    const falha = await criar(cliente).desativarSetor('s1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Seu perfil não permite alterar os cadastros.')
  })
```

- [x] **Passo 4: `npx vitest run src/cadastros/cadastrosSupabase.test.ts`** e conferir que os testes novos falham (operações não existem).
- [x] **Passo 5: implementar** em `cadastrosSupabase.ts`. O objeto de `criarCadastrosSupabase` ganha

```ts
    lerSetor: (id) => lerSetor(cliente, id),
    editarSetor: (id, dados) => alterarSetor(cliente, id, dados),
    desativarSetor: (id) => alterarSetor(cliente, id, { ativo: false }),
    reativarSetor: (id) => alterarSetor(cliente, id, { ativo: true }),
    excluirSetor: (id) => excluirSetor(cliente, id),
```

e o arquivo ganha (a lista passa a usar a constante `COLUNAS_DO_SETOR`; `falhaDoSetor` passa a receber `Partial<DadosDoSetor>`; importar `CadastroInexistente`):

```ts
const COLUNAS_DO_SETOR = 'id, sigla, nome, observacoes, ativo'

async function lerSetor(cliente: ClienteSupabase, id: string): Promise<Setor | null> {
  const { data, error } = await cliente.from('setores').select(COLUNAS_DO_SETOR).eq('id', id)
  if (error) throw new Error(`Falha ao ler o setor: ${error.message}`)
  return data[0] ?? null
}

async function alterarSetor(cliente: ClienteSupabase, id: string, alteracao: Partial<DadosDoSetor> & { ativo?: boolean }): Promise<void> {
  const { data, error } = await cliente.from('setores').update(alteracao).eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, alteracao)
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

async function excluirSetor(cliente: ClienteSupabase, id: string): Promise<void> {
  const { data, error } = await cliente.from('setores').delete().eq('id', id).select('id')
  if (error) throw falhaDoSetor(error, {})
  if (!data.length) throw await porQueNadaMudou(cliente, id)
}

// A RLS não acusa erro ao filtrar: zero linhas quer dizer que o setor sumiu ou que o perfil mudou com a página aberta.
async function porQueNadaMudou(cliente: ClienteSupabase, id: string): Promise<Error> {
  if (await lerSetor(cliente, id)) return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new CadastroInexistente()
}
```

- [x] **Passo 6: `CadastrosFalso.ts`.** Importar `CadastroInexistente`. Trocar o corpo de `criarSetor` para usar `this.falharSeConfigurado()` e acrescentar:

```ts
  async lerSetor(id: string): Promise<Setor | null> {
    return this.setores.find((setor) => setor.id === id) ?? null
  }

  async editarSetor(id: string, dados: DadosDoSetor): Promise<void> {
    this.trocar(id, dados)
  }

  async desativarSetor(id: string): Promise<void> {
    this.trocar(id, { ativo: false })
  }

  async reativarSetor(id: string): Promise<void> {
    this.trocar(id, { ativo: true })
  }

  async excluirSetor(id: string): Promise<void> {
    this.falharSeConfigurado()
    const setor = this.achar(id)
    this.setores = this.setores.filter((outro) => outro !== setor)
  }

  private falharSeConfigurado(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private achar(id: string): Setor {
    const setor = this.setores.find((outro) => outro.id === id)
    if (!setor) throw new CadastroInexistente()
    return setor
  }

  private trocar(id: string, mudancas: Partial<Setor>): void {
    this.falharSeConfigurado()
    const setor = this.achar(id)
    this.setores = this.setores.map((outro) => (outro === setor ? { ...outro, ...mudancas } : outro))
  }
```

- [x] **Passo 7: `npx vitest run src/cadastros` passa**, `npx tsc -b` e `npm run lint` sem erro; `npm test` inteiro passa.
- [x] **Passo 8: commit** `Módulo de cadastros: ler, editar, desativar, reativar e excluir setor`.

---

### Tarefa 3: Lista: "Mostrar inativos", pílula e linha clicável (critérios 3 em parte e 5)

**Files:** criar `src/components/cadastros/ErroAoCarregar.tsx`, `src/App.setoresInativos.test.tsx`; modificar `ListaDeSetores.tsx`, `AreaDeSetores.tsx`, `Cadastros.css`.

**Interfaces:**
- Consome `Setor` e `EstadoDoCarregamento` (já existem).
- Produz `ErroAoCarregar({ alvo, aoTentarDeNovo })` (`alvo`: "os setores", "o setor"…) e `ListaDeSetores({ estado, aoTentarDeNovo, aoAbrir: (id: string) => void })`.

- [x] **Passo 1: testes que falham** em `src/App.setoresInativos.test.tsx` (mesma montagem dos outros arquivos `App.*.test.tsx`: `beforeEach` com `window.location.hash = '#/setores'`, `afterEach` com `cleanup` e hash vazio; `SETORES` = AFT e CIT ativos, EXT inativo, como em `App.setores.test.tsx`):

```tsx
function montar(setores = SETORES) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...setores]
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} />)
  return cadastros
}

test('ao abrir, os inativos ficam escondidos e a caixa "Mostrar inativos" vem desmarcada', async () => {
  montar()
  expect(await screen.findByRole('cell', { name: 'AFT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'EXT' })).toBeNull()
  expect((screen.getByRole('checkbox', { name: 'Mostrar inativos' }) as HTMLInputElement).checked).toBe(false)
})

test('marcar a caixa mostra o inativo com a pílula "Inativo", e os ativos ficam sem pílula', async () => {
  montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  const linha = (await screen.findByRole('cell', { name: 'EXT' })).closest('tr') as HTMLElement
  expect(within(linha).getByText('Inativo').className).toContain('pilula')
  const ativa = screen.getByRole('cell', { name: 'AFT' }).closest('tr') as HTMLElement
  expect(within(ativa).queryByText('Inativo')).toBeNull()
})

test('desmarcar a caixa esconde os inativos de novo', async () => {
  montar()
  const caixa = await screen.findByRole('checkbox', { name: 'Mostrar inativos' })
  fireEvent.click(caixa)
  await screen.findByRole('cell', { name: 'EXT' })
  fireEvent.click(caixa)
  expect(screen.queryByRole('cell', { name: 'EXT' })).toBeNull()
})

test('só inativos e caixa desmarcada: "Nenhum setor ativo para mostrar."', async () => {
  montar([SETORES[2]])
  expect(await screen.findByText('Nenhum setor ativo para mostrar.')).toBeTruthy()
  expect(screen.queryByText('Nenhum setor cadastrado ainda.')).toBeNull()
})
```

(`screen.findByRole('cell', { name: 'AFT' })` continua valendo mesmo com o botão dentro da célula, da Tarefa 3 passo 3.)

- [x] **Passo 2: rodar `npx vitest run src/App.setoresInativos.test.tsx`** e conferir que falham.
- [x] **Passo 3: `ErroAoCarregar.tsx`** (o bloco que hoje está dentro de `ListaDeSetores`, extraído porque o setor aberto precisa do mesmo):

```tsx
type ErroAoCarregarProps = { alvo: string; aoTentarDeNovo: () => void }

export function ErroAoCarregar({ alvo, aoTentarDeNovo }: ErroAoCarregarProps) {
  return (
    <div className="cadastros-erro" role="alert">
      <p>Não foi possível carregar {alvo}. Verifique a conexão e tente de novo.</p>
      <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
    </div>
  )
}
```

- [x] **Passo 4: reescrever `ListaDeSetores.tsx`.**

```tsx
import { useState } from 'react'
import type { Setor } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { Pilula } from '../Pilula'
import { ErroAoCarregar } from './ErroAoCarregar'

const LINHAS_FANTASMA = 3

type ListaDeSetoresProps = {
  estado: EstadoDoCarregamento<Setor[]>
  aoTentarDeNovo: () => void
  aoAbrir: (id: string) => void
}

export function ListaDeSetores({ estado, aoTentarDeNovo, aoAbrir }: ListaDeSetoresProps) {
  const [mostrarInativos, setMostrarInativos] = useState(false)
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os setores" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.tipo === 'pronto' && estado.valor.length === 0) {
    return <p className="cadastros-vazio">Nenhum setor cadastrado ainda.</p>
  }
  const visiveis = estado.tipo === 'pronto' ? estado.valor.filter((setor) => mostrarInativos || setor.ativo) : []
  return (
    <>
      {estado.tipo === 'pronto' && (
        <label className="cadastros-inativos">
          <input type="checkbox" checked={mostrarInativos} onChange={(evento) => setMostrarInativos(evento.target.checked)} />
          Mostrar inativos
        </label>
      )}
      {estado.tipo === 'pronto' && visiveis.length === 0
        ? <p className="cadastros-vazio">Nenhum setor ativo para mostrar.</p>
        : <TabelaDeSetores carregando={estado.tipo === 'carregando'} setores={visiveis} aoAbrir={aoAbrir} />}
    </>
  )
}

type TabelaDeSetoresProps = { carregando: boolean; setores: Setor[]; aoAbrir: (id: string) => void }

function TabelaDeSetores({ carregando, setores, aoAbrir }: TabelaDeSetoresProps) {
  return (
    <table className="tabela-cadastros" aria-busy={carregando}>
      {carregando && <caption>Carregando setores…</caption>}
      <thead>
        <tr><th scope="col">Sigla</th><th scope="col">Nome</th><th scope="col">Situação</th></tr>
      </thead>
      <tbody>
        {carregando
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : setores.map((setor) => <LinhaDeSetor key={setor.id} setor={setor} aoAbrir={aoAbrir} />)}
      </tbody>
    </table>
  )
}

// A linha inteira abre o setor; o botão na sigla dá o mesmo caminho a quem usa o teclado.
function LinhaDeSetor({ setor, aoAbrir }: { setor: Setor; aoAbrir: (id: string) => void }) {
  return (
    <tr className="linha-clicavel" onClick={() => aoAbrir(setor.id)}>
      <td><button type="button" className="cadastros-abrir">{setor.sigla}</button></td>
      <td>{setor.nome}</td>
      <td>{!setor.ativo && <Pilula situacao="neutra">Inativo</Pilula>}</td>
    </tr>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      <td><span className="fantasma-barra" /></td><td><span className="fantasma-barra" /></td>
      <td><span className="fantasma-barra" /></td>
    </tr>
  )
}
```

- [x] **Passo 5: `AreaDeSetores.tsx`**: guardar `const [aberto, setAberto] = useState<string | null>(null)` e passar `aoAbrir={setAberto}` à lista (a tela do setor aberto vem na Tarefa 4; por ora só a lista muda). Se algum teste de `App.setores.test.tsx` conferir os cabeçalhos da tabela ("Sigla", "Nome"), acrescentar "Situação" na expectativa; nenhuma outra expectativa existente deve mudar.
- [x] **Passo 6: CSS** em `Cadastros.css`:

```css
.cadastros-inativos {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  font-size: var(--tam-secundario);
}

.linha-clicavel {
  cursor: pointer;
}

.linha-clicavel:hover {
  background: var(--fundo-suave);
}

/* Botão com cara de texto: a linha toda é clicável, o botão serve ao teclado. */
.cadastros-abrir {
  padding: 0;
  border: 0;
  background: none;
  color: var(--azul);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
```

(Conferir em `src/styles/` o nome real do token de fundo suave; se não houver, usar o de superfície que as outras tabelas usam.)

- [x] **Passo 7: `npm test`, `npx tsc -b`, `npm run lint`** passam.
- [x] **Passo 8: commit** `Lista de setores: Mostrar inativos, pílula Inativo e linha clicável`.

---

### Tarefa 4: Setor aberto: formulário de edição, leitura da Consulta e aviso de item inexistente (critérios 3, 7 e 8 em parte)

**Files:** criar `SetorAberto.tsx`, `SetorEditavel.tsx`, `SetorSomenteLeitura.tsx`, `SetorInexistente.tsx` (em `src/components/cadastros/`) e `src/App.editarSetor.test.tsx`; modificar `FormularioDeSetor.tsx`, `AreaDeSetores.tsx`, `Cadastros.css`.

**Interfaces:**
- `FormularioDeSetor` ganha props opcionais: `titulo?: string` (padrão "Novo setor", também o nome acessível do formulário), `inicial?: DadosDoSetor`, `rotuloDoCancelar?: string` (padrão "Cancelar").
- `SetorAberto({ cadastros, podeAlterar, id, aoVoltar })`; `SetorEditavel({ cadastros, setor, aoVoltar, aoSumir, aoMudar })`; `SetorSomenteLeitura({ setor, aoVoltar })`; `SetorInexistente({ aoVoltar })`.

- [ ] **Passo 1: testes que falham** em `src/App.editarSetor.test.tsx` (mesmo cabeçalho/`beforeEach`/`afterEach` do `App.setoresInativos.test.tsx`; `montar(perfil)` com `AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })`; helper `abrir(sigla)` = `fireEvent.click(await screen.findByRole('cell', { name: sigla }))`):

```tsx
test('clicar na linha abre o setor com o formulário preenchido', async () => {
  montar('integrante_ep')
  await abrir('CIT')
  expect((await screen.findByLabelText('Nome') as HTMLInputElement).value).toBe('Coordenação Inventada de Teste')
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('CIT')
  expect((screen.getByLabelText('Observações') as HTMLTextAreaElement).value).toBe('Nota inventada')
})

test('editar grava nome, sigla em maiúsculas e observações, volta à lista e mostra o novo valor', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: ' Assessoria Renomeada de Teste ' } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: ' art ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('cell', { name: 'ART' })).toBeTruthy()
  expect(cadastros.setores[0]).toMatchObject({ id: 's1', nome: 'Assessoria Renomeada de Teste', sigla: 'ART' })
})

test('sigla fora do formato não é enviada e o formulário continua aberto', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Sigla'), { target: { value: 'A_T' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Recebido: "A_T".')
  expect(cadastros.setores[0].sigla).toBe('AFT')
})

test('falha ao salvar mostra o motivo em vermelho e mantém o que foi digitado', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Outro Nome de Teste' } })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Outro Nome de Teste')
})

test('recusa do banco aparece como veio, com o formulário mantido', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  cadastros.falhaDeGravacao = new TravaDoBanco('Já existe um setor com a sigla CIT.')
  fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Já existe um setor com a sigla CIT.')
  expect(screen.getByRole('form', { name: 'Setor AFT' })).toBeTruthy()
})

test('[Voltar à lista] volta sem gravar', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Não gravar' } })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'AFT' })).toBeTruthy()
  expect(cadastros.setores[0].nome).toBe('Assessoria Fictícia de Teste')
})

test('setor aberto que já foi excluído por outra pessoa: aviso e [Voltar à lista]', async () => {
  const cadastros = montar('integrante_ep')
  await abrir('AFT')
  await screen.findByLabelText('Nome')
  cadastros.setores = cadastros.setores.filter((setor) => setor.id !== 's1')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico.')
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
})

test('abrir um setor que não existe mais (a leitura devolve nada) mostra o mesmo aviso', async () => {
  const cadastros = montar('integrante_ep')
  const lerOriginal = cadastros.lerSetor.bind(cadastros)
  cadastros.lerSetor = async (id) => (id === 's1' ? null : lerOriginal(id))
  await abrir('AFT')
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
})

test('erro ao ler o setor: mensagem e [Tentar de novo]', async () => {
  const cadastros = montar('integrante_ep')
  let falhar = true
  const lerOriginal = cadastros.lerSetor.bind(cadastros)
  cadastros.lerSetor = async (id) => { if (falhar) throw new Error('falha simulada'); return lerOriginal(id) }
  await abrir('AFT')
  expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível carregar o setor.')
  falhar = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByLabelText('Nome')).toBeTruthy()
})

test('a Consulta vê os dados sem campo editável e sem botões de alteração', async () => {
  montar('consulta')
  await abrir('CIT')
  expect(await screen.findByText('Coordenação Inventada de Teste')).toBeTruthy()
  expect(screen.getByText('Nota inventada')).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  for (const nome of ['Salvar', 'Desativar', 'Reativar', 'Excluir']) {
    expect(screen.queryByRole('button', { name: nome })).toBeNull()
  }
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})
```

(importar `TravaDoBanco` de `./acesso/falhasDeGravacao`; `Perfil`, `USUARIO_DE_TESTE`, `AcessoFalso`, `CadastrosFalso`, `Setor`, como nos outros arquivos.)

- [ ] **Passo 2: rodar o arquivo** e conferir que falha.
- [ ] **Passo 3: `FormularioDeSetor.tsx`**: props opcionais como acima. Estado inicial `useState(inicial?.nome ?? '')`, `useState(inicial?.sigla ?? '')`, `useState(inicial?.observacoes ?? '')`; `<form … aria-label={titulo}>`, `<h3>{titulo}</h3>`, botão de cancelar com `{rotuloDoCancelar}`; `titulo = 'Novo setor'` e `rotuloDoCancelar = 'Cancelar'` como padrões (os testes do ticket 01 não mudam).
- [ ] **Passo 4: `SetorInexistente.tsx` e `SetorSomenteLeitura.tsx`.**

```tsx
import { TEXTO_DE_CADASTRO_INEXISTENTE } from '../../cadastros/cadastroInexistente'

export function SetorInexistente({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <div className="cadastros-erro" role="alert">
      <p>{TEXTO_DE_CADASTRO_INEXISTENTE}</p>
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </div>
  )
}
```

```tsx
import type { Setor } from '../../cadastros/tipos'

type SetorSomenteLeituraProps = { setor: Setor; aoVoltar: () => void }

export function SetorSomenteLeitura({ setor, aoVoltar }: SetorSomenteLeituraProps) {
  return (
    <section className="setor-leitura" aria-label={`Setor ${setor.sigla}`}>
      <h3 className="form-setor-titulo">Setor {setor.sigla}</h3>
      <dl className="setor-leitura-dados">
        <dt>Nome</dt><dd>{setor.nome}</dd>
        <dt>Sigla</dt><dd>{setor.sigla}</dd>
        <dt>Observações</dt><dd>{setor.observacoes ?? '—'}</dd>
      </dl>
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>Voltar à lista</button>
    </section>
  )
}
```

- [ ] **Passo 5: `SetorEditavel.tsx`** (por enquanto sem as ações, que entram na Tarefa 5):

```tsx
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from '../../cadastros/tipos'
import { FormularioDeSetor } from './FormularioDeSetor'

type SetorEditavelProps = {
  cadastros: ModuloDeCadastros
  setor: Setor
  aoVoltar: () => void
  aoSumir: () => void
  aoMudar: () => void
}

export function SetorEditavel({ cadastros, setor, aoVoltar, aoSumir }: SetorEditavelProps) {
  // A falha comum segue para o formulário, que a mostra e mantém os dados; setor excluído por outra pessoa vira o aviso próprio.
  async function salvar(dados: DadosDoSetor) {
    try {
      await cadastros.editarSetor(setor.id, dados)
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      throw erro
    }
    aoVoltar()
  }

  return (
    <div className="cadastros-secao">
      <FormularioDeSetor titulo={`Setor ${setor.sigla}`} inicial={setor} rotuloDoCancelar="Voltar à lista"
        aoSalvar={salvar} aoCancelar={aoVoltar} />
    </div>
  )
}
```

(`aoMudar` já na assinatura; usado só na Tarefa 5. O ESLint de variáveis não usadas obriga a só desestruturar `aoMudar` na Tarefa 5.)

- [ ] **Passo 6: `SetorAberto.tsx`.**

```tsx
import { useCallback, useState } from 'react'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { ErroAoCarregar } from './ErroAoCarregar'
import { SetorEditavel } from './SetorEditavel'
import { SetorInexistente } from './SetorInexistente'
import { SetorSomenteLeitura } from './SetorSomenteLeitura'

type SetorAbertoProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean; id: string; aoVoltar: () => void }

export function SetorAberto({ cadastros, podeAlterar, id, aoVoltar }: SetorAbertoProps) {
  const ler = useCallback(() => cadastros.lerSetor(id), [cadastros, id])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  const [sumiu, setSumiu] = useState(false)

  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="o setor" aoTentarDeNovo={tentarDeNovo} />
  if (estado.tipo === 'carregando') return <p className="cadastros-vazio">Carregando setor…</p>
  if (sumiu || estado.valor === null) return <SetorInexistente aoVoltar={aoVoltar} />
  if (!podeAlterar) return <SetorSomenteLeitura setor={estado.valor} aoVoltar={aoVoltar} />
  return (
    <SetorEditavel cadastros={cadastros} setor={estado.valor} aoVoltar={aoVoltar}
      aoSumir={() => setSumiu(true)} aoMudar={recarregar} />
  )
}
```

- [ ] **Passo 7: `AreaDeSetores.tsx`**: quando `aberto !== null`, devolver `<SetorAberto cadastros={cadastros} podeAlterar={podeAlterar} id={aberto} aoVoltar={voltar} />` com `function voltar() { setAberto(null); recarregar() }`. O `useCarregamento` da lista continua no topo (hooks antes do retorno antecipado).
- [ ] **Passo 8: CSS** de `.setor-leitura-dados` (grade de duas colunas, `dt` em `var(--texto-2)`, `dd` sem margem) em `Cadastros.css`.
- [ ] **Passo 9: `npx vitest run src/App.editarSetor.test.tsx` passa**; depois `npm test`, `npx tsc -b`, `npm run lint`.
- [ ] **Passo 10: commit** `Setor aberto: edição, leitura da Consulta e aviso de cadastro inexistente`.

---

### Tarefa 5: Desativar, Reativar e Excluir com janela de confirmação (critérios 4, 6 e 7)

**Files:** criar `AcoesDoSetor.tsx` e `src/App.excluirSetor.test.tsx`; modificar `SetorEditavel.tsx`, `Cadastros.css`.

**Interfaces:** `AcoesDoSetor({ cadastros, setor, aoMudar, aoSumir, aoVoltar })`. Consome `JanelaDeConfirmacao` (`../JanelaDeConfirmacao`), `textoDaFalha` (`../../acesso/falhasDeGravacao`), `CadastroInexistente`.

- [ ] **Passo 1: testes que falham** em `src/App.excluirSetor.test.tsx` (mesmo cabeçalho; helper `abrir`):

```tsx
test('Desativar grava na hora, sem confirmação, e o botão passa a ser Reativar', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  expect(await screen.findByRole('button', { name: 'Reativar' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.setores[0].ativo).toBe(false)
})

test('Reativar grava na hora e o botão volta a ser Desativar', async () => {
  const cadastros = montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  await abrir('EXT')
  fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
  expect(await screen.findByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.setores[2].ativo).toBe(true)
})

test('depois de desativar e voltar à lista, o setor some da lista dos ativos', async () => {
  montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  await screen.findByRole('button', { name: 'Reativar' })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
})

test('falha ao desativar mostra o motivo em vermelho e o setor continua ativo', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: erro inesperado do banco (falha simulada).')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect(screen.getByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.setores[0].ativo).toBe(true)
})

test('Excluir abre a janela com o texto da spec e o foco no Cancelar', async () => {
  montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  const janela = within(screen.getByRole('dialog', { name: 'Excluir o setor AFT?' }))
  expect(janela.getByText('O histórico guarda o que ele tinha, mas não é possível desfazer.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Excluir setor' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('Cancelar e Esc fecham a janela sem excluir', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.setores).toHaveLength(3)
})

test('confirmar a exclusão apaga o setor e volta à lista sem ele', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
  expect(cadastros.setores.map((setor) => setor.id)).toEqual(['s2', 's3'])
})

test('falha ao excluir mostra o motivo em vermelho e o setor continua', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.falhaDeGravacao = new TravaDoBanco('Não é possível excluir: AFT tem 2 processos ligados.')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Não é possível excluir: AFT tem 2 processos ligados.')
  expect(screen.getByRole('form', { name: 'Setor AFT' })).toBeTruthy()
  expect(cadastros.setores).toHaveLength(3)
})

test('desativar um setor que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.setores = cadastros.setores.filter((setor) => setor.id !== 's1')
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})
```

(`montar(perfil = 'integrante_ep')` e `abrir` iguais aos do arquivo da Tarefa 4; importar `act` e `within`.)

- [ ] **Passo 2: rodar o arquivo** e conferir que falha.
- [ ] **Passo 3: `AcoesDoSetor.tsx`.**

```tsx
import { useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import type { ModuloDeCadastros, Setor } from '../../cadastros/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

// Neste ticket o setor ainda não tem macroprocessos; o ticket 04 passa a contá-los no texto.
const TEXTO_DA_EXCLUSAO = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

type AcoesDoSetorProps = {
  cadastros: ModuloDeCadastros
  setor: Setor
  aoMudar: () => void
  aoSumir: () => void
  aoVoltar: () => void
}

export function AcoesDoSetor({ cadastros, setor, aoMudar, aoSumir, aoVoltar }: AcoesDoSetorProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function executar(gravar: () => Promise<void>, depois: () => void) {
    setFalha(null)
    try {
      await gravar()
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return aoSumir()
      return setFalha(textoDaFalha(erro))
    }
    depois()
  }

  const alternarAtivo = () =>
    executar(() => (setor.ativo ? cadastros.desativarSetor(setor.id) : cadastros.reativarSetor(setor.id)), aoMudar)
  const excluir = () => executar(() => cadastros.excluirSetor(setor.id), aoVoltar)

  return (
    <div className="acoes-do-setor">
      <button type="button" className="botao botao-secundario" onClick={alternarAtivo}>
        {setor.ativo ? 'Desativar' : 'Reativar'}
      </button>
      <button type="button" className="botao botao-secundario" onClick={() => setConfirmando(true)}>Excluir</button>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={confirmando} titulo={`Excluir o setor ${setor.sigla}?`} texto={TEXTO_DA_EXCLUSAO}
        rotuloDaAcao="Excluir setor" aoConfirmar={excluir} aoFechar={() => setConfirmando(false)} />
    </div>
  )
}
```

(`textoDaFalha` devolve a frase da `TravaDoBanco` sozinha, ou "A alteração não foi salva: {motivo}." para falha comum.)

- [ ] **Passo 4: `SetorEditavel.tsx`**: voltar a desestruturar `aoMudar` e renderizar, depois do formulário, `<AcoesDoSetor cadastros={cadastros} setor={setor} aoMudar={aoMudar} aoSumir={aoSumir} aoVoltar={aoVoltar} />`.
- [ ] **Passo 5: CSS** `.acoes-do-setor { display: flex; flex-wrap: wrap; gap: var(--esp-2); align-items: center; }` em `Cadastros.css`.
- [ ] **Passo 6: `npx vitest run src/App.excluirSetor.test.tsx` passa**; depois `npm test`, `npx tsc -b`, `npm run lint`.
- [ ] **Passo 7: commit** `Setor aberto: desativar, reativar e excluir com janela de confirmação`.

---

### Tarefa 6: Fechamento do ticket (critério 9 e protocolo)

- [ ] **Passo 1:** `npm test -- --coverage` (cobertura mínima de 70%); conferir cada critério do ticket contra o código e os testes e marcar as caixas do arquivo do ticket (`- [x]`).
- [ ] **Passo 2: ver a tela rodando** (`preview_start` do `npm run dev`) com um perfil de integrante e outro de consulta: abrir, editar, desativar, reativar, excluir, "Mostrar inativos", janela de exclusão (foco, Esc), usando só dados inventados; o painel de dados reais e segredos não é lido.
- [ ] **Passo 3: commit** das caixas marcadas do ticket e deste plano.
- [ ] **Passo 4: junção e fechamento** (feitos pelo `/executar-complexo`): `git switch main`, merge da branch `cadastros-basicos`, `git branch -d`, linha `Concluído em` no ticket, `git push` da `main`, notas em `.scratch/melhorias-protocolo.md` e pedido do `/cost`.

## Autorrevisão

- **Cobertura dos critérios:** 1 → T1; 2 → T2; 3 → T3 (linha clicável) e T4 (abrir, Consulta); 4 → T5 (desativar/reativar); 5 → T3; 6 → T5 (janela); 7 → T4 (aviso) e T5 (aviso na ação); 8 → T4 (salvar) e T5 (desativar/excluir); 9 → testes das T3 a T5 (editar/desativar/reativar/excluir com sucesso e falha, janela, inativos, inexistente, Consulta).
- **Sem lacunas de nome:** `CadastroInexistente`, `TEXTO_DE_CADASTRO_INEXISTENTE`, `lerSetor`, `editarSetor`, `desativarSetor`, `reativarSetor`, `excluirSetor`, `aoAbrir`, `aoVoltar`, `aoSumir`, `aoMudar` aparecem com a mesma grafia em todas as tarefas.
