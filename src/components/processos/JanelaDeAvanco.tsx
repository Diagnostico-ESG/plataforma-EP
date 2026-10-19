import '../JanelaDeConfirmacao.css'
import { useEffect, useId, useRef, useState } from 'react'
import type { UsuarioResponsavel } from '../../processos/tipos'
import { EscolhaDoResponsavel, NINGUEM } from './EscolhaDoResponsavel'

type JanelaDeAvancoProps = {
  titulo: string
  rotuloDaAcao: string
  /** Dispensar, Realizada anteriormente e Voltar: o campo obrigatório (nota ou motivo) vem antes da escolha. */
  comNota: boolean
  /** O rótulo do campo obrigatório: "Nota" ou "Motivo". */
  rotuloDoCampo: string
  /** A pergunta da escolha: "Quem fica com a próxima etapa?" ou, ao voltar, "Quem fica com esta etapa?". */
  pergunta: string
  usuarios: UsuarioResponsavel[]
  /** O id marcado ao abrir; null marca "Ninguém por enquanto". */
  marcadoAoAbrir: string | null
  /** O que impede de concluir (a versão mais recente incompleta): a frase aparece e o botão principal fica desabilitado. */
  bloqueio?: string | null
  /** A nota chega sem espaços nas pontas ("" quando não há nota); o responsável, null para "Ninguém por enquanto". */
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaComCampo e da JanelaDeReclassificacao (ADR 0003): abre ao montar, o foco vai ao
// campo da nota (quando há) ou à opção marcada, o botão só se habilita com a nota preenchida e Esc fecha sem gravar.
// Quem a monta a desmonta ao fechar, e a escolha recomeça marcada na próxima vez.
export function JanelaDeAvanco({
  titulo, rotuloDaAcao, comNota, rotuloDoCampo, pergunta, usuarios, marcadoAoAbrir, bloqueio = null, aoConfirmar, aoFechar,
}: JanelaDeAvancoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const idDoTitulo = useId()
  const idDoCampo = useId()
  const [nota, setNota] = useState('')
  const [responsavel, setResponsavel] = useState(marcadoAoAbrir ?? NINGUEM)
  const pronta = (!comNota || nota.trim() !== '') && bloqueio === null

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    dialogo.showModal()
    const marcada = dialogo.querySelector<HTMLInputElement>('input:checked')
    ;(campo.current ?? marcada)?.focus()
  }, [])

  const confirmar = () => {
    if (!pronta) return
    aoFechar()
    aoConfirmar(nota.trim(), responsavel === NINGUEM ? null : responsavel)
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      {comNota && (
        <>
          <label htmlFor={idDoCampo}>{rotuloDoCampo}</label>
          <textarea ref={campo} id={idDoCampo} className="janela-campo" rows={3} maxLength={2000} value={nota}
            onChange={(mudanca) => setNota(mudanca.target.value)} />
        </>
      )}
      {bloqueio && <p className="cadastros-falha" role="alert">{bloqueio}</p>}
      <EscolhaDoResponsavel pergunta={pergunta} usuarios={usuarios} marcado={responsavel} aoEscolher={setResponsavel} aoConfirmar={confirmar} />
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={!pronta} onClick={confirmar}>{rotuloDaAcao}</button>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}
