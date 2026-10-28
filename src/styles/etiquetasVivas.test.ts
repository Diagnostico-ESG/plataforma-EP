import { describe, expect, test } from 'vitest'
import { contraste } from '../testes/contraste'
import tokens from './tokens.css?raw'

const valorDe = (token: string): string => {
  const achado = new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens)
  if (achado === null) throw new Error(`token --${token} não encontrado em tokens.css; esperado "--${token}: #rrggbb"`)
  return achado[1].toLowerCase()
}

describe('etiquetas vivas', () => {
  test.each([
    ['a-fazer', '#6a3fd9', '#ffffff', '#ffffff'],
    ['em-andamento', '#ffc27a', '#5e2c00', '#c85f00'],
    ['concluido', '#9ee0b4', '#0d4a22', '#178a3e'],
  ])('%s: fundo, texto e bolinha da identidade, com texto AA sobre o fundo', (valor, fundo, texto, bolinha) => {
    expect(valorDe(`etiqueta-${valor}-fundo`)).toBe(fundo)
    expect(valorDe(`etiqueta-${valor}-texto`)).toBe(texto)
    expect(valorDe(`etiqueta-${valor}-bolinha`)).toBe(bolinha)
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5)
  })

  test('A fazer é a etiqueta de maior destaque: a de maior contraste com o cartão branco', () => {
    const contrasteComBranco = (valor: string) => contraste(valorDe(`etiqueta-${valor}-fundo`), '#ffffff')
    expect(contrasteComBranco('a-fazer')).toBeGreaterThan(contrasteComBranco('em-andamento'))
    expect(contrasteComBranco('a-fazer')).toBeGreaterThan(contrasteComBranco('concluido'))
  })
})

describe('barra da etapa', () => {
  test('o degradê vai do azul claro ao azul escuro da identidade', () => {
    expect(valorDe('barra-etapa-inicio')).toBe('#c9d3ff')
    expect(valorDe('barra-etapa-fim')).toBe('#2238c8')
  })
})
