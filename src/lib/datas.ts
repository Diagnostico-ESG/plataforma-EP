// O banco guarda a data como AAAA-MM-DD; a tela mostra DD/MM/AAAA.
export function formatarData(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const FORMATO_DO_DIA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })

/** O dia (AAAA-MM-DD) de um instante no fuso de Brasília: os dias na etapa contam em dias de calendário de lá. */
export function diaDeBrasilia(instante: string): string {
  return FORMATO_DO_DIA.format(new Date(instante))
}
