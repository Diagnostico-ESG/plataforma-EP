// Aplica UMA migração no banco de DESENVOLVIMENTO, numa transação, e registra a versão.
// Uso: node scripts/aplicar-migracao.mjs <ref-dev> <AAAAMMDDHHMMSS_nome.sql>   (cadeia em SUPABASE_DB_URL)
// O script nunca mostra a cadeia de conexão, que contém a senha do banco.
import { existsSync, readFileSync } from 'node:fs'
import pg from 'pg'
import { caminhoDaMigracao } from './caminhoDaMigracao.mjs'
import { conferirProjeto } from './travaDoProjeto.mjs'

const ARQUIVO_ENV = '.env.banco.local'

function lerConfiguracao() {
  const [ref, nome] = process.argv.slice(2)
  if (!ref || !nome) throw new Error('Uso: node scripts/aplicar-migracao.mjs <ref-dev> <arquivo.sql>')
  if (existsSync(ARQUIVO_ENV)) process.loadEnvFile(ARQUIVO_ENV)
  const url = process.env.SUPABASE_DB_URL
  if (!url) throw new Error(`Faltou a variável SUPABASE_DB_URL (esperada em ${ARQUIVO_ENV} ou no segredo do GitHub).`)
  conferirProjeto(url, ref)
  return { url, nome, caminho: caminhoDaMigracao(nome) }
}

const GARANTIR_REGISTRO = `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key, statements text[], name text)`

async function aplicar({ url, nome, caminho }) {
  const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await cliente.connect()
  const [versao, ...resto] = nome.replace(/\.sql$/, '').split('_')
  try {
    await cliente.query('begin')
    await cliente.query(GARANTIR_REGISTRO)
    const ja = await cliente.query('select 1 from supabase_migrations.schema_migrations where version = $1', [versao])
    if (ja.rowCount) {
      console.log(`::warning::A migração ${nome} já foi aplicada. Nada foi feito.`)
      return await cliente.query('rollback')
    }
    await cliente.query(readFileSync(caminho, 'utf8'))
    await cliente.query('insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)', [versao, resto.join('_')])
    await cliente.query('commit')
    console.log(`Migração ${nome} aplicada.`)
  } catch (erro) {
    await cliente.query('rollback')
    throw erro
  } finally {
    await cliente.end()
  }
}

aplicar(lerConfiguracao()).catch((erro) => {
  console.error(erro.message)
  process.exit(1)
})
