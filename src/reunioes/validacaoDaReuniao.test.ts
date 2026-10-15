import { expect, test } from 'vitest'
import { CAMPOS_DA_REUNIAO_EM_BRANCO, type CamposDaReuniao, comMudanca, dadosDaReuniao, faltaPreencher } from './validacaoDaReuniao'

const PREENCHIDOS: CamposDaReuniao = {
  tipo: 'modelagem', setorId: 's1', processosIds: ['p1'], data: '2026-10-20', hora: '', local: '', anotacoes: '',
}

test('falta preencher quando falta tipo, setor ou data', () => {
  expect(faltaPreencher(CAMPOS_DA_REUNIAO_EM_BRANCO)).toBe(true)
  expect(faltaPreencher({ ...PREENCHIDOS, tipo: '' })).toBe(true)
  expect(faltaPreencher({ ...PREENCHIDOS, setorId: '' })).toBe(true)
  expect(faltaPreencher({ ...PREENCHIDOS, data: '' })).toBe(true)
  expect(faltaPreencher(PREENCHIDOS)).toBe(false)
})

test('a modelagem precisa de processo; a sensibilização não', () => {
  expect(faltaPreencher({ ...PREENCHIDOS, processosIds: [] })).toBe(true)
  expect(faltaPreencher({ ...PREENCHIDOS, tipo: 'sensibilizacao', processosIds: [] })).toBe(false)
})

test('trocar o setor ou passar para sensibilização desmarca os processos; outras mudanças não', () => {
  expect(comMudanca(PREENCHIDOS, { setorId: 's2' }).processosIds).toEqual([])
  expect(comMudanca(PREENCHIDOS, { tipo: 'sensibilizacao' }).processosIds).toEqual([])
  expect(comMudanca(PREENCHIDOS, { local: 'Sala 1' }).processosIds).toEqual(['p1'])
  expect(comMudanca(PREENCHIDOS, { setorId: 's1' }).processosIds).toEqual(['p1'])
})

test('os dados gravados trazem hora, local e anotações aparados, com nulo no lugar do vazio', () => {
  expect(dadosDaReuniao({ ...PREENCHIDOS, hora: '09:30', local: ' Sala 1 ', anotacoes: '   ' })).toEqual({
    tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: '09:30', local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
  })
})
