import { indiceDaEtapaAtual, proximaPendente } from './caminhoDeEtapas'
import { CHAVE_DOS_CONCLUIDOS, CODIGO_DA_PUBLICACAO } from './publicacao'
import type { EtapaDoCaminho, ProcessoDaLista } from './tipos'

/**
 * O código da coluna onde soltar o cartão para concluir a etapa atual: a da primeira etapa pendente depois dela
 * (a vizinha pode já estar resolvida). null quando o cartão não se arrasta: processo parado, etapa atual ainda
 * pendente (ela se inicia pelo verso, para não perder a data de início) ou sem pendente depois.
 */
export function colunaDeDestino(processo: ProcessoDaLista): string | null {
  const { cartao, etapaAtual, situacao } = processo
  if (!cartao || !etapaAtual || situacao !== 'em_andamento' || cartao.etapaAtualStatus !== 'em_andamento') return null
  const posicao = cartao.caminho.findIndex((pedaco) => pedaco.codigo === etapaAtual.codigo)
  if (posicao < 0) return null
  const proxima = cartao.caminho.slice(posicao + 1).find((pedaco) => pedaco.status === 'pendente')?.codigo ?? null
  // Concluir a Publicação leva o processo a Concluídos.
  return proxima ?? (etapaAtual.codigo === CODIGO_DA_PUBLICACAO ? CHAVE_DOS_CONCLUIDOS : null)
}

/**
 * A etapa a concluir e a que o avanço inicia, num processo lido; null se o Quadro estava desatualizado. A Publicação sem
 * pendente depois avança sem próxima.
 */
export function avancoDoCartao(etapas: EtapaDoCaminho[]): { etapa: EtapaDoCaminho; proxima: EtapaDoCaminho | null } | null {
  const indice = indiceDaEtapaAtual(etapas)
  if (indice < 0 || etapas[indice].status !== 'em_andamento') return null
  const etapa = etapas[indice]
  const proxima = proximaPendente(etapas, indice)
  return proxima || etapa.codigo === CODIGO_DA_PUBLICACAO ? { etapa, proxima } : null
}
