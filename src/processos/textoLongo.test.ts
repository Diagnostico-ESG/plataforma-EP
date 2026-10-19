import { expect, test } from 'vitest'
import { ehTextoLongo } from './textoLongo'

test('passa de 240 caracteres: é longo', () => {
  expect(ehTextoLongo('a'.repeat(240))).toBe(false)
  expect(ehTextoLongo('a'.repeat(241))).toBe(true)
})

test('quatro linhas ou mais, mesmo curtas: é longo', () => {
  expect(ehTextoLongo('um\ndois\ntrês')).toBe(false)
  expect(ehTextoLongo('um\ndois\ntrês\nquatro')).toBe(true)
})
