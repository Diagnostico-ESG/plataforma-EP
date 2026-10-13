import type { CategoriaDoMacroprocesso } from './tipos'

export const ROTULO_SEM_CATEGORIA = 'Sem categoria'

export const ROTULOS_DAS_CATEGORIAS: Record<CategoriaDoMacroprocesso, string> = {
  finalistico: 'Finalístico',
  apoio: 'Apoio',
  gerencial: 'Gerencial',
}

export const CATEGORIAS: CategoriaDoMacroprocesso[] = ['finalistico', 'apoio', 'gerencial']

export function rotuloDaCategoria(categoria: CategoriaDoMacroprocesso | null): string {
  return categoria === null ? ROTULO_SEM_CATEGORIA : ROTULOS_DAS_CATEGORIAS[categoria]
}
