import { formatarData } from '../lib/datas'

/** A data da modelagem piloto é só de realização (ADR 0035): o campo e o banco recusam a que vem depois de hoje, em Brasília. */
export function fraseDaModelagemNoFuturo(recebida: string, limite: string): string {
  return `A data da modelagem piloto não pode ser depois de hoje: recebido ${formatarData(recebida)}, limite ${formatarData(limite)}.`
}
