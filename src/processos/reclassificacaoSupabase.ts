import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from './andamentosSupabase'
import type { ModuloDeProcessos } from './tipos'

// As recusas chegam de fora (as de processos), como em situacaoSupabase.
export function criarReclassificacaoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, 'reclassificarProcesso'> {
  return {
    reclassificarProcesso: async (id, { tipo, processoPaiId }, motivo) => {
      // O gerador de tipos do Supabase não marca parâmetro de função como anulável; o banco aceita o pai nulo
      // (virar processo), e a função o ignora fora do subprocesso.
      const { error } = await cliente.rpc('reclassificar_processo', {
        p_processo: id, p_tipo: tipo, p_pai: processoPaiId as string, p_motivo: motivo,
      })
      if (error) throw falhaDoAndamento(error, recusas)
    },
  }
}
