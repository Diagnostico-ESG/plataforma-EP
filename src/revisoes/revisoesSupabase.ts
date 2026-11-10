import { type RecusasDoModulo, porQueNadaMudou } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoBanco } from '../processos/recusasDoBanco'
import type { ArquivoDaVersao } from '../versoes/tipos'
import type { Database } from '../types/database'
import type {
  Aprovacao, DadosDaAprovacao, DadosDaEdicaoDaRevisao, DadosDaRevisao, EtapaDaRevisao, ModuloDeRevisoes, RevisaoInterna,
} from './tipos'

// O revisor, as duas versões (a revisada e, na "corrigida", a corrigida), os dois relatórios e a passagem (aberta ou não,
// com a etapa, que diz de qual revisão é) vêm junto, pelas chaves estrangeiras.
const COLUNAS = 'id, resultado, escopo, comentario, revisada_em, revisor:usuarios(nome), '
  + 'revisada:versoes!versao_revisada_id(numero), corrigida:versoes!versao_corrigida_id(numero), '
  + 'relatorio_revisado:arquivos_da_versao!relatorio_revisado_id(numero_do_relatorio), '
  + 'relatorio_corrigido:arquivos_da_versao!relatorio_corrigido_id(numero_do_relatorio), passagem:passagens(saiu_em, etapa:etapas(codigo))'

type LinhaDaRevisao = {
  id: string
  resultado: RevisaoInterna['resultado']
  escopo: RevisaoInterna['escopo']
  comentario: string | null
  revisada_em: string
  revisor: { nome: string } | null
  revisada: { numero: number }
  corrigida: { numero: number } | null
  relatorio_revisado: { numero_do_relatorio: number | null } | null
  relatorio_corrigido: { numero_do_relatorio: number | null } | null
  passagem: { saiu_em: string | null; etapa: { codigo: string } | null } | null
}

// A revisão antiga, sem passagem, é da Revisão do fluxograma (ADR 0046).
function etapaDaLinha(linha: LinhaDaRevisao): EtapaDaRevisao {
  return linha.passagem?.etapa?.codigo === 'revisao_relatorio' ? 'revisao_relatorio' : 'revisao_interna'
}

function relatoriosDaLinha(linha: LinhaDaRevisao): Pick<RevisaoInterna, 'relatorioRevisado' | 'relatorioCorrigido'> {
  return {
    relatorioRevisado: linha.relatorio_revisado?.numero_do_relatorio ?? null,
    relatorioCorrigido: linha.relatorio_corrigido?.numero_do_relatorio ?? null,
  }
}

function revisaoDaLinha(linha: LinhaDaRevisao): RevisaoInterna {
  return {
    id: linha.id, etapa: etapaDaLinha(linha), versaoRevisada: linha.revisada.numero, versaoCorrigida: linha.corrigida?.numero ?? null,
    ...relatoriosDaLinha(linha),
    resultado: linha.resultado, escopo: linha.escopo, comentario: linha.comentario, revisor: linha.revisor?.nome ?? null,
    revisadaEm: linha.revisada_em, daPassagemAberta: linha.passagem?.saiu_em === null,
  }
}

// As recusas chegam de fora (as de processos).
export function criarRevisoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): ModuloDeRevisoes {
  return {
    listarRevisoes: (processoId) => listarRevisoes(cliente, processoId),
    lerAprovacao: (processoId) => lerAprovacao(cliente, processoId),
    registrarRevisao: (processoId, dados) => registrarRevisao(cliente, processoId, dados, recusas),
    registrarAprovacao: (processoId, dados) => registrarAprovacao(cliente, processoId, dados, recusas),
    editarRevisao: (id, dados) => editarRevisao(cliente, id, dados, recusas),
    editarAprovacao: (id, dados) => editarAprovacao(cliente, id, dados, recusas),
    registrarDataDaValidacao: (processoId, data) => registrarDataDaValidacao(cliente, processoId, data, recusas),
  }
}

async function listarRevisoes(cliente: ClienteSupabase, processoId: string): Promise<RevisaoInterna[]> {
  const { data, error } = await cliente.from('revisoes_internas').select(COLUNAS)
    .eq('processo_id', processoId).order('registrada_em', { ascending: false })
  if (error) throw new Error(`Falha ao ler as revisões do processo ${processoId}: ${error.message}`)
  return (data as unknown as LinhaDaRevisao[]).map(revisaoDaLinha)
}

