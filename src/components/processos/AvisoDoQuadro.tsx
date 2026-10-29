import type { QuemSaiu } from '../../hooks/useTirarDoQuadro'
import { Icone } from '../Icone'

type AvisoDoQuadroProps = {
  aviso: QuemSaiu | null
  /** A falha de tirar ou desfazer: o cartão fica onde estava, com a mensagem. */
  falha: string | null
  aoDesfazer: () => void
  aoFechar: () => void
}

/**
 * O aviso "Tirado do Quadro · Desfazer" (anunciado a leitores de tela) e a falha de tirar ou desfazer. Fica no fluxo, acima da
 * visão, para não cobrir cartão nem coluna.
 */
export function AvisoDoQuadro({ aviso, falha, aoDesfazer, aoFechar }: AvisoDoQuadroProps) {
  return (
    <>
      {aviso && (
        <div className="aviso-do-quadro" role="status" aria-label="Tirado do Quadro">
          <span>Tirado do Quadro · {aviso.nome}</span>
          <button type="button" className="botao botao-secundario" onClick={aoDesfazer}>Desfazer</button>
          <button type="button" className="aviso-do-quadro-fechar" aria-label="Fechar o aviso" onClick={aoFechar}>
            <Icone nome="fechar" tamanho={14} />
          </button>
        </div>
      )}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
    </>
  )
}
