import { expect, test } from 'vitest'
import { fraseDaVersaoSemRevisao, fraseDoProcessoComRevisoes, fraseDoRevisorQueEAutor, rotuloDoResultado } from './frasesDeRevisao'

test('a frase do autor cita a versão', () => {
  expect(fraseDoRevisorQueEAutor(7)).toBe('Quem enviou a versão V7 não pode revisá-la.')
  expect(fraseDoRevisorQueEAutor('2')).toBe('Quem enviou a versão V2 não pode revisá-la.')
})

test('a frase da versão sem revisão manda concluir pela janela', () => {
  expect(fraseDaVersaoSemRevisao(8)).toBe('A V8 ainda não tem revisão registrada. Conclua a Revisão interna pela janela de concluir.')
})

test('a exclusão diz quantas revisões o processo tem', () => {
  expect(fraseDoProcessoComRevisoes('1')).toBe('Não é possível excluir: processo tem 1 revisão registrada. Cancele o processo em vez de excluí-lo.')
  expect(fraseDoProcessoComRevisoes(3)).toBe('Não é possível excluir: processo tem 3 revisões registradas. Cancele o processo em vez de excluí-lo.')
})

test('o resultado da corrigida cita a versão que ela gerou', () => {
  expect(rotuloDoResultado({ resultado: 'sem_alteracao', versaoCorrigida: null })).toBe('Sem alteração')
  expect(rotuloDoResultado({ resultado: 'corrigida', versaoCorrigida: 8 })).toBe('Corrigida, gerou a V8')
})
