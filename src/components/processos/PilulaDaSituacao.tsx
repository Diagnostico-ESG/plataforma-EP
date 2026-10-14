import { ROTULO_DA_SITUACAO } from '../../processos/rotulos'
import type { SituacaoDoProcesso } from '../../processos/tipos'
import { Pilula, type SituacaoPilula } from '../Pilula'

const PILULA_DA_SITUACAO: Record<SituacaoDoProcesso, SituacaoPilula> = {
  em_andamento: 'informativa', suspenso: 'vencendo', cancelado: 'atraso', concluido: 'aprovado',
}

/** A situação do processo em pílula, com cor e texto: no painel, na Lista e na tela do setor. */
export function PilulaDaSituacao({ situacao }: { situacao: SituacaoDoProcesso }) {
  return <Pilula situacao={PILULA_DA_SITUACAO[situacao]}>{ROTULO_DA_SITUACAO[situacao]}</Pilula>
}
