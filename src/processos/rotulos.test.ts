import { expect, test } from 'vitest'
import { ETIQUETAS, ROTULO_DA_ETIQUETA, ROTULO_DA_SITUACAO } from './rotulos'

test('a etiqueta em_andamento se chama Iniciado; o valor guardado e a situação não mudam', () => {
  expect(ROTULO_DA_ETIQUETA).toEqual({ a_fazer: 'A fazer', em_andamento: 'Iniciado', concluido: 'Finalizado' })
  expect(ETIQUETAS).toEqual(['a_fazer', 'em_andamento', 'concluido'])
  expect(ROTULO_DA_SITUACAO.em_andamento).toBe('Em andamento')
})
