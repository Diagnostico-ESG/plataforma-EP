import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'

const destino = 'src/types/database.ts'
const alvo = process.argv.slice(2)
const saida = execFileSync('npx', ['supabase', 'gen', 'types', 'typescript', ...alvo], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
if (!saida.includes('export type')) {
  throw new Error(`A saída não parece um arquivo de tipos: ${saida.slice(0, 200)}`)
}
mkdirSync('src/types', { recursive: true })
writeFileSync(`${destino}.tmp`, saida)
renameSync(`${destino}.tmp`, destino)
