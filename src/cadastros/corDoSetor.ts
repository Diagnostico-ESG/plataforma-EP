export const TOTAL_DE_CORES = 30
const FATOR_DO_TOM_ESCURO = 0.88

export type CorDoSetor = { numero: number; nome: string; claro: string; escuro: string }

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

// Regra fixa do tom escuro: cada canal vezes 0,88. Se um contraste cair abaixo de 4,5:1, o teste acusa e o fator sobe.
function escurecer(hex: string): string {
  const canais = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * FATOR_DO_TOM_ESCURO))
  return `#${canais.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export const TODAS_AS_CORES: readonly CorDoSetor[] = TONS.map(([nome, claro], i) => ({
  numero: i + 1, nome, claro, escuro: escurecer(claro),
}))

/** Número fora de 1 a 30 (ou não inteiro) cai na cor 1, para a tela nunca ficar sem tom. */
export function corDoSetor(numero: number): CorDoSetor {
  return TODAS_AS_CORES[Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_DE_CORES ? numero - 1 : 0]
}

/** Variáveis CSS que o selo e o quadradinho usam para o degradê do tom claro ao escuro. */
export function estiloDaCor(numero: number): Record<'--cor-claro' | '--cor-escuro', string> {
  const { claro, escuro } = corDoSetor(numero)
  return { '--cor-claro': claro, '--cor-escuro': escuro }
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
