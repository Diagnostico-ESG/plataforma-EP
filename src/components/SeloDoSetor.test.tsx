import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { SeloDoSetor } from './SeloDoSetor'

afterEach(cleanup)

test('o selo mostra a sigla e carrega só a cor forte, sem acrescentar nome acessível', () => {
  render(<SeloDoSetor sigla="TSA" cor={13} />)
  const selo = screen.getByText('TSA')
  expect(selo.getAttribute('aria-label')).toBeNull()
  expect(selo.textContent).toBe('TSA')
  expect(selo.style.getPropertyValue('--cor-do-setor')).toBe('#881337')
})

test('o número 7 do banco e o 19 mostram a mesma cor, pelo ciclo de 12', () => {
  render(<><SeloDoSetor sigla="AAA" cor={7} /><SeloDoSetor sigla="BBB" cor={19} /></>)
  expect(screen.getByText('BBB').style.getPropertyValue('--cor-do-setor')).toBe(screen.getByText('AAA').style.getPropertyValue('--cor-do-setor'))
})
