import { describe, expect, test } from 'vitest'
import { contraste } from '../testes/contraste'
import tokens from './tokens.css?raw'

const valorDe = (token: string): string => {
  const achado = new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokens)
  if (achado === null) throw new Error(`token --${token} não encontrado em tokens.css; esperado "--${token}: #rrggbb"`)
  return achado[1].toLowerCase()
}

describe('Status da etapa só em ícone (ADR 0040)', () => {
  test.each(['etiqueta-a-fazer', 'etiqueta-iniciado', 'etiqueta-finalizado'])('--%s é o quase preto do texto: só a forma distingue', (token) => {
    expect(tokens).toMatch(new RegExp(`--${token}:\\s*var\\(--texto\\);`))
  })

  test('o texto passa do mínimo gráfico de 3:1 sobre o cartão branco', () => {
    expect(contraste(valorDe('texto'), '#ffffff')).toBeGreaterThanOrEqual(3)
  })
})

describe('textos sobre o fundo da página', () => {
  test('o texto secundário passa de 4,5:1 sobre o fundo, onde a frase da coluna vazia fica', () => {
    expect(contraste(valorDe('texto-2'), valorDe('fundo'))).toBeGreaterThanOrEqual(4.5)
  })

  test.each([['atraso-texto', 'atraso-fundo'], ['vencendo-texto', 'vencendo-fundo'], ['aprovado-texto', 'aprovado-fundo'],
    ['neutra-texto', 'neutra-fundo'], ['azul-escuro', 'azul-claro']])('%s sobre %s passa de 4,5:1', (texto, fundo) => {
    expect(contraste(valorDe(texto), valorDe(fundo))).toBeGreaterThanOrEqual(4.5)
  })

  test('o prazo atrasado e o perto de vencer passam de 4,5:1 sobre branco', () => {
    expect(contraste(valorDe('atraso'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contraste(valorDe('vence'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('selo do setor (ADR 0040)', () => {
  test('não há mais cor única do selo: cada setor traz a sua (o contraste das 12 está em corDoSetor.test.ts)', () => {
    expect(tokens).not.toMatch(/--selo-do-setor:/)
  })
})

describe('selo do tipo de arquivo', () => {
  test.each(['bpmn', 'png', 'bpm', 'docx', 'pdf', 'eml'])('o branco sobre a cor do %s passa de 4,5:1 (texto de 9px)', (tipo) => {
    expect(contraste(valorDe(`tipo-${tipo}`), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
