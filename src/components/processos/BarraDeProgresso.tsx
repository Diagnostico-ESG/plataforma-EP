import { barraDoCartao } from '../../processos/barraDoCartao'
import type { ProcessoDaLista } from '../../processos/tipos'

/** A barra da etapa: "Nome · n de N" e um bloco por etapa ativa. Só cinza: mostra o normal, não um alerta. */
export function BarraDeProgresso({ processo }: { processo: ProcessoDaLista }) {
  const barra = barraDoCartao(processo)
  if (barra === null) return null
  return (
    <span className="barra-etapa" role="img" aria-label={barra.nome}>
      <span className="barra-etapa-texto">{barra.texto}</span>
      <span className="barra-etapa-blocos">
        {barra.pedacos.map((pedaco) => <span key={pedaco.posicao} className={`pedaco pedaco-${pedaco.estado}`} />)}
      </span>
    </span>
  )
}
