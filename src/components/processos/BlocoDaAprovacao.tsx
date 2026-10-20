import { useId } from 'react'
import { hojeLocal } from '../../processos/textoDaReuniao'
import type { RascunhoDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'

type BlocoDaAprovacaoProps = {
  /** O número da versão que está sendo aprovada (a mais recente). */
  versao: number
  valor: RascunhoDaAprovacao
  aoMudar: (valor: RascunhoDaAprovacao) => void
}

/**
 * O que a janela de concluir a Aprovação pelo setor pede acima da escolha do responsável: a versão aprovada em destaque e
 * o número, o link e a data do E-protocolo, os três opcionais (a data nunca passa de hoje; o banco confere as regras).
 */
export function BlocoDaAprovacao({ versao, valor, aoMudar }: BlocoDaAprovacaoProps) {
  const idDoNumero = useId()
  const idDoLink = useId()
  const idDaData = useId()
  return (
    <>
      <p className="janela-aprovada">{`Versão aprovada: V${versao}`}</p>
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
