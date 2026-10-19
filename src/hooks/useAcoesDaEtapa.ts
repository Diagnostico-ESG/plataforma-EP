import { useState } from 'react'
import type { AcaoDaEtapa } from '../processos/caminhoDeEtapas'
import { type PedidoDeAvanco, type PedidoDeTexto, gravarAvanco, gravarTexto } from '../processos/gravarAcoes'
import type { EtapaDoCaminho, ModuloDeProcessos } from '../processos/tipos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

/**
 * As ações do caminho de etapas. Iniciar grava na hora; Concluir, Dispensar e Realizada anteriormente com etapa
 * pendente depois abrem a janela de avanço (`avanco`), que escolhe o responsável dela; Voltar abre a mesma janela,
 * com o motivo e o responsável da etapa reaberta. Sem pendente depois, Concluir grava na hora e as outras duas abrem a
 * janela da nota (`pedido`). A falha de qualquer gravação fica em `falha`, para a tela mostrar.
 */
export function useAcoesDaEtapa(processos: ModuloDeProcessos, aoMudar: () => void, aoSumir: () => void) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [pedido, setPedido] = useState<PedidoDeTexto | null>(null)
  const [avanco, setAvanco] = useState<PedidoDeAvanco | null>(null)

  function agir(acao: AcaoDaEtapa, etapa: EtapaDoCaminho, proxima: EtapaDoCaminho | null) {
    if (acao === 'iniciar') return executar(() => processos.iniciarEtapa(etapa.id), aoMudar)
    if (acao === 'voltar') return setAvanco({ acao, etapa, proxima: etapa })
    if (proxima) return setAvanco({ acao, etapa, proxima })
    if (acao === 'concluir') return executar(() => processos.concluirEtapa(etapa.id, null), aoMudar)
    setPedido({ acao, etapa })
  }

  // As janelas fecham antes de confirmar; o pedido lido aqui é o desta renderização, ainda preenchido.
  function gravarComTexto(texto: string) {
    if (pedido) executar(() => gravarTexto(processos, pedido, texto), aoMudar)
  }

  function gravarComAvanco(nota: string, responsavelId: string | null) {
    if (avanco) executar(() => gravarAvanco(processos, avanco.acao, avanco.etapa, nota, responsavelId), aoMudar)
  }

  function mudarResponsavel(etapa: EtapaDoCaminho, usuarioId: string | null) {
    executar(() => processos.mudarResponsavelDaEtapa(etapa.id, usuarioId), aoMudar)
  }

  return {
    falha, pedido, avanco, agir, gravarComTexto, gravarComAvanco, mudarResponsavel,
    fecharPedido: () => setPedido(null), fecharAvanco: () => setAvanco(null),
  }
}

export type AcoesDaEtapaEmUso = ReturnType<typeof useAcoesDaEtapa>
