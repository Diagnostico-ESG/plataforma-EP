# Plano do ticket 16: a janela do verso do cartão

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-16`, sem worktree (o isolamento já está feito).

**Objetivo:** trocar o painel lateral pela janela central do verso do cartão (ticket 16), com cabeçalho novo, menu "⋯" e duas colunas, mantendo as seções atuais como estão.

**Arquitetura:** a janela é um `<dialog>` nativo aberto com `showModal()` (ADR 0003), porque o navegador já cuida do fundo esmaecido, do resto da página inerte, do Tab preso dentro dela e do Esc. O verso troca o conteúdo da janela entre três modos (verso, histórico e editar), sem endereço próprio para os dois últimos. O menu "⋯" vira um componente comum (`MenuDeAcoes`), que os tickets 17 e 18 reaproveitam no Agora e na seção de arquivos.

**Tecnologia:** React 19, TypeScript, Vitest com Testing Library e CSS com os tokens de `src/styles/tokens.css`.

**Requisitos:** `.scratch/processos-etapas/issues/16-janela-do-verso.md` (critérios citados como "critério N do ticket 16", contados de cima para baixo) e a spec `.scratch/processos-etapas/spec.md` ("Verso do cartão", itens Janela, Cabeçalho, Menu "⋯" e Teclado; "Estados").

## Restrições gerais

- Sem mudança no banco (spec, "Parte 3 (Verso do cartão, 2026-10-19)"): nenhuma migração e nenhum tipo novo do banco.
- Sem dependência nova.
- Limites do ESLint: função de lógica até 20 linhas, arquivo até 300, complexidade até 10. Se um limite barrar, extraia uma função com nome próprio.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto); toda tarefa termina com `npm test` e `npm run lint` verdes.
- **Design e facilidade de uso são prioridade máxima** (pedido do usuário em 2026-10-19): cada tarefa com tela termina conferindo a tela no navegador (Tarefa 6).
- Textos da tela exatamente como na spec.

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/configurarTestes.ts` (alterar) | o Esc no `<dialog>` simulado: "cancel" na janela de cima e, se ninguém impedir, fecha |
| `src/hooks/useFecharAoClicarFora.ts` (criar) | sai de `MenuDaConta.tsx`; passa a servir também ao `MenuDeAcoes` (segunda repetição real) |
| `src/components/Icone.tsx` (alterar) | ícone `reticencias` (três pontos) |
| `src/components/MenuDeAcoes.tsx` + `.css` + `.test.tsx` (criar) | o botão "⋯" com o menu em grupos, pelo teclado (padrão de menu da WAI-ARIA) |
| `src/processos/corDoMacroprocesso.ts` + `.test.ts` (criar) | a cor fixa de cada macroprocesso, entre as seis cores de macroprocesso dos tokens |
| `src/components/processos/JanelaDoVerso.tsx` + `.test.tsx` (criar) | a casca: `<dialog>` modal, nome acessível, Esc que pede para fechar |
| `src/components/processos/Verso.css` (criar) | janela, cabeçalho fixo, duas colunas, carregando, telas estreitas, menos movimento |
| `src/components/processos/CabecalhoDoVerso.tsx` (criar; apaga `CabecalhoDoPainel.tsx`) | sigla, nome, macroprocesso com a cor e tipo, pílula fora do normal, "⋯" e fechar |
| `src/components/processos/AcoesDoProcesso.tsx` (alterar) | o menu "⋯" do processo e as janelas de situação, reclassificação e exclusão |
| `src/components/processos/AcoesDeSituacao.tsx`, `AcoesDeReclassificacao.tsx` (alterar) | só as janelas, controladas por quem as abre; os botões saem |
| `src/components/processos/VersoDoCartao.tsx` (criar; apaga `PainelDoProcesso.tsx`) | estados, modos (verso, histórico, editar) e as duas colunas |
| `src/components/processos/JanelaDoNovoProcesso.tsx` (criar; apaga `PainelDeNovoProcesso.tsx`) | o Novo processo dentro da janela, estreita |
| `src/components/processos/AreaDeProcessos.tsx` (alterar) | usa o verso e a janela do novo processo; tira o esmaecido duplicado |
| `src/components/processos/Painel.css` (alterar) | sai o que era do painel lateral e das abas; o resto (seções) fica |
| `src/testes/versoDoCartao.ts` (criar) | ajudantes dos testes: achar o verso, a janela por cima, escolher no "⋯" |
| `src/App.versoDoCartao.test.tsx` (criar; apaga `App.painelDoProcesso.test.tsx` depois de levar os casos que continuam) | os critérios do ticket 16 pelo aplicativo inteiro |
| os 24 outros `src/App.*.test.tsx` que abrem o painel (alterar) | só a forma de achar o verso, as abas e os botões que foram para o "⋯" |

