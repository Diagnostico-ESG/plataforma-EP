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
  /** Só na Lista: null mostra os arquivados (o padrão); 'esconder' os tira. */
  arquivados: 'esconder' | null
}

export type AgruparQuadroPor = 'etapa' | 'responsavel' | 'setor'

// O Record obriga a listar cada agrupamento: um novo em AgruparQuadroPor sem entrada aqui não compila.
const AGRUPAMENTOS: Record<AgruparQuadroPor, true> = { etapa: true, responsavel: true, setor: true }

function ehAgrupamento(lido: string): lido is AgruparQuadroPor {
  return Object.hasOwn(AGRUPAMENTOS, lido)
}

/**
 * aberto: o id do processo no painel, 'novo' no cadastro, null sem painel.
 * agrupar fica fora dos filtros para o [Limpar filtros] não o desligar; só vale no Quadro.
 */
export type EnderecoDosProcessos = {
  visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos; agrupar: AgruparQuadroPor
}

export const SEM_FILTROS: FiltrosDosProcessos = {
  setor: null, macroprocesso: null, etapa: null, tipo: null, responsavel: null, situacao: null, busca: null, arquivados: null,
}

// A ordem fixa deixa o mesmo filtro sempre com o mesmo endereço, para recarregar ou compartilhar.
const NOMES_DOS_FILTROS = ['setor', 'macroprocesso', 'etapa', 'tipo', 'responsavel', 'situacao', 'busca', 'arquivados'] as const
const SO_DA_LISTA = new Set<string>(['situacao', 'busca', 'arquivados'])
const TIPOS = new Set<string>(['processo', 'subprocesso', 'a_classificar'])
const SITUACOES = new Set<string>(['em_andamento', 'suspenso', 'cancelado', 'concluido'])

/** #/processos[/lista][/<id> | /novo][?filtros] */
export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos {
  const [caminho, consulta = ''] = endereco.split('?')
  const trechos = caminho.split('/').slice(2)
  const visao: VisaoDosProcessos = trechos[0] === 'lista' ? 'lista' : 'quadro'
  const aberto = (visao === 'lista' ? trechos[1] : trechos[0]) || null
  const parametros = new URLSearchParams(consulta)
  const lido = parametros.get('agrupar') ?? ''
  const agrupar = visao === 'quadro' && ehAgrupamento(lido) ? lido : 'etapa'
  return { visao, aberto, filtros: filtrosDaConsulta(parametros, visao), agrupar }
}

function filtrosDaConsulta(consulta: URLSearchParams, visao: VisaoDosProcessos): FiltrosDosProcessos {
  const valor = (nome: string): string | null => consulta.get(nome) || null
  const conhecido = (nome: string, validos: Set<string>): string | null => {
    const lido = valor(nome)
    return lido !== null && validos.has(lido) ? lido : null
  }
  return {
    setor: valor('setor'), macroprocesso: valor('macroprocesso'), etapa: etapaDaConsulta(valor('etapa')),
    tipo: conhecido('tipo', TIPOS) as TipoDeProcesso | null, responsavel: valor('responsavel'),
    situacao: visao === 'lista' ? conhecido('situacao', SITUACOES) as SituacaoDoProcesso | null : null,
    busca: visao === 'lista' ? valor('busca') : null,
    arquivados: visao === 'lista' && valor('arquivados') === 'esconder' ? 'esconder' : null,
  }
}

// "aguardando-o-setor" saiu com as etapas do setor (ADR 0013): o endereço antigo vale como sem filtro de etapa.
function etapaDaConsulta(lida: string | null): string | null {
  return lida === 'aguardando-o-setor' ? null : lida
}

export function montarEnderecoDosProcessos({ visao, aberto, filtros, agrupar }: EnderecoDosProcessos): string {
  const trechos = ['#/processos', visao === 'lista' ? 'lista' : null, aberto].filter((trecho) => trecho !== null)
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    const valor = SO_DA_LISTA.has(nome) && visao === 'quadro' ? null : filtros[nome]
    if (valor) consulta.set(nome, valor)
  }
  if (visao === 'quadro' && agrupar !== 'etapa') consulta.set('agrupar', agrupar)
  const texto = consulta.toString()
  return trechos.join('/') + (texto ? `?${texto}` : '')
}
