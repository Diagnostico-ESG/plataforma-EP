/** Marca o item que não estava marcado (no fim da lista) e desmarca o que estava; não altera a lista recebida. */
export function alternarMarcado(marcados: string[], id: string): string[] {
  return marcados.includes(id) ? marcados.filter((outro) => outro !== id) : [...marcados, id]
}
