import { useEffect, useId, useRef } from 'react'

type JanelaDeConfirmacaoProps = {
  aberta: boolean
  titulo: string
  texto: string
  rotuloDaAcao: string
  aoConfirmar: () => void
  aoFechar: () => void
}

// <dialog> nativo: o navegador cuida do fundo esmaecido, do Esc e de devolver o foco ao botão de origem.
// O foco abre no Cancelar para que um Enter por reflexo não grave nada (ADR 0003).
export function JanelaDeConfirmacao({ aberta, titulo, texto, rotuloDaAcao, aoConfirmar, aoFechar }: JanelaDeConfirmacaoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const botaoCancelar = useRef<HTMLButtonElement>(null)
  const idDoTitulo = useId()

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    if (aberta && !dialogo.open) {
      dialogo.showModal()
      botaoCancelar.current?.focus()
    }
    if (!aberta && dialogo.open) dialogo.close()
  }, [aberta])

  const confirmar = () => {
    aoFechar()
    aoConfirmar()
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      <p>{texto}</p>
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" onClick={confirmar}>{rotuloDaAcao}</button>
        <button ref={botaoCancelar} type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
