import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'

afterEach(cleanup)

async function abrirLogado(acesso = AcessoFalso.logadoComo()) {
  render(<App acesso={acesso} />)
  return screen.findByRole('button', { name: 'Sua conta: Pessoa de Teste' })
}

test('o avatar com as iniciais ocupa o lugar do ícone de conta', async () => {
  const botaoDaConta = await abrirLogado()
  expect(within(botaoDaConta).getByRole('img', { name: 'Pessoa de Teste' }).textContent).toBe('PT')
  expect(screen.queryByRole('button', { name: 'Sua conta' })).toBeNull()
})

test('o menu da conta mostra nome, perfil e Sair, e fecha com Escape', async () => {
  fireEvent.click(await abrirLogado())
  expect(screen.getByText('Pessoa de Teste')).toBeTruthy()
  expect(screen.getByText('Integrante do EP')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Sair' }), { key: 'Escape' })
  expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
})

test('Sair encerra a sessão e volta à tela de entrada', async () => {
  const acesso = AcessoFalso.logadoComo()
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('button', { name: 'Entrar com a conta institucional' })).toBeTruthy()
  expect(acesso.chamadas.sair).toBe(1)
})
