import { describe, expect, test } from 'vitest'
import { CATALOGO_DE_TESTE, umProcesso } from '../testes/processoDaLista'
import { etapaDeDestino, podeArrastar } from './destinoDoArrastar'

describe('podeArrastar', () => {
  test('o processo em andamento, em qualquer etapa, inclusive Não iniciados, arrasta', () => {
    expect(podeArrastar(umProcesso('A'))).toBe(true)
    expect(podeArrastar(umProcesso('A', {}, 'nao_iniciados'))).toBe(true)
  })

  test('o concluído não arquivado arrasta (para sair de Concluídos)', () => {
    expect(podeArrastar(umProcesso('A', { situacao: 'concluido' }, 'concluidos'))).toBe(true)
  })

  test('suspenso, cancelado e arquivado não arrastam', () => {
    expect(podeArrastar(umProcesso('A', { situacao: 'suspenso' }))).toBe(false)
    expect(podeArrastar(umProcesso('A', { situacao: 'cancelado' }))).toBe(false)
    expect(podeArrastar(umProcesso('A', { situacao: 'concluido', arquivadoEm: '2026-10-20T12:00:00Z' }, 'concluidos'))).toBe(false)
  })

  test('sem etapa atual não há o que arrastar', () => {
    expect(podeArrastar({ ...umProcesso('A'), etapaAtual: null })).toBe(false)
  })
})

describe('etapaDeDestino', () => {
  test('qualquer etapa ativa, para a frente ou para trás', () => {
    const processo = umProcesso('A')
    expect(etapaDeDestino(processo, 'publicacao', CATALOGO_DE_TESTE)?.nome).toBe('Publicação')
    expect(etapaDeDestino(processo, 'modelagem', CATALOGO_DE_TESTE)?.nome).toBe('Modelagem piloto')
    expect(etapaDeDestino(processo, 'nao_iniciados', CATALOGO_DE_TESTE)?.nome).toBe('Não iniciados')
  })

  test('soltar na própria coluna não grava nada', () => {
    expect(etapaDeDestino(umProcesso('A'), 'revisao_interna', CATALOGO_DE_TESTE)).toBeNull()
  })

  test('coluna que não é etapa ativa não recebe o cartão', () => {
    const inativa = CATALOGO_DE_TESTE.map((etapa) => (etapa.codigo === 'publicacao' ? { ...etapa, ativa: false } : etapa))
    expect(etapaDeDestino(umProcesso('A'), 'publicacao', inativa)).toBeNull()
    expect(etapaDeDestino(umProcesso('A'), 'sem-responsavel', CATALOGO_DE_TESTE)).toBeNull()
  })
})
