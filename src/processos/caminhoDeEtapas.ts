import type { EtapaDoProcesso, EtapaDoCaminho, StatusDaEtapa } from './tipos'

export type AcaoDaEtapa = 'iniciar' | 'concluir' | 'dispensar' | 'realizada' | 'voltar'

export const ROTULO_DO_STATUS: Record<StatusDaEtapa, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  realizada_anteriormente: 'Realizada anteriormente',
  dispensada: 'Dispensada',
}

const RESOLVIDOS = new Set<StatusDaEtapa>(['concluida', 'realizada_anteriormente', 'dispensada'])

/** A etapa lida do processo traz o responsável; a montada sem ele (só o caminho), não. */
export function ehEtapaDoProcesso(etapa: EtapaDoCaminho): etapa is EtapaDoProcesso {
  return 'responsavelId' in etapa
}

/** A etapa atual é a primeira não resolvida: a em andamento ou, sem ela, a pendente cuja anterior já se resolveu. */
export function indiceDaEtapaAtual(etapas: EtapaDoCaminho[]): number {
  return etapas.findIndex((etapa) => !RESOLVIDOS.has(etapa.status))
}

/**
 * Só a etapa atual anda (dispensar só a opcional); a resolvida anterior à atual pode ser voltada, e com todas
 * resolvidas (processo concluído) qualquer uma pode. O banco confere tudo de novo.
 */
export function acoesDaEtapa(etapas: EtapaDoCaminho[], indice: number): AcaoDaEtapa[] {
  const atual = indiceDaEtapaAtual(etapas)
  const etapa = etapas[indice]
  if (indice !== atual) return RESOLVIDOS.has(etapa.status) && (atual === -1 || indice < atual) ? ['voltar'] : []
  const avancar: AcaoDaEtapa = etapa.status === 'pendente' ? 'iniciar' : 'concluir'
  return etapa.obrigatoria ? [avancar, 'realizada'] : [avancar, 'dispensar', 'realizada']
}

// O banco guarda a data como AAAA-MM-DD; a tela mostra DD/MM/AAAA.
export function formatarData(data: string | null): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
