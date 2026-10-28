import { describe, expect, test } from 'vitest'
import { contraste } from '../testes/contraste'
import tokens from './tokens.css?raw'

const valorDe = (token: string): string => {
  const achado = new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens)
  if (achado === null) throw new Error(`token --${token} não encontrado em tokens.css; esperado "--${token}: #rrggbb"`)
  return achado[1].toLowerCase()
}

describe('etiquetas fortes (ADR 0031)', () => {
  test.each([
    ['a-fazer', '#be185d'],
    ['concluido', '#0f766e'],
  ])('%s: fundo forte da identidade, texto e bolinha brancos, com texto AA sobre o fundo', (valor, fundo) => {
    expect(valorDe(`etiqueta-${valor}-fundo`)).toBe(fundo)
    expect(valorDe(`etiqueta-${valor}-texto`)).toBe('#ffffff')
    expect(valorDe(`etiqueta-${valor}-bolinha`)).toBe('#ffffff')
    expect(contraste('#ffffff', fundo)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('etiqueta Em andamento em âmbar cheio (ADR 0032)', () => {
  test('fundo âmbar, texto e bolinha marrom-escuros com texto AA sobre o fundo', () => {
    expect(valorDe('etiqueta-em-andamento-fundo')).toBe('#f59e0b')
    expect(valorDe('etiqueta-em-andamento-texto')).toBe('#451a03')
    expect(valorDe('etiqueta-em-andamento-bolinha')).toBe('#451a03')
    expect(contraste('#451a03', '#f59e0b')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('frase da coluna vazia (ADR 0032)', () => {
  test('o texto secundário passa de 4,5:1 sobre o fundo da página, onde a frase fica', () => {
    expect(contraste(valorDe('texto-2'), valorDe('fundo'))).toBeGreaterThanOrEqual(4.5)
  })
})

describe('barra da etapa', () => {
  test('o degradê vai do azul claro ao azul escuro da identidade', () => {
    expect(valorDe('barra-etapa-inicio')).toBe('#c9d3ff')
    expect(valorDe('barra-etapa-fim')).toBe('#2238c8')
  })
})
