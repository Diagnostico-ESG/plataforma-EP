import { expect, test } from 'vitest'
import { linhasDoRelatorio } from './relatorio-tap.mjs'

test('extrai as linhas do pgTAP da exceção de relatório', () => {
  expect(linhasDoRelatorio('RESULTADO DOS TESTES\n1..2\nok 1 - a\nnot ok 2 - b')).toEqual(['1..2', 'ok 1 - a', 'not ok 2 - b'])
})

test('outro erro de SQL não é relatório', () => {
  expect(linhasDoRelatorio('relation "public.usuarios" does not exist')).toBeNull()
})
