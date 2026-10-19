import type { DadosDaRevisao, EscopoDaCorrecao, ResultadoDaRevisao } from './tipos'

/** O que a pessoa preencheu na janela de concluir a Revisão interna: o escopo e o comentário são texto até confirmar. */
export type RascunhoDaRevisao = { resultado: ResultadoDaRevisao | null; escopo: EscopoDaCorrecao | null; comentario: string }

export const RASCUNHO_VAZIO: RascunhoDaRevisao = { resultado: null, escopo: null, comentario: '' }

/** Pronto para confirmar: o resultado escolhido e, na "corrigida", o escopo. */
export function rascunhoPronto(rascunho: RascunhoDaRevisao): boolean {
  if (rascunho.resultado === null) return false
  return rascunho.resultado !== 'corrigida' || rascunho.escopo !== null
}

/** O que vai ao banco: o comentário aparado (vazio vira null) e o escopo só na "corrigida". */
export function dadosDaRevisao(rascunho: RascunhoDaRevisao): DadosDaRevisao {
  const resultado = rascunho.resultado ?? 'sem_alteracao'
  return {
    resultado, escopo: resultado === 'corrigida' ? rascunho.escopo : null, comentario: rascunho.comentario.trim() || null,
  }
}
