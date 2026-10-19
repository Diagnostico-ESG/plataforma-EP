import { describe, expect, test } from 'vitest'
import { hojeLocal, momentoDaReuniao, textoDaReuniao } from './textoDaReuniao'

describe('texto da reunião de modelagem piloto', () => {
  test('sem data: não marcada', () => {
    expect(textoDaReuniao(null, '2026-10-14')).toBe('não marcada')
  })

  test('data futura: marcada para', () => {
    expect(textoDaReuniao('2026-10-20', '2026-10-14')).toBe('marcada para 20/10/2026')
  })

  test('data de hoje: ainda marcada para', () => {
    expect(textoDaReuniao('2026-10-14', '2026-10-14')).toBe('marcada para 14/10/2026')
  })

  test('data passada: realizada em', () => {
    expect(textoDaReuniao('2026-10-13', '2026-10-14')).toBe('realizada em 13/10/2026')
  })
})

describe('hoje no relógio de quem usa', () => {
  test('o dia local, mesmo perto da meia-noite', () => {
    expect(hojeLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('momento da reunião no verso', () => {
  test('sem data: nenhum', () => {
    expect(momentoDaReuniao(null, '2026-10-14')).toBeNull()
  })

  test('hoje e depois: próxima; antes de hoje: realizada', () => {
    expect(momentoDaReuniao('2026-10-14', '2026-10-14')).toBe('proxima')
    expect(momentoDaReuniao('2026-10-20', '2026-10-14')).toBe('proxima')
    expect(momentoDaReuniao('2026-10-13', '2026-10-14')).toBe('realizada')
  })
})
