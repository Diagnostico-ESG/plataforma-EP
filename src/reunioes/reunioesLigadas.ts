import type { Reuniao } from './tipos'

/** As reuniões do setor, de qualquer tipo; a ordem é de quem mostra (ordenarReunioes). */
export function reunioesDoSetor(reunioes: Reuniao[], setorId: string): Reuniao[] {
  return reunioes.filter((reuniao) => reuniao.setorId === setorId)
}

/** As reuniões de modelagem que trataram o processo. */
export function reunioesDoProcesso(reunioes: Reuniao[], processoId: string): Reuniao[] {
  return reunioes.filter((reuniao) => reuniao.processos.some((processo) => processo.id === processoId))
}
