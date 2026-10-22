import { useId } from 'react'

type PerguntaDaPublicacaoProps = {
  /** null: sem resposta ainda (nada marcado). */
  resposta: boolean | null
  aoResponder: (resposta: boolean) => void
}

const OPCOES = [{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não' }]

/** "Vai para publicação?" (Sim | Não), com o mesmo grupo de rádios nativos da escolha do responsável. */
export function PerguntaDaPublicacao({ resposta, aoResponder }: PerguntaDaPublicacaoProps) {
  const idDaPergunta = useId()
  const nomeDoGrupo = useId()
  return (
    <div role="radiogroup" aria-labelledby={idDaPergunta} aria-required="true" className="janela-escolha">
      <span id={idDaPergunta} className="janela-escolha-pergunta">Vai para publicação?</span>
      {OPCOES.map((opcao) => (
        <label key={opcao.rotulo} className="janela-escolha-opcao">
          <input type="radio" name={nomeDoGrupo} checked={resposta === opcao.valor} onChange={() => aoResponder(opcao.valor)} />
          {opcao.rotulo}
        </label>
      ))}
    </div>
  )
}
