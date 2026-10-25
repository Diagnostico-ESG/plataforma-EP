import { expect, test } from 'vitest'
import { LIMITE_DE_DIAS_NA_ETAPA, diasDoProcessoNaEtapa, diasDoProcessoParado, diasNaEtapa, passouDoLimite, textoDosDias } from './diasNaEtapa'
import type { ProcessoDaLista } from './tipos'

test('conta os dias da entrada até hoje, atravessando mês e ano', () => {
  expect(diasNaEtapa('2026-10-01', '2026-10-07')).toBe(6)
  expect(diasNaEtapa('2026-12-30', '2027-01-02')).toBe(3)
})

test('o mesmo dia é 0, entrada no futuro também (nunca negativo) e sem entrada é null', () => {
  expect(diasNaEtapa('2026-10-07', '2026-10-07')).toBe(0)
  expect(diasNaEtapa('2026-10-09', '2026-10-07')).toBe(0)
  expect(diasNaEtapa(null, '2026-10-07')).toBeNull()
})

test('o horário de verão não muda a conta', () => {
  expect(diasNaEtapa('2026-03-07', '2026-03-09')).toBe(2)
  expect(diasNaEtapa('2026-10-30', '2026-11-02')).toBe(3)
})

test('até 7 dias é número cinza; a partir do oitavo, o selo âmbar', () => {
  expect(LIMITE_DE_DIAS_NA_ETAPA).toBe(7)
  expect(passouDoLimite(7)).toBe(false)
  expect(passouDoLimite(8)).toBe(true)
})

test('o texto dos dias concorda: hoje, há 1 dia, há 6 dias', () => {
  expect([0, 1, 6].map(textoDosDias)).toEqual(['hoje', 'há 1 dia', 'há 6 dias'])
})

const etapa = (codigo: string): ProcessoDaLista['etapaAtual'] => ({ id: codigo, codigo, nome: codigo, ordem: 3, posicao: 3, total: 8 })
const contagem = (codigo: string, situacao: ProcessoDaLista['situacao'] = 'em_andamento', entrouNaEtapaEm: string | null = '2026-10-01') =>
  diasDoProcessoNaEtapa({ situacao, etapaAtual: etapa(codigo), entrouNaEtapaEm }, '2026-10-09')

test('o processo em andamento numa etapa de trabalho conta os dias', () => {
  expect(contagem('revisao_interna')).toBe(8)
})

test('Não iniciados, Concluídos, suspenso, cancelado e sem entrada não contam', () => {
  expect(contagem('nao_iniciados')).toBeNull()
  expect(contagem('concluidos', 'concluido')).toBeNull()
  expect(contagem('revisao_interna', 'suspenso')).toBeNull()
  expect(contagem('revisao_interna', 'cancelado')).toBeNull()
  expect(contagem('revisao_interna', 'em_andamento', null)).toBeNull()
  expect(diasDoProcessoNaEtapa({ situacao: 'em_andamento', etapaAtual: null }, '2026-10-09')).toBeNull()
})

test('parado é só quem passou de 7 dias: 7 não, 8 sim, e nunca onde a contagem é null', () => {
  const parado = (codigo: string, entrouNaEtapaEm: string, situacao: ProcessoDaLista['situacao'] = 'em_andamento') =>
    diasDoProcessoParado({ situacao, etapaAtual: etapa(codigo), entrouNaEtapaEm }, '2026-10-09')
  expect(parado('revisao_interna', '2026-10-02')).toBeNull()
  expect(parado('revisao_interna', '2026-10-01')).toBe(8)
  expect(parado('nao_iniciados', '2026-09-01')).toBeNull()
  expect(parado('revisao_interna', '2026-09-01', 'suspenso')).toBeNull()
})
