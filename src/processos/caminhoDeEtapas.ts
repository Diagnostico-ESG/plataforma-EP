import type { EtapaDoSetor, StatusDaEtapa } from './tipos'

export type AcaoDaEtapa = 'iniciar' | 'concluir' | 'dispensar' | 'realizada'

export const ROTULO_DO_STATUS: Record<StatusDaEtapa, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  realizada_anteriormente: 'Realizada anteriormente',
  dispensada: 'Dispensada',
}

const RESOLVIDOS = new Set<StatusDaEtapa>(['concluida', 'realizada_anteriormente', 'dispensada'])

/** A etapa atual é a primeira não resolvida: a em andamento ou, sem ela, a pendente cuja anterior já se resolveu. */
export function indiceDaEtapaAtual(etapas: EtapaDoSetor[]): number {
  return etapas.findIndex((etapa) => !RESOLVIDOS.has(etapa.status))
}

/** Só a etapa atual anda; dispensar só a opcional. O banco confere tudo de novo. */
export function acoesDaEtapa(etapas: EtapaDoSetor[], indice: number): AcaoDaEtapa[] {
  if (indice !== indiceDaEtapaAtual(etapas)) return []
  const etapa = etapas[indice]
  const avancar: AcaoDaEtapa = etapa.status === 'pendente' ? 'iniciar' : 'concluir'
  return etapa.obrigatoria ? [avancar, 'realizada'] : [avancar, 'dispensar', 'realizada']
}

// O banco guarda a data como AAAA-MM-DD; a tela mostra DD/MM/AAAA.
export function formatarData(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
