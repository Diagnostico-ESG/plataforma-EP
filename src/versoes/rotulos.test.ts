import { expect, test } from 'vitest'
import {
  haVersaoNova, ordenarVersoes, origemDoRelatorio, podeCopiarRelatorio, proximoNumero, relatorioPendente, rotuloDaVersao,
  versoesComRelatorioPendente,
} from './rotulos'
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

function relatorioDe(numero: number, copiadoDe?: string) {
  return { id: `r${numero}`, papel: 'relatorio' as const, nome: `TSA_V${numero}_Relatório.pdf`, formato: 'pdf', tamanho: 10, copiadoDe }
}

function comRelatorio(numero: number, copiadoDe?: string): Versao {
  return { ...versao(numero), arquivos: [relatorioDe(numero, copiadoDe)] }
}

test('o relatório está pendente na versão nova sem relatório, nunca na histórica', () => {
  expect(relatorioPendente(versao(6))).toBe(true)
  expect(relatorioPendente(comRelatorio(6))).toBe(false)
  expect(relatorioPendente(versao(5, true))).toBe(false)
})

test('as versões com relatório pendente vêm da mais recente para a mais antiga', () => {
  const versoes = [comRelatorio(2), versao(1), versao(3), versao(4, true), versao(5)]
  expect(versoesComRelatorioPendente(versoes).map(rotuloDaVersao)).toEqual(['V5', 'V3', 'V1'])
})

test('"sem alteração" só cabe na versão pendente cuja anterior tem relatório', () => {
  const versoes = [versao(1), comRelatorio(2), versao(3), versao(4), versao(5, true)]
  expect(podeCopiarRelatorio(versoes[2], versoes)).toBe(true) // V3: a V2 tem relatório
  expect(podeCopiarRelatorio(versoes[3], versoes)).toBe(false) // V4: a V3 não tem
  expect(podeCopiarRelatorio(versoes[0], versoes)).toBe(false) // V1: não há anterior
  expect(podeCopiarRelatorio(comRelatorio(6), [...versoes, comRelatorio(6)])).toBe(false) // já tem relatório
  expect(podeCopiarRelatorio(versoes[4], versoes)).toBe(false) // histórica
})

test('a anterior é a de maior número menor, mesmo com números saltados', () => {
  const versoes = [comRelatorio(2), versao(7)]
  expect(podeCopiarRelatorio(versoes[1], versoes)).toBe(true)
})

test('a origem do relatório copiado é o rótulo da versão de onde veio', () => {
  const versoes = [comRelatorio(2), { ...versao(3), arquivos: [relatorioDe(3, 'r2')] }]
  expect(origemDoRelatorio(versoes[1].arquivos[0], versoes)).toBe('V2')
  expect(origemDoRelatorio(versoes[0].arquivos[0], versoes)).toBeNull()
  expect(origemDoRelatorio({ ...relatorioDe(4, 'r9') }, versoes)).toBeNull()
})
