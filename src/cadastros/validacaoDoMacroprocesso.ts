// O banco confere de novo (restrições de tamanho e o gatilho que troca código vazio por nulo).
export function normalizarCodigo(valor: string): string | null {
  return valor.trim() || null
}

export function problemaNoMacroprocesso(nome: string): string | null {
  return nome.trim() === '' ? 'O nome do macroprocesso é obrigatório.' : null
}
