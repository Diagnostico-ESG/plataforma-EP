import { expect, test } from 'vitest'
import {
  LIMITE_DAS_ANOTACOES, PAUSA_DA_GRAVACAO_MS, contagemDasAnotacoes, linhaDaUltimaAlteracao, precisaGravar, textoParaGravar,
} from './anotacoes'

test('o limite é de 2.000 caracteres e a pausa, de 1 segundo', () => {
  expect(LIMITE_DAS_ANOTACOES).toBe(2000)
  expect(PAUSA_DA_GRAVACAO_MS).toBe(1000)
})

test('só espaços e quebras de linha viram nulo; o resto vai como foi digitado', () => {
  expect(textoParaGravar('')).toBeNull()
  expect(textoParaGravar('  \n \t')).toBeNull()
  expect(textoParaGravar('  com margem  ')).toBe('  com margem  ')
  expect(textoParaGravar('a')).toBe('a')
})

test.each<[string, string | null, boolean]>([
  ['', null, false],
  ['   ', null, false],
  ['a', null, true],
  ['a', 'a', false],
  ['', 'a', true],
  ['  ', 'a', true],
  ['  a', 'a', true],
])('precisaGravar(%j, %j) é %s', (texto, gravado, esperado) => {
  expect(precisaGravar(texto, gravado)).toBe(esperado)
})

test('a contagem só aparece a partir de 1.800 caracteres', () => {
  expect(contagemDasAnotacoes('a'.repeat(1799))).toBeNull()
  expect(contagemDasAnotacoes('a'.repeat(1800))).toBe('1.800 de 2.000')
  expect(contagemDasAnotacoes('a'.repeat(2000))).toBe('2.000 de 2.000')
})

test('a linha de quem alterou usa o horário de Brasília', () => {
  expect(linhaDaUltimaAlteracao('Ana Teste', '2026-10-23T17:30:00Z')).toBe('Alterado por Ana Teste em 23/10, 14:30')
  expect(linhaDaUltimaAlteracao('Ana Teste', '2026-10-24T02:05:00Z')).toBe('Alterado por Ana Teste em 23/10, 23:05')
})

test('sem o nome do autor a linha só traz a data; sem gravação não há linha', () => {
  expect(linhaDaUltimaAlteracao(null, '2026-10-23T17:30:00Z')).toBe('Alterado em 23/10, 14:30')
  expect(linhaDaUltimaAlteracao('Ana Teste', null)).toBeNull()
})
