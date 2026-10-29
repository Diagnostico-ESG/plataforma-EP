// As frases das recusas do registro da publicação (migração registrar_publicacao_e_arquivar_tudo, sem a parte do
// arquivado, que saiu na fim_do_arquivado), usadas pelo módulo real e pelo falso.
import { formatarData } from '../lib/datas'

export const FRASE_DA_PUBLICACAO_FORA_DA_ETAPA = 'Registre a publicação com o processo na Publicação ou em Concluídos.'

export const FRASE_DA_DATA_DA_PUBLICACAO_OBRIGATORIA = 'Informe a data da publicação.'

/** O valor do banco é "data:aprovada_em", as duas em AAAA-MM-DD. */
export function fraseDaPublicacaoAntesDaAprovacao(valor: string): string {
  const [data, aprovada] = valor.split(':')
  return `A data da publicação ${formatarData(data)} é anterior à aprovação, em ${formatarData(aprovada)}.`
}
