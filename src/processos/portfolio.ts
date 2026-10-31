import type { MostrarNoPortfolio } from './enderecoDosProcessos'
import type { ProcessoDaLista, SituacaoDoProcesso } from './tipos'

const SITUACAO_DA_ESCOLHA: Record<Exclude<MostrarNoPortfolio, 'todos'>, SituacaoDoProcesso> = {
  em_andamento: 'em_andamento', suspensos: 'suspenso', concluidos: 'concluido', cancelados: 'cancelado',
}

/**
 * O que a Lista e o Quadro por setor (o portfólio) mostram: em andamento, suspensos e concluídos, os concluídos sempre,
 * sem a regra dos 30 dias do Quadro por etapa. Escolhida uma situação, só ela aparece; o cancelado só aparece quando pedido.
 */
export function visiveisNoPortfolio(processos: ProcessoDaLista[], mostrar: MostrarNoPortfolio): ProcessoDaLista[] {
  if (mostrar === 'todos') return processos.filter((processo) => processo.situacao !== 'cancelado')
  return processos.filter((processo) => processo.situacao === SITUACAO_DA_ESCOLHA[mostrar])
}
