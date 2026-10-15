import { expect, test } from 'vitest'
import { alternarMarcado } from './marcados'

test('marca o que não estava marcado, no fim da lista', () => {
  expect(alternarMarcado(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
})

test('desmarca o que estava marcado, mantendo a ordem dos outros', () => {
  expect(alternarMarcado(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
})

test('não altera a lista recebida', () => {
  const marcados = ['a']
  alternarMarcado(marcados, 'b')
  expect(marcados).toEqual(['a'])
})
