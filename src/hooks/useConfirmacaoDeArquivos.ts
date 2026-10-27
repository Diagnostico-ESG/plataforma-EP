import { useState } from 'react'
import { type TravaDeArquivos, travasDaIda } from '../processos/travaDeArquivos'
import type { ArquivosDoProcesso, EtapaDoCatalogo, ProcessoDaLista } from '../processos/tipos'

/** O que mover precisa saber da etapa de destino. */
export type DestinoDoMovimento = Pick<EtapaDoCatalogo, 'id' | 'codigo' | 'ordem'>

/** A Confirmação de arquivos que espera a resposta: o processo, o destino e as etapas a que faltam arquivos, em ordem. */
export type PedidoDeConfirmacao = { processo: ProcessoDaLista; etapa: DestinoDoMovimento; faltas: TravaDeArquivos[] }

/** Segue o movimento depois da pergunta; `depoisDoEnvio` diz que os arquivos acabaram de ser enviados. */
type SeguirMovimento = (processo: ProcessoDaLista, etapa: DestinoDoMovimento, depoisDoEnvio: boolean) => Promise<void>

/**
 * A Confirmação de arquivos (ADR 0028): a pergunta (`confirmacao`) e o envio que [Enviar arquivos agora] abre (`envio`).
 * [Avançar mesmo assim] segue o movimento sem conferir de novo; depois do envio, a pergunta volta só com o que sobrou, ou o
 * movimento segue. Quem move (`seguir`) decide a chegada a Concluídos e a gravação.
 */
export function useConfirmacaoDeArquivos(etapas: EtapaDoCatalogo[], aoMudar: () => void, seguir: SeguirMovimento) {
  const [confirmacao, setConfirmacao] = useState<PedidoDeConfirmacao | null>(null)
  const [envio, setEnvio] = useState<PedidoDeConfirmacao | null>(null)

  // Os arquivos foram enviados: a tela relê o processo e, se ainda falta algo, a pergunta volta só com o que sobrou.
  function depoisDoEnvio(pedido: PedidoDeConfirmacao, enviados: Partial<ArquivosDoProcesso>): Promise<void> {
    const processo = { ...pedido.processo, arquivos: { ...(pedido.processo.arquivos as ArquivosDoProcesso), ...enviados } }
    const faltas = travasDaIda(processo, pedido.etapa, etapas)
    if (faltas.length === 0) return seguir(processo, pedido.etapa, true)
    setConfirmacao({ processo, etapa: pedido.etapa, faltas })
    return Promise.resolve()
  }

  return {
    confirmacao, envio,
    /** Pergunta quando faltam arquivos na ida; devolve se perguntou (se não, quem move segue). */
    perguntar: (processo: ProcessoDaLista, etapa: DestinoDoMovimento): boolean => {
      const faltas = travasDaIda(processo, etapa, etapas)
      if (faltas.length > 0) setConfirmacao({ processo, etapa, faltas })
      return faltas.length > 0
    },
    fecharConfirmacao: () => setConfirmacao(null),
    fecharEnvio: () => setEnvio(null),
    /** [Enviar arquivos agora]: abre o envio da primeira etapa que falta. */
    enviarAgora: () => {
      setEnvio(confirmacao)
      setConfirmacao(null)
    },
    /** [Avançar mesmo assim]: o movimento segue sem enviar nada e sem conferir os arquivos de novo (o banco aceita). */
    avancarSemArquivos: () => {
      if (!confirmacao) return Promise.resolve()
      setConfirmacao(null)
      return seguir(confirmacao.processo, confirmacao.etapa, false)
    },
    /** O envio deu certo: a tela relê o processo e segue (a pergunta com o que sobrou, a chegada ou o movimento). */
    arquivosEnviados: (enviados: Partial<ArquivosDoProcesso>) => {
      if (!envio) return Promise.resolve()
      setEnvio(null)
      aoMudar()
      return depoisDoEnvio(envio, enviados)
    },
  }
}
