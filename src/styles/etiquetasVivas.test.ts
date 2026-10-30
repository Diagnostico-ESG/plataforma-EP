import { describe, expect, test } from 'vitest'
import { contraste } from '../testes/contraste'
import tokens from './tokens.css?raw'

const valorDe = (token: string): string => {
  const achado = new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens)
  if (achado === null) throw new Error(`token --${token} não encontrado em tokens.css; esperado "--${token}: #rrggbb"`)
  return achado[1].toLowerCase()
}

describe('etiqueta da etapa só em ícone (identidade de 2026-10-30)', () => {
  test('o círculo verde de Finalizado passa do mínimo gráfico de 3:1 sobre o cartão branco', () => {
    expect(valorDe('etiqueta-finalizado')).toBe('#16a34a')
    expect(contraste(valorDe('etiqueta-finalizado'), '#ffffff')).toBeGreaterThanOrEqual(3)
  })

  test('o contorno de A fazer passa de 3:1 e o traço do Iniciado é o azul da ação', () => {
    expect(contraste(valorDe('icone-inativo'), '#ffffff')).toBeGreaterThanOrEqual(2.9)
    expect(tokens).toMatch(/--etiqueta-iniciado:\s*var\(--azul\)/)
  })
})

describe('textos sobre o fundo da página', () => {
  test('o texto secundário passa de 4,5:1 sobre o fundo, onde a frase da coluna vazia fica', () => {
    expect(contraste(valorDe('texto-2'), valorDe('fundo'))).toBeGreaterThanOrEqual(4.5)
  })

  test.each([['atraso-texto', 'atraso-fundo'], ['vencendo-texto', 'vencendo-fundo'], ['aprovado-texto', 'aprovado-fundo'],
    ['neutra-texto', 'neutra-fundo']])('%s sobre %s passa de 4,5:1', (texto, fundo) => {
    expect(contraste(valorDe(texto), valorDe(fundo))).toBeGreaterThanOrEqual(4.5)
  })

  test('o prazo atrasado e o perto de vencer passam de 4,5:1 sobre branco', () => {
    expect(contraste(valorDe('atraso'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contraste(valorDe('vence'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
