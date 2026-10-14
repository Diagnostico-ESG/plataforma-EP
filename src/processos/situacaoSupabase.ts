import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from './andamentosSupabase'
import type { ModuloDeProcessos } from './tipos'

type OperacoesDeSituacao = 'suspenderProcesso' | 'cancelarProcesso' | 'retomarProcesso'
type FuncaoDeSituacao = 'suspender_processo' | 'cancelar_processo' | 'retomar_processo'

// As recusas chegam de fora (as de processos), como em andamentosSupabase.
export function criarSituacaoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDeSituacao> {
  const mudar = (funcao: FuncaoDeSituacao, id: string, motivo: string) => mudarSituacao(cliente, funcao, id, motivo, recusas)
  return {
    suspenderProcesso: (id, motivo) => mudar('suspender_processo', id, motivo),
    cancelarProcesso: (id, motivo) => mudar('cancelar_processo', id, motivo),
    retomarProcesso: (id, motivo) => mudar('retomar_processo', id, motivo),
  }
}

async function mudarSituacao(
  cliente: ClienteSupabase, funcao: FuncaoDeSituacao, id: string, motivo: string, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc(funcao, { p_processo: id, p_motivo: motivo })
  if (error) throw falhaDoAndamento(error, recusas)
}
