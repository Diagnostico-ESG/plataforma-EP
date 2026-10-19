import { useArrastoDoQuadro } from '../../hooks/useArrastoDoQuadro'
import { colunasDoQuadro } from '../../processos/colunasDoQuadro'
import type { ListaDeProcessos } from '../../processos/tipos'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import './Quadro.css'

type QuadroDeProcessosProps = {
  lista: ListaDeProcessos
  idEscolhido: string | null
  /** O endereço do painel de um processo, com a visão e os filtros de agora. */
  enderecoDoProcesso: (id: string) => string
  podeAlterar: boolean
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

export function QuadroDeProcessos({ lista, idEscolhido, enderecoDoProcesso, podeAlterar }: QuadroDeProcessosProps) {
  const colunas = colunasDoQuadro(lista)
  const arrasto = useArrastoDoQuadro(colunas, () => undefined)
  return (
    <>
      {arrasto.aviso && <p className="quadro-aviso" role="status">{arrasto.aviso}</p>}
      <div className="quadro-colunas">
        {colunas.map((coluna) => (
          <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso}
            podeAlterar={podeAlterar} arrasto={arrasto} />
        ))}
      </div>
    </>
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
