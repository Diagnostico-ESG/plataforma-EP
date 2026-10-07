import { describe, expect, test } from 'vitest'
import { normalizarEmail, problemaNoEmail } from './emailInstitucional'

describe('e-mail institucional', () => {
  test('normaliza para minúsculas e sem espaços nas pontas, como o banco', () => {
    expect(normalizarEmail(' Fulano.Teste@CCivil.pr.gov.br ')).toBe('fulano.teste@ccivil.pr.gov.br')
  })

  test('e-mail do domínio passa, com maiúsculas e espaços', () => {
    expect(problemaNoEmail(' Fulano.Teste@CCivil.pr.gov.br ')).toBeNull()
  })

  test('e-mail fora do domínio mostra o valor digitado e o formato esperado', () => {
    expect(problemaNoEmail('pessoa@gmail.com')).toBe(
      'O e-mail "pessoa@gmail.com" não está no formato esperado: nome@ccivil.pr.gov.br.')
  })

  test('campo vazio também é recusado', () => {
    expect(problemaNoEmail('  ')).toBe('O e-mail "" não está no formato esperado: nome@ccivil.pr.gov.br.')
  })
})
