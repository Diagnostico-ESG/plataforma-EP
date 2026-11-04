import { hojeEmBrasilia } from '../../lib/datas'
import { diasDoProcessoParado } from '../../processos/diasNaEtapa'
import type { ProcessoDaLista } from '../../processos/tipos'
import { Icone } from '../Icone'

/** O atraso junto da Etapa atual na Lista: relógio e número ("🕓 8"); o texto completo vai no rótulo e na dica. Só o processo parado o tem. */
export function SeloDeParado({ processo }: { processo: ProcessoDaLista }) {
  const dias = diasDoProcessoParado(processo, hojeEmBrasilia())
  if (dias === null) return null
  const texto = `${dias} dias nesta etapa`
  return (
    <span className="lista-parado" role="img" aria-label={texto} title={texto}>
      <Icone nome="relogio" tamanho={14} />
      <span aria-hidden="true">{dias}</span>
    </span>
  )
}
