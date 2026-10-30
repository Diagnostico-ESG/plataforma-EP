import { type CSSProperties, useId } from 'react'
import { TODAS_AS_CORES, corDoSetor, estiloDaCor, nomeDaAmostra } from '../../cadastros/corDoSetor'
import './GradeDeCores.css'

type GradeDeCoresProps = {
  escolhida: number
  /** Cor → sigla do setor que a usa; usar uma cor em uso é permitido, só vem marcada. */
  emUso: ReadonlyMap<number, string>
  aoEscolher: (cor: number) => void
}

/** As 12 amostras como botões de rádio nativos: o teclado e o leitor de tela já sabem usá-los. */
export function GradeDeCores({ escolhida, emUso, aoEscolher }: GradeDeCoresProps) {
  const grupo = useId()
  return (
    <fieldset className="grade-de-cores">
      <legend>Cor do setor</legend>
      {TODAS_AS_CORES.map(({ numero }) => (
        <label key={numero} className={`amostra-de-cor${emUso.has(numero) ? ' amostra-em-uso' : ''}`}>
          <input type="radio" name={grupo} checked={corDoSetor(escolhida).numero === numero}
            aria-label={nomeDaAmostra(numero, emUso.get(numero))} onChange={() => aoEscolher(numero)} />
          <span className="amostra-de-cor-tom" style={estiloDaCor(numero) as CSSProperties} />
        </label>
      ))}
    </fieldset>
  )
}
