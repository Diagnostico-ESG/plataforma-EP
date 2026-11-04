import { describe, expect, test } from 'vitest'
import quadro from './Quadro.css?raw'

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
