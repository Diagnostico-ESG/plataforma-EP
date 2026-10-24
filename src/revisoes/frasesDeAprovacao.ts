import { formatarData } from '../lib/datas'

export const FRASE_DA_APROVACAO_FORA_DA_ETAPA = 'Registre a aprovação com o processo na Aprovação pelo setor.'
export const FRASE_DO_PROCESSO_JA_APROVADO = 'Este processo já tem aprovação registrada.'
export const FRASE_DO_LINK_INVALIDO = 'O link do E-protocolo precisa começar com http:// ou https://.'
export const FRASE_DO_PROCESSO_COM_APROVACAO =
  'Não é possível excluir: processo tem aprovação registrada. Cancele o processo em vez de excluí-lo.'

/** A data da aprovação (ou de outra etapa) não pode ser futura: o banco manda a data em AAAA-MM-DD. */
export function fraseDaDataNoFuturo(data: string): string {
  return `A data ${formatarData(data)} está no futuro.`
}

/**
 * Substituir arquivo de versão aprovada (ADR 0011). O número vem do banco ("8") ou da função do Drive, que o põe no fim da
 * mensagem ("... (8)"): vale o primeiro número que aparecer.
 */
export function fraseDaVersaoAprovada(valor: string): string {
  return `A versão V${valor.match(/\d+/)?.[0] ?? '?'} foi aprovada e seus arquivos não podem ser substituídos.`
}
