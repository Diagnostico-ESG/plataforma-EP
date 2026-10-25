import '../JanelaDeConfirmacao.css'
import { type ReactNode, useEffect, useId, useRef } from 'react'

type JanelaDeEdicaoProps = {
  titulo: string
  /** Gravando: o botão vira "Salvando…" e fica desabilitado. */
  salvando: boolean
  /** A frase da recusa ou da falha ao gravar, em vermelho; a janela fica aberta com o preenchido. */
  falha: string | null
  aoSalvar: () => void
  aoFechar: () => void
  /** O botão de confirmar ("Salvar" por padrão; "Registrar" nas janelas de registro). */
  rotuloDoSalvar?: string
  /** Falso mantém o botão de confirmar desabilitado (o preenchimento ainda não basta). */
  podeSalvar?: boolean
  children: ReactNode
}

// A mesma janela nativa da JanelaComCampo e da JanelaDeAvanco (ADR 0003): abre ao montar, o foco vai ao primeiro campo e
// Esc fecha sem gravar. Quem a monta a desmonta ao fechar, e os campos recomeçam preenchidos na próxima vez.
export function JanelaDeEdicao({ titulo, salvando, falha, aoSalvar, aoFechar, rotuloDoSalvar = 'Salvar', podeSalvar = true, children }: JanelaDeEdicaoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const idDoTitulo = useId()

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    dialogo.showModal()
    dialogo.querySelector<HTMLElement>('input, textarea')?.focus()
  }, [])

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      {children}
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={salvando || !podeSalvar} onClick={aoSalvar}>
          {salvando ? 'Salvando…' : rotuloDoSalvar}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
