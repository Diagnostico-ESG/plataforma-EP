import { formatarData } from '../lib/datas'

export const FRASE_DA_APROVACAO_FORA_DA_ETAPA = 'A aprovação só pode ser registrada com a Aprovação pelo setor em andamento.'
export const FRASE_DO_PROCESSO_JA_APROVADO = 'Este processo já tem aprovação registrada.'
export const FRASE_DO_LINK_INVALIDO = 'O link do E-protocolo precisa começar com http:// ou https://.'
export const FRASE_DO_PROCESSO_COM_APROVACAO =
  'Não é possível excluir: processo tem aprovação registrada. Cancele o processo em vez de excluí-lo.'

/** A data da aprovação (ou de outra etapa) não pode ser futura: o banco manda a data em AAAA-MM-DD. */
export function fraseDaDataNoFuturo(data: string): string {
  return `A data ${formatarData(data)} está no futuro.`
}

/** O banco manda "<data da aprovação>:<data da última revisão>", em AAAA-MM-DD. */
export function fraseDaAprovacaoAntesDaRevisao(datas: string): string {
  const [aprovacao, revisao] = datas.split(':')
  return `A data da aprovação (${formatarData(aprovacao)}) não pode ser antes da última revisão interna (${formatarData(revisao)}).`
}

/** Concluir a Aprovação por outro caminho que não a janela: o banco recusa a versão sem aprovação. */
export function fraseDaVersaoSemAprovacao(numero: number | string): string {
  return `A V${numero} ainda não tem aprovação registrada. Conclua a Aprovação pelo setor pela janela de concluir.`
}

/**
 * Substituir arquivo de versão aprovada (ADR 0011). O número vem do banco ("8") ou da função do Drive, que o põe no fim da
 * mensagem ("... (8)"): vale o primeiro número que aparecer.
 */
export function fraseDaVersaoAprovada(valor: string): string {
  return `A versão V${valor.match(/\d+/)?.[0] ?? '?'} foi aprovada e seus arquivos não podem ser substituídos.`
}
