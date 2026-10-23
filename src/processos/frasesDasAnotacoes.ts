import { LIMITE_DAS_ANOTACOES } from './anotacoes'

/** O banco recusa com 'anotacoes_longas:{n}'; a tela já não deixa chegar a isso (o campo tem maxLength). */
export function fraseDasAnotacoesLongas(tamanho: string): string {
  return `As anotações têm ${Number(tamanho).toLocaleString('pt-BR')} caracteres; o limite é ${LIMITE_DAS_ANOTACOES.toLocaleString('pt-BR')}.`
}
