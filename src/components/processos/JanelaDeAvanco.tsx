import '../JanelaDeConfirmacao.css'
import { useEffect, useId, useRef, useState } from 'react'
import type { UsuarioResponsavel } from '../../processos/tipos'
import { type RevisaoDaJanela, useRevisaoDaJanela } from '../../hooks/useRevisaoDaJanela'
import { BlocoDaRevisao } from './BlocoDaRevisao'
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
  /** Só na conclusão da Revisão interna: o Resultado, o Escopo e o Comentário entram na janela e a gravação é dela. */
  revisao?: RevisaoDaJanela
  /** A nota chega sem espaços nas pontas ("" quando não há nota); o responsável, null para "Ninguém por enquanto". */
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaComCampo e da JanelaDeReclassificacao (ADR 0003): abre ao montar, o foco vai ao
// campo da nota (quando há) ou à opção marcada, o botão só se habilita com a nota preenchida e Esc fecha sem gravar.
// Quem a monta a desmonta ao fechar, e a escolha recomeça marcada na próxima vez.
export function JanelaDeAvanco({
  titulo, rotuloDaAcao, comNota, rotuloDoCampo, pergunta, usuarios, marcadoAoAbrir, bloqueio, revisao, aoConfirmar, aoFechar,
}: JanelaDeAvancoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const idDoTitulo = useId()
  const idDoCampo = useId()
  const [nota, setNota] = useState('')
  const [responsavel, setResponsavel] = useState(marcadoAoAbrir ?? NINGUEM)
  const gravacao = useRevisaoDaJanela(revisao, bloqueio, aoFechar)
  const pronta = (!comNota || nota.trim() !== '') && gravacao.liberada

  useEffect(() => {
    const dialogo = janela.current
    if (!dialogo) return
    dialogo.showModal()
    const marcada = dialogo.querySelector<HTMLInputElement>('input:checked')
    ;(campo.current ?? marcada)?.focus()
  }, [])

  const confirmar = () => {
    if (!pronta) return
    const responsavelId = responsavel === NINGUEM ? null : responsavel
    // A revisão espera a gravação (a falha aparece na janela, com o preenchido); as outras ações fecham antes de gravar.
    if (revisao) {
      void gravacao.gravar(responsavelId)
      return
    }
    aoFechar()
    aoConfirmar(nota.trim(), responsavelId)
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
      <AlertaDaJanela texto={gravacao.frase} />
      {revisao && <BlocoDaRevisao opcoes={revisao.opcoes} valor={gravacao.rascunho} aoMudar={gravacao.setRascunho} />}
      <AlertaDaJanela texto={gravacao.falha} />
      <EscolhaDoResponsavel pergunta={pergunta} usuarios={usuarios} marcado={responsavel} aoEscolher={setResponsavel} aoConfirmar={confirmar} />
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={!pronta} onClick={confirmar}>
          {gravacao.salvando ? 'Salvando…' : rotuloDaAcao}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}

// A frase em vermelho da janela (o que impede de concluir, ou a falha da gravação); sem texto, nada aparece.
function AlertaDaJanela({ texto }: { texto: string | null }) {
  return texto ? <p className="cadastros-falha" role="alert">{texto}</p> : null
}
