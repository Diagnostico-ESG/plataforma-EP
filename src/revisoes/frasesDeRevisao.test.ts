import { expect, test } from 'vitest'
import {
  FRASE_DA_CORRIGIDA_SEM_VERSAO_NA_PASSAGEM, FRASE_DA_REVISAO_FORA_DA_ETAPA, FRASE_DA_REVISAO_JA_REGISTRADA,
  fraseDoProcessoComRevisoes, rotuloDoResultado,
} from './frasesDeRevisao'

test('as recusas de registrar a revisão dizem onde o processo precisa estar e o que fazer', () => {
  expect(FRASE_DA_REVISAO_FORA_DA_ETAPA).toBe('Registre a revisão com o processo na Revisão interna.')
  expect(FRASE_DA_REVISAO_JA_REGISTRADA).toBe('Já há uma revisão registrada nesta passagem pela Revisão interna; edite-a.')
  expect(FRASE_DA_CORRIGIDA_SEM_VERSAO_NA_PASSAGEM).toBe("Para 'corrigida', envie a versão corrigida com o processo na Revisão interna.")
})

test('a exclusão diz quantas revisões o processo tem', () => {
  expect(fraseDoProcessoComRevisoes('1')).toBe('Não é possível excluir: processo tem 1 revisão registrada. Cancele o processo em vez de excluí-lo.')
  expect(fraseDoProcessoComRevisoes(3)).toBe('Não é possível excluir: processo tem 3 revisões registradas. Cancele o processo em vez de excluí-lo.')
})

test('o resultado da corrigida cita a versão que ela gerou', () => {
  expect(rotuloDoResultado({ resultado: 'sem_alteracao', versaoCorrigida: null })).toBe('Sem alteração')
  expect(rotuloDoResultado({ resultado: 'corrigida', versaoCorrigida: 8 })).toBe('Corrigida, gerou a V8')
})
