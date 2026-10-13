const FORMATO = /^\d{14}_[a-z0-9_]+\.sql$/

/** Só nomes simples de arquivo: o valor vem de um campo de texto do GitHub e vira caminho de leitura. */
export function caminhoDaMigracao(nome) {
  if (!FORMATO.test(nome)) {
    throw new Error(`Nome de migração inválido. Formato esperado: AAAAMMDDHHMMSS_nome.sql. Recebido: "${nome}".`)
  }
  return `supabase/migrations/${nome}`
}
