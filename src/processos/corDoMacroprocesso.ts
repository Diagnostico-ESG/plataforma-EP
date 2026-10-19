// O banco não guarda cor de macroprocesso: a cor sai do id, sempre a mesma, entre as seis da identidade visual
// (sem vermelho, âmbar ou verde, que dizem situação). Escolher a cor de cada um seria uma coluna nova.
const CORES = ['violeta', 'ciano', 'magenta', 'indigo', 'oliva', 'cobre'] as const

export function corDoMacroprocesso(id: string): string {
  let soma = 0
  for (const letra of id) soma += letra.charCodeAt(0)
  return `var(--macro-${CORES[soma % CORES.length]})`
}
