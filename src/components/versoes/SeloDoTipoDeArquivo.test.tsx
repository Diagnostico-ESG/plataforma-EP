import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import css from './SeloDoTipoDeArquivo.css?raw'
import { SeloDoTipoDeArquivo } from './SeloDoTipoDeArquivo'

test('o formato vem em maiúsculas no selo e em minúsculas no data-formato, que escolhe a cor', () => {
  const { container } = render(<SeloDoTipoDeArquivo formato="BPMN" />)
  const selo = container.querySelector('.selo-do-tipo')
  expect(selo?.textContent).toBe('BPMN')
  expect(selo?.getAttribute('data-formato')).toBe('bpmn')
  expect(selo?.getAttribute('aria-hidden')).toBe('true')
})

test('as cores vêm dos tokens, um por tipo da identidade, e o resto fica na cor padrão', () => {
  for (const tipo of ['bpmn', 'png', 'docx', 'pdf', 'eml']) expect(css).toContain(`[data-formato='${tipo}'] { background: var(--tipo-${tipo}); }`)
  expect(css).not.toMatch(/#[0-9a-f]{3,6}\b/i)
})
