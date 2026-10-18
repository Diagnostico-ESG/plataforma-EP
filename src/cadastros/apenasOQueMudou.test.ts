import { expect, test } from 'vitest'
import { apenasOQueMudou } from './apenasOQueMudou'

test('na alteração, só os campos que diferem, dos dois lados', () => {
  expect(apenasOQueMudou({ nome: 'A', data_da_reuniao: '2026-10-14' }, { nome: 'A', data_da_reuniao: '2026-10-20' }))
    .toEqual([{ data_da_reuniao: '2026-10-14' }, { data_da_reuniao: '2026-10-20' }])
})

test('criação e exclusão (um dos lados nulo) ficam como estão', () => {
  expect(apenasOQueMudou(null, { nome: 'A' })).toEqual([null, { nome: 'A' }])
  expect(apenasOQueMudou({ nome: 'A' }, null)).toEqual([{ nome: 'A' }, null])
})
