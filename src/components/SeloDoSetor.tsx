import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** Número da cor do setor (1 a 30). */
  cor: number
  variante?: 'pequeno' | 'faixa'
  /** Classe extra de quem usa o selo (a faixa do cartão, o cabeçalho do verso). */
  className?: string
}

/** A sigla em texto escuro sobre a cor do setor, em degradê. A sigla é o único texto: o selo não acrescenta nome acessível. */
export function SeloDoSetor({ sigla, cor, variante = 'pequeno', className }: SeloDoSetorProps) {
  return <span className={`selo-do-setor selo-do-setor-${variante}${className ? ` ${className}` : ''}`} style={estiloDaCor(cor) as CSSProperties}>{sigla}</span>
}
