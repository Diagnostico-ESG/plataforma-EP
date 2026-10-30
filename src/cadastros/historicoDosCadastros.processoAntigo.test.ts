import { expect, test } from 'vitest'
import { descreverEstadoDoCadastro } from './historicoDosCadastros'

// Eventos de antes da migração que tirou a Origem, o Contexto e as Observações do processo guardam as três no estado.
test('processo antigo: Origem, Contexto e Observações continuam com nome legível', () => {
  expect(descreverEstadoDoCadastro({
    nome: 'Emitir Ofício', origem: 'retomado', situacao: 'em_andamento', contexto: 'Texto antigo', observacoes: null,
  })).toBe('Nome: Emitir Ofício; Origem: Retomado; Situação: Em andamento; Contexto: Texto antigo; Observações: —')
})
