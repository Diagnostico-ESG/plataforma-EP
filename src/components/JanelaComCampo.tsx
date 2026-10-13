import './JanelaDeConfirmacao.css'
import { useEffect, useId, useRef, useState } from 'react'

type JanelaComCampoProps = {
  aberta: boolean
  titulo: string
  rotuloDoCampo: string
  rotuloDaAcao: string
  /** Recebe o texto sem espaços nas pontas. */
  aoConfirmar: (texto: string) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaDeConfirmacao (ADR 0003), com um campo obrigatório: o foco abre no campo,
// o botão da ação só se habilita com texto e Esc fecha sem gravar. Fechar limpa o campo para a próxima vez.
export function JanelaComCampo({ aberta, titulo, rotuloDoCampo, rotuloDaAcao, aoConfirmar, aoFechar }: JanelaComCampoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const [texto, setTexto] = useState('')
  const idDoTitulo = useId()
  const idDoCampo = useId()

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    if (aberta && !dialogo.open) {
      dialogo.showModal()
      campo.current?.focus()
    }
    if (!aberta && dialogo.open) dialogo.close()
  }, [aberta])

  const fechar = () => {
    setTexto('')
    aoFechar()
  }
  const confirmar = () => {
    const valor = texto.trim()
    fechar()
    aoConfirmar(valor)
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={fechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      <label htmlFor={idDoCampo}>{rotuloDoCampo}</label>
      <textarea ref={campo} id={idDoCampo} className="janela-campo" rows={3} maxLength={2000} value={texto}
        onChange={(mudanca) => setTexto(mudanca.target.value)} />
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={texto.trim() === ''} onClick={confirmar}>
          {rotuloDaAcao}
        </button>
        <button type="button" className="botao botao-secundario" onClick={fechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
