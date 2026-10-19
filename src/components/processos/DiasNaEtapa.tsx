import { passouDoLimite, textoDosDias } from '../../processos/diasNaEtapa'
import { Pilula } from '../Pilula'

/** Os dias na etapa: número em cinza até o limite; depois dele, a pílula âmbar (spec, "Verso do cartão"). */
export function DiasNaEtapa({ dias }: { dias: number }) {
  if (passouDoLimite(dias)) return <Pilula situacao="vencendo">{`${dias} dias nesta etapa`}</Pilula>
  return <span className="agora-dias">{textoDosDias(dias)}</span>
}
