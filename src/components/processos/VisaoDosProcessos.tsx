import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import {
  ehPortfolio, SEM_FILTROS, type AgruparQuadroPor, type FiltrosDosProcessos as Filtros, type MostrarNoPortfolio,
  type VisaoDosProcessos as Visao,
} from '../../processos/enderecoDosProcessos'
import { filtrarProcessos, opcoesDosFiltros, temFiltro } from '../../processos/filtrosDosProcessos'
import { linhasDaLista } from '../../processos/linhasDaLista'
import { canceladosDe, visiveisNoPortfolio } from '../../processos/portfolio'
import type { ListaDeProcessos, ModuloDeProcessos, ProcessoDaLista } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { AgruparPor, SoOsMeus, TodosOuConcluidos } from './ControlesDoQuadro'
import { FiltrosDosProcessos, NenhumProcessoComFiltros, NenhumProcessoDoUsuario } from './FiltrosDosProcessos'
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
  /** Só na Lista e no Quadro por setor (o portfólio): todos os processos ou só os concluídos. */
  mostrar: MostrarNoPortfolio
  aoMudarMostrar: (mostrar: MostrarNoPortfolio) => void
  /** Sem filtros e de volta a Todos, de uma vez só (o endereço muda uma vez). */
  aoLimparTudo: () => void
  processos: ModuloDeProcessos
  /** A janela da trava de arquivos, no Quadro, envia as versões e o relatório. */
  versoes: ModuloDeVersoes
  /** Quem está na tela, para o "Só os meus". */
  usuarioId: string
  /** O Quadro mudou (um cartão foi movido): a lista de processos precisa recarregar. */
  aoMudar: () => void
}

/** Quadro ou Lista, com os estados comuns (carregando, erro, vazio), a barra de cima e os filtros. */
export function VisaoDosProcessos(props: VisaoDosProcessosProps) {
  const { visao, estado, aoTentarDeNovo, podeAlterar, aoCadastrar, filtros, aoMudarFiltros, agrupar, aoMudarAgrupar, usuarioId } = props
  const { mostrar, aoMudarMostrar, aoLimparTudo } = props
  if (estado.tipo === 'carregando') return visao === 'quadro' ? <QuadroCarregando /> : <ListaCarregando />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  const portfolio = ehPortfolio(visao, agrupar)
  const { filtrados, visiveis, vazio } = oQueAVisaoMostra(estado.valor.processos, filtros, portfolio, mostrar)
  const lista = { ...estado.valor, processos: filtrados }
  return (
    <div className="quadro">
      <div className="quadro-barra">
        <FiltrosDosProcessos visao={visao} opcoes={opcoesDosFiltros(estado.valor)} filtros={filtros} mostrar={mostrar} aoMudar={aoMudarFiltros} />
        {portfolio && <TodosOuConcluidos mostrar={mostrar} aoMudar={aoMudarMostrar} />}
        {visao === 'quadro' && (
          <ControlesDoQuadroNaBarra agrupar={agrupar} aoMudarAgrupar={aoMudarAgrupar} filtros={filtros} aoMudarFiltros={aoMudarFiltros}
            usuarioId={usuarioId} podeAlterar={podeAlterar} />
        )}
        {podeAlterar && <BotaoCadastrar aoCadastrar={aoCadastrar} />}
      </div>
      {vazio
        ? <SemResultado filtros={filtros} usuarioId={usuarioId} aoMudarFiltros={aoMudarFiltros} aoLimparTudo={aoLimparTudo} />
        : <ConteudoDaVisao {...props} lista={lista} visiveis={visiveis} todos={estado.valor.processos} />}
    </div>
  )
}

// Os processos depois dos filtros e, no portfólio, depois de Todos | Concluídos. "Concluídos" sem nenhum concluído também é um
// resultado vazio por escolha (e o Limpar filtros volta a Todos).
function oQueAVisaoMostra(processos: ProcessoDaLista[], filtros: Filtros, portfolio: boolean, mostrar: MostrarNoPortfolio) {
  const filtrados = filtrarProcessos(processos, filtros)
  const visiveis = portfolio ? visiveisNoPortfolio(filtrados, mostrar) : filtrados
  const vazio = visiveis.length === 0 && (temFiltro(filtros) || (portfolio && mostrar === 'concluidos'))
  return { filtrados, visiveis, vazio }
}

type ControlesNaBarraProps = {
  agrupar: AgruparQuadroPor; aoMudarAgrupar: (agrupar: AgruparQuadroPor) => void
  filtros: Filtros; aoMudarFiltros: (filtros: Filtros) => void; usuarioId: string; podeAlterar: boolean
}

// "Só os meus" é o filtro Responsável com o próprio id (o responsável do processo); a Consulta não tem o botão (ela não é responsável).
function ControlesDoQuadroNaBarra({ agrupar, aoMudarAgrupar, filtros, aoMudarFiltros, usuarioId, podeAlterar }: ControlesNaBarraProps) {
  const ligado = filtros.responsavel === usuarioId
  return (
    <>
      <AgruparPor agrupar={agrupar} aoMudar={aoMudarAgrupar} />
      {podeAlterar && <SoOsMeus ligado={ligado} aoAlternar={() => aoMudarFiltros({ ...filtros, responsavel: ligado ? null : usuarioId })} />}
    </>
  )
}

type SemResultadoProps = { filtros: Filtros; usuarioId: string; aoMudarFiltros: (filtros: Filtros) => void; aoLimparTudo: () => void }

// Só o "Só os meus" ligado (sem outro filtro) tem a mensagem própria; com outros filtros vale a dos filtros.
function SemResultado({ filtros, usuarioId, aoMudarFiltros, aoLimparTudo }: SemResultadoProps) {
  const soOsMeus = filtros.responsavel === usuarioId && !temFiltro({ ...filtros, responsavel: null })
  if (soOsMeus) return <NenhumProcessoDoUsuario aoVerTodos={() => aoMudarFiltros(SEM_FILTROS)} />
  return <NenhumProcessoComFiltros aoLimpar={aoLimparTudo} />
}

type ConteudoDaVisaoProps = VisaoDosProcessosProps & {
  lista: ListaDeProcessos; todos: ListaDeProcessos['processos']
  /** O que o portfólio (a Lista) mostra depois de Todos | Concluídos e sem os cancelados. */
  visiveis: ListaDeProcessos['processos']
}

function ConteudoDaVisao(props: ConteudoDaVisaoProps) {
  const { visao, lista, visiveis, todos, idEscolhido, enderecoDoProcesso, aoAbrir, filtros, podeAlterar, processos, versoes, aoMudar, agrupar } = props
  if (visao === 'quadro') {
    return (
      <QuadroDeProcessos lista={lista} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} podeAlterar={podeAlterar}
        processos={processos} versoes={versoes} aoMudar={aoMudar} agrupar={agrupar} setorFiltrado={filtros.setor} mostrar={props.mostrar} />
    )
  }
  return (
    <TabelaDeProcessos linhas={linhasDaLista(visiveis, todos)} idEscolhido={idEscolhido} aoAbrir={aoAbrir} busca={filtros.busca}
      cancelados={props.mostrar === 'todos' ? linhasDaLista(canceladosDe(lista.processos), todos) : []} />
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
