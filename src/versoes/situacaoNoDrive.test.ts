import { expect, test } from 'vitest'
import { marcaDaSituacao } from './situacaoNoDrive'

test('a situação alterada e a não encontrada têm marca com texto', () => {
  expect(marcaDaSituacao('alterado')).toBe('Alterado fora da plataforma')
  expect(marcaDaSituacao('nao_encontrado')).toBe('Não encontrado no Drive')
})

test('arquivo conferido e sem situação não tem marca', () => {
  expect(marcaDaSituacao('ok')).toBeNull()
  expect(marcaDaSituacao(undefined)).toBeNull()
})
