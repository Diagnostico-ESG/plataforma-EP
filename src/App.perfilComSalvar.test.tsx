import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import css from './components/administracao/Administracao.css?raw'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'
import { regrasDaClasse } from './testes/regrasDaClasse'

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
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} />)
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

// O jsdom não calcula layout: o teste confere a regra do CSS. Com quebra livre (flex-wrap), o Cancelar descia
// sozinho para a linha de baixo quando a coluna Perfil ficava estreita (conferência na tela do /ship, 2026-10-08).
test('seletor, Salvar e Cancelar ficam numa linha só, e só a falha desce', () => {
  expect(regrasDaClasse(css, '.perfil-da-linha')).toContain('grid-template-columns: repeat(3, auto)')
  expect(regrasDaClasse(css, '.perfil-da-linha')).not.toContain('flex-wrap')
  expect(regrasDaClasse(css, '.perfil-da-linha .administracao-falha')).toContain('grid-column: 1 / -1')
})

// Sem isso, uma falha longa (a trava do último administrador traz o nome) alargava as colunas e afastava os botões.
test('a falha do perfil quebra o texto em vez de alargar as colunas', () => {
  expect(regrasDaClasse(css, '.perfil-da-linha .administracao-falha')).toContain('width: 0')
  expect(regrasDaClasse(css, '.perfil-da-linha .administracao-falha')).toContain('min-width: 100%')
})
