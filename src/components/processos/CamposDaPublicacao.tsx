import { useId } from 'react'
import { hojeLocal } from '../../processos/textoDaModelagemPiloto'

type ValorDosCampos = { data: string; link: string }
type CamposDaPublicacaoProps<T extends ValorDosCampos> = { valor: T; aoMudar: (valor: T) => void }

/**
 * A data da publicação (nunca depois de hoje; o banco confere o resto) e o link opcional: a janela da chegada a Concluídos e
 * a de registrar ou corrigir a publicação os usam.
 */
export function CamposDaPublicacao<T extends ValorDosCampos>({ valor, aoMudar }: CamposDaPublicacaoProps<T>) {
  const idDaData = useId()
  const idDoLink = useId()
  return (
    <>
      <label htmlFor={idDaData} className="janela-escolha-pergunta janela-revisao-rotulo">Data da publicação</label>
      <input id={idDaData} type="date" className="janela-campo" required max={hojeLocal()} value={valor.data}
        onChange={(mudanca) => aoMudar({ ...valor, data: mudanca.target.value })} />
      <label htmlFor={idDoLink} className="janela-escolha-pergunta janela-revisao-rotulo">Link (opcional)</label>
      <input id={idDoLink} type="url" className="janela-campo" maxLength={500} value={valor.link}
        onChange={(mudanca) => aoMudar({ ...valor, link: mudanca.target.value })} />
    </>
  )
}
