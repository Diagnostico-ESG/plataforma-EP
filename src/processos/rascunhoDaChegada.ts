import { hojeLocal } from './textoDaModelagemPiloto'
import type { DadosDaChegada } from './tipos'

export type OpcaoDaChegada = 'publicado' | 'sem_publicacao'

/** O que a janela da chegada a Concluídos guarda enquanto a pessoa preenche: a opção, a data e o link, ou a explicação. */
export type RascunhoDaChegada = { opcao: OpcaoDaChegada | null; data: string; link: string; explicacao: string }

/** Nenhuma opção marcada; a data da publicação vem com hoje. */
export function rascunhoDaChegadaVazio(hoje: string = hojeLocal()): RascunhoDaChegada {
  return { opcao: null, data: hoje, link: '', explicacao: '' }
}

/** O botão [Levar a Concluídos] só se habilita com a opção escolhida completa: a data, ou a explicação com texto. */
export function chegadaCompleta({ opcao, data, explicacao }: RascunhoDaChegada): boolean {
  if (opcao === 'publicado') return data !== ''
  if (opcao === 'sem_publicacao') return explicacao.trim() !== ''
  return false
}

/** O que vai ao banco: da opção escolhida só os campos dela; o link vazio vira nulo. */
export function dadosDaChegada({ opcao, data, link, explicacao }: RascunhoDaChegada): DadosDaChegada {
  if (opcao === 'publicado') return { dataDaPublicacao: data, linkDaPublicacao: link.trim() || null, explicacao: null }
  return { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: explicacao.trim() }
}
