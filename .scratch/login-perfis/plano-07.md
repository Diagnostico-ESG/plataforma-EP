# Ticket 07 (confirmação de Excluir e Desativar, cores das mensagens) — Plano de execução

> **Para quem executa:** use `superpowers:executing-plans`. Os passos usam caixas (`- [ ]`) para marcar o andamento.

**Objetivo:** Excluir autorização e Desativar pedem confirmação numa janela `<dialog>` nativa; as falhas da Administração ficam vermelhas e o aviso de perfil sem permissão fica amarelo.

**Arquitetura:** um componente novo e pequeno, `JanelaDeConfirmacao`, sempre montado dentro da linha e aberto por estado (`aberta`), para o navegador devolver o foco ao botão de origem ao fechar. `BotoesDaLinha` guarda qual janela está aberta. As cores mudam só no CSS da Administração, reaproveitando os tokens `--atraso-*` da tela de entrada.

**Tecnologias:** React + TypeScript, Vitest + Testing Library (jsdom). Nenhuma dependência nova.

**Spec e ticket:** `.scratch/login-perfis/spec.md` (histórias 50 a 54; seções "Confirmação" e "Cores das mensagens") e `.scratch/login-perfis/issues/07-confirmacao-e-cores.md` (critérios 1 a 8, citados abaixo como C1 a C8). ADR 0003. Ticket sem banco: `banco.md` não vale.

## Restrições gerais

- Textos da janela, exatamente como na spec:
  - Excluir: título `Excluir a autorização de {e-mail}?`, texto `A pessoa não conseguirá entrar. Para permitir de novo, autorize o e-mail outra vez.`, botões `Excluir autorização` e `Cancelar`.
  - Desativar: título `Desativar {nome}?`, texto `{nome} perde o acesso à plataforma. O nome e o histórico continuam registrados, e você pode reativar depois.`, botões `Desativar` e `Cancelar`.
- Reativar e Corrigir nome continuam sem janela. Botão de confirmar = `botao botao-principal`.
- Falha da gravação confirmada aparece como hoje (`falhaNaLinha` em `AreaDeUsuarios`, `role="alert"`).
- Funções de 4 a 20 linhas, arquivos até 300 linhas, TypeScript sem `any`, TDD (teste falha antes).

## Arquivos

- Criar: `src/configurarTestes.ts` — `showModal` e `close` de `<dialog>` para o jsdom (se ele não tiver).
- Modificar: `vite.config.ts` — `setupFiles`.
- Criar: `src/components/administracao/JanelaDeConfirmacao.tsx` e `.test.tsx`.
- Modificar: `src/components/administracao/LinhaDaTabelaDeUsuarios.tsx` (`BotoesDaLinha`).
- Modificar: `src/components/administracao/Administracao.css`.
- Criar: `src/App.confirmacao.test.tsx` e `src/App.coresDasMensagens.test.tsx`.
- Modificar: `src/App.autorizacoes.test.tsx`, `src/App.gestaoDeUsuarios.test.tsx` (e qualquer outro teste que clique em Excluir ou Desativar).

---

### Tarefa 1: Janela de confirmação (componente isolado) — C2, C5

- [x] **Passo 1: ver se o jsdom já tem `showModal`.** Rode
  `node -e "const {JSDOM}=require('jsdom');const w=new JSDOM('').window;console.log(typeof w.HTMLDialogElement.prototype.showModal)"`.
  Se imprimir `function`, pule o Passo 2 e o `setupFiles` (nada de `configurarTestes.ts`). Se imprimir `undefined`, siga.
- [x] **Passo 2: stub para o jsdom.** Crie `src/configurarTestes.ts`:

```ts
// O jsdom não implementa showModal/close de <dialog>; este é o mínimo para os testes de interface.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function close() {
  if (!this.open) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
```

  Em `vite.config.ts`, dentro de `test`, acrescente `setupFiles: ['./src/configurarTestes.ts']`.
- [x] **Passo 3: teste que falha.** Crie `src/components/administracao/JanelaDeConfirmacao.test.tsx`:

