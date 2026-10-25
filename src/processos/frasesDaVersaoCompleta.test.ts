import { describe, expect, it } from 'vitest'
import { faltasDaVersao, fraseDaVersaoIncompleta } from './frasesDaVersaoCompleta'

describe('frasesDaVersaoCompleta', () => {
  it('lista o que falta na ordem .bpm, .png e relatório; o .bpmn não é exigido', () => {
    expect(faltasDaVersao(['relatorio', 'bpmn'])).toEqual(['bpm', 'png'])
    expect(faltasDaVersao(['png', 'bpmn', 'relatorio'])).toEqual(['bpm'])
    expect(faltasDaVersao(['bpm', 'png', 'relatorio'])).toEqual([])
  })

  it('escreve a frase com um, dois ou três itens', () => {
    expect(fraseDaVersaoIncompleta(8, ['relatorio'])).toBe('A V8 está sem relatório.')
    expect(fraseDaVersaoIncompleta('8', ['png', 'relatorio'])).toBe('A V8 está sem .png e relatório.')
    expect(fraseDaVersaoIncompleta(8, ['bpm', 'png', 'relatorio'])).toBe('A V8 está sem .bpm, .png e relatório.')
    expect(fraseDaVersaoIncompleta(8, ['bpm', 'relatorio'])).toBe('A V8 está sem .bpm e relatório.')
  })

})
