import type { DadosDaRevisao, ResultadoDaRevisao } from './tipos'

/** O que a pessoa preencheu na janela de registrar a revisão: o comentário é texto até confirmar. O escopo é do banco (ADR 0046). */
export type RascunhoDaRevisao = { resultado: ResultadoDaRevisao | null; comentario: string }

export const RASCUNHO_VAZIO: RascunhoDaRevisao = { resultado: null, comentario: '' }

/** Pronto para confirmar: o resultado escolhido. */
export function rascunhoPronto(rascunho: RascunhoDaRevisao): boolean {
  return rascunho.resultado !== null
}

/** O que vai ao banco: o resultado e o comentário aparado (vazio vira null). */
export function dadosDaRevisao(rascunho: RascunhoDaRevisao): DadosDaRevisao {
  return { resultado: rascunho.resultado ?? 'sem_alteracao', comentario: rascunho.comentario.trim() || null }
}
