import { useId } from 'react'
import { ROTULO_DO_ESCOPO } from '../../revisoes/frasesDeRevisao'
import type { OpcaoDoResultado } from '../../revisoes/opcoesDaRevisao'
import type { EscopoDaCorrecao, ResultadoDaRevisao } from '../../revisoes/tipos'

const ESCOPOS: EscopoDaCorrecao[] = ['fluxograma', 'relatorio', 'ambos']

type CampoDoResultadoProps = { opcoes: OpcaoDoResultado[]; valor: ResultadoDaRevisao | null; aoMudar: (resultado: ResultadoDaRevisao) => void }

/** As duas opções do resultado, cada uma com a versão que cobre; a desabilitada diz o motivo ao lado. */
export function CampoDoResultado({ opcoes, valor, aoMudar }: CampoDoResultadoProps) {
  const nome = useId()
  return (
    <fieldset className="janela-revisao">
      <legend className="janela-escolha-pergunta">Resultado</legend>
      {opcoes.map((opcao) => (
        <label key={opcao.resultado} className="janela-escolha-opcao">
          <input type="radio" name={nome} checked={valor === opcao.resultado} disabled={opcao.desabilitada}
            onChange={() => aoMudar(opcao.resultado)} />
          {opcao.rotulo}
          {opcao.motivo && <span className="janela-ajuda"> {opcao.motivo}</span>}
        </label>
      ))}
    </fieldset>
  )
}

type CampoDoEscopoProps = { valor: EscopoDaCorrecao | null; aoMudar: (escopo: EscopoDaCorrecao) => void }

/** A escolha do escopo da correção (fluxograma, relatório ou ambos): a janela de registrar e a de editar a revisão a usam. */
export function CampoDoEscopo({ valor, aoMudar }: CampoDoEscopoProps) {
  const nome = useId()
  return (
    <fieldset className="janela-revisao">
      <legend className="janela-escolha-pergunta">Escopo da correção</legend>
      {ESCOPOS.map((escopo) => (
        <label key={escopo} className="janela-escolha-opcao">
          <input type="radio" name={nome} checked={valor === escopo} onChange={() => aoMudar(escopo)} />
          {ROTULO_DO_ESCOPO[escopo]}
        </label>
      ))}
    </fieldset>
  )
}

type CampoDoComentarioProps = { valor: string; aoMudar: (comentario: string) => void }

/** O comentário opcional da revisão (até 2.000 caracteres), com o aviso de não anotar dado pessoal. */
export function CampoDoComentario({ valor, aoMudar }: CampoDoComentarioProps) {
  const id = useId()
  return (
    <>
      <label htmlFor={id} className="janela-escolha-pergunta janela-revisao-rotulo">Comentário (opcional)</label>
      <textarea id={id} className="janela-campo" rows={2} maxLength={2000} value={valor}
        onChange={(mudanca) => aoMudar(mudanca.target.value)} />
      <p className="janela-ajuda">Não anote dado pessoal de pessoas do setor.</p>
    </>
  )
}
