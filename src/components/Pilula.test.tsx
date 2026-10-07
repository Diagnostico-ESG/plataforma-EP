import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Pilula } from './Pilula'

afterEach(cleanup)

test('mostra o texto da situação com o estilo da situação', () => {
  render(<Pilula situacao="atraso">3d atraso</Pilula>)
  expect(screen.getByText('3d atraso').className).toContain('pilula-atraso')
})
