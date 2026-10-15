import { expect, test } from 'vitest'
import { setoresDaEscolha } from './setoresDaEscolha'
import type { Reuniao, SetorParaReuniao } from './tipos'

const ATIVOS: SetorParaReuniao[] = [
  { id: 's1', sigla: 'TSA', nome: 'Setor A' },
  { id: 's2', sigla: 'TSB', nome: 'Setor B' },
]

function reuniaoDoSetor(setorId: string, setorSigla: string, setorAtivo: boolean): Reuniao {
  return {
    id: 'r1', tipo: 'sensibilizacao', setorId, setorSigla, setorAtivo, data: '2026-10-20', hora: null, local: null,
    anotacoes: null, outrosParticipantes: [], processos: [], usuarios: [], responsaveis: [],
  }
}

test('sem reunião (registro novo), só os setores ativos', () => {
  expect(setoresDaEscolha(ATIVOS)).toEqual(ATIVOS)
})

test('reunião em setor ativo: a lista não muda', () => {
  expect(setoresDaEscolha(ATIVOS, reuniaoDoSetor('s1', 'TSA', true))).toEqual(ATIVOS)
})

test('reunião em setor que ficou inativo: ele entra na lista, marcado, na ordem da sigla', () => {
  expect(setoresDaEscolha(ATIVOS, reuniaoDoSetor('s3', 'TSC', false))).toEqual([
    ...ATIVOS, { id: 's3', sigla: 'TSC', nome: '', inativo: true },
  ])
  expect(setoresDaEscolha(ATIVOS, reuniaoDoSetor('s0', 'TSA0', false)).map((setor) => setor.sigla))
    .toEqual(['TSA', 'TSA0', 'TSB'])
})
