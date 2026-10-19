import { expect, test } from 'vitest'
import { corDoMacroprocesso } from './corDoMacroprocesso'

const CORES = ['violeta', 'ciano', 'magenta', 'indigo', 'oliva', 'cobre'].map((nome) => `var(--macro-${nome})`)

test('o mesmo macroprocesso tem sempre a mesma cor', () => {
  expect(corDoMacroprocesso('m1')).toBe(corDoMacroprocesso('m1'))
})

test('toda cor é uma das seis de macroprocesso da identidade', () => {
  for (const id of ['m1', 'm2', 'abc', '3f2a9c10-0000-4000-8000-000000000001']) expect(CORES).toContain(corDoMacroprocesso(id))
})

test('macroprocessos diferentes se espalham pelas cores', () => {
  const amostra = Array.from({ length: 12 }, (_, i) => `m${i + 1}`)
  expect(new Set(amostra.map(corDoMacroprocesso)).size).toBeGreaterThanOrEqual(4)
})
