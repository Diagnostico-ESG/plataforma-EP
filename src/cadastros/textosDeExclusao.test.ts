import { describe, expect, test } from 'vitest'
import { textoDaExclusaoDoMacroprocesso, textoDaExclusaoDoSetor } from './textosDeExclusao'

const FRASE_FINAL = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

describe('texto da janela de exclusão do setor', () => {
  test('com vários macroprocessos diz quantos', () => {
    expect(textoDaExclusaoDoSetor('CEE', 3)).toBe(`CEE sai de 3 macroprocessos. ${FRASE_FINAL}`)
  })

  test('com um macroprocesso usa o singular', () => {
    expect(textoDaExclusaoDoSetor('CEE', 1)).toBe(`CEE sai de 1 macroprocesso. ${FRASE_FINAL}`)
  })

  test('sem macroprocessos começa pelo histórico', () => {
    expect(textoDaExclusaoDoSetor('CEE', 0)).toBe(FRASE_FINAL)
  })
})

describe('texto da janela de exclusão do macroprocesso', () => {
  test('com vários setores diz quantos', () => {
    expect(textoDaExclusaoDoMacroprocesso(2)).toBe(`2 setores deixam de estar envolvidos nele. ${FRASE_FINAL}`)
  })

  test('com um setor usa o singular', () => {
    expect(textoDaExclusaoDoMacroprocesso(1)).toBe(`1 setor deixa de estar envolvido nele. ${FRASE_FINAL}`)
  })

  test('sem setores começa pelo histórico', () => {
    expect(textoDaExclusaoDoMacroprocesso(0)).toBe(FRASE_FINAL)
  })
})
