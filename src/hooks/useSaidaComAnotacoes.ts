import { type MutableRefObject, useCallback, useRef, useState } from 'react'
import type { GravadorDeAnotacoes } from '../processos/GravadorDeAnotacoes'

/** O que o verso pergunta ao bloco das Anotações antes de deixar a pessoa sair: há texto sem gravar? grava na hora. */
export type GuardaDasAnotacoes = Pick<GravadorDeAnotacoes, 'pendente' | 'gravarAgora'>

export type SaidaComAnotacoes = {
  guarda: MutableRefObject<GuardaDasAnotacoes | null>
  /** Segue para `destino` se não há texto pendente ou se a gravação na hora deu certo; senão, guarda o destino e pede a confirmação. */
  sair: (destino: () => void) => void
  /** O destino que espera a confirmação; null sem confirmação aberta. */
  seguir: (() => void) | null
  desistir: () => void
}

export function useSaidaComAnotacoes(): SaidaComAnotacoes {
  const guarda = useRef<GuardaDasAnotacoes | null>(null)
  const [seguir, setSeguir] = useState<(() => void) | null>(null)
  const sair = useCallback((destino: () => void) => {
    const atual = guarda.current
    if (!atual?.pendente()) return destino()
    void atual.gravarAgora().then((gravou) => (gravou ? destino() : setSeguir(() => destino)))
  }, [])
  const desistir = useCallback(() => setSeguir(null), [])
  return { guarda, sair, seguir, desistir }
}
