import { describe, expect, test } from 'vitest'
import { contraste } from '../testes/contraste'
import { CORES_NA_TELA, TODAS_AS_CORES, coresEmUso, corDoSetor, estiloDaCor, nomeDaAmostra } from './corDoSetor'

describe('corDoSetor', () => {
  test('a tela tem 12 cores distintas, numeradas de 1 a 12', () => {
    expect(TODAS_AS_CORES.map((cor) => cor.numero)).toEqual(Array.from({ length: CORES_NA_TELA }, (_, i) => i + 1))
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.hex)).size).toBe(12)
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.nome)).size).toBe(12)
  })

  test.each([0, 31, -1, 1.5, Number.NaN])('o número %s cai na cor 1', (numero) => {
    expect(corDoSetor(numero).numero).toBe(1)
  })

  test.each([[12, 12], [13, 1], [14, 2], [24, 12], [25, 1], [30, 6]])('o número %i do banco mostra a cor %i da tela (ciclo)', (banco, tela) => {
    expect(corDoSetor(banco).numero).toBe(tela)
  })

  test('a cor tem número, nome e código', () => {
    expect(corDoSetor(1)).toEqual({ numero: 1, nome: 'bordô', hex: '#881337' })
  })

  test.each(TODAS_AS_CORES.map((cor) => [cor.numero, cor.nome, cor.hex]))(
    'cor %i (%s): a sigla branca passa de 4,5:1 sobre a cor', (_numero, _nome, hex) => {
      expect(contraste('#ffffff', hex as string)).toBeGreaterThanOrEqual(4.5)
    })

  test('o estilo leva só a cor em variável CSS, já reduzida ao ciclo', () => {
    expect(estiloDaCor(7)).toEqual({ '--cor-do-setor': '#1D4ED8' })
    expect(estiloDaCor(19)).toEqual({ '--cor-do-setor': '#1D4ED8' })
  })

  test('o nome da amostra é o da cor, com "em uso por" quando outro setor a usa', () => {
    expect(nomeDaAmostra(7)).toBe('azul')
    expect(nomeDaAmostra(7, 'TSA')).toBe('azul, em uso por TSA')
  })

  test('as cores em uso guardam a primeira sigla em ordem, contando o ciclo (5 e 17 são a mesma cor)', () => {
    const emUso = coresEmUso([{ sigla: 'TSC', cor: 17 }, { sigla: 'TSA', cor: 5 }, { sigla: 'TSB', cor: 2 }])
    expect(emUso.get(5)).toBe('TSA')
    expect(emUso.get(2)).toBe('TSB')
    expect(emUso.has(1)).toBe(false)
  })
})
