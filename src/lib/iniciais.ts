const PREPOSICOES = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

/** Até duas iniciais (primeiro e último nome) para o avatar sem foto. */
export function iniciais(nome: string): string {
  const palavras = nome
    .trim()
    .split(/\s+/)
    .filter((palavra) => palavra && !PREPOSICOES.has(palavra.toLowerCase()))
  if (palavras.length === 0) return '?'
  const primeira = palavras[0][0]
  const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
