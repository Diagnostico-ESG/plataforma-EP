import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from './recusasDoBanco'
import type { ModuloDeProcessos } from './tipos'

// As funções do banco conferem tudo (situação, perfil); as recusas chegam de fora (as de processos), como em situacaoSupabase.
export function criarArquivamentoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, 'arquivar' | 'desarquivar'> {
  const conferir = async (pedido: PromiseLike<{ error: { message: string; code?: string } | null }>) => {
    const { error } = await pedido
    if (error) throw falhaDoBanco(error, recusas)
  }
  return {
    arquivar: (id) => conferir(cliente.rpc('arquivar_processo', { p_processo: id })),
    desarquivar: (id) => conferir(cliente.rpc('desarquivar_processo', { p_processo: id })),
  }
}
