# Ticket 06 (Mudar perfil só com Salvar) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** o seletor de perfil de cada linha da tabela de usuários guarda a escolha só na tela; a gravação acontece no [Salvar].

**Arquitetura:** componente novo `PerfilDaLinha` (no padrão do `CorrecaoDeNome`) com a escolha, a mensagem e o "enviando" no próprio estado. `LinhaDaTabelaDeUsuarios` passa a usá-lo no lugar do `SeletorDePerfil` direto. `AreaDeUsuarios` deixa de mandar a mudança de perfil pelo `gravarNaLinha` (falha acima da tabela) e devolve a promessa do `gravar`, como já faz no Corrigir nome; a falha volta para a linha. Depois de salvar, a lista relida traz o perfil novo e os botões somem sozinhos (escolha = gravado). Nada muda no banco.

**Tecnologia:** React + Vitest + Testing Library (aplicativo inteiro com `AcessoFalso`).

**Requisitos:** `.scratch/login-perfis/issues/06-mudar-perfil-com-salvar.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (histórias 47 a 49; "Mudar perfil numa linha").

## Restrições globais

- Sem migração, sem dependência nova. Não mexe em banco, login nem arquivos: `.claude/regras/banco.md` não se aplica.
- Funções de 4 a 20 linhas, complexidade até 10, arquivos até 300 linhas (ESLint no pre-commit).
- Mensagem de falha com `textoDaFalha` (`src/acesso/falhasDeGravacao.ts`): trava vem como frase pronta; os demais erros como "A alteração não foi salva: …".
- O seletor do formulário "Autorizar e-mail" (`FormularioDeAutorizacao`) não muda (critério 6).

## Decisões de execução

- **Nomes acessíveis dos botões:** texto visível "Salvar" e "Cancelar"; `aria-label` "Salvar perfil de {e-mail}" e "Cancelar perfil de {e-mail}", para não confundir com o Salvar do Corrigir nome nem entre linhas (o nome acessível começa pelo texto visível).
- **Prova de "grava uma vez" (critério 3):** contador `chamadas.mudarPerfil` no `AcessoFalso`, somado nos dois métodos de mudança de perfil. Um evento por gravação é garantido pelo banco (gatilho do ticket 04); a tela prova que chama uma vez só.
- **Setas do teclado (critério 1):** no navegador, cada seta dispara `change`; o teste simula duas trocas seguidas com `fireEvent.change` e confere que nada foi gravado.
- **Falha (critério 5):** mensagem dentro do `PerfilDaLinha` (`role="alert"`), não mais acima da tabela. Salvar fica desligado só enquanto envia.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/components/administracao/PerfilDaLinha.tsx` (novo) | Seletor + [Salvar]/[Cancelar] + mensagem da linha |
| `src/components/administracao/LinhaDaTabelaDeUsuarios.tsx` | Usa `PerfilDaLinha`; `aoMudarPerfil` passa a devolver `Promise<void>` |
| `src/components/administracao/AreaDeUsuarios.tsx` | `aoMudarPerfil` com `gravar` (sem `gravarNaLinha`) |
| `src/components/administracao/Administracao.css` | `.perfil-da-linha` alinhado como `.correcao-de-nome` |
| `src/acesso/AcessoFalso.ts` | Contador `chamadas.mudarPerfil` |
| `src/App.perfilComSalvar.test.tsx` (novo) | Critérios 1 a 5 e 7, com linha de usuário e de autorização |
| `src/App.gestaoDeUsuarios.test.tsx`, `src/App.autorizacoes.test.tsx` | Testes antigos de perfil passam a clicar em Salvar |

### Tarefa 1: Perfil com Salvar e Cancelar

