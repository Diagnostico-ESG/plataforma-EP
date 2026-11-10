import { describe, expect, test } from 'vitest'
import { chaveDaPasta } from './chaves'

// O nome do arquivo e o da planilha (ou da plataforma) são digitados por pessoas diferentes: a pasta casa o mesmo processo
// apesar de caixa, acento e espaços repetidos. Nomes inventados.
describe('a chave do processo na pasta', () => {
  test.each([
    ['tsa', 'EMITIR OFÍCIO'],
    ['TSA', 'Emitir Oficio'],
    [' TSA ', 'Emitir  Ofício '],
    ['TSA', 'Emitir Ofício'],
  ])('"%s" · "%s" casa com TSA · Emitir Ofício', (sigla, nome) => {
    expect(chaveDaPasta(sigla, nome)).toBe(chaveDaPasta('TSA', 'Emitir Ofício'))
  })

  test('processos de nome diferente continuam diferentes', () => {
    expect(chaveDaPasta('TSA', 'Emitir Ofício')).not.toBe(chaveDaPasta('TSA', 'Emitir Ofícios'))
    expect(chaveDaPasta('TSA', 'Emitir Ofício')).not.toBe(chaveDaPasta('ABC', 'Emitir Ofício'))
  })
})
