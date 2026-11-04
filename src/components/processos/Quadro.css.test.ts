import { describe, expect, test } from 'vitest'
import quadroBruto from './Quadro.css?raw'

// Sem comentários: o texto "position: relative" dentro de um comentário não pode valer como a declaração.
const quadro = quadroBruto.replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * Regressão (2026-11-04): numa coluna do Quadro com muitos cartões, rolar com a roda até o fim da coluna fazia a página inteira
 * rolar e sobrava um espaço vazio embaixo. Cada cartão leva um texto `.visualmente-oculto` (position: absolute, sem pai
 * posicionado); o pai de uma regra absoluta é quem recorta, então o texto escapava da coluna que rola e alongava a página.
 * O jsdom não calcula altura nem rolagem, por isso o teste confere a regra de CSS que segura o texto dentro da coluna.
 */
const regraDe = (seletor: string): string => {
  const regra = new RegExp(`(?:^|\\})\\s*${seletor.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`, 'm').exec(quadro)
  return regra?.[1] ?? ''
}

describe('Quadro.css: o texto oculto dos cartões fica preso à área que rola', () => {
  test.each(['.coluna-cartoes', '.quadro-colunas'])('%s é o pai posicionado dos textos absolutos (position: relative)', (seletor) => {
    const corpo = regraDe(seletor)
    expect(corpo, `regra de ${seletor} recebida: "${corpo}"; esperado conter "position: relative"`).toMatch(/position:\s*relative/)
  })
})

describe('Quadro.css: o cartão parado não tem borda vermelha (ADR 0042)', () => {
  test('nenhuma regra muda a borda de .cartao-parado', () => {
    expect(quadro, 'recebido CSS com .cartao-parado; esperado nenhuma regra para essa classe').not.toMatch(/cartao-parado/)
  })
})

describe('Quadro.css: a coluna é uma faixa de fundo, e o título não tem plaqueta (ADR 0042)', () => {
  test('.coluna tem o fundo da faixa e o recuo lateral igual ao dos cartões', () => {
    const corpo = regraDe('.coluna')
    expect(corpo, `regra de .coluna recebida: "${corpo}"; esperado conter "background: var(--fundo-faixa)"`).toMatch(/background:\s*var\(--fundo-faixa\)/)
  })

  test('o texto do título não tem borda nem fundo próprios', () => {
    const corpo = regraDe('.coluna-titulo-texto')
    expect(corpo, `regra de .coluna-titulo-texto recebida: "${corpo}"; esperado sem border nem background`).not.toMatch(/border|background/)
  })
})
