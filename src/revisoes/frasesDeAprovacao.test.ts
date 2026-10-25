import { expect, test } from 'vitest'
import { FRASE_DA_APROVACAO_FORA_DA_ETAPA, fraseDaVersaoAprovada } from './frasesDeAprovacao'

test('a aprovação fora da etapa diz onde o processo precisa estar', () => {
  expect(FRASE_DA_APROVACAO_FORA_DA_ETAPA).toBe('Registre a aprovação com o processo na Aprovação pelo setor.')
})

test('a versão aprovada aceita o número puro (do banco) e a mensagem inteira da função do Drive', () => {
  const frase = 'A versão V8 foi aprovada e seus arquivos não podem ser substituídos.'
  expect(fraseDaVersaoAprovada('8')).toBe(frase)
  expect(fraseDaVersaoAprovada('A versão está aprovada: seus arquivos não podem ser substituídos. (8)')).toBe(frase)
})
