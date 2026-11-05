// Aplica no banco de PRODUÇÃO todas as migrações que ainda não têm versão registrada, em ordem,
// cada uma na sua transação (falhou, desfaz só ela e para). Registra cada versão em
// supabase_migrations.schema_migrations, o mesmo registro da CLI, para o `supabase migration list` bater depois.
// Uso: node scripts/aplicar-migracoes-producao.mjs <ref-producao> <listar|aplicar>   (cadeia em SUPABASE_DB_URL_PRODUCAO)
// Nunca mostra a cadeia de conexão, que contém a senha do banco. O seed.sql (dados inventados) não é aplicado.
import { readdirSync, readFileSync } from 'node:fs'
import pg from 'pg'
import { caminhoDaMigracao } from './caminhoDaMigracao.mjs'
import { migracoesAindaNaoAplicadas } from './migracoesDaProducao.mjs'
import { conferirProjeto } from './travaDoProjeto.mjs'

const GARANTIR_REGISTRO = `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key, statements text[], name text)`

function lerConfiguracao() {
  const [ref, modo] = process.argv.slice(2)
  if (!ref || !['listar', 'aplicar'].includes(modo)) {
    throw new Error(`Uso: node scripts/aplicar-migracoes-producao.mjs <ref-producao> <listar|aplicar>. Recebido: ref="${ref}", modo="${modo}".`)
  }
  const url = process.env.SUPABASE_DB_URL_PRODUCAO
  if (!url) throw new Error('Faltou o segredo SUPABASE_DB_URL_PRODUCAO (cadeia do Session pooler do projeto de produção).')
  conferirProjeto(url, ref, 'produção')
  return { url, modo }
}

async function aplicarUma(cliente, nome) {
  const [versao, ...resto] = nome.replace(/\.sql$/, '').split('_')
  try {
    await cliente.query('begin')
    await cliente.query(readFileSync(caminhoDaMigracao(nome), 'utf8'))
    await cliente.query('insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)', [versao, resto.join('_')])
    await cliente.query('commit')
    console.log(`Aplicada: ${nome}`)
  } catch (erro) {
    await cliente.query('rollback')
    throw new Error(`Falhou em ${nome} (desfeita; as anteriores ficaram aplicadas): ${erro.message}`)
  }
}

async function executar({ url, modo }) {
  const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await cliente.connect()
  try {
    await cliente.query(GARANTIR_REGISTRO)
    const { rows } = await cliente.query('select version from supabase_migrations.schema_migrations')
    const pendentes = migracoesAindaNaoAplicadas(readdirSync('supabase/migrations'), rows.map((linha) => linha.version))
    console.log(`${pendentes.length} migração(ões) pendente(s) em produção.`)
    if (modo === 'listar') return pendentes.forEach((nome) => console.log(`Pendente: ${nome}`))
    for (const nome of pendentes) await aplicarUma(cliente, nome)
  } finally {
    await cliente.end()
  }
}

try {
  await executar(lerConfiguracao())
} catch (erro) {
  console.error(erro.message)
  process.exit(1)
}
