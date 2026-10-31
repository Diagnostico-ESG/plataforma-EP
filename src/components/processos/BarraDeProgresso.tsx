import { barraDoCartao } from '../../processos/barraDoCartao'
import type { ProcessoDaLista } from '../../processos/tipos'

function estadoDoTracinho(numero: number, atual: number): 'feito' | 'atual' | 'futuro' {
  if (numero < atual) return 'feito'
  return numero === atual ? 'atual' : 'futuro'
}

/** A barra da etapa: "Nome · n de N" e um tracinho por etapa: os feitos em cinza-azulado, o atual em azul, os futuros em cinza-claro. */
export function BarraDeProgresso({ processo }: { processo: ProcessoDaLista }) {
  const barra = barraDoCartao(processo)
  if (barra === null) return null
  return (
    <span className="barra-etapa" role="img" aria-label={barra.nome}>
      <span className="barra-etapa-texto">{barra.texto}</span>
      <span className="barra-etapa-trilho">
        {Array.from({ length: barra.total }, (_, i) => <span key={i} className="barra-etapa-tracinho" data-estado={estadoDoTracinho(i + 1, barra.posicao)} />)}
      </span>
    </span>
  )
}
