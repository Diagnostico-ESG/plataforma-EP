import { ehEtapaFixa } from './codigosDasEtapas'
import type { ProcessoDaLista } from './tipos'

/** Processo parado: mais de 7 dias na mesma etapa (Andamento livre). O selo do cartão e o do Agora usam o mesmo limite. */
export const LIMITE_DE_DIAS_NA_ETAPA = 7

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Em UTC, para o horário de verão não fazer um dia valer 23 ou 25 horas.
function emDias(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return Date.UTC(ano, mes - 1, dia) / MS_POR_DIA
}

/** Dias de calendário da entrada na etapa até hoje (AAAA-MM-DD); null sem entrada; nunca negativo. */
export function diasNaEtapa(entrouEm: string | null, hoje: string): number | null {
  if (entrouEm === null) return null
  return Math.max(0, emDias(hoje) - emDias(entrouEm))
}

export function passouDoLimite(dias: number): boolean {
  return dias > LIMITE_DE_DIAS_NA_ETAPA
}

export function textoDosDias(dias: number): string {
  if (dias === 0) return 'hoje'
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}

type DadosDaContagem = Pick<ProcessoDaLista, 'situacao' | 'etapaAtual' | 'entrouNaEtapaEm'>

/**
 * Os dias que o processo está na etapa atual, para o Agora e para o selo; null onde o tempo não é atraso: Não iniciados,
 * Concluídos, suspenso, cancelado e processo sem entrada conhecida.
 */
export function diasDoProcessoNaEtapa(processo: DadosDaContagem, hoje: string): number | null {
  const { etapaAtual, situacao } = processo
  if (situacao !== 'em_andamento' || !etapaAtual || ehEtapaFixa(etapaAtual.codigo)) return null
  return diasNaEtapa(processo.entrouNaEtapaEm ?? null, hoje)
}
