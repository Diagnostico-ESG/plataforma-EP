const FORMATO_INSTITUCIONAL = /^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$/
const FORMATO_ESPERADO = 'nome@ccivil.pr.gov.br'

// Mesma normalização do banco (private.preparar_autorizacao): minúsculas e sem espaços nas pontas.
export function normalizarEmail(texto: string): string {
  return texto.trim().toLowerCase()
}

export function problemaNoEmail(texto: string): string | null {
  if (FORMATO_INSTITUCIONAL.test(normalizarEmail(texto))) return null
  return `O e-mail "${texto.trim()}" não está no formato esperado: ${FORMATO_ESPERADO}.`
}
