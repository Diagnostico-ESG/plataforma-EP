import { formatarData } from '../lib/datas'
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import type { ProcessoDaLista } from './tipos'

// A chave da coluna Concluídos num ponto só (o código vem de codigosDasEtapas).
export const CHAVE_DOS_CONCLUIDOS = CODIGO_CONCLUIDOS

/** Em Concluídos sem a data da publicação: o selo "Sem publicação" do cartão. */
export function semPublicacao({ etapaAtual, publicadoEm }: Pick<ProcessoDaLista, 'etapaAtual' | 'publicadoEm'>): boolean {
  return etapaAtual?.codigo === CODIGO_CONCLUIDOS && !publicadoEm
}

/** A linha abaixo de "Concluído" no Agora; null sem data da publicação. */
export function linhaDaPublicacao({ publicadoEm }: Pick<ProcessoDaLista, 'publicadoEm'>): string | null {
  return publicadoEm ? `Publicado em ${formatarData(publicadoEm)}` : null
}

/**
 * A janela da chegada a Concluídos é do ticket 04 de publicacao-e-arquivamento. Até lá, mover para Concluídos sem a data
 * da publicação já registrada não chama o banco: a tela diz o que a chegada pede e o processo fica onde estava.
 */
export const FRASE_DA_CHEGADA_PENDENTE =
  'A chegada a Concluídos pede a data da publicação ou a explicação de concluir sem publicação; essa janela ainda não está disponível.'

/** Concluídos sem a data registrada precisa da janela da chegada; com a data, o processo vai direto. */
export function chegadaPedeJanela(processo: Pick<ProcessoDaLista, 'publicadoEm'>, destino: { codigo: string }): boolean {
  return destino.codigo === CODIGO_CONCLUIDOS && !processo.publicadoEm
}
