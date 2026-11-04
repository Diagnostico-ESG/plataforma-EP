import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'
import {
  ehPortfolio, formaDeVer, SEM_FILTROS, type AgruparQuadroPor, type FormaDeVer, type FiltrosDosProcessos as Filtros, type MostrarNoPortfolio,
  type AgruparListaPor, type LinhasDoQuadro, type VisaoDosProcessos as Visao,
} from '../../processos/enderecoDosProcessos'
import { filtrarProcessos, opcoesDosFiltros, temFiltro, type OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'
import { linhasDaLista } from '../../processos/linhasDaLista'
import type { OrdenacaoDaLista } from '../../processos/ordenacaoDaLista'
import { visiveisNoPortfolio } from '../../processos/portfolio'
import type { ListaDeProcessos, ModuloDeProcessos, ProcessoDaLista } from '../../processos/tipos'
import type { ModuloDeVersoes } from '../../versoes/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { QuadroVazio } from '../quadro/QuadroVazio'
import { CabecalhoDaLista } from './CabecalhoDaLista'
import { AgruparAListaPor, DestacarOsMeus, LinhasDoQuadroControle, SituacaoDaVisao } from './ControlesDoQuadro'
import { ArvoreDaLista } from './ArvoreDaLista'
import { FaixaDeControles } from './FaixaDeControles'
import { BotaoDosFiltros } from './BotaoDosFiltros'
import { BotaoLimparFiltros, NenhumProcessoComFiltros, NenhumProcessoNaSituacao } from './FiltrosDosProcessos'
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
  /** "Quadro ▾": troca entre os três quadros e a Lista. */
  aoMudarFormaDeVer: (forma: FormaDeVer) => void
  /** Só na Lista e no Quadro por setor (o portfólio): todos os processos ou só os concluídos. */
  mostrar: MostrarNoPortfolio
  aoMudarMostrar: (mostrar: MostrarNoPortfolio) => void
  /** Só nos quadros: esmaece os cartões em que quem está na tela não é o responsável. Já vem desligado para a Consulta. */
  destacar: boolean
  aoMudarDestacar: (destacar: boolean) => void
  /** Só no Quadro por etapa: Nenhuma, por setor ou por responsável. */
  linhas: LinhasDoQuadro
  aoMudarLinhas: (linhas: LinhasDoQuadro) => void
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
  /** Quem está na tela, para o "Destacar os meus". */
  usuarioId: string
  /** O Quadro mudou (um cartão foi movido): a lista de processos precisa recarregar. */
  aoMudar: () => void
}

/** Quadro ou Lista, com os estados comuns (carregando, erro, vazio), a barra de cima e os filtros. */
// Carregando ou com erro, a faixa já aparece com os mesmos controles, desabilitada, e é a mesma faixa quando os dados chegam
// (nada pula nem se remonta). Sem nenhum processo cadastrado, vale só o aviso de vazio.
export function VisaoDosProcessos(props: VisaoDosProcessosProps) {
  const { estado, podeAlterar, aoCadastrar } = props
  if (estado.tipo === 'pronto' && estado.valor.processos.length === 0) return <QuadroVazio podeCadastrar={podeAlterar} aoCadastrar={aoCadastrar} />
  const opcoes = estado.tipo === 'pronto' ? opcoesDosFiltros(estado.valor) : SEM_OPCOES
  return (
    <div className="visao-dos-processos">
      <FaixaDaVisao {...props} opcoes={opcoes} portfolio={ehPortfolio(props.visao, props.agrupar)} desabilitada={estado.tipo !== 'pronto'} />
      <div className="quadro">
        <CorpoDaVisao {...props} opcoes={opcoes} />
      </div>
    </div>
  )
}

const SEM_OPCOES: OpcoesDosFiltros = { setores: [], macroprocessos: [], etapas: [], tipos: [], responsaveis: [], situacoes: [] }

function CorpoDaVisao(props: VisaoDosProcessosProps & { opcoes: OpcoesDosFiltros }) {
  const { visao, estado, filtros, aoMudarMostrar, mostrar, aoLimparTudo } = props
  if (estado.tipo === 'carregando') return visao === 'quadro' ? <QuadroCarregando /> : <TabelaCarregando agrupada={props.agruparLista !== 'nenhum'} />
  if (estado.tipo === 'erro') return <ErroAoCarregar alvo="os processos" aoTentarDeNovo={props.aoTentarDeNovo} />
  const portfolio = ehPortfolio(visao, props.agrupar)
  const { filtrados, visiveis, vazio, semNaSituacao } = oQueAVisaoMostra(estado.valor.processos, filtros, portfolio, mostrar)
  if (semNaSituacao && mostrar !== 'todos') return <NenhumProcessoNaSituacao mostrar={mostrar} aoMostrarTodos={() => aoMudarMostrar('todos')} />
  if (vazio) return <NenhumProcessoComFiltros aoLimpar={aoLimparTudo} />
  const lista = { ...estado.valor, processos: filtrados }
  return <ConteudoDaVisao {...props} lista={lista} visiveis={visiveis} todos={estado.valor.processos} />
}

type FaixaDaVisaoProps = VisaoDosProcessosProps & { opcoes: OpcoesDosFiltros; portfolio: boolean; desabilitada?: boolean }

