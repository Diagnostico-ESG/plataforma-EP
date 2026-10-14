import { expect, test } from 'vitest'
import { problemaNaEtapa } from './validacaoDaEtapa'

test('nome em branco é recusado', () => {
  expect(problemaNaEtapa({ nome: '   ', codigo: 'nova' })).toBe('O nome da etapa é obrigatório.')
})

test.each(['nova', 'revisao_2', 'ab', 'a'.repeat(40)])('código "%s" é aceito', (codigo) => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo })).toBeNull()
})

test.each(['Revisão', 'a', 'a'.repeat(41), 'com espaço', 'com-hifen', ''])('código "%s" é recusado com o valor recebido', (codigo) => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo }))
    .toBe(`O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "${codigo}".`)
})

test('na edição, sem código, só o nome é conferido', () => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo: null })).toBeNull()
  expect(problemaNaEtapa({ nome: '', codigo: null })).toBe('O nome da etapa é obrigatório.')
})
