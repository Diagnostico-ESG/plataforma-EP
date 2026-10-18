import type { EtapaDoCaminho, StatusDaEtapa } from './tipos'

/** Um andamento com a etapa do catálogo embutida, como o banco devolve. */
export type AndamentoLido = {
  id: string
  status: StatusDaEtapa
  nota: string | null
  iniciada_em: string | null
  resolvida_em: string | null
  etapas: { codigo: string; nome: string; ordem: number; obrigatoria: boolean } | null
}

export const COLUNAS_DO_ANDAMENTO = 'id, status, nota, iniciada_em, resolvida_em, etapas(codigo, nome, ordem, obrigatoria)'

export function etapaDoAndamento({ etapas, iniciada_em, resolvida_em, ...andamento }: AndamentoLido): EtapaDoCaminho[] {
  if (!etapas) return []
  return [{ ...andamento, ...etapas, iniciadaEm: iniciada_em, resolvidaEm: resolvida_em }]
}
