import { formatarData } from '../lib/datas'
import { CODIGO_CONCLUIDOS, CODIGO_DA_MODELAGEM_PILOTO, CODIGO_DA_REVISAO_INTERNA, CODIGO_NAO_INICIADOS } from './codigosDasEtapas'
import { diasDoProcessoParado } from './diasNaEtapa'
import { semPublicacao } from './publicacao'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'
import { rotuloDaVersao } from '../versoes/rotulos'

export type TomDoSelo = 'alerta' | 'neutro'
export type TipoDeSelo = 'sem_publicacao' | 'dias' | 'relatorio' | 'sem_responsavel' | 'modelagem' | 'versao' | 'subprocessos'
export type Selo = { tipo: TipoDeSelo; texto: string; tom: TomDoSelo }

/** Processo parado: mais de 7 dias na etapa atual (a conta do Agora); nunca em Não iniciados, Concluídos, suspenso ou cancelado. */
function seloDeDias(processo: ProcessoDaLista, hoje: string): Selo[] {
  const dias = diasDoProcessoParado(processo, hoje)
  if (dias === null) return []
  return [{ tipo: 'dias', texto: `${dias} dias nesta etapa`, tom: 'alerta' }]
}

// Da Revisão interna em diante e antes de Concluídos, pela ordem do catálogo.
function estaNaRevisaoInternaOuDepois(processo: ProcessoDaLista, etapas: EtapaDoCatalogo[]): boolean {
  const revisao = etapas.find((etapa) => etapa.codigo === CODIGO_DA_REVISAO_INTERNA)
  const atual = processo.etapaAtual
  return Boolean(revisao && atual && atual.codigo !== CODIGO_CONCLUIDOS && atual.ordem >= revisao.ordem)
}

/** A última versão (não histórica) sem relatório só pesa da Revisão interna em diante. */
function seloDeRelatorio(processo: ProcessoDaLista, etapas: EtapaDoCatalogo[]): Selo[] {
  const versao = processo.cartao?.ultimaVersao
  if (!versao || versao.historica || versao.temRelatorio) return []
  if (!estaNaRevisaoInternaOuDepois(processo, etapas)) return []
  return [{ tipo: 'relatorio', texto: 'Relatório pendente', tom: 'alerta' }]
}

function seloDeResponsavel(processo: ProcessoDaLista): Selo[] {
  if (processo.etapaAtual === null || processo.responsavel !== null) return []
  return [{ tipo: 'sem_responsavel', texto: 'Sem responsável', tom: 'neutro' }]
}

/** A Data da modelagem piloto de hoje ainda vale; só a de antes de hoje some. E só enquanto a modelagem não aconteceu: em Não iniciados ou na Modelagem piloto. */
function seloDeModelagem(processo: ProcessoDaLista, hoje: string): Selo[] {
  const data = processo.dataDaModelagemPiloto
  const codigo = processo.etapaAtual?.codigo
  if (!data || data < hoje) return []
  if (codigo !== CODIGO_NAO_INICIADOS && codigo !== CODIGO_DA_MODELAGEM_PILOTO) return []
  const texto = data === hoje ? 'Modelagem hoje' : `Modelagem ${formatarData(data).slice(0, 5)}`
  return [{ tipo: 'modelagem', texto, tom: 'neutro' }]
}

function seloDeVersao(processo: ProcessoDaLista): Selo[] {
  const versao = processo.cartao?.ultimaVersao
  return versao ? [{ tipo: 'versao', texto: rotuloDaVersao(versao), tom: 'neutro' }] : []
}

function seloDeSubprocessos(processo: ProcessoDaLista): Selo[] {
  const quantidade = processo.cartao?.subprocessos ?? 0
  if (quantidade === 0) return []
  const texto = quantidade === 1 ? '1 subprocesso' : `${quantidade} subprocessos`
  return [{ tipo: 'subprocessos', texto, tom: 'neutro' }]
}

function seloDeSemPublicacao(processo: ProcessoDaLista): Selo[] {
  return semPublicacao(processo) ? [{ tipo: 'sem_publicacao', texto: 'Sem publicação', tom: 'neutro' }] : []
}

/**
 * Só o que há a dizer, na ordem da spec: Sem publicação (só em Concluídos), dias, Relatório pendente, Sem responsável,
 * Modelagem, versão, subprocessos.
 */
export function selosDoCartao(processo: ProcessoDaLista, hoje: string, etapas: EtapaDoCatalogo[]): Selo[] {
  return [
    ...seloDeSemPublicacao(processo), ...seloDeDias(processo, hoje), ...seloDeRelatorio(processo, etapas),
    ...seloDeResponsavel(processo), ...seloDeModelagem(processo, hoje), ...seloDeVersao(processo), ...seloDeSubprocessos(processo),
  ]
}
