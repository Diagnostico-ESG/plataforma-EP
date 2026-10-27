import { useState } from 'react'
import { chegadaPedeJanela } from '../processos/publicacao'
import { type TravaDeArquivos, travasDaIda } from '../processos/travaDeArquivos'
import type { EtapaDoCatalogo, EtiquetaDaEtapa, ModuloDeProcessos, ProcessoDaLista } from '../processos/tipos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

/** O que mover precisa saber da etapa de destino. */
export type DestinoDoMovimento = Pick<EtapaDoCatalogo, 'id' | 'codigo' | 'ordem'>

/** A chegada a Concluídos que espera a janela: o processo e a etapa de destino. */
export type PedidoDeChegada = { processo: ProcessoDaLista; etapa: DestinoDoMovimento }

/** A Confirmação de arquivos que espera a resposta: o processo, o destino e as etapas a que faltam arquivos, em ordem. */
export type PedidoDeConfirmacao = PedidoDeChegada & { faltas: TravaDeArquivos[] }

/**
 * As gravações do andamento livre: mover, etiqueta e responsável gravam na hora, sem janela. A falha fica em `falha`
 * (o processo continua como estava, porque a tela lê o estado do banco); `gravando` desabilita as listas enquanto grava.
 * Mover para a frente de uma etapa com arquivos, faltando os arquivos dela, não grava: abre a pergunta (`confirmacao`,
 * ADR 0028), que [Avançar mesmo assim] (`avancarSemArquivos`) responde e [Cancelar] (`fecharConfirmacao`) desfaz. Depois dela
 * vem a chegada a Concluídos sem a data da publicação já registrada (`chegada`, que grava por si e fecha por `fecharChegada`).
 */
export function useMovimentoDoProcesso(processos: ModuloDeProcessos, etapas: EtapaDoCatalogo[], aoMudar: () => void, aoSumir: () => void) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [gravando, setGravando] = useState(false)
  const [chegada, setChegada] = useState<PedidoDeChegada | null>(null)
  const [confirmacao, setConfirmacao] = useState<PedidoDeConfirmacao | null>(null)

  async function gravar(operacao: () => Promise<void>) {
    setGravando(true)
    try {
      await executar(operacao, aoMudar)
    } finally {
      setGravando(false)
    }
  }

  // Depois da pergunta, ou sem ela: a chegada a Concluídos, que pede a janela dela, ou o movimento.
  function mover(processo: ProcessoDaLista, etapa: DestinoDoMovimento): Promise<void> {
    if (chegadaPedeJanela(processo, etapa)) {
      setChegada({ processo, etapa })
      return Promise.resolve()
    }
    return gravar(() => processos.moverProcesso(processo.id, etapa.id))
  }

  return {
    falha, chegada, confirmacao, gravando,
    fecharChegada: () => setChegada(null),
    fecharConfirmacao: () => setConfirmacao(null),
    /** [Avançar mesmo assim]: o movimento segue sem enviar nada e sem conferir os arquivos de novo (o banco aceita). */
    avancarSemArquivos: () => {
      if (!confirmacao) return Promise.resolve()
      setConfirmacao(null)
      return mover(confirmacao.processo, confirmacao.etapa)
    },
    mover: (processo: ProcessoDaLista, etapa: DestinoDoMovimento) => {
      if (processo.etapaAtual?.codigo === etapa.codigo) return Promise.resolve()
      const faltas = travasDaIda(processo, etapa, etapas)
      if (faltas.length === 0) return mover(processo, etapa)
      setConfirmacao({ processo, etapa, faltas })
      return Promise.resolve()
    },
    mudarEtiqueta: (id: string, etiqueta: EtiquetaDaEtapa) => gravar(() => processos.mudarEtiqueta(id, etiqueta)),
    mudarResponsavel: (id: string, usuarioId: string | null) => gravar(() => processos.mudarResponsavel(id, usuarioId)),
  }
}

export type MovimentoDoProcessoEmUso = ReturnType<typeof useMovimentoDoProcesso>
