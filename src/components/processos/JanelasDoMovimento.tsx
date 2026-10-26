import type { MovimentoDoProcessoEmUso } from '../../hooks/useMovimentoDoProcesso'
import type { ModuloDeProcessos } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { JanelaDaChegada } from './JanelaDaChegada'
import { JanelaDaTrava } from './JanelaDaTrava'

type JanelasDoMovimentoProps = {
  movimento: MovimentoDoProcessoEmUso
  processos: ModuloDeProcessos
  versoes: ModuloDeVersoes
  /** Chamado quando a janela da chegada gravou, antes de fechar: o Quadro e o verso leem de novo. */
  aoGravar: () => void
}

/** As janelas que o movimento pode abrir, uma de cada vez: a trava de arquivos e, por último, a chegada a Concluídos. */
export function JanelasDoMovimento({ movimento, processos, versoes, aoGravar }: JanelasDoMovimentoProps) {
  return (
    <>
      {movimento.trava && (
        <JanelaDaTrava key={movimento.trava.trava.codigo} pedido={movimento.trava} versoes={versoes} aoEnviar={movimento.arquivosEnviados} aoFechar={movimento.fecharTrava} />
      )}
      {movimento.chegada && (
        <JanelaDaChegada chegada={movimento.chegada} processos={processos} aoGravar={aoGravar} aoFechar={movimento.fecharChegada} />
      )}
    </>
  )
}
