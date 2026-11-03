import { describe, expect, test } from 'vitest'
import { fraseDoProcessoParado } from './frasesDeSituacao'
import { FRASE_DA_ETIQUETA_FIXA, FRASE_DA_PASSAGEM_FECHADA, fraseDaEtiquetaInexistente } from './frasesDoMovimento'

// O que a tela diz se chama Status (ADR 0039); "etiqueta" é só nome de código e do valor guardado.
describe('as frases que a pessoa lê dizem Status, nunca etiqueta', () => {
  test.each([
    ['status fixo em Concluídos', FRASE_DA_ETIQUETA_FIXA],
    ['status inexistente', fraseDaEtiquetaInexistente('x')],
    ['passagem fechada', FRASE_DA_PASSAGEM_FECHADA],
    ['processo parado', fraseDoProcessoParado('cancelado')],
  ])('%s', (_nome, frase) => {
    expect(frase.toLowerCase()).not.toContain('etiqueta')
  })
})
