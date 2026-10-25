import { useId } from 'react'
import { hojeLocal } from '../../processos/textoDaModelagemPiloto'
import type { RascunhoDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'

type CamposDoEProtocoloProps = { valor: RascunhoDaAprovacao; aoMudar: (valor: RascunhoDaAprovacao) => void }

/**
 * O número, o link e a data do E-protocolo, os três opcionais (a data nunca passa de hoje; o banco confere as regras): a
 * janela de registrar a aprovação e a de editar a aprovação os usam.
 */
export function CamposDoEProtocolo({ valor, aoMudar }: CamposDoEProtocoloProps) {
  const idDoNumero = useId()
  const idDoLink = useId()
  const idDaData = useId()
  return (
    <>
      <label htmlFor={idDoNumero} className="janela-escolha-pergunta janela-revisao-rotulo">Número do E-protocolo (opcional)</label>
      <input id={idDoNumero} type="text" className="janela-campo" maxLength={60} value={valor.numero}
        onChange={(mudanca) => aoMudar({ ...valor, numero: mudanca.target.value })} />
      <label htmlFor={idDoLink} className="janela-escolha-pergunta janela-revisao-rotulo">Link (opcional)</label>
      <input id={idDoLink} type="url" className="janela-campo" maxLength={500} value={valor.link}
        onChange={(mudanca) => aoMudar({ ...valor, link: mudanca.target.value })} />
      <label htmlFor={idDaData} className="janela-escolha-pergunta janela-revisao-rotulo">Data da aprovação (opcional)</label>
      <input id={idDaData} type="date" className="janela-campo" max={hojeLocal(new Date())} value={valor.data}
        onChange={(mudanca) => aoMudar({ ...valor, data: mudanca.target.value })} />
    </>
  )
}