- [ ] **1.1 Teste que falha.** Criar `src/App.perfilComSalvar.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = 'ana.teste@ccivil.pr.gov.br'
const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'
const LINHAS: LinhaDeUsuario[] = [
  { chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u-ana', nome: 'Ana Teste', email: ANA, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' },
]

async function abrirComoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  render(<App acesso={acesso} />)
  await screen.findByRole('table', { busy: false })
  return acesso
}

function escolher(email: string, perfil: Perfil) {
  fireEvent.change(screen.getByLabelText(`Perfil de ${email}`), { target: { value: perfil } })
}
function perfilNaTela(email: string) {
  return (screen.getByLabelText(`Perfil de ${email}`) as HTMLSelectElement).value
}
function perfilGravado(acesso: AcessoFalso, email: string) {
  return acesso.linhas.find((linha) => linha.email === email)?.perfil
}
function botoesDoPerfil(email: string) {
  const linha = within(screen.getByText(email).closest('tr') as HTMLElement)
  return {
    salvar: linha.queryByRole('button', { name: `Salvar perfil de ${email}` }),
    cancelar: linha.queryByRole('button', { name: `Cancelar perfil de ${email}` }),
  }
}

test.each([ANA, AGUARDANDO])('trocar a opção (como nas setas) não grava: %s', async (email) => {
  const acesso = await abrirComoAdministrador()
  escolher(email, 'integrante_ep')
  escolher(email, 'administrador')
  expect(perfilNaTela(email)).toBe('administrador')
  expect(acesso.chamadas.mudarPerfil).toBe(0)
  expect(perfilGravado(acesso, email)).toBe('consulta')
})

test('Salvar e Cancelar aparecem só com a escolha diferente do perfil gravado', async () => {
  await abrirComoAdministrador()
  expect(botoesDoPerfil(ANA).salvar).toBeNull()
  escolher(ANA, 'integrante_ep')
  expect(botoesDoPerfil(ANA).salvar).toBeTruthy()
  expect(botoesDoPerfil(ANA).cancelar).toBeTruthy()
  escolher(ANA, 'consulta')
  expect(botoesDoPerfil(ANA).salvar).toBeNull()
  expect(botoesDoPerfil(ANA).cancelar).toBeNull()
})

test.each([ANA, AGUARDANDO])('Salvar grava uma vez e esconde os botões: %s', async (email) => {
  const acesso = await abrirComoAdministrador()
  escolher(email, 'integrante_ep')
  escolher(email, 'administrador')
  fireEvent.click(botoesDoPerfil(email).salvar as HTMLElement)
  await waitFor(() => expect(botoesDoPerfil(email).salvar).toBeNull())
  expect(acesso.chamadas.mudarPerfil).toBe(1)
  expect(perfilGravado(acesso, email)).toBe('administrador')
  expect(perfilNaTela(email)).toBe('administrador')
})

test('Cancelar volta ao perfil gravado sem gravar', async () => {
  const acesso = await abrirComoAdministrador()
  escolher(ANA, 'administrador')
  fireEvent.click(botoesDoPerfil(ANA).cancelar as HTMLElement)
  expect(perfilNaTela(ANA)).toBe('consulta')
  expect(botoesDoPerfil(ANA).salvar).toBeNull()
  expect(acesso.chamadas.mudarPerfil).toBe(0)
})

test.each<[string, string | Error, string]>([
  ['sem conexão', 'erro inesperado do banco (Failed to fetch)',
    'A alteração não foi salva: erro inesperado do banco (Failed to fetch).'],
  ['recusa de trava', new TravaDoBanco('Você não pode mudar o seu próprio perfil.'),
    'Você não pode mudar o seu próprio perfil.'],
])('Salvar com falha (%s) mantém a escolha, mostra a mensagem na linha e os botões', async (_, falha, texto) => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = falha
  escolher(ANA, 'administrador')
  fireEvent.click(botoesDoPerfil(ANA).salvar as HTMLElement)
  const linha = within(screen.getByText(ANA).closest('tr') as HTMLElement)
  expect(await linha.findByText(texto)).toBeTruthy()
  expect(perfilNaTela(ANA)).toBe('administrador')
  expect((botoesDoPerfil(ANA).salvar as HTMLButtonElement).disabled).toBe(false)
  expect(botoesDoPerfil(ANA).cancelar).toBeTruthy()
})
```

- [ ] **1.2 Ver falhar.** `npx vitest run src/App.perfilComSalvar.test.tsx`. Esperado: falha (`chamadas.mudarPerfil` indefinido / botões ausentes / gravação imediata).
- [ ] **1.3 Contador no falso.** Em `src/acesso/AcessoFalso.ts`: `chamadas = { entrarComGoogle: 0, sair: 0, listarHistorico: 0, mudarPerfil: 0 }` e `this.chamadas.mudarPerfil++` na primeira linha de `mudarPerfilDaAutorizacao` e de `mudarPerfilDoUsuario`.
- [ ] **1.4 Componente.** Criar `src/components/administracao/PerfilDaLinha.tsx`:

