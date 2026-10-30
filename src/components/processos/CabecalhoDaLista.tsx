import { COLUNAS_DA_LISTA, type ColunaDoCabecalho } from '../../processos/colunasDaLista'
import type { FiltrosDosProcessos as Filtros, MostrarNoPortfolio } from '../../processos/enderecoDosProcessos'
import type { OpcaoDoFiltro, OpcoesDosFiltros } from '../../processos/filtrosDosProcessos'
import type { ColunaDaLista, OrdenacaoDaLista, SentidoDaOrdem } from '../../processos/ordenacaoDaLista'
import { type ItemDoMenu, MenuDeAcoes } from '../MenuDeAcoes'

// As primeiras colunas abrem o menu para a direita, para ele não sair pela borda esquerda da tela; as últimas, para a esquerda.
const ABREM_PARA_DIREITA = 4

type CabecalhoDaListaProps = {
  opcoes: OpcoesDosFiltros
  filtros: Filtros
  /** Com "Concluídos", a Situação não tem o que filtrar e só ordena. */
  mostrar: MostrarNoPortfolio
  ordenacao: OrdenacaoDaLista
  aoMudarFiltros: (filtros: Filtros) => void
  aoOrdenar: (ordenacao: OrdenacaoDaLista) => void
}

/** O cabeçalho da Lista: cada coluna é um botão com o menu de ordenação e (menos Processo) de filtro, como numa planilha. */
export function CabecalhoDaLista(props: CabecalhoDaListaProps) {
  return (
    <thead>
      <tr>
        {COLUNAS_DA_LISTA.map((coluna, indice) => (
          <CelulaDoCabecalho key={coluna.coluna} {...props} coluna={coluna} paraDireita={indice < ABREM_PARA_DIREITA} />
        ))}
      </tr>
    </thead>
  )
}

/** O cabeçalho sem menus, enquanto a Lista carrega (ainda não há opções de filtro). */
export function CabecalhoCarregando() {
  return (
    <thead>
      <tr>{COLUNAS_DA_LISTA.map(({ coluna, rotulo }) => <th key={coluna} scope="col">{rotulo}</th>)}</tr>
    </thead>
  )
}

type CelulaProps = CabecalhoDaListaProps & { coluna: ColunaDoCabecalho; paraDireita: boolean }

function CelulaDoCabecalho({ coluna, paraDireita, ordenacao, ...props }: CelulaProps) {
  const sentido = ordenacao.coluna === coluna.coluna ? ordenacao.sentido : null
  const filtro = filtroDaColuna(coluna, props)
  const grupos = [itensDeOrdenar(coluna.coluna, sentido, props.aoOrdenar), ...(filtro ? [filtro.itens] : [])]
  return (
    <th scope="col" aria-sort={sentido ? ARIA_SORT[sentido] : undefined}>
      <MenuDeAcoes rotulo={`Coluna ${coluna.rotulo}`} grupos={grupos} paraDireita={paraDireita} classeDoBotao="cabecalho-da-lista-botao"
        conteudoDoBotao={<ConteudoDoBotao rotulo={coluna.rotulo} sentido={sentido} filtrado={filtro?.escolhido ?? null} />} />
    </th>
  )
}

const ARIA_SORT: Record<SentidoDaOrdem, 'ascending' | 'descending'> = { crescente: 'ascending', decrescente: 'descending' }

function itensDeOrdenar(coluna: ColunaDaLista, sentido: SentidoDaOrdem | null, aoOrdenar: (ordenacao: OrdenacaoDaLista) => void): ItemDoMenu[] {
  const item = (alvo: SentidoDaOrdem, rotulo: string) => ({ rotulo, marcado: sentido === alvo, aoEscolher: () => aoOrdenar({ coluna, sentido: alvo }) })
  return [item('crescente', 'Crescente'), item('decrescente', 'Decrescente')]
}

type FiltroDaColuna = { itens: ItemDoMenu[]; escolhido: string | null }

// O filtro da coluna: "Todos" e as opções, com o valor escolhido marcado; null quando a coluna não filtra.
function filtroDaColuna({ filtro }: ColunaDoCabecalho, { opcoes, filtros, mostrar, aoMudarFiltros }: Omit<CabecalhoDaListaProps, 'ordenacao'>): FiltroDaColuna | null {
  if (!filtro || (filtro.nome === 'situacao' && mostrar === 'concluidos')) return null
  const valor = filtros[filtro.nome]
  const escolher = (novo: string | null) => () => aoMudarFiltros({ ...filtros, [filtro.nome]: novo } as Filtros)
  const daOpcao = (opcao: OpcaoDoFiltro) => ({ rotulo: opcao.rotulo, marcado: valor === opcao.valor, aoEscolher: escolher(opcao.valor) })
  const itens = [{ rotulo: filtro.todos, marcado: valor === null, aoEscolher: escolher(null) }, ...opcoes[filtro.opcoes].map(daOpcao)]
  return { itens, escolhido: opcoes[filtro.opcoes].find((opcao) => opcao.valor === valor)?.rotulo ?? null }
}

// ▾ avisa que a coluna abre o menu de ordenar e filtrar; a coluna que ordena a Lista troca por ▲ ou ▼.
const MARCA_DA_ORDEM = { nenhum: '▾', crescente: '▲', decrescente: '▼' }

type ConteudoDoBotaoProps = { rotulo: string; sentido: SentidoDaOrdem | null; filtrado: string | null }

// As marcas (▾ ▲ ▼ e o ponto do filtro) são para quem vê; o leitor de tela ouve o texto oculto, que começa por vírgula para o
// nome do botão ficar "Setor, filtrado: TSB, ordem crescente".
function ConteudoDoBotao({ rotulo, sentido, filtrado }: ConteudoDoBotaoProps) {
  return (
    <>
      {rotulo}
      {filtrado && <span className="cabecalho-da-lista-filtrado" aria-hidden="true" />}
      <span className="cabecalho-da-lista-sentido" aria-hidden="true">{MARCA_DA_ORDEM[sentido ?? 'nenhum']}</span>
      {filtrado && <span className="visualmente-oculto">, filtrado: {filtrado}</span>}
      {sentido && <span className="visualmente-oculto">, ordem {sentido}</span>}
    </>
  )
}
