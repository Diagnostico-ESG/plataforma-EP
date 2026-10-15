import { expect, test } from 'vitest'
import { estadoDoEventoDaReuniao } from './estadoDoEvento'
import type { Reuniao } from './tipos'

const REUNIAO: Reuniao = {
  id: 'r1', tipo: 'modelagem', setorId: 's1', setorSigla: 'TSA', setorAtivo: true, data: '2026-10-14', hora: '09:30',
  local: 'Sala 1', anotacoes: null, outrosParticipantes: ['Ana'],
  processos: [{ id: 'p1', nome: 'Emitir Ofício', cancelado: false }],
  usuarios: [{ id: 'u1', nome: 'Bia Teste', ativo: false }], responsaveis: [{ id: 'x1', nome: 'Caio Teste' }],
}

test('o estado do evento tem as chaves que o banco grava (private.estado_da_reuniao)', () => {
  expect(estadoDoEventoDaReuniao(REUNIAO)).toEqual({
    tipo: 'modelagem', setor_id: 's1', setor_sigla: 'TSA', data: '2026-10-14', hora: '09:30', local: 'Sala 1',
    anotacoes: null, outros_participantes: ['Ana'], processos: [{ id: 'p1', nome: 'Emitir Ofício' }],
    usuarios: [{ id: 'u1', nome: 'Bia Teste' }], responsaveis: [{ id: 'x1', nome: 'Caio Teste' }],
  })
})

test('duas reuniões com os mesmos dados dão o mesmo estado, e uma mudança de dado muda o estado', () => {
  expect(estadoDoEventoDaReuniao({ ...REUNIAO })).toEqual(estadoDoEventoDaReuniao(REUNIAO))
  expect(estadoDoEventoDaReuniao({ ...REUNIAO, local: 'Sala 2' })).not.toEqual(estadoDoEventoDaReuniao(REUNIAO))
})
