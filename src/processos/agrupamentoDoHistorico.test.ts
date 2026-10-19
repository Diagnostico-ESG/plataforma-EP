import { describe, expect, test } from 'vitest'
import type { EventoDoCadastro } from '../cadastros/tipos'
import { agruparPorDia } from './agrupamentoDoHistorico'

// Datas locais (sem "Z"), para o teste valer em qualquer fuso.
const AGORA = new Date('2026-10-19T10:00:00')

function evento(id: number, ocorridoEm: string): EventoDoCadastro {
  return { id, ocorridoEm: new Date(ocorridoEm).toISOString(), autor: 'Ana Teste', acao: 'editar', entidade: 'processo',
    entidadeRef: 'p1', antes: null, depois: null }
}

const rotulos = (grupos: ReturnType<typeof agruparPorDia>) => grupos.map((grupo) => grupo.rotulo)

describe('agruparPorDia', () => {
  test('sem eventos, nenhum grupo', () => {
    expect(agruparPorDia([], AGORA)).toEqual([])
  })

  test('hoje, ontem e uma data antiga viram "Hoje", "Ontem" e "dd/mm", na ordem recebida', () => {
    const grupos = agruparPorDia([
      evento(3, '2026-10-19T09:00:00'), evento(2, '2026-10-18T16:00:00'), evento(1, '2026-10-12T08:00:00'),
    ], AGORA)
    expect(rotulos(grupos)).toEqual(['Hoje', 'Ontem', '12/10'])
  })

  test('eventos do mesmo dia ficam no mesmo grupo, na ordem recebida', () => {
    const grupos = agruparPorDia([evento(3, '2026-10-19T09:30:00'), evento(2, '2026-10-19T08:00:00')], AGORA)
    expect(grupos).toHaveLength(1)
    expect(grupos[0].eventos.map((outro) => outro.id)).toEqual([3, 2])
  })

  test('o dia vale na hora local: 23h30 de ontem não é "Hoje"', () => {
    expect(rotulos(agruparPorDia([evento(1, '2026-10-18T23:30:00')], AGORA))).toEqual(['Ontem'])
  })

  test('ontem atravessa a virada do mês', () => {
    expect(rotulos(agruparPorDia([evento(1, '2026-09-30T12:00:00')], new Date('2026-10-01T09:00:00')))).toEqual(['Ontem'])
  })

  test('de outro ano, o rótulo leva o ano', () => {
    expect(rotulos(agruparPorDia([evento(1, '2025-12-31T12:00:00')], AGORA))).toEqual(['31/12/2025'])
  })
})
