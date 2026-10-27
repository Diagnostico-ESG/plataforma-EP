import { expect, test } from 'vitest'
import { pessoaDaOpcao } from './pessoaDaOpcao'

test('leva o nome e a foto; foto ausente vira null', () => {
  expect(pessoaDaOpcao({ nome: 'Ana Teste', fotoUrl: 'https://fotos.exemplo/ana.png' })).toEqual({ nome: 'Ana Teste', fotoUrl: 'https://fotos.exemplo/ana.png' })
  expect(pessoaDaOpcao({ nome: 'Bia Teste' })).toEqual({ nome: 'Bia Teste', fotoUrl: null })
})