```tsx
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { JanelaDeConfirmacao } from './JanelaDeConfirmacao'

afterEach(cleanup)

function montar(aberta: boolean) {
  const aoConfirmar = vi.fn()
  const aoFechar = vi.fn()
  render(
    <JanelaDeConfirmacao aberta={aberta} titulo="Desativar Ana Teste?" texto="Ana Teste perde o acesso."
      rotuloDaAcao="Desativar" aoConfirmar={aoConfirmar} aoFechar={aoFechar} />,
  )
  return { aoConfirmar, aoFechar }
}

test('fechada, não aparece', () => {
  montar(false)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('aberta, mostra título, texto e botões, com o foco no Cancelar', () => {
  montar(true)
  const janela = within(screen.getByRole('dialog', { name: 'Desativar Ana Teste?' }))
  expect(janela.getByText('Ana Teste perde o acesso.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('o botão da ação confirma e pede para fechar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  expect(aoConfirmar).toHaveBeenCalledTimes(1)
  expect(aoFechar).toHaveBeenCalled()
})

test('Cancelar fecha sem confirmar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(aoConfirmar).not.toHaveBeenCalled()
  expect(aoFechar).toHaveBeenCalled()
})

test('Esc (o navegador fecha o <dialog>) pede para fechar sem confirmar', () => {
  const { aoConfirmar, aoFechar } = montar(true)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(aoFechar).toHaveBeenCalled()
  expect(aoConfirmar).not.toHaveBeenCalled()
})
```

- [x] **Passo 4: rodar e ver falhar.** `npx vitest run src/components/administracao/JanelaDeConfirmacao.test.tsx` — esperado: falha por `JanelaDeConfirmacao` não existir.
- [x] **Passo 5: implementar.** Crie `src/components/administracao/JanelaDeConfirmacao.tsx`:

```tsx
import { useEffect, useId, useRef } from 'react'

type JanelaDeConfirmacaoProps = {
  aberta: boolean
  titulo: string
  texto: string
  rotuloDaAcao: string
  aoConfirmar: () => void
  aoFechar: () => void
}

// <dialog> nativo: o navegador cuida do fundo esmaecido, do Esc e de devolver o foco ao botão de origem.
// O foco abre no Cancelar para que um Enter por reflexo não grave nada (ADR 0003).
export function JanelaDeConfirmacao({ aberta, titulo, texto, rotuloDaAcao, aoConfirmar, aoFechar }: JanelaDeConfirmacaoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const botaoCancelar = useRef<HTMLButtonElement>(null)
  const idDoTitulo = useId()

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    if (aberta && !dialogo.open) {
      dialogo.showModal()
      botaoCancelar.current?.focus()
    }
    if (!aberta && dialogo.open) dialogo.close()
  }, [aberta])

  const confirmar = () => {
    aoFechar()
    aoConfirmar()
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      <p>{texto}</p>
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" onClick={confirmar}>{rotuloDaAcao}</button>
        <button ref={botaoCancelar} type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
```

- [x] **Passo 6: CSS.** Acrescente ao fim de `Administracao.css`:

```css
.janela-confirmacao {
  max-width: 44ch;
  padding: var(--esp-5);
  border: 1px solid var(--linha);
  border-radius: var(--canto);
  background: var(--folha);
  color: var(--texto);
}

.janela-confirmacao::backdrop {
  background: rgb(30 36 51 / 45%);
}

.janela-confirmacao-titulo {
  margin: 0 0 var(--esp-2);
  font-size: var(--tam-base);
}

.janela-confirmacao-botoes {
  display: flex;
  gap: var(--esp-2);
  margin-top: var(--esp-4);
}
```

  O foco visível do Cancelar vem de `:focus-visible` global em `src/index.css:61`; se na conferência na tela não estiver nítido, ajuste ali na tarefa 4.
- [x] **Passo 7: rodar e ver passar.** Mesmo comando do Passo 4. Se `queryByRole('dialog')` fechada ainda achar o elemento (jsdom sem `display: none`), troque o primeiro teste para `expect((document.querySelector('dialog') as HTMLDialogElement).open).toBe(false)` e o `getByRole('dialog')` dos outros por `{ hidden: false }` equivalente — o importante é provar aberto e fechado.
- [x] **Passo 8: commit.** `git add src/configurarTestes.ts vite.config.ts src/components/administracao && git commit -m "Janela de confirmação nativa para ações que tiram acesso"`.

---

### Tarefa 2: Excluir e Desativar pedem confirmação — C1, C2, C3, C4, C7

- [x] **Passo 1: testes que falham.** Crie `src/App.confirmacao.test.tsx` (mesmo cenário de `App.gestaoDeUsuarios.test.tsx`: copie `ANA`, `BETO`, `AGUARDANDO`, `LINHAS`, `abrirComoAdministrador` e `linhaDe` de lá, com `beforeEach`/`afterEach` do hash `#/administracao`). Testes:

