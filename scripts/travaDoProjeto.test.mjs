import { expect, test } from 'vitest'
import { conferirProjeto } from './travaDoProjeto.mjs'

const REF = 'abcdefghijklmnopqrst'

test.each([
  `postgresql://postgres.${REF}:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:senha@db.${REF}.supabase.co:5432/postgres`,
])('aceita a cadeia do projeto (pooler pelo usuário, direta pelo host): %s', (url) => {
  expect(() => conferirProjeto(url, REF)).not.toThrow()
})

test.each([
  ['o ref só aparece na senha', `postgresql://postgres.outroprojetoxxxxxxxx:${REF}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`],
  ['o ref só aparece no nome do banco', `postgresql://postgres.outroprojetoxxxxxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/${REF}`],
  ['o ref só aparece na consulta', `postgresql://postgres.outroprojetoxxxxxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?x=${REF}`],
  ['o ref é o de outro projeto no host', `postgresql://postgres:senha@db.outroprojetoxxxxxxxx.supabase.co:5432/postgres`],
  ['texto que não é uma cadeia', `isto não é uma cadeia ${REF}`],
])('recusa quando %s, sem mostrar a cadeia', (_motivo, url) => {
  expect(() => conferirProjeto(url, REF)).toThrow(`projeto de desenvolvimento (${REF})`)
  expect(() => conferirProjeto(url, REF)).not.toThrow(/senha|isto não/)
})
