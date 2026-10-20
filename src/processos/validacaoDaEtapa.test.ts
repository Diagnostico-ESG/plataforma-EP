import { expect, test } from 'vitest'
import { problemaNaEtapa } from './validacaoDaEtapa'

test('nome em branco é recusado', () => {
  expect(problemaNaEtapa({ nome: '   ', codigo: 'nova', fase: 'VI' })).toBe('O nome da etapa é obrigatório.')
})

test.each(['nova', 'revisao_2', 'ab', 'a'.repeat(40)])('código "%s" é aceito', (codigo) => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo, fase: 'VI' })).toBeNull()
})

test.each(['Revisão', 'a', 'a'.repeat(41), 'com espaço', 'com-hifen', ''])('código "%s" é recusado com o valor recebido', (codigo) => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo, fase: 'VI' }))
    .toBe(`O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "${codigo}".`)
})

test('na edição, sem código, só o nome é conferido', () => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo: null, fase: 'VI' })).toBeNull()
  expect(problemaNaEtapa({ nome: '', codigo: null, fase: 'VI' })).toBe('O nome da etapa é obrigatório.')
})

test('sem fase, a frase pede para escolher; com qualquer fase de IV a IX não há problema', () => {
  expect(problemaNaEtapa({ nome: 'Nova', codigo: 'nova', fase: '' })).toBe('Escolha a fase do Regimento.')
  expect(problemaNaEtapa({ nome: 'Nova', codigo: null, fase: '' })).toBe('Escolha a fase do Regimento.')
  expect(problemaNaEtapa({ nome: 'Nova', codigo: 'nova', fase: 'IX' })).toBeNull()
})

test('nome e código são conferidos antes da fase', () => {
  expect(problemaNaEtapa({ nome: '', codigo: 'nova', fase: '' })).toBe('O nome da etapa é obrigatório.')
})
