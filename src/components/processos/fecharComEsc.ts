import type { KeyboardEvent } from 'react'

/** Esc dentro do painel o fecha, como o <dialog> nativo faz com as janelas (identidade visual: "Esc fecha"). */
export function fecharComEsc(aoFechar: () => void) {
  return (evento: KeyboardEvent) => {
    if (evento.key === 'Escape') aoFechar()
  }
}
