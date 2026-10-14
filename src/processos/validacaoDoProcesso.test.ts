import { expect, test } from 'vitest'
import { dadosDoProcesso, problemaNoProcesso } from './validacaoDoProcesso'

const CAMPOS = {
  nome: 'Emitir Ofício', setorId: 's1', macroprocessoId: 'm1', tipo: 'a_classificar' as const, origem: 'novo' as const,
  contexto: '', observacoes: '',
}

test('campos obrigatórios preenchidos: nenhum problema', () => {
  expect(problemaNoProcesso(CAMPOS)).toBeNull()
})

test.each([
  [{ nome: '   ' }, 'O nome do processo é obrigatório.'],
  [{ setorId: '' }, 'Escolha o setor do processo.'],
  [{ macroprocessoId: '' }, 'Escolha o macroprocesso do processo.'],
])('%o é recusado com a frase da tela', (mudanca, frase) => {
  expect(problemaNoProcesso({ ...CAMPOS, ...mudanca })).toBe(frase)
})

test('dados saem sem espaços nas pontas e com textos vazios como nulos', () => {
  expect(dadosDoProcesso({ ...CAMPOS, nome: ' Emitir Ofício ', contexto: ' ', observacoes: ' Nota ' })).toEqual({
    nome: 'Emitir Ofício', setorId: 's1', macroprocessoId: 'm1', tipo: 'a_classificar', processoPaiId: null,
    origem: 'novo', contexto: null, observacoes: 'Nota',
  })
})
