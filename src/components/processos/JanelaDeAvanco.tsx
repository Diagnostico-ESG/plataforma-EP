import '../JanelaDeConfirmacao.css'
import { useEffect, useId, useRef, useState } from 'react'
import type { UsuarioResponsavel } from '../../processos/tipos'
import { type AprovacaoDaJanela, useAprovacaoDaJanela } from '../../hooks/useAprovacaoDaJanela'
import { type RevisaoDaJanela, useRevisaoDaJanela } from '../../hooks/useRevisaoDaJanela'
import { BlocoDaAprovacao } from './BlocoDaAprovacao'
import { BlocoDaRevisao } from './BlocoDaRevisao'
import { EscolhaDoResponsavel, NINGUEM } from './EscolhaDoResponsavel'

type JanelaDeAvancoProps = {
  titulo: string
  rotuloDaAcao: string
  /** Dispensar, Realizada anteriormente e Voltar: o campo obrigatório (nota ou motivo) vem antes da escolha. */
  comNota: boolean
  /** O rótulo do campo obrigatório: "Nota" ou "Motivo". */
  rotuloDoCampo: string
  /** A pergunta da escolha: "Quem fica com a próxima etapa?" ou, ao voltar, "Quem fica com esta etapa?". Null: sem etapa pendente depois, sem escolha. */
  pergunta: string | null
  usuarios: UsuarioResponsavel[]
  /** O id marcado ao abrir; null marca "Ninguém por enquanto". */
  marcadoAoAbrir: string | null
  /** O que impede de concluir (a versão mais recente incompleta): a frase aparece e o botão principal fica desabilitado. */
  bloqueio?: string | null
  /** Um aviso que não impede (ex.: "A aprovação da V8 será desfeita." ao voltar): aparece acima do campo do motivo. */
  aviso?: string | null
  /** Só na conclusão da Revisão interna: o Resultado, o Escopo e o Comentário entram na janela e a gravação é dela. */
  revisao?: RevisaoDaJanela
  /** Só na conclusão da Aprovação pelo setor: a versão aprovada e o número, o link e a data do E-protocolo entram na janela e a gravação é dela. */
  aprovacao?: AprovacaoDaJanela
  /** A nota chega sem espaços nas pontas ("" quando não há nota); o responsável, null para "Ninguém por enquanto". */
  aoConfirmar: (nota: string, responsavelId: string | null) => void
  aoFechar: () => void
}

// A mesma janela nativa da JanelaComCampo e da JanelaDeReclassificacao (ADR 0003): abre ao montar, o foco vai ao
// campo da nota (quando há) ou à opção marcada, o botão só se habilita com a nota preenchida e Esc fecha sem gravar.
// Quem a monta a desmonta ao fechar, e a escolha recomeça marcada na próxima vez.
export function JanelaDeAvanco({
  titulo, rotuloDaAcao, comNota, rotuloDoCampo, pergunta, usuarios, marcadoAoAbrir, bloqueio, aviso, revisao, aprovacao, aoConfirmar, aoFechar,
}: JanelaDeAvancoProps) {
  const janela = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const idDoTitulo = useId()
  const idDoCampo = useId()
  const [nota, setNota] = useState('')
  const [responsavel, setResponsavel] = useState(marcadoAoAbrir ?? NINGUEM)
  const daRevisao = useRevisaoDaJanela(revisao, bloqueio, aoFechar)
  const daAprovacao = useAprovacaoDaJanela(aprovacao, bloqueio, aoFechar)
  const gravacao = aprovacao ? daAprovacao : daRevisao
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
    // A revisão e a aprovação esperam a gravação (a falha aparece na janela, com o preenchido); as outras ações fecham antes de gravar.
    if (revisao || aprovacao) {
      void gravacao.gravar(responsavelId)
      return
    }
    aoFechar()
    aoConfirmar(nota.trim(), responsavelId)
  }

  return (
    <dialog ref={janela} className="janela-confirmacao" aria-labelledby={idDoTitulo} onClose={aoFechar}>
      <h3 id={idDoTitulo} className="janela-confirmacao-titulo">{titulo}</h3>
      {aviso && <p className="janela-ajuda" role="note">{aviso}</p>}
      {comNota && (
        <>
          <label htmlFor={idDoCampo}>{rotuloDoCampo}</label>
          <textarea ref={campo} id={idDoCampo} className="janela-campo" rows={3} maxLength={2000} value={nota}
            onChange={(mudanca) => setNota(mudanca.target.value)} />
        </>
      )}
      <AlertaDaJanela texto={gravacao.frase} />
      <BlocosDoRegistro revisao={revisao} aprovacao={aprovacao} daRevisao={daRevisao} daAprovacao={daAprovacao} />
      <AlertaDaJanela texto={gravacao.falha} />
      {pergunta !== null && (
        <EscolhaDoResponsavel pergunta={pergunta} usuarios={usuarios} marcado={responsavel} aoEscolher={setResponsavel} aoConfirmar={confirmar} />
      )}
      <div className="janela-confirmacao-botoes">
        <button type="button" className="botao botao-principal" disabled={!pronta} onClick={confirmar}>
          {gravacao.salvando ? 'Salvando…' : rotuloDaAcao}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
      </div>
    </dialog>
  )
}

type BlocosDoRegistroProps = {
  revisao?: RevisaoDaJanela
  aprovacao?: AprovacaoDaJanela
  daRevisao: ReturnType<typeof useRevisaoDaJanela>
  daAprovacao: ReturnType<typeof useAprovacaoDaJanela>
}

// O que a conclusão da Revisão interna ou da Aprovação pede acima da escolha do responsável.
function BlocosDoRegistro({ revisao, aprovacao, daRevisao, daAprovacao }: BlocosDoRegistroProps) {
  return (
    <>
      {revisao && <BlocoDaRevisao opcoes={revisao.opcoes} valor={daRevisao.rascunho} aoMudar={daRevisao.setRascunho} />}
      {aprovacao && <BlocoDaAprovacao versao={aprovacao.versao} valor={daAprovacao.rascunho} aoMudar={daAprovacao.setRascunho} />}
    </>
  )
}

// A frase em vermelho da janela (o que impede de concluir, ou a falha da gravação); sem texto, nada aparece.
function AlertaDaJanela({ texto }: { texto: string | null }) {
  return texto ? <p className="cadastros-falha" role="alert">{texto}</p> : null
}
