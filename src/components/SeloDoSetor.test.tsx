import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { SeloDoSetor } from './SeloDoSetor'

afterEach(cleanup)

test('o selo mostra a sigla e carrega os dois tons da cor, sem acrescentar nome acessível', () => {
  render(<SeloDoSetor sigla="TSA" cor={13} />)
  const selo = screen.getByText('TSA')
  expect(selo.getAttribute('aria-label')).toBeNull()
  expect(selo.textContent).toBe('TSA')
  expect(selo.style.getPropertyValue('--cor-claro')).toBe('#C4D9F8')
  expect(selo.style.getPropertyValue('--cor-escuro')).not.toBe('')
})

test('a variante faixa troca só a classe', () => {
  render(<SeloDoSetor sigla="TSA" cor={1} variante="faixa" />)
  expect(screen.getByText('TSA').className).toContain('selo-do-setor-faixa')
})
