const LIMITE_DE_CARACTERES = 240
const LIMITE_DE_LINHAS = 3

/**
 * Texto do Sobre que ganha "Ler mais". ponytail: conta caracteres e quebras de linha em vez de medir a altura, que o
 * jsdom dos testes não calcula; o corte visual em 4 linhas é do CSS. Medir só se o corte errar com frequência.
 */
export function ehTextoLongo(texto: string): boolean {
  return texto.length > LIMITE_DE_CARACTERES || texto.split('\n').length > LIMITE_DE_LINHAS
}
