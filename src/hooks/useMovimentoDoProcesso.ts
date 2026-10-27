import { useState } from 'react'
import { moverDepoisDoEnvio } from '../processos/moverDepoisDoEnvio'
import { chegadaPedeJanela } from '../processos/publicacao'
import type { EtapaDoCatalogo, EtiquetaDaEtapa, ModuloDeProcessos, ProcessoDaLista } from '../processos/tipos'
import { type DestinoDoMovimento, useConfirmacaoDeArquivos } from './useConfirmacaoDeArquivos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

export type { DestinoDoMovimento, PedidoDeConfirmacao } from './useConfirmacaoDeArquivos'

/** A chegada a Concluídos que espera a janela: o processo e a etapa de destino. */
export type PedidoDeChegada = { processo: ProcessoDaLista; etapa: DestinoDoMovimento }

/**
 * As gravações do andamento livre: mover, etiqueta e responsável gravam na hora, sem janela. A falha fica em `falha`
 * (o processo continua como estava, porque a tela lê o estado do banco); `gravando` desabilita as listas enquanto grava.
 * Mover para a frente de uma etapa com arquivos, faltando os arquivos dela, não grava: abre a Confirmação de arquivos
 * (`confirmacao` e `envio`, ver `useConfirmacaoDeArquivos`). Depois dela vem a chegada a Concluídos sem a data da publicação
 * já registrada (`chegada`, que grava por si e fecha por `fecharChegada`).
 */
export function useMovimentoDoProcesso(processos: ModuloDeProcessos, etapas: EtapaDoCatalogo[], aoMudar: () => void, aoSumir: () => void) {
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

  // Depois da pergunta, ou sem ela: a chegada a Concluídos, que pede a janela dela, ou o movimento.
  function seguir(processo: ProcessoDaLista, etapa: DestinoDoMovimento, depoisDoEnvio: boolean): Promise<void> {
    if (chegadaPedeJanela(processo, etapa)) {
      setChegada({ processo, etapa })
      return Promise.resolve()
    }
    return gravar(() => (depoisDoEnvio ? moverDepoisDoEnvio(processos, processo.id, etapa.id) : processos.moverProcesso(processo.id, etapa.id)))
  }

  const arquivos = useConfirmacaoDeArquivos(etapas, aoMudar, seguir)

  return {
    falha, chegada, gravando, ...arquivos,
    fecharChegada: () => setChegada(null),
    mover: (processo: ProcessoDaLista, etapa: DestinoDoMovimento) => {
      if (processo.etapaAtual?.codigo === etapa.codigo) return Promise.resolve()
      return arquivos.perguntar(processo, etapa) ? Promise.resolve() : seguir(processo, etapa, false)
    },
    mudarEtiqueta: (id: string, etiqueta: EtiquetaDaEtapa) => gravar(() => processos.mudarEtiqueta(id, etiqueta)),
    mudarResponsavel: (id: string, usuarioId: string | null) => gravar(() => processos.mudarResponsavel(id, usuarioId)),
  }
}

export type MovimentoDoProcessoEmUso = ReturnType<typeof useMovimentoDoProcesso>
