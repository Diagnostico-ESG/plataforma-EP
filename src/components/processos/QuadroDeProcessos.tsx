import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import { colunasDoQuadro } from '../../processos/colunasDoQuadro'
import type { ListaDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { ColunaDoQuadro } from './ColunaDoQuadro'
import './Quadro.css'

type QuadroDeProcessosProps = {
  estado: EstadoDoCarregamento<ListaDeProcessos>
  aoTentarDeNovo: () => void
  podeAlterar: boolean
  aoCadastrar: () => void
  idEscolhido: string | null
}

const COLUNAS_FANTASMA = [0, 1, 2, 3]

export function QuadroDeProcessos({ estado, aoTentarDeNovo, podeAlterar, aoCadastrar, idEscolhido }: QuadroDeProcessosProps) {
  if (estado.tipo === 'carregando') return <QuadroCarregando />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  return (
    <div className="quadro">
      {podeAlterar && (
        <div className="quadro-barra">
          <button type="button" className="botao botao-principal" onClick={aoCadastrar}>
            <Icone nome="mais" tamanho={16} />
            Cadastrar processo
          </button>
        </div>
      )}
      <div className="quadro-colunas">
        {colunasDoQuadro(estado.valor).map((coluna) => (
          <ColunaDoQuadro key={coluna.chave} coluna={coluna} idEscolhido={idEscolhido} />
        ))}
      </div>
    </div>
  )
}

function QuadroCarregando() {
  return (
    <div className="quadro" aria-busy="true">
      <p className="quadro-carregando" role="status">Carregando processos…</p>
      <div className="quadro-colunas" aria-hidden="true">
        {COLUNAS_FANTASMA.map((coluna) => <div key={coluna} className="coluna coluna-fantasma" />)}
      </div>
    </div>
  )
}
