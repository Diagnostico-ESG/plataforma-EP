import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from './recusasDoBanco'
import type { ModuloDeProcessos } from './tipos'

// As funções do banco conferem a situação e o perfil; nenhuma grava evento no histórico. As recusas chegam de fora (as de processos).
export function criarTirarDoQuadroSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, 'tirarDoQuadro' | 'voltarAoQuadro'> {
  const chamar = async (funcao: 'tirar_do_quadro' | 'voltar_ao_quadro', id: string) => {
    const { error } = await cliente.rpc(funcao, { p_processo: id })
    if (error) throw falhaDoBanco(error, recusas)
  }
  return {
    tirarDoQuadro: (id) => chamar('tirar_do_quadro', id),
    voltarAoQuadro: (id) => chamar('voltar_ao_quadro', id),
  }
}
