import { type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { fraseDeCodigoRepetido, fraseDeNomeRepetido } from './frasesDoCatalogo'
import { type ContextoDaRecusa, falhaDoBanco } from './recusasDoBanco'
import type { EtapaNoCatalogo, EtapaNova, ModuloDoCatalogo } from './tipos'

type MudancaDaEtapa = Database['public']['Tables']['etapas']['Update']
type RespostaDaGravacao = { data: { id: string }[] | null; error: ErroDoBanco | null }
/** O que a gravação levou (nome e código, para a frase da repetição) e a ação, para a frase da etapa com processos. */
type ValoresGravados = ContextoDaRecusa & { nome?: string; codigo?: string }

// As recusas chegam de fora (as de processos), como em situacaoSupabase.
export function criarCatalogoSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDoCatalogo {
  const mudar = (id: string, mudanca: MudancaDaEtapa, valores: ValoresGravados = {}) => mudarEtapa(cliente, id, mudanca, recusas, valores)
  return {
    listarCatalogo: () => listarCatalogo(cliente),
    acrescentarEtapa: (etapa) => acrescentarEtapa(cliente, etapa, recusas),
    editarEtapa: (id, { nome, fase }) => mudar(id, { nome, fase }, { nome }),
    desativarEtapa: (id) => mudar(id, { ativa: false }, { acao: 'desativar' }),
    reativarEtapa: (id) => mudar(id, { ativa: true }),
    moverEtapa: async (id, sentido) => {
      const { error } = await cliente.rpc('mover_etapa', { p_etapa: id, p_sentido: sentido })
      if (error) throw falhaDoCatalogo(error, recusas, {})
    },
    excluirEtapa: async (id) => {
      const resposta = await cliente.from('etapas').delete().eq('id', id).select('id')
      await conferirGravacao(cliente, id, recusas, resposta, { acao: 'excluir' })
    },
  }
}

async function listarCatalogo(cliente: ClienteSupabase): Promise<EtapaNoCatalogo[]> {
  const { data, error } = await cliente.from('etapas').select('id, codigo, nome, ordem, fase, ativa').order('ordem')
  if (error) throw new Error(`Falha ao ler o catálogo de etapas: ${error.message}`)
  return data
}

async function acrescentarEtapa(cliente: ClienteSupabase, etapa: EtapaNova, recusas: RecusasDoModulo): Promise<void> {
  // O gerador de tipos do Supabase não marca parâmetro de função como anulável; o banco aceita a posição nula
  // ("logo antes de Concluídos").
  const { error } = await cliente.rpc('acrescentar_etapa', {
    p_codigo: etapa.codigo, p_nome: etapa.nome, p_fase: etapa.fase, p_antes_de: etapa.antesDe as string,
  })
  if (error) throw falhaDoCatalogo(error, recusas, etapa)
}

async function mudarEtapa(
  cliente: ClienteSupabase, id: string, mudanca: MudancaDaEtapa, recusas: RecusasDoModulo, valores: ValoresGravados,
): Promise<void> {
  const resposta = await cliente.from('etapas').update(mudanca).eq('id', id).select('id')
  await conferirGravacao(cliente, id, recusas, resposta, valores)
}

// A RLS não acusa erro ao filtrar: sem linha afetada, a leitura decide entre perfil e etapa que sumiu.
async function conferirGravacao(
  cliente: ClienteSupabase, id: string, recusas: RecusasDoModulo, { data, error }: RespostaDaGravacao, valores: ValoresGravados,
): Promise<void> {
  if (error) throw falhaDoCatalogo(error, recusas, valores)
  if (data?.length) return
  const { data: lidas } = await cliente.from('etapas').select('id').eq('id', id)
  throw porQueNadaMudou(Boolean(lidas?.length), recusas)
}

// Os índices únicos do catálogo (migração etapas_do_setor) chegam como 23505 com o nome do índice.
function falhaDoCatalogo(erro: ErroDoBanco, recusas: RecusasDoModulo, valores: ValoresGravados): Error {
  if (erro.code === '23505' && erro.message.includes('etapas_nome_unico')) return new TravaDoBanco(fraseDeNomeRepetido(valores.nome ?? ''))
  if (erro.code === '23505' && erro.message.includes('etapas_codigo_key')) return new TravaDoBanco(fraseDeCodigoRepetido(valores.codigo ?? ''))
  return falhaDoBanco(erro, recusas, valores)
}
