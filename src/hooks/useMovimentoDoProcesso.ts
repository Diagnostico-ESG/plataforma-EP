import { useState } from 'react'
import { moverDepoisDoEnvio } from '../processos/moverDepoisDoEnvio'
import { chegadaPedeJanela } from '../processos/publicacao'
import { type TravaDeArquivos, travaDaIda } from '../processos/travaDeArquivos'
import type {
  ArquivosDoProcesso, EtapaDoCatalogo, EtiquetaDaEtapa, ModuloDeProcessos, ProcessoDaLista,
} from '../processos/tipos'
import { useGravacaoComFalha } from './useGravacaoComFalha'

/** O que mover precisa saber da etapa de destino. */
export type DestinoDoMovimento = Pick<EtapaDoCatalogo, 'id' | 'codigo' | 'ordem'>

/** A chegada a Concluídos que espera a janela: o processo e a etapa de destino. */
export type PedidoDeChegada = { processo: ProcessoDaLista; etapa: DestinoDoMovimento }

/** A trava de arquivos que espera o envio: o processo, o destino e o que falta para sair da etapa. */
export type PedidoDeTrava = PedidoDeChegada & { trava: TravaDeArquivos }

/**
 * As gravações do andamento livre: mover, etiqueta e responsável gravam na hora, sem janela. A falha fica em `falha`
 * (o processo continua como estava, porque a tela lê o estado do banco); `gravando` desabilita as listas enquanto grava.
 * Mover para a frente de uma etapa com trava, faltando os arquivos dela, não grava: abre a janela da trava (`trava`), que
 * envia e devolve por `arquivosEnviados`; depois vem a chegada a Concluídos sem a data da publicação já registrada
 * (`chegada`, que grava por si e fecha por `fecharChegada`).
 */
export function useMovimentoDoProcesso(processos: ModuloDeProcessos, etapas: EtapaDoCatalogo[], aoMudar: () => void, aoSumir: () => void) {
  const { falha, executar } = useGravacaoComFalha(aoSumir)
  const [gravando, setGravando] = useState(false)
  const [chegada, setChegada] = useState<PedidoDeChegada | null>(null)
  const [trava, setTrava] = useState<PedidoDeTrava | null>(null)

  async function gravar(operacao: () => Promise<void>) {
    setGravando(true)
    try {
      await executar(operacao, aoMudar)
    } finally {
      setGravando(false)
    }
  }

  // A ordem das conferências: a trava de arquivos, depois a chegada a Concluídos, depois o movimento.
  function seguir(processo: ProcessoDaLista, etapa: DestinoDoMovimento, depoisDoEnvio = false): Promise<void> {
    const faltando = travaDaIda(processo, etapa, etapas)
    if (faltando) setTrava({ processo, etapa, trava: faltando })
    else if (chegadaPedeJanela(processo, etapa)) setChegada({ processo, etapa })
    else return gravar(() => (depoisDoEnvio ? moverDepoisDoEnvio(processos, processo.id, etapa.id) : processos.moverProcesso(processo.id, etapa.id)))
    return Promise.resolve()
  }

  return {
    falha, chegada, trava, gravando,
    fecharChegada: () => setChegada(null),
    fecharTrava: () => setTrava(null),
    /** Os arquivos da janela da trava foram enviados: a tela relê o processo e o movimento segue (outra trava, a chegada ou a gravação). */
    arquivosEnviados: (enviados: Partial<ArquivosDoProcesso>) => {
      if (!trava) return Promise.resolve()
      setTrava(null)
      aoMudar()
      const arquivos = { ...trava.processo.arquivos as ArquivosDoProcesso, ...enviados }
      return seguir({ ...trava.processo, arquivos }, trava.etapa, true)
    },
    mover: (processo: ProcessoDaLista, etapa: DestinoDoMovimento) => {
      if (processo.etapaAtual?.codigo === etapa.codigo) return Promise.resolve()
      return seguir(processo, etapa)
    },
    mudarEtiqueta: (id: string, etiqueta: EtiquetaDaEtapa) => gravar(() => processos.mudarEtiqueta(id, etiqueta)),
    mudarResponsavel: (id: string, usuarioId: string | null) => gravar(() => processos.mudarResponsavel(id, usuarioId)),
  }
}

export type MovimentoDoProcessoEmUso = ReturnType<typeof useMovimentoDoProcesso>
