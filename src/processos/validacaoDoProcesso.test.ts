import { expect, test } from 'vitest'
import type { TipoDeProcesso } from './tipos'
import { dadosDoProcesso, problemaNoProcesso } from './validacaoDoProcesso'

const CAMPOS = {
  nome: 'Emitir Ofício', setorId: 's1', macroprocessoId: 'm1', tipo: 'a_classificar' as TipoDeProcesso, processoPaiId: '',
  anotacoes: '',
}

test('campos obrigatórios preenchidos: nenhum problema', () => {
  expect(problemaNoProcesso(CAMPOS)).toBeNull()
})

test.each([
  [{ nome: '   ' }, 'O nome do processo é obrigatório.'],
  [{ setorId: '' }, 'Escolha o setor do processo.'],
  [{ macroprocessoId: '' }, 'Escolha o macroprocesso do processo.'],
  [{ tipo: 'subprocesso' as TipoDeProcesso }, 'Escolha o processo pai.'],
])('%o é recusado com a frase da tela', (mudanca, frase) => {
  expect(problemaNoProcesso({ ...CAMPOS, ...mudanca })).toBe(frase)
})

test('dados saem sem espaços nas pontas no nome e com as Anotações vazias como nulas', () => {
  expect(dadosDoProcesso({ ...CAMPOS, nome: ' Emitir Ofício ', anotacoes: '  ' })).toEqual({
    nome: 'Emitir Ofício', setorId: 's1', macroprocessoId: 'm1', tipo: 'a_classificar', processoPaiId: null,
    anotacoes: null,
  })
})

test('a Data da modelagem piloto não faz parte dos dados do cadastro', () => {
  expect(dadosDoProcesso(CAMPOS)).not.toHaveProperty('dataDaModelagemPiloto')
})

test('o pai só sai no subprocesso', () => {
  expect(dadosDoProcesso({ ...CAMPOS, tipo: 'subprocesso', processoPaiId: 'p1' }).processoPaiId).toBe('p1')
  expect(dadosDoProcesso({ ...CAMPOS, tipo: 'processo', processoPaiId: 'p1' }).processoPaiId).toBeNull()
})

test('as Anotações saem como foram digitadas, e só espaços viram nulo', () => {
  expect(dadosDoProcesso({ ...CAMPOS, anotacoes: '  Combinado  ' }).anotacoes).toBe('  Combinado  ')
  expect(dadosDoProcesso({ ...CAMPOS, anotacoes: ' \n ' }).anotacoes).toBeNull()
})
