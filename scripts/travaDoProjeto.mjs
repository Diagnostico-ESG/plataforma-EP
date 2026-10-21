// Trava contra o banco errado, usada pelos scripts que rodam contra o banco de desenvolvimento.
// O ref tem de estar no usuário da cadeia do Session pooler (postgres.<ref>) ou no host da conexão
// direta (db.<ref>.supabase.co); achar o ref em qualquer ponto do texto deixava passar um banco
// de outro projeto cujo nome de banco ou senha trouxesse o ref.
export function conferirProjeto(url, ref) {
  if (!cadeiaEhDoProjeto(url, ref)) {
    // A mensagem nunca traz a cadeia: ela contém a senha do banco.
    throw new Error(`A cadeia de conexão não é do projeto de desenvolvimento (${ref}). Esperado: usuário postgres.${ref} ou host db.${ref}.supabase.co. Nada foi executado.`)
  }
}

function cadeiaEhDoProjeto(url, ref) {
  try {
    const { username, hostname } = new URL(url)
    return decodeURIComponent(username) === `postgres.${ref}` || hostname === `db.${ref}.supabase.co`
  } catch {
    return false
  }
}
