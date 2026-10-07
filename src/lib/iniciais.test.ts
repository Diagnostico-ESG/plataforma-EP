import { expect, test } from 'vitest'
import { iniciais } from './iniciais'

test('usa a primeira letra do primeiro e do último nome', () => {
  expect(iniciais('Maria Clara Souza')).toBe('MS')
})

test('ignora preposições no fim do nome', () => {
  expect(iniciais('João da Silva e')).toBe('JS')
})

test('nome de uma palavra só gera uma inicial', () => {
  expect(iniciais('ana')).toBe('A')
})

test('nome vazio gera interrogação', () => {
  expect(iniciais('   ')).toBe('?')
})
