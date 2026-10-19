import { formatarData } from './caminhoDeEtapas'
import { diasNaEtapa, passouDoLimite } from './diasNaEtapa'
import type { ProcessoDaLista } from './tipos'
import { rotuloDaVersao } from '../versoes/rotulos'

export type TomDoSelo = 'alerta' | 'neutro'
export type TipoDeSelo = 'dias' | 'relatorio' | 'sem_responsavel' | 'reuniao' | 'versao' | 'subprocessos'
export type Selo = { tipo: TipoDeSelo; texto: string; tom: TomDoSelo }

const CODIGO_DA_REVISAO_INTERNA = 'revisao_interna'

/** Processo parado: etapa atual em andamento há mais de 15 dias (a conta do Agora); nunca no suspenso. */
function seloDeDias(processo: ProcessoDaLista, hoje: string): Selo[] {
  const cartao = processo.cartao
  if (!cartao || processo.situacao === 'suspenso' || cartao.etapaAtualStatus !== 'em_andamento') return []
  const dias = diasNaEtapa(cartao.etapaAtualIniciadaEm, hoje)
  if (dias === null || !passouDoLimite(dias)) return []
  return [{ tipo: 'dias', texto: `${dias} dias nesta etapa`, tom: 'alerta' }]
}

// A posição vem da ordem do caminho, que já é a do catálogo.
function estaNaRevisaoInternaOuDepois(processo: ProcessoDaLista): boolean {
  const caminho = processo.cartao?.caminho ?? []
  const revisao = caminho.findIndex((pedaco) => pedaco.codigo === CODIGO_DA_REVISAO_INTERNA)
  const atual = caminho.findIndex((pedaco) => pedaco.codigo === processo.etapaAtual?.codigo)
  return revisao >= 0 && atual >= revisao
}

/** A última versão (não histórica) sem relatório só pesa da Revisão interna em diante. */
function seloDeRelatorio(processo: ProcessoDaLista): Selo[] {
  const versao = processo.cartao?.ultimaVersao
  if (!versao || versao.historica || versao.temRelatorio) return []
  if (!estaNaRevisaoInternaOuDepois(processo)) return []
  return [{ tipo: 'relatorio', texto: 'Relatório pendente', tom: 'alerta' }]
}

function seloDeResponsavel(processo: ProcessoDaLista): Selo[] {
  if (processo.etapaAtual === null || processo.responsavel !== null) return []
  return [{ tipo: 'sem_responsavel', texto: 'Sem responsável', tom: 'neutro' }]
}

/** A data de hoje ainda é a próxima reunião; só a de antes de hoje some. */
function seloDeReuniao(processo: ProcessoDaLista, hoje: string): Selo[] {
  const data = processo.dataDaReuniao
  if (!data || data < hoje) return []
  const texto = data === hoje ? 'Reunião hoje' : `Reunião ${formatarData(data).slice(0, 5)}`
  return [{ tipo: 'reuniao', texto, tom: 'neutro' }]
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

/** Só o que há a dizer, na ordem da spec: dias, Relatório pendente, Sem responsável, Reunião, versão, subprocessos. */
export function selosDoCartao(processo: ProcessoDaLista, hoje: string): Selo[] {
  return [
    ...seloDeDias(processo, hoje), ...seloDeRelatorio(processo), ...seloDeResponsavel(processo),
    ...seloDeReuniao(processo, hoje), ...seloDeVersao(processo), ...seloDeSubprocessos(processo),
  ]
}
