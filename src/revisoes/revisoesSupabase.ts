import { type RecusasDoModulo, porQueNadaMudou } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from '../processos/recusasDoBanco'
import type { Aprovacao, DadosDaAprovacao, DadosDaEdicaoDaRevisao, ModuloDeRevisoes, RevisaoInterna } from './tipos'

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

// As recusas chegam de fora (as de processos). Registrar revisão e aprovação sem trava chega no ticket 05 de revisoes-aprovacao.
export function criarRevisoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDeRevisoes {
  return {
    listarRevisoes: (processoId) => listarRevisoes(cliente, processoId),
    lerAprovacao: (processoId) => lerAprovacao(cliente, processoId),
    editarRevisao: (id, dados) => editarRevisao(cliente, id, dados, recusas),
    editarAprovacao: (id, dados) => editarAprovacao(cliente, id, dados, recusas),
  }
}

async function listarRevisoes(cliente: ClienteSupabase, processoId: string): Promise<RevisaoInterna[]> {
  const { data, error } = await cliente.from('revisoes_internas').select(COLUNAS)
    .eq('processo_id', processoId).order('registrada_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler as revisões do processo ${processoId}: ${error.message}`)
  return (data as unknown as LinhaDaRevisao[]).map(revisaoDaLinha)
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

// Só o escopo e o comentário se alteram (o resto não tem privilégio). A RLS não acusa erro ao filtrar: zero linhas com o
// registro ainda legível é perfil; ilegível, o registro sumiu.
async function editarRevisao(
  cliente: ClienteSupabase, id: string, dados: DadosDaEdicaoDaRevisao, recusas: RecusasDoModulo,
): Promise<void> {
  const { data, error } = await cliente.from('revisoes_internas')
    .update({ escopo: dados.escopo, comentario: dados.comentario }).eq('id', id).select('id')
  if (error) throw falhaDoBanco(error, recusas)
  if (data.length) return
  const existe = Boolean((await cliente.from('revisoes_internas').select('id').eq('id', id)).data?.length)
  throw porQueNadaMudou(existe, recusas)
}

// Número, link e data: o banco confere de novo o formato do link e as datas, como na conclusão.
async function editarAprovacao(
  cliente: ClienteSupabase, id: string, dados: DadosDaAprovacao, recusas: RecusasDoModulo,
): Promise<void> {
  const { data, error } = await cliente.from('aprovacoes')
    .update({ numero_eprotocolo: dados.numeroEprotocolo, link: dados.link, aprovada_em: dados.aprovadaEm })
    .eq('id', id).select('id')
  if (error) throw falhaDoBanco(error, recusas)
  if (data.length) return
  const existe = Boolean((await cliente.from('aprovacoes').select('id').eq('id', id)).data?.length)
  throw porQueNadaMudou(existe, recusas)
}
