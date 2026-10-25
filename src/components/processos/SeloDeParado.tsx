import { hojeEmBrasilia } from '../../lib/datas'
import { diasDoProcessoParado } from '../../processos/diasNaEtapa'
import type { ProcessoDaLista } from '../../processos/tipos'
import { DiasNaEtapa } from './DiasNaEtapa'

/** O selo "12 dias nesta etapa" ao lado do nome na Lista; só o processo parado o tem. */
export function SeloDeParado({ processo }: { processo: ProcessoDaLista }) {
  const dias = diasDoProcessoParado(processo, hojeEmBrasilia())
  return dias === null ? null : <span className="lista-parado"><DiasNaEtapa dias={dias} /></span>
}
