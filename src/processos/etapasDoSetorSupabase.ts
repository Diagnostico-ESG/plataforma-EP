import type { ClienteSupabase } from '../lib/supabase'
import type { EtapaDoSetor, StatusDaEtapa } from './tipos'

/** Um andamento (de setor ou de processo) com a etapa do catálogo embutida, como o banco devolve. */
export type AndamentoLido = {
  id: string
  status: StatusDaEtapa
  nota: string | null
  iniciada_em: string | null
  resolvida_em: string | null
  etapas: { codigo: string; nome: string; ordem: number; obrigatoria: boolean } | null
}

export const COLUNAS_DO_ANDAMENTO = 'id, status, nota, iniciada_em, resolvida_em, etapas(codigo, nome, ordem, obrigatoria)'

// O banco não ordena o que vem embutido: a ordem do catálogo é aplicada por quem lê.
export async function lerEtapasDoSetor(cliente: ClienteSupabase, setorId: string): Promise<EtapaDoSetor[]> {
  const { data, error } = await cliente.from('andamentos').select(COLUNAS_DO_ANDAMENTO).eq('setor_id', setorId)
  if (error) throw new Error(`Falha ao ler as etapas do setor: ${error.message}`)
  return (data as AndamentoLido[]).flatMap(etapaDoAndamento).sort((a, b) => a.ordem - b.ordem)
}

export function etapaDoAndamento({ etapas, iniciada_em, resolvida_em, ...andamento }: AndamentoLido): EtapaDoSetor[] {
  if (!etapas) return []
  return [{ ...andamento, ...etapas, iniciadaEm: iniciada_em, resolvidaEm: resolvida_em }]
}
