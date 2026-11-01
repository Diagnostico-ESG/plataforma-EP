import { ORDENACAO_PADRAO, type ColunaDaLista, type OrdenacaoDaLista } from './ordenacaoDaLista'
import type { SituacaoDoProcesso, TipoDeProcesso } from './tipos'

export type VisaoDosProcessos = 'quadro' | 'lista'

/** Só na Lista: a tabela comum ou a árvore por macroprocesso ou por setor. */
export type AgruparListaPor = 'nenhum' | 'macroprocesso' | 'setor'

export type FiltrosDosProcessos = {
  setor: string | null
  macroprocesso: string | null
  /** O código da etapa atual. */
  etapa: string | null
  tipo: TipoDeProcesso | null
  responsavel: string | null
  /** Só na Lista: o Quadro mostra apenas os vivos. */
  situacao: SituacaoDoProcesso | null
}

export type AgruparQuadroPor = 'etapa' | 'responsavel' | 'setor'

/** Só no Quadro por etapa: separa o quadro em faixas por setor ou por responsável, mantendo as colunas das etapas. */
export type LinhasDoQuadro = 'nenhuma' | 'setor' | 'responsavel'

/** A Situação: Todos (sem os cancelados) ou uma só; vale na Lista e no Quadro por setor (o portfólio). */
export type MostrarNoPortfolio = 'todos' | 'em_andamento' | 'suspensos' | 'concluidos' | 'cancelados'

const SITUACOES_DO_PORTFOLIO = new Set<string>(['todos', 'em_andamento', 'suspensos', 'concluidos', 'cancelados'])

// O Record obriga a listar cada agrupamento: um novo em AgruparQuadroPor sem entrada aqui não compila.
const AGRUPAMENTOS: Record<AgruparQuadroPor, true> = { etapa: true, responsavel: true, setor: true }

function ehAgrupamento(lido: string): lido is AgruparQuadroPor {
  return Object.hasOwn(AGRUPAMENTOS, lido)
}

/**
 * aberto: o id do processo no painel, 'novo' no cadastro, null sem painel.
 * agrupar, mostrar, destacar e ordenacao ficam fora dos filtros para o [Limpar filtros] não os desligar; agrupar só vale no Quadro,
 * mostrar só na Lista e no Quadro por setor, destacar só nos quadros, e ordenacao só na Lista.
 */
export type EnderecoDosProcessos = {
  visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos; agrupar: AgruparQuadroPor
  mostrar: MostrarNoPortfolio; destacar: boolean; linhas: LinhasDoQuadro; ordenacao: OrdenacaoDaLista; agruparLista: AgruparListaPor
}

/** Quem monta o endereço pode omitir mostrar (vale Todos), destacar (desligado), linhas (Nenhuma), ordenacao (vale a padrão) e agruparLista (vale Nenhum). */
type EnderecoParaMontar = Omit<EnderecoDosProcessos, 'mostrar' | 'destacar' | 'linhas' | 'ordenacao' | 'agruparLista'> & {
  mostrar?: MostrarNoPortfolio; destacar?: boolean; linhas?: LinhasDoQuadro; ordenacao?: OrdenacaoDaLista; agruparLista?: AgruparListaPor
}

/** Lista e Quadro por setor são o portfólio: só neles o controle Situação existe. */
export function ehPortfolio(visao: VisaoDosProcessos, agrupar: AgruparQuadroPor): boolean {
  return visao === 'lista' || agrupar === 'setor'
}

export const SEM_FILTROS: FiltrosDosProcessos = {
  setor: null, macroprocesso: null, etapa: null, tipo: null, responsavel: null, situacao: null,
}

