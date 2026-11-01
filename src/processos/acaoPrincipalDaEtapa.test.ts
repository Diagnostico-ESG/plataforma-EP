import { describe, expect, test } from 'vitest'
import { umProcessoLido } from '../testes/processoDaLista'
import { acaoPrincipalDaEtapa } from './acaoPrincipalDaEtapa'

const naEtapa = (etapa: string, mudancas = {}) => umProcessoLido('Emitir Ofício', { id: 'p1', ...mudancas }, etapa)

describe('acaoPrincipalDaEtapa', () => {
  test('a Revisão interna pede o registro da revisão enquanto a passagem não tem uma', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('revisao_interna'), true, false)).toBe('registrar_revisao')
    expect(acaoPrincipalDaEtapa(naEtapa('revisao_interna'), true, true)).toBeNull()
  })

  test('a Aprovação pelo setor sempre oferece registrar a aprovação', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor'), true, false)).toBe('registrar_aprovacao')
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor'), true, true)).toBe('registrar_aprovacao')
  })

  test('a Publicação e Concluídos sem data pedem registrar a publicação; com data, nada', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('publicacao'), true, false)).toBe('registrar_publicacao')
    expect(acaoPrincipalDaEtapa(naEtapa('concluidos'), true, false)).toBe('registrar_publicacao')
    expect(acaoPrincipalDaEtapa(naEtapa('concluidos', { publicadoEm: '2026-10-01' }), true, false)).toBeNull()
  })

  test('as outras etapas não têm ação principal', () => {
    for (const etapa of ['nao_iniciados', 'modelagem', 'relatorio_modelagem_tecnica', 'revisao_setor']) {
      expect(acaoPrincipalDaEtapa(naEtapa(etapa), true, false)).toBeNull()
    }
  })

  test('quem só consulta, e o processo suspenso ou cancelado, não têm ação principal', () => {
    expect(acaoPrincipalDaEtapa(naEtapa('revisao_interna'), false, false)).toBeNull()
    expect(acaoPrincipalDaEtapa(naEtapa('aprovacao_setor', { situacao: 'suspenso' }), true, false)).toBeNull()
    expect(acaoPrincipalDaEtapa(naEtapa('publicacao', { situacao: 'cancelado' }), true, false)).toBeNull()
  })
})
