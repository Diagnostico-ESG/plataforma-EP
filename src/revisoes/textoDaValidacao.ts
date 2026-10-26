import { formatarData } from '../lib/datas'

/** A linha da gaveta da Validação com o setor: o dia em que o setor validou o fluxo, ou que ainda não há data. */
export function textoDaValidacao(data: string | null | undefined): string {
  return data ? `Validado pelo setor em ${formatarData(data)}` : 'Data da validação não registrada.'
}
