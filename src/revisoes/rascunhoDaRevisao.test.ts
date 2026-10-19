import { expect, test } from 'vitest'
import { RASCUNHO_VAZIO, dadosDaRevisao, rascunhoPronto } from './rascunhoDaRevisao'

test('só está pronto com o resultado escolhido e, na corrigida, o escopo', () => {
  expect(rascunhoPronto(RASCUNHO_VAZIO)).toBe(false)
  expect(rascunhoPronto({ ...RASCUNHO_VAZIO, resultado: 'sem_alteracao' })).toBe(true)
  expect(rascunhoPronto({ ...RASCUNHO_VAZIO, resultado: 'corrigida' })).toBe(false)
  expect(rascunhoPronto({ ...RASCUNHO_VAZIO, resultado: 'corrigida', escopo: 'relatorio' })).toBe(true)
})

test('o comentário vai aparado e o vazio vira null', () => {
  expect(dadosDaRevisao({ resultado: 'sem_alteracao', escopo: null, comentario: '  Conferi  ' }).comentario).toBe('Conferi')
  expect(dadosDaRevisao({ resultado: 'sem_alteracao', escopo: null, comentario: '   ' }).comentario).toBeNull()
})

test('o escopo escolhido some quando o resultado volta a "sem alteração"', () => {
  expect(dadosDaRevisao({ resultado: 'sem_alteracao', escopo: 'ambos', comentario: '' }))
    .toEqual({ resultado: 'sem_alteracao', escopo: null, comentario: null })
  expect(dadosDaRevisao({ resultado: 'corrigida', escopo: 'ambos', comentario: '' }))
    .toEqual({ resultado: 'corrigida', escopo: 'ambos', comentario: null })
})
