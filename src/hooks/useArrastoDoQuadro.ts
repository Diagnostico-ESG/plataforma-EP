import { useState } from 'react'
import type { ColunaDoQuadro } from '../processos/colunasDoQuadro'
import { colunaDeDestino } from '../processos/destinoDoArrastar'
import type { ProcessoDaLista } from '../processos/tipos'

export type ArrastoDoQuadro = {
  /** O cartão que está sendo arrastado; null fora do arrastar. */
  levantado: ProcessoDaLista | null
  aviso: string | null
  levantar: (processo: ProcessoDaLista) => void
  baixar: () => void
  soltarEm: (codigoDaColuna: string) => void
}

/** O estado do arrastar para concluir: quem foi levantado, o aviso de soltura errada e o que fazer ao soltar. */
export function useArrastoDoQuadro(colunas: ColunaDoQuadro[], aoSoltarNoDestino: (id: string) => void): ArrastoDoQuadro {
  const [levantado, setLevantado] = useState<ProcessoDaLista | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  function soltarEm(codigoDaColuna: string) {
    const destino = levantado ? colunaDeDestino(levantado) : null
    setLevantado(null)
    if (!levantado || destino === null) return
    if (codigoDaColuna === destino) return aoSoltarNoDestino(levantado.id)
    const titulo = colunas.find((coluna) => coluna.chave === destino)?.titulo ?? ''
    setAviso(`Solte o cartão na coluna ${titulo}.`)
  }

  return {
    levantado, aviso, soltarEm,
    levantar: (processo) => {
      setAviso(null)
      setLevantado(processo)
    },
    baixar: () => setLevantado(null),
  }
}