// No Quadro, os filtros e o Destacar os meus; na Lista, o Agrupar por e o Limpar filtros (os filtros ficam no cabeçalho da tabela).
// A Situação só no portfólio (Lista e Quadro por setor).
function FaixaDaVisao({ visao, opcoes, portfolio, filtros, aoMudarFiltros, mostrar, aoMudarMostrar, desabilitada = false, ...props }: FaixaDaVisaoProps) {
  const naLista = visao === 'lista'
  return (
    <FaixaDeControles forma={formaDeVer({ visao, agrupar: props.agrupar })} aoEscolherForma={props.aoMudarFormaDeVer}
      podeCadastrar={props.podeAlterar} aoCadastrar={props.aoCadastrar} desabilitada={desabilitada}
      linhas={<LinhasDaFaixa visao={visao} agrupar={props.agrupar} linhas={props.linhas} aoMudar={props.aoMudarLinhas} />}>
      {!naLista && <BotaoDosFiltros opcoes={opcoes} filtros={filtros} aoMudar={aoMudarFiltros} />}
      {!naLista && props.podeAlterar && <DestacarOsMeus ligado={props.destacar} aoAlternar={() => props.aoMudarDestacar(!props.destacar)} />}
      {naLista && <AgruparAListaPor agrupar={props.agruparLista} aoMudar={props.aoMudarAgruparLista} />}
      {portfolio && <SituacaoDaVisao mostrar={mostrar} aoMudar={aoMudarMostrar} />}
      {naLista && temFiltro(filtros) && <BotaoLimparFiltros aoLimpar={() => aoMudarFiltros(SEM_FILTROS)} />}
    </FaixaDeControles>
  )
}

// Linhas só no Quadro por etapa.
function LinhasDaFaixa({ visao, agrupar, linhas, aoMudar }: { visao: Visao; agrupar: AgruparQuadroPor; linhas: LinhasDoQuadro; aoMudar: (linhas: LinhasDoQuadro) => void }) {
  if (visao !== 'quadro' || agrupar !== 'etapa') return null
  return <LinhasDoQuadroControle linhas={linhas} aoMudar={aoMudar} />
}

// Os processos depois dos filtros e, no portfólio, depois da Situação. Uma situação sem nenhum processo (semNaSituacao, contada antes
// dos filtros) tem a frase própria; com filtros que escondem os que existem, vale a frase dos filtros.
function oQueAVisaoMostra(processos: ProcessoDaLista[], filtros: Filtros, portfolio: boolean, mostrar: MostrarNoPortfolio) {
  const filtrados = filtrarProcessos(processos, filtros)
  const visiveis = portfolio ? visiveisNoPortfolio(filtrados, mostrar) : filtrados
  const semNaSituacao = portfolio && mostrar !== 'todos' && visiveisNoPortfolio(processos, mostrar).length === 0
  const vazio = visiveis.length === 0 && (temFiltro(filtros) || (portfolio && mostrar !== 'todos'))
  return { filtrados, visiveis, vazio, semNaSituacao }
}

type ConteudoDaVisaoProps = VisaoDosProcessosProps & {
  lista: ListaDeProcessos; todos: ListaDeProcessos['processos']
  /** O que o portfólio (a Lista) mostra depois da Situação. */
  visiveis: ListaDeProcessos['processos']
  opcoes: OpcoesDosFiltros
}

function ConteudoDaVisao(props: ConteudoDaVisaoProps) {
  const { visao, lista, idEscolhido, enderecoDoProcesso, filtros, podeAlterar, processos, versoes, aoMudar, agrupar } = props
  if (visao === 'lista') return <ListaDosProcessos {...props} />
  return (
    <QuadroDeProcessos lista={lista} idEscolhido={idEscolhido} enderecoDoProcesso={enderecoDoProcesso} podeAlterar={podeAlterar}
      processos={processos} versoes={versoes} aoMudar={aoMudar} agrupar={agrupar} setorFiltrado={filtros.setor} mostrar={props.mostrar}
      destacarDe={props.destacar ? props.usuarioId : null} linhas={props.linhas} usuarioId={props.usuarioId}
      enderecoDosConcluidosNaLista={props.enderecoDosConcluidosNaLista} />
  )
}

function ListaDosProcessos({ lista, visiveis, todos, idEscolhido, aoAbrir, filtros, mostrar, ordenacao, ...props }: ConteudoDaVisaoProps) {
  const cabecalho = (
    <CabecalhoDaLista opcoes={props.opcoes} filtros={filtros} mostrar={mostrar} ordenacao={ordenacao}
      aoMudarFiltros={props.aoMudarFiltros} aoOrdenar={props.aoOrdenar} agrupada={props.agruparLista !== 'nenhum'} />
  )
  const linhas = linhasDaLista(visiveis, todos, ordenacao)
  if (props.agruparLista !== 'nenhum') {
    return (
      <ArvoreDaLista cabecalho={cabecalho} agrupar={props.agruparLista} linhas={linhas} todos={todos} setores={lista.setores}
        idEscolhido={idEscolhido} aoAbrir={aoAbrir} modulo={props.versoes} />
    )
  }
  return <TabelaDeProcessos cabecalho={cabecalho} linhas={linhas} idEscolhido={idEscolhido} aoAbrir={aoAbrir} />
}
