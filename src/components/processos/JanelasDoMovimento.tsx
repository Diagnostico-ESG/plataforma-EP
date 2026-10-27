import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDaChegada } from './JanelaDaChegada'
import { JanelaDaConfirmacaoDeArquivos } from './JanelaDaConfirmacaoDeArquivos'
import { JanelaDeEnvioDeArquivos } from './JanelaDeEnvioDeArquivos'

type JanelasDoMovimentoProps = {
  movimento: MovimentoDoProcessoEmUso
  processos: ModuloDeProcessos
  versoes: ModuloDeVersoes
  /** Chamado quando a janela da chegada gravou, antes de fechar: o Quadro e o verso leem de novo. */
  aoGravar: () => void
}

/** As janelas que o movimento pode abrir, uma de cada vez: a Confirmação de arquivos, o envio que ela abre e, depois, a chegada a Concluídos. */
export function JanelasDoMovimento({ movimento, processos, versoes, aoGravar }: JanelasDoMovimentoProps) {
  return (
    <>
      {movimento.confirmacao && (
        <JanelaDaConfirmacaoDeArquivos pedido={movimento.confirmacao} aoEnviar={movimento.enviarAgora} aoAvancar={movimento.avancarSemArquivos} aoFechar={movimento.fecharConfirmacao} />
      )}
      {movimento.envio && (
        <JanelaDeEnvioDeArquivos key={movimento.envio.faltas[0].codigo} pedido={movimento.envio} versoes={versoes} aoEnviar={movimento.arquivosEnviados} aoFechar={movimento.fecharEnvio} />
      )}
      {movimento.chegada && (
        <JanelaDaChegada chegada={movimento.chegada} processos={processos} aoGravar={aoGravar} aoFechar={movimento.fecharChegada} />
      )}
    </>
  )
}
