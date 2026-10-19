import './Verso.css'
import { type ReactNode, type SyntheticEvent, useEffect, useRef } from 'react'

type JanelaDoVersoProps = { rotulo: string; estreita?: boolean; aoFechar: () => void; aoCancelar?: () => void; children: ReactNode }

/**
 * A janela central do verso do cartão: <dialog> modal (ADR 0003), em que o navegador escurece o fundo, deixa o resto
 * da página inerte e prende o Tab dentro dela. O Esc chega como "cancel": quem fecha é o endereço (aoFechar), não o
 * <dialog>; `aoCancelar` troca o que o Esc faz (no Histórico e no Editar, volta ao verso).
 * O "cancel" de uma janela de dentro (motivo, confirmação) pode chegar aqui pelo React; só o do verso conta.
 */
export function JanelaDoVerso({ rotulo, estreita = false, aoFechar, aoCancelar, children }: JanelaDoVersoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (janela.current && !janela.current.open) janela.current.showModal()
  }, [])
  const aoEsc = (evento: SyntheticEvent<HTMLDialogElement>) => {
    if (evento.target !== evento.currentTarget) return
    evento.preventDefault()
    void (aoCancelar ?? aoFechar)()
  }
  return (
    <dialog ref={janela} className={estreita ? 'verso verso-estreita' : 'verso'} aria-label={rotulo} onCancel={aoEsc}>
      {children}
    </dialog>
  )
}
