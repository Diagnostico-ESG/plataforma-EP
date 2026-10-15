import { expect, test } from 'vitest'
import { reuniao } from '../testes/reunioesDeTeste'
import { reunioesDoProcesso, reunioesDoSetor } from './reunioesLigadas'

const PAGAR = { id: 'p3', nome: 'Pagar Diária', cancelado: false }
const REUNIOES = [
  reuniao('r1', '2026-10-20'),
  reuniao('r2', '2026-11-02', { tipo: 'modelagem', setorId: 's2', setorSigla: 'TSB', processos: [PAGAR] }),
  reuniao('r3', '2026-09-05', { setorId: 's2', setorSigla: 'TSB' }),
]

test('as reuniões do setor são só as do setor, de qualquer tipo', () => {
  expect(reunioesDoSetor(REUNIOES, 's2').map((r) => r.id)).toEqual(['r2', 'r3'])
})

test('setor sem reunião devolve lista vazia', () => {
  expect(reunioesDoSetor(REUNIOES, 's9')).toEqual([])
})

test('as reuniões do processo são só as que o trataram (a sensibilização nunca aparece)', () => {
  expect(reunioesDoProcesso(REUNIOES, 'p3').map((r) => r.id)).toEqual(['r2'])
  expect(reunioesDoProcesso(REUNIOES, 'p1')).toEqual([])
})
