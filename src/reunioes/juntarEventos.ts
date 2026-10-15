import type { EventoDoCadastro } from '../cadastros/tipos'

/** Duas listas de eventos numa só, do mais recente para o mais antigo (no mesmo instante, o id maior primeiro). */
export function juntarEventos(a: EventoDoCadastro[], b: EventoDoCadastro[]): EventoDoCadastro[] {
  return [...a, ...b].sort((x, y) => y.ocorridoEm.localeCompare(x.ocorridoEm) || y.id - x.id)
}