---

### Tarefa 1: Esc no `<dialog>` dos testes e o hook de clique fora

**Arquivos:** alterar `src/configurarTestes.ts`, `src/components/JanelaComCampo.test.tsx`, `src/components/moldura/MenuDaConta.tsx`; criar `src/hooks/useFecharAoClicarFora.ts`.

**Produz:** `useFecharAoClicarFora(raiz: RefObject<HTMLElement | null>, aberto: boolean, fechar: () => void): void`; nos testes, `fireEvent.keyDown(elemento, { key: 'Escape' })` passa a fechar a janela de cima, como o navegador.

- [x] **Passo 1: teste que falha** em `JanelaComCampo.test.tsx`:

```tsx
test('Esc fecha a janela sem gravar, como no navegador', () => {
  const aoConfirmar = vi.fn()
  const aoFechar = vi.fn()
  render(<JanelaComCampo aberta titulo="Suspender?" rotuloDoCampo="Motivo" rotuloDaAcao="Suspender processo"
    aoConfirmar={aoConfirmar} aoFechar={aoFechar} />)
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Motivo' }), { key: 'Escape' })
  expect(aoFechar).toHaveBeenCalled()
  expect(aoConfirmar).not.toHaveBeenCalled()
})
```

- [x] **Passo 2:** `npx vitest run src/components/JanelaComCampo.test.tsx`: falha, porque `aoFechar` não é chamado.
- [x] **Passo 3:** acrescentar a `configurarTestes.ts`, dentro do `if` que já existe:

```ts
  // Esc no navegador: a janela de cima recebe "cancel", que pode ser impedido; se não for, ela fecha.
  // Quem trata o Esc antes (um menu aberto) impede a ação padrão, e a janela fica.
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape' || evento.defaultPrevented) return
    const abertas = document.querySelectorAll<HTMLDialogElement>('dialog[open]')
    const deCima = abertas[abertas.length - 1]
    if (deCima && deCima.dispatchEvent(new Event('cancel', { cancelable: true }))) deCima.close()
  })
```

- [x] **Passo 4:** mover `useFecharAoClicarFora` de `MenuDaConta.tsx` para `src/hooks/useFecharAoClicarFora.ts`, exportado, com o comentário que já tem e o tipo `RefObject<HTMLElement | null>`, e importá-lo em `MenuDaConta.tsx`.
- [x] **Passo 5:** `npm test` e `npm run lint`: tudo verde (os testes do menu da conta cobrem o hook movido).
- [x] **Passo 6:** commit "Ticket 16 de processos-etapas: Esc no dialog dos testes e hook de clique fora".

### Tarefa 2: o menu "⋯" comum

**Arquivos:** alterar `src/components/Icone.tsx`; criar `src/components/MenuDeAcoes.tsx`, `MenuDeAcoes.css`, `MenuDeAcoes.test.tsx`.

**Consome:** `useFecharAoClicarFora` (Tarefa 1).
**Produz:**

