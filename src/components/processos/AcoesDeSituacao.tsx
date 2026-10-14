import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { ModuloDeProcessos, ProcessoLido, SituacaoDoProcesso } from '../../processos/tipos'
import { JanelaComCampo } from '../JanelaComCampo'

type PedidoDeSituacao = 'suspender' | 'cancelar' | 'retomar'

// O concluído é calculado: para suspender ou cancelar, conta como em andamento.
const PEDIDOS_POR_SITUACAO: Record<SituacaoDoProcesso, PedidoDeSituacao[]> = {
  em_andamento: ['suspender', 'cancelar'], concluido: ['suspender', 'cancelar'],
  suspenso: ['cancelar', 'retomar'], cancelado: ['retomar'],
}

const TEXTOS: Record<PedidoDeSituacao, { botao: string; titulo: (nome: string) => string; acao: string }> = {
  suspender: { botao: 'Suspender', titulo: (nome) => `Suspender o processo ${nome}?`, acao: 'Suspender processo' },
  cancelar: { botao: 'Cancelar', titulo: (nome) => `Cancelar o processo ${nome}?`, acao: 'Cancelar processo' },
  retomar: { botao: 'Retomar', titulo: (nome) => `Retomar o processo ${nome}?`, acao: 'Retomar processo' },
}

type AcoesDeSituacaoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** A situação mudou: o painel e o Quadro precisam recarregar. */
  aoMudar: () => void
  aoSumir: () => void
}

function gravarPedido(processos: ModuloDeProcessos, pedido: PedidoDeSituacao, id: string, motivo: string): Promise<void> {
  if (pedido === 'suspender') return processos.suspenderProcesso(id, motivo)
  if (pedido === 'cancelar') return processos.cancelarProcesso(id, motivo)
  return processos.retomarProcesso(id, motivo)
}

/** [Suspender], [Cancelar] e [Retomar] conforme a situação, cada um com a janela do motivo obrigatório. */
export function AcoesDeSituacao({ processo, processos, aoMudar, aoSumir }: AcoesDeSituacaoProps) {
  const [pedido, setPedido] = useState<PedidoDeSituacao | null>(null)
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const texto = pedido ? TEXTOS[pedido] : null
  // A janela fecha antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  const confirmar = (motivo: string) => {
    if (pedido) executar(() => gravarPedido(processos, pedido, processo.id, motivo), aoMudar)
  }
  return (
    <>
      {PEDIDOS_POR_SITUACAO[processo.situacao].map((chave) => (
        <button key={chave} type="button" className="botao botao-secundario" onClick={() => setPedido(chave)}>
          {TEXTOS[chave].botao}
        </button>
      ))}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaComCampo aberta={pedido !== null} titulo={texto ? texto.titulo(processo.nome) : ''} rotuloDoCampo="Motivo"
        rotuloDaAcao={texto?.acao ?? ''} aoConfirmar={confirmar} aoFechar={() => setPedido(null)} />
    </>
  )
}
