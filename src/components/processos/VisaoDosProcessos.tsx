import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import {
  ehPortfolio, SEM_FILTROS, type AgruparQuadroPor, type FiltrosDosProcessos as Filtros, type MostrarNoPortfolio,
  type AgruparListaPor, type VisaoDosProcessos as Visao,
} from '../../processos/enderecoDosProcessos'
import { filtrarProcessos, opcoesDosFiltros, temFiltro, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'
import { linhasDaLista } from '../../processos/linhasDaLista'
import type { OrdenacaoDaLista } from '../../processos/ordenacaoDaLista'
import { canceladosDe, visiveisNoPortfolio } from '../../processos/portfolio'
import type { ListaDeProcessos, ModuloDeProcessos, ProcessoDaLista } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { Icone } from '../Icone'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { CabecalhoDaLista } from './CabecalhoDaLista'
import { AgruparAListaPor, AgruparPor, SoOsMeus, TodosOuConcluidos } from './ControlesDoQuadro'
import { ArvoreDaLista } from './ArvoreDaLista'
import { BotaoLimparFiltros, FiltrosDosProcessos, NenhumProcessoComFiltros, NenhumProcessoDoUsuario } from './FiltrosDosProcessos'
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
  /** Só na Lista: a tabela comum ou a árvore por macroprocesso ou por setor. */
  agruparLista: AgruparListaPor
  aoMudarAgruparLista: (agrupar: AgruparListaPor) => void
  /** Só na Lista: a coluna e o sentido da ordenação, escolhidos no cabeçalho. */
  ordenacao: OrdenacaoDaLista
  aoOrdenar: (ordenacao: OrdenacaoDaLista) => void
  /** A Lista em Concluídos com os filtros do Quadro (o "Ver na Lista" do pé da coluna Concluídos). */
  enderecoDosConcluidosNaLista: string
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
  const { visao, estado, aoTentarDeNovo, podeAlterar, aoCadastrar, filtros, aoMudarFiltros, agrupar, usuarioId } = props
  const { mostrar, aoLimparTudo } = props
  if (estado.tipo === 'carregando') return visao === 'quadro' ? <QuadroCarregando /> : <ListaCarregando />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={aoTentarDeNovo} />
  if (estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  const portfolio = ehPortfolio(visao, agrupar)
  const { filtrados, visiveis, vazio } = oQueAVisaoMostra(estado.valor.processos, filtros, portfolio, mostrar)
  const lista = { ...estado.valor, processos: filtrados }
  const opcoes = opcoesDosFiltros(estado.valor)
  return (
    <div className="quadro">
      <BarraDaVisao {...props} opcoes={opcoes} portfolio={portfolio} />
      {vazio
        ? <SemResultado filtros={filtros} usuarioId={usuarioId} aoMudarFiltros={aoMudarFiltros} aoLimparTudo={aoLimparTudo} />
        : <ConteudoDaVisao {...props} lista={lista} visiveis={visiveis} todos={estado.valor.processos} opcoes={opcoes} />}
    </div>
  )
}

type BarraDaVisaoProps = VisaoDosProcessosProps & { opcoes: OpcoesDosFiltros; portfolio: boolean }

// No Quadro, os filtros e os controles dele; na Lista, o Agrupar por e o Limpar filtros (os filtros ficam no cabeçalho da tabela).
function BarraDaVisao({ visao, opcoes, portfolio, filtros, aoMudarFiltros, mostrar, aoMudarMostrar, podeAlterar, aoCadastrar, ...props }: BarraDaVisaoProps) {
  const naLista = visao === 'lista'
  return (
    <div className={naLista ? 'quadro-barra quadro-barra-da-lista' : 'quadro-barra'}>
      {!naLista && <FiltrosDosProcessos opcoes={opcoes} filtros={filtros} aoMudar={aoMudarFiltros} />}
      {naLista && <AgruparAListaPor agrupar={props.agruparLista} aoMudar={props.aoMudarAgruparLista} />}
      {portfolio && <TodosOuConcluidos mostrar={mostrar} aoMudar={aoMudarMostrar} />}
      {naLista && temFiltro(filtros) && <BotaoLimparFiltros aoLimpar={() => aoMudarFiltros(SEM_FILTROS)} />}
      {!naLista && (
        <ControlesDoQuadroNaBarra agrupar={props.agrupar} aoMudarAgrupar={props.aoMudarAgrupar} filtros={filtros} aoMudarFiltros={aoMudarFiltros}
          usuarioId={props.usuarioId} podeAlterar={podeAlterar} />
      )}
      {podeAlterar && <BotaoCadastrar aoCadastrar={aoCadastrar} />}
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
  opcoes: OpcoesDosFiltros
}

function ConteudoDaVisao(props: ConteudoDaVisaoProps) {
  const { visao, lista, idEscolhido, enderecoDoProcesso, filtros, podeAlterar, processos, versoes, aoMudar, agrupar } = props
  if (visao === 'lista') return <ListaDosProcessos {...props} />
  return (
    <QuadroDeProcessos lista={lista} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} podeAlterar={podeAlterar}
      processos={processos} versoes={versoes} aoMudar={aoMudar} agrupar={agrupar} setorFiltrado={filtros.setor} mostrar={props.mostrar}
      enderecoDosConcluidosNaLista={props.enderecoDosConcluidosNaLista} />
  )
}

// Os cancelados seguem a mesma ordenação, no bloco do fim.
function ListaDosProcessos({ lista, visiveis, todos, idEscolhido, aoAbrir, filtros, mostrar, ordenacao, ...props }: ConteudoDaVisaoProps) {
  const cabecalho = (
    <CabecalhoDaLista opcoes={props.opcoes} filtros={filtros} mostrar={mostrar} ordenacao={ordenacao}
      aoMudarFiltros={props.aoMudarFiltros} aoOrdenar={props.aoOrdenar} />
  )
  const linhas = linhasDaLista(visiveis, todos, ordenacao)
  const cancelados = mostrar === 'todos' ? linhasDaLista(canceladosDe(lista.processos), todos, ordenacao) : []
  if (props.agruparLista !== 'nenhum') {
    return (
      <ArvoreDaLista cabecalho={cabecalho} agrupar={props.agruparLista} linhas={linhas} todos={todos} setores={lista.setores} cancelados={cancelados}
        idEscolhido={idEscolhido} aoAbrir={aoAbrir} modulo={props.versoes} />
    )
  }
  return <TabelaDeProcessos cabecalho={cabecalho} linhas={linhas} idEscolhido={idEscolhido} aoAbrir={aoAbrir} cancelados={cancelados} />
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
