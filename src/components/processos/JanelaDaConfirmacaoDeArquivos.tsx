import { useEffect, useId, useRef } from 'react'
import type { PedidoDeConfirmacao } from '../../hooks/useMovimentoDoProcesso'
import { perguntaDeArquivos } from '../../processos/frasesDaConfirmacaoDeArquivos'
import '../JanelaDeConfirmacao.css'

type JanelaDaConfirmacaoDeArquivosProps = {
  pedido: PedidoDeConfirmacao
  /** [Avançar mesmo assim]: a tela move o processo sem enviar nada. */
  aoAvancar: () => void
  aoFechar: () => void
}

/**
 * A Confirmação de arquivos (ADR 0028): mover para a frente da Modelagem piloto ou da Relatório e modelagem técnica sem os
 * arquivos delas pergunta antes, com o texto da etapa e só o que falta. [Cancelar] e Esc deixam o processo onde estava.
 * O foco abre no Cancelar, como nas outras confirmações (ADR 0003). Quem a monta a desmonta ao fechar.
 */
export function JanelaDaConfirmacaoDeArquivos({ pedido, aoAvancar, aoFechar }: JanelaDaConfirmacaoDeArquivosProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const botaoCancelar = useRef<HTMLButtonElement>(null)
  const idDoTitulo = useId()
  const { titulo, paragrafos } = perguntaDeArquivos(pedido.faltas)

  useEffect(() => {
    janela.current?.showModal()
    botaoCancelar.current?.focus()
  }, [])

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      {paragrafos.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" onClick={aoAvancar}>Avançar mesmo assim</button>
        <button ref={botaoCancelar} type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
