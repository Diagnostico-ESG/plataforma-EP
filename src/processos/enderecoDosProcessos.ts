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

/** aberto: o id do processo no painel, 'novo' no cadastro, null sem painel. */
export type EnderecoDosProcessos = { visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos }

export const SEM_FILTROS: FiltrosDosProcessos = {
  setor: null, macroprocesso: null, etapa: null, tipo: null, responsavel: null, situacao: null, busca: null,
}

// A ordem fixa deixa o mesmo filtro sempre com o mesmo endereço, para recarregar ou compartilhar.
const NOMES_DOS_FILTROS = ['setor', 'macroprocesso', 'etapa', 'tipo', 'responsavel', 'situacao', 'busca'] as const
const TIPOS = new Set<string>(['processo', 'subprocesso', 'a_classificar'])
const SITUACOES = new Set<string>(['em_andamento', 'suspenso', 'cancelado', 'concluido'])

/** #/processos[/lista][/<id> | /novo][?filtros] */
export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos {
  const [caminho, consulta = ''] = endereco.split('?')
  const trechos = caminho.split('/').slice(2)
  const visao: VisaoDosProcessos = trechos[0] === 'lista' ? 'lista' : 'quadro'
  const aberto = (visao === 'lista' ? trechos[1] : trechos[0]) || null
  return { visao, aberto, filtros: filtrosDaConsulta(new URLSearchParams(consulta), visao) }
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
  }
}

// "aguardando-o-setor" saiu com as etapas do setor (ADR 0013): o endereço antigo vale como sem filtro de etapa.
function etapaDaConsulta(lida: string | null): string | null {
  return lida === 'aguardando-o-setor' ? null : lida
}

export function montarEnderecoDosProcessos({ visao, aberto, filtros }: EnderecoDosProcessos): string {
  const trechos = ['#/processos', visao === 'lista' ? 'lista' : null, aberto].filter((trecho) => trecho !== null)
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    const soDaLista = nome === 'situacao' || nome === 'busca'
    const valor = soDaLista && visao === 'quadro' ? null : filtros[nome]
    if (valor) consulta.set(nome, valor)
  }
  const texto = consulta.toString()
  return trechos.join('/') + (texto ? `?${texto}` : '')
}
