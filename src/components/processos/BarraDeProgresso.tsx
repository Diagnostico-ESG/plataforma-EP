import type { CSSProperties } from 'react'
import { barraDoCartao } from '../../processos/barraDoCartao'
import type { ProcessoDaLista } from '../../processos/tipos'

/** A barra da etapa: "Nome · n de N" e uma faixa lisa que se enche até a etapa atual (em Concluídos, cheia). */
export function BarraDeProgresso({ processo }: { processo: ProcessoDaLista }) {
  const barra = barraDoCartao(processo)
  if (barra === null) return null
  const preenchida = { '--barra-fracao': `${barra.fracao * 100}%` } as CSSProperties
  return (
    <span className="barra-etapa" role="img" aria-label={barra.nome}>
      <span className="barra-etapa-texto">{barra.texto}</span>
      <span className="barra-etapa-trilho">
        <span className="barra-etapa-preenchida" style={preenchida} />
      </span>
    </span>
  )
}
