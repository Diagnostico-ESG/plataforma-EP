import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDaChegada } from './JanelaDaChegada'
import { JanelaDaConfirmacaoDeArquivos } from './JanelaDaConfirmacaoDeArquivos'

type JanelasDoMovimentoProps = {
  movimento: MovimentoDoProcessoEmUso
  processos: ModuloDeProcessos
  /** Ainda sem uso aqui: [Enviar arquivos agora] (ticket 02 de travas-em-avisos) volta a precisar do envio de versões. */
  versoes?: ModuloDeVersoes
  /** Chamado quando a janela da chegada gravou, antes de fechar: o Quadro e o verso leem de novo. */
  aoGravar: () => void
}

/** As janelas que o movimento pode abrir, uma de cada vez: a Confirmação de arquivos e, depois dela, a chegada a Concluídos. */
export function JanelasDoMovimento({ movimento, processos, aoGravar }: JanelasDoMovimentoProps) {
  return (
    <>
      {movimento.confirmacao && (
        <JanelaDaConfirmacaoDeArquivos pedido={movimento.confirmacao} aoAvancar={movimento.avancarSemArquivos} aoFechar={movimento.fecharConfirmacao} />
      )}
      {movimento.chegada && (
        <JanelaDaChegada chegada={movimento.chegada} processos={processos} aoGravar={aoGravar} aoFechar={movimento.fecharChegada} />
      )}
    </>
  )
}
