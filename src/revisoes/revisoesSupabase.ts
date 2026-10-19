import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from '../processos/andamentosSupabase'
import type { Aprovacao, DadosDaAprovacao, DadosDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

// O revisor e as duas versões (a revisada e, na "corrigida", a corrigida) vêm junto, pelas chaves estrangeiras.
const COLUNAS = 'id, resultado, escopo, comentario, revisada_em, revisor:usuarios(nome), '
  + 'revisada:versoes!versao_revisada_id(numero), corrigida:versoes!versao_corrigida_id(numero)'

type LinhaDaRevisao = {
  id: string
  resultado: RevisaoInterna['resultado']
  escopo: RevisaoInterna['escopo']
  comentario: string | null
  revisada_em: string
  revisor: { nome: string } | null
  revisada: { numero: number }
  corrigida: { numero: number } | null
}

function revisaoDaLinha(linha: LinhaDaRevisao): RevisaoInterna {
  return {
    id: linha.id, versaoRevisada: linha.revisada.numero, versaoCorrigida: linha.corrigida?.numero ?? null,
    resultado: linha.resultado, escopo: linha.escopo, comentario: linha.comentario, revisor: linha.revisor?.nome ?? null,
    revisadaEm: linha.revisada_em,
  }
}

// As recusas chegam de fora (as de processos): a revisão grava numa função que também conclui a etapa.
export function criarRevisoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDeRevisoes {
  return {
    listarRevisoes: (processoId) => listarRevisoes(cliente, processoId),
    concluirRevisaoInterna: (andamentoId, dados, responsavelId) =>
      concluirRevisaoInterna(cliente, andamentoId, dados, responsavelId, recusas),
    lerAprovacao: (processoId) => lerAprovacao(cliente, processoId),
    concluirAprovacao: (andamentoId, dados, responsavelId) =>
      concluirAprovacao(cliente, andamentoId, dados, responsavelId, recusas),
  }
}

async function listarRevisoes(cliente: ClienteSupabase, processoId: string): Promise<RevisaoInterna[]> {
  const { data, error } = await cliente.from('revisoes_internas').select(COLUNAS)
    .eq('processo_id', processoId).order('registrada_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler as revisões do processo ${processoId}: ${error.message}`)
  return (data as unknown as LinhaDaRevisao[]).map(revisaoDaLinha)
}

// A revisão e a conclusão se gravam juntas, numa função do banco. O supabase-js manda null como null; o tipo gerado
// não o admite nos parâmetros, como em avancar_etapa.
async function concluirRevisaoInterna(
  cliente: ClienteSupabase, andamentoId: string, dados: DadosDaRevisao, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('concluir_revisao_interna', {
    p_andamento: andamentoId, p_resultado: dados.resultado, p_escopo: dados.escopo as 'ambos',
    p_comentario: dados.comentario as string, p_responsavel: responsavelId as string,
  })
  if (error) throw falhaDoAndamento(error, recusas)
}

// A versão aprovada e quem registrou vêm junto, pelas chaves estrangeiras. Uma aprovação por processo.
const COLUNAS_DA_APROVACAO = 'id, numero_eprotocolo, link, aprovada_em, registrada_em, '
  + 'versao:versoes(numero), registrador:usuarios!registrada_por(nome)'

type LinhaDaAprovacao = {
  id: string
  numero_eprotocolo: string | null
  link: string | null
  aprovada_em: string | null
  registrada_em: string
  versao: { numero: number }
  registrador: { nome: string } | null
}

function aprovacaoDaLinha(linha: LinhaDaAprovacao): Aprovacao {
  return {
    id: linha.id, versao: linha.versao.numero, numeroEprotocolo: linha.numero_eprotocolo, link: linha.link,
    aprovadaEm: linha.aprovada_em, registradaPor: linha.registrador?.nome ?? null, registradaEm: linha.registrada_em,
  }
}

async function lerAprovacao(cliente: ClienteSupabase, processoId: string): Promise<Aprovacao | null> {
  const { data, error } = await cliente.from('aprovacoes').select(COLUNAS_DA_APROVACAO).eq('processo_id', processoId)
  if (error) throw new Error(`Falha ao ler a aprovação do processo ${processoId}: ${error.message}`)
  const [linha] = data as unknown as LinhaDaAprovacao[]
  return linha ? aprovacaoDaLinha(linha) : null
}

// A aprovação e a conclusão se gravam juntas, numa função do banco. Os campos vazios vão como null (o tipo gerado não o admite).
async function concluirAprovacao(
  cliente: ClienteSupabase, andamentoId: string, dados: DadosDaAprovacao, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('concluir_aprovacao', {
    p_andamento: andamentoId, p_numero: dados.numeroEprotocolo as string, p_link: dados.link as string,
    p_data: dados.aprovadaEm as string, p_responsavel: responsavelId as string,
  })
  if (error) throw falhaDoAndamento(error, recusas)
}
