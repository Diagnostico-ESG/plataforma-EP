import type { MostrarNoPortfolio } from './enderecoDosProcessos'
import type { ProcessoDaLista } from './tipos'

/**
 * O que a Lista e o Quadro por setor (o portfólio) mostram: em andamento, suspensos e concluídos, os concluídos sempre,
 * sem a regra dos 30 dias do Quadro por etapa. "Concluídos" tira o resto. O cancelado só aparece pelo "Mostrar cancelados".
 */
export function visiveisNoPortfolio(processos: ProcessoDaLista[], mostrar: MostrarNoPortfolio): ProcessoDaLista[] {
  return processos.filter((processo) => processo.situacao !== 'cancelado' && (mostrar === 'todos' || processo.situacao === 'concluido'))
}

export function canceladosDe(processos: ProcessoDaLista[]): ProcessoDaLista[] {
  return processos.filter((processo) => processo.situacao === 'cancelado')
}
