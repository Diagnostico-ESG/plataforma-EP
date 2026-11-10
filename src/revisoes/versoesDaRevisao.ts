import type { UltimaVersao, UltimoRelatorio } from '../processos/tipos'
import type { EscopoDaCorrecao, EtapaDaRevisao, ResultadoDaRevisao } from './tipos'

/** O que a tela sabe para registrar a revisão: em qual das duas revisões o processo está e o que ele tem a revisar. */
export type ContextoDaRevisao = { etapa: EtapaDaRevisao; ultimaVersao: UltimaVersao | null; ultimoRelatorio?: UltimoRelatorio | null }

/** O que a revisão liga: a versão revisada (e a corrigida) e o relatório revisado (e o corrigido); null o que não entra. */
export type LigacoesDaRevisao = {
  versao: { revisada: number; corrigida: number | null } | null
  relatorio: { revisado: number; corrigido: number | null } | null
}

/**
 * O que o banco liga a cada resultado (ADR 0046). "Sem alteração": a versão mais recente na Revisão do fluxograma, o
 * relatório mais recente na do relatório. "Corrigida" (as duas): o que foi enviado nesta passagem ao anterior a ele. Null
 * quando o resultado não se aplica (nada a revisar, ou nada enviado na passagem, ou o enviado sem anterior).
 */
export function ligacoesDaRevisao(contexto: ContextoDaRevisao, resultado: ResultadoDaRevisao): LigacoesDaRevisao | null {
  return resultado === 'sem_alteracao' ? ligacoesSemAlteracao(contexto) : ligacoesDaCorrigida(contexto)
}

function ligacoesSemAlteracao({ etapa, ultimaVersao, ultimoRelatorio }: ContextoDaRevisao): LigacoesDaRevisao | null {
  if (etapa === 'revisao_relatorio') {
    return ultimoRelatorio ? { versao: null, relatorio: { revisado: ultimoRelatorio.numero, corrigido: null } } : null
  }
  return ultimaVersao ? { versao: { revisada: ultimaVersao.numero, corrigida: null }, relatorio: null } : null
}

function ligacoesDaCorrigida({ ultimaVersao, ultimoRelatorio }: ContextoDaRevisao): LigacoesDaRevisao | null {
  const versao = ultimaVersao?.enviadaNestaPassagem && ultimaVersao.anterior
    ? { revisada: ultimaVersao.anterior.numero, corrigida: ultimaVersao.numero } : null
  const relatorio = ultimoRelatorio?.enviadoNestaPassagem && ultimoRelatorio.anterior
    ? { revisado: ultimoRelatorio.anterior.numero, corrigido: ultimoRelatorio.numero } : null
  return versao || relatorio ? { versao, relatorio } : null
}

/** O escopo que o banco deduz da "corrigida": só a versão, só o relatório ou os dois. */
export function escopoDasLigacoes({ versao, relatorio }: LigacoesDaRevisao): EscopoDaCorrecao {
  if (versao?.corrigida && relatorio?.corrigido) return 'ambos'
  return relatorio?.corrigido ? 'relatorio' : 'fluxograma'
}