```tsx
function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

test('Excluir abre a janela com o texto da spec e não grava antes de confirmar', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  expect(screen.getByRole('dialog', { name: `Excluir a autorização de ${AGUARDANDO}?` })).toBeTruthy()
  expect(janelaAberta().getByText('A pessoa não conseguirá entrar. Para permitir de novo, autorize o e-mail outra vez.')).toBeTruthy()
  expect(document.activeElement).toBe(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(acesso.linhas.some((linha) => linha.email === AGUARDANDO)).toBe(true)
})

test('confirmar Excluir grava e fecha a janela', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir autorização' }))
  await waitFor(() => expect(screen.queryByText(AGUARDANDO)).toBeNull())
  expect(acesso.linhas.some((linha) => linha.email === AGUARDANDO)).toBe(false)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('Cancelar e Esc fecham a janela de Excluir sem gravar', async () => {
  const acesso = await abrirComoAdministrador()
  const excluir = screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` })
  fireEvent.click(excluir)
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(excluir)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(acesso.linhas.some((linha) => linha.email === AGUARDANDO)).toBe(true)
})

test('Desativar abre a janela com o texto da spec; confirmar grava', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(screen.getByRole('dialog', { name: 'Desativar Ana Teste?' })).toBeTruthy()
  expect(janelaAberta().getByText('Ana Teste perde o acesso à plataforma. O nome e o histórico continuam registrados, e você pode reativar depois.')).toBeTruthy()
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Desativar' }))
  expect(await screen.findByRole('button', { name: `Reativar ${ANA}` })).toBeTruthy()
})

test('Cancelar Desativar não grava', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(linhaDe(ANA).getByText('Ativo')).toBeTruthy()
})

