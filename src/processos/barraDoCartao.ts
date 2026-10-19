import type { PedacoDoCaminho, ProcessoDaLista, StatusDaEtapa } from './tipos'

export type EstadoDoPedaco = 'resolvida' | 'atual' | 'seguinte'
export type PedacoDaBarra = { codigo: string; estado: EstadoDoPedaco }
export type BarraDoCartao = { pedacos: PedacoDaBarra[]; nome: string }

const RESOLVIDOS = new Set<StatusDaEtapa>(['concluida', 'realizada_anteriormente', 'dispensada'])

function estadoDoPedaco(pedaco: PedacoDoCaminho, codigoAtual: string): EstadoDoPedaco {
  if (pedaco.codigo === codigoAtual) return 'atual'
  return RESOLVIDOS.has(pedaco.status) ? 'resolvida' : 'seguinte'
}

/**
 * Um pedaço por etapa do caminho, na ordem do catálogo (dispensada e realizada anteriormente contam como resolvidas),
 * com o nome acessível "Etapa {n} de {total}: {etapa}". null quando não há o que desenhar: sem cartão, sem caminho
 * ou com a etapa atual fora do caminho.
 */
export function barraDoCartao(processo: ProcessoDaLista): BarraDoCartao | null {
  const caminho = processo.cartao?.caminho ?? []
  const atual = processo.etapaAtual
  const posicao = atual === null ? -1 : caminho.findIndex((pedaco) => pedaco.codigo === atual.codigo)
  if (atual === null || posicao < 0) return null
  const pedacos = caminho.map((pedaco) => ({ codigo: pedaco.codigo, estado: estadoDoPedaco(pedaco, atual.codigo) }))
  return { pedacos, nome: `Etapa ${posicao + 1} de ${caminho.length}: ${atual.nome}` }
}
