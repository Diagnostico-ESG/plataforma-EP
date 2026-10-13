import { describe, expect, test } from 'vitest'
import { normalizarSigla, problemaNoSetor } from './validacaoDoSetor'

describe('validação do setor na tela', () => {
  test('a sigla perde os espaços das pontas e vai para maiúsculas', () => {
    expect(normalizarSigla(' cee ')).toBe('CEE')
  })

  test.each(['CEE', ' cee ', 'C-1', 'AB', 'A'.repeat(15)])('aceita a sigla "%s"', (sigla) => {
    expect(problemaNoSetor('Setor Fictício', sigla)).toBeNull()
  })

  test.each(['C E', 'CEE_PR', 'CÊE', 'C', 'A'.repeat(16), ''])('recusa a sigla "%s" mostrando o valor recebido', (sigla) => {
    expect(problemaNoSetor('Setor Fictício', sigla)).toBe(
      `A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "${sigla}".`)
  })

  test('recusa o nome vazio ou só com espaços', () => {
    expect(problemaNoSetor('   ', 'CEE')).toBe('O nome do setor é obrigatório.')
  })
})
