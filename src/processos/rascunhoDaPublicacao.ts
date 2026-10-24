import { hojeLocal } from './textoDaReuniao'
import type { ProcessoDaLista } from './tipos'

/** O que a janela de registrar ou corrigir a publicação guarda enquanto a pessoa preenche. */
export type RascunhoDaPublicacao = { data: string; link: string }

/** Sem publicação registrada, hoje e sem link; com ela, a data e o link gravados (o modo Corrigir). */
export function rascunhoDaPublicacao(
  { publicadoEm, linkDaPublicacao }: Pick<ProcessoDaLista, 'publicadoEm' | 'linkDaPublicacao'>, hoje: string = hojeLocal(),
): RascunhoDaPublicacao {
  return { data: publicadoEm ?? hoje, link: linkDaPublicacao ?? '' }
}

/** O que vai ao banco: o link aparado, e o vazio vira nulo. */
export function dadosDaPublicacao({ data, link }: RascunhoDaPublicacao): { data: string; link: string | null } {
  return { data, link: link.trim() || null }
}
