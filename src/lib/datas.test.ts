import { expect, test } from 'vitest'
import { diaDeBrasilia, formatarData, hojeEmBrasilia } from './datas'

test('formata AAAA-MM-DD como DD/MM/AAAA, e o vazio como travessão', () => {
  expect(formatarData('2026-10-05')).toBe('05/10/2026')
  expect(formatarData(null)).toBe('—')
})

test('o dia de Brasília: 02h UTC ainda é o dia anterior, e 04h UTC já é o seguinte', () => {
  expect(diaDeBrasilia('2026-10-24T02:00:00+00:00')).toBe('2026-10-23')
  expect(diaDeBrasilia('2026-10-24T04:00:00+00:00')).toBe('2026-10-24')
})

test('hoje em Brasília vem do instante, não do relógio do navegador: 02h UTC ainda é o dia anterior', () => {
  expect(hojeEmBrasilia(new Date('2026-10-24T02:00:00Z'))).toBe('2026-10-23')
  expect(hojeEmBrasilia(new Date('2026-10-24T04:00:00Z'))).toBe('2026-10-24')
})
