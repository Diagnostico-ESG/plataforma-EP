/** As fases do art. 8º do Regimento que o catálogo liga às etapas; I a III são feitas fora da plataforma (ADR 0017). */
export const FASES_DO_REGIMENTO = ['IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

export type FaseDoRegimento = (typeof FASES_DO_REGIMENTO)[number]

export function ehFaseDoRegimento(valor: string): valor is FaseDoRegimento {
  return (FASES_DO_REGIMENTO as readonly string[]).includes(valor)
}
