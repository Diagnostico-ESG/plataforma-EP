export type ParteDoNome = { texto: string; achado: boolean }

// Cada letra do nome vira a sua forma sem acento e minúscula; guardar uma entrada por letra mantém as posições
// iguais às do texto original, para marcar o trecho achado sem perder os acentos de quem lê.
function semAcento(letra: string): string {
  return letra.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function formaDeBusca(texto: string): string {
  return [...texto].map(semAcento).join('')
}

export function contemTrecho(nome: string, busca: string): boolean {
  return formaDeBusca(nome).includes(formaDeBusca(busca.trim()))
}

/** O nome cortado em partes, com `achado` nas que casam com a busca (sem diferenciar maiúsculas e acentos). */
export function partesDoNome(nome: string, busca: string): ParteDoNome[] {
  // Espaço nas pontas é de quem digita ("Emitir "), não do nome; contemTrecho faz o mesmo.
  const procurado = [...busca.trim()].map(semAcento)
  const letras = [...nome]
  const formas = letras.map(semAcento)
  const partes: ParteDoNome[] = []
  let inicio = 0
  while (procurado.length > 0) {
    const posicao = acharLetras(formas, procurado, inicio)
    if (posicao < 0) break
    const fim = posicao + procurado.length
    if (posicao > inicio) partes.push({ texto: letras.slice(inicio, posicao).join(''), achado: false })
    partes.push({ texto: letras.slice(posicao, fim).join(''), achado: true })
    inicio = fim
  }
  if (inicio < letras.length) partes.push({ texto: letras.slice(inicio).join(''), achado: false })
  return partes
}

// Compara letra a letra, para a posição achada valer no nome original.
function acharLetras(formas: string[], procurado: string[], desde: number): number {
  for (let i = desde; i + procurado.length <= formas.length; i++) {
    if (procurado.every((letra, k) => formas[i + k] === letra)) return i
  }
  return -1
}
