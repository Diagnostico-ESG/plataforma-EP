import type { EventoDoCadastro } from '../cadastros/tipos'

/** O nome de cada revisão como o histórico o escreve (o evento guarda o código da etapa). */
export const NOME_DA_REVISAO: Record<string, string> = { revisao_interna: 'Revisão do fluxograma', revisao_relatorio: 'Revisão do relatório' }

const ACAO: Record<string, string> = { registrar: 'Registrou a revisão', editar: 'Editou a revisão' }
const DE_QUAL: Record<string, string> = { revisao_interna: 'do fluxograma', revisao_relatorio: 'do relatório' }

/**
 * "Registrou a revisão do relatório", "Editou a revisão do fluxograma" (ADR 0046): o evento diz de qual revisão é. O evento
 * antigo, sem a etapa, fica com o texto de antes ("Registrou a revisão"); ação desconhecida aparece pelo código.
 */
export function textoDaRevisao(evento: Pick<EventoDoCadastro, 'acao' | 'depois'>): string {
  const acao = ACAO[evento.acao] ?? evento.acao
  const etapa = (evento.depois as Record<string, unknown> | null)?.etapa
  const qual = typeof etapa === 'string' ? DE_QUAL[etapa] : undefined
  return qual ? `${acao} ${qual}` : acao
}
