// Decide quais migrações o workflow "Migrar banco de produção" ainda precisa aplicar.
// Diferente de migracoesPendentes.mjs (que olha só a última versão, para o ensaio no desenvolvimento),
// aqui vale a lista exata de versões registradas: em produção nada pode ficar de fora por ser "antigo".
const FORMATO = /^\d{14}_[a-z0-9_]+\.sql$/

export function migracoesAindaNaoAplicadas(arquivos, versoesAplicadas) {
  const feitas = new Set(versoesAplicadas)
  return arquivos
    .filter((nome) => nome.endsWith('.sql'))
    .map(conferirNome)
    .filter((nome) => !feitas.has(nome.slice(0, 14)))
    .sort()
}

function conferirNome(nome) {
  if (!FORMATO.test(nome)) {
    throw new Error(`Nome de migração inválido. Esperado: AAAAMMDDHHMMSS_nome.sql. Recebido: "${nome}".`)
  }
  return nome
}
