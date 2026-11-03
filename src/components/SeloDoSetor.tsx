import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** O nome do setor: aparece ao passar o mouse e é o nome acessível do selo; sem ele só a sigla é lida. */
  nome?: string
  /** Classe extra de quem usa o selo (o cabeçalho do verso). */
  className?: string
}

/** A sigla em branco sobre a cor única do selo (ADR 0039); com o nome, o selo o mostra ao passar o mouse e o diz ao leitor de tela. */
export function SeloDoSetor({ sigla, nome, className }: SeloDoSetorProps) {
  const classes = `selo-do-setor${className ? ` ${className}` : ''}`
  if (!nome) return <span className={classes}>{sigla}</span>
  return <span className={classes} role="img" aria-label={nome} title={nome}>{sigla}</span>
}
