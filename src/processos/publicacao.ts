import { formatarData } from '../lib/datas'
import { CODIGO_CONCLUIDOS, CODIGO_DA_PUBLICACAO } from './codigosDasEtapas'
import type { ProcessoDaLista } from './tipos'

// A chave da coluna Concluídos num ponto só (o código vem de codigosDasEtapas).
export const CHAVE_DOS_CONCLUIDOS = CODIGO_CONCLUIDOS

/** Em Concluídos sem a data da publicação: o selo "Sem publicação" do cartão. */
export function semPublicacao({ etapaAtual, publicadoEm }: Pick<ProcessoDaLista, 'etapaAtual' | 'publicadoEm'>): boolean {
  return etapaAtual?.codigo === CODIGO_CONCLUIDOS && !publicadoEm
}

/** A linha da publicação no Agora; null sem data da publicação. */
export function linhaDaPublicacao({ publicadoEm }: Pick<ProcessoDaLista, 'publicadoEm'>): string | null {
  return publicadoEm ? `Publicado em ${formatarData(publicadoEm)}` : null
}

/** A linha do Agora em Concluídos: a data da publicação ou a explicação de concluir sem publicação. */
export function linhaDoConcluido({ publicadoEm, explicacaoSemPublicacao }: Pick<ProcessoDaLista, 'publicadoEm' | 'explicacaoSemPublicacao'>): string {
  if (publicadoEm) return `Concluído · Publicado em ${formatarData(publicadoEm)}`
  return explicacaoSemPublicacao ? `Concluído sem publicação: ${explicacaoSemPublicacao}` : 'Concluído sem publicação'
}

type ParaAPublicacao = Pick<ProcessoDaLista, 'etapaAtual' | 'publicadoEm' | 'explicacaoSemPublicacao'>

/** O que o Agora diz da publicação: Concluídos traz a linha completa; a Publicação, só a data, se houver. */
export function textoDaPublicacaoNoAgora(processo: ParaAPublicacao): string | null {
  return processo.etapaAtual?.codigo === CODIGO_CONCLUIDOS ? linhaDoConcluido(processo) : linhaDaPublicacao(processo)
}

export type AcaoDaPublicacao = 'registrar' | 'corrigir'

/**
 * O botão da publicação no Agora: [Registrar publicação] sem a data, [Corrigir publicação] com ela, só na Publicação e em
 * Concluídos. O parado não registra.
 */
export function acaoDaPublicacao(
  processo: Pick<ProcessoDaLista, 'situacao' | 'etapaAtual' | 'publicadoEm'>,
): AcaoDaPublicacao | null {
  const etapa = processo.etapaAtual?.codigo
  if (etapa !== CODIGO_DA_PUBLICACAO && etapa !== CODIGO_CONCLUIDOS) return null
  if (processo.situacao === 'suspenso' || processo.situacao === 'cancelado') return null
  return processo.publicadoEm ? 'corrigir' : 'registrar'
}

/** Concluídos sem a data registrada precisa da janela da chegada; com a data, o processo vai direto. */
export function chegadaPedeJanela(processo: Pick<ProcessoDaLista, 'publicadoEm'>, destino: { codigo: string }): boolean {
  return destino.codigo === CODIGO_CONCLUIDOS && !processo.publicadoEm
}
