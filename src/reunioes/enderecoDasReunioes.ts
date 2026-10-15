import type { TipoDeReuniao } from './tipos'

export type FiltrosDasReunioes = { setor: string | null; tipo: TipoDeReuniao | null; de: string | null; ate: string | null }

/** aberto: o id da reunião no painel, 'nova' no registro, null sem painel. */
export type EnderecoDasReunioes = { aberto: string | null; filtros: FiltrosDasReunioes }

export const SEM_FILTROS_DAS_REUNIOES: FiltrosDasReunioes = { setor: null, tipo: null, de: null, ate: null }

const FORMATO_DA_DATA = /^\d{4}-\d{2}-\d{2}$/

function valor(consulta: URLSearchParams, nome: string): string | null {
  return consulta.get(nome) || null
}

function dataDaConsulta(consulta: URLSearchParams, nome: string): string | null {
  const lida = valor(consulta, nome)
  return lida !== null && FORMATO_DA_DATA.test(lida) ? lida : null
}

function tipoDaConsulta(consulta: URLSearchParams): TipoDeReuniao | null {
  const lido = valor(consulta, 'tipo')
  return lido === 'sensibilizacao' || lido === 'modelagem' ? lido : null
}

/** #/reunioes[/<id> | /nova][?setor=&tipo=&de=&ate=] */
export function lerEnderecoDasReunioes(endereco: string): EnderecoDasReunioes {
  const [caminho, texto = ''] = endereco.split('?')
  const consulta = new URLSearchParams(texto)
  return {
    aberto: caminho.split('/')[2] || null,
    filtros: {
      setor: valor(consulta, 'setor'), tipo: tipoDaConsulta(consulta),
      de: dataDaConsulta(consulta, 'de'), ate: dataDaConsulta(consulta, 'ate'),
    },
  }
}

// A ordem fixa deixa o mesmo filtro sempre com o mesmo endereço, para recarregar ou compartilhar.
const NOMES_DOS_FILTROS = ['setor', 'tipo', 'de', 'ate'] as const

export function montarEnderecoDasReunioes({ aberto, filtros }: EnderecoDasReunioes): string {
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    if (filtros[nome]) consulta.set(nome, filtros[nome])
  }
  const texto = consulta.toString()
  return ['#/reunioes', aberto].filter((trecho) => trecho !== null).join('/') + (texto ? `?${texto}` : '')
}
