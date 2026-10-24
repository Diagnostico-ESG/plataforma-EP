// As frases das recusas do arquivamento (migração arquivar_e_registrar_publicacao), usadas pelo módulo real e pelo falso. As do
// registro da publicação voltam no ticket 04 de publicacao-e-arquivamento.
import { porExtenso } from './frasesDeSituacao'

export const FRASE_DO_PROCESSO_ARQUIVADO = 'Este processo está arquivado; desarquive-o para alterar.'

export const FRASE_DO_PROCESSO_JA_ARQUIVADO = 'Este processo já está arquivado.'

export const FRASE_DO_PROCESSO_NAO_ARQUIVADO = 'Este processo não está arquivado.'

export const FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO = 'O processo só se arquiva e se desarquiva pelos botões do verso.'

/** Arquivar só o concluído; recebe a situação em que o processo está. */
export function fraseDoArquivarSoConcluido(situacao: string): string {
  return `Só um processo concluído pode ser arquivado; este está ${porExtenso(situacao)}.`
}
