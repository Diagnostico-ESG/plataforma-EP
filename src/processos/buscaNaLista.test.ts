import { expect, test } from 'vitest'
import { contemTrecho, partesDoNome } from './buscaNaLista'

test('acha o trecho sem diferenciar maiúsculas e acentos', () => {
  expect(contemTrecho('Emitir Ofício', 'OFICIO')).toBe(true)
  expect(contemTrecho('Emitir Ofício', 'itir of')).toBe(true)
  expect(contemTrecho('Pagar Diária', 'diaria')).toBe(true)
  expect(contemTrecho('Pagar Diária', 'recibo')).toBe(false)
})

test('busca vazia deixa tudo passar', () => {
  expect(contemTrecho('Pagar Diária', '')).toBe(true)
})

test('espaços nas pontas da busca não contam (achado do /ship da parte 3)', () => {
  expect(contemTrecho('Emitir Ofício', 'emitir ')).toBe(true)
  expect(contemTrecho('Pagar Diária', 'diária ')).toBe(true)
  expect(contemTrecho('Pagar Diária', '   ')).toBe(true)
  expect(partesDoNome('Pagar Diária', ' diaria ')).toEqual([
    { texto: 'Pagar ', achado: false }, { texto: 'Diária', achado: true },
  ])
  expect(partesDoNome('Pagar Diária', '  ')).toEqual([{ texto: 'Pagar Diária', achado: false }])
})

test('as partes do nome marcam o trecho achado e guardam o texto original', () => {
  expect(partesDoNome('Emitir Ofício', 'ofic')).toEqual([
    { texto: 'Emitir ', achado: false }, { texto: 'Ofíc', achado: true }, { texto: 'io', achado: false },
  ])
})

test('marca cada ocorrência do trecho', () => {
  expect(partesDoNome('Ata da data', 'DA')).toEqual([
    { texto: 'Ata ', achado: false }, { texto: 'da', achado: true }, { texto: ' ', achado: false },
    { texto: 'da', achado: true }, { texto: 'ta', achado: false },
  ])
})

test('sem busca ou sem ocorrência, o nome volta inteiro e sem marca', () => {
  expect(partesDoNome('Pagar Diária', '')).toEqual([{ texto: 'Pagar Diária', achado: false }])
  expect(partesDoNome('Pagar Diária', 'xyz')).toEqual([{ texto: 'Pagar Diária', achado: false }])
})
