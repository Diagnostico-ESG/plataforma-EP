import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from './recusasDoBanco'
import type { ModuloDeProcessos } from './tipos'

// A função do banco confere a etapa, a situação, a data, o link e o arquivado; as recusas chegam de fora (as de processos).
export function criarPublicacaoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, 'registrarPublicacao'> {
  return {
    registrarPublicacao: async (id, data, link) => {
      // O link só vai quando existe: o tipo gerado não admite null nos parâmetros.
      const { error } = await cliente.rpc('registrar_publicacao', { p_processo: id, p_data: data, ...(link !== null && { p_link: link }) })
      if (error) throw falhaDoBanco(error, recusas)
    },
  }
}
