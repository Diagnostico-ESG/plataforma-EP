import { formatarData } from '../lib/datas'

/** O dia de hoje no relógio de quem usa (AAAA-MM-DD), que é como a data da reunião é guardada. */
export function hojeLocal(agora: Date = new Date()): string {
  const dois = (numero: number) => String(numero).padStart(2, '0')
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
}

/** A linha do painel: a data de hoje ainda está "marcada para"; só a de antes de hoje foi "realizada em". */
export function textoDaModelagemPiloto(data: string | null, hoje: string): string {
  if (data === null) return 'não marcada'
  return data >= hoje ? `marcada para ${formatarData(data)}` : `realizada em ${formatarData(data)}`
}

export type MomentoDaModelagemPiloto = 'proxima' | 'realizada'

/** No verso: a data de hoje ainda é a próxima; só a de antes de hoje foi realizada. Sem data, nenhum. */
export function momentoDaModelagemPiloto(data: string | null, hoje: string): MomentoDaModelagemPiloto | null {
  if (data === null) return null
  return data >= hoje ? 'proxima' : 'realizada'
}
