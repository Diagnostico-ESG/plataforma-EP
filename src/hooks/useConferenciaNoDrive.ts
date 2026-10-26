import { useEffect, useState } from 'react'
import type { ConferenciaDosArquivos, ModuloDeVersoes } from '../versoes/tipos'

export type ConferenciaNoDrive =
  | { tipo: 'conferindo' }
  | { tipo: 'falhou' }
  | { tipo: 'pronta'; situacoes: ConferenciaDosArquivos }

/**
 * Pergunta ao servidor como cada arquivo está no Drive quando a lista de versões (ou de anexos) chega (e de novo a cada recarga da lista,
 * para a marca de um arquivo recém-substituído sumir). A conferência nunca impede a lista: se falha, vira "falhou".
 */
export function useConferenciaNoDrive(modulo: ModuloDeVersoes, processoId: string, lista: readonly unknown[]): ConferenciaNoDrive {
  const [conferencia, setConferencia] = useState<ConferenciaNoDrive>({ tipo: 'conferindo' })
  useEffect(() => {
    if (lista.length === 0) return
    let valida = true
    modulo.conferirArquivos(processoId).then(
      (situacoes) => { if (valida) setConferencia({ tipo: 'pronta', situacoes }) },
      () => { if (valida) setConferencia({ tipo: 'falhou' }) },
    )
    return () => { valida = false }
  }, [modulo, processoId, lista])
  return conferencia
}
