import { expect, test } from 'vitest'
import { MARGEM_DA_BORDA, PASSO_DA_ROLAGEM, passoDaRolagemNaBorda } from './rolagemDoArrastar'

// O Quadro de 0 a 1000 px na horizontal.
const passo = (x: number) => passoDaRolagemNaBorda(x, 0, 1000)

test('perto da borda direita o Quadro rola para a direita', () => {
  expect(passo(1000 - MARGEM_DA_BORDA + 1)).toBe(PASSO_DA_ROLAGEM)
  expect(passo(999)).toBe(PASSO_DA_ROLAGEM)
})

test('perto da borda esquerda o Quadro rola para a esquerda', () => {
  expect(passo(MARGEM_DA_BORDA - 1)).toBe(-PASSO_DA_ROLAGEM)
  expect(passo(1)).toBe(-PASSO_DA_ROLAGEM)
})

test('longe das bordas o Quadro fica parado', () => {
  expect(passo(500)).toBe(0)
  expect(passo(MARGEM_DA_BORDA)).toBe(0)
  expect(passo(1000 - MARGEM_DA_BORDA)).toBe(0)
})
