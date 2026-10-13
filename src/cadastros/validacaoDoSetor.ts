// O banco confere de novo (restrição setores_sigla_formato); aqui a pessoa vê o problema antes de enviar.
const FORMATO_DA_SIGLA = /^[A-Z0-9-]{2,15}$/

export function normalizarSigla(valor: string): string {
  return valor.trim().toUpperCase()
}

export function problemaNoSetor(nome: string, sigla: string): string | null {
  if (nome.trim() === '') return 'O nome do setor é obrigatório.'
  if (FORMATO_DA_SIGLA.test(normalizarSigla(sigla))) return null
  return `A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "${sigla}".`
}
