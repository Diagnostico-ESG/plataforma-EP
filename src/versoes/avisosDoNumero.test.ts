import { describe, expect, test } from 'vitest'
import { versaoDeTeste } from '../testes/versoesDeTeste'
import { avisosDoNumero } from './avisosDoNumero'

const historica = (numero: number) => versaoDeTeste(numero, { historica: true })
const piloto = (numero: number) => versaoDeTeste(numero, { piloto: true })
const sequencia = (numero: number, aprovada = false) => versaoDeTeste(numero, aprovada ? { aprovada } : {})

describe('ordem dos tipos (histórica → piloto → em sequência)', () => {
  test('a histórica que passa de uma piloto fica depois dela', () => {
    const versoes = [historica(2), piloto(4)]
    expect(avisosDoNumero(versoes, versoes[0], 5)).toEqual(['A V5F ficará depois da V4P.'])
  })

  test('a piloto que passa de uma em sequência fica depois dela', () => {
    const versoes = [piloto(3), sequencia(4)]
    expect(avisosDoNumero(versoes, versoes[0], 6)).toEqual(['A V6P ficará depois da V4.'])
  })

  test('a em sequência que fica antes de uma piloto fica antes dela', () => {
    const versoes = [piloto(3), sequencia(4)]
    expect(avisosDoNumero(versoes, versoes[1], 2)).toEqual(['A V2 ficará antes da V3P.'])
  })

  test('o aviso aponta a versão mais próxima do número novo', () => {
    const versoes = [historica(1), piloto(2), sequencia(3), sequencia(4)]
    expect(avisosDoNumero(versoes, versoes[0], 6)).toEqual(['A V6F ficará depois da V4.'])
  })

  test('históricas e pilotos têm saltos entre si sem aviso', () => {
    const historicas = [historica(1), historica(2), piloto(10)]
    expect(avisosDoNumero(historicas, historicas[1], 8)).toEqual([])
    const pilotos = [historica(1), piloto(3), sequencia(9)]
    expect(avisosDoNumero(pilotos, pilotos[1], 6)).toEqual([])
  })
})

describe('versão em sequência sem a anterior logo antes', () => {
  test('avisa o salto', () => {
    const versoes = [sequencia(7), sequencia(8)]
    expect(avisosDoNumero(versoes, versoes[1], 9)).toEqual(['A V9 ficará depois da V7, sem a V8.'])
  })

  test('sem aviso quando a anterior está logo antes, de qualquer tipo', () => {
    const versoes = [piloto(6), sequencia(9)]
    expect(avisosDoNumero(versoes, versoes[1], 7)).toEqual([])
  })

  test('sem aviso quando não há versão antes dela', () => {
    const versoes = [sequencia(3), sequencia(4)]
    expect(avisosDoNumero(versoes, versoes[1], 1)).toEqual([])
  })

  test('a histórica e a piloto não ganham aviso de salto', () => {
    const versoes = [historica(1), piloto(2)]
    expect(avisosDoNumero(versoes, versoes[1], 9)).toEqual([])
  })
})

describe('versão aprovada', () => {
  test('lembra que o E-protocolo cita o número antigo', () => {
    const versoes = [sequencia(5), sequencia(7, true)]
    expect(avisosDoNumero(versoes, versoes[1], 6)).toEqual(['A V7 foi aprovada, e o E-protocolo cita esse número.'])
  })

  test('versão que não é a aprovada não ganha o aviso', () => {
    const versoes = [sequencia(6), sequencia(7, true)]
    expect(avisosDoNumero(versoes, versoes[0], 5)).toEqual([])
  })
})

test('os avisos aparecem juntos', () => {
  const versoes = [piloto(3), sequencia(4, true)]
  expect(avisosDoNumero(versoes, versoes[1], 2)).toEqual(['A V2 ficará antes da V3P.', 'A V4 foi aprovada, e o E-protocolo cita esse número.'])
  const juntos = [sequencia(7), piloto(8), sequencia(9, true)]
  expect(avisosDoNumero(juntos, juntos[2], 12)).toEqual([
    'A V12 ficará depois da V8P, sem a V11.', 'A V9 foi aprovada, e o E-protocolo cita esse número.',
  ])
})
