import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { recusaDeProcessos } from './recusasDeProcessos'

test.each([
  ['setor_com_processos:2', 'Não é possível excluir: setor tem 2 processos ligados.'],
  ['setor_com_processos:1', 'Não é possível excluir: setor tem 1 processo ligado.'],
  ['macroprocesso_com_processos:3', 'Não é possível excluir: macroprocesso tem 3 processos ligados.'],
  ['setor_com_processos_no_macroprocesso:TSA:2',
    'O setor TSA tem 2 processos neste macroprocesso; mova-os ou exclua-os antes.'],
  ['setor_com_processos_no_macroprocesso:TSA:1',
    'O setor TSA tem 1 processo neste macroprocesso; mova-o ou exclua-o antes.'],
])('%s vira a frase pronta da tela', (message, frase) => {
  const recusa = recusaDeProcessos({ message, code: 'P0001' })
  expect(recusa).toBeInstanceOf(TravaDoBanco)
  expect(recusa?.message).toBe(frase)
})

test('outro erro do banco não é desta recusa', () => {
  expect(recusaDeProcessos({ message: 'violates row-level security', code: '42501' })).toBeNull()
})
