// Confere a senha interna que o banco envia à função das planilhas no cabeçalho `x-senha-interna`
// (exportacao-e-manutencao, ticket 03; ADR 0018). A comparação não para no primeiro byte diferente, para o tempo
// de resposta não revelar quantos bytes estavam certos. Arquivo puro, testado no Vitest.
export function senhaConfere(recebida: string | null | undefined, esperada: string): boolean {
  if (!recebida || !esperada) return false
  const lida = new TextEncoder().encode(recebida)
  const certa = new TextEncoder().encode(esperada)
  let diferenca = lida.length ^ certa.length
  for (let i = 0; i < certa.length; i++) diferenca |= (lida[i] ?? 0) ^ certa[i]
  return diferenca === 0
}
