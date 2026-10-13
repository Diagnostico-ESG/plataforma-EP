import { describe, expect, test } from 'vitest'
import { normalizarCodigo, problemaNoMacroprocesso } from './validacaoDoMacroprocesso'

describe('problemaNoMacroprocesso', () => {
  test('nome só com espaços é recusado com o texto da tela', () => {
    expect(problemaNoMacroprocesso('   ')).toBe('O nome do macroprocesso é obrigatório.')
  })

  test('nome preenchido não tem problema', () => {
    expect(problemaNoMacroprocesso('Planejamento Inventado')).toBeNull()
  })
})

describe('normalizarCodigo', () => {
  test('código vazio ou só com espaços vira nulo', () => {
    expect(normalizarCodigo('  ')).toBeNull()
  })

  test('código tem os espaços das pontas retirados e mantém as maiúsculas e minúsculas', () => {
    expect(normalizarCodigo(' Mp01 ')).toBe('Mp01')
  })
})
