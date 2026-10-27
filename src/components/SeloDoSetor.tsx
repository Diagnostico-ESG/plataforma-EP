import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** Número da cor do setor (1 a 30). */
  cor: number
  variante?: 'pequeno' | 'faixa'
}

/** A sigla em texto escuro sobre a cor do setor, em degradê. A sigla é o único texto: o selo não acrescenta nome acessível. */
export function SeloDoSetor({ sigla, cor, variante = 'pequeno' }: SeloDoSetorProps) {
  return <span className={`selo-do-setor selo-do-setor-${variante}`} style={estiloDaCor(cor) as CSSProperties}>{sigla}</span>
}
