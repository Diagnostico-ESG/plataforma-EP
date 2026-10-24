import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from './andamentosSupabase'
import { semTipos } from './clienteSemTipos'
import type { ModuloDeProcessos } from './tipos'

type OperacoesDaPublicacao = 'naoVaiMaisParaPublicacao' | 'registrarPublicacao' | 'arquivar' | 'desarquivar'

// As funções do banco conferem tudo (situação, datas, perfil); as recusas chegam de fora (as de processos), como em
// situacaoSupabase. A nota vazia vai como null; o tipo gerado não admite null no parâmetro, como em avancar_etapa.
export function criarPublicacaoSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDaPublicacao> {
  const conferir = async (pedido: PromiseLike<{ error: { message: string; code?: string } | null }>) => {
    const { error } = await pedido
    if (error) throw falhaDoAndamento(error, recusas)
  }
  return {
    naoVaiMaisParaPublicacao: (id, motivo) => conferir(semTipos(cliente).rpc('nao_vai_mais_para_publicacao', { p_processo: id, p_motivo: motivo })),
    registrarPublicacao: (id, data, nota) => conferir(semTipos(cliente).rpc('registrar_publicacao', {
      p_processo: id, p_data: data, p_nota: (nota?.trim() || null) as string,
    })),
    arquivar: (id) => conferir(cliente.rpc('arquivar_processo', { p_processo: id })),
    desarquivar: (id) => conferir(cliente.rpc('desarquivar_processo', { p_processo: id })),
  }
}
