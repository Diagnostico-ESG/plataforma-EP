import { expect, test } from 'vitest'
import { SEM_FILTROS_DAS_REUNIOES } from './enderecoDasReunioes'
import { filtrarReunioes, temFiltro } from './filtrosDasReunioes'
import type { Reuniao } from './tipos'

function reuniao(id: string, mudancas: Partial<Reuniao>): Reuniao {
  return {
    id, tipo: 'sensibilizacao', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data: '2026-10-10', hora: null,
    local: null, anotacoes: null, outrosParticipantes: [], processos: [], ...mudancas,
  }
}

const REUNIOES = [
  reuniao('a', { data: '2026-10-01' }),
  reuniao('b', { data: '2026-10-15', tipo: 'modelagem' }),
  reuniao('c', { data: '2026-10-31', setorId: 's2' }),
]
const ids = (lista: Reuniao[]) => lista.map((r) => r.id)

test('sem filtro, todas passam', () => {
  expect(ids(filtrarReunioes(REUNIOES, SEM_FILTROS_DAS_REUNIOES))).toEqual(['a', 'b', 'c'])
  expect(temFiltro(SEM_FILTROS_DAS_REUNIOES)).toBe(false)
})

test('filtra por setor e por tipo', () => {
  expect(ids(filtrarReunioes(REUNIOES, { ...SEM_FILTROS_DAS_REUNIOES, setor: 's2' }))).toEqual(['c'])
  expect(ids(filtrarReunioes(REUNIOES, { ...SEM_FILTROS_DAS_REUNIOES, tipo: 'modelagem' }))).toEqual(['b'])
})

test('o período é inclusivo nas duas pontas e cada ponta pode faltar', () => {
  expect(ids(filtrarReunioes(REUNIOES, { ...SEM_FILTROS_DAS_REUNIOES, de: '2026-10-15', ate: '2026-10-31' }))).toEqual(['b', 'c'])
  expect(ids(filtrarReunioes(REUNIOES, { ...SEM_FILTROS_DAS_REUNIOES, ate: '2026-10-01' }))).toEqual(['a'])
  expect(temFiltro({ ...SEM_FILTROS_DAS_REUNIOES, de: '2026-10-15' })).toBe(true)
})
