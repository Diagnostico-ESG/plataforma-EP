import type { SituacaoDoProcesso, TipoDeProcesso } from './tipos'

export type VisaoDosProcessos = 'quadro' | 'lista'

export type FiltrosDosProcessos = {
  setor: string | null
  macroprocesso: string | null
  /** O código da etapa atual. */
  etapa: string | null
  tipo: TipoDeProcesso | null
  responsavel: string | null
  /** Só na Lista: o Quadro mostra apenas os vivos. */
  situacao: SituacaoDoProcesso | null
  /** Só na Lista: trecho do nome do processo. */
  busca: string | null
}

export type AgruparQuadroPor = 'etapa' | 'responsavel' | 'setor'

/** Todos (em andamento, suspensos e concluídos) ou só os concluídos; vale na Lista e no Quadro por setor (o portfólio). */
export type MostrarNoPortfolio = 'todos' | 'concluidos'

// O Record obriga a listar cada agrupamento: um novo em AgruparQuadroPor sem entrada aqui não compila.
const AGRUPAMENTOS: Record<AgruparQuadroPor, true> = { etapa: true, responsavel: true, setor: true }

function ehAgrupamento(lido: string): lido is AgruparQuadroPor {
  return Object.hasOwn(AGRUPAMENTOS, lido)
}

/**
 * aberto: o id do processo no painel, 'novo' no cadastro, null sem painel.
 * agrupar e mostrar ficam fora dos filtros para o [Limpar filtros] não os desligar; agrupar só vale no Quadro, e mostrar só
 * na Lista e no Quadro por setor.
 */
export type EnderecoDosProcessos = {
  visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos; agrupar: AgruparQuadroPor
  mostrar: MostrarNoPortfolio
}

/** Quem monta o endereço pode omitir mostrar: vale Todos. */
type EnderecoParaMontar = Omit<EnderecoDosProcessos, 'mostrar'> & { mostrar?: MostrarNoPortfolio }

/** Lista e Quadro por setor são o portfólio: só neles Todos | Concluídos existe. */
export function ehPortfolio(visao: VisaoDosProcessos, agrupar: AgruparQuadroPor): boolean {
  return visao === 'lista' || agrupar === 'setor'
}

export const SEM_FILTROS: FiltrosDosProcessos = {
  setor: null, macroprocesso: null, etapa: null, tipo: null, responsavel: null, situacao: null, busca: null,
}

// A ordem fixa deixa o mesmo filtro sempre com o mesmo endereço, para recarregar ou compartilhar.
const NOMES_DOS_FILTROS = ['setor', 'macroprocesso', 'etapa', 'tipo', 'responsavel', 'situacao', 'busca'] as const
const SO_DA_LISTA = new Set<string>(['situacao', 'busca'])
const TIPOS = new Set<string>(['processo', 'subprocesso', 'a_classificar'])
// O cancelado não é uma opção da Lista: ele só aparece pelo "Mostrar cancelados".
const SITUACOES = new Set<string>(['em_andamento', 'suspenso', 'concluido'])

/** #/processos[/lista][/<id> | /novo][?filtros] */
export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos {
  const [caminho, consulta = ''] = endereco.split('?')
  const trechos = caminho.split('/').slice(2)
  const visao: VisaoDosProcessos = trechos[0] === 'lista' ? 'lista' : 'quadro'
  const aberto = (visao === 'lista' ? trechos[1] : trechos[0]) || null
  const parametros = new URLSearchParams(consulta)
  const lido = parametros.get('agrupar') ?? ''
  const agrupar = visao === 'quadro' && ehAgrupamento(lido) ? lido : 'etapa'
  const mostrar = ehPortfolio(visao, agrupar) && parametros.get('mostrar') === 'concluidos' ? 'concluidos' : 'todos'
  return { visao, aberto, filtros: filtrosDaConsulta(parametros, visao, mostrar), agrupar, mostrar }
}

function filtrosDaConsulta(consulta: URLSearchParams, visao: VisaoDosProcessos, mostrar: MostrarNoPortfolio): FiltrosDosProcessos {
  const valor = (nome: string): string | null => consulta.get(nome) || null
  const conhecido = (nome: string, validos: Set<string>): string | null => {
    const lido = valor(nome)
    return lido !== null && validos.has(lido) ? lido : null
  }
  return {
    setor: valor('setor'), macroprocesso: valor('macroprocesso'), etapa: etapaDaConsulta(valor('etapa')),
    tipo: conhecido('tipo', TIPOS) as TipoDeProcesso | null, responsavel: valor('responsavel'),
    situacao: visao === 'lista' && mostrar === 'todos' ? conhecido('situacao', SITUACOES) as SituacaoDoProcesso | null : null,
    busca: visao === 'lista' ? valor('busca') : null,
  }
}

// "aguardando-o-setor" saiu com as etapas do setor (ADR 0013): o endereço antigo vale como sem filtro de etapa.
function etapaDaConsulta(lida: string | null): string | null {
  return lida === 'aguardando-o-setor' ? null : lida
}

// Fora da Lista não há situação nem busca; com "Concluídos" a situação não tem o que filtrar.
function valorDoFiltroNoEndereco(
  nome: (typeof NOMES_DOS_FILTROS)[number], filtros: FiltrosDosProcessos, visao: VisaoDosProcessos, mostrar: MostrarNoPortfolio,
): string | null {
  if (SO_DA_LISTA.has(nome) && visao === 'quadro') return null
  if (nome === 'situacao' && mostrar === 'concluidos') return null
  return filtros[nome]
}

export function montarEnderecoDosProcessos({ visao, aberto, filtros, agrupar, mostrar = 'todos' }: EnderecoParaMontar): string {
  const trechos = ['#/processos', visao === 'lista' ? 'lista' : null, aberto].filter((trecho) => trecho !== null)
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    const valor = valorDoFiltroNoEndereco(nome, filtros, visao, mostrar)
    if (valor) consulta.set(nome, valor)
  }
  if (visao === 'quadro' && agrupar !== 'etapa') consulta.set('agrupar', agrupar)
  if (mostrar === 'concluidos' && ehPortfolio(visao, agrupar)) consulta.set('mostrar', 'concluidos')
  const texto = consulta.toString()
  return trechos.join('/') + (texto ? `?${texto}` : '')
}
