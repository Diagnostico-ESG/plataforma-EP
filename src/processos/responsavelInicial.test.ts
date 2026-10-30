import { describe, expect, test } from 'vitest'
import { responsavelInicialValido, situacaoDoResponsavelInicial } from './responsavelInicial'
import type { ResponsavelInicialDaEtapa } from './tipos'

const ANA: ResponsavelInicialDaEtapa = { id: 'u1', nome: 'Ana Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' }

describe('situação do responsável inicial', () => {
  test('Administrador ou Integrante ativo vale', () => {
    expect(situacaoDoResponsavelInicial(ANA)).toBe('valido')
    expect(situacaoDoResponsavelInicial({ ...ANA, perfil: 'administrador' })).toBe('valido')
  })
  test('inativo vale como inativo, mesmo que o perfil também tenha mudado', () => {
    expect(situacaoDoResponsavelInicial({ ...ANA, ativo: false })).toBe('inativo')
    expect(situacaoDoResponsavelInicial({ ...ANA, ativo: false, perfil: 'consulta' })).toBe('inativo')
  })
  test('ativo mas Consulta é "sem permissão"', () => {
    expect(situacaoDoResponsavelInicial({ ...ANA, perfil: 'consulta' })).toBe('sem_permissao')
  })
})

describe('responsável inicial válido da etapa', () => {
  test('devolve o responsável quando ele vale', () => {
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: ANA })).toBe(ANA)
  })
  test('ninguém quando não há, quando é inválido e sempre em Concluídos', () => {
    expect(responsavelInicialValido({ codigo: 'modelagem' })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: null })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: { ...ANA, ativo: false } })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: { ...ANA, perfil: 'consulta' } })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'concluidos', responsavelInicial: ANA })).toBeNull()
  })
})
