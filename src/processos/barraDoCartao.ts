import type { ProcessoDaLista } from './tipos'

export type EstadoDoPedaco = 'resolvida' | 'atual' | 'seguinte'
export type PedacoDaBarra = { posicao: number; estado: EstadoDoPedaco }
export type BarraDoCartao = { pedacos: PedacoDaBarra[]; nome: string }

/**
 * Um pedaço por etapa ativa (as anteriores à atual preenchidas, a atual destacada e as seguintes vazias; em Concluídos,
 * todos preenchidos), com o nome acessível "Etapa {n} de {total}: {etapa}". null sem etapa atual.
 */
export function barraDoCartao(processo: ProcessoDaLista): BarraDoCartao | null {
  const atual = processo.etapaAtual
  if (atual === null) return null
  const ultima = atual.posicao === atual.total
  const pedacos = Array.from({ length: atual.total }, (_, indice): PedacoDaBarra => {
    const posicao = indice + 1
    if (ultima || posicao < atual.posicao) return { posicao, estado: 'resolvida' }
    return { posicao, estado: posicao === atual.posicao ? 'atual' : 'seguinte' }
  })
  return { pedacos, nome: `Etapa ${atual.posicao} de ${atual.total}: ${atual.nome}` }
}
