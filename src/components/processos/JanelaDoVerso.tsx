import './Verso.css'
import { type ReactNode, type SyntheticEvent, useEffect, useRef } from 'react'

type JanelaDoVersoProps = { rotulo: string; estreita?: boolean; aoFechar: () => void; children: ReactNode }

/**
 * A janela central do verso do cartão: <dialog> modal (ADR 0003), em que o navegador escurece o fundo, deixa o resto
 * da página inerte e prende o Tab dentro dela. O Esc chega como "cancel": quem fecha é o endereço (aoFechar), não o
 * <dialog>. O "cancel" de uma janela de dentro (motivo, confirmação) pode chegar aqui pelo React; só o do verso conta.
 */
export function JanelaDoVerso({ rotulo, estreita = false, aoFechar, children }: JanelaDoVersoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (janela.current && !janela.current.open) janela.current.showModal()
  }, [])
  const aoCancelar = (evento: SyntheticEvent<HTMLDialogElement>) => {
    if (evento.target !== evento.currentTarget) return
    evento.preventDefault()
    aoFechar()
  }
  return (
    <dialog ref={janela} className={estreita ? 'verso verso-estreita' : 'verso'} aria-label={rotulo} onCancel={aoCancelar}>
      {children}
    </dialog>
  )
}
