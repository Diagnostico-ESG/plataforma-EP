// As frases das recusas do arquivamento e do registro da publicação (migrações arquivar_e_registrar_publicacao e
// registrar_publicacao_e_arquivar_tudo), usadas pelo módulo real e pelo falso.
import { formatarData } from '../lib/datas'

export const FRASE_DO_PROCESSO_ARQUIVADO = 'Este processo está arquivado; desarquive-o para alterar.'

export const FRASE_DO_PROCESSO_JA_ARQUIVADO = 'Este processo já está arquivado.'

export const FRASE_DO_PROCESSO_NAO_ARQUIVADO = 'Este processo não está arquivado.'

export const FRASE_DO_ARQUIVAMENTO_SO_PELA_FUNCAO = 'O processo só se arquiva e se desarquiva pelos botões do verso.'

/** O banco recusa arquivar o que está em andamento fora de Concluídos. */
export function fraseDoArquivarSoConcluido(): string {
  return 'Só se arquiva processo concluído, suspenso ou cancelado.'
}

export const FRASE_DA_PUBLICACAO_FORA_DA_ETAPA = 'Registre a publicação com o processo na Publicação ou em Concluídos.'

export const FRASE_DO_ARQUIVADO_JA_PUBLICADO = 'O processo arquivado já tem a publicação registrada.'

export const FRASE_DA_DATA_DA_PUBLICACAO_OBRIGATORIA = 'Informe a data da publicação.'

/** O valor do banco é "data:aprovada_em", as duas em AAAA-MM-DD. */
export function fraseDaPublicacaoAntesDaAprovacao(valor: string): string {
  const [data, aprovada] = valor.split(':')
  return `A data da publicação ${formatarData(data)} é anterior à aprovação, em ${formatarData(aprovada)}.`
}
