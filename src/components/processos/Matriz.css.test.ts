import { describe, expect, test } from 'vitest'
import matriz from './Matriz.css?raw'

/**
 * Regressão (2026-11-03): `.quadro-matriz` e `.quadro-colunas` tinham a mesma força, e o `Quadro.css` (display: flex,
 * overflow-y: hidden) é carregado depois do `Matriz.css`; no app a grade virava fila e as Linhas saíam quebradas. O jsdom não
 * monta a cascata de dois arquivos, então o teste confere que a grade se apoia nas duas classes e vence em qualquer ordem.
 */
describe('Matriz.css: a grade das Linhas vence o .quadro-colunas em qualquer ordem de carregamento', () => {
  const regraDaGrade = /([^{}]*)\{[^}]*display:\s*grid[^}]*\}/.exec(matriz)

  test('a regra com display: grid existe', () => {
    expect(regraDaGrade).not.toBeNull()
  })

  test('o seletor da grade traz .quadro-colunas e .quadro-matriz juntos (mais forte que .quadro-colunas sozinho)', () => {
    const seletor = (regraDaGrade?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
    expect(seletor, `seletor recebido: "${seletor}"; esperado ".quadro-colunas.quadro-matriz"`)
      .toMatch(/\.quadro-colunas\.quadro-matriz|\.quadro-matriz\.quadro-colunas/)
  })
})
