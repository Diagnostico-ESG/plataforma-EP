import { expect, test } from 'vitest'
import { RASCUNHO_VAZIO, dadosDaRevisao, rascunhoPronto } from './rascunhoDaRevisao'

// O escopo é do banco (ADR 0046): o rascunho só tem o resultado e o comentário.
test('só está pronto com o resultado escolhido', () => {
  expect(rascunhoPronto(RASCUNHO_VAZIO)).toBe(false)
  expect(rascunhoPronto({ ...RASCUNHO_VAZIO, resultado: 'sem_alteracao' })).toBe(true)
  expect(rascunhoPronto({ ...RASCUNHO_VAZIO, resultado: 'corrigida' })).toBe(true)
})

test('o comentário vai aparado e o vazio vira null', () => {
  expect(dadosDaRevisao({ resultado: 'sem_alteracao', comentario: '  Conferi  ' })).toEqual({ resultado: 'sem_alteracao', comentario: 'Conferi' })
  expect(dadosDaRevisao({ resultado: 'corrigida', comentario: '   ' })).toEqual({ resultado: 'corrigida', comentario: null })
})
