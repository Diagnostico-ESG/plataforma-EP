import type { RascunhoDaAprovacao } from '../../revisoes/rascunhoDaAprovacao'
import { CamposDoEProtocolo } from './CamposDoEProtocolo'

type BlocoDaAprovacaoProps = {
  /** O número da versão que está sendo aprovada (a mais recente). */
  versao: number | null
  valor: RascunhoDaAprovacao
  aoMudar: (valor: RascunhoDaAprovacao) => void
}

/** O que a janela de concluir a Aprovação pelo setor pede acima da escolha do responsável: a versão aprovada em destaque e o E-protocolo. */
export function BlocoDaAprovacao({ versao, valor, aoMudar }: BlocoDaAprovacaoProps) {
  return (
    <>
      {versao !== null && <p className="janela-aprovada">{`Versão aprovada: V${versao}`}</p>}
      <CamposDoEProtocolo valor={valor} aoMudar={aoMudar} />
    </>
  )
}
