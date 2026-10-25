import { passouDoLimite, textoDosDias } from '../../processos/diasNaEtapa'
import { Pilula } from '../Pilula'

/** Os dias na etapa: número em cinza até o limite; depois dele, a pílula vermelha suave (spec, "Cartão e verso"). */
export function DiasNaEtapa({ dias }: { dias: number }) {
  if (passouDoLimite(dias)) return <Pilula situacao="atraso">{`${dias} dias nesta etapa`}</Pilula>
  return <span className="agora-dias">{textoDosDias(dias)}</span>
}
