import { expect, test } from 'vitest'
import { rotuloDoRelatorio } from './rotuloDoRelatorio'

test('o relatório numerado se escreve com R', () => {
  expect(rotuloDoRelatorio(2)).toBe('Relatório R2')
  expect(rotuloDoRelatorio(12)).toBe('Relatório R12')
})
