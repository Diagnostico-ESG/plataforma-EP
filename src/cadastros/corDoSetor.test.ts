import { describe, expect, test } from 'vitest'
import { TODAS_AS_CORES, coresEmUso, corDoSetor, estiloDaCor, nomeDaAmostra } from './corDoSetor'

const TEXTO = '#1E2433'

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (maior + 0.05) / (menor + 0.05)
}

describe('corDoSetor', () => {
  test('a paleta tem 30 cores distintas, numeradas de 1 a 30', () => {
    expect(TODAS_AS_CORES.map((cor) => cor.numero)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.claro)).size).toBe(30)
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.nome)).size).toBe(30)
  })

  test.each([0, 31, -1, 1.5, Number.NaN])('o número %s cai na cor 1', (numero) => {
    expect(corDoSetor(numero).numero).toBe(1)
  })

  test('o tom escuro é cada canal do claro vezes 0,88, arredondado', () => {
    expect(corDoSetor(1)).toMatchObject({ nome: 'coral claro', claro: '#F8C4C4', escuro: '#DAACAC' })
  })

  test.each(TODAS_AS_CORES.map((cor) => [cor.numero, cor.nome, cor.claro, cor.escuro]))(
    'cor %i (%s): o texto escuro passa de 4,5:1 nas duas pontas', (_numero, _nome, claro, escuro) => {
      expect(contraste(TEXTO, claro as string)).toBeGreaterThanOrEqual(4.5)
      expect(contraste(TEXTO, escuro as string)).toBeGreaterThanOrEqual(4.5)
    })

  // A coluna do Quadro por setor mistura 30% do tom claro com a folha branca; a frase da coluna vazia é texto-2 sobre esse fundo.
  test.each(TODAS_AS_CORES.map((cor) => [cor.numero, cor.nome, cor.claro]))(
    'cor %i (%s): a frase da coluna vazia (texto-2) passa de 4,5:1 sobre o fundo tingido', (_numero, _nome, claro) => {
      const canais = [1, 3, 5].map((i) => Math.round(parseInt((claro as string).slice(i, i + 2), 16) * 0.3 + 255 * 0.7))
      const fundo = `#${canais.map((c) => c.toString(16).padStart(2, '0')).join('')}`
      expect(contraste('#5D6577', fundo)).toBeGreaterThanOrEqual(4.5)
    })

  test('o estilo leva os dois tons em variáveis CSS', () => {
    expect(estiloDaCor(13)).toEqual({ '--cor-claro': '#C4D9F8', '--cor-escuro': corDoSetor(13).escuro })
  })

  test('o nome da amostra é o da cor, com "em uso por" quando outro setor a usa', () => {
    expect(nomeDaAmostra(13)).toBe('azul claro')
    expect(nomeDaAmostra(13, 'TSA')).toBe('azul claro, em uso por TSA')
  })

  test('as cores em uso guardam a primeira sigla em ordem, quando mais de um setor usa a cor', () => {
    const emUso = coresEmUso([{ sigla: 'TSC', cor: 5 }, { sigla: 'TSA', cor: 5 }, { sigla: 'TSB', cor: 2 }])
    expect(emUso.get(5)).toBe('TSA')
    expect(emUso.get(2)).toBe('TSB')
    expect(emUso.has(1)).toBe(false)
  })
})
