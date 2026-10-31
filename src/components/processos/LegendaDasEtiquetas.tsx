import { ETIQUETAS } from '../../processos/rotulos'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import './LegendaDasEtiquetas.css'

/** Uma vez só, na barra do Quadro: o cartão mostra a etiqueta só pelo ícone, e aqui cada ícone ganha o nome. */
export function LegendaDasEtiquetas() {
  return (
    <ul className="legenda-das-etiquetas" aria-label="Legenda das etiquetas">
      {ETIQUETAS.map((etiqueta) => <li key={etiqueta}><EtiquetaDoProcesso etiqueta={etiqueta} /></li>)}
    </ul>
  )
}