```ts
export type ItemDoMenu = { rotulo: string; aoEscolher: () => void; perigoso?: boolean }
type MenuDeAcoesProps = { rotulo: string; grupos: ItemDoMenu[][] }
export function MenuDeAcoes(props: MenuDeAcoesProps): JSX.Element
```

Comportamento (padrão de menu da WAI-ARIA, com os textos da spec "Menu '⋯' do processo"):
- botão com o ícone de três pontos, `aria-label` e `title` = `rotulo`, `aria-haspopup="menu"`, `aria-expanded`;
- clique, Enter, espaço ou seta para baixo abrem o menu, com o foco no primeiro item; a seta para cima abre com o foco no último;
- `role="menu"` com o nome `rotulo`; cada grupo em `role="group"`, separado do seguinte por `role="separator"`; cada item é `<button role="menuitem" tabIndex={-1}>`;
- setas para cima e para baixo (dando a volta), Home e End movem o foco;
- Esc fecha, devolve o foco ao botão e **impede a ação padrão** (para não fechar a janela do verso junto);
- Tab fecha sem impedir o Tab; clique fora fecha;
- escolher um item fecha o menu, devolve o foco ao botão e chama `aoEscolher` (a janela nativa que ele abrir devolve o foco ao botão ao fechar);
- item `perigoso` com a classe `menu-de-acoes-perigoso` (vermelho de `--atraso-texto`).

- [x] **Passo 1: testes que falham** em `MenuDeAcoes.test.tsx`, um por comportamento acima. Exemplos:

```tsx
const GRUPOS = (escolhido: (rotulo: string) => void): ItemDoMenu[][] => [
  [{ rotulo: 'Histórico', aoEscolher: () => escolhido('Histórico') }, { rotulo: 'Editar', aoEscolher: () => escolhido('Editar') }],
  [{ rotulo: 'Excluir', aoEscolher: () => escolhido('Excluir'), perigoso: true }],
]

test('abre pelo botão com o foco no primeiro item, em grupos separados', () => {
  render(<MenuDeAcoes rotulo="Ações do processo" grupos={GRUPOS(vi.fn())} />)
  const botao = screen.getByRole('button', { name: 'Ações do processo' })
  expect(botao.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(botao)
  const menu = screen.getByRole('menu', { name: 'Ações do processo' })
  expect(within(menu).getAllByRole('group')).toHaveLength(2)
  expect(within(menu).getAllByRole('separator')).toHaveLength(1)
  expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: 'Histórico' }))
})

test('as setas dão a volta, e Home e End vão às pontas', () => { /* ArrowDown x3 volta ao primeiro; End no Excluir; Home no Histórico */ })

test('Esc fecha, devolve o foco ao botão e impede a ação padrão', () => {
  render(<MenuDeAcoes rotulo="Ações do processo" grupos={GRUPOS(vi.fn())} />)
  fireEvent.click(screen.getByRole('button', { name: 'Ações do processo' }))
  const nao = fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Histórico' }), { key: 'Escape' })
  expect(nao).toBe(false) // fireEvent devolve false quando a ação padrão foi impedida
  expect(screen.queryByRole('menu')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ações do processo' }))
})

test('escolher um item fecha o menu e chama a ação', () => { /* clique em Editar: escolhido('Editar'), menu fechado */ })
test('Tab e clique fora fecham o menu', () => { /* keyDown Tab; pointerDown no document.body */ })
test('seta para cima no botão abre com o foco no último item', () => { /* Excluir focado */ })
test('o item perigoso tem a marca de perigo', () => { /* classe menu-de-acoes-perigoso no Excluir */ })
```

