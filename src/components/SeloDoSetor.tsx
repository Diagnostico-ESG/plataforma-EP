import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** Número da cor do setor (1 a 30); a tela mostra uma das 12 cores, em ciclo. */
  cor: number
  /** O nome do setor: aparece ao passar o mouse e é o nome acessível do selo; sem ele só a sigla é lida. */
  nome?: string
  /** Classe extra de quem usa o selo (o cabeçalho do verso). */
  className?: string
}

/** A sigla em branco sobre a cor forte do setor; com o nome, o selo o mostra ao passar o mouse e o diz ao leitor de tela. */
export function SeloDoSetor({ sigla, cor, nome, className }: SeloDoSetorProps) {
  const classes = `selo-do-setor${className ? ` ${className}` : ''}`
  const estilo = estiloDaCor(cor) as CSSProperties
  if (!nome) return <span className={classes} style={estilo}>{sigla}</span>
  return <span className={classes} style={estilo} role="img" aria-label={nome} title={nome}>{sigla}</span>
}
