import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { Setor } from './cadastros/tipos'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETORES: Setor[] = [
  { id: 's1', sigla: 'AFT', nome: 'Assessoria Fictícia de Teste', observacoes: null, ativo: true },
  { id: 's2', sigla: 'CIT', nome: 'Coordenação Inventada de Teste', observacoes: 'Nota inventada', ativo: true },
  { id: 's3', sigla: 'EXT', nome: 'Setor Extinto de Teste', observacoes: null, ativo: false },
]

function cadastrosComSetores() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...SETORES]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep', cadastros = cadastrosComSetores()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} />)
  return cadastros
}

function abas() {
  return within(screen.getByRole('navigation', { name: 'Seções de Setores' }))
}

test.each<Perfil>(['administrador', 'integrante_ep', 'consulta'])('o item Setores da faixa abre a área para %s', async (perfil) => {
  window.location.hash = ''
  montar(perfil)
  fireEvent.click(await screen.findByRole('button', { name: 'Setores' }))
  expect(await screen.findByRole('navigation', { name: 'Seções de Setores' })).toBeTruthy()
  expect(window.location.hash).toBe('#/setores')
})

test('o endereço #/setores abre a área direto, com a aba Setores destacada', async () => {
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getAllByRole('link').map((aba) => aba.textContent)).toEqual(['Setores', 'Macroprocessos', 'Histórico'])
  expect(abas().getByRole('link', { name: 'Setores' }).getAttribute('aria-current')).toBe('page')
})

test('trocar de aba põe a aba no endereço e a destaca', async () => {
  montar()
  fireEvent.click(await screen.findByRole('link', { name: 'Macroprocessos' }))
  await waitFor(() => expect(abas().getByRole('link', { name: 'Macroprocessos' }).getAttribute('aria-current')).toBe('page'))
  expect(window.location.hash).toBe('#/setores/macroprocessos')
  expect(screen.getByText('Esta seção chega numa próxima entrega.')).toBeTruthy()
})

test('o endereço da aba Histórico sobrevive ao recarregar', async () => {
  window.location.hash = '#/setores/historico'
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getByRole('link', { name: 'Histórico' }).getAttribute('aria-current')).toBe('page')
})