// A versão aprovada, quem registrou e os .pdfs (o atual e os guardados) vêm junto, pelas chaves estrangeiras. Uma aprovação
// por processo.
const COLUNAS_DA_APROVACAO = 'id, numero_eprotocolo, link, aprovada_em, registrada_em, '
  + 'versao:versoes(numero), registrador:usuarios!registrada_por(nome), pdfs:pdfs_da_aprovacao(id, nome, tamanho, guardado_em)'

type LinhaDaAprovacao = {
  id: string
  numero_eprotocolo: string | null
  link: string | null
  aprovada_em: string | null
  registrada_em: string
  versao: { numero: number }
  registrador: { nome: string } | null
  pdfs?: { id: string; nome: string; tamanho: number; guardado_em: string | null }[]
}

// O .pdf atual é o que não foi guardado (a aprovação trocada deixa o dela guardado, para o histórico).
function pdfAtualDaLinha(linha: LinhaDaAprovacao): ArquivoDaVersao | null {
  const atual = (linha.pdfs ?? []).find((pdf) => pdf.guardado_em === null)
  return atual ? { id: atual.id, papel: 'pdf_da_aprovacao', nome: atual.nome, formato: 'pdf', tamanho: atual.tamanho } : null
}

function aprovacaoDaLinha(linha: LinhaDaAprovacao): Aprovacao {
  return {
    id: linha.id, versao: linha.versao.numero, numeroEprotocolo: linha.numero_eprotocolo, link: linha.link,
    aprovadaEm: linha.aprovada_em, registradaPor: linha.registrador?.nome ?? null, registradaEm: linha.registrada_em,
    pdf: pdfAtualDaLinha(linha),
  }
}

async function lerAprovacao(cliente: ClienteSupabase, processoId: string): Promise<Aprovacao | null> {
  const { data, error } = await cliente.from('aprovacoes').select(COLUNAS_DA_APROVACAO).eq('processo_id', processoId)
  if (error) throw new Error(`Falha ao ler a aprovação do processo ${processoId}: ${error.message}`)
  const [linha] = data as unknown as LinhaDaAprovacao[]
  return linha ? aprovacaoDaLinha(linha) : null
}

// O revisor, o dia, a passagem, as versões, os relatórios e o escopo são do banco (colunas sem privilégio de inclusão): o
// gatilho decide tudo.
type RevisaoParaIncluir = Pick<Database['public']['Tables']['revisoes_internas']['Insert'], 'processo_id' | 'resultado' | 'comentario'>

async function registrarRevisao(
  cliente: ClienteSupabase, processoId: string, dados: DadosDaRevisao, recusas: RecusasDoModulo,
): Promise<void> {
  const nova: RevisaoParaIncluir = { processo_id: processoId, ...dados }
  const { error } = await cliente.from('revisoes_internas').insert(nova as Database['public']['Tables']['revisoes_internas']['Insert'])
  if (error) throw falhaDoBanco(error, recusas)
}

// A função inclui a aprovação ou toma o lugar da anterior; quem não pode alterar recebe 42501.
async function registrarAprovacao(
  cliente: ClienteSupabase, processoId: string, dados: DadosDaAprovacao, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('registrar_aprovacao', {
    p_processo: processoId, p_numero: dados.numeroEprotocolo as string, p_link: dados.link as string, p_data: dados.aprovadaEm as string,
  })
  if (error) throw falhaDoBanco(error, recusas)
}

// A data da validação (ou null para apagar): só a função do banco a grava, com o processo na Validação com o setor.
async function registrarDataDaValidacao(
  cliente: ClienteSupabase, processoId: string, data: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('registrar_data_da_validacao', { p_processo: processoId, p_data: data as string })
  if (error) throw falhaDoBanco(error, recusas, { data: 'validacao' })
}

// O resultado e o comentário se alteram (o resto, o escopo também, não tem privilégio). A RLS não acusa erro ao filtrar: zero
// linhas com o registro ainda legível é perfil; ilegível, o registro sumiu.
async function editarRevisao(
  cliente: ClienteSupabase, id: string, dados: DadosDaEdicaoDaRevisao, recusas: RecusasDoModulo,
): Promise<void> {
  const { data, error } = await cliente.from('revisoes_internas')
    .update({ resultado: dados.resultado, comentario: dados.comentario }).eq('id', id).select('id')
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