- [x] **Passo 2:** `npx vitest run src/components/MenuDeAcoes.test.tsx`: falha (módulo inexistente).
- [x] **Passo 3:** em `Icone.tsx`, o desenho `reticencias`: `<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>`.
- [x] **Passo 4:** `MenuDeAcoes.tsx` com o botão, a lista (`ListaDoMenu`, que foca o primeiro ou o último item ao montar) e a navegação numa função pura de índice (`proximoIndice(tecla, atual, total): number | null`), para ficar abaixo da complexidade 10. `MenuDeAcoes.css`: `.menu-de-acoes { position: relative }`; lista absoluta, alinhada à direita do botão, `min-width: 200px`, fundo `--folha`, borda `--linha`, `--canto`, `--sombra-flutuante`, `padding: var(--esp-1) 0`; item com altura mínima de 32 px, `padding: 0 var(--esp-4)`, alinhado à esquerda, fundo `--azul-claro` no foco e no hover; separador de 1 px em `--linha` com `margin: var(--esp-1) 0`.
- [x] **Passo 5:** `npm test` e `npm run lint`: verdes.
- [x] **Passo 6:** commit "Ticket 16 de processos-etapas: menu ⋯ comum".

### Tarefa 3: a cor de cada macroprocesso

**Arquivos:** criar `src/processos/corDoMacroprocesso.ts` e `.test.ts`.

**Produz:** `corDoMacroprocesso(id: string): string`, que devolve `var(--macro-<nome>)`.

Decisão de implementação (registrar no `desvios.md` na Tarefa 7): o banco não guarda cor de macroprocesso e o ticket não muda o banco. A cor sai do id, sempre a mesma para o mesmo macroprocesso, entre as seis cores de macroprocesso dos tokens. Se o usuário quiser escolher a cor de cada um, isso é uma coluna nova num ticket próprio.

- [x] **Passo 1: testes que falham:** o mesmo id dá sempre a mesma cor; toda cor devolvida é uma das seis (`--macro-violeta`, `--macro-ciano`, `--macro-magenta`, `--macro-indigo`, `--macro-oliva` e `--macro-cobre`); ids diferentes de uma amostra de 12 usam ao menos 4 cores.
- [x] **Passo 2:** `npx vitest run src/processos/corDoMacroprocesso.test.ts`: falha.
- [x] **Passo 3:** implementar com a soma dos códigos dos caracteres do id, módulo 6:

```ts
// O banco não guarda cor de macroprocesso: a cor sai do id, sempre a mesma, entre as seis da identidade (sem as de situação).
const CORES = ['violeta', 'ciano', 'magenta', 'indigo', 'oliva', 'cobre'] as const

export function corDoMacroprocesso(id: string): string {
  let soma = 0
  for (const letra of id) soma += letra.charCodeAt(0)
  return `var(--macro-${CORES[soma % CORES.length]})`
}
```

- [x] **Passo 4:** testes e lint verdes; commit "Ticket 16 de processos-etapas: cor do macroprocesso".

### Tarefa 4: a casca da janela

**Arquivos:** criar `src/components/processos/JanelaDoVerso.tsx`, `JanelaDoVerso.test.tsx` e `Verso.css`; alterar `src/styles/tokens.css`.

**Produz:**

```ts
type JanelaDoVersoProps = { rotulo: string; estreita?: boolean; aoFechar: () => void; children: ReactNode }
export function JanelaDoVerso(props: JanelaDoVersoProps): JSX.Element
```

- [x] **Passo 1: testes que falham** em `JanelaDoVerso.test.tsx`:
  - abre com `showModal` (espiar `HTMLDialogElement.prototype.showModal` com `vi.spyOn`) e é um `dialog` com o nome do `rotulo`;
  - Esc chama `aoFechar` e a janela continua montada (quem fecha é o endereço);
  - o Esc de uma `JanelaComCampo` aberta dentro dela fecha só a de dentro (`aoFechar` do verso não é chamado);
  - `estreita` põe a classe `verso-estreita`.
- [x] **Passo 2:** `npx vitest run src/components/processos/JanelaDoVerso.test.tsx`: falha.
- [x] **Passo 3:** implementar:

