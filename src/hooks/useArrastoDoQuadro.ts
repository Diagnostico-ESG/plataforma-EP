import { useState } from 'react'
import { etapaDeDestino } from '../processos/destinoDoArrastar'
import type { EtapaDoCatalogo, ProcessoDaLista } from '../processos/tipos'
import type { DestinoDoMovimento } from './useMovimentoDoProcesso'

export type ArrastoDoQuadro = {
  /** O cartão que está sendo arrastado; null fora do arrastar. */
  levantado: ProcessoDaLista | null
  /** A coluna sob o cartão (a que recebe o realce); null fora do arrastar. */
  sobre: string | null
  levantar: (processo: ProcessoDaLista) => void
  baixar: () => void
  /** O cartão passou por cima de uma coluna: ela ganha o realce. */
  passarPor: (codigoDaColuna: string) => void
  soltarEm: (codigoDaColuna: string) => void
}

/**
 * O estado do arrastar para mover: quem foi levantado, a coluna sob o cartão e o que fazer ao soltar. Toda coluna é etapa
 * ativa e recebe o cartão; soltar na própria coluna não grava (spec, "Arrastar").
 */
export function useArrastoDoQuadro(
  etapas: EtapaDoCatalogo[], aoSoltarNoDestino: (processo: ProcessoDaLista, destino: DestinoDoMovimento) => void,
): ArrastoDoQuadro {
  const [levantado, setLevantado] = useState<ProcessoDaLista | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)

  function soltarEm(codigoDaColuna: string) {
    const cartao = levantado
    setLevantado(null)
    setSobre(null)
    const destino = cartao ? etapaDeDestino(cartao, codigoDaColuna, etapas) : null
    if (cartao && destino) aoSoltarNoDestino(cartao, destino)
  }

  return {
    levantado, sobre, soltarEm, passarPor: setSobre,
    levantar: setLevantado,
    baixar: () => {
      setLevantado(null)
      setSobre(null)
    },
  }
}