// A ordem fixa deixa o mesmo filtro sempre com o mesmo endereço, para recarregar ou compartilhar.
const NOMES_DOS_FILTROS = ['setor', 'macroprocesso', 'etapa', 'tipo', 'responsavel', 'situacao'] as const
const TIPOS = new Set<string>(['processo', 'subprocesso', 'a_classificar'])
// O cancelado não é uma opção do filtro do cabeçalho: ele só aparece pela Situação "Cancelados".
const SITUACOES = new Set<string>(['em_andamento', 'suspenso', 'concluido'])
const COLUNAS = new Set<string>(['processo', 'tipo', 'setor', 'macroprocesso', 'etapa', 'responsavel', 'situacao'])

/** #/processos[/lista][/<id> | /novo][?filtros] */
export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos {
  const [caminho, consulta = ''] = endereco.split('?')
  const trechos = caminho.split('/').slice(2)
  const visao: VisaoDosProcessos = trechos[0] === 'lista' ? 'lista' : 'quadro'
  const aberto = (visao === 'lista' ? trechos[1] : trechos[0]) || null
  const parametros = new URLSearchParams(consulta)
  const lido = parametros.get('agrupar') ?? ''
  const agrupar = visao === 'quadro' && ehAgrupamento(lido) ? lido : 'etapa'
  const mostrar = situacaoDaConsulta(parametros.get('mostrar') ?? '', ehPortfolio(visao, agrupar))
  const destacar = destacarDaConsulta(parametros, visao)
  const linhas = linhasDaConsulta(parametros.get('linhas') ?? '', visao, agrupar)
  const ordenacao = ordenacaoDaConsulta(parametros, visao)
  const agruparLista = agruparDaLista(visao, lido)
  return { visao, aberto, filtros: filtrosDaConsulta(parametros, visao, mostrar), agrupar, mostrar, destacar, linhas, ordenacao, agruparLista }
}

function destacarDaConsulta(parametros: URLSearchParams, visao: VisaoDosProcessos): boolean {
  return visao === 'quadro' && parametros.has('destacar')
}

// As Linhas só existem no Quadro por etapa; valor desconhecido vale Nenhuma.
function linhasDaConsulta(lida: string, visao: VisaoDosProcessos, agrupar: AgruparQuadroPor): LinhasDoQuadro {
  return visao === 'quadro' && agrupar === 'etapa' && (lida === 'setor' || lida === 'responsavel') ? lida : 'nenhuma'
}

// Fora do portfólio, ou com valor desconhecido (inclusive o singular errado), vale Todos.
function situacaoDaConsulta(lida: string, portfolio: boolean): MostrarNoPortfolio {
  return portfolio && SITUACOES_DO_PORTFOLIO.has(lida) ? lida as MostrarNoPortfolio : 'todos'
}

// Na Lista a chave `agrupar` é a da árvore; no Quadro, a de etapa, responsável e setor.
function agruparDaLista(visao: VisaoDosProcessos, lido: string): AgruparListaPor {
  return visao === 'lista' && (lido === 'macroprocesso' || lido === 'setor') ? lido : 'nenhum'
}

// Coluna e sentido desconhecidos voltam ao padrão, cada um por si; o Quadro não se ordena.
function ordenacaoDaConsulta(consulta: URLSearchParams, visao: VisaoDosProcessos): OrdenacaoDaLista {
  if (visao === 'quadro') return ORDENACAO_PADRAO
  const coluna = consulta.get('ordenar') ?? ''
  return {
    coluna: COLUNAS.has(coluna) ? coluna as ColunaDaLista : ORDENACAO_PADRAO.coluna,
    sentido: consulta.get('sentido') === 'decrescente' ? 'decrescente' : 'crescente',
  }
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
  }
}

// "aguardando-o-setor" saiu com as etapas do setor (ADR 0013): o endereço antigo vale como sem filtro de etapa.
function etapaDaConsulta(lida: string | null): string | null {
  return lida === 'aguardando-o-setor' ? null : lida
}

// Fora da Lista não há situação; com uma Situação escolhida o filtro do cabeçalho não tem o que filtrar.
function valorDoFiltroNoEndereco(
  nome: (typeof NOMES_DOS_FILTROS)[number], filtros: FiltrosDosProcessos, visao: VisaoDosProcessos, mostrar: MostrarNoPortfolio,
): string | null {
  if (nome === 'situacao' && (visao === 'quadro' || mostrar !== 'todos')) return null
  return filtros[nome]
}