```tsx
import { useState } from 'react'
import { textoDaFalha } from '../../acesso/falhasDeGravacao'
import type { Perfil } from '../../acesso/tipos'
import { SeletorDePerfil } from './SeletorDePerfil'

type PerfilDaLinhaProps = { email: string; perfilGravado: Perfil; aoSalvar: (perfil: Perfil) => Promise<void> }

// Escolher não grava (no Windows cada seta do teclado troca a opção); só o Salvar grava (ADR 0003).
// Depois de salvar, a lista relida traz o perfil novo e os botões somem, porque a escolha fica igual ao gravado.
export function PerfilDaLinha({ email, perfilGravado, aoSalvar }: PerfilDaLinhaProps) {
  const [escolha, setEscolha] = useState(perfilGravado)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar() {
    setAviso(null)
    setEnviando(true)
    try {
      await aoSalvar(escolha)
    } catch (erro) {
      setAviso(textoDaFalha(erro))
    } finally {
      setEnviando(false)
    }
  }

  function cancelar() {
    setEscolha(perfilGravado)
    setAviso(null)
  }

  return (
    <span className="perfil-da-linha">
      <SeletorDePerfil rotulo={`Perfil de ${email}`} valor={escolha} aoMudar={setEscolha} />
      {escolha !== perfilGravado && (
        <>
          <button type="button" className="botao botao-principal" aria-label={`Salvar perfil de ${email}`}
            disabled={enviando} onClick={salvar}>Salvar</button>
          <button type="button" className="botao botao-secundario" aria-label={`Cancelar perfil de ${email}`}
            onClick={cancelar}>Cancelar</button>
        </>
      )}
      {aviso && <p className="administracao-falha" role="alert">{aviso}</p>}
    </span>
  )
}
```

- [ ] **1.5 Ligar na linha.** Em `LinhaDaTabelaDeUsuarios.tsx`: `aoMudarPerfil: (linha: LinhaDeUsuario, perfil: Perfil) => Promise<void>`; trocar o `SeletorDePerfil` da coluna Perfil por `<PerfilDaLinha email={linha.email} perfilGravado={linha.perfil} aoSalvar={(perfil) => acoes.aoMudarPerfil(linha, perfil)} />` e o import correspondente.
- [ ] **1.6 Ligar na área.** Em `AreaDeUsuarios.tsx`: `aoMudarPerfil={(linha, perfil) => gravar(() => (linha.situacao === 'aguardando' ? acesso.mudarPerfilDaAutorizacao(linha.email, perfil) : acesso.mudarPerfilDoUsuario(linha.chave, perfil)))}`. Se passar de 20 linhas na função, extrair `mudarPerfil(linha, perfil)` como função interna.
- [ ] **1.7 CSS.** Em `Administracao.css`, acrescentar `.perfil-da-linha` aos seletores de `.tabela-usuarios-acoes, .correcao-de-nome` (inline-flex, quebra, gap) e de `.correcao-de-nome .administracao-falha` (mensagem em linha própria).
- [ ] **1.8 Ver passar.** `npx vitest run src/App.perfilComSalvar.test.tsx`. Esperado: todos passam.
- [ ] **1.9 Testes antigos.** `npm test`. Esperado: falham os 4 testes de perfil antigos (gravavam na troca). Atualizar:
  - `App.gestaoDeUsuarios.test.tsx` "muda o perfil de um usuário": depois do `change`, `fireEvent.click(screen.getByRole('button', { name: \`Salvar perfil de ${ANA}\` }))`.
  - `App.gestaoDeUsuarios.test.tsx` "trava: mudar o próprio perfil…": idem; a última linha passa a esperar `'administrador'` (a escolha fica, critério 5).
  - `App.autorizacoes.test.tsx` "muda o perfil de uma autorização aguardando": clicar em `Salvar perfil de ${AGUARDANDO}`.
  - `App.autorizacoes.test.tsx` "falha ao mudar o perfil…": clicar em Salvar; renomear para "…mantém a escolha" e esperar `'administrador'` no seletor.
  Rodar `npm test` de novo. Esperado: tudo passa, inclusive o teste do formulário "Autorizar e-mail" (critério 6).
- [ ] **1.10 Lint e tipos.** `npm run lint` e `npx tsc -b` (ou o script de typecheck do `package.json`). Esperado: sem erro.
- [ ] **1.11 Commit.** `git add` dos arquivos da tabela acima e `git commit -m "Perfil da linha só grava no Salvar, com Cancelar e falha na própria linha"`.

### Tarefa 2: Conferência final

- [ ] **2.1 Cobertura.** `npm test -- --coverage`; informar a cobertura de `PerfilDaLinha.tsx` e revisar o que ficou sem teste.
- [ ] **2.2 Tela** (critérios 1 e 8; servidor na porta 5173, conferir antes quem ocupa a porta; a entrada pelo Google é do usuário). Pedir ao usuário, na Administração: (1) clicar no seletor de perfil de uma linha e percorrer as opções com as setas: nada é gravado e o histórico não muda; (2) Salvar e Cancelar aparecem ao lado do seletor, sem desalinhar a linha; (3) Salvar: os botões somem e aparece um evento só no histórico; (4) escolher outro e Cancelar: volta ao perfil gravado.
- [ ] **2.3 Registros.** Marcar os critérios do ticket 06; entrada datada no `.scratch/login-perfis/desvios.md` só se algo fugir do ticket ou da spec.
- [ ] **2.4 Commit** dos registros.
