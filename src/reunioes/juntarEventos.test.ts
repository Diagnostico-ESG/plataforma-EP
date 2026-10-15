import { expect, test } from 'vitest'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { juntarEventos } from './juntarEventos'

function evento(id: number, ocorridoEm: string): EventoDoCadastro {
  return { id, ocorridoEm, autor: 'Pessoa de Teste', acao: 'editar', entidade: 'processo', entidadeRef: 'p1', antes: null, depois: null }
}

test('junta as duas listas, do mais recente para o mais antigo', () => {
  const juntos = juntarEventos([evento(1, '2026-10-01T10:00:00Z'), evento(4, '2026-10-03T10:00:00Z')], [evento(2, '2026-10-02T10:00:00Z')])
  expect(juntos.map((e) => e.id)).toEqual([4, 2, 1])
})

test('no mesmo instante, o id maior vem primeiro', () => {
  const juntos = juntarEventos([evento(5, '2026-10-01T10:00:00Z')], [evento(6, '2026-10-01T10:00:00Z')])
  expect(juntos.map((e) => e.id)).toEqual([6, 5])
})

test('com uma lista vazia, devolve a outra na mesma ordem', () => {
  expect(juntarEventos([], [evento(1, '2026-10-01T10:00:00Z')]).map((e) => e.id)).toEqual([1])
})
