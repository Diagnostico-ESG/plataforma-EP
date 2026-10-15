import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = 'ana.teste@ccivil.pr.gov.br'
const BETO = 'beto.teste@ccivil.pr.gov.br'
const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'
const LINHAS: LinhaDeUsuario[] = [
  { chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u-ana', nome: 'Ana Teste', email: ANA, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' },
  { chave: 'u-beto', nome: 'Beto Teste', email: BETO, fotoUrl: null, perfil: 'integrante_ep', situacao: 'inativo' },
]

async function abrirComoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  render(<App acesso={acesso} cadastros={new CadastrosFalso()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} />)
  await screen.findByRole('table', { busy: false })
  return acesso
}

function linhaDe(email: string) {
  return within(screen.getByText(email).closest('tr') as HTMLElement)
}

function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

function apertarEsc() {
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
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
  apertarEsc()
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

test('Cancelar e Esc em Desativar não gravam', async () => {
  await abrirComoAdministrador()
  const desativar = screen.getByRole('button', { name: `Desativar ${ANA}` })
  fireEvent.click(desativar)
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  fireEvent.click(desativar)
  apertarEsc()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(linhaDe(ANA).getByText('Ativo')).toBeTruthy()
})

test('falha ao Desativar confirmado fecha a janela e aparece na linha da pessoa', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Desativar' }))
  expect((await linhaDe(ANA).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('uma nova tentativa que dá certo tira a falha da linha', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  await linhaDe(BETO).findByRole('alert')
  acesso.falhaDeGravacao = null
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  await screen.findByRole('button', { name: `Desativar ${BETO}` })
  expect(linhaDe(BETO).queryByRole('alert')).toBeNull()
})

test('falha ao Excluir confirmado aparece na linha da autorização', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir autorização' }))
  expect((await linhaDe(AGUARDANDO).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('falha ao Reativar aparece na linha da pessoa', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'sem conexão'
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect((await linhaDe(BETO).findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
})

test('Reativar grava com um clique, sem janela', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(await screen.findByRole('button', { name: `Desativar ${BETO}` })).toBeTruthy()
})
