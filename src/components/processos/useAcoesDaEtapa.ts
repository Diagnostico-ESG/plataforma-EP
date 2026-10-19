import { useState } from 'react'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { AcaoDaEtapa } from '../../processos/caminhoDeEtapas'
import type { EtapaDoCaminho, ModuloDeProcessos } from '../../processos/tipos'

type AcaoComTexto = Extract<AcaoDaEtapa, 'dispensar' | 'realizada' | 'voltar'>
export type PedidoDeTexto = { acao: AcaoComTexto; etapa: EtapaDoCaminho }

const ACOES_COM_TEXTO: AcaoDaEtapa[] = ['dispensar', 'realizada', 'voltar']

function pedeTexto(acao: AcaoDaEtapa): acao is AcaoComTexto {
  return ACOES_COM_TEXTO.includes(acao)
}

function gravarPedido(processos: ModuloDeProcessos, { acao, etapa }: PedidoDeTexto, texto: string): Promise<void> {
  if (acao === 'dispensar') return processos.dispensarEtapa(etapa.id, texto, null)
  if (acao === 'voltar') return processos.voltarParaEtapa(etapa.id, texto)
  return processos.registrarRealizadaAnteriormente(etapa.id, texto, null)
}

/**
 * As ações do caminho de etapas. Iniciar e Concluir gravam na hora; Dispensar, Realizada anteriormente e Voltar
 * abrem a janela que pede a nota ou o motivo. A falha de qualquer gravação fica em `falha`, para a tela mostrar.
 */
export function useAcoesDaEtapa(processos: ModuloDeProcessos, aoMudar: () => void, aoSumir: () => void) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [pedido, setPedido] = useState<PedidoDeTexto | null>(null)

  function agir(acao: AcaoDaEtapa, etapa: EtapaDoCaminho) {
    if (pedeTexto(acao)) return setPedido({ acao, etapa })
    const gravar = acao === 'iniciar' ? () => processos.iniciarEtapa(etapa.id) : () => processos.concluirEtapa(etapa.id, null)
    executar(gravar, aoMudar)
  }

  // A janela fecha antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  function gravarComTexto(texto: string) {
    if (pedido) executar(() => gravarPedido(processos, pedido, texto), aoMudar)
  }

  function mudarResponsavel(etapa: EtapaDoCaminho, usuarioId: string | null) {
    executar(() => processos.mudarResponsavelDaEtapa(etapa.id, usuarioId), aoMudar)
  }

  return { falha, pedido, agir, gravarComTexto, mudarResponsavel, fecharPedido: () => setPedido(null) }
}
