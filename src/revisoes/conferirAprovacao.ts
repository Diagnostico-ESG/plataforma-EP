import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { fraseDoBloqueioDaConclusao } from '../processos/frasesDaVersaoCompleta'
import type { UltimaVersao } from '../processos/tipos'
import {
  FRASE_DO_LINK_INVALIDO, FRASE_DO_PROCESSO_JA_APROVADO, fraseDaAprovacaoAntesDaRevisao, fraseDaDataNoFuturo,
} from './frasesDeAprovacao'
import type { DadosDaAprovacao } from './tipos'

/** O que o banco confere antes de gravar a aprovação, na ordem dele: uma por processo, versão completa, link e data. */
export type SituacaoDaAprovacao = { jaAprovado: boolean; ultima: UltimaVersao | null; ultimaRevisao: string | null; hoje: string }

/** As recusas do banco para a aprovação, como TravaDoBanco com a frase pronta (a falsa as repete). */
export function conferirAprovacao(dados: DadosDaAprovacao, { jaAprovado, ultima, ultimaRevisao, hoje }: SituacaoDaAprovacao): void {
  if (jaAprovado) throw new TravaDoBanco(FRASE_DO_PROCESSO_JA_APROVADO)
  const incompleta = fraseDoBloqueioDaConclusao(ultima)
  if (incompleta !== null) throw new TravaDoBanco(incompleta)
  conferirLinkEData(dados, ultimaRevisao, hoje)
}

/** O link e a data da aprovação, conferidos na conclusão e de novo na edição (o banco usa as mesmas funções nos dois). */
export function conferirLinkEData(dados: DadosDaAprovacao, ultimaRevisao: string | null, hoje: string): void {
  if (dados.link !== null && !/^https?:\/\/.+/i.test(dados.link)) throw new TravaDoBanco(FRASE_DO_LINK_INVALIDO)
  const data = dados.aprovadaEm
  if (data === null) return
  if (data > hoje) throw new TravaDoBanco(fraseDaDataNoFuturo(data))
  if (ultimaRevisao !== null && data < ultimaRevisao) throw new TravaDoBanco(fraseDaAprovacaoAntesDaRevisao(`${data}:${ultimaRevisao}`))
}

/** A volta para a Aprovação pelo setor ou para antes dela desfaz a aprovação (as etapas comparadas pela ordem do catálogo). */
export function voltaDesfazAprovacao(etapas: { codigo: string; ordem: number }[], etapaCodigo: string): boolean {
  const ordemDaAprovacao = etapas.find((etapa) => etapa.codigo === 'aprovacao_setor')?.ordem
  const ordemDaVolta = etapas.find((etapa) => etapa.codigo === etapaCodigo)?.ordem
  return ordemDaAprovacao !== undefined && ordemDaVolta !== undefined && ordemDaVolta <= ordemDaAprovacao
}