export function montarEnderecoDosProcessos(
  { mostrar = 'todos', destacar = false, linhas = 'nenhuma', ordenacao = ORDENACAO_PADRAO, agruparLista = 'nenhum', ...resto }: EnderecoParaMontar,
): string {
  const trechos = ['#/processos', resto.visao === 'lista' ? 'lista' : null, resto.aberto].filter((trecho) => trecho !== null)
  const texto = consultaDoEndereco({ ...resto, mostrar, destacar, linhas, ordenacao, agruparLista }).toString()
  return trechos.join('/') + (texto ? `?${texto}` : '')
}

function consultaDoEndereco({ visao, filtros, agrupar, mostrar, destacar, linhas, ordenacao, agruparLista }: EnderecoDosProcessos): URLSearchParams {
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    const valor = valorDoFiltroNoEndereco(nome, filtros, visao, mostrar)
    if (valor) consulta.set(nome, valor)
  }
  gravarEscolhasDaVisao(consulta, { visao, agrupar, mostrar, destacar, linhas })
  if (visao === 'lista') gravarOrdenacao(consulta, ordenacao)
  if (visao === 'lista' && agruparLista !== 'nenhum') consulta.set('agrupar', agruparLista)
  return consulta
}

// Agrupar e Destacar só no Quadro; a Situação só no portfólio (Lista e Quadro por setor).
function gravarEscolhasDaVisao(
  consulta: URLSearchParams,
  { visao, agrupar, mostrar, destacar, linhas }: Pick<EnderecoDosProcessos, 'visao' | 'agrupar' | 'mostrar' | 'destacar' | 'linhas'>,
) {
  if (linhas !== 'nenhuma' && visao === 'quadro' && agrupar === 'etapa') consulta.set('linhas', linhas)
  if (visao === 'quadro' && agrupar !== 'etapa') consulta.set('agrupar', agrupar)
  if (mostrar !== 'todos' && ehPortfolio(visao, agrupar)) consulta.set('mostrar', mostrar)
  if (destacar && visao === 'quadro') consulta.set('destacar', '1')
}

// A padrão (Processo, crescente) não vai ao endereço: a Lista sem escolha fica com o endereço de sempre.
function gravarOrdenacao(consulta: URLSearchParams, { coluna, sentido }: OrdenacaoDaLista) {
  if (coluna !== ORDENACAO_PADRAO.coluna) consulta.set('ordenar', coluna)
  if (sentido !== ORDENACAO_PADRAO.sentido) consulta.set('sentido', sentido)
}

/** As quatro formas de ver do menu "Quadro ▾": os três quadros (o agrupar do Quadro) e a Lista. */
export type FormaDeVer = AgruparQuadroPor | 'lista'

export const ROTULO_DA_FORMA_DE_VER: Record<FormaDeVer, string> = {
  etapa: 'Quadro por etapa', responsavel: 'Quadro por responsável', setor: 'Quadro por setor', lista: 'Lista',
}

export function formaDeVer({ visao, agrupar }: Pick<EnderecoDosProcessos, 'visao' | 'agrupar'>): FormaDeVer {
  return visao === 'lista' ? 'lista' : agrupar
}

// O endereço não muda de formato (visao e agrupar, como antes do menu), então os endereços antigos continuam valendo.
// Trocar de forma de ver fecha o processo aberto e mantém os filtros; o Quadro não tem situação.
export function comFormaDeVer(endereco: EnderecoDosProcessos, forma: FormaDeVer): EnderecoDosProcessos {
  if (forma === 'lista') return { ...endereco, visao: 'lista', agrupar: 'etapa', aberto: null }
  return { ...endereco, visao: 'quadro', agrupar: forma, aberto: null, filtros: { ...endereco.filtros, situacao: null } }
}
