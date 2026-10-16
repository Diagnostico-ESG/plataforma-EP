import { expect, test } from 'vitest'
import { haVersaoNova, ordenarVersoes, proximoNumero, rotuloDaVersao } from './rotulos'
import type { Versao } from './tipos'

function versao(numero: number, historica = false): Versao {
  return {
    id: `v${numero}`, numero, historica, enviadaEm: '2026-10-15T12:00:00Z', autor: 'Ana Teste', etapa: null,
    observacao: null, arquivos: [],
  }
}

test('o rótulo é V e o número, com F na versão histórica', () => {
  expect(rotuloDaVersao(versao(7))).toBe('V7')
  expect(rotuloDaVersao(versao(5, true))).toBe('V5F')
})

test('a próxima versão é a maior + 1, contando as históricas; sem versão, é a V1', () => {
  expect(proximoNumero([])).toBe(1)
  expect(proximoNumero([versao(3, true), versao(5, true)])).toBe(6)
  expect(proximoNumero([versao(6), versao(7), versao(5, true)])).toBe(8)
})

test('há versão nova quando alguma versão do processo não é histórica', () => {
  expect(haVersaoNova([])).toBe(false)
  expect(haVersaoNova([versao(3, true), versao(5, true)])).toBe(false)
  expect(haVersaoNova([versao(5, true), versao(6)])).toBe(true)
})

test('as versões vão da mais recente (maior número) para a mais antiga', () => {
  expect(ordenarVersoes([versao(5, true), versao(7), versao(6)]).map(rotuloDaVersao)).toEqual(['V7', 'V6', 'V5F'])
})
