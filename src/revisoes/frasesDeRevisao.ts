import type { EscopoDaCorrecao, RevisaoInterna } from './tipos'

/** Quem enviou a versão não a revisa (ADR 0014): vale para a revisada e, na "corrigida", para a anterior. */
export function fraseDoRevisorQueEAutor(numero: number | string): string {
  return `Quem enviou a versão V${numero} não pode revisá-la.`
}

export const FRASE_DA_CORRIGIDA_SEM_VERSAO_DO_REVISOR =
  'Para marcar como corrigida, a versão mais recente precisa ser sua: envie a versão corrigida em Arquivos.'
export const FRASE_DA_CORRIGIDA_SEM_ANTERIOR = 'Não há versão anterior para corrigir.'
export const FRASE_DO_ESCOPO_OBRIGATORIO = 'Escolha o escopo da correção.'
export const FRASE_DO_ESCOPO_SO_NA_CORRIGIDA = 'O escopo só vale na revisão corrigida.'
export const FRASE_DA_REVISAO_FORA_DA_ETAPA = 'A revisão só pode ser registrada com a Revisão interna em andamento.'

/** Concluir a Revisão interna por outro caminho que não a janela: o banco recusa a versão sem revisão. */
export function fraseDaVersaoSemRevisao(numero: number | string): string {
  return `A V${numero} ainda não tem revisão registrada. Conclua a Revisão interna pela janela de concluir.`
}

/** Processo com revisão não se exclui: o total vem do banco, e o caminho é cancelar o processo. */
export function fraseDoProcessoComRevisoes(total: string | number): string {
  const revisoes = Number(total) === 1 ? '1 revisão registrada' : `${total} revisões registradas`
  return `Não é possível excluir: processo tem ${revisoes}. Cancele o processo em vez de excluí-lo.`
}

export const ROTULO_DO_ESCOPO: Record<EscopoDaCorrecao, string> = {
  fluxograma: 'Fluxograma', relatorio: 'Relatório', ambos: 'Fluxograma e relatório',
}

/** O resultado como a gaveta o mostra: "Sem alteração" ou "Corrigida, gerou a V8". */
export function rotuloDoResultado(revisao: Pick<RevisaoInterna, 'resultado' | 'versaoCorrigida'>): string {
  if (revisao.resultado === 'sem_alteracao') return 'Sem alteração'
  return `Corrigida, gerou a V${revisao.versaoCorrigida}`
}
