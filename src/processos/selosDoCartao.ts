import { CODIGO_CONCLUIDOS, CODIGO_DA_REVISAO_INTERNA } from './codigosDasEtapas'
import { diasDoProcessoParado } from './diasNaEtapa'
import { semPublicacao } from './publicacao'
import type { EtapaDoCatalogo, ProcessoDaLista } from './tipos'
import { rotuloDaVersao } from '../versoes/rotulos'

export type TomDoSelo = 'alerta' | 'neutro'
export type TipoDeSelo = 'sem_publicacao' | 'dias' | 'relatorio' | 'versao' | 'subprocessos'
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
 * Só o que há a dizer, na ordem da spec: Sem publicação (só em Concluídos), dias, Relatório pendente, versão, subprocessos.
 * Os selos Sem responsável e da data da modelagem piloto saíram: só ocupavam espaço (spec enxugar-cartao-e-cadastro).
 */
export function selosDoCartao(processo: ProcessoDaLista, hoje: string, etapas: EtapaDoCatalogo[]): Selo[] {
  return [
    ...seloDeSemPublicacao(processo), ...seloDeDias(processo, hoje), ...seloDeRelatorio(processo, etapas),
    ...seloDeVersao(processo), ...seloDeSubprocessos(processo),
  ]
}
