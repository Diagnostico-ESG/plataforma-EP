import { expect, test } from 'vitest'
import type { Reuniao } from './tipos'
import {
  CAMPOS_DA_REUNIAO_EM_BRANCO, type CamposDaReuniao, camposDaReuniao, comMudanca, dadosDaReuniao, faltaPreencher,
} from './validacaoDaReuniao'

const PREENCHIDOS: CamposDaReuniao = {
  tipo: 'modelagem', setorId: 's1', processosIds: ['p1'], data: '2026-10-20', hora: '', local: '', anotacoes: '',
  usuariosIds: ['u1'], responsaveisIds: ['x1'], outrosParticipantes: '',
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

test('trocar o setor desmarca os responsáveis, mas não os usuários; trocar o tipo não desmarca nenhum dos dois', () => {
  const trocado = comMudanca(PREENCHIDOS, { setorId: 's2' })
  expect(trocado.responsaveisIds).toEqual([])
  expect(trocado.usuariosIds).toEqual(['u1'])
  expect(comMudanca(PREENCHIDOS, { tipo: 'sensibilizacao' })).toMatchObject({ usuariosIds: ['u1'], responsaveisIds: ['x1'] })
})

test('os dados gravados trazem hora, local e anotações aparados, com nulo no lugar do vazio', () => {
  expect(dadosDaReuniao({ ...PREENCHIDOS, hora: '09:30', local: ' Sala 1 ', anotacoes: '   ' })).toEqual({
    tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: '09:30', local: 'Sala 1', anotacoes: null, processosIds: ['p1'],
    usuariosIds: ['u1'], responsaveisIds: ['x1'], outrosParticipantes: [],
  })
})

test('os outros participantes são um por linha: aparados, sem linhas vazias', () => {
  const campos = { ...PREENCHIDOS, outrosParticipantes: '  Gil Externo  \n\n   \nHilda Externa\r\n' }
  expect(dadosDaReuniao(campos).outrosParticipantes).toEqual(['Gil Externo', 'Hilda Externa'])
  expect(dadosDaReuniao(PREENCHIDOS).outrosParticipantes).toEqual([])
})

const REUNIAO: Reuniao = {
  id: 'r1', tipo: 'modelagem', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data: '2026-10-20', hora: '09:30', local: 'Sala 1',
  anotacoes: 'Pauta', outrosParticipantes: ['Ana', 'Bia'],
  processos: [{ id: 'p1', nome: 'Emitir Ofício', cancelado: false }, { id: 'p2', nome: 'Arquivar Pasta', cancelado: true }],
  usuarios: [{ id: 'u1', nome: 'Ana Teste', ativo: true }, { id: 'u2', nome: 'Caio Teste', ativo: false }],
  responsaveis: [{ id: 'x1', nome: 'Dani Teste' }],
}

test('os campos da edição partem da reunião, com texto vazio no lugar de nulo', () => {
  expect(camposDaReuniao(REUNIAO)).toEqual({
    tipo: 'modelagem', setorId: 's1', processosIds: ['p1', 'p2'], data: '2026-10-20', hora: '09:30', local: 'Sala 1',
    anotacoes: 'Pauta', usuariosIds: ['u1', 'u2'], responsaveisIds: ['x1'], outrosParticipantes: 'Ana\nBia',
  })
  expect(camposDaReuniao({ ...REUNIAO, hora: null, local: null, anotacoes: null })).toMatchObject({ hora: '', local: '', anotacoes: '' })
})

test('salvar a edição sem mexer devolve os mesmos dados da reunião, inclusive os outros participantes', () => {
  expect(dadosDaReuniao(camposDaReuniao(REUNIAO))).toEqual({
    tipo: 'modelagem', setorId: 's1', data: '2026-10-20', hora: '09:30', local: 'Sala 1', anotacoes: 'Pauta',
    processosIds: ['p1', 'p2'], usuariosIds: ['u1', 'u2'], responsaveisIds: ['x1'], outrosParticipantes: ['Ana', 'Bia'],
  })
})

test('na edição, trocar o setor ou o tipo desmarca os processos da reunião', () => {
  expect(comMudanca(camposDaReuniao(REUNIAO), { setorId: 's2' }).processosIds).toEqual([])
  expect(comMudanca(camposDaReuniao(REUNIAO), { tipo: 'sensibilizacao' }).processosIds).toEqual([])
})
