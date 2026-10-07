import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(cleanup)

test('abre no Quadro de processos, marcado na navegação', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Processos' })).toBeTruthy()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const quadro = within(navegacao).getByRole('button', { name: 'Quadro' })
  expect(quadro.getAttribute('aria-current')).toBe('page')
})

test('a navegação lateral tem as seis áreas do sistema', () => {
  render(<App />)
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const rotulos = Array.from(navegacao.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))
  expect(rotulos).toEqual(['Quadro', 'Lista', 'Setores', 'Reuniões', 'Painel', 'Administração'])
})

test('sem processos, mostra o aviso de vazio com a ação de cadastrar', () => {
  render(<App />)
  expect(screen.getByText(/Nenhum processo cadastrado ainda/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Cadastrar processo' })).toBeTruthy()
})
