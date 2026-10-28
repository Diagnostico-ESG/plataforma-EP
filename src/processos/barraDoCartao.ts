import type { ProcessoDaLista } from './tipos'

export type BarraDoCartao = { fracao: number; nome: string; texto: string }

/**
 * A fração da faixa que se enche: posição da etapa atual sobre o total de etapas ativas (em Concluídos, a última, então cheia),
 * com o nome acessível "Etapa {n} de {total}: {etapa}" e o texto visível "{etapa} · {n} de {total}". null sem etapa atual.
 */
export function barraDoCartao(processo: ProcessoDaLista): BarraDoCartao | null {
  const atual = processo.etapaAtual
  if (atual === null) return null
  return {
    fracao: atual.posicao / atual.total,
    nome: `Etapa ${atual.posicao} de ${atual.total}: ${atual.nome}`,
    texto: `${atual.nome} · ${atual.posicao} de ${atual.total}`,
  }
}
