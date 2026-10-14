import { colunasDoQuadro } from '../../processos/colunasDoQuadro'
import type { ListaDeProcessos } from '../../processos/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import './Quadro.css'

type QuadroDeProcessosProps = {
  lista: ListaDeProcessos
  idEscolhido: string | null
  /** O endereço do painel de um processo, com a visão e os filtros de agora. */
  enderecoDoProcesso: (id: string) => string
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

export function QuadroDeProcessos({ lista, idEscolhido, enderecoDoProcesso }: QuadroDeProcessosProps) {
  return (
    <div className="quadro-colunas">
      {colunasDoQuadro(lista).map((coluna) => (
        <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} />
      ))}
    </div>
  )
}

export function QuadroCarregando() {
  return (
    <div className="quadro" aria-busy="true">
      <p className="quadro-carregando" role="status">Carregando processos…</p>
      <div className="quadro-colunas" aria-hidden="true">
        {COLUNAS_FANTASMA.map((coluna) => <div key={coluna} className="coluna coluna-fantasma" />)}
      </div>
    </div>
  )
}
