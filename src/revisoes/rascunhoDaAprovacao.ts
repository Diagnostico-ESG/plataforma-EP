import type { DadosDaAprovacao } from './tipos'

/** O que a pessoa preencheu na janela de concluir a Aprovação: tudo é texto até confirmar. */
export type RascunhoDaAprovacao = { numero: string; link: string; data: string }

export const RASCUNHO_DA_APROVACAO_VAZIO: RascunhoDaAprovacao = { numero: '', link: '', data: '' }

/** O que vai ao banco: cada campo aparado, e vazio vira null (os três são opcionais). */
export function dadosDaAprovacao(rascunho: RascunhoDaAprovacao): DadosDaAprovacao {
  return {
    numeroEprotocolo: rascunho.numero.trim() || null, link: rascunho.link.trim() || null, aprovadaEm: rascunho.data || null,
  }
}
