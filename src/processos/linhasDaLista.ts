import type { ProcessoDaLista } from './tipos'

/** Uma linha da Lista: o processo e, no subprocesso, o nome do pai ("↳ pai"). */
export type LinhaDaLista = ProcessoDaLista & { nomeDoPai: string | null }

const comparar = (a: string, b: string): number => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })

/** Na ordem da Lista: pela sigla do setor e depois pelo nome. O pai fora da lista (filtrado) fica sem nome. */
export function linhasDaLista(processos: ProcessoDaLista[]): LinhaDaLista[] {
  const nomePorId = new Map(processos.map((processo) => [processo.id, processo.nome]))
  return processos
    .map((processo) => ({ ...processo, nomeDoPai: nomeDoPai(processo, nomePorId) }))
    .sort((a, b) => comparar(a.setorSigla, b.setorSigla) || comparar(a.nome, b.nome))
}

function nomeDoPai(processo: ProcessoDaLista, nomePorId: Map<string, string>): string | null {
  return processo.processoPaiId === null ? null : nomePorId.get(processo.processoPaiId) ?? null
}

export function textoDaEtapaAtual(processo: ProcessoDaLista): string {
  if (processo.aguardandoOSetor) return 'Aguardando o setor'
  return processo.etapaAtual?.nome ?? '—'
}
