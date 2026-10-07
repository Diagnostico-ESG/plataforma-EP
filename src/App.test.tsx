import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'

afterEach(cleanup)

async function abrirLogado() {
  render(<App acesso={AcessoFalso.logadoComo()} />)
  await screen.findByRole('heading', { name: 'Processos' })
}

test('abre no Quadro de processos, marcado na navegação', async () => {
  await abrirLogado()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const quadro = within(navegacao).getByRole('button', { name: 'Quadro' })
  expect(quadro.getAttribute('aria-current')).toBe('page')
})

test('a navegação lateral tem as seis áreas do sistema', async () => {
  await abrirLogado()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const rotulos = Array.from(navegacao.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))
  expect(rotulos).toEqual(['Quadro', 'Lista', 'Setores', 'Reuniões', 'Painel', 'Administração'])
})

test('sem processos, mostra o aviso de vazio com a ação de cadastrar', async () => {
  await abrirLogado()
  expect(screen.getByText(/Nenhum processo cadastrado ainda/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Cadastrar processo' })).toBeTruthy()
})
