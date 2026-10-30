import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** Número da cor do setor (1 a 30); a tela mostra uma das 12 cores, em ciclo. */
  cor: number
  /** Classe extra de quem usa o selo (o cabeçalho do verso). */
  className?: string
}

/** A sigla em branco sobre a cor forte do setor. A sigla é o único texto: o selo não acrescenta nome acessível. */
export function SeloDoSetor({ sigla, cor, className }: SeloDoSetorProps) {
  return <span className={`selo-do-setor${className ? ` ${className}` : ''}`} style={estiloDaCor(cor) as CSSProperties}>{sigla}</span>
}
