import type { SituacaoDoProcesso } from './tipos'

/** "nao_publicar" vem do "⋯" da Publicação em andamento, com o mesmo padrão de motivo (ADR 0020). */
export type PedidoDeSituacao = 'suspender' | 'cancelar' | 'retomar' | 'nao_publicar'

// O concluído é calculado: para suspender ou cancelar, conta como em andamento. A ordem é a do "⋯" (spec):
// Suspender ou Retomar primeiro, depois Cancelar.
export const PEDIDOS_POR_SITUACAO: Record<SituacaoDoProcesso, PedidoDeSituacao[]> = {
  em_andamento: ['suspender', 'cancelar'], concluido: ['suspender', 'cancelar'],
  suspenso: ['retomar', 'cancelar'], cancelado: ['retomar'],
}

export const TEXTOS_DA_SITUACAO: Record<PedidoDeSituacao, { item: string; titulo: (nome: string) => string; acao: string }> = {
  suspender: { item: 'Suspender', titulo: (nome) => `Suspender o processo ${nome}?`, acao: 'Suspender processo' },
  // "Cancelar processo" no menu: "Cancelar" sozinho se confunde com o Cancelar que fecha as janelas.
  cancelar: { item: 'Cancelar processo', titulo: (nome) => `Cancelar o processo ${nome}?`, acao: 'Cancelar processo' },
  retomar: { item: 'Retomar', titulo: (nome) => `Retomar o processo ${nome}?`, acao: 'Retomar processo' },
  nao_publicar: {
    item: 'Não vai mais para publicação', titulo: (nome) => `O processo ${nome} não vai mais para publicação?`,
    acao: 'Não vai mais para publicação',
  },
}
