import { expect, test } from 'vitest'
import { migracoesAindaNaoAplicadas } from './migracoesDaProducao.mjs'

const A = '20261007200505_login_perfis.sql'
const B = '20261007214206_autorizar_emails.sql'
const C = '20261008125853_gerir_usuarios.sql'

test('banco vazio: todas as migrações, em ordem de versão', () => {
  expect(migracoesAindaNaoAplicadas([C, A, B], [])).toEqual([A, B, C])
})

test('só devolve as que ainda não têm versão registrada', () => {
  expect(migracoesAindaNaoAplicadas([A, B, C], ['20261007200505'])).toEqual([B, C])
})

test('tudo aplicado: nada a fazer', () => {
  expect(migracoesAindaNaoAplicadas([A, B], ['20261007200505', '20261007214206'])).toEqual([])
})

test('uma migração antiga que falta é aplicada, em vez de ficar de fora pela última versão', () => {
  expect(migracoesAindaNaoAplicadas([A, B, C], ['20261007200505', '20261008125853'])).toEqual([B])
})

test('ignora o que não é .sql', () => {
  expect(migracoesAindaNaoAplicadas(['.gitkeep', A], [])).toEqual([A])
})

test('recusa .sql com nome fora do formato, mostrando o valor e o formato esperado', () => {
  expect(() => migracoesAindaNaoAplicadas(['setores.sql'], [])).toThrow(
    'Esperado: AAAAMMDDHHMMSS_nome.sql. Recebido: "setores.sql".',
  )
})
