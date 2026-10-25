// Frases das recusas do catálogo de etapas, as mesmas no módulo real e no falso.

export function fraseDaEtapaUsada(nome: string): string {
  return `A etapa ${nome} já recebeu processos; desative-a em vez de excluir.`
}

export function fraseDaEtapaProtegida(nome: string): string {
  return `A etapa ${nome} tem campos próprios e não pode ser desativada nem excluída.`
}

/** A contagem dos processos que ainda estão na etapa, com o que a pessoa tentava fazer. */
export function fraseDaEtapaComProcessos(nome: string, quantidade: number | string, acao: 'desativar' | 'excluir'): string {
  const total = Number(quantidade)
  const dentro = total === 1 ? '1 processo; mova-o' : `${quantidade} processos; mova-os`
  return `A etapa ${nome} tem ${dentro} antes de ${acao}.`
}

export const FRASE_DAS_ETAPAS_FIXAS = 'As etapas Não iniciados e Concluídos não mudam de nome nem de lugar e não saem do catálogo.'

export function fraseDeNomeRepetido(nome: string): string {
  return `Já existe uma etapa com o nome ${nome}.`
}

export function fraseDeCodigoRepetido(codigo: string): string {
  return `Já existe uma etapa com o código ${codigo}.`
}
