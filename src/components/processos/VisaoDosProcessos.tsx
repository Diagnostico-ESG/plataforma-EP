import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import type { VisaoDosProcessos as Visao } from '../../processos/enderecoDosProcessos'
import { linhasDaLista } from '../../processos/linhasDaLista'
import type { ListaDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { QuadroCarregando, QuadroDeProcessos } from './QuadroDeProcessos'
import { TabelaCarregando, TabelaDeProcessos } from './TabelaDeProcessos'

type VisaoDosProcessosProps = {
  visao: Visao
  estado: EstadoDoCarregamento<ListaDeProcessos>
  aoTentarDeNovo: () => void
  podeAlterar: boolean
  aoCadastrar: () => void
  idEscolhido: string | null
  enderecoDoProcesso: (id: string) => string
  aoAbrir: (id: string) => void
}

/** Quadro ou Lista, com os estados comuns (carregando, erro, vazio) e a barra de cima. */
export function VisaoDosProcessos(props: VisaoDosProcessosProps) {
  const { visao, estado, aoTentarDeNovo, podeAlterar, aoCadastrar } = props
  if (estado.tipo === 'carregando') return visao === 'quadro' ? <QuadroCarregando /> : <ListaCarregando />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  return (
    <div className="quadro">
      {podeAlterar && <BarraDosProcessos aoCadastrar={aoCadastrar} />}
      <ConteudoDaVisao {...props} lista={estado.valor} />
    </div>
  )
}

function ConteudoDaVisao({ visao, lista, idEscolhido, enderecoDoProcesso, aoAbrir }: VisaoDosProcessosProps & { lista: ListaDeProcessos }) {
  if (visao === 'quadro') {
    return <QuadroDeProcessos lista={lista} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} />
  }
  return <TabelaDeProcessos linhas={linhasDaLista(lista.processos)} idEscolhido={idEscolhido} aoAbrir={aoAbrir} />
}

function BarraDosProcessos({ aoCadastrar }: { aoCadastrar: () => void }) {
  return (
    <div className="quadro-barra">
      <button type="button" className="botao botao-principal" onClick={aoCadastrar}>
        <Icone nome="mais" tamanho={16} />
        Cadastrar processo
      </button>
    </div>
  )
}

function ListaCarregando() {
  return <div className="quadro"><TabelaCarregando /></div>
}
