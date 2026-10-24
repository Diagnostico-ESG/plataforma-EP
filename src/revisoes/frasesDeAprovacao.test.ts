import { expect, test } from 'vitest'
import {
  fraseDaAprovacaoAntesDaRevisao, fraseDaVersaoAprovada, fraseDaVersaoSemAprovacao,
} from './frasesDeAprovacao'

test('a data antes da última revisão cita as duas datas como a tela as mostra', () => {
  expect(fraseDaAprovacaoAntesDaRevisao('2026-10-12:2026-10-13')).toBe(
    'A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).')
})

test('a versão sem aprovação manda concluir pela janela', () => {
  expect(fraseDaVersaoSemAprovacao(8)).toBe('A V8 ainda não tem aprovação registrada. Conclua a Aprovação pelo setor pela janela de concluir.')
})

test('a versão aprovada aceita o número puro (do banco) e a mensagem inteira da função do Drive', () => {
  const frase = 'A versão V8 foi aprovada e seus arquivos não podem ser substituídos.'
  expect(fraseDaVersaoAprovada('8')).toBe(frase)
  expect(fraseDaVersaoAprovada('A versão está aprovada: seus arquivos não podem ser substituídos. (8)')).toBe(frase)
})

test('o aviso da volta cita a versão aprovada', () => {
})
