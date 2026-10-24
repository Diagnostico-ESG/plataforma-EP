import type { UltimaVersao } from '../processos/tipos'
import type { ResultadoDaRevisao } from './tipos'

/** As versões que uma revisão liga: a revisada e, na "corrigida", a corrigida (que o revisor enviou). */
export type VersoesDaRevisao = { revisada: number; corrigida: number | null }

/**
 * As versões que o banco liga a cada resultado (ADR 0023): "sem alteração" vale para a mais recente; "corrigida" liga a
 * versão enviada pela Revisão interna nesta passagem à anterior a ela. Null quando o resultado não se aplica (sem versão,
 * ou "corrigida" sem versão enviada na passagem ou sem anterior).
 */
export function versoesDaRevisao(ultima: UltimaVersao | null, resultado: ResultadoDaRevisao): VersoesDaRevisao | null {
  if (ultima === null) return null
  if (resultado === 'sem_alteracao') return { revisada: ultima.numero, corrigida: null }
  if (!ultima.enviadaNestaPassagem || !ultima.anterior) return null
  return { revisada: ultima.anterior.numero, corrigida: ultima.numero }
}
