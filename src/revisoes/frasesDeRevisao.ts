import type { EscopoDaCorrecao, RevisaoInterna } from './tipos'

export const FRASE_DA_CORRIGIDA_SEM_ENVIO_NA_PASSAGEM = "Para 'corrigida', envie a versão ou o relatório corrigido com o processo nesta etapa."
export const FRASE_DA_REVISAO_JA_REGISTRADA = 'Já há uma revisão registrada nesta passagem; edite-a.'
export const FRASE_SEM_RELATORIO = 'O processo ainda não tem relatório para revisar.'
/** O registro que a pessoa editava já não existe (a aprovação desfeita por uma volta de etapa, por exemplo). */
export const FRASE_DO_REGISTRO_QUE_SUMIU = 'Este registro não existe mais. Feche a janela e confira a gaveta da etapa.'
export const FRASE_DA_REVISAO_FORA_DA_ETAPA = 'Registre a revisão com o processo na Revisão do fluxograma ou na Revisão do relatório.'

/** Processo com revisão não se exclui: o total vem do banco, e o caminho é cancelar o processo. */
export function fraseDoProcessoComRevisoes(total: string | number): string {
  const revisoes = Number(total) === 1 ? '1 revisão registrada' : `${total} revisões registradas`
  return `Não é possível excluir: processo tem ${revisoes}. Cancele o processo em vez de excluí-lo.`
}

export const ROTULO_DO_ESCOPO: Record<EscopoDaCorrecao, string> = {
  fluxograma: 'Fluxograma', relatorio: 'Relatório', ambos: 'Fluxograma e relatório',
}

type ResultadoNaGaveta = Pick<RevisaoInterna, 'resultado' | 'versaoCorrigida' | 'relatorioCorrigido'>

/** O resultado como a gaveta o mostra: "Sem alteração", "Corrigida, gerou a V8", "… o Relatório V2" ou "… a V8 e o Relatório V2". */
export function rotuloDoResultado({ resultado, versaoCorrigida, relatorioCorrigido }: ResultadoNaGaveta): string {
  if (resultado === 'sem_alteracao') return 'Sem alteração'
  const gerou = [versaoCorrigida ? `a V${versaoCorrigida}` : null, relatorioCorrigido ? `o Relatório V${relatorioCorrigido}` : null]
  return `Corrigida, gerou ${gerou.filter(Boolean).join(' e ')}`
}
