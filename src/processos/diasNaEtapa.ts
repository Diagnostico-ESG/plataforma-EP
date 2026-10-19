/** Daqui em diante o número de dias vira a pílula âmbar (spec, "Verso do cartão"); o selo do cartão da parte 4 usa o mesmo limite. */
export const LIMITE_DE_DIAS_NA_ETAPA = 15

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Em UTC, para o horário de verão não fazer um dia valer 23 ou 25 horas.
function emDias(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia) / MS_POR_DIA
}

/** Dias da etapa em andamento, do início até hoje (AAAA-MM-DD); null sem início; nunca negativo. */
export function diasNaEtapa(iniciadaEm: string | null, hoje: string): number | null {
  if (iniciadaEm === null) return null
  return Math.max(0, emDias(hoje) - emDias(iniciadaEm))
}

export function passouDoLimite(dias: number): boolean {
  return dias > LIMITE_DE_DIAS_NA_ETAPA
}

export function textoDosDias(dias: number): string {
  if (dias === 0) return 'hoje'
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}
