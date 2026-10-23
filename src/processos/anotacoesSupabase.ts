import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from './andamentosSupabase'
import type { ModuloDeProcessos } from './tipos'

type OperacoesDasAnotacoes = Pick<ModuloDeProcessos, 'lerAnotacoes' | 'gravarAnotacoes'>
type LinhaDasAnotacoes = { anotacoes: string | null; anotacoes_alteradas_em: string | null; autor: { nome: string } | null }
type RetornoDaGravacao = { texto: string | null; alterado_em: string | null; alterado_por_nome: string | null }

const CODIGO_DO_CONFLITO = 'anotacoes_em_conflito'

// As Anotações ficam fora da view do processo (ADR 0021): o verso as lê direto da tabela, com o nome de quem alterou.
// O supabase-js manda null como null; o tipo gerado não o admite nos parâmetros, como em avancar_etapa.
export function criarAnotacoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): OperacoesDasAnotacoes {
  return {
    lerAnotacoes: async (id) => {
      const { data, error } = await cliente.from('processos')
        .select('anotacoes, anotacoes_alteradas_em, autor:usuarios(nome)').eq('id', id)
      if (error) throw new Error(`Falha ao ler as anotações do processo: ${error.message}`)
      const linha = (data as unknown as LinhaDasAnotacoes[])[0]
      if (!linha) return null
      return { texto: linha.anotacoes, alteradoPor: linha.autor?.nome ?? null, alteradoEm: linha.anotacoes_alteradas_em }
    },
    gravarAnotacoes: async (id, esperado, novo) => {
      const { data, error } = await cliente.rpc('gravar_anotacoes_do_processo',
        { p_processo: id, p_esperado: esperado as string, p_novo: novo as string })
      if (error?.message.includes(CODIGO_DO_CONFLITO)) return { tipo: 'conflito' }
      if (error) throw falhaDoAndamento(error, recusas)
      return { tipo: 'gravado', anotacoes: anotacoesGravadas(data) }
    },
  }
}

function anotacoesGravadas(data: unknown) {
  const linha = (data as RetornoDaGravacao[] | null)?.[0]
  if (!linha) {
    throw new Error(`O banco não devolveu a linha das anotações gravadas: recebido ${JSON.stringify(data)}, esperado uma linha com texto, alterado_em e alterado_por_nome.`)
  }
  return { texto: linha.texto, alteradoPor: linha.alterado_por_nome, alteradoEm: linha.alterado_em }
}
