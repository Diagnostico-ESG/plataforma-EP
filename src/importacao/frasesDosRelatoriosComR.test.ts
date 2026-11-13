import { expect, test } from 'vitest'
import { fraseDasFalhas, fraseDoFim, fraseDosForaDoPadrao, fraseDosRelatoriosComV } from './frasesDosRelatoriosComR'

test('a contagem dos relatórios com V concorda com o número', () => {
  expect(fraseDosRelatoriosComV(1))
    .toBe('1 relatório ainda tem V no nome do arquivo (Relatório V2). Renomear troca só a letra, no Drive e na plataforma.')
  expect(fraseDosRelatoriosComV(140))
    .toBe('140 relatórios ainda têm V no nome do arquivo (Relatório V2). Renomear troca só a letra, no Drive e na plataforma.')
})

test('os fora do padrão ficam como estão', () => {
  expect(fraseDosForaDoPadrao(1)).toBe('1 relatório com nome fora do padrão fica como está.')
  expect(fraseDosForaDoPadrao(4)).toBe('4 relatórios com nome fora do padrão ficam como estão.')
})

test('o fim diz quantos foram renomeados', () => {
  expect(fraseDoFim(1)).toBe('1 relatório renomeado.')
  expect(fraseDoFim(140)).toBe('140 relatórios renomeados.')
})

test('as falhas pedem para tentar de novo', () => {
  expect(fraseDasFalhas(1)).toBe('1 não foi renomeado. Tente de novo para continuar os que faltam.')
  expect(fraseDasFalhas(3)).toBe('3 não foram renomeados. Tente de novo para continuar os que faltam.')
})
