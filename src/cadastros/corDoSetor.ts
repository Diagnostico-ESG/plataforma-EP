// O banco guarda a cor do setor de 1 a 30 (sem migração); a tela mostra 12 cores fortes em ciclo sobre esse número.
export const TOTAL_DE_CORES = 30
export const CORES_NA_TELA = 12

// A sigla do selo é branca sobre a cor: todas passam de 4,5:1 (identidade de 2026-10-30).
export type CorDoSetor = { numero: number; nome: string; hex: string }

const TONS: readonly (readonly [string, string])[] = [
  ['bordô', '#881337'], ['laranja', '#C2410C'], ['mostarda', '#A16207'], ['oliva', '#606000'],
  ['verde', '#15803D'], ['petróleo', '#0E7490'], ['azul', '#1D4ED8'], ['roxo profundo', '#5B21B6'],
  ['fúcsia', '#C026D3'], ['ameixa', '#804878'], ['rosa', '#DB2777'], ['grafite quente', '#57534E'],
]

export const TODAS_AS_CORES: readonly CorDoSetor[] = TONS.map(([nome, hex], i) => ({ numero: i + 1, nome, hex }))

/** Número fora de 1 a 30 (ou não inteiro) cai na cor 1; de 13 a 30 o ciclo volta ao começo da tabela. */
export function corDoSetor(numero: number): CorDoSetor {
  const valido = Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_DE_CORES
  return TODAS_AS_CORES[valido ? (numero - 1) % CORES_NA_TELA : 0]
}

/** Variável CSS da cor, que o selo, o quadradinho e a amostra usam como cor lisa. */
export function estiloDaCor(numero: number): Record<'--cor-do-setor', string> {
  return { '--cor-do-setor': corDoSetor(numero).hex }
}

/** Nome acessível da amostra da grade: o da cor e, se outro setor a usa, a sigla dele. */
export function nomeDaAmostra(numero: number, siglaEmUso?: string): string {
  const { nome } = corDoSetor(numero)
  return siglaEmUso ? `${nome}, em uso por ${siglaEmUso}` : nome
}

/** Cor da tela (1 a 12) → primeira sigla em ordem entre os setores que a usam; a lista que chega já sem o setor aberto. */
export function coresEmUso(setores: readonly { sigla: string; cor: number }[]): Map<number, string> {
  const emUso = new Map<number, string>()
  for (const { sigla, cor } of [...setores].sort((a, b) => (a.sigla < b.sigla ? -1 : Number(a.sigla > b.sigla)))) {
    const numero = corDoSetor(cor).numero
    if (!emUso.has(numero)) emUso.set(numero, sigla)
  }
  return emUso
}
