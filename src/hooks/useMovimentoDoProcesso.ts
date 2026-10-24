import { useState } from 'react'
import { chegadaPedeJanela } from '../processos/publicacao'
import type { EtapaDoCatalogo, EtiquetaDaEtapa, ModuloDeProcessos, ProcessoDaLista } from '../processos/tipos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

/** O que mover precisa saber da etapa de destino. */
export type DestinoDoMovimento = Pick<EtapaDoCatalogo, 'id' | 'codigo'>

/** A chegada a Concluídos que espera a janela: o processo e a etapa de destino. */
export type PedidoDeChegada = { processo: ProcessoDaLista; etapa: DestinoDoMovimento }

/**
 * As gravações do andamento livre: mover, etiqueta e responsável gravam na hora, sem janela. A falha fica em `falha`
 * (o processo continua como estava, porque a tela lê o estado do banco); `gravando` desabilita as listas enquanto grava.
 * Mover para Concluídos sem a data da publicação já registrada não grava: abre a janela da chegada (`chegada`), que
 * grava por si e fecha por `fecharChegada`.
 */
export function useMovimentoDoProcesso(processos: ModuloDeProcessos, aoMudar: () => void, aoSumir: () => void) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [gravando, setGravando] = useState(false)
  const [chegada, setChegada] = useState<PedidoDeChegada | null>(null)

  async function gravar(operacao: () => Promise<void>) {
    setGravando(true)
    try {
      await executar(operacao, aoMudar)
    } finally {
      setGravando(false)
    }
  }

  return {
    falha, chegada, gravando,
    fecharChegada: () => setChegada(null),
    mover: (processo: ProcessoDaLista, etapa: DestinoDoMovimento) => {
      if (processo.etapaAtual?.codigo === etapa.codigo) return Promise.resolve()
      if (chegadaPedeJanela(processo, etapa)) {
        setChegada({ processo, etapa })
        return Promise.resolve()
      }
      return gravar(() => processos.moverProcesso(processo.id, etapa.id))
    },
    mudarEtiqueta: (id: string, etiqueta: EtiquetaDaEtapa) => gravar(() => processos.mudarEtiqueta(id, etiqueta)),
    mudarResponsavel: (id: string, usuarioId: string | null) => gravar(() => processos.mudarResponsavel(id, usuarioId)),
  }
}

export type MovimentoDoProcessoEmUso = ReturnType<typeof useMovimentoDoProcesso>