```tsx
// <dialog> modal (ADR 0003): o navegador escurece o fundo, deixa o resto da página inerte e prende o Tab dentro dela.
// O Esc chega como "cancel": quem fecha é o endereço (aoFechar), não o <dialog>. O "cancel" de uma janela de dentro
// (motivo, confirmação) pode chegar aqui pelo React; só o do próprio verso conta.
export function JanelaDoVerso({ rotulo, estreita = false, aoFechar, children }: JanelaDoVersoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (janela.current && !janela.current.open) janela.current.showModal()
  }, [])
  const aoCancelar = (evento: SyntheticEvent<HTMLDialogElement>) => {
    if (evento.target !== evento.currentTarget) return
    evento.preventDefault()
    aoFechar()
  }
  return (
    <dialog ref={janela} className={estreita ? 'verso verso-estreita' : 'verso'} aria-label={rotulo} onCancel={aoCancelar}>
      {children}
    </dialog>
  )
}
```

- [x] **Passo 4:** tokens novos em `tokens.css`: `--fundo-contexto: #f7f8fb` (o "levemente cinza" da coluna direita) e `--tam-verso-titulo: 19px`. `Verso.css`, com os valores da spec:

```css
/* O verso do cartão (spec, "Verso do cartão"): janela central de até cerca de 880 px, 60% e 40%, uma só rolagem. */
.verso {
  width: min(880px, calc(100vw - 2 * var(--esp-5)));
  max-width: none;
  max-height: 90vh;
  padding: 0;
  overflow-y: auto;
  border: 0;
  border-radius: var(--canto);
  background: var(--folha);
  color: var(--texto);
  box-shadow: var(--sombra-flutuante);
  animation: verso-entra 150ms var(--curva-saida);
}

.verso::backdrop { background: var(--veu-janela); }
.verso-estreita { width: min(560px, calc(100vw - 2 * var(--esp-5))); }

@keyframes verso-entra {
  from { transform: translateY(8px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .verso { animation: none; }
}

@media (max-width: 900px) {
  .verso, .verso-estreita { width: 100vw; height: 100vh; max-height: 100vh; margin: 0; border-radius: 0; }
}
```

  As classes do cabeçalho, das colunas e do carregando entram na Tarefa 5.
- [x] **Passo 5:** testes e lint verdes; commit "Ticket 16 de processos-etapas: casca da janela do verso".

### Tarefa 5: o verso no lugar do painel (critérios 1 a 8 do ticket 16)

É uma tarefa só porque o pré-commit roda a bateria inteira: trocar o painel pelo verso e ajustar os testes antigos precisam entrar juntos.

**Arquivos:** criar `src/testes/versoDoCartao.ts`, `src/App.versoDoCartao.test.tsx`, `CabecalhoDoVerso.tsx` e `VersoDoCartao.tsx`; alterar `AcoesDoProcesso.tsx`, `AcoesDeSituacao.tsx`, `AcoesDeReclassificacao.tsx`, `AreaDeProcessos.tsx`, `Painel.css`, `Verso.css`, `src/hooks/useGravacaoComFalha.ts` (exportar o tipo `Executar`) e os testes `App.*` que abrem o painel; apagar `PainelDoProcesso.tsx`, `CabecalhoDoPainel.tsx` e `App.painelDoProcesso.test.tsx`.

**Consome:** Tarefas 1 a 4.
**Produz:**
- `src/testes/versoDoCartao.ts`:

```ts
/** O verso aberto ("Processo {nome}", ou "Processo" enquanto carrega). */
export const versoAberto = async () => within(await screen.findByRole('dialog', { name: /^Processo( |$)/ }))
/** A janela aberta por cima do verso (motivo, confirmação, avanço): a última <dialog> aberta. */
export const janelaPorCima = () => screen.getAllByRole('dialog').at(-1) as HTMLElement
/** Abre o "⋯" do processo e escolhe a ação. */
export async function escolherNoMenuDoProcesso(acao: string) {
  const verso = await versoAberto()
  fireEvent.click(await verso.findByRole('button', { name: 'Ações do processo' }))
  fireEvent.click(verso.getByRole('menuitem', { name: acao }))
}
```

