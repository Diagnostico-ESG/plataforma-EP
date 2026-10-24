// Datas das planilhas no fuso do escritório (Brasília). Arquivo puro, testado no Vitest pelos arquivos que o usam.
const FUSO_DO_ESCRITORIO = 'America/Sao_Paulo'

// O formato sueco é AAAA-MM-DD HH:MM; h23 evita "24:00" na meia-noite.
const FORMATO_DA_ATUALIZACAO = new Intl.DateTimeFormat('sv-SE', {
  timeZone: FUSO_DO_ESCRITORIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function dataEHoraDeBrasilia(instanteIso: string): string {
  return FORMATO_DA_ATUALIZACAO.format(new Date(instanteIso))
}

/** O dia (AAAA-MM-DD) em Brasília de um instante ISO. */
export function diaDeBrasilia(instanteIso: string): string {
  return dataEHoraDeBrasilia(instanteIso).slice(0, 10)
}
