type ComCodigoENome = { codigo: string | null; nome: string }

/** Ordem da lista de macroprocessos: pelo código (os sem código depois) e, em empate, pelo nome. */
export function compararMacroprocessos(a: ComCodigoENome, b: ComCodigoENome): number {
  if (a.codigo !== b.codigo) {
    if (a.codigo === null) return 1
    if (b.codigo === null) return -1
    return a.codigo < b.codigo ? -1 : 1
  }
  return a.nome.localeCompare(b.nome, 'pt-BR')
}
