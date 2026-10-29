import { ORDENACAO_PADRAO, ordenarLinhas, type OrdenacaoDaLista } from './ordenacaoDaLista'
import type { ProcessoDaLista } from './tipos'

/** Uma linha da Lista: o processo e, no subprocesso, o nome do pai ("↳ pai"). */
export type LinhaDaLista = ProcessoDaLista & { nomeDoPai: string | null }

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
