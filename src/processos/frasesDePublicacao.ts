// As frases das recusas da escolha de publicação, do registro da publicação e do arquivamento (migrações
// escolha_de_publicacao e arquivar_e_registrar_publicacao), usadas pelo módulo real e pelo falso.
import { formatarData } from './caminhoDeEtapas'
import { porExtenso } from './frasesDeSituacao'

export const FRASE_DA_ESCOLHA_OBRIGATORIA = 'Responda se o processo vai para publicação.'

export const FRASE_DA_ESCOLHA_SO_PELA_FUNCAO =
  'A escolha de publicação só muda ao concluir a Aprovação pelo setor ou ao voltar a uma etapa.'

export const FRASE_DA_PUBLICACAO_NAO_SE_DISPENSA = 'A Publicação não se dispensa: use "Não vai mais para publicação".'

export const FRASE_DA_PUBLICACAO_FORA_DE_ANDAMENTO =
  'Só se desiste da publicação com a Publicação em andamento.'

export const FRASE_DA_PUBLICACAO_JA_REGISTRADA = 'A publicação deste processo já está registrada.'

export const FRASE_SEM_PUBLICACAO_PENDENTE = 'Este processo não tem a Publicação pendente para registrar.'

export const FRASE_DA_DATA_DA_PUBLICACAO_OBRIGATORIA = 'Informe a data da publicação.'

export const FRASE_DO_PROCESSO_ARQUIVADO = 'Este processo está arquivado; desarquive-o para alterar.'

export const FRASE_DO_PROCESSO_JA_ARQUIVADO = 'Este processo já está arquivado.'

export const FRASE_DO_PROCESSO_NAO_ARQUIVADO = 'Este processo não está arquivado.'

export const FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO = 'O processo só se arquiva e se desarquiva pelos botões do verso.'

/** Registrar a publicação só no concluído; recebe a situação em que o processo está. */
export function fraseDaPublicacaoSoNoConcluido(situacao: string): string {
  return `Só se registra a publicação de um processo concluído; este está ${porExtenso(situacao)}.`
}

/** Arquivar só o concluído; recebe a situação em que o processo está. */
export function fraseDoArquivarSoConcluido(situacao: string): string {
  return `Só um processo concluído pode ser arquivado; este está ${porExtenso(situacao)}.`
}

/** A data da publicação antes da aprovação, com as duas datas (AAAA-MM-DD). */
export function fraseDaPublicacaoAntesDaAprovacao(data: string, aprovadaEm: string): string {
  return `A data da publicação (${formatarData(data)}) não pode ser antes da aprovação (${formatarData(aprovadaEm)}).`
}
