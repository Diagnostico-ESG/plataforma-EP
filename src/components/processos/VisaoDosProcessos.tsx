import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import {
  SEM_FILTROS, type AgruparQuadroPor, type FiltrosDosProcessos as Filtros, type VisaoDosProcessos as Visao,
} from '../../processos/enderecoDosProcessos'
import { filtrarProcessos, opcoesDosFiltros, temFiltro } from '../../processos/filtrosDosProcessos'
import { linhasDaLista } from '../../processos/linhasDaLista'
import type { ListaDeProcessos, ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { AgruparPor } from './ControlesDoQuadro'
import { FiltrosDosProcessos, NenhumProcessoComFiltros } from './FiltrosDosProcessos'
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
  filtros: Filtros
  aoMudarFiltros: (filtros: Filtros) => void
  /** Só no Quadro: uma coluna por etapa ou por responsável. */
  agrupar: AgruparQuadroPor
  aoMudarAgrupar: (agrupar: AgruparQuadroPor) => void
  processos: ModuloDeProcessos
  /** Quem está na tela, para a janela de avanço do arrastar o marcar como responsável. */
  usuarioId: string
  /** O Quadro mudou (um cartão foi concluído): a lista de processos precisa recarregar. */
  aoMudar: () => void
}

/** Quadro ou Lista, com os estados comuns (carregando, erro, vazio), a barra de cima e os filtros. */
export function VisaoDosProcessos(props: VisaoDosProcessosProps) {
  const { visao, estado, aoTentarDeNovo, podeAlterar, aoCadastrar, filtros, aoMudarFiltros, agrupar, aoMudarAgrupar } = props
  if (estado.tipo === 'carregando') return visao === 'quadro' ? <QuadroCarregando /> : <ListaCarregando />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  const lista = { ...estado.valor, processos: filtrarProcessos(estado.valor.processos, filtros) }
  return (
    <div className="quadro">
      <div className="quadro-barra">
        <FiltrosDosProcessos visao={visao} opcoes={opcoesDosFiltros(estado.valor)} filtros={filtros} aoMudar={aoMudarFiltros} />
        {visao === 'quadro' && <AgruparPor agrupar={agrupar} aoMudar={aoMudarAgrupar} />}
        {podeAlterar && <BotaoCadastrar aoCadastrar={aoCadastrar} />}
      </div>
      {lista.processos.length === 0 && temFiltro(filtros)
        ? <NenhumProcessoComFiltros aoLimpar={() => aoMudarFiltros(SEM_FILTROS)} />
        : <ConteudoDaVisao {...props} lista={lista} todos={estado.valor.processos} />}
    </div>
  )
}

type ConteudoDaVisaoProps = VisaoDosProcessosProps & { lista: ListaDeProcessos; todos: ListaDeProcessos['processos'] }

function ConteudoDaVisao(props: ConteudoDaVisaoProps) {
  const { visao, lista, todos, idEscolhido, enderecoDoProcesso, aoAbrir, filtros, podeAlterar, processos, usuarioId, aoMudar, agrupar } = props
  if (visao === 'quadro') {
    return (
      <QuadroDeProcessos lista={lista} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} podeAlterar={podeAlterar}
        processos={processos} usuarioId={usuarioId} aoMudar={aoMudar} agrupar={agrupar} />
    )
  }
  return (
    <TabelaDeProcessos linhas={linhasDaLista(lista.processos, todos)} idEscolhido={idEscolhido} aoAbrir={aoAbrir} busca={filtros.busca} />
  )
}

function BotaoCadastrar({ aoCadastrar }: { aoCadastrar: () => void }) {
  return (
    <button type="button" className="botao botao-principal" onClick={aoCadastrar}>
      <Icone nome="mais" tamanho={16} />
      Cadastrar processo
    </button>
  )
}

function ListaCarregando() {
  return <div className="quadro"><TabelaCarregando /></div>
}
