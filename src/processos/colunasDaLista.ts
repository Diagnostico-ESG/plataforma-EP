import type { FiltrosDosProcessos } from './enderecoDosProcessos'
import type { OpcoesDosFiltros } from './filtrosDosProcessos'
import type { ColunaDaLista } from './ordenacaoDaLista'

export type ColunaDoCabecalho = {
  coluna: ColunaDaLista
  rotulo: string
  /** O filtro da coluna, com as opções e o "Todos"; Processo não filtra (a busca faz esse papel). */
  filtro: { nome: keyof FiltrosDosProcessos; opcoes: keyof OpcoesDosFiltros; todos: string } | null
}

/** As colunas da Lista, na ordem da tabela. */
export const COLUNAS_DA_LISTA: ColunaDoCabecalho[] = [
  { coluna: 'processo', rotulo: 'Processo', filtro: null },
  { coluna: 'tipo', rotulo: 'Tipo', filtro: { nome: 'tipo', opcoes: 'tipos', todos: 'Todos' } },
  { coluna: 'setor', rotulo: 'Setor', filtro: { nome: 'setor', opcoes: 'setores', todos: 'Todos' } },
  { coluna: 'macroprocesso', rotulo: 'Macroprocesso', filtro: { nome: 'macroprocesso', opcoes: 'macroprocessos', todos: 'Todos' } },
  { coluna: 'etapa', rotulo: 'Etapa atual', filtro: { nome: 'etapa', opcoes: 'etapas', todos: 'Todas' } },
  { coluna: 'responsavel', rotulo: 'Responsável', filtro: { nome: 'responsavel', opcoes: 'responsaveis', todos: 'Todos' } },
  { coluna: 'situacao', rotulo: 'Situação', filtro: { nome: 'situacao', opcoes: 'situacoes', todos: 'Todas' } },
]
