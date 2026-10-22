import { voltaDesfazAprovacao } from '../revisoes/conferirAprovacao'
import { formatarData } from './caminhoDeEtapas'
import type { AcaoDeAvanco } from './gravarAcoes'
import type { ProcessoDaLista } from './tipos'

// A escolha de publicação (ADR 0020): os códigos das etapas e a chave da coluna do Quadro num ponto só.
export const CODIGO_DA_APROVACAO = 'aprovacao_setor'
export const CODIGO_DA_PUBLICACAO = 'publicacao'
export const CHAVE_DOS_CONCLUIDOS = 'concluidos'
export const TITULO_DOS_CONCLUIDOS = 'Concluídos'

type Etapa = { codigo: string }

/**
 * A janela que resolve a Aprovação pergunta "Vai para publicação?" quando a próxima pendente é a Publicação. O banco
 * exige a resposta sempre que há a Publicação pendente depois; com ela desativada, não pergunta.
 */
export function perguntaDaPublicacao(acao: AcaoDeAvanco, etapa: Etapa, proxima: Etapa | null): boolean {
  if (acao !== 'concluir' && acao !== 'realizada') return false
  return etapa.codigo === CODIGO_DA_APROVACAO && proxima?.codigo === CODIGO_DA_PUBLICACAO
}

type Situacao = Pick<ProcessoDaLista, 'situacao' | 'vaiParaPublicacao'>

/** Concluído com a escolha "não": o selo do cartão e a linha do Agora. */
export function naoPublicado({ situacao, vaiParaPublicacao }: Situacao): boolean {
  return situacao === 'concluido' && vaiParaPublicacao === false
}

/** A linha abaixo de "Concluído" no Agora; null sem nada a dizer (fora de concluído ou sem escolha). */
export function linhaDaPublicacao(processo: Situacao & Pick<ProcessoDaLista, 'publicadoEm'>): string | null {
  if (processo.situacao !== 'concluido') return null
  if (processo.publicadoEm) return `Publicado em ${formatarData(processo.publicadoEm)}`
  return naoPublicado(processo) ? 'Não publicado' : null
}

/** Voltar até a Aprovação ou antes apaga a escolha, quando há: a janela de voltar avisa. */
export function avisoDaEscolhaNaVolta(
  etapas: { codigo: string; ordem: number }[], etapaCodigo: string, vaiParaPublicacao: boolean | null | undefined,
): string | null {
  if (vaiParaPublicacao == null || !voltaDesfazAprovacao(etapas, etapaCodigo)) return null
  return 'A escolha de publicação será apagada.'
}
