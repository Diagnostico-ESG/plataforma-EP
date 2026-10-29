import { expect, test } from 'vitest'
import { iconeDoArquivo } from './iconeDoArquivo'

test('cada formato do fluxo e do relatório tem ícone próprio', () => {
  const icones = ['docx', 'bpmn', 'bpm', 'png'].map(iconeDoArquivo)
  expect(new Set(icones).size).toBe(4)
  expect(icones).not.toContain('arquivo')
})

test('qualquer outro formato usa o ícone genérico, sem diferenciar maiúsculas', () => {
  expect(iconeDoArquivo('pdf')).toBe('arquivo')
  expect(iconeDoArquivo('eml')).toBe('arquivo')
  expect(iconeDoArquivo('PNG')).toBe(iconeDoArquivo('png'))
})
