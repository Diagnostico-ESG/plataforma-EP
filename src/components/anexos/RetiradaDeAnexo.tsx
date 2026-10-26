import type { Anexo } from '../../anexos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type RetiradaDeAnexoProps = {
  /** O anexo à espera da confirmação; sem ele, a janela fica fechada. */
  anexo: Anexo | null
  /** A frase da última retirada que falhou. */
  falha: string | null
  aoConfirmar: () => void
  aoFechar: () => void
}

/** A confirmação da retirada (o foco abre no Cancelar) e o aviso em vermelho da retirada que falhou. */
export function RetiradaDeAnexo({ anexo, falha, aoConfirmar, aoFechar }: RetiradaDeAnexoProps) {
  return (
    <>
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <JanelaDeConfirmacao aberta={anexo !== null} titulo={`Retirar '${anexo?.nome ?? ''}'?`}
        texto="O arquivo vai para a lixeira do Drive e some em 30 dias." rotuloDaAcao="Retirar"
        aoConfirmar={aoConfirmar} aoFechar={aoFechar} />
    </>
  )
}
