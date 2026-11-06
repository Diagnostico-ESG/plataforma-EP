import { ColunasFaltando } from './lerPlanilha'

export function contar(quantidade: number, singular: string, plural: string): string {
  return `${String(quantidade)} ${quantidade === 1 ? singular : plural}`
}

/** Por que o arquivo escolhido não segue para a prévia. */
export function frasesDaRecusa(erro: unknown): string {
  if (erro instanceof ColunasFaltando) {
    return `Este arquivo não parece a aba PRODUTO 33: faltam as colunas ${erro.faltam.join(', ')}.`
  }
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível ler o arquivo (${motivo}). Escolha outro e tente de novo.`
}

/** O banco não respondeu à leitura do que já existe; o motivo vai na frase para a pessoa poder relatá-lo. */
export function fraseDaFalhaDeLeitura(erro: unknown): string {
  const motivo = erro instanceof Error ? erro.message : String(erro)
  return `Não foi possível ler o que já existe na plataforma (${motivo}). Tente de novo.`
}
