import { describe, expect, test } from 'vitest'
import { hojeLocal } from './textoDaModelagemPiloto'

describe('hoje no relógio de quem usa', () => {
  test('o dia local, mesmo perto da meia-noite', () => {
    expect(hojeLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