test('falha na gravação confirmada aparece como alerta', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Desativar' }))
  expect(await screen.findByText('A alteração não foi salva: sem conexão.')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('Reativar grava com um clique, sem janela', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(await screen.findByRole('button', { name: `Desativar ${BETO}` })).toBeTruthy()
})
```

  (importar `act` junto com `cleanup, fireEvent, render, screen, waitFor, within`.)
- [x] **Passo 2: rodar e ver falhar.** `npx vitest run src/App.confirmacao.test.tsx` — esperado: falha (não há janela).
- [x] **Passo 3: implementar em `LinhaDaTabelaDeUsuarios.tsx`.** Em `BotoesDaLinha`, guarde `const [confirmando, setConfirmando] = useState(false)` e troque os dois `onClick` de Excluir e Desativar por `() => setConfirmando(true)`; Reativar continua chamando `acoes.aoReativar` direto. Renderize ao lado do botão uma `JanelaDeConfirmacao` com `aberta={confirmando}`, `aoFechar={() => setConfirmando(false)}` e:
  - Excluir: `titulo={`Excluir a autorização de ${linha.email}?`}`, `texto` e `rotuloDaAcao="Excluir autorização"` da spec, `aoConfirmar={() => acoes.aoExcluir(linha.email)}`.
  - Desativar (só quando `ativo`): `const nome = linha.nome ?? linha.email`; `titulo={`Desativar ${nome}?`}`, `texto={`${nome} perde o acesso à plataforma. O nome e o histórico continuam registrados, e você pode reativar depois.`}`, `rotuloDaAcao="Desativar"`, `aoConfirmar={() => acoes.aoDesativar(linha.chave)}`.
  Para manter as funções com até 20 linhas, divida `BotoesDaLinha` em `BotaoExcluirAutorizacao` (linha aguardando) e `BotoesDoUsuario` (Corrigir nome + Desativar/Reativar), cada um com seu próprio estado `confirmando`.
- [x] **Passo 4: rodar e ver passar.** `npx vitest run src/App.confirmacao.test.tsx`.
- [x] **Passo 5: ajustar os testes antigos.** Rode `npx vitest run` e, para cada teste que agora falha por clicar em Excluir ou Desativar sem confirmar (esperados: em `src/App.autorizacoes.test.tsx` "exclui uma autorização aguardando" e "falha ao excluir…"; em `src/App.gestaoDeUsuarios.test.tsx` "desativa um usuário ativo" e as três travas/falhas que clicam em `Desativar`; confira também `App.historico.test.tsx` e `App.administracao.test.tsx` com `grep -n "Excluir\|Desativar"`), acrescente depois do clique a confirmação:
  `fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir autorização' }))` (ou `'Desativar'`). Não mude as expectativas.
- [x] **Passo 6: rodar tudo.** `npm test` — esperado: tudo verde.
- [x] **Passo 7: commit.** `git add src && git commit -m "Excluir autorização e Desativar pedem confirmação em janela"`.

---

### Tarefa 3: Cores das mensagens — C6, C7

- [ ] **Passo 1: teste que falha.** Crie `src/App.coresDasMensagens.test.tsx`. As classes são o contrato de cor: `administracao-erro` e `administracao-falha` = vermelho, `administracao-sem-permissao` = amarelo. Casos (reaproveite os utilitários de `App.gestaoDeUsuarios.test.tsx`; para os erros de carregamento use os mesmos recursos de falha do `AcessoFalso` que `App.administracao.test.tsx` e `App.historico.test.tsx` já usam — leia esses dois arquivos antes e copie o jeito):
  1. erro ao carregar a lista: o `alert` "Não foi possível carregar os usuários…" tem classe `administracao-erro`;
  2. erro ao carregar o histórico: idem para "Não foi possível carregar o histórico…";
  3. erro de gravação (ex.: `falhaDeGravacao = 'sem conexão'` e Salvar perfil): a mensagem tem classe `administracao-falha`;
  4. recusa de trava (`TravaDoBanco('Você não pode desativar a si mesmo.')`): idem `administracao-falha`;
  5. perfil sem permissão (usuário `integrante_ep` em `#/administracao`): o texto "não permite administrar usuários" tem classe `administracao-sem-permissao`.
  Cada teste: `expect(elemento.className).toContain('…')` (ou `classList.contains`).
- [ ] **Passo 2: rodar.** Os casos 1 a 5 já podem passar (as classes existem hoje, todas amarelas); o teste prova o contrato. Para cobrir a mudança de cor, acrescente o sexto teste, que lê o CSS:

```tsx
import { readFileSync } from 'node:fs'
test('o CSS pinta falha e erro com as cores de atraso e deixa o aviso em pendência', () => {
  const css = readFileSync('src/components/administracao/Administracao.css', 'utf8')
  const regra = (seletor: string) => css.split('}').find((bloco) => bloco.includes(seletor)) ?? ''
  expect(regra('.administracao-falha')).toContain('--atraso-fundo')
  expect(regra('.administracao-erro')).toContain('--atraso-texto')
  expect(regra('.administracao-sem-permissao')).toContain('--pendencia-fundo')
})
```

  Se o `regra` pegar o bloco errado por causa dos seletores agrupados, separe as regras no CSS (Passo 3) de modo que cada classe tenha o seu bloco. Esperado agora: o sexto teste falha.
- [ ] **Passo 3: CSS.** Em `Administracao.css`, troque o bloco agrupado por:

```css
.administracao-sem-permissao,
.administracao-erro,
.administracao-falha {
  padding: var(--esp-3) var(--esp-4);
  border-radius: var(--canto);
  color: var(--texto);
}

/* Aviso (amarelo): só o que informa sem dizer que algo falhou. */
.administracao-sem-permissao {
  margin: var(--esp-5);
  max-width: 60ch;
  background: var(--pendencia-fundo);
  border: 1px solid var(--pendencia-borda);
}

/* "A ação não aconteceu" (vermelho): as mesmas cores de atraso da tela de entrada. */
.administracao-erro,
.administracao-falha {
  background: var(--atraso-fundo);
  color: var(--atraso-texto);
}
```

  Se o teste do Passo 2 não achar `--atraso-fundo` em blocos agrupados, ajuste a função `regra` para procurar o bloco que contém o seletor *e* a propriedade (por exemplo, `css.split('}').filter(...).join()`), sem duplicar CSS só para o teste.
- [ ] **Passo 4: rodar e ver passar.** `npx vitest run src/App.coresDasMensagens.test.tsx`, depois `npm test`.
- [ ] **Passo 5: commit.** `git add src && git commit -m "Falhas da Administração em vermelho; aviso de perfil continua amarelo"`.

---

### Tarefa 4: Verificação completa e conferência na tela — C5, C8

- [ ] **Passo 1:** `npm test`, `npx tsc --noEmit -b` (ou o script de tipos do `package.json`) e `npm run lint`. Esperado: tudo verde; se um limite do ESLint barrar, extraia função com nome próprio.
- [ ] **Passo 2:** cobertura (`npm run test:coverage` ou o script equivalente): confirmar `JanelaDeConfirmacao.tsx` e `LinhaDaTabelaDeUsuarios.tsx` com 100% de instruções e total acima de 70%.
- [ ] **Passo 3 (`[visual]`, com o usuário):** o usuário abre a plataforma, entra com o Google, vai em **Administração** na faixa lateral e confere, numa linha de teste (sem tirar captura da tabela com nomes reais; recortar ou usar só a janela): (a) Excluir/Desativar abrem a janela com fundo esmaecido, botão principal azul e o foco visível no Cancelar; Esc e Cancelar fecham; (b) uma falha (ex.: tentar desativar a si mesmo) aparece em vermelho; (c) a tela de perfil sem permissão (entrar com um perfil Consulta) segue amarela. Se o foco do Cancelar não estiver nítido, ajuste `:focus-visible` em `src/index.css` para a janela e repita.
- [ ] **Passo 4:** marcar os critérios do ticket (C1 a C8) em `.scratch/login-perfis/issues/07-confirmacao-e-cores.md`, atualizar a spec se algo divergiu (relatar, não corrigir sozinho) e comitar.
