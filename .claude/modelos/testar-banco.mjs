// Roda os testes de banco (pgTAP) de supabase/tests/ sem Docker.
// O `supabase test db` roda dentro de um contêiner; este script faz o mesmo trabalho
// conectando direto ao banco de DESENVOLVIMENTO.
//
// Uso: node scripts/testar-banco.mjs <ref-do-projeto-dev> [arquivo.test.sql ...]
// A cadeia de conexão vem da variável SUPABASE_DB_URL, lida do arquivo .env.banco.local
// (ignorado pelo git). O script nunca mostra a cadeia, que contém a senha do banco.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const PASTA = 'supabase/tests'
const ARQUIVO_ENV = '.env.banco.local'

function lerConfiguracao() {
  const [ref, ...arquivos] = process.argv.slice(2)
  if (!ref) throw new Error('Faltou o ref do projeto de desenvolvimento. Uso: node scripts/testar-banco.mjs <ref-dev>')
  if (existsSync(ARQUIVO_ENV)) process.loadEnvFile(ARQUIVO_ENV)
  const url = process.env.SUPABASE_DB_URL
  if (!url) throw new Error(`Faltou a variável SUPABASE_DB_URL (esperada em ${ARQUIVO_ENV}).`)
  // Trava contra o banco errado: a cadeia precisa citar o ref do projeto de desenvolvimento.
  if (!url.includes(ref)) {
    throw new Error(`A cadeia de conexão não é do projeto de desenvolvimento (${ref}). Nada foi executado.`)
  }
  return { url, arquivos }
}

function listarTestes(pedidos) {
  if (pedidos.length) return pedidos
  if (!existsSync(PASTA)) return []
  return readdirSync(PASTA).filter((n) => n.endsWith('.sql')).sort().map((n) => join(PASTA, n))
}

// Junta num texto só tudo o que o pgTAP devolveu (cada função devolve linhas "ok" / "not ok").
function linhasDoTap(resultados) {
  const lista = Array.isArray(resultados) ? resultados : [resultados]
  return lista.flatMap((r) => (r.rows ?? []).flatMap((linha) => Object.values(linha)))
    .filter((v) => typeof v === 'string')
    .flatMap((v) => v.split('\n'))
}

const falhou = (linha) => /^not ok\b/.test(linha) || /^# Looks like/.test(linha)

async function rodarArquivo(url, caminho) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('host=/')
  const cliente = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } })
  await cliente.connect()
  try {
    // O pgTAP fica no schema "extensions" do Supabase.
    await cliente.query("select set_config('search_path', current_setting('search_path') || ', extensions', false)")
    const linhas = linhasDoTap(await cliente.query(readFileSync(caminho, 'utf8')))
    const temPlano = linhas.some((l) => /^1\.\.\d+/.test(l))
    const falhas = linhas.filter(falhou)
    if (!temPlano) falhas.push('o arquivo não devolveu um plano de testes (falta "select plan(n)" ou "select * from finish()"?)')
    return { linhas, falhas }
  } catch (erro) {
    return { linhas: [], falhas: [`erro de SQL: ${erro.message}`] }
  } finally {
    await cliente.end() // encerra a sessão; a transação aberta pelo teste é desfeita
  }
}

async function principal() {
  const { url, arquivos } = lerConfiguracao()
  const testes = listarTestes(arquivos)
  if (testes.length === 0) throw new Error(`Nenhum teste encontrado em ${PASTA}.`)
  let comFalha = 0
  for (const caminho of testes) {
    const { linhas, falhas } = await rodarArquivo(url, caminho)
    const ok = linhas.filter((l) => /^ok\b/.test(l)).length
    const reprovados = linhas.filter((l) => /^not ok\b/.test(l)).length
    console.log(`${falhas.length ? 'FALHOU' : 'passou'}  ${caminho}  (${ok} ok, ${reprovados} reprovado(s))`)
    for (const f of falhas) console.log(`        ${f}`)
    for (const l of linhas.filter((x) => /^#\s+(Failed|have|want|got|expected)/i.test(x.trim()) || /^#\s{2,}/.test(x))) console.log(`        ${l}`)
    if (falhas.length) comFalha++
  }
  console.log(`\n${testes.length - comFalha} de ${testes.length} arquivo(s) de teste passaram.`)
  process.exit(comFalha ? 1 : 0)
}

principal().catch((erro) => {
  console.error(erro.message)
  process.exit(1)
})
