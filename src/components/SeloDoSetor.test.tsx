import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { SeloDoSetor } from './SeloDoSetor'

afterEach(cleanup)

test('o selo mostra a sigla, sem acrescentar nome acessível e sem cor própria do setor', () => {
  render(<SeloDoSetor sigla="TSA" />)
  const selo = screen.getByText('TSA')
  expect(selo.getAttribute('aria-label')).toBeNull()
  expect(selo.textContent).toBe('TSA')
  expect(selo.getAttribute('style')).toBeNull()
})

test('com o nome, o selo o mostra ao passar o mouse e o diz ao leitor de tela', () => {
  render(<SeloDoSetor sigla="TSA" nome="Setor de Testes A" />)
  const selo = screen.getByRole('img', { name: 'Setor de Testes A' })
  expect(selo.getAttribute('title')).toBe('Setor de Testes A')
  expect(selo.textContent).toBe('TSA')
})
