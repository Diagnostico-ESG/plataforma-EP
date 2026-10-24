import { expect, test } from 'vitest'
import { comEnsaio, migracoesPendentes } from './migracoesPendentes.mjs'

const ARQUIVOS = [
  '20261023175017_anotacoes_do_processo.sql',
  '20261024120000_b.sql',
  '20261024110000_a.sql',
  'leia-me.txt',
  '20261024_curto.sql',
]

test('devolve, em ordem, só as migrações mais novas que a última registrada', () => {
  expect(migracoesPendentes(ARQUIVOS, '20261023175017')).toEqual(['20261024110000_a.sql', '20261024120000_b.sql'])
})

test('sem nada mais novo, não há pendência', () => {
  expect(migracoesPendentes(ARQUIVOS, '20261024120000')).toEqual([])
})

test('recusa banco sem registro de migrações, citando o valor recebido', () => {
  expect(() => migracoesPendentes(ARQUIVOS, null)).toThrow('Recebido: null')
})

test('o ensaio abre a transação e põe as migrações antes do teste', () => {
  expect(comEnsaio('select 1;', ['create table x();'])).toBe('begin;\ncreate table x();\nselect 1;')
})

test('sem pendências, o teste vai intacto', () => {
  expect(comEnsaio('select 1;', [])).toBe('select 1;')
})

test('o teste marcado fica fora do ensaio', () => {
  const teste = '-- ensaio: sem migrações pendentes\nselect 1;'
  expect(comEnsaio(teste, ['create table x();'])).toBe(teste)
})
