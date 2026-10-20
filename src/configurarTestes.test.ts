import { getConfig } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

// Regressão dos testes de interface instáveis (2026-10-20): com o padrão de 1 s, findBy* e waitFor
// desistiam antes da tabela carregar quando a máquina estava ocupada ("Unable to find role cell").
describe('espera dos testes de interface', () => {
  it('findBy e waitFor esperam pelo menos 5 s', () => {
    expect(getConfig().asyncUtilTimeout).toBeGreaterThanOrEqual(5000)
  })
})
