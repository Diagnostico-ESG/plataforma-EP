import { expect, test } from 'vitest'
import { ehProxima, hojeLocal, ordenarReunioes, semAnotacoes } from './quandoAcontece'
import type { Reuniao } from './tipos'

const HOJE = '2026-10-14'

function reuniao(id: string, data: string, mudancas: Partial<Reuniao> = {}): Reuniao {
  return {
    id, tipo: 'sensibilizacao', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data, hora: null, local: null,
    anotacoes: null, outrosParticipantes: [], processos: [], ...mudancas,
  }
}

test('a reunião depois de hoje é próxima; a de hoje e as anteriores são realizadas', () => {
  expect(ehProxima('2026-10-15', HOJE)).toBe(true)
  expect(ehProxima('2026-10-14', HOJE)).toBe(false)
  expect(ehProxima('2026-10-13', HOJE)).toBe(false)
})

test('hojeLocal devolve o dia de hoje no formato AAAA-MM-DD', () => {
  expect(hojeLocal(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04')
})

test('as próximas vêm primeiro, da mais próxima à mais distante; as realizadas depois, da mais recente à mais antiga', () => {
  const ordenadas = ordenarReunioes([
    reuniao('antiga', '2026-09-01'), reuniao('longe', '2026-12-01'), reuniao('hoje', HOJE),
    reuniao('perto', '2026-10-20'), reuniao('recente', '2026-10-10'),
  ], HOJE)
  expect(ordenadas.map((r) => r.id)).toEqual(['perto', 'longe', 'hoje', 'recente', 'antiga'])
})

test('no mesmo dia, a de hora mais cedo vem antes na próxima e depois na realizada; sem hora fica por último no dia', () => {
  const proximas = ordenarReunioes([
    reuniao('b', '2026-10-20', { hora: '14:00' }), reuniao('a', '2026-10-20', { hora: '09:00' }), reuniao('s', '2026-10-20'),
  ], HOJE)
  expect(proximas.map((r) => r.id)).toEqual(['a', 'b', 's'])
  const realizadas = ordenarReunioes([
    reuniao('a', '2026-10-01', { hora: '09:00' }), reuniao('b', '2026-10-01', { hora: '14:00' }),
  ], HOJE)
  expect(realizadas.map((r) => r.id)).toEqual(['b', 'a'])
})

test('a marca "sem anotações" só vale na realizada sem anotações', () => {
  expect(semAnotacoes(reuniao('1', '2026-10-01'), HOJE)).toBe(true)
  expect(semAnotacoes(reuniao('2', HOJE), HOJE)).toBe(true)
  expect(semAnotacoes(reuniao('3', '2026-10-01', { anotacoes: 'Algo' }), HOJE)).toBe(false)
  expect(semAnotacoes(reuniao('4', '2026-10-20'), HOJE)).toBe(false)
})
