import type { EscopoDaCorrecao, RevisaoInterna } from './tipos'

export const FRASE_DA_CORRIGIDA_SEM_VERSAO_NA_PASSAGEM = "Para 'corrigida', envie a versão corrigida com o processo na Revisão interna."
export const FRASE_DA_REVISAO_JA_REGISTRADA = 'Já há uma revisão registrada nesta passagem pela Revisão interna; edite-a.'
export const FRASE_DO_ESCOPO_OBRIGATORIO = 'Escolha o escopo da correção.'
export const FRASE_DO_ESCOPO_SO_NA_CORRIGIDA = 'O escopo só vale na revisão corrigida.'
/** O registro que a pessoa editava já não existe (a aprovação desfeita por uma volta de etapa, por exemplo). */
export const FRASE_DO_REGISTRO_QUE_SUMIU = 'Este registro não existe mais. Feche a janela e confira a gaveta da etapa.'
export const FRASE_DA_REVISAO_FORA_DA_ETAPA = 'Registre a revisão com o processo na Revisão interna.'

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
