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

  // Regressão (2026-11-03): as células têm min-height: 0 e o quadro tem altura limitada; sem isto o navegador encolhia as linhas
  // da grade para caber, todas com a mesma altura, e os cartões transbordavam para a linha de baixo.
  test('as linhas da grade crescem com os cartões (grid-auto-rows: max-content), sem encolher para caber no quadro', () => {
    const regra = regraDaGrade?.[0] ?? ''
    expect(regra, `regra da grade recebida: "${regra}"; esperado conter "grid-auto-rows: max-content"`)
      .toMatch(/grid-auto-rows:\s*max-content/)
  })
})
