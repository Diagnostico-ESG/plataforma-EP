import type { Executar } from '../../hooks/useGravacaoComFalha'
import { type PedidoDeSituacao, TEXTOS_DA_SITUACAO } from '../../processos/pedidosDeSituacao'
import type { ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'

type JanelaDeSituacaoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** O pedido escolhido no "⋯", ou null com a janela fechada. */
  pedido: PedidoDeSituacao | null
  executar: Executar
  aoFechar: () => void
  /** A situação mudou: o verso e o Quadro precisam recarregar. */
  aoMudar: () => void
}

function gravarPedido(processos: ModuloDeProcessos, pedido: PedidoDeSituacao, id: string, motivo: string): Promise<void> {
  if (pedido === 'suspender') return processos.suspenderProcesso(id, motivo)
  if (pedido === 'cancelar') return processos.cancelarProcesso(id, motivo)
  return processos.retomarProcesso(id, motivo)
}

/** A janela do motivo obrigatório de Suspender, Cancelar e Retomar. */
export function JanelaDeSituacao({ processo, processos, pedido, executar, aoFechar, aoMudar }: JanelaDeSituacaoProps) {
  const texto = pedido ? TEXTOS_DA_SITUACAO[pedido] : null
  // A janela fecha antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  const confirmar = (motivo: string) => {
    if (pedido) executar(() => gravarPedido(processos, pedido, processo.id, motivo), aoMudar)
  }
  return (
    <JanelaComCampo aberta={pedido !== null} titulo={texto ? texto.titulo(processo.nome) : ''} rotuloDoCampo="Motivo"
      rotuloDaAcao={texto?.acao ?? ''} aoConfirmar={confirmar} aoFechar={aoFechar} />
  )
}