- `type ModoDoVerso = 'verso' | 'historico' | 'editar'`, estado do `VersoDoCartao`.

Desenho (spec, "Verso do cartão"):
- **Cabeçalho** (`CabecalhoDoVerso`), fixo no topo (`position: sticky`), com fundo `--folha` e linha de baixo: quadradinho da sigla (`cartao-sigla`, mono); o nome num `h2` (`--tam-verso-titulo`, 700, `tabIndex={-1}`, que recebe o foco ao abrir e ao trocar de processo); embaixo, em `--texto-2`, o quadradinho de 10 px com `corDoMacroprocesso(processo.macroprocessoId)` e `--canto-macro`, o nome do macroprocesso, " · " e `ROTULO_DO_TIPO[processo.tipo]`; `PilulaDaSituacao` só quando a situação não é `em_andamento`; o `AcoesDoProcesso` ("⋯", nome "Ações do processo"); o fechar (nome "Fechar o processo").
- **Menu "⋯"** (`AcoesDoProcesso`, que monta os grupos e as janelas): para quem pode alterar, os grupos `[Histórico, Editar, Reclassificar]`, `[Suspender ou Retomar, Cancelar]` e `[Excluir]` (perigoso); para a Consulta, só `[Histórico]`. A ordem do segundo grupo segue a spec: em andamento e concluído, Suspender e Cancelar; suspenso, Retomar e Cancelar; cancelado, Retomar. `AcoesDeSituacao` vira `JanelaDeSituacao({ processo, processos, pedido, executar, aoFechar, aoMudar })`, só a janela, e exporta os rótulos dos pedidos. `AcoesDeReclassificacao` vira `JanelaDeReclassificacaoDoProcesso` com o mesmo `executar`. A falha de qualquer ação do menu aparece numa linha `role="alert"` (`cadastros-falha`) logo abaixo do cabeçalho, pelo `useGravacaoComFalha` do `VersoDoCartao`.
- **Colunas** (`.verso-colunas`, grade `3fr 2fr`; uma coluna abaixo de 900 px): à esquerda (`.verso-trabalho`, fundo `--folha`), `CaminhoDoProcesso` e `SecaoDeVersoes`; à direita (`.verso-contexto`, fundo `--fundo-contexto`, linha fina à esquerda), `ReuniaoDoProcesso`, `DadosDoProcesso` e `EstruturaDoProcesso`; `padding: var(--esp-5)` e `gap: var(--esp-5)` nas duas.
- **Modo histórico:** abaixo do cabeçalho, o botão "← Voltar ao processo", o título "Histórico" e o `HistoricoDoProcesso` atual (o agrupamento por dia e o Esc em dois passos são do ticket 19).
- **Modo editar:** abaixo do cabeçalho, numa coluna de até 560 px, o `FormularioDoProcesso` com o título "Editar processo"; salvar ou cancelar volta ao modo verso (a janela estreita e o rodapé fixo são do ticket 19).
- **Estados**, todos dentro da `JanelaDoVerso` já no tamanho final: carregando com o cabeçalho e as colunas em blocos cinza (`.verso-fantasma`, `--neutra-fundo`, `aria-hidden`, com as alturas aproximadas das seções) e "Carregando processo…" em `role="status"` com `visualmente-oculto`, sob o nome "Processo"; erro (`ErroAoCarregar` com [Tentar de novo]) e processo excluído (`ItemInexistente` com [Voltar]), cada um com o fechar no topo.
- **`AreaDeProcessos`:** troca `PainelDoProcesso` por `VersoDoCartao` e tira a classe `quadro-esmaecido` (o `::backdrop` já escurece; deixar os dois escurece demais), mantendo o `inert` e a volta do foco ao cartão ou à linha.
- **`Painel.css`:** sai o que era do painel lateral e das abas (`.painel`, `painel-entra`, `.painel-barra`, `.painel-cabecalho`, `.painel-sigla`, `.painel-identificacao`, `.painel-titulo`, `.painel-macroprocesso`, `.painel-fechar`, `.painel-abas`, `.painel-aba`, `.painel-corpo`, `.painel-acoes`, `.quadro-esmaecido`), depois de conferir com o grep que nenhum outro componente usa essas classes.

