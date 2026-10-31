import type { ProcessoDaLista } from './tipos'

export type BarraDoCartao = { posicao: number; total: number; nome: string; texto: string }

/**
 * A posição da etapa atual entre as etapas ativas (em Concluídos, a última), de onde saem os tracinhos feitos, o atual e os futuros,
 * com o nome acessível "Etapa {n} de {total}: {etapa}" e o texto visível "{etapa} · {n} de {total}". null sem etapa atual.
 */
export function barraDoCartao(processo: ProcessoDaLista): BarraDoCartao | null {
  const atual = processo.etapaAtual
  if (atual === null) return null
  return {
    posicao: atual.posicao,
    total: atual.total,
    nome: `Etapa ${atual.posicao} de ${atual.total}: ${atual.nome}`,
    texto: `${atual.nome} · ${atual.posicao} de ${atual.total}`,
  }
}
