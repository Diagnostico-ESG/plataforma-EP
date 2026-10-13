import { expect, test } from 'vitest'
import { dadosDoResponsavel, problemaNoResponsavel } from './validacaoDoResponsavel'

const CAMPOS = { nome: 'Ana Teste', email: '', cargo: '' }

test('nome em branco é recusado', () => {
  expect(problemaNoResponsavel({ ...CAMPOS, nome: '   ' })).toBe('O nome do responsável é obrigatório.')
})

test.each(['', 'ana.teste@exemplo.com', ' Ana.Teste@Sub.Exemplo.org '])('e-mail "%s" é aceito', (email) => {
  expect(problemaNoResponsavel({ ...CAMPOS, email })).toBeNull()
})

test.each([['ana@', 'ana@'], [' ana@exemplo ', 'ana@exemplo'], ['ana teste@exemplo.com', 'ana teste@exemplo.com'],
  ['a@b@exemplo.com', 'a@b@exemplo.com']])('e-mail "%s" é recusado com o valor recebido', (email, recebido) => {
  expect(problemaNoResponsavel({ ...CAMPOS, email }))
    .toBe(`O e-mail deve ter o formato nome@dominio. Recebido: "${recebido}".`)
})

test('dados saem sem espaços nas pontas, e-mail em minúsculas e vazios como nulos', () => {
  expect(dadosDoResponsavel({ nome: ' Ana Teste ', email: ' Ana.Teste@Exemplo.com ', cargo: ' ' }))
    .toEqual({ nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: null })
  expect(dadosDoResponsavel({ nome: 'Ana Teste', email: '', cargo: ' Chefe ' }))
    .toEqual({ nome: 'Ana Teste', email: null, cargo: 'Chefe' })
})
