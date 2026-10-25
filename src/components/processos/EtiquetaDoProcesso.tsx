import { ROTULO_DA_ETIQUETA } from '../../processos/rotulos'
import type { EtiquetaDaEtapa } from '../../processos/tipos'

/** A etiqueta como pílula com bolinha: a cor ajuda, mas o texto sempre diz o valor. */
export function EtiquetaDoProcesso({ etiqueta }: { etiqueta?: EtiquetaDaEtapa }) {
  const valor = etiqueta ?? 'a_fazer'
  return <span className={`etiqueta etiqueta-${valor}`}><span className="etiqueta-bolinha" aria-hidden="true" />{ROTULO_DA_ETIQUETA[valor]}</span>
}
