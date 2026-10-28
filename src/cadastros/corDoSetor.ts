export const TOTAL_DE_CORES = 30

// A cor do setor é lisa, no tom claro da paleta (ADR 0033): não há tom escuro calculado.
export type CorDoSetor = { numero: number; nome: string; claro: string }

// A ordem é a de distribuição da identidade visual (vizinhas bem diferentes); o banco guarda só o número.
const TONS: readonly (readonly [string, string])[] = [
  ['coral claro', '#F8C4C4'], ['água claro', '#C4F8ED'], ['rosa claro', '#F8C4D9'], ['menta claro', '#C4F8D9'],
  ['orquídea claro', '#F8C4ED'], ['verde claro', '#C4F8C4'], ['lilás claro', '#EDC4F8'], ['pistache claro', '#D9F8C4'],
  ['lavanda claro', '#D9C4F8'], ['limão claro', '#EDF8C4'], ['pervinca claro', '#C4C4F8'], ['areia claro', '#F8EDC4'],
  ['azul claro', '#C4D9F8'], ['pêssego claro', '#F8D9C4'], ['céu claro', '#C4EDF8'], ['limão médio', '#DAE7A6'],
  ['pervinca médio', '#A6A6E7'], ['areia médio', '#E7DAA6'], ['azul médio', '#A6C0E7'], ['pêssego médio', '#E7C0A6'],
  ['céu médio', '#A6DAE7'], ['coral médio', '#E7A6A6'], ['água médio', '#A6E7DA'], ['rosa médio', '#E7A6C0'],
  ['menta médio', '#A6E7C0'], ['orquídea médio', '#E7A6DA'], ['verde médio', '#A6E7A6'], ['lilás médio', '#DAA6E7'],
  ['pistache médio', '#C0E7A6'], ['lavanda médio', '#C0A6E7'],
]

export const TODAS_AS_CORES: readonly CorDoSetor[] = TONS.map(([nome, claro], i) => ({ numero: i + 1, nome, claro }))

/** Número fora de 1 a 30 (ou não inteiro) cai na cor 1, para a tela nunca ficar sem tom. */
export function corDoSetor(numero: number): CorDoSetor {
  return TODAS_AS_CORES[Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_DE_CORES ? numero - 1 : 0]
}

/** Variável CSS do tom claro, que o selo, o quadradinho, o cabeçalho e a amostra usam como cor lisa. */
export function estiloDaCor(numero: number): Record<'--cor-claro', string> {
  return { '--cor-claro': corDoSetor(numero).claro }
}

/** Nome acessível da amostra da grade: o da cor e, se outro setor a usa, a sigla dele. */
export function nomeDaAmostra(numero: number, siglaEmUso?: string): string {
  const { nome } = corDoSetor(numero)
  return siglaEmUso ? `${nome}, em uso por ${siglaEmUso}` : nome
}

/** Cor → primeira sigla em ordem entre os setores que a usam; a lista que chega já sem o setor aberto. */
export function coresEmUso(setores: readonly { sigla: string; cor: number }[]): Map<number, string> {
  const emUso = new Map<number, string>()
  for (const { sigla, cor } of [...setores].sort((a, b) => (a.sigla < b.sigla ? -1 : Number(a.sigla > b.sigla)))) {
    if (!emUso.has(cor)) emUso.set(cor, sigla)
  }
  return emUso
}