- [x] **Passo 1: testes novos que falham** em `App.versoDoCartao.test.tsx`, com o mesmo `montar` e os mesmos dados inventados do `App.painelDoProcesso.test.tsx` (copiar o `PROCESSO`, o `EVENTO` e o `montar`), um caso por critério 1 a 7 do ticket 16:
  - abre pelo cartão (clique no link `cartao-p1` a partir de `#/processos`), pela linha da Lista e pelo endereço; o caminho pela tela do setor continua coberto por `App.processosDoSetor`;
  - fecha pelo "Fechar o processo" e por Esc, com o endereço `#/processos` e o foco de volta em `cartao-p1` (na Lista, em `linha-p1`);
  - pai e subprocesso abrem na mesma janela, com o endereço e o nome do diálogo mudando;
  - o diálogo se chama "Processo Emitir Ofício", abre com `showModal`, o foco vai ao `h2` do nome e o Quadro atrás fica com `inert`;
  - cabeçalho: tipo em texto ("A classificar"), sem pílula em andamento; pílula "Suspenso", "Cancelado" e "Concluído" nos outros casos;
  - menu: os três grupos com os itens de cada situação; só Histórico para a Consulta; Histórico abre o modo histórico com "← Voltar ao processo"; Editar abre o formulário e Cancelar volta; Suspender abre a janela do motivo e grava; Excluir abre a confirmação, e confirmar fecha o verso;
  - falha de uma ação do menu aparece abaixo do cabeçalho em `role="alert"`;
  - estados: carregando ("Carregando processo…" em `role="status"`, com o diálogo já aberto), erro com [Tentar de novo] e excluído com [Voltar].
- [x] **Passo 2:** `npx vitest run src/App.versoDoCartao.test.tsx`: falha.
- [x] **Passo 3:** criar `CabecalhoDoVerso.tsx`, refazer `AcoesDoProcesso.tsx`, `AcoesDeSituacao.tsx` e `AcoesDeReclassificacao.tsx` e criar `VersoDoCartao.tsx` (`VersoDoCartao`, `ConteudoDoVerso` para os estados, `ProcessoAberto` para os modos e `ColunasDoVerso` para as seções), cada função abaixo de 20 linhas.
- [x] **Passo 4:** `AreaDeProcessos.tsx` e as folhas de estilo, como descrito acima.
- [x] **Passo 5:** `npx vitest run src/App.versoDoCartao.test.tsx`: passa.
- [x] **Passo 6: ajustar os testes antigos** (critério 8 do ticket 16), sem mudar o que cada um prova:
  - `screen.findByRole('complementary', { name: 'Painel do processo' })` e os `const painel = ...` locais viram `versoAberto()`;
  - `findByRole('tab', { name: 'Histórico' })` vira `escolherNoMenuDoProcesso('Histórico')`;
  - os cliques nos botões Editar, Excluir, Suspender, Cancelar, Retomar e Reclassificar do processo viram `escolherNoMenuDoProcesso(...)`. Cuidado: o "Cancelar" dos formulários e das janelas continua botão;
  - `screen.getByRole('dialog')` sem nome, nos testes que abrem o verso, vira `janelaPorCima()`;
  - "Fechar o painel" vira "Fechar o processo";
  - os casos do `App.painelDoProcesso.test.tsx` que continuam valendo (dados, caminho, reunião, versões) vão para `App.versoDoCartao.test.tsx`; o de "pílula Em andamento" sai, substituído pelo do cabeçalho novo. Depois disso, apagar o arquivo antigo.

  Rodar `npm test` depois de cada grupo de arquivos ajustados. Se um teste antigo falhar por comportamento (e não pela forma de achar o elemento), parar e investigar antes de mexer no teste.
