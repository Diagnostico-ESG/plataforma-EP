import { describe, expect, it } from 'vitest'
import { FRASE_SEM_VERSAO, faltasDaVersao, fraseDaVersaoIncompleta, fraseDoBloqueioDaConclusao } from './frasesDaVersaoCompleta'

describe('frasesDaVersaoCompleta', () => {
  it('lista o que falta na ordem .bpmn, .png e relatório', () => {
    expect(faltasDaVersao(['relatorio', 'bpm'])).toEqual(['bpmn', 'png'])
    expect(faltasDaVersao(['bpmn', 'png', 'relatorio'])).toEqual([])
  })

  it('escreve a frase com um, dois ou três itens', () => {
    expect(fraseDaVersaoIncompleta(8, ['relatorio'])).toBe('A V8 está sem relatório.')
    expect(fraseDaVersaoIncompleta('8', ['png', 'relatorio'])).toBe('A V8 está sem .png e relatório.')
    expect(fraseDaVersaoIncompleta(8, ['bpmn', 'png', 'relatorio'])).toBe('A V8 está sem .bpmn, .png e relatório.')
  })

  it('sem versão, a frase manda enviar uma; com versão completa, não há bloqueio', () => {
    expect(fraseDoBloqueioDaConclusao(null)).toBe(FRASE_SEM_VERSAO)
    expect(fraseDoBloqueioDaConclusao({ numero: 3, autorId: 'u', autorNome: 'Ana', papeis: ['bpmn', 'png', 'relatorio'] })).toBeNull()
    expect(fraseDoBloqueioDaConclusao({ numero: 3, autorId: 'u', autorNome: 'Ana', papeis: ['bpmn', 'png'] })).toBe('A V3 está sem relatório.')
  })
})
