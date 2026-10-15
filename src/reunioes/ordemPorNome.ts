/** A ordem das listas de nomes da reunião (processos, usuários e responsáveis): alfabética, sem distinguir acento nem caixa. */
export function compararPorNome(a: { nome: string }, b: { nome: string }): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}
