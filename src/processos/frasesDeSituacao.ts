// As frases de recusa da situação do processo: o módulo real e o falso dizem exatamente o mesmo.
const SITUACAO_POR_EXTENSO: Record<string, string> = {
  em_andamento: 'em andamento', suspenso: 'suspenso', cancelado: 'cancelado', concluido: 'concluído',
}

export function porExtenso(situacao: string): string {
  return SITUACAO_POR_EXTENSO[situacao] ?? situacao
}

/** O banco recusa a etapa de um processo suspenso ou cancelado: ele precisa ser retomado antes. */
export function fraseDoProcessoParado(situacao: string): string {
  return `Este processo está ${porExtenso(situacao)}; retome-o para mudar a etapa, a etiqueta ou o responsável.`
}

/** A transição que a spec não prevê, com as duas situações recebidas. */
export function fraseDeSituacaoInvalida(de: string, para: string): string {
  if (de === para) return `Este processo já está ${porExtenso(de)}.`
  return `Um processo ${porExtenso(de)} não pode passar a ${porExtenso(para)}.`
}
