import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'

/**
 * Só o cartão de processo em andamento ou concluído, não arquivado, se arrasta (spec, "Arrastar"). Suspenso, cancelado e
 * arquivado ficam parados; quem não altera e o Quadro agrupado por responsável também não arrastam (a tela decide).
 */
export function podeArrastar(processo: Pick<ProcessoDaLista, 'situacao' | 'etapaAtual' | 'arquivadoEm'>): boolean {
  if (processo.arquivadoEm || processo.etapaAtual === null) return false
  return processo.situacao === 'em_andamento' || processo.situacao === 'concluido'
}

/**
 * A etapa para onde o cartão vai ao ser solto na coluna `codigoDaColuna`: qualquer etapa ativa, para a frente ou para
 * trás. null quando não há o que gravar: a própria coluna (soltar nela não grava) ou uma coluna que não é etapa ativa.
 */
export function etapaDeDestino(
  processo: Pick<ProcessoDaLista, 'etapaAtual'>, codigoDaColuna: string, etapas: EtapaDoCatalogo[],
): EtapaDoCatalogo | null {
  if (processo.etapaAtual === null || processo.etapaAtual.codigo === codigoDaColuna) return null
  return etapas.find((etapa) => etapa.ativa && etapa.codigo === codigoDaColuna) ?? null
}
