import type { Executar } from '../../hooks/useGravacaoComFalha'
import type { ModuloDeProcessos, ProcessoLido, Reclassificacao } from '../../processos/tipos'
import { JanelaDeReclassificacao } from './JanelaDeReclassificacao'

type ReclassificacaoDoProcessoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  executar: Executar
  aoFechar: () => void
  /** O tipo mudou: o verso e o Quadro precisam recarregar. */
  aoMudar: () => void
}

/** A janela do novo tipo, do pai e do motivo, aberta pelo Reclassificar do "⋯"; quem a abre a monta. */
export function ReclassificacaoDoProcesso({ processo, processos, executar, aoFechar, aoMudar }: ReclassificacaoDoProcessoProps) {
  const confirmar = (reclassificacao: Reclassificacao, motivo: string) =>
    executar(() => processos.reclassificarProcesso(processo.id, reclassificacao, motivo), aoMudar)
  return <JanelaDeReclassificacao processo={processo} processos={processos} aoConfirmar={confirmar} aoFechar={aoFechar} />
}
