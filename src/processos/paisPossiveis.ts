import type { ProcessoDaLista } from './tipos'

/** Quem pode ser pai de um subprocesso: os processos do tipo Processo, menos o próprio item (o banco confere de novo). */
export function paisPossiveis(processos: ProcessoDaLista[], idDoProprio?: string): ProcessoDaLista[] {
  return processos.filter((processo) => processo.tipo === 'processo' && processo.id !== idDoProprio)
}
