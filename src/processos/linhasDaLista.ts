import { ORDENACAO_PADRAO, ordenarLinhas, type OrdenacaoDaLista } from './ordenacaoDaLista'
import type { LinhaDaLista, ProcessoDaLista } from './tipos'

// Reexportado: quem monta ou mostra a Lista importa o tipo daqui; ele mora em tipos.ts para não fechar um ciclo com a ordenação.
export type { LinhaDaLista }


/**
 * Na ordem escolhida (padrão: pelo nome), com cada subprocesso logo depois do pai. O nome do pai vem de todos os
 * processos, para aparecer mesmo quando um filtro tirou o pai da Lista.
 */
export function linhasDaLista(
  processos: ProcessoDaLista[], todos: ProcessoDaLista[] = processos, ordenacao: OrdenacaoDaLista = ORDENACAO_PADRAO,
): LinhaDaLista[] {
  const nomePorId = new Map(todos.map((processo) => [processo.id, processo.nome]))
  const linhas = processos.map((processo) => ({ ...processo, nomeDoPai: nomeDoPai(processo, nomePorId) }))
  return ordenarLinhas(linhas, ordenacao)
}

function nomeDoPai(processo: ProcessoDaLista, nomePorId: Map<string, string>): string | null {
  return processo.processoPaiId === null ? null : nomePorId.get(processo.processoPaiId) ?? null
}
