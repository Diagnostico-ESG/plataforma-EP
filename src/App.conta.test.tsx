import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import css from './components/moldura/Moldura.css?raw'

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

test('fechar o menu com Escape devolve o foco ao avatar', async () => {
  const botaoDaConta = await abrirLogado()
  fireEvent.click(botaoDaConta)
  const sair = screen.getByRole('button', { name: 'Sair' })
  sair.focus()
  fireEvent.keyDown(sair, { key: 'Escape' })
  expect(document.activeElement).toBe(botaoDaConta)
})

test('Sair encerra a sessão e volta à tela de entrada', async () => {
  const acesso = AcessoFalso.logadoComo()
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('button', { name: 'Entrar com a conta institucional' })).toBeTruthy()
  expect(acesso.chamadas.sair).toBe(1)
})

test('Sair com falha mantém a pessoa dentro e mostra a falha em vermelho', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falharSair = true
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  const falha = await screen.findByRole('alert')
  expect(falha.textContent).toBe('Não foi possível sair. Verifique a conexão e tente de novo.')
  expect(falha.className).toContain('menu-conta-falha')
  expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Entrar com a conta institucional' })).toBeNull()
})

test('Sair de novo depois de uma falha tira a mensagem e encerra a sessão', async () => {
  const acesso = AcessoFalso.logadoComo()
  acesso.falharSair = true
  fireEvent.click(await abrirLogado(acesso))
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  await screen.findByRole('alert')
  acesso.falharSair = false
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('button', { name: 'Entrar com a conta institucional' })).toBeTruthy()
  expect(acesso.chamadas.sair).toBe(2)
})

test('o CSS pinta a falha do Sair com as cores de atraso (vermelho)', () => {
  const bloco = css.split('}').find((trecho) => trecho.split('{')[0].includes('.menu-conta-falha')) ?? ''
  expect(bloco).toContain('--atraso-fundo')
  expect(bloco).toContain('--atraso-texto')
})
