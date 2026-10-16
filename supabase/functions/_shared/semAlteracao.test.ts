import { describe, expect, it } from 'vitest'
import { validarSemAlteracao } from './semAlteracao.ts'

const PROCESSO = '9f000000-0000-0000-0000-0000000000b1'
const VERSAO = '8f000000-0000-0000-0000-0000000000c1'

function codigoDe(corpo: unknown): string | null {
  const resultado = validarSemAlteracao(corpo)
  return resultado.ok ? null : resultado.recusa.codigo
}

describe('validarSemAlteracao', () => {
  it('lê o processo e a versão', () => {
    expect(validarSemAlteracao({ processo_id: PROCESSO, versao_id: VERSAO })).toEqual({
      ok: true,
      valor: { processoId: PROCESSO, versaoId: VERSAO },
    })
  })

  it.each([
    ['corpo que não é objeto', null],
    ['sem processo', { versao_id: VERSAO }],
    ['processo que não é uuid', { processo_id: 'p1', versao_id: VERSAO }],
    ['sem versão', { processo_id: PROCESSO }],
    ['versão de tipo errado', { processo_id: PROCESSO, versao_id: 5 }],
  ])('recusa %s', (_nome, corpo) => {
    expect(codigoDe(corpo)).toBe('entrada_invalida')
  })

  it('a mensagem traz o campo e o tipo recebido, nunca o valor', () => {
    const resultado = validarSemAlteracao({ processo_id: PROCESSO, versao_id: 'segredo' })
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('versao_id')
    expect(!resultado.ok && resultado.recusa.mensagem).toContain('string')
    expect(!resultado.ok && resultado.recusa.mensagem).not.toContain('segredo')
  })
})
