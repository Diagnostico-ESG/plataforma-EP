import { expect, test } from 'vitest'
import { LIMITE_DE_DIAS_NA_ETAPA, diasNaEtapa, passouDoLimite, textoDosDias } from './diasNaEtapa'

test('conta os dias do início até hoje, atravessando mês e ano', () => {
  expect(diasNaEtapa('2026-10-01', '2026-10-07')).toBe(6)
  expect(diasNaEtapa('2026-12-30', '2027-01-02')).toBe(3)
})

test('o mesmo dia é 0, início no futuro também (nunca negativo) e sem início é null', () => {
  expect(diasNaEtapa('2026-10-07', '2026-10-07')).toBe(0)
  expect(diasNaEtapa('2026-10-09', '2026-10-07')).toBe(0)
  expect(diasNaEtapa(null, '2026-10-07')).toBeNull()
})

test('o horário de verão não muda a conta', () => {
  expect(diasNaEtapa('2026-03-07', '2026-03-09')).toBe(2)
  expect(diasNaEtapa('2026-10-30', '2026-11-02')).toBe(3)
})

test('até 15 dias é número; a partir de 16, pílula', () => {
  expect(LIMITE_DE_DIAS_NA_ETAPA).toBe(15)
  expect(passouDoLimite(15)).toBe(false)
  expect(passouDoLimite(16)).toBe(true)
})

test('o texto dos dias concorda: hoje, há 1 dia, há 6 dias', () => {
  expect([0, 1, 6].map(textoDosDias)).toEqual(['hoje', 'há 1 dia', 'há 6 dias'])
})