- [x] **Passo 7:** `npm test`, `npm run lint` e `npm run typecheck`: verdes. Conferir com o grep que não sobra "Painel do processo", "Fechar o painel" nem `'complementary'` nos testes de processos.
- [x] **Passo 8:** commit "Ticket 16 de processos-etapas: verso do cartão no lugar do painel".

### Tarefa 6: o Novo processo dentro da janela

**Arquivos:** criar `JanelaDoNovoProcesso.tsx`; alterar `AreaDeProcessos.tsx`, `App.cadastrarProcesso.test.tsx` e `App.versoDoCartao.test.tsx`; apagar `PainelDeNovoProcesso.tsx`.

- [x] **Passo 1: testes que falham:** [Cadastrar processo] e `#/processos/novo` abrem o diálogo "Novo processo", estreito (classe `verso-estreita`), com o formulário; Esc e Cancelar fecham; cadastrar fecha e recarrega o Quadro, como hoje (abrir o verso do criado é do ticket 19). No `App.cadastrarProcesso.test.tsx`, "Painel do novo processo" vira o diálogo "Novo processo", e o Esc vira `keyDown` com `Escape` no campo de nome.
- [x] **Passo 2:** `npx vitest run src/App.cadastrarProcesso.test.tsx src/App.versoDoCartao.test.tsx`: falha.
- [x] **Passo 3:** `JanelaDoNovoProcesso` com `JanelaDoVerso rotulo="Novo processo" estreita`, um cabeçalho simples ("Novo processo" em `h2` e o fechar) e o `FormularioDoProcesso` com o título "Cadastrar processo"; `AreaDeProcessos` passa a usá-la. Apagar `PainelDeNovoProcesso.tsx` e o `fecharComEsc.ts` se nada mais o usar (grep).
- [x] **Passo 4:** testes, lint e typecheck verdes; commit "Ticket 16 de processos-etapas: novo processo dentro da janela".

### Tarefa 7: conferência na tela, desvios e fecho

- [x] **Passo 1: conferir a tela no navegador do app**, pela vitrine local (`vitrine.local/`, servida pelo `npx vite`; mapa da iniciativa, "Notes") ou pela aplicação de desenvolvimento, nos três `[visual]` do ticket 16:
  - a janela de 880 px, as colunas 60% e 40% e o fundo da direita;
  - o cabeçalho fixo ao rolar, com uma só rolagem;
  - as pílulas só fora do normal;
  - o "⋯" com os três grupos e o Excluir em vermelho, abrindo sem ser cortado pela janela;
  - o carregando sem a janela mudar de tamanho;
  - a 375 px de largura (`resize_window` com o preset mobile), a tela inteira em uma coluna;
  - o foco visível ao navegar com o Tab.

  O que ficar feio ou difícil de usar se corrige aqui, com teste quando for comportamento. Desenho e facilidade de uso são a prioridade.
- [x] **Passo 2:** registrar em `.scratch/processos-etapas/desvios.md` (entrada nova, datada) a cor do macroprocesso saída do id (Tarefa 3), o fim do esmaecido duplicado e qualquer outra diferença em relação ao ticket.
- [x] **Passo 3:** itens de `.claude/regras/nao-testados.md` (blocos `/executar-complexo` e "Qualquer momento") que aconteceram nesta execução vão para `.scratch/melhorias-protocolo.md`.
- [x] **Passo 4:** `npm test`, `npm run lint` e `npm run typecheck` verdes; commit "Ticket 16 de processos-etapas: desvios e conferência da tela".
- [x] **Passo 5:** `git switch main`, merge de `processos-etapas-16`, `git branch -d processos-etapas-16`, linha `Concluído em` no ticket 16, commit e envio da `main` (Ajustes deste Projeto).
