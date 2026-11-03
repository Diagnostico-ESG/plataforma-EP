import { ETIQUETAS } from '../../processos/rotulos'
import { EtiquetaDoProcesso } from './EtiquetaDoProcesso'
import './LegendaDasEtiquetas.css'

/** Uma vez só, na barra do Quadro: o cartão mostra o Status só pelo ícone, e aqui cada ícone ganha o nome (ADR 0039). */
export function LegendaDasEtiquetas() {
  return (
    <div className="legenda-do-status">
      <span className="legenda-do-status-rotulo">Status da etapa</span>
      <ul className="legenda-das-etiquetas" aria-label="Legenda do status">
        {ETIQUETAS.map((etiqueta) => <li key={etiqueta}><EtiquetaDoProcesso etiqueta={etiqueta} /></li>)}
      </ul>
    </div>
  )
}
